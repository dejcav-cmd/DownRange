'use client'
import { useState } from 'react'

const FEDERAL_LAWS = [
  { name:'Bill C-21 — Handgun Freeze', status:'IN FORCE', date:'Aug 2023', impact:'CRITICAL',
    summary:'Froze all civilian handgun transfers, purchases, imports. Existing owners keep theirs. No new acquisitions. CCFR court challenge ongoing — ruling expected 2025.',
    detail:'This is the single biggest firearms law change in Canadian history since the 1995 Firearms Act. An estimated 1.1 million registered handguns are now effectively frozen in place. Dealers cannot sell existing inventory to civilians. Border Services seized transfer requests. The CCFR filed a constitutional challenge in federal court arguing the freeze is arbitrary and violates section 7 rights.',
    url:'https://www.parl.ca/legisinfo/en/bill/44-1/c-21' },
  { name:'Order in Council — Assault Weapon Ban', status:'IN FORCE', date:'May 2020', impact:'CRITICAL',
    summary:'Banned 1,500+ rifle models by OIC — AR-15, Mini-14, Ruger Mini Thirty, and others. Mandatory buyback stalled. Owners currently retain under amnesty.',
    detail:'The OIC was issued without Parliamentary vote, which itself sparked constitutional debate. The buyback program was announced, contracted, then cancelled when the Conservative government took office in 2025. Current status: owners retain prohibited weapons under ongoing amnesty. Future of the program is uncertain — the Conservatives have signalled intent to reverse the ban.',
    url:'https://www.canada.ca/en/public-safety-canada/news/2020/05/government-of-canada-takes-action-to-protect-canadians-from-gun-violence.html' },
  { name:'PAL / RPAL — Possession and Acquisition Licence', status:'REQUIRED', date:'Ongoing', impact:'HIGH',
    summary:'Every firearms owner needs a PAL. Restricted class (handguns, specific semi-autos) requires RPAL. Background check, references, safety course.',
    detail:'PAL processing time: 45–120 days depending on region and backlog. RPAL adds a restricted firearms safety course (CRFSC). New applicants 18+ undergo criminal record check, mental health screening, spouse/partner notification, and reference verification. PAL must be renewed every 5 years.',
    url:'https://www.rcmp-grc.gc.ca/en/firearms/obtaining-firearms-licence' },
  { name:'Magazine Capacity Limits', status:'IN FORCE', date:'Ongoing', impact:'HIGH',
    summary:'5 rounds for semi-auto centrefire rifles. 10 rounds for handguns. Must be pinned or blocked. Rimfire exempt.',
    detail:'Grandfathered pre-ban large-capacity magazines are prohibited. Manufacturers and importers may not produce or import non-compliant magazines. Conversion of existing mags by pinning is legal — unpinning is a criminal offence. Competition exemptions exist for specific IPSC divisions under strict conditions.',
    url:'https://www.rcmp-grc.gc.ca/en/firearms/firearm-types' },
  { name:'Safe Storage Requirements', status:'REQUIRED', date:'Ongoing', impact:'MED',
    summary:'Trigger lock + unloaded + ammo separate. Restricted firearms need locked container. Non-compliance is a criminal offence.',
    detail:'The Firearms Act storage regulations (SOR/98-209) require non-restricted firearms to be trigger-locked or in a locked container. Restricted firearms require both. Transport of restricted firearms requires a Authorization to Transport (ATT) from your CFO — now bundled in RPAL for ranges and gunsmiths, but still required for moves.',
    url:'https://laws-lois.justice.gc.ca/eng/regulations/sor-98-209/' },
  { name:'Bill C-71 — Enhanced Background Checks', status:'IN FORCE', date:'Jul 2019', impact:'MED',
    summary:'Dealers must verify PAL with RCMP before every sale. Lifetime background checks. Business record-keeping for 20 years.',
    detail:'Before C-71, dealers could visually inspect a PAL without verifying it. Now every transaction requires a real-time RCMP database check. Dealers must keep records for 20 years and provide them to police on request without a warrant. Critics argued this created a de facto registry through dealer records.',
    url:'https://www.parl.ca/legisinfo/en/bill/42-1/c-71' },
]


const PROVINCES = [
  { abbr:'AB', name:'Alberta', rating:'B+', color:'#22c55e',
    summary:'Most gun-friendly province. Strong conservative rural base, provincial opposition to C-21, and an active Firearms Advisory Committee. CFO relatively accessible.',
    highlights:['Provincial opposition to OIC ban','Alberta Firearms Advisory Committee active','Strong hunting and sport shooting culture','CFO processing times among best nationally'] },
  { abbr:'SK', name:'Saskatchewan', rating:'B', color:'#22c55e',
    summary:'Saskatchewan Firearms Act provides provincial protections. Strong rural community. RCMP jurisdiction but provincial legislation limits overreach.',
    highlights:['SK Firearms Act protects lawful owners','Strong rural hunting majority','RCMP jurisdiction — no provincial CFO','Good PAL processing times'] },
  { abbr:'MB', name:'Manitoba', rating:'C+', color:'#f59e0b',
    summary:'Average enforcement. Rural-friendly policies. CFO offices accessible. Limited provincial restrictions beyond federal baseline.',
    highlights:['No additional provincial restrictions','Rural hunting tradition strong','Reasonable CFO processing','RCMP and CFO co-jurisdiction'] },
  { abbr:'NB', name:'New Brunswick', rating:'C+', color:'#f59e0b',
    summary:'Strong rural hunting culture. RCMP jurisdiction. Above-average processing times. Minimal urban restriction pressure.',
    highlights:['RCMP jurisdiction','Strong hunting tradition','No provincial registry','Above-average PAL processing'] },
  { abbr:'NS', name:'Nova Scotia', rating:'C', color:'#f97316',
    summary:'Rural hunting tradition strong but urban Halifax driving policy tighter. RCMP primary enforcement.',
    highlights:['RCMP jurisdiction (no CFO)','Rural majority still influential','No provincial long-gun registry','Standard federal enforcement'] },
  { abbr:'PEI', name:'Prince Edward Island', rating:'C', color:'#f97316',
    summary:'Small province, RCMP jurisdiction. Limited firearms infrastructure but no additional restrictions beyond federal.',
    highlights:['RCMP jurisdiction','Smallest province — limited dealers','Standard federal rules apply','No provincial additions'] },
  { abbr:'ON', name:'Ontario', rating:'C-', color:'#ef4444',
    summary:'Strict CFO enforcement. Toronto handgun transfer was de facto impossible even pre-C-21. Rural Ontario more accessible but urban policy dominates.',
    highlights:['Strictest CFO in country','Toronto municipal pressure','Long ATT processing times','Rural/urban split significant'] },
  { abbr:'BC', name:'British Columbia', rating:'C-', color:'#ef4444',
    summary:'Metro areas very restrictive. CFO enforcement strict. Provincial data sharing with RCMP. Urban/rural divide massive.',
    highlights:['Strict Metro Vancouver CFO enforcement','Data sharing with provincial police','Long PAL and ATT wait times','Rural BC much more accessible'] },
  { abbr:'QC', name:'Quebec', rating:'D', color:'#dc2626',
    summary:'Most restrictive province. Provincial long-gun registry (Bill 64) reinstated in 2018. Separate firearms database. Cultural and political opposition to firearms.',
    highlights:['Provincial long-gun registry active','Bill 64 separate registration required','Most restrictive CFO in Canada','Legal challenges have failed provincially'] },
]


const AMMO_DATA = [
  { caliber:'9mm Luger',    cadPrice:'C$0.42/rd', usdEq:'~US$0.31', avail:'High',     trend:'up',   note:'Import-dependent. Weak CAD vs USD adds ~30% vs US retail.' },
  { caliber:'.22 LR',       cadPrice:'C$0.14/rd', usdEq:'~US$0.10', avail:'High',     trend:'flat', note:'No import restrictions. Most accessible caliber in Canada.' },
  { caliber:'.223 / 5.56',  cadPrice:'C$0.85/rd', usdEq:'~US$0.63', avail:'Moderate', trend:'up',   note:'OIC-banned rifles created demand drop then stockpiling. Constrained.' },
  { caliber:'.308 WIN',     cadPrice:'C$1.65/rd', usdEq:'~US$1.22', avail:'Moderate', trend:'flat', note:'Bolt-action staple. Still widely stocked for hunting.' },
  { caliber:'12 Gauge',     cadPrice:'C$0.85/rd', usdEq:'~US$0.63', avail:'High',     trend:'flat', note:'Hunting-oriented. Plentiful nationwide, all grades.' },
  { caliber:'6.5 Creedmoor',cadPrice:'C$2.10/rd', usdEq:'~US$1.55', avail:'Low',      trend:'up',   note:'Growing precision rifle use. Import limited. Pricing premium.' },
  { caliber:'7.62x39',      cadPrice:'C$0.65/rd', usdEq:'~US$0.48', avail:'Low',      trend:'down', note:'AK-platform banned by OIC. Demand cratered. Limited import.' },
  { caliber:'.303 British', cadPrice:'C$1.20/rd', usdEq:'~US$0.89', avail:'Moderate', trend:'flat', note:'Legacy hunting caliber. Surplus and Dominion production still available.' },
]


const PAL_STEPS = [
  { step:1, title:'Canadian Firearms Safety Course (CFSC)', time:'1 weekend', cost:'~C$150–250', detail:'Two-day classroom and range course. Covers safe handling, storage, transport, and shooting fundamentals. Passing the written and practical exam earns your CFSC certificate — required for PAL application.' },
  { step:2, title:'CRFSC (if getting RPAL)', time:'1 day', cost:'~C$100–150', detail:'Canadian Restricted Firearms Safety Course — required if you want to own restricted class firearms (handguns, certain semi-autos). Typically done the day after CFSC with same instructor.' },
  { step:3, title:'Complete PAL Application (RCMP Form 3005)', time:'1–2 hours', cost:'C$80–RPAL/$60-PAL', detail:'Submit your photo, CFSC certificate, two references (one must be conjugal/former partner if applicable), and proof of identity. Application goes to the CFP (Canadian Firearms Program). RPAL adds the CRFSC certificate.' },
  { step:4, title:'Background Check & Processing', time:'45–120 days', cost:'Included', detail:'RCMP runs criminal record check, mental health record check, and contacts your references. Spouse/partner is notified — they have standing to object. Average processing time varies wildly by province. Alberta fastest, Quebec slowest.' },
  { step:5, title:'Receive PAL in Mail', time:'After processing', cost:'Included', detail:'Your PAL is a credit-card-sized photo ID. Non-restricted PAL allows purchase and possession of non-restricted firearms. RPAL adds restricted class and requires ATT (Authorization to Transport) for range use.' },
  { step:6, title:'Purchase Firearms', time:'Per transaction', cost:'RCMP verification fee', detail:'Dealer must verify your PAL against the RCMP database in real time before every transaction (C-71). Keep your PAL current — it expires every 5 years. Lapsed PAL means your firearms become unlicensed.' },
]


const SOURCES = [
  { name:'CCFR — Canadian Coalition for Firearm Rights', url:'https://www.firearmrights.ca', desc:'Primary legal advocacy, C-21 constitutional challenge' },
  { name:'NFA — National Firearms Association', url:'https://www.nfa.ca', desc:'Policy and safety programs' },
  { name:'RCMP Firearms Centre', url:'https://www.rcmp-grc.gc.ca/en/firearms', desc:'Official PAL, RPAL, ATT info' },
  { name:'Canada.ca — Firearms', url:'https://www.canada.ca/en/services/policing/firearms.html', desc:'Federal government firearms portal' },
  { name:'CFP — Canadian Firearms Program', url:'https://www.rcmp-grc.gc.ca/cfp-pcaf', desc:'License applications and registry' },
]

export default function CanadaExtras({ laws=[], provinces=[], ammo=[] }) {
  const [openLaw, setOpenLaw] = useState(null)
  const [openPal, setOpenPal] = useState(null)

  const allLaws = laws.length > 0 ? laws : FEDERAL_LAWS.map((l,i) => ({
    ...l, _id:'fl'+i, title:l.name, summary:l.summary, detail:l.detail,
    status:l.status, effectiveDate:l.date, sourceUrl:l.url, impact:l.impact
  }))
  const allProvinces = provinces.length > 0 ? provinces : PROVINCES.map((p,i) => ({
    ...p, _id:'pr'+i, title:p.name, summary:p.summary, highlights:p.highlights
  }))
  const allAmmo = ammo.length > 0 ? ammo : AMMO_DATA.map((a,i) => ({
    ...a, _id:'am'+i, title:a.caliber, cadPrice:a.cadPrice, usdEquiv:a.usdEq,
    availability:a.avail, trend:a.trend, note:a.note
  }))

  const impColor = (imp='') => {
    if (!imp) return '#4b5563'
    const s = imp.toUpperCase()
    if (s.includes('CRIT') || s.includes('REQUIRED')) return '#ef4444'
    if (s.includes('HIGH') || s.includes('FORCE'))    return '#f59e0b'
    if (s.includes('MED'))                             return '#3b82f6'
    return '#22c55e'
  }

  return (
    <div style={{ borderTop:'1px solid var(--border)', background:'var(--bg)' }}>

      {/* ── FEDERAL LAWS ── */}
      <div id="laws" style={{ padding:'48px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Federal Firearms Laws</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>The laws that govern Canadian firearm owners. Updated as legislation changes.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {allLaws.map((law,i) => (
              <div key={law._id||i} style={{ background:'var(--bg2)', border:'1px solid var(--border)',
                borderLeft:'4px solid '+impColor(law.impact) }}>
                <button onClick={()=>setOpenLaw(openLaw===i?null:i)} style={{ width:'100%', background:'none', border:'none',
                  padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center',
                  cursor:'pointer', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, textAlign:'left' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)' }}>{law.title||law.name}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:impColor(law.impact),
                      background:impColor(law.impact)+'20', border:'1px solid '+impColor(law.impact)+'40',
                      padding:'2px 8px', flexShrink:0 }}>{law.impact}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', flexShrink:0 }}>{law.effectiveDate||law.date}</span>
                  </div>
                  <span style={{ color:'var(--gold)', fontSize:14 }}>{openLaw===i?'▲':'▼'}</span>
                </button>
                {openLaw===i && (
                  <div style={{ padding:'0 18px 16px', borderTop:'1px solid var(--border)' }}>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.7, margin:'12px 0', textAlign:'justify' }}>{law.summary}</p>
                    {law.detail && <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.75, textAlign:'justify' }}>{law.detail}</p>}
                    {(law.sourceUrl||law.url) && <a href={law.sourceUrl||law.url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', textDecoration:'none', display:'inline-block', marginTop:8 }}>→ Official source ↗</a>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PAL GUIDE ── */}
      <div id="pal" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>How to Get Your PAL</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>Step-by-step guide to Canada's Possession and Acquisition Licence. Realistic timelines.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {PAL_STEPS.map((s,i) => (
              <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', overflow:'hidden' }}>
                <button onClick={()=>setOpenPal(openPal===i?null:i)} style={{ width:'100%', background:'none', border:'none', padding:'14px 18px', display:'flex', alignItems:'center', gap:14, cursor:'pointer', textAlign:'left' }}>
                  <div style={{ minWidth:38, height:38, background:'rgba(200,146,42,.1)', border:'2px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', flexShrink:0 }}>{s.step||i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)' }}>{s.title}</div>
                    <div style={{ display:'flex', gap:10, marginTop:4 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>⏱ {s.time}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)' }}>💰 {s.cost}</span>
                    </div>
                  </div>
                  <span style={{ color:'var(--gold)', fontSize:14 }}>{openPal===i?'▲':'▼'}</span>
                </button>
                {openPal===i && <div style={{ padding:'0 18px 14px', borderTop:'1px solid var(--border)' }}><p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.7, margin:'10px 0', textAlign:'justify' }}>{s.detail}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROVINCES ── */}
      <div id="provinces" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Province-by-Province Analysis</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>How gun-friendly each province is for firearms owners in practice.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
            {allProvinces.map((p,i) => {
              const rc = p.rating?.startsWith('A')?'#22c55e':p.rating?.startsWith('B')?'#86efac':p.rating?.startsWith('C')?'#f59e0b':'#ef4444'
              return (
                <div key={p._id||i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'4px solid '+p.color||rc, padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', marginBottom:3 }}>{p.abbr}</div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1.05rem', color:'var(--text)' }}>{p.title||p.name}</div>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:p.color||rc }}>{p.rating}</div>
                  </div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.6, marginBottom:8, textAlign:'justify' }}>{p.summary||p.resumo}</p>
                  {(p.highlights||[]).map((h,j)=>(
                    <div key={j} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', display:'flex', gap:6, marginBottom:3 }}>
                      <span style={{ color:'var(--gold)' }}>›</span>{h}
                    </div>
                  ))}
                </div>
              )
            }}
          </div>
        </div>
      </div>

      {/* ── AMMO ── */}
      <div id="ammo" style={{ padding:'48px 0', borderTop:'1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', marginBottom:6 }}>Ammo Prices in Canada</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563', marginBottom:24 }}>Real Canadian ammo prices. Everything is import-dependent — weak CAD means a 30% premium vs US retail.</p>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'rgba(255,255,255,.03)', borderBottom:'1px solid var(--border)' }}>
                  {['Calibre','CAD Price','USD Equiv','Avail.','Trend','Notes'].map(h=>(
                    <th key={h} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:'#4b5563', padding:'10px 14px', textAlign:'left', letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allAmmo.map((a,i)=>{
                  const tc = (a.trend)==='up'?'#ef4444':(a.trend)==='down'?'#22c55e':'#4b5563'
                  const dc = (a.availability||a.avail)==='High'?'#22c55e':(a.availability||a.avail)==='Low'?'#ef4444':'#f59e0b'
                  return (
                    <tr key={a._id||i} style={{ borderBottom:'1px solid var(--border)', background:i%2?'rgba(255,255,255,.01)':'transparent' }}>
                      <td style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:'1rem', color:'var(--text)', padding:'10px 14px' }}>{a.title||a.caliber}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--gold)', padding:'10px 14px' }}>{a.cadPrice}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', padding:'10px 14px' }}>{a.usdEquiv||a.usdEq}</td>
                      <td style={{ padding:'10px 14px' }}><span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:dc, background:dc+'20', border:'1px solid '+dc+'40', padding:'2px 8px' }}>{a.availability||a.avail}</span></td>
                      <td style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:tc, padding:'10px 14px' }}>{(a.trend)==='up'?'↑':(a.trend)==='down'?'↓':'→'}</td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', padding:'10px 14px', maxWidth:260, lineHeight:1.5 }}>{a.note}</td>
                    </tr>
                  )
                }}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
