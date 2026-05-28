import Masthead from '../../components/layout/Masthead'
import SectionSearch from '../../components/ui/SectionSearch'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Firearm Encyclopedia — DownRange',
  description: 'Complete database of firearm specs, history, variants, and buying guides. Pistols, rifles, shotguns, suppressors — every major platform covered.',
}
export const revalidate = 86400

// ── FIREARMS DATA ─────────────────────────────────────────────────────────────

const PISTOLS = [
  { slug:'glock-19',          name:'Glock 19',         caliber:'9mm Luger',      action:'Striker-fired',   capacity:'15+1',   msrp:'$499–$599',   rating:'9.6', img:'/img/photos/pistol.jpg', tagline:'The universal carry standard. Compact frame, full-size performance. Over 70 million sold globally.', role:'Duty / EDC / Home Defense' },
  { slug:'sig-p320',          name:'SIG P320',          caliber:'9mm / .357 SIG / .40 S&W', action:'Striker-fired modular', capacity:'17+1', msrp:'$499–$699', rating:'9.4', img:'/img/photos/pistol.jpg', tagline:'US Army M17/M18. Modular serialized FCU swaps frames and calibers. No external safety needed.', role:'Military / Duty / Modular' },
  { slug:'glock-43x',         name:'Glock 43X MOS',     caliber:'9mm Luger',      action:'Striker-fired',   capacity:'10+1',   msrp:'$549–$599',   rating:'9.2', img:'/img/photos/pistol.jpg', tagline:'Slim-line EDC with MOS optic cut standard. 1.1" wide. Zero malfunctions in 2,000+ round testing.', role:'Concealed Carry' },
  { slug:'cz-p10c',           name:'CZ P-10 C',          caliber:'9mm Luger',      action:'Striker-fired',   capacity:'15+1',   msrp:'$449–$549',   rating:'9.1', img:'/img/photos/pistol.jpg', tagline:'Best trigger in the striker-fired class at the price. Czech military-spec. Glock 19 competitor that wins on feel.', role:'Duty / Competition / EDC' },
  { slug:'walther-pdp',       name:'Walther PDP',        caliber:'9mm Luger',      action:'Striker-fired',   capacity:'18+1',   msrp:'$699–$749',   rating:'9.3', img:'/img/photos/pistol.jpg', tagline:'Performance Duty Pistol. Factory trigger rivals aftermarket units. Used by German SEK tactical units.', role:'Duty / Competition' },
  { slug:'springfield-hellcat', name:'Springfield Hellcat Pro', caliber:'9mm Luger', action:'Striker-fired', capacity:'15+1',  msrp:'$499–$549',   rating:'9.0', img:'/img/photos/pistol.jpg', tagline:'Highest capacity micro-compact on the market. Optics ready. Flat-faced trigger. Sub-inch width.', role:'Micro-Compact EDC' },
]

const RIFLES = [
  { slug:'ar-15',             name:'AR-15 Platform',    caliber:'5.56 NATO / .223 Rem', action:'Semi-auto gas-operated', capacity:'30+1', msrp:'$700–$2,500+', rating:'9.8', img:'/img/photos/rifle.jpg', tagline:'America\'s rifle. 15+ million owned. Modular, accurate, reliable. The most customizable platform in firearms history.', role:'Home Defense / Sport / Hunting' },
  { slug:'ak-47',             name:'AK Platform',       caliber:'7.62×39mm',      action:'Semi-auto gas-operated', capacity:'30+1', msrp:'$800–$1,800', rating:'9.5', img:'/img/photos/rifle.jpg', tagline:'100+ million produced. Loose tolerances mean legendary reliability in adverse conditions. The global standard.', role:'Home Defense / Collection' },
  { slug:'ruger-10-22',       name:'Ruger 10/22',       caliber:'.22 LR',         action:'Semi-auto blowback',     capacity:'10+1', msrp:'$279–$399',   rating:'9.4', img:'/img/photos/rifle.jpg', tagline:'The best-selling rimfire in history. 5+ million made. Enormous aftermarket. Perfect trainer and small game rifle.', role:'Training / Small Game / Plinking' },
  { slug:'daniel-defense-ddm4', name:'Daniel Defense DDM4 V7', caliber:'5.56 NATO', action:'Semi-auto DI', capacity:'30+1', msrp:'$1,999', rating:'9.4', img:'/img/photos/rifle.jpg', tagline:'Cold hammer-forged barrel. HPT/MPI-tested BCG. Sub-MOA guarantee. Used by SEAL Team Six.', role:'Duty / Home Defense' },
  { slug:'tikka-t3x',         name:'Tikka T3x Lite',    caliber:'6.5 CM / .308 / .300 WM', action:'Bolt-action', capacity:'3+1', msrp:'$699–$849', rating:'9.4', img:'/img/photos/rifle.jpg', tagline:'Sub-MOA factory guarantee. Lightest bolt-action in class. Used by professional guides on 5 continents.', role:'Hunting / Precision' },
  { slug:'remington-700',     name:'Remington 700',     caliber:'All major hunting calibers', action:'Bolt-action', capacity:'4+1', msrp:'$699–$899', rating:'9.2', img:'/img/photos/rifle.jpg', tagline:'60-year benchmark. US Marine Corps M40 sniper platform. Enormous aftermarket. The bolt-gun that all others copy.', role:'Hunting / Precision / Sniper' },
]

const SHOTGUNS = [
  { slug:'mossberg-590a1',    name:'Mossberg 590A1',    caliber:'12 Gauge',       action:'Pump-action',     capacity:'9+1',    msrp:'$649–$799',   rating:'9.1', img:'/img/photos/shotgun.jpg', tagline:'Only pump shotgun to pass US military MIL-SPEC testing. Tang safety, dual extractors, heavy-wall barrel.', role:'Military / Home Defense' },
  { slug:'benelli-m2',        name:'Benelli M2 Field',  caliber:'12 Gauge',       action:'Inertia semi-auto', capacity:'3+1',  msrp:'$1,449–$1,749', rating:'9.3', img:'/img/photos/shotgun.jpg', tagline:'Inertia-driven. No gas system to clean. Runs any load from field to 3.5" magnums. The guide gun standard.', role:'Hunting / Competition' },
  { slug:'remington-870',     name:'Remington 870',     caliber:'12 Gauge',       action:'Pump-action',     capacity:'4+1',    msrp:'$399–$549',   rating:'8.8', img:'/img/photos/shotgun.jpg', tagline:'11+ million sold since 1951. Most popular shotgun in history. Law enforcement and home defense standard.', role:'Home Defense / Hunting' },
  { slug:'benelli-supernova', name:'Benelli SuperNova', caliber:'12 Gauge',       action:'Pump-action',     capacity:'4+1',    msrp:'$549–$699',   rating:'9.0', img:'/img/photos/shotgun.jpg', tagline:'SteadyGrip stock option. Comforttech recoil reduction. Runs 3.5" magnums all day. Waterfowl specialist.', role:'Waterfowl / 3-Gun' },
]

const SUPPRESSORS = [
  { slug:'silencerco-omega-36m', name:'SilencerCo Omega 36M', caliber:'Multi-Caliber to .300 Win', action:'N/A', capacity:'N/A', msrp:'$999', rating:'9.4', img:'/img/photos/rifle.jpg', tagline:'Most versatile suppressor made. Configures short or standard. Titanium/Inconel. No $200 tax stamp since Jan 2026.', role:'Rifle / Pistol Multi-Cal' },
  { slug:'silencerco-omega-9k', name:'SilencerCo Omega 9K', caliber:'9mm / .300 BLK', action:'N/A', capacity:'N/A', msrp:'$799', rating:'9.3', img:'/img/photos/rifle.jpg', tagline:'Most compact pistol suppressor without sacrifice. 5.08" barely affects holster. Runs dirty 9mm and subsonic .300 BLK.', role:'Pistol / SBR' },
  { slug:'dead-air-sandman-s', name:'Dead Air Sandman-S', caliber:'.308 Win / 7.62mm', action:'N/A', capacity:'N/A', msrp:'$899', rating:'9.2', img:'/img/photos/rifle.jpg', tagline:'Direct-thread and QD. Full-auto rated. Handles .308 suppression at the sub-$1K price point better than anyone.', role:'Precision Rifle / Hunting' },
]

const CATEGORIES = [
  { key:'pistols',     label:'🔫 Pistols',     count: PISTOLS.length,    color:'#3B82F6' },
  { key:'rifles',      label:'◈ Rifles',       count: RIFLES.length,     color:'#22C55E' },
  { key:'shotguns',    label:'◉ Shotguns',     count: SHOTGUNS.length,   color:'#F97316' },
  { key:'suppressors', label:'◎ Suppressors',  count: SUPPRESSORS.length, color:'#C8922A' },
]

const ALL_ITEMS = {
  pistols:     PISTOLS,
  rifles:      RIFLES,
  shotguns:    SHOTGUNS,
  suppressors: SUPPRESSORS,
}

function GunCard({ g, featured = false }) {
  const href = `/guns/${g.slug}`

  if (featured) {
    return (
      <Link href={href} style={{ textDecoration:'none', display:'block', position:'relative', overflow:'hidden' }}>
        <div style={{ height:'440px', position:'relative', overflow:'hidden' }}>
          <img src={g.img} alt={g.name}
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }}
            className="learn-card-img" />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.96) 0%, rgba(9,9,11,0.3) 60%, transparent 100%)' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'28px' }}>
            <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', padding:'2px 10px' }}>{g.role.split('/')[0].trim().toUpperCase()}</span>
              <span style={{ background:'rgba(0,0,0,0.6)', color:'#9CA3AF', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', padding:'2px 8px', border:'1px solid rgba(255,255,255,0.1)' }}>{g.caliber}</span>
            </div>
            <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'#F0EDE6', letterSpacing:'0.03em', lineHeight:1.05, marginBottom:8 }}>{g.name}</h3>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'rgba(240,237,230,0.65)', lineHeight:1.5, marginBottom:14, maxWidth:480 }}>{g.tagline}</p>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.05em' }}>{g.rating}<span style={{ fontSize:'0.8rem', color:'#6B7280' }}>/10</span></div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280' }}>{g.msrp}</div>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, color:'var(--gold)', letterSpacing:'0.1em', marginLeft:'auto' }}>FULL PROFILE →</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={href} style={{ textDecoration:'none', display:'block', position:'relative', overflow:'hidden' }}>
      <div style={{ height:'260px', position:'relative', overflow:'hidden' }} className="gun-card">
        <img src={g.img} alt={g.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }}
          className="learn-card-img" />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.93) 0%, rgba(9,9,11,0.25) 60%, transparent 100%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.5)', letterSpacing:'0.1em' }}>{g.caliber} · {g.action}</span>
          </div>
          <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'17px', fontWeight:700, color:'#F0EDE6', lineHeight:1.2, marginBottom:3 }}>{g.name}</h3>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'rgba(240,237,230,0.5)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{g.tagline}</p>
        </div>
        <div style={{ position:'absolute', top:10, right:10, background:'rgba(9,9,11,0.75)', fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', color:'var(--gold)', padding:'2px 8px', letterSpacing:'0.05em', border:'1px solid rgba(200,146,42,0.3)' }}>{g.rating}</div>
      </div>
    </Link>
  )
}

export default async function GunsPage({ searchParams }) {
  const cat  = searchParams?.cat  || null
  const sort = searchParams?.sort || 'rating'
  const q    = searchParams?.q    || null

  // Filter and sort items
  function filterAndSort(items) {
    let result = [...items]
    if (q) {
      const qL = q.toLowerCase()
      result = result.filter(item =>
        (item.name||'').toLowerCase().includes(qL) ||
        (item.caliber||'').toLowerCase().includes(qL) ||
        (item.tagline||'').toLowerCase().includes(qL) ||
        (item.role||'').toLowerCase().includes(qL)
      )
    }
    if (sort === 'rating') result.sort((a,b) => parseFloat(b.rating||0) - parseFloat(a.rating||0))
    else if (sort === 'alpha') result.sort((a,b) => (a.name||'').localeCompare(b.name||''))
    else if (sort === 'price') result.sort((a,b) => (parseInt((a.msrp||'0').replace(/[^0-9]/g,''))||0) - (parseInt((b.msrp||'0').replace(/[^0-9]/g,''))||0))
    return result
  }

  const currentItems = filterAndSort(cat ? (ALL_ITEMS[cat] || []) : [])
  const allFeatured  = [...PISTOLS.slice(0,1), ...RIFLES.slice(0,1), ...SHOTGUNS.slice(0,1)]

  return (
    <>
      <Masthead />

      {/* ── HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>GUNS</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:640 }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>ENCYCLOPEDIA</span>
              <span style={{ background:'#1F2428', color:'#9CA3AF', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 10px', border:'1px solid #4B556340' }}>
                {Object.values(ALL_ITEMS).reduce((s,a) => s + a.length, 0)} PLATFORMS
              </span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'14px' }}>
              Every Major Platform<br />
              <span style={{ color:'var(--gold)' }}>Specs, History &amp; Variants</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7, maxWidth:520 }}>
              Comprehensive profiles on pistols, rifles, shotguns, and suppressors. Calibers, action types, capacity, MSRP, and the honest verdict.
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY + SORT + SEARCH BAR ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'stretch', overflowX:'auto' }}>
            {/* Category tabs */}
            <div style={{ display:'flex', gap:0, flex:1, overflowX:'auto' }}>
              <a href="/guns"
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${!cat?'var(--gold)':'transparent'}`, color:!cat?'var(--gold)':'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                All ({Object.values(ALL_ITEMS).reduce((s,a) => s + a.length, 0)})
              </a>
              {CATEGORIES.map(c => (
                <a key={c.key} href={'/guns?' + new URLSearchParams({ cat:c.key, ...(q&&{q}), ...(sort!=='rating'&&{sort}) }).toString()}
                  style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${cat===c.key?c.color:'transparent'}`, color:cat===c.key?c.color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                  {c.label}
                </a>
              ))}
              <a href="/guns/compare"
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em' }}>
                ⚖ Compare →
              </a>
            </div>
            {/* Sort */}
            <div style={{ display:'flex', gap:'5px', alignItems:'center', padding:'0 8px', borderLeft:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>SORT:</span>
              {[['rating','★ Rating'],['alpha','🔤 A–Z'],['price','💰 Price']].map(([key,label]) => (
                <a key={key} href={'/guns?' + new URLSearchParams({ ...(cat&&{cat}), ...(q&&{q}), sort:key }).toString()}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'4px 10px', border:'1px solid var(--border)', color:sort===key?'#C8922A':'#4B5563', textDecoration:'none', background:sort===key?'#C8922A20':'transparent' }}>
                  {label}
                </a>
              ))}
            </div>
            {/* Search */}
            <div style={{ flexShrink:0, padding:'0 0 0 8px', borderLeft:'1px solid var(--border)', display:'flex', alignItems:'center' }}>
              <SectionSearch type="firearmRelease" placeholder="Search platforms…" defaultValue={q||''} compact />
            </div>
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          <style>{`
            .tool-link:hover { border-color: var(--gold) !important; }
            .learn-card-img:hover { transform: scale(1.04); }
            .gun-card:hover .learn-card-img { transform: scale(1.04); }
          `}</style>

          {/* ── ALL VIEW: Featured mosaic + section grids ── */}
          {!cat && (
            <>
              {/* Featured mosaic */}
              <div style={{ marginBottom:52 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
                  <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>Flagship Platforms</h2>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>EDITOR PICKS</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:3 }}>
                  <GunCard g={PISTOLS[0]} featured />
                  <div style={{ display:'flex', flexDirection:'column', gap:3, gridColumn:'2 / span 2' }}>
                    {[RIFLES[0], SHOTGUNS[0]].map(g => (
                      <div key={g.slug} style={{ flex:1 }}>
                        <GunCard g={g} featured />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Each category preview */}
              {CATEGORIES.map(cat => {
                const items = ALL_ITEMS[cat.key]
                return (
                  <div key={cat.key} style={{ marginBottom:48 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                      <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                        <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>{cat.label}</h2>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>{items.length} PLATFORMS</span>
                      </div>
                      <a href={`/guns?cat=${cat.key}`} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)', textDecoration:'none', letterSpacing:'0.05em' }}>VIEW ALL →</a>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:3 }}>
                      {items.slice(0,4).map(g => <GunCard key={g.slug} g={g} />)}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* ── CATEGORY VIEW ── */}
          {cat && currentItems.length > 0 && (
            <>
              {/* Featured first item */}
              <div style={{ marginBottom:32 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
                  <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>
                    {CATEGORIES.find(c=>c.key===cat)?.label}
                  </h2>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>{currentItems.length} PLATFORMS</span>
                </div>
                <div style={{ marginBottom:3 }}>
                  <GunCard g={currentItems[0]} featured />
                </div>
              </div>

              {/* Grid of rest */}
              {currentItems.length > 1 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:3 }}>
                  {currentItems.slice(1).map(g => <GunCard key={g.slug} g={g} />)}
                </div>
              )}
            </>
          )}

          {/* ── QUICK-ACCESS TOOLS ── */}
          <div style={{ marginTop:52, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:12 }}>
            {[
              { label:'⚖ Compare Guns',     href:'/compare/glock-19-vs-sig-p320', desc:'AI head-to-head specs' },
              { label:'$ Value Estimator',   href:'/value-estimator',              desc:'What is your gun worth?' },
              { label:'🔫 Holster Finder',   href:'/holsters/glock-19',            desc:'IWB/OWB by model' },
              { label:'⚙ NFA Tracker',       href:'/nfa-tracker',                  desc:'Form 4 wait times' },
              { label:'🔖 New Releases',     href:'/releases',                     desc:'Latest launches' },
              { label:'📚 Ammo Guide',       href:'/ammo/9mm',                     desc:'9mm, 5.56, .308 & more' },
            ].map(t => (
              <Link key={t.href} href={t.href} className="tool-link"
                style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'18px 20px', textDecoration:'none', display:'block', transition:'border-color 0.2s' }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'16px', fontWeight:700, color:'var(--text)', marginBottom:4 }}>{t.label}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)' }}>{t.desc}</div>
              </Link>
            ))}
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
