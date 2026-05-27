import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'

export const revalidate = 86400

const GUN_DB = {
  'glock-17': { name:'Glock 17 Gen5', caliber:'9mm', capacity:'17+1', barrel:'4.49"', weight:'24.87 oz', width:'1.26"', trigger:'Safe Action 5.5 lb', msrp:599, category:'Pistol', pros:['Legendary reliability','Largest aftermarket','Excellent ergonomics Gen5','Easy to service'], cons:['Bulkier than G19','No manual safety','Utilitarian aesthetics'], score:9.1 },
  'glock-19': { name:'Glock 19 Gen5', caliber:'9mm', capacity:'15+1', barrel:'4.02"', weight:'23.65 oz', width:'1.26"', trigger:'Safe Action 5.5 lb', msrp:549, category:'Pistol', pros:['Best all-around size','Most popular pistol in US','Deep holster ecosystem','Proven in combat worldwide'], cons:['Average trigger out of box','Polymer aesthetics not for everyone'], score:9.4 },
  'sig-p320': { name:'SIG Sauer P320', caliber:'9mm', capacity:'17+1', barrel:'4.7"', weight:'29.5 oz', width:'1.3"', trigger:'Striker-Fired 6.5 lb', msrp:679, category:'Pistol', pros:['US Military M17 selected','Modular chassis system','Excellent accuracy','Flat trigger'], cons:['Heavier than Glock','Earlier drop-fire controversy (resolved)'], score:8.9 },
  'sig-p365': { name:'SIG Sauer P365 XL', caliber:'9mm', capacity:'12+1', barrel:'3.7"', weight:'20.7 oz', width:'1.1"', trigger:'Striker-Fired 5 lb', msrp:699, category:'Pistol', pros:['Best EDC trigger','12+1 in micro package','ROMEO Zero ready','Slim 1.1" width'], cons:['Price premium','Smaller grip for big hands'], score:9.5 },
  'ar-15': { name:'AR-15 (Mil-Spec)', caliber:'5.56 NATO', capacity:'30+1', barrel:'16"', weight:'6.5 lbs', width:'N/A', trigger:'Mil-Spec 7–8 lb', msrp:749, category:'Rifle', pros:['Most modular platform ever built','Deep aftermarket','5.56 affordable ammo','Proven military design'], cons:['Direct impingement runs hotter','Mag capacity restricted in some states'], score:9.2 },
  'ak-47': { name:'AK-47 / WASR-10', caliber:'7.62x39mm', capacity:'30+1', barrel:'16.25"', weight:'8.5 lbs', width:'N/A', trigger:'Mil-Spec 8–10 lb', msrp:799, category:'Rifle', pros:['Extreme reliability in adverse conditions','7.62x39 hits hard','Simple piston design','Iconic design'], cons:['Less modular than AR','Heavier','Less aftermarket support in US'], score:8.7 },
}

async function getComparison(guns) {
  const g1key = guns[0]
  const g2key = guns[1]
  const g1 = GUN_DB[g1key]
  const g2 = GUN_DB[g2key]
  if (!g1 || !g2) return null

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY||'', 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model:'claude-sonnet-4-5', max_tokens:800,
        messages:[{ role:'user', content:`Compare the ${g1.name} vs ${g2.name} for a gun owner. Write 2 short paragraphs: who each gun is best for, and an overall recommendation. Be specific and direct. Max 150 words total.` }]
      })
    })
    const d = await res.json()
    return d.content?.[0]?.text || null
  } catch { return null }
}

export async function generateMetadata({ params }) {
  const guns = params.guns?.split('-vs-') || []
  const g1 = GUN_DB[guns[0]]?.name || guns[0]
  const g2 = GUN_DB[guns[1]]?.name || guns[1]
  return { title:`${g1} vs ${g2} — DownRange Comparison`, description:`Head-to-head comparison: ${g1} vs ${g2}. Specs, pros, cons, and AI verdict.` }
}

export default async function ComparePage({ params }) {
  const guns = params.guns?.split('-vs-') || []
  const g1 = GUN_DB[guns[0]]
  const g2 = GUN_DB[guns[1]]
  const verdict = (g1 && g2 && process.env.ANTHROPIC_API_KEY) ? await getComparison(guns).catch(()=>null) : null

  const POPULAR = [
    { slug:'glock-19-vs-sig-p320', label:'G19 vs P320' },
    { slug:'glock-17-vs-glock-19', label:'G17 vs G19' },
    { slug:'sig-p365-vs-glock-43x', label:'P365 vs G43X' },
    { slug:'ar-15-vs-ak-47', label:'AR-15 vs AK-47' },
  ]

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="COMPARE">
        <div className="container">
          <h1 className="page-hero-title">{g1 && g2 ? `${g1.name} vs ${g2.name}` : 'Gun Comparison'}</h1>
          <p className="page-hero-sub">Head-to-head specs · Pros & cons · AI verdict</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">

          {/* Popular comparisons */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'32px', flexWrap:'wrap' }}>
            {POPULAR.map(p=>(
              <a key={p.slug} href={`/compare/${p.slug}`}
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', padding:'6px 14px', border:'1px solid var(--border)', color:'#6B7280', textDecoration:'none', background: params.guns===p.slug?'#C8922A20':'transparent' }}>
                {p.label}
              </a>
            ))}
          </div>

          {!g1 || !g2 ? (
            <div style={{ textAlign:'center', padding:'80px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#4B5563' }}>
              Select a comparison above, or visit /compare/glock-17-vs-sig-p320
            </div>
          ) : (
            <>
              {/* Specs table */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 200px 1fr', gap:'0', marginBottom:'32px', background:'#111318', border:'1px solid var(--border)', overflow:'hidden' }}>
                {/* Headers */}
                <div style={{ padding:'16px 20px', background:'#16191F', fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em' }}>{g1.name}</div>
                <div style={{ padding:'16px 20px', background:'#1F2428', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', textAlign:'center', letterSpacing:'0.1em', display:'flex', alignItems:'center', justifyContent:'center' }}>VS</div>
                <div style={{ padding:'16px 20px', background:'#16191F', fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', textAlign:'right' }}>{g2.name}</div>

                {/* Spec rows */}
                {[
                  ['Caliber','caliber'],['Capacity','capacity'],['Barrel','barrel'],
                  ['Weight','weight'],['Width','width'],['Trigger','trigger'],['MSRP','msrp'],['Score','score'],
                ].map(([label, key])=>{
                  const v1 = key==='msrp'?`$${g1[key]}`:key==='score'?`${g1[key]}/10`:g1[key]
                  const v2 = key==='msrp'?`$${g2[key]}`:key==='score'?`${g2[key]}/10`:g2[key]
                  const winner = key==='msrp' ? (g1[key]<g2[key]?1:2) : key==='score'?(g1[key]>g2[key]?1:2):0
                  return [
                    <div key={`${key}-1`} style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color: winner===1?'#34D399':'#F0EDE6', fontWeight:winner===1?700:400 }}>{v1}</div>,
                    <div key={`${key}-m`} style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', textAlign:'center', background:'#0D1117', display:'flex', alignItems:'center', justifyContent:'center' }}>{label.toUpperCase()}</div>,
                    <div key={`${key}-2`} style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color: winner===2?'#34D399':'#F0EDE6', fontWeight:winner===2?700:400, textAlign:'right' }}>{v2}</div>,
                  ]
                })}
              </div>

              {/* Pros/Cons */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'32px' }}>
                {[g1,g2].map((g,i)=>(
                  <div key={i} style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px' }}>
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#C8922A', marginBottom:'12px' }}>{g.name}</div>
                    <div style={{ marginBottom:'12px' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34D399', letterSpacing:'0.12em', marginBottom:'6px' }}>PROS</div>
                      {g.pros.map((p,j)=><div key={j} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#86EFAC', marginBottom:'4px', paddingLeft:'8px' }}>✓ {p}</div>)}
                    </div>
                    <div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#EF4444', letterSpacing:'0.12em', marginBottom:'6px' }}>CONS</div>
                      {g.cons.map((c,j)=><div key={j} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#FCA5A5', marginBottom:'4px', paddingLeft:'8px' }}>✗ {c}</div>)}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Verdict */}
              {verdict && (
                <div style={{ background:'#0D1117', border:'1px solid #C8922A40', borderLeft:'4px solid #C8922A', padding:'24px', marginBottom:'24px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', marginBottom:'12px', fontWeight:700 }}>🤖 AI VERDICT — CLAUDE</div>
                  <p style={{ fontSize:'14px', color:'#94A3B8', lineHeight:1.8 }}>{verdict}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
