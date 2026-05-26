'use client'

function resolveImage(article) {
  if (article?.heroImage?.asset?.url) return article.heroImage.asset.url
  if (article?.imageUrl) return article.imageUrl
  return null
}

function readingTime(text) {
  if (!text) return '1 min'
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200)) + ' min read'
}

const CAT_COLORS = {
  breaking: '#EF4444', news: '#9CA3AF', law: '#60A5FA',
  industry: '#C8922A', opinion: '#C084FC', training: '#34D399', review: '#C8922A'
}
const CAT_LABELS = {
  breaking: '● BREAKING', news: '◉ NEWS', law: '⚖ LAW',
  industry: '◈ INDUSTRY', opinion: '◇ OPINION', training: '▲ TRAINING', review: '★ REVIEW'
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

// Fallback gradient backgrounds per category when no image available
const CAT_GRADIENTS = {
  breaking: 'linear-gradient(135deg, #2a0000 0%, #0d0000 100%)',
  law:      'linear-gradient(135deg, #001a2a 0%, #0d1117 100%)',
  industry: 'linear-gradient(135deg, #1a1000 0%, #0d0a00 100%)',
  news:     'linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)',
  opinion:  'linear-gradient(135deg, #1a0a2a 0%, #0d0717 100%)',
  training: 'linear-gradient(135deg, #001a0a 0%, #000d05 100%)',
  review:   'linear-gradient(135deg, #1a1000 0%, #0d0a00 100%)',
}

export default function NewsCard({ article, featured = false }) {
  // Always route to internal DownRange article page
  // externalUrl is shown as "Read original source" inside the article page
  const slug = article.slug?.current || article._id || ''
  const href = `/news/${encodeURIComponent(slug)}`
  const catColor   = CAT_COLORS[article.category]  || '#9CA3AF'
  const catLabel   = CAT_LABELS[article.category]  || (article.category?.toUpperCase() || 'NEWS')
  const catGrad    = CAT_GRADIENTS[article.category] || CAT_GRADIENTS.news
  const imageUrl   = resolveImage(article)
  const imageAlt   = article.imageAlt || article.heroImage?.alt || article.title

  if (featured) {
    return (
      <a href={href} rel="noreferrer"
        style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ position: 'relative', minHeight: '420px', overflow: 'hidden', background: '#0d1117' }}>
          {/* Background image */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: catGrad }} />
          )}
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.6) 50%, rgba(9,9,11,0.2) 100%)' }} />
          {/* Content */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 36px' }}>
            {article.urgencyScore >= 8 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#B91C1C', color: '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', padding: '4px 12px', textTransform: 'uppercase', marginBottom: '12px' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                Breaking
              </div>
            )}
            <span style={{ display: 'inline-block', color: catColor, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', marginBottom: '10px' }}>{catLabel}</span>
            <h2 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(28px, 4vw, 48px)', lineHeight: 1, color: '#F5F5F3', letterSpacing: '0.02em', marginBottom: '12px', maxWidth: 680 }}>
              {article.title}
            </h2>
            {(article.excerpt || article.summary) && (
              <p style={{ fontSize: '15px', color: '#94A3B8', maxWidth: 580, marginBottom: '18px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {article.excerpt || article.summary}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {article.source || article.author?.name || 'Staff'} · {timeAgo(article.publishedAt)}
              </span>
              <span style={{ background: '#C8922A', color: '#000', fontSize: '11px', fontWeight: 700, padding: '4px 12px', letterSpacing: '0.08em' }}>
                READ STORY →
              </span>
            </div>
          </div>
        </div>
      </a>
    )
  }

  // Standard card
  return (
    <a href={href} rel="noreferrer"
      style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ background: '#111318', border: '1px solid var(--border)', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#C8922A'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#1F2428'}>

        {/* Image area — always 180px tall */}
        <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
          {article.urgencyScore >= 8 && (
            <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', alignItems: 'center', gap: 4, background: '#B91C1C', padding: '3px 8px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
              <span style={{ color: '#fff', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', fontFamily: "'IBM Plex Mono',monospace" }}>BREAKING</span>
            </div>
          )}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'opacity 0.3s' }}
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentElement.style.background = catGrad
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: catGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: catColor, fontSize: '28px', opacity: 0.3 }}>◈</span>
            </div>
          )}
          {/* Category pill overlay */}
          <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.75)', padding: '3px 8px', backdropFilter: 'blur(4px)' }}>
            <span style={{ color: catColor, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em' }}>{catLabel}</span>
          </div>
        </div>

        {/* Text content */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.3, marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {article.title}
          </h3>
          {(article.excerpt || article.summary) && (
            <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5, marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
              {article.excerpt || article.summary}
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #1A1E24', marginTop: 'auto' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#4B5563' }}>
              {article.source || article.author?.name || 'Staff'}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#4B5563' }}>
                {readingTime(article.summary || article.excerpt)}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#4B5563' }}>
                {timeAgo(article.publishedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}
