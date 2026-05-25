import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import { fetchReviews, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'Reviews — DownRange', description: 'Expert field-tested reviews of pistols, rifles, shotguns, suppressors, optics, and accessories.' }
export const revalidate = 3600

function Stars({ score }) {
  const full = Math.floor(score / 2)
  const stars = Array.from({ length: 5 }, (_, i) => i < full ? '★' : '☆')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: '#C8922A', fontSize: '14px' }}>{stars.join('')}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', color: '#C8922A' }}>{score?.toFixed(1)} / 10</span>
    </div>
  )
}

function ReviewCard({ review, featured = false }) {
  const href = `/reviews/${review.slug?.current || review._id}`

  if (featured) {
    return (
      <a href={href} style={{ display: 'block', textDecoration: 'none' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '240px', background: '#16191F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', color: '#8A6320', position: 'relative' }}>
            {review.heroImage?.asset?.url ? (
              <img src={review.heroImage.asset.url} alt={review.firearmName} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
            ) : '🔫'}
          </div>
          <div style={{ padding: '24px' }}>
            <Stars score={review.score || 8.5} />
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '32px', color: '#F0EDE6', letterSpacing: '0.03em', margin: '8px 0 6px' }}>{review.firearmName}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280', marginBottom: '12px', letterSpacing: '0.08em' }}>
              {review.caliber} · {review.category?.toUpperCase()} · MSRP ${review.msrp?.toLocaleString()}
            </div>
            {review.verdict && (
              <p style={{ fontSize: '14px', color: '#9CA3AF', lineHeight: 1.5, fontStyle: 'italic' }}>"{review.verdict}"</p>
            )}
            <div style={{ marginTop: '16px' }}>
              <span style={{ color: '#C8922A', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em' }}>
                Read Full Review →
              </span>
            </div>
          </div>
        </div>
      </a>
    )
  }

  return (
    <a href={href} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="card" style={{ display: 'flex', gap: '16px', padding: '20px' }}>
        <div style={{ width: '80px', flexShrink: 0, height: '70px', background: '#16191F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>
          {review.heroImage?.asset?.url ? (
            <img src={review.heroImage.asset.url} alt={review.firearmName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : '🔫'}
        </div>
        <div style={{ flex: 1 }}>
          <Stars score={review.score || 8} />
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', color: '#F0EDE6', letterSpacing: '0.03em', lineHeight: 1, margin: '6px 0 4px' }}>{review.firearmName}</div>
          {review.verdict && (
            <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.4 }}>{review.verdict.slice(0, 100)}</div>
          )}
        </div>
      </div>
    </a>
  )
}

const CATS = [
  { label: 'All', val: null },
  { label: 'Pistols', val: 'pistol' },
  { label: 'Rifles', val: 'rifle' },
  { label: 'Shotguns', val: 'shotgun' },
  { label: 'Suppressors', val: 'suppressor' },
  { label: 'Optics', val: 'optic' },
  { label: 'Accessories', val: 'accessory' },
]

export default async function ReviewsPage({ searchParams }) {
  const cat = searchParams?.cat || null
  const [reviews, alerts] = await Promise.all([
    fetchReviews(20, cat).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const featured = reviews.find(r => r.featured) || reviews[0]
  const rest = reviews.filter(r => r._id !== featured?._id)

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="REVIEWS">
        <div className="container">
          <h1 className="page-hero-title">Field Tested</h1>
          <p className="page-hero-sub">Expert reviews · {reviews.length} reviews in database · Scored 0–10</p>
        </div>
      </div>

      <div style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="filter-tabs">
            {CATS.map(c => (
              <a key={c.val || 'all'} href={c.val ? `/reviews?cat=${c.val}` : '/reviews'}
                className={`filter-tab ${(cat === c.val || (!cat && !c.val)) ? 'active' : ''}`}>
                {c.label}
              </a>
            ))}
          </div>

          {/* Reviews layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', marginBottom: '24px' }}>
            {featured && <ReviewCard review={featured} featured />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {rest.slice(0, 3).map(r => <ReviewCard key={r._id} review={r} />)}
            </div>
          </div>

          {/* More reviews grid */}
          {rest.length > 3 && (
            <>
              <div className="section-header" style={{ marginTop: '32px' }}>
                <h2 className="section-title">More Reviews</h2>
                <div className="section-rule" />
                <div className="section-badge">{rest.length - 3} More</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {rest.slice(3).map(r => (
                  <a key={r._id} href={`/reviews/${r.slug?.current || r._id}`}
                    style={{ display: 'block', textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280', textTransform: 'uppercase' }}>{r.category}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#C8922A' }}>{r.score?.toFixed(1)}/10</span>
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', color: '#F0EDE6' }}>{r.firearmName}</div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{r.brand} · ${r.msrp?.toLocaleString()}</div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}

          {reviews.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280', fontFamily: "'IBM Plex Mono', monospace' }}>
              Reviews are added by DownRange staff. Check back soon.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
