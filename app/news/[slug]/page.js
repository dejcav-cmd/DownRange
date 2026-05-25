import { notFound }        from 'next/navigation'
import Masthead            from '../../../components/layout/Masthead'
import Footer              from '../../../components/layout/Footer'
import BreakingTicker      from '../../../components/layout/BreakingTicker'
import NewsCard            from '../../../components/ui/NewsCard'
import { getArticleBySlug, getRecentArticles, fetchBreakingAlerts, resolveImage } from '../../../sanity/lib/client'

export const revalidate = 300

export async function generateMetadata({ params }) {
  const article = await getArticleBySlug(params.slug).catch(() => null)
  if (!article) return { title: 'Article Not Found | DownRange' }
  const img = resolveImage(article)
  return {
    title:       `${article.title} | DownRange`,
    description: article.summary || article.excerpt || article.title,
    openGraph: {
      title:       article.title,
      description: article.summary || article.excerpt,
      images:      img ? [{ url: img, width: 1200, height: 630, alt: article.imageAlt || article.title }] : [],
    },
    twitter: {
      card:        'summary_large_image',
      title:       article.title,
      description: article.summary || article.excerpt,
      images:      img ? [img] : [],
    }
  }
}

const CAT_STYLE = {
  breaking: { label: 'BREAKING',  color: '#EF4444', bg: '#2a0000' },
  law:      { label: 'LAW',       color: '#60A5FA', bg: '#001a2a' },
  industry: { label: 'INDUSTRY',  color: '#C8922A', bg: '#1a1000' },
  news:     { label: 'NEWS',      color: '#9CA3AF', bg: '#1a1f2e' },
  opinion:  { label: 'OPINION',   color: '#C084FC', bg: '#1a0a2a' },
  training: { label: 'TRAINING',  color: '#34D399', bg: '#001a0a' },
  review:   { label: 'REVIEW',    color: '#C8922A', bg: '#1a1000' },
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export default async function ArticlePage({ params }) {
  const [article, related, alerts] = await Promise.all([
    getArticleBySlug(params.slug).catch(() => null),
    getRecentArticles(8).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  if (!article) notFound()

  const cat      = CAT_STYLE[article.category] || CAT_STYLE.news
  const imageUrl = resolveImage(article)
  const imageAlt = article.imageAlt || article.heroImage?.alt || article.title

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <main style={{ background: '#0A0B0C', minHeight: '100vh' }}>

        {/* ── HERO IMAGE ── */}
        {imageUrl && (
          <div style={{ width: '100%', height: 'clamp(280px, 45vw, 520px)', overflow: 'hidden', position: 'relative' }}>
            <img
              src={imageUrl}
              alt={imageAlt}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* bottom fade */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(0deg, #0A0B0C 0%, transparent 100%)' }} />
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{ background: imageUrl ? 'transparent' : 'linear-gradient(180deg, #111318 0%, #0A0B0C 100%)', borderBottom: '1px solid #1F2428', marginTop: imageUrl ? '-80px' : 0, position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.72rem', fontFamily: 'monospace' }}>
              <a href="/"     style={{ color: '#4B5563', textDecoration: 'none' }}>HOME</a>
              <span style={{ color: '#2D3748' }}>›</span>
              <a href="/news" style={{ color: '#4B5563', textDecoration: 'none' }}>NEWS</a>
              <span style={{ color: '#2D3748' }}>›</span>
              <span style={{ color: '#C8922A' }}>{cat.label}</span>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ background: cat.bg, color: cat.color, padding: '3px 10px', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${cat.color}40`, letterSpacing: '0.1em' }}>
                {cat.label}
              </span>
              {article.urgencyScore >= 8 && (
                <span style={{ background: '#2a0000', color: '#EF4444', padding: '3px 10px', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, border: '1px solid #EF444440', letterSpacing: '0.1em' }}>
                  ⚡ BREAKING · {article.urgencyScore}/10
                </span>
              )}
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.05, color: '#F5F5F3', letterSpacing: '0.02em', marginBottom: '1.25rem' }}>
              {article.title}
            </h1>

            {/* Summary lede */}
            {(article.summary || article.excerpt) && (
              <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#94A3B8', marginBottom: '1.5rem', borderLeft: '3px solid #C8922A', paddingLeft: '1rem', maxWidth: 700 }}>
                {article.summary || article.excerpt}
              </p>
            )}

            {/* Meta */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.78rem', color: '#4B5563', fontFamily: 'monospace' }}>
              <span>{article.source || article.author?.name || 'DownRange Staff'}</span>
              <span style={{ color: '#2D3748' }}>|</span>
              <span>{formatDate(article.publishedAt)}</span>
              <span style={{ color: '#2D3748' }}>|</span>
              <span style={{ color: '#C8922A' }}>{timeAgo(article.publishedAt)}</span>
              {article.externalUrl && (
                <>
                  <span style={{ color: '#2D3748' }}>|</span>
                  <a href={article.externalUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.72rem' }}>
                    ORIGINAL SOURCE ↗
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY + SIDEBAR ── */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2.5rem' }}>

          {/* Main */}
          <div>
            {article.body ? (
              <div style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#D1D5DB', fontFamily: "'IBM Plex Sans', Arial, sans-serif" }}
                dangerouslySetInnerHTML={{ __html: article.body }} />
            ) : (
              <div style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#D1D5DB' }}>
                <p>{article.summary || article.excerpt}</p>
                {article.externalUrl && (
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#111318', border: '1px solid #1F2428' }}>
                    <p style={{ color: '#6B7280', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                      Full article published by {article.source || 'an external source'}.
                    </p>
                    <a href={article.externalUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-block', background: '#C8922A', color: '#000', padding: '0.65rem 1.5rem', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.05em' }}>
                      READ FULL ARTICLE ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {article.tags?.length > 0 && (
              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #1F2428' }}>
                <div style={{ fontSize: '0.68rem', color: '#4B5563', marginBottom: '0.5rem', fontFamily: 'monospace', letterSpacing: '0.1em' }}>TAGS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {article.tags.map(tag => (
                    <span key={tag} style={{ background: '#111318', color: '#6B7280', padding: '3px 8px', fontFamily: 'monospace', fontSize: '0.68rem', border: '1px solid #1F2428' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1F2428', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#4B5563', fontFamily: 'monospace', letterSpacing: '0.1em' }}>SHARE:</span>
              {[
                { label: 'X / TWITTER', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent('https://downrangeco.com/news/' + params.slug)}` },
                { label: 'FACEBOOK',    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://downrangeco.com/news/' + params.slug)}` },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#4B5563', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.68rem', padding: '4px 8px', border: '1px solid #1F2428', transition: 'color 0.2s, border-color 0.2s' }}
                  onMouseEnter={e => { e.target.style.color = '#C8922A'; e.target.style.borderColor = '#C8922A' }}
                  onMouseLeave={e => { e.target.style.color = '#4B5563'; e.target.style.borderColor = '#1F2428' }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Related stories */}
            <div style={{ background: '#111318', border: '1px solid #1F2428', padding: '1.25rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '1rem', fontWeight: 700 }}>MORE STORIES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {related.filter(a => a.slug?.current !== params.slug).slice(0, 5).map(a => {
                  const cs   = CAT_STYLE[a.category] || CAT_STYLE.news
                  const aImg = resolveImage(a)
                  return (
                    <a key={a._id} href={`/news/${a.slug?.current}`} style={{ textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {/* Thumbnail */}
                      <div style={{ width: 54, height: 40, flexShrink: 0, overflow: 'hidden', background: cs.bg }}>
                        {aImg && (
                          <img src={aImg} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                            onError={e => e.target.style.display='none'} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: cs.color, marginBottom: 3, letterSpacing: '0.1em' }}>{cs.label}</div>
                        <div style={{ fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.35, fontWeight: 600 }}>
                          {a.title?.length > 75 ? a.title.slice(0, 75) + '…' : a.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#4B5563', marginTop: 3, fontFamily: 'monospace' }}>{timeAgo(a.publishedAt)}</div>
                      </div>
                    </a>
                  )
                })}
              </div>
              <a href="/news" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#C8922A', textDecoration: 'none', fontFamily: 'monospace', fontSize: '0.68rem', letterSpacing: '0.1em' }}>
                ALL NEWS →
              </a>
            </div>

            {/* Newsletter */}
            <div style={{ background: '#0D1117', border: '1px solid #C8922A30', padding: '1.25rem' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: '#C8922A', marginBottom: '0.5rem' }}>STAY LOCKED IN</div>
              <p style={{ fontSize: '0.8rem', color: '#4B5563', marginBottom: '1rem', lineHeight: 1.5 }}>
                Breaking alerts, law changes, new releases — straight to your inbox.
              </p>
              <input type="email" placeholder="your@email.com" style={{ width: '100%', background: '#111318', border: '1px solid #1F2428', color: '#E8E6E1', padding: '8px 10px', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '8px', boxSizing: 'border-box' }} />
              <button style={{ width: '100%', background: '#C8922A', color: '#000', border: 'none', padding: '8px', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', letterSpacing: '0.05em' }}>
                GET THE DAILY →
              </button>
            </div>
          </aside>
        </div>

        {/* ── RELATED GRID ── */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
          <div style={{ paddingTop: '2rem', borderTop: '1px solid #1F2428', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: '#C8922A', letterSpacing: '0.05em' }}>RELATED STORIES</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {related.filter(a => a.slug?.current !== params.slug).slice(0, 3).map(a => (
              <NewsCard key={a._id} article={a} />
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
