import { notFound }        from 'next/navigation'
import Masthead            from '../../../components/layout/Masthead'
import Footer              from '../../../components/layout/Footer'
import BreakingTicker      from '../../../components/layout/BreakingTicker'
import NewsCard            from '../../../components/ui/NewsCard'
import { getArticleBySlug, getRecentArticles, getRelatedArticles, fetchBreakingAlerts } from '../../../sanity/lib/client'
import ArticleHeroImage from '../../../components/ui/ArticleHeroImage'

// Server-side firearm image fallback — same logic as NewsCard client-side
const ARTICLE_FALLBACKS = {
  pistol:     'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=1200&q=85',
  rifle:      'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1200&q=85',
  shotgun:    'https://images.unsplash.com/photo-1543393716-375f47996a77?w=1200&q=85',
  suppressor: 'https://images.unsplash.com/photo-1578674473215-9e07ee2e577d?w=1200&q=85',
  optic:      'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=1200&q=85',
  ammo:       'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=1200&q=85',
  law:        'https://images.unsplash.com/photo-1584553391547-8ba39d3e3b51?w=1200&q=85',
  breaking:   'https://images.unsplash.com/photo-1584553391547-8ba39d3e3b51?w=1200&q=85',
  news:       'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=1200&q=85',
  industry:   'https://images.unsplash.com/photo-1621415814107-a4cbf5b3f1ea?w=1200&q=85',
}

function getArticleFallback(article) {
  const t = (article?.title || '').toLowerCase()
  // LAW first
  if (/constitutional.carry|gun.control|preemption|second.amend|2a.rights/.test(t)) return ARTICLE_FALLBACKS.law
  if (/\blegislat|\bbill\b|congress|senate|most.viewed.bill|week.of/.test(t)) return ARTICLE_FALLBACKS.law
  if (/atf\b|scotus|supreme.court|circuit.court|federal.court|injunction/.test(t)) return ARTICLE_FALLBACKS.law
  if (/\bfeds\b|federal.agent|\bdoj\b|\bfbi\b|indicted|prosecut|charged with/.test(t)) return ARTICLE_FALLBACKS.law
  if (/\bban\b|lawsuit|legal.challenge|unconstitutional|bruen|heller|mcdonald/.test(t)) return ARTICLE_FALLBACKS.law
  if (/\bsaf\b|\bnra\b|\bgoa\b|\bfpc\b|second.amendment.foundation/.test(t)) return ARTICLE_FALLBACKS.law
  // PISTOL
  if (/pistols?|handguns?|glock|sig.sauer|bodyguard|shield|hellcat|p365|p320/.test(t)) return ARTICLE_FALLBACKS.pistol
  if (/9mm|45.acp|40.s&w|380.acp|10mm|concealed.carry|edc|ccw|carry.gun/.test(t)) return ARTICLE_FALLBACKS.pistol
  if (/smith.wesson|s&w|ruger|kimber|springfield.armory|walther|beretta|fn.509/.test(t)) return ARTICLE_FALLBACKS.pistol
  if (/iron.sight|trigger.upgrade|holster|magazine|mag.release/.test(t)) return ARTICLE_FALLBACKS.pistol
  // RIFLE
  if (/ar.?15|ar15|m4\b|m16|ak.?47|rifle|carbine|bolt.action/.test(t)) return ARTICLE_FALLBACKS.rifle
  if (/5\.56|6\.5.creedmoor|\.308|\.223|300.blackout|suppressor|silencer|nfa/.test(t)) return ARTICLE_FALLBACKS.rifle
  if (/shotgun|12.gauge|mossberg|benelli/.test(t)) return ARTICLE_FALLBACKS.rifle
  if (/optic|scope|red.dot|eotech|aimpoint|trijicon|vortex/.test(t)) return ARTICLE_FALLBACKS.rifle
  if (/ammo|ammunition|cartridge|\bgrain\b|fmj|jhp/.test(t)) return ARTICLE_FALLBACKS.ammo
  return ARTICLE_FALLBACKS[article?.category] || ARTICLE_FALLBACKS.news
}

function readingTime(text) {
  if (!text) return '1 min read'
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200)) + ' min read'
}

export const revalidate = 120

export async function generateMetadata({ params }) {
  const article = await getArticleBySlug(params.slug).catch(() => null)
  if (!article) return { title: 'Article Not Found | DownRange' }
  const img = resolveImage(article)
  const url = `https://downrangeco.com/news/${params.slug}`
  return {
    title:       `${article.title} | DownRange`,
    description: article.summary || article.excerpt || article.title,
    alternates:  { canonical: url },
    openGraph: {
      type:        'article',
      url,
      title:       article.title,
      description: article.summary || article.excerpt,
      publishedTime: article.publishedAt,
      modifiedTime:  article._updatedAt || article.publishedAt,
      section:     article.category,
      tags:        article.tags || [],
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
  let article, related, alerts

  try {
    ;[article, related, alerts] = await Promise.all([
      getArticleBySlug(params.slug).catch(() => null),
      (article ? getRelatedArticles(article?.category || 'news', params.slug, 8) : getRecentArticles(8)).catch(() => []),
      fetchBreakingAlerts(5).catch(() => []),
    ])
  } catch {
    article = null
    related = []
    alerts  = []
  }

  if (!article) notFound()

  const cat      = CAT_STYLE[article.category] || CAT_STYLE.news
  // heroImage is from Sanity CDN (manual uploads) — always trust
  // imageUrl is always our curated Wikimedia image (set by patch-article)
  // If both null, use keyword-based fallback
  const imageUrl = article?.heroImage?.asset?.url || article?.imageUrl || getArticleFallback(article)
  const imageAlt = article.imageAlt || article.heroImage?.alt || article.title

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* ── NewsArticle structured data (JSON-LD) ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type':    'NewsArticle',
        headline:   article.title,
        description: article.summary || article.excerpt,
        image:      imageUrl ? [imageUrl] : [],
        datePublished: article.publishedAt,
        dateModified:  article._updatedAt || article.publishedAt,
        author: [{
          '@type': 'Organization',
          name:    article.source || 'DownRange',
          url:     'https://downrangeco.com',
        }],
        publisher: {
          '@type': 'Organization',
          name:    'DownRange',
          url:     'https://downrangeco.com',
          logo:    { '@type': 'ImageObject', url: 'https://downrangeco.com/favicon.svg' },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id':   `https://downrangeco.com/news/${params.slug}`,
        },
        articleSection: article.category,
        keywords: (article.tags || []).join(', '),
        url: `https://downrangeco.com/news/${params.slug}`,
      }) }} />

      <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* ── HERO IMAGE — always shown ── */}
        <div style={{ width: '100%', height: 'clamp(280px, 45vw, 520px)', overflow: 'hidden', position: 'relative' }}>
          <ArticleHeroImage src={imageUrl} alt={imageAlt} fallback={ARTICLE_FALLBACKS.news} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(0deg, #0A0B0C 0%, transparent 100%)' }} />
        </div>

        {/* ── HEADER ── */}
        <div style={{ background: 'transparent', borderBottom: '1px solid var(--border)', marginTop: '-80px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.72rem', fontFamily: "'IBM Plex Mono',monospace" }}>
              <a href="/"     style={{ color: '#4B5563', textDecoration: 'none' }}>HOME</a>
              <span style={{ color: '#2D3748' }}>›</span>
              <a href="/news" style={{ color: '#4B5563', textDecoration: 'none' }}>NEWS</a>
              <span style={{ color: '#2D3748' }}>›</span>
              <span style={{ color: '#C8922A' }}>{cat.label}</span>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ background: cat.bg, color: cat.color, padding: '3px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${cat.color}40`, letterSpacing: '0.1em' }}>
                {cat.label}
              </span>
              {article.urgencyScore >= 8 && (
                <span style={{ background: '#2a0000', color: '#EF4444', padding: '3px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.7rem', fontWeight: 700, border: '1px solid #EF444440', letterSpacing: '0.1em' }}>
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
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.78rem', color: '#4B5563', fontFamily: "'IBM Plex Mono',monospace" }}>
              <span>{article.source || article.author?.name || 'DownRange Staff'}</span>
              <span style={{ color: '#2D3748' }}>|</span>
              <span>{formatDate(article.publishedAt)}</span>
              <span style={{ color: '#2D3748' }}>|</span>
              <span style={{ color: '#C8922A' }}>{timeAgo(article.publishedAt)}</span>
              <span style={{ color: '#2D3748' }}>|</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace" }}>{readingTime(article.body || article.summary || article.excerpt)}</span>
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
              <>
                <style>{`
                  .dr-article-body h2 {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.5rem;
                    letter-spacing: 0.04em;
                    color: #F0EDE6;
                    margin: 2.5rem 0 0.75rem;
                    padding-bottom: 0.4rem;
                    border-bottom: 2px solid #C8922A;
                    line-height: 1.1;
                  }
                  .dr-article-body h2:first-child { margin-top: 0; }
                  .dr-article-body p {
                    font-size: 1.05rem;
                    line-height: 1.85;
                    color: #CBD5E1;
                    margin-bottom: 1.4rem;
                    font-family: 'IBM Plex Sans', Arial, sans-serif;
                  }
                  .dr-article-body strong { color: #F0EDE6; font-weight: 700; }
                  .dr-article-body em { color: #C8922A; font-style: normal; font-weight: 600; }
                  .dr-article-body ul { margin: 0.75rem 0 1.4rem 0; padding-left: 0; list-style: none; }
                  .dr-article-body li {
                    font-size: 1rem;
                    line-height: 1.75;
                    color: #CBD5E1;
                    padding: 0.3rem 0 0.3rem 1.2rem;
                    position: relative;
                    font-family: 'IBM Plex Sans', Arial, sans-serif;
                    border-bottom: 1px solid rgba(30,41,59,0.4);
                  }
                  .dr-article-body li:before {
                    content: '◈';
                    position: absolute;
                    left: 0;
                    color: #C8922A;
                    font-size: 0.7rem;
                    top: 0.45rem;
                  }
                `}</style>
                <div
                  className="dr-article-body"
                  dangerouslySetInnerHTML={{ __html: article.body }}
                />

                {/* Source attribution — always shown when we have a body */}
                {article.externalUrl && (
                  <div style={{ margin: '2.5rem 0 0', padding: '1.25rem 1.5rem', background: 'rgba(200,146,42,0.06)', border: '1px solid rgba(200,146,42,0.25)', borderLeft: '4px solid #C8922A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#C8922A', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4 }}>
                        ORIGINAL SOURCE · {article.source || 'EXTERNAL PUBLISHER'}
                      </div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.5 }}>
                        This editorial was written by DownRange AI based on reporting from <strong style={{ color: '#94a3b8' }}>{article.source || 'the original publisher'}</strong>.
                        Read the primary source for additional detail.
                      </div>
                    </div>
                    <a
                      href={article.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8922A', color: '#000', padding: '0.6rem 1.4rem', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                      READ ORIGINAL ↗
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#D1D5DB' }}>
                {/* AI-generated summary — full editorial DownRange take */}
                <p style={{ fontSize: '1.1rem', lineHeight: 1.9, color: '#CBD5E1', marginBottom: '1.5rem' }}>
                  {article.summary || article.excerpt}
                </p>

                {/* Tags inline */}
                {article.tags?.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '2rem', fontFamily: "'IBM Plex Mono',monospace" }}>
                    {article.tags.map(t => `#${t}`).join('  ')}
                  </p>
                )}

                {/* Source attribution block */}
                {article.externalUrl && (
                  <div style={{ marginTop: '2rem', padding: '1.5rem 2rem', background: '#0D1117', border: '1px solid #C8922A30', borderLeft: '4px solid #C8922A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.65rem', color: '#C8922A', letterSpacing: '0.15em', fontWeight: 700 }}>
                        ORIGINAL SOURCE
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.65rem', color: '#374151' }}>—</span>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.65rem', color: '#4B5563' }}>
                        {article.source || 'External Publisher'}
                      </span>
                    </div>
                    <p style={{ color: '#6B7280', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      This story was sourced and editorially summarized by DownRange.
                      Read the full original report at {article.source || 'the source'}.
                    </p>
                    <a href={article.externalUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#C8922A', color: '#000', padding: '0.65rem 1.5rem', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.05em' }}>
                      READ ORIGINAL ARTICLE ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {article.tags?.length > 0 && (
              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', color: '#4B5563', marginBottom: '0.5rem', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>TAGS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {article.tags.map(tag => (
                    <span key={tag} style={{ background: '#111318', color: '#6B7280', padding: '3px 8px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', border: '1px solid var(--border)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#4B5563', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>SHARE:</span>
              {[
                { label: 'X / TWITTER', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent('https://downrangeco.com/news/' + params.slug)}` },
                { label: 'FACEBOOK',    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://downrangeco.com/news/' + params.slug)}` },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#4B5563', textDecoration: 'none', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', padding: '4px 8px', border: '1px solid var(--border)', transition: 'color 0.2s, border-color 0.2s' }}
>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Related stories */}
            <div style={{ background: '#111318', border: '1px solid var(--border)', padding: '1.25rem' }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '1rem', fontWeight: 700 }}>MORE STORIES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {related.filter(a => a.slug?.current !== params.slug).slice(0, 5).map(a => {
                  const cs   = CAT_STYLE[a.category] || CAT_STYLE.news
                  const aImg = resolveImage(a)
                  return (
                    <a key={a._id} href={`/news/${a.slug?.current}`} style={{ textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      {/* Thumbnail */}
                      <div style={{ width: 54, height: 40, flexShrink: 0, overflow: 'hidden', background: cs.bg }}>
                        {aImg && (
                          <img src={aImg} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.6rem', color: cs.color, marginBottom: 3, letterSpacing: '0.1em' }}>{cs.label}</div>
                        <div style={{ fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.35, fontWeight: 600 }}>
                          {a.title?.length > 75 ? a.title.slice(0, 75) + '…' : a.title}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#4B5563', marginTop: 3, fontFamily: "'IBM Plex Mono',monospace" }}>{timeAgo(a.publishedAt)}</div>
                      </div>
                    </a>
                  )
                })}
              </div>
              <a href="/news" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#C8922A', textDecoration: 'none', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', letterSpacing: '0.1em' }}>
                ALL NEWS →
              </a>
            </div></aside>
        </div>

        {/* ── RELATED GRID ── */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem' }}>
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
