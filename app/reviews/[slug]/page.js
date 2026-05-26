import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import { getReviewBySlug, fetchReviews } from '../../../sanity/lib/client'

export const revalidate = 3600

export async function generateMetadata({ params }) {
  const review = await getReviewBySlug(params.slug).catch(() => null)
  if (!review) return { title: 'Review Not Found | DownRange' }
  return {
    title: `${review.title} | DownRange Reviews`,
    description: review.summary,
    openGraph: { title: review.title, description: review.summary, images: review.imageUrl ? [review.imageUrl] : [] },
  }
}

function Stars({ score }) {
  const pct = (score / 10) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ position: 'relative', width: '100px', height: '16px' }}>
        <div style={{ position: 'absolute', color: '#1F2428', fontSize: '16px', letterSpacing: '4px' }}>★★★★★</div>
        <div style={{ position: 'absolute', overflow: 'hidden', width: `${pct}%`, color: '#C8922A', fontSize: '16px', letterSpacing: '4px' }}>★★★★★</div>
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#C8922A', fontWeight: 700 }}>{score?.toFixed(1)} / 10</span>
    </div>
  )
}

const VERDICT_COLORS = {
  'Best in Class': '#34D399', 'Highly Recommended': '#34D399',
  'Recommended': '#60A5FA', 'Good Value': '#FBBF24',
  'Average': '#9CA3AF', 'Skip It': '#EF4444',
}

export default async function ReviewPage({ params }) {
  let review, related
  try {
    ;[review, related] = await Promise.all([
      getReviewBySlug(params.slug).catch(() => null),
      fetchReviews(6).catch(() => []),
    ])
  } catch { review = null; related = [] }

  if (!review) notFound()

  const img = review.heroImage?.asset?.url || review.imageUrl
  const verdictColor = VERDICT_COLORS[review.verdict] || '#C8922A'

  return (
    <>
      <Masthead />
      <main style={{ background: '#0A0B0C', minHeight: '100vh' }}>
        {/* Hero image */}
        {img && (
          <div style={{ width: '100%', height: 'clamp(260px, 40vw, 480px)', overflow: 'hidden', position: 'relative' }}>
            <img src={img} alt={review.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, #0A0B0C 0%, transparent 60%)' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: img ? '0 1.5rem 2rem' : '3rem 1.5rem 2rem', marginTop: img ? '-80px' : 0, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#C8922A', background: '#1A0E00', padding: '3px 10px', border: '1px solid #C8922A30' }}>{review.category?.toUpperCase()}</span>
            {review.verdict && (
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: verdictColor, background: '#111318', padding: '3px 10px', border: `1px solid ${verdictColor}40` }}>{review.verdict.toUpperCase()}</span>
            )}
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F5F5F3', lineHeight: 1.05, letterSpacing: '0.02em', marginBottom: '16px' }}>
            {review.title}
          </h1>
          <Stars score={review.score || 8.5} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap', fontFamily: 'monospace', fontSize: '12px', color: '#4B5563' }}>
            {review.brand && <span>{review.brand}</span>}
            {review.model && <><span style={{ color: '#1F2428' }}>·</span><span>{review.model}</span></>}
            {review.caliber && <><span style={{ color: '#1F2428' }}>·</span><span>{review.caliber}</span></>}
            {review.msrp && <><span style={{ color: '#1F2428' }}>·</span><span style={{ color: '#C8922A' }}>MSRP ${review.msrp.toLocaleString()}</span></>}
          </div>
        </div>

        {/* Body */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem 4rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '3rem' }}>
          <div>
            {review.summary && (
              <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#94A3B8', marginBottom: '2rem', borderLeft: '3px solid #C8922A', paddingLeft: '1rem' }}>
                {review.summary}
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '2rem' }}>
              {review.pros?.length > 0 && (
                <div style={{ background: '#001A0A', border: '1px solid #166534', padding: '16px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#34D399', letterSpacing: '0.15em', marginBottom: '12px', fontWeight: 700 }}>✓ PROS</div>
                  {review.pros.map((p, i) => <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#86EFAC', marginBottom: '6px', paddingLeft: '12px' }}>{p}</div>)}
                </div>
              )}
              {review.cons?.length > 0 && (
                <div style={{ background: '#1A0000', border: '1px solid #7F1D1D', padding: '16px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#EF4444', letterSpacing: '0.15em', marginBottom: '12px', fontWeight: 700 }}>✗ CONS</div>
                  {review.cons.map((c, i) => <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#FCA5A5', marginBottom: '6px', paddingLeft: '12px' }}>{c}</div>)}
                </div>
              )}
            </div>

            {review.testRounds && (
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4B5563', marginBottom: '2rem', padding: '12px 16px', background: '#111318', border: '1px solid #1F2428' }}>
                ◈ {review.testRounds.toLocaleString()} rounds fired during testing
              </div>
            )}
          </div>

          <aside>
            {review.specs?.length > 0 && (
              <div style={{ background: '#111318', border: '1px solid #1F2428', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px', fontWeight: 700 }}>SPECIFICATIONS</div>
                {review.specs.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1F2428', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4B5563' }}>{s.label}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#D1D5DB', textAlign: 'right' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: '#0D1117', border: '1px solid #C8922A40', padding: '20px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#C8922A', marginBottom: '8px' }}>VERDICT</div>
              {review.verdict && <div style={{ fontFamily: 'monospace', fontSize: '13px', color: verdictColor, marginBottom: '12px', fontWeight: 700 }}>{review.verdict}</div>}
              <Stars score={review.score || 8.5} />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
