import Link from 'next/link'
import Image from 'next/image'

const CAT_COLORS = {
  breaking: '#EF4444', news: '#9CA3AF', law: '#60A5FA',
  industry: '#C8922A', opinion: '#C084FC', training: '#34D399', review: '#C8922A'
}

const CAT_LABELS = {
  breaking: '● Breaking', news: '◉ News', law: '⚖ Law',
  industry: '◈ Industry', opinion: '◇ Opinion', training: '▲ Training', review: '★ Review'
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export default function NewsCard({ article, featured = false }) {
  const href = article.externalUrl || `/news/${article.slug?.current || article._id}`
  const catColor = CAT_COLORS[article.category] || '#9CA3AF'
  const catLabel = CAT_LABELS[article.category] || article.category

  if (featured) {
    return (
      <a href={href} target={article.externalUrl ? '_blank' : '_self'} rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
        <div className="card" style={{ position: 'relative', minHeight: '400px', overflow: 'hidden' }}>
          {article.heroImage?.asset?.url ? (
            <img src={article.heroImage.asset.url} alt={article.heroImage.alt || article.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1f2e 0%, #0d1117 40%, #1a120a 100%)' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.5) 50%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px' }}>
            {article.urgencyScore >= 8 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#B91C1C', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', padding: '4px 12px', textTransform: 'uppercase', marginBottom: '12px' }}>
                <span className="pulse-dot" />
                Breaking News
              </div>
            )}
            <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '48px', lineHeight: 0.95, color: '#F0EDE6', letterSpacing: '0.02em', marginBottom: '12px', maxWidth: '700px' }}>
              {article.title}
            </h1>
            {article.excerpt && (
              <p style={{ fontSize: '15px', color: '#9CA3AF', maxWidth: '600px', marginBottom: '16px', lineHeight: 1.5 }}>
                {article.excerpt}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {article.author?.name || article.source} · {timeAgo(article.publishedAt)}
              </span>
              <span className="btn-gold">Read Full Story →</span>
            </div>
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={href} target={article.externalUrl ? '_blank' : '_self'} rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
      <div className="card">
        <div style={{ width: '100%', height: '160px', background: '#16191F', overflow: 'hidden', position: 'relative' }}>
          {article.heroImage?.asset?.url ? (
            <img src={article.heroImage.asset.url} alt={article.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, #1a1520 0%, #0d1117 100%)` }} />
          )}
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: catColor }}>
              {catLabel}
            </span>
          </div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.25, marginBottom: '8px' }}>
            {article.title}
          </h3>
          {article.excerpt && (
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.excerpt}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #1F2428' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280' }}>
              {article.author?.name || article.source || 'Staff Report'}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280' }}>
              {timeAgo(article.publishedAt)}
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}
