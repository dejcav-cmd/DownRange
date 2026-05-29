import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'Precision Shooting Hub — DownRange',
  description: 'Long-range ballistics, PRS competition, optics, and precision rifle. Data-driven and written by people who actually shoot past 500 yards.',
}

const RIFLES = [
  { name:'Tikka T3x TAC A1',             caliber:'6.5 Creedmoor', chassis:'AI-compatible', weight:'9.9 lbs', moa:'0.5 MOA', price:'$1,800', verdict:'Best value PRS entry. Sub-half-MOA at an honest price.' },
  { name:'Accuracy International AXMC',  caliber:'6.5 CM / .308 / .338 LM', chassis:'AI chassis', weight:'12.8 lbs', moa:'0.25 MOA', price:'$7,800+', verdict:'Military-grade precision. The benchmark for operational rifles.' },
  { name:'Bergara B-14 HMR',             caliber:'6.5 CM, .308', chassis:'Mini-chassis', weight:'9.6 lbs', moa:'0.5 MOA', price:'$999', verdict:'Outstanding sub-$1,000 precision. Spanish-made quality control.' },
  { name:'Christensen Arms Ridgeline',   caliber:'Multiple', chassis:'Carbon composite', weight:'6.5 lbs', moa:'0.5 MOA', price:'$1,999', verdict:'Lightest carbon-barrel precision rifle. Hunters wanting PRS performance.' },
]

const OPTICS = [
  { name:'Vortex Razor HD Gen III 1-10x24', type:'LPVO', price:'$2,499', adj:'1/8 MOA', use:'Multipurpose — PRS to tactical. Reference standard LPVO.' },
  { name:'Nightforce ATACR 5-25x56',        type:'Scope', price:'$3,200', adj:'0.1 mil', use:'PRS gold standard. US military contract. Bombproof.' },
  { name:'Leupold Mark 5HD 5-25x56',        type:'Scope', price:'$2,299', adj:'0.1 mil', use:'American-made military optic at competitive price.' },
  { name:'Applied Ballistics Kestrel 5700', type:'Wind Meter',price:'$899', adj:'N/A', use:'Standard for long-range wind calls. Pairs with AB profiles.' },
]

const DRILLS = [
  { name:'Cold Bore Shot',     desc:'Every session starts with one cold bore shot at distance without warm-up. Record elevation and windage deviation. Know your cold bore offset — it is data.' },
  { name:'Positional Practice',desc:'Shoot from 5 positions in one session: prone, sitting, kneeling, standing, barricade. PRS matches test all of them. Train them equally.' },
  { name:'Wind Reading',       desc:'5 shots at 500+ yards, record Kestrel readings and actual POI. Build your personal wind database. No solver replaces this field experience.' },
  { name:'Data Book',          desc:'Record every shot: load, distance, conditions, POI. No exceptions. Your dope book is worth more than your rifle. This is the discipline that separates good from great.' },
  { name:'Andromeda Warm-Up',  desc:'5 shots at 400m, 5 at 600m, 5 at 800m, 5 at 1,000m. Focus on position and trigger — not the target. Builds mechanical consistency across distances.' },
]

const RESOURCES = [
  { name:'Precision Rifle Series', url:'https://www.precisionrifleseries.com', desc:'Official PRS. Match calendar, standings, rulebook.' },
  { name:'Applied Ballistics',     url:'https://appliedballisticsllc.com',     desc:'Gold standard for ballistic data. Bryan Litz.' },
  { name:'Snipers Hide',           url:'https://snipershide.com',              desc:'Long-range community. Forums, training, matches.' },
]

export default function PrecisionPage() {
  return (
    <>
      <BreakingTicker alerts={alerts || []} />
      M />

      {/* ── Hero ── */}
      <div className="page-hero" data-title="PRECISION">
        <div className="container">
          <div className="dr-breadcrumb" style={{ marginBottom:'14px' }}>
            <span className="dr-breadcrumb-cur">Outdoors</span>
            <span className="dr-breadcrumb-sep">›</span>
            <span className="dr-breadcrumb-cur">Precision Shooting</span>
          </div>
          <h1 className="page-hero-title">Precision Shooting Hub</h1>
          <p className="page-hero-sub">PRS competition · Long range · Ballistics · Equipment · Training drills</p>
          <div style={{ display:'flex', gap:'8px', marginTop:'16px', flexWrap:'wrap' }}>
            {[['Hunting Hub','/hunting'],['Training & Drills','/training'],['Preparedness','/preparedness']].map(([l,h])=>(
              <Link key={h} href={h} className="dr-btn-outline" style={{ padding:'5px 14px', fontSize:'11px' }}>{l} →</Link>
            ))}
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          {/* ── Rifles ── */}
          <div className="dr-section">
            <h2 className="dr-section-title">PRS / Long Range Rifles</h2>
            <p className="dr-section-sub">Platforms used at the highest levels of precision rifle competition</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {RIFLES.map(r => (
                <div key={r.name} className="dr-card" style={{ display:'grid', gridTemplateColumns:'200px 100px 90px 90px 1fr', gap:'16px', alignItems:'center', borderLeft:'3px solid var(--gold)' }}>
                  <div>
                    <div className="dr-card-title" style={{ fontSize:'1rem' }}>{r.name}</div>
                    <div className="dr-card-meta" style={{ marginBottom:0 }}>{r.caliber}</div>
                  </div>
                  <div className="dr-stat" style={{ padding:'10px', border:'none', background:'transparent', textAlign:'center' }}>
                    <div className="dr-stat-num" style={{ fontSize:'1.3rem' }}>{r.moa}</div>
                    <div className="dr-stat-sub">guarantee</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div className="t-label-md">{r.weight}</div>
                    <div className="t-label-xs">weight</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div className="dr-card-price" style={{ fontSize:'1.2rem' }}>{r.price}</div>
                    <div className="t-label-xs">MSRP</div>
                  </div>
                  <p className="dr-card-body">{r.verdict}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Optics + drills side by side ── */}
          <div className="dr-section">
            <div className="dr-grid-2" style={{ gap:'32px' }}>
              <div>
                <h2 className="dr-section-title">Essential Optics & Tools</h2>
                <p className="dr-section-sub">What goes on top matters as much as the rifle underneath</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {OPTICS.map(o => (
                    <div key={o.name} className="dr-card" style={{ borderLeft:'3px solid var(--border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                        <div className="dr-card-title" style={{ fontSize:'0.95rem' }}>{o.name}</div>
                        <div className="dr-card-price" style={{ fontSize:'1.1rem' }}>{o.price}</div>
                      </div>
                      <div className="dr-card-meta" style={{ marginBottom:'5px' }}>{o.type} · {o.adj}</div>
                      <p className="dr-card-body">{o.use}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="dr-section-title">Training Drills</h2>
                <p className="dr-section-sub">Disciplines that separate precision from luck</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {DRILLS.map(d => (
                    <div key={d.name} className="dr-infoblock">
                      <div className="dr-infoblock-title">{d.name}</div>
                      <div className="dr-infoblock-body">{d.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Resources ── */}
          <div className="dr-section">
            <h2 className="dr-section-title">PRS & Competition Resources</h2>
            <div className="dr-grid-3">
              {RESOURCES.map(r => (
                <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className="dr-card" style={{ textDecoration:'none' }}>
                  <div className="dr-card-title" style={{ fontSize:'1rem', marginBottom:'6px' }}>{r.name}</div>
                  <p className="dr-card-body">{r.desc}</p>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
