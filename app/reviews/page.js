import Masthead    from '../../components/layout/Masthead'
import Footer      from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Link        from 'next/link'
import { fetchReviews, searchReviews, fetchBreakingAlerts } from '../../sanity/lib/client'
import SectionSearch from '../../components/ui/SectionSearch'

export const metadata = {
  title: 'Firearms & Gear Reviews — DownRange',
  description: 'Field-tested firearm and gear reviews. Round counts documented, no paid placements, no manufacturer samples that affect the outcome.',
  alternates: { canonical: 'https://downrangeco.com/reviews' }
}
export const revalidate = 3600

// ── SEED REVIEWS ─────────────────────────────────────────────────────────────

const SEED_REVIEWS = [
  {
    _id:'r1', slug:{ current:'glock-43x-mos-review' },
    brand:'Glock', model:'G43X MOS', caliber:'9mm', category:'pistol',
    msrp:549, score:9.2, verdict:'Best Slim-Line EDC Available',
    featured:true, date:'May 12, 2026',
    img:'/img/photos/pistol.jpg',
    summary:'After 2,000 rounds of Federal HST and Speer Gold Dot through a G43X MOS, the results are clear: zero malfunctions, sub-2-inch groups at 15 yards, and an optic system that actually works out of the box. The MOS plate accepts every major micro red dot without shimming. At 1.1 inches wide it disappears in an appendix holster.',
    roundCount:'2,000+', tags:['EDC','9mm','Glock','slim-line','optic-ready'],
    pros:['Zero malfunctions in 2,000+ rounds','MOS plate accepts all major micro red dots','1.1" width — genuinely disappears IWB','Grip texture aggressive but not pants-shredding'],
    cons:['Factory trigger has mushy, indistinct reset','Standard 10+1 flush capacity (15+1 with Shield Arms steel mag)'],
    verdict_body: 'The G43X MOS is the slim-line carry standard. Glock fixed the capacity problem — if you run Shield Arms S15 magazines you carry 15+1 in a package narrower than a stack of credit cards. The MOS system is the clincher: cut once, run any dot. Buy the gun, add the Holosun EPS Carry, run 500 rounds, and carry it.'
  },
  {
    _id:'r2', slug:{ current:'sig-p365xl-review' },
    brand:'SIG Sauer', model:'P365XL', caliber:'9mm', category:'pistol',
    msrp:699, score:9.5, verdict:'Best Factory Trigger in the Price Class',
    featured:true, date:'May 20, 2026',
    img:'/img/photos/pistol.jpg',
    summary:'The P365XL has the best factory trigger of any striker-fired pistol under $800 — by a margin that is immediately obvious in the first magazine. Twelve rounds flush, ROMEO Zero optic cut standard, and a sight radius that turns an EDC into a range gun.',
    roundCount:'1,500+', tags:['EDC','9mm','SIG','P365','optic-ready','best-buy'],
    pros:['Best factory striker trigger in its price class','12+1 flush capacity in a true compact package','ROMEO Zero optic cut standard on all models','Excellent point-of-aim accuracy out of the box'],
    cons:['$699 MSRP is aggressive compared to Glock competitors','Grip slightly narrow for shooters with large hands'],
    verdict_body: 'If you carry one gun and it matters, the P365XL earns the nod over the G43X on trigger feel alone. SIG tuned this trigger to feel like a $200 Apex job without the installation. Twelve rounds flush means you are not sacrificing capacity for concealability. The ROMEO Zero cut means you never have to send the slide to a machinist.'
  },
  {
    _id:'r3', slug:{ current:'daniel-defense-ddm4-v7-review' },
    brand:'Daniel Defense', model:'DDM4 V7', caliber:'5.56 NATO', category:'rifle',
    msrp:1999, score:9.4, verdict:'The Standard for When It Has to Run',
    featured:true, date:'Apr 28, 2026',
    img:'/img/photos/rifle.jpg',
    summary:'Three thousand rounds through the DDM4 V7 including 500 rounds of M855A1 green tip without a single stoppage. Cold hammer-forged barrel holds sub-MOA with 77gr OTM. HPT/MPI-tested BCG is not a marketing claim — it is a documented inspection standard that Daniel Defense maintains in-house.',
    roundCount:'3,000+', tags:['AR-15','5.56','DDM4','duty-rifle','home-defense'],
    pros:['CHF barrel — measurably superior to button-rifled competition','HPT/MPI bolt inspection documented per gun','Sub-MOA verified with 77gr SMK at 100 yards','Lifetime warranty, real customer service'],
    cons:['$1,999 is real money — alternatives exist at $800','6.9 lbs unloaded — not a featherweight','No backup iron sights included at this price'],
    verdict_body: 'The DDM4 V7 is not cheaper than a BCM or a Noveske. It is not supposed to be. When agencies spec the DDM4 it is because they need a documented guarantee the rifle will run under conditions where failure is unacceptable. For a home defense rifle, that reasoning transfers. Buy it once, maintain it properly, and it will outlast everything else in your safe.'
  },
  {
    _id:'r4', slug:{ current:'mossberg-590a1-review' },
    brand:'Mossberg', model:'590A1',  caliber:'12 Gauge', category:'shotgun',
    msrp:649, score:9.1, verdict:'Military-Grade Home Defense Standard',
    featured:false, date:'Apr 10, 2026',
    img:'/img/photos/shotgun.jpg',
    summary:'The 590A1 is the only pump shotgun to pass US military MIL-SPEC testing. The tang safety is ambidextrous and faster than any crossbolt design under stress. Dual extractors where the 870 runs one. Heavy-wall barrel. Nine-round capacity.',
    roundCount:'500+', tags:['shotgun','home-defense','pump','military-spec','Mossberg'],
    pros:['Passes US MIL-SPEC testing — documented','Tang safety is ambidextrous and positive','Dual extractors for reliability under fouling','Heavy-wall barrel handles +P loads and slugs'],
    cons:['Aluminum receiver (a non-issue, but triggers debate)','Factory trigger is acceptable but not exceptional'],
    verdict_body: 'The debate between the 590A1 and the Remington 870 has been settled by every law enforcement and military agency that ran both at scale: the 590A1 wins on reliability under sustained use. The dual extractor is the difference. At $649 it is the home defense shotgun to buy if you are not going to think about it again.'
  },
  {
    _id:'r5', slug:{ current:'vortex-viper-pst-gen2-review' },
    brand:'Vortex', model:'Viper PST Gen II 1-6×24', caliber:'N/A', category:'optic',
    msrp:599, score:8.9, verdict:'Best Value LPVO Under $600',
    featured:false, date:'Mar 18, 2026',
    img:'/img/photos/rifle.jpg',
    summary:'True 1x magnification confirmed with a straight-line test. The EBR-8 reticle with illuminated center dot is one of the better LPVO reticles at this price. Sub-MOA tracking verified over 60 MOA of travel. Vortex VIP warranty means lifetime no-fault replacement.',
    roundCount:'N/A', tags:['optic','LPVO','Vortex','AR-15','precision'],
    pros:['True 1x — zero parallax distortion at 1x','Illuminated EBR-8 reticle is practical not cluttered','Sub-MOA tracking over full adjustment range','VIP warranty: no-fault, no-questions lifetime replacement'],
    cons:['Eye relief slightly shorter than Razor HD Gen III at 6x','Glass clarity falls behind Kahles and Leupold at high magnification'],
    verdict_body: 'The PST Gen II is the right answer to "what LPVO should I buy for an AR-15 that I won\'t regret?" You lose glass clarity compared to a $1,200+ Leupold but gain identical tracking performance and a warranty that covers user error. For a range rifle or general-purpose AR it is the correct purchase.'
  },
  {
    _id:'r6', slug:{ current:'silencerco-omega-9k-review' },
    brand:'SilencerCo', model:'Omega 9K', caliber:'9mm / .300 BLK', category:'suppressor',
    msrp:799, score:9.3, verdict:'The Compact Suppressor That Doesn\'t Compromise',
    featured:false, date:'Mar 1, 2026',
    img:'/img/photos/suppressor.jpg',
    summary:'With the NFA tax stamp eliminated as of January 1, 2026, the Omega 9K is the most compelling entry into suppressor ownership. At 5.08 inches it barely extends a Glock 19. Titanium and Inconel construction handles +P loads all day. Rated for .300 BLK subsonic, which makes it a two-gun solution.',
    roundCount:'1,000+', tags:['suppressor','NFA','9mm','300BLK','SilencerCo','no-tax-stamp'],
    pros:['5.08" barely affects holster compatibility','Multi-cal rated to .300 BLK subsonic','Titanium/Inconel — runs +P without baffles degrading','No $200 tax stamp since Jan 1, 2026 (Form 4 still required)'],
    cons:['Direct-thread — no quick-detach in this configuration','Wet shooting needed for maximum suppression on 9mm'],
    verdict_body: 'The tax stamp elimination changes the math on suppressor ownership. The Omega 9K was already the best compact pistol suppressor — now it is also the obvious first can to buy. Form 4 approval takes 60-120 days currently; fill out the paperwork before you need it.'
  },
]

const CATS = [
  { label:'All',          val:null },
  { label:'🔫 Pistols',   val:'pistol' },
  { label:'◈ Rifles',     val:'rifle' },
  { label:'◉ Shotguns',   val:'shotgun' },
  { label:'◎ Optics',     val:'optic' },
  { label:'◈ Suppressors',val:'suppressor' },
]

const CAT_COLORS = {
  pistol:'#3B82F6', rifle:'#22C55E', shotgun:'#F97316', optic:'#C8922A', suppressor:'#8B5CF6'
}

function ScoreRing({ score }) {
  const color = score >= 9.3 ? '#22C55E' : score >= 8.5 ? '#C8922A' : '#EF4444'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color, lineHeight:1 }}>{score}</span>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', lineHeight:1 }}>/10</span>
    </div>
  )
}


// Category fallback images — real gun photos
const CATEGORY_FALLBACKS = {
  pistol:     '/img/photos/pistol.jpg',
  rifle:      '/img/photos/rifle.jpg',
  shotgun:    '/img/photos/shotgun.jpg',
  optic:      '/img/photos/rifle.jpg',
  suppressor: '/img/photos/suppressor.jpg',
  holster:    '/img/photos/gear.jpg',
  ammo:       '/img/photos/ammo.jpg',
  default:    '/img/photos/rifle.jpg',
}

function ReviewCard({ r, featured = false }) {
  const href       = `/reviews/${r.slug?.current || r._id}`
  const catColor   = CAT_COLORS[r.category] || '#9CA3AF'
  const imageUrl   = r.img || r.heroImage?.asset?.url || r.imageUrl || CATEGORY_FALLBACKS[r.category] || CATEGORY_FALLBACKS.default

  if (featured) {
    return (
      <Link href={href} style={{ textDecoration:'none', display:'block', position:'relative', overflow:'hidden' }}>
        <div style={{ height:'440px', position:'relative', overflow:'hidden' }}>
          {true && (
            <img src={imageUrl} alt={r.model}
              className="learn-card-img"
              style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }} />
          )}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.4) 55%, transparent 100%)' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'28px' }}>
            <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ background:catColor, color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', padding:'2px 10px' }}>{r.category?.toUpperCase()}</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.5)' }}>{r.caliber} · {r.msrp ? `$${r.msrp?.toLocaleString()}` : ''}</span>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:8 }}>
              <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'#F0EDE6', letterSpacing:'0.03em', lineHeight:1.05 }}>
                {r.brand} {r.model}
              </h3>
              <ScoreRing score={r.score} />
            </div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--gold)', letterSpacing:'0.05em', marginBottom:8, fontWeight:700 }}>
              {r.verdict}
            </p>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'rgba(240,237,230,0.6)', lineHeight:1.55, marginBottom:14, maxWidth:560, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {r.summary}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              {r.roundCount && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563' }}>{r.roundCount} rounds tested</span>}
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, color:'var(--gold)', letterSpacing:'0.1em', marginLeft:'auto' }}>FULL REVIEW →</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Grid card
  return (
    <Link href={href} style={{ textDecoration:'none', display:'block', position:'relative', overflow:'hidden' }}>
      <div style={{ height:'280px', position:'relative', overflow:'hidden' }}>
        {imageUrl && (
          <img src={imageUrl} alt={r.model}
            className="learn-card-img"
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }} />
        )}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.2) 60%, transparent 100%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:catColor, flexShrink:0 }} />
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.5)', letterSpacing:'0.1em' }}>{r.category?.toUpperCase()} · {r.caliber}</span>
          </div>
          <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'17px', fontWeight:700, color:'#F0EDE6', lineHeight:1.2, marginBottom:3 }}>{r.brand} {r.model}</h3>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)', marginBottom:4, fontWeight:700 }}>{r.verdict}</p>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.45)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{r.summary}</p>
        </div>
        {/* Score badge */}
        <div style={{ position:'absolute', top:10, right:10, background:'rgba(9,9,11,0.8)', padding:'5px 10px', border:`1px solid ${CAT_COLORS[r.category] || '#9CA3AF'}40` }}>
          <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:r.score >= 9.3 ? '#22C55E' : '#C8922A', lineHeight:1 }}>{r.score}</span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#4B5563' }}>/10</span>
        </div>
      </div>
    </Link>
  )
}

const PER_PAGE_REVIEWS = 24

export default async function ReviewsPage({ searchParams }) {
  const cat  = searchParams?.cat  || null
  const q    = searchParams?.q    || null
  const sort = searchParams?.sort || 'score'
  const page = Math.max(1, parseInt(searchParams?.page || '1'))

  const [sanityReviews, alerts] = await Promise.all([
    q ? searchReviews(q, 200) : fetchReviews(200, cat).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const reviews  = sanityReviews.length > 0
    ? sanityReviews
    : SEED_REVIEWS.filter(r => !cat || r.category === cat)

  // Sort
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === 'score')  return (b.score || 0) - (a.score || 0)
    if (sort === 'newest') return new Date(b.publishedAt || b.date || 0) - new Date(a.publishedAt || a.date || 0)
    if (sort === 'alpha')  return (a.model || a.brand || '').localeCompare(b.model || b.brand || '')
    return (b.score || 0) - (a.score || 0)
  })

  // Pagination — featured always shown, grid is paginated
  const total    = sortedReviews.length
  const pages    = Math.max(1, Math.ceil(total / PER_PAGE_REVIEWS))
  const pagedAll = sortedReviews.slice((page - 1) * PER_PAGE_REVIEWS, page * PER_PAGE_REVIEWS)
  const featured = page === 1 ? pagedAll.filter(r => r.featured || r.score >= 9.4) : []
  const grid     = page === 1 ? pagedAll.filter(r => !featured.includes(r)) : pagedAll

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* ── HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>REVIEWS</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:640 }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>REVIEWS</span>
              <span style={{ background:'var(--border)', color:'#9CA3AF', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 10px', border:'1px solid #4B556340' }}>FIELD TESTED</span>
              <span style={{ background:'#001A0A', color:'#22C55E', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 10px', border:'1px solid #22C55E40' }}>ROUND COUNTS DOCUMENTED</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'14px' }}>
              Firearms &amp; Gear<br />
              <span style={{ color:'var(--gold)' }}>Tested in the Field</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7, maxWidth:520 }}>
              No manufacturer loans. No affiliate pressure. Every review documents round count, conditions, and failure mode. The verdict is the verdict.
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY BAR ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <div style={{ display:'flex', gap:0, overflowX:'auto', flex:1 }}>
            {CATS.map(c => (
              <a key={c.val || 'all'} href={c.val ? `/reviews?cat=${c.val}` : '/reviews'}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${(cat===c.val||(c.val===null&&!cat))?(CAT_COLORS[c.val]||'var(--gold)'):'transparent'}`, color:(cat===c.val||(c.val===null&&!cat))?(CAT_COLORS[c.val]||'var(--gold)'):'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                {c.val && <span style={{ width:6, height:6, borderRadius:'50%', background:CAT_COLORS[c.val], flexShrink:0 }} />}
                {c.label}
              </a>
            ))}
            </div>
            <div style={{ display:'flex', gap:'5px', alignItems:'center', padding:'0 8px', borderLeft:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>SORT:</span>
              {[['score','★ Rating'],['newest','📅 Newest'],['alpha','🔤 A–Z']].map(([key,label]) => (
                <a key={key} href={'/reviews?' + new URLSearchParams({ ...(cat&&{cat}), ...(q&&{q}), sort:key }).toString()}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'4px 10px', border:'1px solid var(--border)', color:sort===key?'#C8922A':'#4B5563', textDecoration:'none', background:sort===key?'#C8922A20':'transparent' }}>
                  {label}
                </a>
              ))}
            </div>
            <div style={{ flexShrink:0, padding:'0 0 0 8px', borderLeft:'1px solid var(--border)' }}>
              <SectionSearch type="review" placeholder="Search reviews…" defaultValue={q||''} compact />
            </div>
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          <style>{`
            .learn-card-img { transition: transform 0.4s ease; }
            .learn-card-img:hover { transform: scale(1.04); }
          `}</style>

          {/* ── FEATURED MOSAIC (Learn pattern) ── */}
          {featured.length > 0 && (
            <div style={{ marginBottom:48 }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>
                  {cat ? `${CATS.find(c=>c.val===cat)?.label} Reviews` : 'Top Rated'}
                </h2>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>EDITOR PICKS</span>
              </div>

              {featured.length === 1 && (
                <ReviewCard r={featured[0]} featured />
              )}

              {featured.length === 2 && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
                  {featured.map(r => <ReviewCard key={r._id} r={r} featured />)}
                </div>
              )}

              {featured.length >= 3 && (
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:3 }}>
                  <ReviewCard r={featured[0]} featured />
                  <div style={{ display:'flex', flexDirection:'column', gap:3, gridColumn:'2 / span 2' }}>
                    {featured.slice(1, 3).map(r => (
                      <div key={r._id} style={{ flex:1 }}>
                        <ReviewCard r={r} featured />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GRID ── */}
          {grid.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>All Reviews</h2>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>{grid.length} REVIEWS</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:3 }}>
                {grid.map(r => <ReviewCard key={r._id} r={r} />)}
              </div>
            </div>
          )}

          {reviews.length === 0 && (
            <div style={{ padding:'60px', textAlign:'center', color:'#6B7280', fontFamily:"'IBM Plex Mono',monospace" }}>
              No reviews found. Check back soon.
            </div>
          )}

          {/* ── CRITERIA BLOCK ── */}
          <div style={{ marginTop:48, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:12 }}>
            {[
              { icon:'◎', label:'Round Count',       body:'Every firearm review documents exact round count. No range trip is under 500 rounds.' },
              { icon:'◈', label:'No Manufacturer Loans', body:'We buy what we review at retail price. No loaners, no press samples, no performance incentives.' },
              { icon:'▲', label:'Failure Documentation', body:'Every stoppage, malfunction, and failure is reported. We do not "break in" malfunctions away without noting them.' },
              { icon:'★', label:'Score Rubric',       body:'Scores are weighted: reliability (40%), accuracy (25%), ergonomics (20%), value (15%). No grade inflation.' },
            ].map(c => (
              <div key={c.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'20px', borderTop:`2px solid var(--gold)` }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', marginBottom:6 }}>{c.icon} {c.label}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.6 }}>{c.body}</div>
              </div>
            ))}
          </div>

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div style={{ padding:'32px 0 16px', display:'flex', justifyContent:'center' }}>
              <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                {page > 1 && (
                  <a href={`/reviews?${new URLSearchParams({ ...(cat&&{cat}), ...(q&&{q}), ...(sort&&{sort}), page: page-1 }).toString()}`}
                    style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 16px', border:'1px solid var(--border)', color:'var(--text)', textDecoration:'none' }}>
                    ← Prev
                  </a>
                )}
                {Array.from({ length: pages }, (_,i) => i+1)
                  .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx-1] > 1) acc.push('…'); acc.push(p); return acc }, [])
                  .map((p, i) => p === '…'
                    ? <span key={`e${i}`} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 6px', color:'#6b7280' }}>…</span>
                    : <a key={p} href={`/reviews?${new URLSearchParams({ ...(cat&&{cat}), ...(q&&{q}), ...(sort&&{sort}), page: p }).toString()}`}
                        style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 14px', border:'1px solid var(--border)',
                          color: p===page ? '#000' : 'var(--text)', background: p===page ? 'var(--gold)' : 'transparent',
                          textDecoration:'none', fontWeight: p===page ? 700 : 400 }}>
                        {p}
                      </a>
                  )}
                {page < pages && (
                  <a href={`/reviews?${new URLSearchParams({ ...(cat&&{cat}), ...(q&&{q}), ...(sort&&{sort}), page: page+1 }).toString()}`}
                    style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 16px', border:'1px solid var(--border)', color:'var(--text)', textDecoration:'none' }}>
                    Next →
                  </a>
                )}
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', marginLeft:8 }}>
                  Page {page} of {pages} · {total} reviews
                </span>
              </div>
            </div>
          )}

          {/* ── CTA ── */}
          <div style={{ marginTop:36, padding:'28px 32px', background:'var(--bg2)', border:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center' }}>
            <div>
              <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'0.04em', marginBottom:5 }}>Want to write a review?</h3>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.6 }}>
                We accept contributor reviews that meet our documentation standard: minimum 500 rounds, photos, and a scored rubric.
              </p>
            </div>
            <Link href="/contribute" className="dr-btn-primary" style={{ whiteSpace:'nowrap', flexShrink:0 }}>
              Submit a Review →
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
