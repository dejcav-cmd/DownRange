import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Canadian Firearms — DownRange', description: 'Canadian firearms laws, news, pricing, and legal updates. PAL, prohibited classes, and provincial regulations.' }

const PROVINCES = [
  { abbr:'AB', name:'Alberta', rating:'B+', handguns:'Restricted (PAL-R)', longGuns:'Non-restricted + Restricted', notes:'Most gun-friendly province. Strong opposition to C-21.' },
  { abbr:'BC', name:'British Columbia', rating:'C', handguns:'Restricted', longGuns:'All classes', notes:'Metro areas less friendly. Registry concerns ongoing.' },
  { abbr:'ON', name:'Ontario', rating:'C', handguns:'Restricted (transport rules strict)', longGuns:'Non-restricted + Restricted', notes:'Strict CFO enforcement. Toronto handgun permit de facto impossible.' },
  { abbr:'QC', name:'Quebec', rating:'D', handguns:'Restricted', longGuns:'Provincial registry (Bill 64)', notes:'Provincial long-gun registry reinstated. Most restrictive province.' },
  { abbr:'SK', name:'Saskatchewan', rating:'B', handguns:'Restricted', longGuns:'All classes', notes:'Provincial legislation protects legal owners from federal overreach.' },
  { abbr:'MB', name:'Manitoba', rating:'C+', handguns:'Restricted', longGuns:'All classes', notes:'Average enforcement. Rural-friendly policies.' },
]

const KEY_LAWS = [
  { name:'Bill C-21 (2023)', status:'In force', impact:'HIGH', summary:'Froze handgun transfers — no new purchases, sales, or imports. Existing owners keep theirs. Introduced "assault weapon" model list by Order in Council.' },
  { name:'Order in Council (May 2020)', status:'In force', impact:'HIGH', summary:'Banned 1,500+ models including AR-15, mini-14, and many others. Confiscation (buyback) program stalled — owners retain currently.' },
  { name:'PAL — Possession and Acquisition Licence', status:'Required', impact:'HIGH', summary:'All firearms require PAL. Non-restricted (hunting rifles/shotguns), Restricted (handguns, AR-15s), Prohibited (full-auto, certain magazines). RPAL adds restricted access.' },
  { name:'Safe Storage (R vs Montague)', status:'Required', impact:'MED', summary:'Firearms must be stored trigger-locked and unloaded. Ammunition stored separately. Inspections allowed without warrant under CFSA.' },
  { name:'Magazine Limits', status:'In force', impact:'MED', summary:'5 rounds for semi-auto centrefire. 10 rounds for handguns. Magazines pinned or blocked. Rimfire (.22 LR) exempt.' },
]

const AMMO_PRICES = [
  { caliber:'9mm', price:'C$0.42', us:'~US$0.31', availability:'High', note:'Import-dependent — weaker CAD raises cost vs US' },
  { caliber:'.223 / 5.56', price:'C$0.85', us:'~US$0.63', availability:'Moderate', note:'Many AR-15 owners stockpiling pre-C-21 enforcement' },
  { caliber:'.308 WIN', price:'C$1.65', us:'~US$1.22', availability:'Moderate', note:'Still popular for non-prohibited rifles' },
  { caliber:'.22 LR', price:'C$0.14', us:'~US$0.10', availability:'High', note:'No import restrictions, widely available' },
  { caliber:'12 GA', price:'C$0.85', us:'~US$0.63', availability:'High', note:'Hunting-oriented — plentiful across Canada' },
]

const NEWS = [
  { title:'Federal Court Challenge to C-21 Handgun Freeze Advances — CCFR Files', date:'Apr 2025', category:'law', url:'https://www.thegunblog.ca' },
  { title:'Saskatchewan First Responders Act Exempts Peace Officers from Handgun Freeze', date:'Mar 2025', category:'law', url:'https://www.thegunblog.ca' },
  { title:'CCFR Reports 120,000+ Members — Largest Canadian Firearms Advocacy Milestone', date:'Feb 2025', category:'industry', url:'https://www.thegunblog.ca' },
  { title:'Alberta Government Challenges Federal Buyback Authority — Province Takes Ottawa to Court', date:'Jan 2025', category:'law', url:'https://www.thegunblog.ca' },
]

export default function CanadaPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="CANADA">
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
            <span style={{ fontSize:'28px' }}>🇨🇦</span>
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563' }}>INTERNATIONAL COVERAGE</span>
          </div>
          <h1 className="page-hero-title">Canadian Firearms</h1>
          <p className="page-hero-sub">PAL/RPAL · Bill C-21 · Province-by-province laws · Ammo prices · Legal news</p>
        </div>
      </div>

      <div style={{ padding:'40px 0' }}>
        <div className="container">

          {/* Alert banner */}
          <div style={{ background:'#1A0000', border:'1px solid #7F1D1D', padding:'16px 20px', marginBottom:'32px', fontFamily:'monospace', fontSize:'13px', color:'#FCA5A5', lineHeight:1.7 }}>
            🇨🇦 <strong style={{ color:'#EF4444' }}>CRITICAL:</strong> Canada's Bill C-21 froze all handgun purchases effective August 2023. No new handgun purchases, transfers, or imports permitted for civilians. Existing owners may keep their handguns. CCFR court challenge ongoing. <a href="https://www.thegunblog.ca" target="_blank" rel="noreferrer" style={{ color:'#60A5FA' }}>Latest: thegunblog.ca ↗</a>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px', marginBottom:'48px' }}>

            {/* Key laws */}
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>KEY FEDERAL LAWS</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {KEY_LAWS.map(l=>{
                  const impColor = l.impact==='HIGH'?'#EF4444':l.impact==='MED'?'#FBBF24':'#9CA3AF'
                  const statColor = l.status==='In force'?'#EF4444':l.status==='Required'?'#FBBF24':'#34D399'
                  return (
                    <div key={l.name} style={{ background:'#111318', border:'1px solid #1F2428', borderLeft:`3px solid ${impColor}`, padding:'14px 16px' }}>
                      <div style={{ display:'flex', gap:'8px', marginBottom:'6px', flexWrap:'wrap' }}>
                        <span style={{ fontFamily:'monospace', fontSize:'11px', fontWeight:700, color:'#F0EDE6' }}>{l.name}</span>
                        <span style={{ fontFamily:'monospace', fontSize:'9px', color:statColor, background:`${statColor}20`, padding:'2px 7px' }}>{l.status.toUpperCase()}</span>
                        <span style={{ fontFamily:'monospace', fontSize:'9px', color:impColor }}>IMPACT: {l.impact}</span>
                      </div>
                      <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.6 }}>{l.summary}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Provinces + ammo */}
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>PROVINCE OVERVIEW</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'24px' }}>
                {PROVINCES.map(p=>{
                  const rc = {'A+':'#16A34A','A':'#22C55E','B+':'#65A30D','B':'#84CC16','C+':'#A3A300','C':'#EAB308','D':'#EF4444','F':'#DC2626'}[p.rating]||'#9CA3AF'
                  return (
                    <div key={p.abbr} style={{ background:'#111318', border:'1px solid #1F2428', padding:'12px 14px', display:'grid', gridTemplateColumns:'40px 80px 1fr', gap:10, alignItems:'center' }}>
                      <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.1rem', color:'#C8922A' }}>{p.abbr}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:rc, background:`${rc}20`, padding:'2px 8px', textAlign:'center' }}>{p.rating}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', lineHeight:1.5 }}>{p.notes}</span>
                    </div>
                  )
                })}
              </div>

              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'12px' }}>AMMO PRICES (CAD)</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {AMMO_PRICES.map(a=>(
                  <div key={a.caliber} style={{ background:'#111318', border:'1px solid #1F2428', padding:'10px 14px', display:'grid', gridTemplateColumns:'100px 70px 60px 1fr', gap:10, alignItems:'center' }}>
                    <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#F0EDE6', fontWeight:700 }}>{a.caliber}</span>
                    <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1rem', color:'#C8922A' }}>{a.price}</span>
                    <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563' }}>{a.us}</span>
                    <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#374151' }}>{a.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* News */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>RECENT CANADIAN FIREARMS NEWS</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'32px' }}>
            {NEWS.map((n,i)=>(
              <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ textDecoration:'none', background:'#111318', border:'1px solid #1F2428', padding:'14px 18px', display:'flex', gap:'16px', alignItems:'center' }}>
                <span style={{ fontFamily:'monospace', fontSize:'9px', color:n.category==='law'?'#60A5FA':'#C8922A', background:n.category==='law'?'#001020':'#1A0E00', padding:'3px 8px', flexShrink:0 }}>{n.category.toUpperCase()}</span>
                <span style={{ fontSize:'14px', color:'#F0EDE6', fontWeight:600, flex:1 }}>{n.title}</span>
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', flexShrink:0 }}>{n.date}</span>
              </a>
            ))}
          </div>

          {/* Resources */}
          <div style={{ background:'#111318', border:'1px solid #1F2428', padding:'24px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>CANADIAN FIREARMS RESOURCES</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
              {[
                { name:'CCFR — Canadian Coalition for Firearms Rights', url:'https://www.ccfr.ca', desc:'Primary advocacy organization. Court challenges, lobbying, education.' },
                { name:'TheGunBlog.ca', url:'https://www.thegunblog.ca', desc:'Best Canadian firearms news coverage. Daily updates.' },
                { name:'RCMP Firearms Program', url:'https://www.rcmp-grc.gc.ca/en/firearms', desc:'Official PAL applications, regulations, class lookup.' },
              ].map(r=>(
                <a key={r.name} href={r.url} target="_blank" rel="noreferrer" style={{ background:'#0D1117', border:'1px solid #1F2428', padding:'14px', textDecoration:'none' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#F0EDE6', marginBottom:'6px', lineHeight:1.3 }}>{r.name}</div>
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
