import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'
import { fetchReviews, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'Reviews — DownRange', description: 'Expert field-tested reviews of pistols, rifles, shotguns, suppressors, optics, and accessories.' }
export const revalidate = 3600

const SEED_REVIEWS = [
  { _id:'r1', slug:{current:'glock-43x-mos-review'}, brand:'Glock', model:'G43X MOS', caliber:'9mm', category:'pistol', msrp:580, score:9.2, verdict:'Best-in-Class EDC', featured:true, imageUrl:'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=800&q=80', summary:'After 2,000 rounds of Federal HST and Speer Gold Dot, zero malfunctions. The MOS plate system accepts every major micro red dot. At 1.1" wide it disappears IWB.', roundCount:'2,000+', pros:['Zero malfunctions in 2,000+ rounds','MOS optic-ready from factory','Slim 1.1" width for IWB carry','Aggressive grip without being abrasive'], cons:['Factory trigger has mushy reset','10+1 flush capacity (15+1 with Shield Arms)'] },
  { _id:'r2', slug:{current:'sig-p365xl-review'}, brand:'SIG Sauer', model:'P365XL', caliber:'9mm', category:'pistol', msrp:699, score:9.5, verdict:'Best Carry Pistol Under $700', featured:true, imageUrl:'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=800&q=80', summary:'The P365XL has the best factory trigger of any striker-fired pistol in this price range — by a wide margin. Twelve rounds flush, ROMEO Zero optic cut standard.', roundCount:'1,500+', pros:['Best striker trigger in class','12+1 flush capacity','ROMEO Zero optic cut standard','Excellent out-of-box accuracy'], cons:['Premium price','Smaller grip for large hands'] },
  { _id:'r3', slug:{current:'daniel-defense-ddm4-v7-review'}, brand:'Daniel Defense', model:'DDM4 V7', caliber:'5.56 NATO', category:'rifle', msrp:1999, score:9.4, verdict:'Highest Reliability Baseline', imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', summary:'The DDM4 V7 is the rifle agencies and instructors issue when they need it to run no matter what. Mil-spec HPT/MPI-tested bolt carrier, cold hammer-forged barrel.', roundCount:'3,000+', pros:['CHF barrel standard','HPT/MPI bolt inspection','Sub-1 MOA guarantee','Lifetime warranty'], cons:['$2,000 price point','No included sights','Heavy 6.9 lbs'] },
  { _id:'r4', slug:{current:'mossberg-590a1-review'}, brand:'Mossberg', model:'590A1', caliber:'12 Gauge', category:'shotgun', msrp:649, score:9.1, verdict:'Military-Grade Home Defense Standard', imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', summary:'The only pump shotgun to pass US military MIL-SPEC testing. Tang safety is superior to crossbolt designs. Dual extractors outperform the 870\'s single extractor.', roundCount:'500+', pros:['Passes US MIL-SPEC testing','Tang safety (ambidextrous)','Dual extractors','Heavy-wall barrel'], cons:['Aluminum receiver (unfounded concern)','Trigger not exceptional'] },
  { _id:'r5', slug:{current:'vortex-viper-pst-gen2-review'}, brand:'Vortex', model:'Viper PST Gen II 1-6x24', caliber:'N/A', category:'optic', msrp:599, score:8.9, verdict:'Best Value LPVO Under $600', imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', summary:'The PST Gen II delivers illuminated reticle, true 1x magnification, and sub-MOA tracking at a price point that undercuts nearly every competitor by $200+.', roundCount:'N/A', pros:['True 1x magnification','Illuminated EBR-8 reticle','Sub-MOA tracking verified','Vortex lifetime warranty'], cons:['Eye relief slightly short','Not as clear as Razor at 6x'] },
  { _id:'r6', slug:{current:'silencerco-omega-9k-review'}, brand:'SilencerCo', model:'Omega 9K', caliber:'9mm / Multi-Cal', category:'suppressor', msrp:799, score:9.3, verdict:'Best Compact Pistol Suppressor', imageUrl:'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=800&q=80', summary:'With NFA tax stamps now eliminated (Jan 1, 2026), the Omega 9K is the most compelling entry point into suppressor ownership. At 5.08" it barely changes your holster options.', roundCount:'1,000+', pros:['5.08" length — holster friendly','Multi-caliber rated to .300 BLK','Titanium/Inconel construction','No $200 tax stamp required (2026)'], cons:['Requires dedicated holster in most cases','Wet shooting needed for maximum suppression'] },
]

const CATS = [
  { val:null, label:'All Reviews', count:null },
  { val:'pistol', label:'🔫 Pistols' },
  { val:'rifle', label:'◈ Rifles' },
  { val:'shotgun', label:'◈ Shotguns' },
  { val:'optic', label:'◉ Optics' },
  { val:'suppressor', label:'◈ Suppressors' },
  { val:'accessory', label:'◈ Accessories' },
]

function ScoreBar({ score }) {
  const pct = (score / 10) * 100
  const color = score >= 9 ? '#22C55E' : score >= 7.5 ? '#C8922A' : '#EF4444'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
      <div style={{ flex:1, height:'4px', background:'var(--bg3)', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:'2px' }} />
      </div>
      <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color, letterSpacing:'0.05em', lineHeight:1 }}>{score.toFixed(1)}</span>
    </div>
  )
}

function ReviewCard({ r, featured }) {
  const href = `/reviews/${r.slug?.current || r._id}`
  if (featured) return (
    <Link href={href} style={{ display:'block', textDecoration:'none' }}>
      <div className="dr-card dr-card-accent" style={{ overflow:'hidden', padding:0 }}>
        <div style={{ height:220, background:'var(--bg3)', overflow:'hidden', position:'relative' }}>
          {r.imageUrl ? <img src={r.imageUrl} alt={r.model} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.6 }} /> : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:'60px' }}>🔫</div>}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,var(--bg2) 0%,transparent 60%)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'14px', left:'16px' }}>
            <span className="dr-badge dr-badge-gold">{r.verdict}</span>
          </div>
        </div>
        <div style={{ padding:'20px' }}>
          <div className="dr-card-meta">{r.brand} · {r.caliber} · {r.category?.toUpperCase()} · ${r.msrp?.toLocaleString()}</div>
          <div className="dr-card-title" style={{ fontSize:'1.4rem', marginBottom:'6px' }}>{r.brand} {r.model}</div>
          <ScoreBar score={r.score} />
          {r.summary && <p className="dr-card-body" style={{ marginTop:'10px' }}>{r.summary.slice(0,160)}…</p>}
          <div style={{ marginTop:'14px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, color:'var(--gold)', letterSpacing:'0.1em' }}>READ FULL REVIEW →</div>
        </div>
      </div>
    </Link>
  )
  return (
    <Link href={href} style={{ display:'block', textDecoration:'none' }}>
      <div className="dr-card" style={{ display:'flex', gap:'16px', padding:'16px', alignItems:'center' }}>
        <div style={{ width:70, height:60, background:'var(--bg3)', flexShrink:0, overflow:'hidden', borderLeft:'3px solid var(--gold)' }}>
          {r.imageUrl ? <img src={r.imageUrl} alt={r.model} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.7 }} /> : <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', fontSize:'24px' }}>🔫</div>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="dr-card-meta" style={{ marginBottom:'3px' }}>{r.brand} · {r.category?.toUpperCase()}</div>
          <div className="dr-card-title" style={{ fontSize:'1rem', marginBottom:'4px' }}>{r.brand} {r.model}</div>
          <ScoreBar score={r.score} />
        </div>
        <div style={{ flexShrink:0, textAlign:'right' }}>
          <div className="dr-card-price" style={{ fontSize:'1.1rem' }}>${r.msrp?.toLocaleString()}</div>
          <span className="dr-badge dr-badge-gold" style={{ marginTop:'4px', display:'inline-flex' }}>{r.verdict}</span>
        </div>
      </div>
    </Link>
  )
}

export default async function ReviewsPage({ searchParams }) {
  const cat = searchParams?.cat || null
  const [sanityReviews, alerts] = await Promise.all([
    fetchReviews(20, cat).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])
  const reviews = sanityReviews.length > 0 ? sanityReviews : SEED_REVIEWS.filter(r => !cat || r.category === cat)
  const featured = reviews.filter(r => r.featured || r.score >= 9.3)
  const rest = reviews.filter(r => !r.featured && r.score < 9.3)

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />
      {/* ── PAGE HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>REVIEWS</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:640 }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>REVIEWS</span>
              <span style={{ background:'#1F2428', color:'#9CA3AF', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 10px', border:'1px solid #4B556340' }}>FIELD TESTED</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'14px' }}>
              Firearms &amp; Gear<br />
              <span style={{ color:'var(--gold)' }}>Tested &amp; Documented</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7 }}>
              Field-tested reviews with documented round counts. No manufacturer sponsorship, no affiliate pressure.
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY BAR (Learn pattern) ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
            {CATS.map(c => (
              <a key={c.val||'all'} href={c.val ? `/reviews?cat=${c.val}` : '/reviews'}
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${(cat===c.val||(c.val===null&&!cat))?'var(--gold)':'transparent'}`, color:(cat===c.val||(c.val===null&&!cat))?'var(--gold)':'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                {c.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">
          {/* Featured */}
          {featured.length > 0 && (
            <div style={{ marginBottom:'32px' }}>
              <h2 className="dr-section-title">Featured Reviews</h2>
              <div className="dr-grid-3" style={{ gap:'16px' }}>
                {featured.slice(0,3).map(r => <ReviewCard key={r._id} r={r} featured />)}
              </div>
            </div>
          )}

          {/* All reviews list */}
          {rest.length > 0 && (
            <div>
              <h2 className="dr-section-title">All Reviews</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {rest.map(r => <ReviewCard key={r._id} r={r} />)}
              </div>
            </div>
          )}

          <div className="dr-alert-info" style={{ marginTop:'32px' }}>
            Reviews are conducted by DownRange staff and contributors with documented round counts. We accept no manufacturer advertising or loaner arrangements that would compromise editorial independence.
            {' '}<Link href="/contribute" style={{ color:'var(--gold)' }}>Write a review for us →</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
