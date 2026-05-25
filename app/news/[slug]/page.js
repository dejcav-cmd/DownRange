// ─── app/site/news/[slug]/page.js ────────────────────────────────────────────
import { notFound } from 'next/navigation';
import { getArticleBySlug, getRecentArticles } from '@/sanity/lib/client';
import { timeAgo, formatDate, getCategoryStyle, urgencyLabel, truncate } from '@/lib/utils';
import Link from 'next/link';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: 'Article Not Found | DownRange' };
  return {
    title: `${article.title} | DownRange`,
    description: article.summary || article.title,
    openGraph: { title: article.title, description: article.summary, images: article.image ? [article.image] : [] },
  };
}

export default async function ArticlePage({ params }) {
  const [article, related] = await Promise.all([
    getArticleBySlug(params.slug),
    getRecentArticles(6),
  ]);

  if (!article) notFound();

  const catStyle = getCategoryStyle(article.category);
  const urg = urgencyLabel(article.urgencyScore || 0);

  return (
    <div style={{ background: '#0A0B0C', minHeight: '100vh', color: '#E8E6E1' }}>
      {/* Article Header */}
      <div style={{
        borderBottom: '1px solid #1F2428',
        background: 'linear-gradient(180deg, #111318 0%, #0A0B0C 100%)'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.75rem' }}>
            <Link href="/" style={{ color: '#64748B', textDecoration: 'none' }}>HOME</Link>
            <span style={{ color: '#374151' }}>›</span>
            <Link href="/news" style={{ color: '#64748B', textDecoration: 'none' }}>NEWS</Link>
            <span style={{ color: '#374151' }}>›</span>
            <span style={{ color: '#C8922A', fontFamily: 'monospace' }}>
              {article.category?.toUpperCase() || 'NEWS'}
            </span>
          </div>

          {/* Category + Urgency badges */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{
              background: catStyle.bg, color: catStyle.color,
              padding: '0.2rem 0.6rem', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
              border: `1px solid ${catStyle.color}40`, borderRadius: '2px', letterSpacing: '0.1em'
            }}>
              {catStyle.label}
            </span>
            {article.urgencyScore >= 7 && (
              <span style={{
                background: '#2A0000', color: urg.color,
                padding: '0.2rem 0.6rem', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700,
                border: `1px solid ${urg.color}60`, borderRadius: '2px', letterSpacing: '0.1em'
              }}>
                {urg.label}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: '"Bebas Neue", "Arial Black", sans-serif',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            lineHeight: 1.05,
            color: '#F5F5F3',
            letterSpacing: '0.02em',
            marginBottom: '1.25rem'
          }}>
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p style={{
              fontSize: '1.15rem',
              lineHeight: 1.6,
              color: '#9CA3AF',
              marginBottom: '1.5rem',
              borderLeft: '3px solid #C8922A',
              paddingLeft: '1rem'
            }}>
              {article.summary}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748B' }}>
            <span style={{ fontFamily: 'monospace' }}>
              {article.sourceName || 'DownRange Staff'}
            </span>
            <span style={{ color: '#374151' }}>|</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span style={{ color: '#374151' }}>|</span>
            <span style={{ color: '#C8922A' }}>{timeAgo(article.publishedAt)}</span>
            {article.sourceUrl && (
              <>
                <span style={{ color: '#374151' }}>|</span>
                <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                   style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.75rem' }}>
                  ORIGINAL SOURCE ↗
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero image */}
      {article.image && (
        <div style={{ width: '100%', maxHeight: '500px', overflow: 'hidden' }}>
          <img src={article.image} alt={article.title}
               style={{ width: '100%', height: '500px', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Body */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem' }}>

        {/* Main content */}
        <div>
          {article.body ? (
            <div style={{
              fontSize: '1.05rem', lineHeight: 1.8, color: '#D1D5DB',
              fontFamily: '"IBM Plex Sans", "Arial", sans-serif'
            }}
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          ) : (
            <div style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#D1D5DB' }}>
              <p>{article.summary}</p>
              {article.sourceUrl && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#111318', border: '1px solid #1F2428', borderRadius: '4px' }}>
                  <p style={{ color: '#94A3B8', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                    This article was sourced from {article.sourceName || 'an external publisher'}.
                  </p>
                  <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                     style={{
                       display: 'inline-block', background: '#C8922A', color: '#000',
                       padding: '0.6rem 1.25rem', fontFamily: 'monospace', fontWeight: 700,
                       fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.05em'
                     }}>
                    READ FULL ARTICLE ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #1F2428' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: '0.5rem', fontFamily: 'monospace' }}>TAGS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {article.tags.map(tag => (
                  <span key={tag} style={{
                    background: '#111318', color: '#94A3B8', padding: '0.2rem 0.6rem',
                    fontFamily: 'monospace', fontSize: '0.7rem',
                    border: '1px solid #1F2428', borderRadius: '2px'
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1F2428', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>SHARE:</span>
            {[
              { label: 'X/TWITTER', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent('https://downrangeco.com/news/' + article.slug)}` },
              { label: 'FACEBOOK',  href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://downrangeco.com/news/' + article.slug)}` },
            ].map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                 style={{
                   color: '#64748B', textDecoration: 'none', fontFamily: 'monospace',
                   fontSize: '0.7rem', padding: '0.3rem 0.6rem',
                   border: '1px solid #1F2428', borderRadius: '2px',
                   transition: 'color 0.2s, border-color 0.2s'
                 }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          {/* More stories */}
          <div style={{ background: '#111318', border: '1px solid #1F2428', borderRadius: '4px', padding: '1.25rem' }}>
            <div style={{
              fontFamily: 'monospace', fontSize: '0.7rem', color: '#C8922A',
              letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 700
            }}>MORE STORIES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {related.filter(a => a.slug !== params.slug).slice(0, 5).map(a => {
                const cs = getCategoryStyle(a.category);
                return (
                  <Link key={a._id} href={`/news/${a.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{ borderBottom: '1px solid #1A1E25', paddingBottom: '0.85rem' }}>
                      <div style={{
                        fontFamily: 'monospace', fontSize: '0.6rem', color: cs.color,
                        marginBottom: '0.3rem', letterSpacing: '0.1em'
                      }}>{cs.label}</div>
                      <div style={{
                        fontSize: '0.85rem', color: '#D1D5DB', lineHeight: 1.4,
                        fontWeight: 600
                      }}>
                        {truncate(a.title, 80)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.3rem', fontFamily: 'monospace' }}>
                        {timeAgo(a.publishedAt)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href="/news" style={{
              display: 'block', textAlign: 'center', marginTop: '1rem',
              color: '#C8922A', textDecoration: 'none', fontFamily: 'monospace',
              fontSize: '0.7rem', letterSpacing: '0.1em'
            }}>
              ALL NEWS →
            </Link>
          </div>

          {/* Newsletter CTA */}
          <div style={{
            marginTop: '1rem', background: '#0D1117', border: '1px solid #C8922A30',
            borderRadius: '4px', padding: '1.25rem'
          }}>
            <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '1.2rem', color: '#C8922A', marginBottom: '0.5rem' }}>
              STAY LOCKED IN
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem', lineHeight: 1.5 }}>
              Breaking alerts, law changes, new releases. Straight to your inbox.
            </p>
            <form action="/api/newsletter" method="POST">
              <input type="email" name="email" placeholder="your@email.com" required style={{
                width: '100%', background: '#111318', border: '1px solid #1F2428',
                color: '#E8E6E1', padding: '0.5rem 0.75rem', fontFamily: 'monospace',
                fontSize: '0.8rem', marginBottom: '0.5rem', borderRadius: '2px', boxSizing: 'border-box'
              }} />
              <button type="submit" style={{
                width: '100%', background: '#C8922A', color: '#000',
                border: 'none', padding: '0.6rem', fontFamily: 'monospace',
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', borderRadius: '2px',
                letterSpacing: '0.05em'
              }}>
                GET THE DAILY →
              </button>
            </form>
          </div>
        </aside>
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .article-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
