import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Precision Shooting — DownRange', description: 'Long-range shooting guides, PRS competition, ballistics calculators, and precision rifle recommendations.' }

const PRS_RIFLES = [
  { name:'Tikka T3x TAC A1', caliber:'6.5 Creedmoor', chassis:'AI-compatible', weight:'9.9 lbs', moa:'0.5', price:'$1,800', verdict:'Best value PRS entry. Sub-half-MOA at a price that doesn\'t require a second mortgage.' },
  { name:'Accuracy International AXMC', caliber:'6.5 CM / .308 / .338 Lapua', chassis:'AI chassis', weight:'12.8 lbs', moa:'0.25', price:'$7,800+', verdict:'Military-grade precision. Used by special operations worldwide. The benchmark.' },
  { name:'Bergara B-14 HMR', caliber:'6.5 CM, .308', chassis:'Mini-chassis', weight:'9.6 lbs', moa:'0.5', price:'$999', verdict:'Outstanding sub-$1,000 precision package. Spanish-made quality.' },
  { name:'Christensen Arms Ridgeline', caliber:'Multiple', chassis:'Carbon composite', weight:'6.5 lbs', moa:'0.5', price:'$1,999', verdict:'Lightest carbon-barreled precision rifle. For hunters who want PRS performance.' },
]

const OPTICS = [
  { name:'Vortex Razor HD Gen III 1-10x24', type:'LPVO', price:'$2,499', moa:'1/8 MOA', use:'Multipurpose — PRS to tactical. The reference standard LPVO.' },
  { name:'Nightforce ATACR 5-25x56', type:'Scope', price:'$3,200', moa:'0.1 mil', use:'PRS Gold standard. US military contract. Bombproof.' },
  { name:'Applied Ballistics Kestrel 5700', type:'Wind Meter + Solver', price:'$899', moa:'N/A', use:'The standard for long-range wind calls. Pairs with AB scope profiles.' },
  { name:'Leupold Mark 5HD 5-25x56', type:'Scope', price:'$2,299', moa:'0.1 mil', use:'American-made military optic at competitive price.' },
]

const DRILLS = [
  { name:'Positional Practice', desc:'Shoot from 5 different positions in one range session: prone, sitting, kneeling, standing, and barricade. PRS matches will test all of them.' },
  { name:'Cold Bore Shot', desc:'Every session starts with a cold bore shot at distance without any warm-up. Record elevation and windage deviation. Know your cold bore offset.' },
  { name:'Wind Reading Practice', desc:'Shoot a 5-shot group at 500+ yards, record Kestrel readings and actual point of impact. Build your personal wind database.' },
  { name:'Data Book Maintenance', desc:'Record every single shot — load, distance, conditions, point of impact. No exceptions. Your dope book is worth more than your rifle.' },
  { name:'Andromeda (400m ELR Warm-up)', desc:'5 shots at 400m, 5 at 600m, 5 at 800m, 5 at 1,000m. Focus on position and trigger, not the target. Builds mechanical consistency.' },
]

export default function PrecisionPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="PRECISION">
        <div className="container">
          <h1 className="page-hero-title">Precision Shooting Hub</h1>
          <p className="page-hero-sub">PRS · Long range · Ballistics · Equipment · Training</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <div style={{ display:'flex', gap:'8px', marginBottom:'32px' }}>
            {[['Hunting','/hunting'],['Precision Shooting','/precision']].map(([l,h])=>(
              <Link key={h} href={h} style={{ fontFamily:'monospace', fontSize:'12px', padding:'8px 18px', border:'1px solid #1F2428', color: h==='/precision'?'#C8922A':'#4B5563', background: h==='/precision'?'#C8922A20':'transparent', textDecoration:'none' }}>{l}</Link>
            ))}
          </div>

          {/* Rifles */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>PRS / LONG RANGE RIFLES</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'40px' }}>
            {PRS_RIFLES.map(r=>(
              <div key={r.name} style={{ background:'#111318', border:'1px solid #1F2428', padding:'18px 22px', display:'grid', gridTemplateColumns:'200px repeat(4,90px) 1fr', gap:12, alignItems:'center' }}>
                <div>
                  <div style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:'#F0EDE6', marginBottom:'2px' }}>{r.name}</div>
                  <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#C8922A' }}>{r.caliber}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'12px', color:'#F0EDE6' }}>{r.weight}</div>
                  <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563' }}>weight</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'14px', color:'#34D399', fontWeight:700 }}>{r.moa}</div>
                  <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563' }}>MOA guarantee</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#C8922A' }}>{r.price}</div>
                  <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563' }}>MSRP</div>
                </div>
                <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563' }}>{r.chassis} chassis</div>
                <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B7280', lineHeight:1.5 }}>{r.verdict}</p>
              </div>
            ))}
          </div>

          {/* Optics + training */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px' }}>
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>ESSENTIAL OPTICS & TOOLS</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {OPTICS.map(o=>(
                  <div key={o.name} style={{ background:'#111318', border:'1px solid #1F2428', padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                      <span style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#F0EDE6' }}>{o.name}</span>
                      <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1rem', color:'#C8922A' }}>{o.price}</span>
                    </div>
                    <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563', marginBottom:'4px' }}>{o.type} · {o.moa}</div>
                    <p style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', lineHeight:1.5 }}>{o.use}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>TRAINING DRILLS</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {DRILLS.map(d=>(
                  <div key={d.name} style={{ background:'#111318', border:'1px solid #1F2428', borderLeft:'3px solid #C8922A', padding:'12px 14px' }}>
                    <div style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#F0EDE6', marginBottom:'4px' }}>{d.name}</div>
                    <p style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', lineHeight:1.6 }}>{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PRS resources */}
          <div style={{ marginTop:'40px', background:'#111318', border:'1px solid #1F2428', padding:'24px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>PRS & COMPETITION RESOURCES</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
              {[
                { name:'Precision Rifle Series', url:'https://www.precisionrifleseries.com', desc:'Official PRS website. Match calendar, standings, rulebook.' },
                { name:'Applied Ballistics', url:'https://appliedballisticsllc.com', desc:'The gold standard for ballistic data and solver software. Bryan Litz.' },
                { name:'Sniper\'s Hide', url:'https://snipershide.com', desc:'Long-range shooting community. Forums, training, match reports.' },
              ].map(r=>(
                <a key={r.name} href={r.url} target="_blank" rel="noreferrer" style={{ background:'#0D1117', border:'1px solid #1F2428', padding:'14px', textDecoration:'none' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#F0EDE6', marginBottom:'4px' }}>{r.name}</div>
                  <p style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', lineHeight:1.5 }}>{r.desc}</p>
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
