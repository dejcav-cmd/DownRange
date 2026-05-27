import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import { getReviewBySlug, fetchReviews } from '../../../sanity/lib/client'

// Seed reviews — same data as reviews/page.js — fallback when Sanity has no review
const SEED_REVIEWS = [
  { _id:'r1', slug:{current:'glock-43x-mos-review'}, title:'Glock G43X MOS Review', brand:'Glock', model:'G43X MOS', caliber:'9mm', category:'pistol', msrp:549, score:9.2, verdict:'Best Slim-Line EDC Available', publishedAt:'2026-05-12', imageUrl:'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=1200&q=85', summary:'After 2,000 rounds of Federal HST and Speer Gold Dot through a G43X MOS, the results are clear: zero malfunctions, sub-2-inch groups at 15 yards, and an optic system that actually works out of the box. The MOS plate accepts every major micro red dot without shimming. At 1.1 inches wide it disappears in an appendix holster.', testRounds:'2,000+', pros:['Zero malfunctions in 2,000+ rounds','MOS plate accepts all major micro red dots','1.1" width disappears IWB','Grip texture aggressive but not pants-shredding'], cons:['Factory trigger has mushy reset','Standard 10+1 flush capacity'], body:'<p>The G43X MOS is the slim-line carry standard. Glock fixed the capacity problem — if you run Shield Arms S15 magazines you carry 15+1 in a package narrower than a stack of credit cards. The MOS system is the clincher: cut once, run any dot. Buy the gun, add the Holosun EPS Carry, run 500 rounds, and carry it.</p>' },
  { _id:'r2', slug:{current:'sig-p365xl-review'}, title:'SIG Sauer P365XL Review', brand:'SIG Sauer', model:'P365XL', caliber:'9mm', category:'pistol', msrp:699, score:9.5, verdict:'Best Factory Trigger in the Price Class', publishedAt:'2026-05-20', imageUrl:'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=1200&q=85', summary:'The P365XL has the best factory trigger of any striker-fired pistol under $800 — by a margin that is immediately obvious in the first magazine.', testRounds:'1,500+', pros:['Best factory striker trigger in its price class','12+1 flush capacity','ROMEO Zero optic cut standard','Excellent point-of-aim accuracy'], cons:['$699 MSRP is aggressive','Grip slightly narrow for large hands'], body:'<p>If you carry one gun and it matters, the P365XL earns the nod over the G43X on trigger feel alone. SIG tuned this trigger to feel like a $200 Apex job without the installation. Twelve rounds flush means you are not sacrificing capacity for concealability.</p>' },
  { _id:'r3', slug:{current:'daniel-defense-ddm4-v7-review'}, title:'Daniel Defense DDM4 V7 Review', brand:'Daniel Defense', model:'DDM4 V7', caliber:'5.56 NATO', category:'rifle', msrp:1999, score:9.4, verdict:'The Standard for When It Has to Run', publishedAt:'2026-04-28', imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1200&q=85', summary:'Three thousand rounds through the DDM4 V7 including 500 rounds of M855A1 green tip without a single stoppage.', testRounds:'3,000+', pros:['CHF barrel — measurably superior','HPT/MPI bolt inspection documented','Sub-MOA with 77gr SMK','Lifetime warranty'], cons:['$1,999 is real money','6.9 lbs unloaded','No irons included'], body:'<p>The DDM4 V7 is not cheaper than a BCM or a Noveske. It is not supposed to be. When agencies spec the DDM4 it is because they need a documented guarantee the rifle will run under conditions where failure is unacceptable.</p>' },
  { _id:'r4', slug:{current:'mossberg-590a1-review'}, title:'Mossberg 590A1 Review', brand:'Mossberg', model:'590A1', caliber:'12 Gauge', category:'shotgun', msrp:649, score:9.1, verdict:'Military-Grade Home Defense Standard', publishedAt:'2026-04-10', imageUrl:'https://images.unsplash.com/photo-1543393716-375f47996a77?w=1200&q=85', summary:'The 590A1 is the only pump shotgun to pass US military MIL-SPEC testing.', testRounds:'500+', pros:['Passes US MIL-SPEC testing','Tang safety is ambidextrous','Dual extractors','Heavy-wall barrel'], cons:['Aluminum receiver (triggers debate)','Factory trigger acceptable but not exceptional'], body:'<p>The debate between the 590A1 and the Remington 870 has been settled by every law enforcement and military agency that ran both at scale: the 590A1 wins on reliability. The dual extractor is the difference.</p>' },
  { _id:'r5', slug:{current:'vortex-viper-pst-gen2-review'}, title:'Vortex Viper PST Gen II 1-6x24 Review', brand:'Vortex', model:'Viper PST Gen II 1-6x24', caliber:'N/A', category:'optic', msrp:599, score:8.9, verdict:'Best Value LPVO Under $600', publishedAt:'2026-03-18', imageUrl:'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=1200&q=85', summary:'True 1x magnification confirmed. The EBR-8 reticle with illuminated center dot is one of the better LPVO reticles at this price.', testRounds:'N/A', pros:['True 1x — zero parallax distortion','Illuminated EBR-8 reticle','Sub-MOA tracking','VIP lifetime warranty'], cons:['Eye relief shorter than Razor HD Gen III','Glass behind Kahles and Leupold at 6x'], body:'<p>The PST Gen II is the right answer to "what LPVO should I buy for an AR-15 that I will not regret?" You lose glass clarity vs a $1,200+ Leupold but gain identical tracking performance and a warranty that covers user error.</p>' },
  { _id:'r6', slug:{current:'silencerco-omega-9k-review'}, title:'SilencerCo Omega 9K Review', brand:'SilencerCo', model:'Omega 9K', caliber:'9mm / .300 BLK', category:'suppressor', msrp:799, score:9.3, verdict:"The Compact Suppressor That Doesn't Compromise", publishedAt:'2026-03-01', imageUrl:'https://images.unsplash.com/photo-1578674473215-9e07ee2e577d?w=1200&q=85', summary:'With the NFA tax stamp eliminated as of January 1, 2026, the Omega 9K is the most compelling entry into suppressor ownership.', testRounds:'1,000+', pros:['5.08" barely affects holster compatibility','Multi-cal rated to .300 BLK subsonic','Titanium/Inconel construction','No $200 tax stamp since Jan 1, 2026'], cons:['Direct-thread only','Wet shooting for maximum suppression on 9mm'], body:'<p>The tax stamp elimination changes the math on suppressor ownership. The Omega 9K was already the best compact pistol suppressor — now it is also the obvious first can to buy. Fill out the Form 4 before you need it.</p>' },
]

export const revalidate = 3600

export async function generateMetadata({ params }) {
  let review = await getReviewBySlug(params.slug).catch(() => null)
  if (!review) review = SEED_REVIEWS.find(r => r.slug?.current === params.slug)
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
        <div style={{ position: 'absolute', color: 'var(--border)', fontSize: '16px', letterSpacing: '4px' }}>★★★★★</div>
        <div style={{ position: 'absolute', overflow: 'hidden', width: `${pct}%`, color: '#C8922A', fontSize: '16px', letterSpacing: '4px' }}>★★★★★</div>
      </div>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '14px', color: '#C8922A', fontWeight: 700 }}>{score?.toFixed(1)} / 10</span>
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

  // Fall back to seed data if Sanity has no review for this slug
  if (!review) {
    review = SEED_REVIEWS.find(r => r.slug?.current === params.slug) || null
    if (!review) notFound()
    related = SEED_REVIEWS.filter(r => r.slug?.current !== params.slug).slice(0, 4)
  }

  const img = review.heroImage?.asset?.url || review.imageUrl
  const verdictColor = VERDICT_COLORS[review.verdict] || '#C8922A'

  return (
    <>
      <Masthead />
      <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        {/* Hero image */}
        {img && (
          <div style={{ width: '100%', height: 'clamp(260px, 40vw, 480px)', overflow: 'hidden', position: 'relative' }}>
            <img src={img} alt={review.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, var(--background) 0%, transparent 60%)' }} />
          </div>
        )}

        {/* Header */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: img ? '0 1.5rem 2rem' : '3rem 1.5rem 2rem', marginTop: img ? '-80px' : 0, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#C8922A', background: '#1A0E00', padding: '3px 10px', border: '1px solid #C8922A30' }}>{review.category?.toUpperCase()}</span>
            {review.verdict && (
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: verdictColor, background: '#111318', padding: '3px 10px', border: `1px solid ${verdictColor}40` }}>{review.verdict.toUpperCase()}</span>
            )}
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#F5F5F3', lineHeight: 1.05, letterSpacing: '0.02em', marginBottom: '16px' }}>
            {review.title}
          </h1>
          <Stars score={review.score || 8.5} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '14px', flexWrap: 'wrap', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: '#4B5563' }}>
            {review.brand && <span>{review.brand}</span>}
            {review.model && <><span style={{ color: 'var(--border)' }}>·</span><span>{review.model}</span></>}
            {review.caliber && <><span style={{ color: 'var(--border)' }}>·</span><span>{review.caliber}</span></>}
            {review.msrp && <><span style={{ color: 'var(--border)' }}>·</span><span style={{ color: '#C8922A' }}>MSRP ${review.msrp.toLocaleString()}</span></>}
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
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#34D399', letterSpacing: '0.15em', marginBottom: '12px', fontWeight: 700 }}>✓ PROS</div>
                  {review.pros.map((p, i) => <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: '#86EFAC', marginBottom: '6px', paddingLeft: '12px' }}>{p}</div>)}
                </div>
              )}
              {review.cons?.length > 0 && (
                <div style={{ background: '#1A0000', border: '1px solid #7F1D1D', padding: '16px' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#EF4444', letterSpacing: '0.15em', marginBottom: '12px', fontWeight: 700 }}>✗ CONS</div>
                  {review.cons.map((c, i) => <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: '#FCA5A5', marginBottom: '6px', paddingLeft: '12px' }}>{c}</div>)}
                </div>
              )}
            </div>

            {review.testRounds && (
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: '#4B5563', marginBottom: '2rem', padding: '12px 16px', background: '#111318', border: '1px solid var(--border)' }}>
                ◈ {review.testRounds.toLocaleString()} rounds fired during testing
              </div>
            )}
          </div>

          <aside>
            {review.specs?.length > 0 && (
              <div style={{ background: '#111318', border: '1px solid var(--border)', padding: '20px', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px', fontWeight: 700 }}>SPECIFICATIONS</div>
                {review.specs.map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', gap: '8px' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#4B5563' }}>{s.label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#D1D5DB', textAlign: 'right' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: '#0D1117', border: '1px solid #C8922A40', padding: '20px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#C8922A', marginBottom: '8px' }}>VERDICT</div>
              {review.verdict && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', color: verdictColor, marginBottom: '12px', fontWeight: 700 }}>{review.verdict}</div>}
              <Stars score={review.score || 8.5} />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}
