import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'

const HOLSTER_DB = {
  'glock-19': {
    name: 'Glock 19',
    holsters: [
      { brand:'Tier 1 Concealed', model:'Axis Slim', type:'AIWB', price:80, rating:9.4, material:'Kydex', notes:'Best AIWB option. Rides flat, adjustable cant and retention.', url:'https://tier1concealed.com' },
      { brand:'Safariland', model:'7378 ALS', type:'OWB', price:99, rating:9.2, material:'SafariSeven', notes:'Automatic Locking System. Best for duty/OWB carry. Level II retention.', url:'https://safariland.com' },
      { brand:'JM Custom Kydex', model:'AIWB w/ Wedge', type:'AIWB', price:130, material:'Kydex', rating:9.5, notes:'Custom fit. Wedge pushes grip into body. Top-tier AIWB.', url:'https://jmcustomkydex.com' },
      { brand:'Blackhawk Serpa', model:'Level 2 Sportster', type:'OWB', price:40, rating:7.2, material:'Polymer', notes:'Budget-friendly. Finger-operated release. Not recommended for training (can cause negligent discharge under stress).', url:'https://blackhawk.com' },
      { brand:'StealthGearUSA', model:'Ventcore AIWB', type:'AIWB', price:90, rating:8.9, material:'Kydex+Ventilated Backer', notes:'Ventilated backer allows airflow. Excellent all-day comfort.', url:'https://stealthgearusa.com' },
    ]
  },
  'glock-43x': {
    name: 'Glock 43X',
    holsters: [
      { brand:'Tier 1 Concealed', model:'Axis Slim G43X', type:'AIWB', price:75, rating:9.3, material:'Kydex', notes:'Slim profile matches the G43X. Excellent for compact frames.', url:'https://tier1concealed.com' },
      { brand:'Vedder Holsters', model:'ProDraw OWB', type:'OWB', price:75, rating:8.8, material:'Kydex', notes:'Adjustable retention, works with optics. Great value OWB.', url:'https://vedderholsters.com' },
      { brand:'Crossbreed', model:'SuperTuck IWB', type:'IWB', price:80, rating:8.7, material:'Kydex+Leather', notes:'Hybrid leather backer. Most comfortable IWB for all-day carry.', url:'https://crossbreedholsters.com' },
    ]
  },
  'sig-p365': {
    name: 'SIG P365 / P365XL',
    holsters: [
      { brand:'Enigma (JMCK)', model:'Enigma System', type:'AIWB', price:160, rating:9.6, material:'Kydex', notes:'Belt-less AIWB system. Best overall for the P365 platform. Can be worn with any pants.', url:'https://jmcustomkydex.com' },
      { brand:'Tier 1 Concealed', model:'Xiphos', type:'AIWB', price:85, rating:9.2, material:'Kydex', notes:'Optic-compatible. Excellent for P365XL with ROMEOZero.', url:'https://tier1concealed.com' },
      { brand:'PHLster', model:'Floodlight', type:'AIWB', price:60, rating:9.0, material:'Kydex', notes:'Prints very little. Works with WML (weapon mounted light).', url:'https://phlsterholsters.com' },
    ]
  },
}

const TYPE_COLORS = { 'AIWB':'#C8922A','IWB':'#60A5FA','OWB':'#34D399','Shoulder':'#C084FC' }

export async function generateStaticParams() {
  return Object.keys(HOLSTER_DB).map(m=>({ model: m }))
}

export async function generateMetadata({ params }) {
  const d = HOLSTER_DB[params.model]
  if (!d) return { title:'Holster Guide — DownRange' }
  return { title:`Best Holsters for ${d.name} — DownRange`, description:`Top-rated IWB, AIWB, and OWB holsters for the ${d.name}. Expert recommendations and comparisons.` }
}

export default function HolsterPage({ params }) {
  const d = HOLSTER_DB[params.model]
  if (!d) return (
    <>
      <Masthead />
      <div style={{ padding:'100px', textAlign:'center', color:'#6B7280', fontFamily:'monospace' }}>
        Holster data not yet available for this model.<br/><br/>
        <a href="/holsters/glock-19" style={{ color:'#C8922A' }}>Try Glock 19 →</a>
      </div>
      <Footer />
    </>
  )

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="HOLSTERS">
        <div className="container">
          <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', marginBottom:'6px' }}>HOLSTER GUIDE</div>
          <h1 className="page-hero-title">Best Holsters for the {d.name}</h1>
          <p className="page-hero-sub">IWB · AIWB · OWB · Shoulder — expert-curated recommendations</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container" style={{ maxWidth:900 }}>
          <div style={{ display:'flex', gap:'8px', marginBottom:'24px' }}>
            {Object.keys(HOLSTER_DB).map(m=>(
              <a key={m} href={`/holsters/${m}`}
                style={{ fontFamily:'monospace', fontSize:'11px', padding:'5px 12px', border:'1px solid #1F2428', color: m===params.model?'#C8922A':'#4B5563', textDecoration:'none', background: m===params.model?'#C8922A20':'transparent' }}>
                {HOLSTER_DB[m].name}
              </a>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {d.holsters.sort((a,b)=>b.rating-a.rating).map((h,i)=>{
              const typeColor = TYPE_COLORS[h.type] || '#9CA3AF'
              return (
                <div key={h.model} style={{ background:'#111318', border:'1px solid #1F2428', padding:'20px 24px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:'20px', alignItems:'center' }}>
                  <div style={{ textAlign:'center', minWidth:'50px' }}>
                    {i===0 && <div style={{ fontFamily:'monospace', fontSize:'8px', color:'#C8922A', marginBottom:'4px' }}>★ TOP</div>}
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', lineHeight:1 }}>{h.rating}</div>
                    <div style={{ fontFamily:'monospace', fontSize:'8px', color:'#4B5563' }}>/10</div>
                  </div>
                  <div>
                    <div style={{ display:'flex', gap:'8px', marginBottom:'6px', flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:'#F0EDE6' }}>{h.brand} {h.model}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'9px', color:typeColor, background:`${typeColor}20`, padding:'2px 8px' }}>{h.type}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563' }}>{h.material}</span>
                    </div>
                    <p style={{ fontFamily:'monospace', fontSize:'12px', color:'#4B5563', lineHeight:1.6 }}>{h.notes}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.5rem', color:'#C8922A', marginBottom:'6px' }}>${h.price}</div>
                    <a href={h.url} target="_blank" rel="noreferrer"
                      style={{ fontFamily:'monospace', fontSize:'10px', color:'#C8922A', border:'1px solid #C8922A', padding:'5px 12px', textDecoration:'none', display:'block', textAlign:'center' }}>
                      SHOP →
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop:'24px', padding:'16px 20px', background:'#111318', border:'1px solid #1F2428', fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
            ⚠ Always test a new holster with an unloaded firearm before carrying. Verify trigger guard coverage before use. DownRange does not receive affiliate compensation on these recommendations.
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
