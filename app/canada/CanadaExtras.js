'use client'
import { useState } from 'react'

const LAWS = [
  { id:1, name:"Bill C-21 — Handgun Freeze", status:'IN FORCE', date:'Aug 2023', impact:'CRITICAL',
    summary:'Froze all civilian handgun transfers, purchases, imports. Existing owners keep theirs. No new acquisitions.',
    detail:'This is the single biggest firearms law change in Canadian history since the 1995 Firearms Act. An estimated 1.1 million registered handguns are now effectively frozen in place. The CCFR filed a constitutional challenge arguing the freeze violates section 7 rights.',
    url:'https://www.parl.ca/legisinfo/en/bill/44-1/c-21' },
  { id:2, name:"Order in Council — Assault Weapon Ban", status:'IN FORCE', date:'May 2020', impact:'CRITICAL',
    summary:'Banned 1,500+ rifle models by OIC — AR-15, Mini-14, Ruger Mini Thirty. Buyback cancelled. Owners retain under amnesty.',
    detail:'The OIC was issued without Parliamentary vote. The buyback program was announced, contracted, then cancelled when the Conservative government took office in 2025. Current status: owners retain prohibited weapons under ongoing amnesty.',
    url:'https://www.canada.ca/en/public-safety-canada/news/2020/05/government-of-canada-takes-action-to-protect-canadians-from-gun-violence.html' },
  { id:3, name:"PAL / RPAL — Possession and Acquisition Licence", status:'REQUIRED', date:'Ongoing', impact:'HIGH',
    summary:'Every firearms owner needs a PAL. Restricted class requires RPAL. Background check, references, safety course.',
    detail:'PAL processing time: 45-120 days. RPAL adds restricted firearms safety course. New applicants undergo criminal record check, mental health screening, spouse notification, and reference verification.',
    url:'https://www.rcmp-grc.gc.ca/en/firearms/obtaining-firearms-licence' },
  { id:4, name:"Magazine Capacity Limits", status:'IN FORCE', date:'Ongoing', impact:'HIGH',
    summary:'5 rounds for semi-auto centrefire rifles. 10 rounds for handguns. Must be pinned. Rimfire exempt.',
    detail:'Pre-ban large-capacity magazines are prohibited. Conversion by pinning is legal — unpinning is a criminal offence. Competition exemptions exist for specific IPSC divisions.',
    url:'https://www.rcmp-grc.gc.ca/en/firearms/firearm-types' },
  { id:5, name:"Safe Storage Requirements", status:'REQUIRED', date:'Ongoing', impact:'MED',
    summary:'Trigger lock + unloaded + ammo separate. Restricted firearms need locked container. Non-compliance is criminal.',
    detail:'The Firearms Act storage regulations (SOR/98-209) require non-restricted firearms to be trigger-locked or in a locked container. Restricted firearms require both. Transport of restricted firearms requires Authorization to Transport.',
    url:'https://laws-lois.justice.gc.ca/eng/regulations/sor-98-209/' },
  { id:6, name:"Bill C-71 — Enhanced Background Checks", status:'IN FORCE', date:'Jul 2019', impact:'MED',
    summary:'Dealers must verify PAL with RCMP before every sale. Lifetime background checks. Business records 20 years.',
    detail:'Before C-71, dealers could visually inspect a PAL without verifying it. Now every transaction requires a real-time RCMP database check. Dealers must keep records for 20 years.',
    url:'https://www.parl.ca/legisinfo/en/bill/42-1/c-71' },
]

const PROVINCES = [
  { abbr:'AB', name:'Alberta',           rating:'B+', color:'#22c55e', summary:'Most gun-friendly province. Strong rural base, provincial opposition to C-21, Firearms Advisory Committee active.', highlights:['Provincial opposition to OIC ban','Strong hunting culture','Best CFO processing times'] },
  { abbr:'SK', name:'Saskatchewan',      rating:'B',  color:'#22c55e', summary:'Saskatchewan Firearms Act provides protections. Strong rural community.', highlights:['SK Firearms Act protects owners','Strong rural hunting majority','Good PAL processing'] },
  { abbr:'MB', name:'Manitoba',          rating:'C+', color:'#f59e0b', summary:'Average enforcement. Rural-friendly policies. Limited restrictions beyond federal baseline.', highlights:['No additional restrictions','Rural tradition strong','Reasonable CFO processing'] },
  { abbr:'NB', name:'New Brunswick',     rating:'C+', color:'#f59e0b', summary:'Strong rural hunting culture. RCMP jurisdiction. Above-average processing times.', highlights:['RCMP jurisdiction','Strong hunting tradition','No provincial registry'] },
  { abbr:'NS', name:'Nova Scotia',       rating:'C',  color:'#f97316', summary:'Rural tradition strong but urban Halifax driving policy tighter.', highlights:['RCMP jurisdiction','Rural majority influential','No provincial registry'] },
  { abbr:'ON', name:'Ontario',           rating:'C-', color:'#ef4444', summary:'Strict CFO enforcement. Toronto handgun transfer impossible pre-C-21. Rural Ontario more accessible.', highlights:['Strictest CFO','Long ATT processing','Rural/urban split significant'] },
  { abbr:'BC', name:'British Columbia',  rating:'C-', color:'#ef4444', summary:'Metro areas very restrictive. CFO strict. Urban/rural divide massive.', highlights:['Strict Metro CFO','Long wait times','Rural BC more accessible'] },
  { abbr:'QC', name:'Quebec',            rating:'D',  color:'#dc2626', summary:'Most restrictive province. Provincial long-gun registry active since 2018.', highlights:['Provincial long-gun registry','Bill 64 registration required','Most restrictive CFO'] },
]

const PAL = [
  { step:1, title:'Canadian Firearms Safety Course (CFSC)', time:'1 weekend', cost:'~C$150-250', detail:'Two-day classroom and range course. Covers safe handling, storage, transport, and shooting fundamentals. Passing earns your CFSC certificate.' },
  { step:2, title:'CRFSC (if getting RPAL)', time:'1 day', cost:'~C$100-150', detail:'Canadian Restricted Firearms Safety Course. Required if you want restricted class firearms (handguns, certain semi-autos). Done the day after CFSC.' },
  { step:3, title:'Complete PAL Application (Form 3005)', time:'1-2 hours', cost:'C$60-80', detail:'Submit photo, CFSC certificate, two references, proof of identity. Conjugal/former partner reference if applicable. RPAL adds CRFSC certificate.' },
  { step:4, title:'Background Check Processing', time:'45-120 days', cost:'Included', detail:'RCMP processes your application. Criminal record check, mental health screening, reference verification. Processing times vary by region and backlog.' },
  { step:5, title:'Receive PAL in Mail', time:'After processing', cost:'Included', detail:'PAL is a credit-card-sized photo ID. Non-restricted allows purchase of non-restricted firearms. RPAL adds restricted class and requires ATT for range use.' },
  { step:6, title:'Purchase Firearms', time:'Per transaction', cost:'RCMP verification fee', detail:'Dealer verifies your PAL against RCMP database in real time (C-71). Keep your PAL current — it expires every 5 years. Lapsed PAL means unlicensed firearms.' },
]

const AMMO = [
  { caliber:'9mm Luger',    cad:'C$0.42/rd', usd:'~US$0.31', avail:'High',     trend:'up',   note:'Import-dependent. Weak CAD vs USD adds ~30% vs US retail.' },
  { caliber:'.22 LR',       cad:'C$0.14/rd', usd:'~US$0.10', avail:'High',     trend:'flat', note:'Most accessible caliber. No import restrictions.' },
  { caliber:'.223 / 5.56',  cad:'C$0.85/rd', usd:'~US$0.63', avail:'Moderate', trend:'up',   note:'OIC-banned rifles dropped demand then stockpiling. Constrained.' },
  { caliber:'.308 WIN',     cad:'C$1.65/rd', usd:'~US$1.22', avail:'Moderate', trend:'flat', note:'Bolt-action staple. Widely stocked for hunting.' },
  { caliber:'12 Gauge',     cad:'C$0.85/rd', usd:'~US$0.63', avail:'High',     trend:'flat', note:'Hunting-oriented. Plentiful nationwide.' },
  { caliber:'6.5 Creedmoor',cad:'C$2.10/rd', usd:'~US$1.55', avail:'Low',      trend:'up',   note:'Growing precision use. Import limited.' },
  { caliber:'7.62x39',      cad:'C$0.65/rd', usd:'~US$0.48', avail:'Low',      trend:'down', note:'AK platform banned by OIC. Demand cratered.' },
]

function impactColor(impact) {
  if (!impact) return '#4b5563'
  const s = impact.toUpperCase()
  if (s.includes('CRIT') || s.includes('REQUIRED')) return '#ef4444'
  if (s.includes('HIGH') || s.includes('FORCE')) return '#f59e0b'
  if (s.includes('MED')) return '#3b82f6'
  return '#22c55e'
}

export default function CanadaExtras({ laws, provinces, ammo }) {
  const [openLaw, setOpenLaw] = useState(null)
  const [openPal, setOpenPal] = useState(null)

  const allLaws = (laws && laws.length > 0) ? laws.map(l => ({
    id: l._id, name: l.title, status: l.status, date: l.effectiveDate,
    impact: l.impact, summary: l.summary, detail: l.detail, url: l.sourceUrl
  })) : LAWS

  const allProvinces = (provinces && provinces.length > 0) ? provinces.map(p => ({
    abbr: p.abbr, name: p.title, rating: p.rating, color: p.color,
    summary: p.summary, highlights: p.highlights || []
  })) : PROVINCES

  const allAmmo = (ammo && ammo.length > 0) ? ammo.map(a => ({
    caliber: a.title, cad: a.cadPrice, usd: a.usdEquiv,
    avail: a.availability, trend: a.trend, note: a.note
  })) : AMMO

  return (
    <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg)' }}>

      <div id="laws" style={{ padding:'48px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Federal Firearms Laws</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>The laws that govern Canadian firearm owners. Updated as legislation changes.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {allLaws.map((law, i) => (
              <div key={law.id || i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'4px solid ' + impactColor(law.impact) }}>
                <button onClick={() => setOpenLaw(openLaw === i ? null : i)}
                  style={{ width:'100%', background:'none', border:'none', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, textAlign:'left', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)' }}>{law.name}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:impactColor(law.impact), padding:'2px 8px', border:'1px solid ' + impactColor(law.impact) + '40', flexShrink:0 }}>{law.impact}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', flexShrink:0 }}>{law.date}</span>
                  </div>
                  <span style={{ color:'var(--gold)', fontSize:14 }}>{openLaw === i ? '▲' : '▼'}</span>
                </button>
                {openLaw === i && (
                  <div style={{ padding:'0 18px 16px', borderTop:'1px solid var(--border)' }}>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.7, margin:'12px 0', textAlign:'justify' }}>{law.summary}</p>
                    {law.detail && <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.75, textAlign:'justify' }}>{law.detail}</p>}
                    {law.url && <a href={law.url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', textDecoration:'none', display:'inline-block', marginTop:8 }}>→ Official source ↗</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="pal" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>How to Get Your PAL</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>Step-by-step guide to Canada's Possession and Acquisition Licence. Realistic timelines.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {PAL.map((s, i) => (
              <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <button onClick={() => setOpenPal(openPal === i ? null : i)}
                  style={{ width:'100%', background:'none', border:'none', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', textAlign:'left' }}>
                  <div style={{ minWidth:38, height:38, background:'rgba(200,146,42,.1)', border:'2px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', flexShrink:0 }}>{s.step}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)' }}>{s.title}</div>
                    <div style={{ display:'flex', gap:12, marginTop:4 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>⏱ {s.time}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)' }}>💰 {s.cost}</span>
                    </div>
                  </div>
                  <span style={{ color:'var(--gold)', fontSize:14 }}>{openPal === i ? '▲' : '▼'}</span>
                </button>
                {openPal === i && (
                  <div style={{ padding:'0 18px 14px', borderTop:'1px solid var(--border)' }}>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.7, margin:'10px 0', textAlign:'justify' }}>{s.detail}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="provinces" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Province-by-Province Analysis</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>How gun-friendly each province is for firearms owners in practice.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {allProvinces.map((p, i) => {
              const rc = p.rating && p.rating.startsWith('A') ? '#22c55e' : p.rating && p.rating.startsWith('B') ? '#86efac' : p.rating && p.rating.startsWith('C') ? '#f59e0b' : '#ef4444'
              return (
                <div key={p.abbr || i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'4px solid ' + (p.color || rc), padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', marginBottom:3 }}>{p.abbr}</div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1.05rem', color:'var(--text)' }}>{p.name}</div>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:p.color || rc }}>{p.rating}</div>
                  </div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.6, marginBottom:8, textAlign:'justify' }}>{p.summary}</p>
                  {(p.highlights || []).map((h, j) => (
                    <div key={j} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', display:'flex', gap:6, marginBottom:3 }}>
                      <span style={{ color:'var(--gold)' }}>›</span>{h}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div id="ammo" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Ammo Prices in Canada</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>Real Canadian ammo prices. Weak CAD means a 30% premium vs US retail.</p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(255,255,255,.03)', borderBottom:'1px solid var(--border)' }}>
                  {['Calibre','CAD Price','USD Equiv','Avail.','Trend','Notes'].map(h => (
                    <th key={h} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:'#4b5563', padding:'10px 14px', textAlign:'left', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allAmmo.map((a, i) => {
                  const tc = a.trend === 'up' ? '#ef4444' : a.trend === 'down' ? '#22c55e' : '#4b5563'
                  const dc = a.avail === 'High' ? '#22c55e' : a.avail === 'Low' ? '#ef4444' : '#f59e0b'
                  return (
                    <tr key={a.caliber || i} style={{ borderBottom:'1px solid var(--border)', background: i % 2 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                      <td style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)', padding:'10px 14px' }}>{a.caliber}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--gold)', padding:'10px 14px' }}>{a.cad}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', padding:'10px 14px' }}>{a.usd}</td>
                      <td style={{ padding:'10px 14px' }}><span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:dc, padding:'2px 8px', border:'1px solid ' + dc + '40' }}>{a.avail}</span></td>
                      <td style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:tc, padding:'10px 14px' }}>{a.trend === 'up' ? '↑' : a.trend === 'down' ? '↓' : '→'}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', padding:'10px 14px', maxWidth:260, lineHeight:1.5 }}>{a.note}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
