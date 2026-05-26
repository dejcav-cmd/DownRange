'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

const TABS = [
  { key:'overview', label:'Overview' },
  { key:'federal',  label:'Federal Laws' },
  { key:'provinces',label:'Provinces' },
  { key:'ammo',     label:'Ammo Prices' },
  { key:'news',     label:'News & Sources' },
  { key:'resources',label:'Resources' },
]

const FEDERAL_LAWS = [
  { name:'Bill C-21 — Handgun Freeze', status:'In force', date:'Aug 2023', impact:'CRITICAL',
    summary:'Froze all civilian handgun purchases, sales, transfers, and imports. Existing owners keep their firearms. No new handgun acquisitions permitted. CCFR court challenge ongoing.',
    url:'https://www.parl.ca/legisinfo/en/bill/44-1/c-21', source:'Parliament of Canada' },
  { name:'Order in Council — AWB', status:'In force', date:'May 2020', impact:'CRITICAL',
    summary:'Banned 1,500+ rifle models by Order in Council including AR-15, Mini-14, and similar platforms. Mandatory buyback (confiscation) program stalled — owners currently retain.',
    url:'https://www.canada.ca/en/public-safety-canada/news/2020/05/government-of-canada-takes-action-to-protect-canadians-from-gun-violence.html', source:'Public Safety Canada' },
  { name:'PAL — Possession and Acquisition Licence', status:'Required', date:'Ongoing', impact:'HIGH',
    summary:'All firearms require a PAL. Non-restricted (hunting rifles/shotguns), Restricted (handguns, certain semi-autos), Prohibited (full-auto). RPAL adds restricted access.',
    url:'https://www.rcmp-grc.gc.ca/en/firearms/obtaining-firearms-licence', source:'RCMP Firearms Program' },
  { name:'Magazine Capacity Limits', status:'In force', date:'Ongoing', impact:'HIGH',
    summary:'5 rounds for semi-auto centrefire. 10 rounds for handguns. Magazines must be pinned or blocked. Rimfire (.22 LR) exempt from capacity limits.',
    url:'https://www.rcmp-grc.gc.ca/en/firearms/firearm-types', source:'RCMP Firearms Program' },
  { name:'Safe Storage Regulations', status:'Required', date:'Ongoing', impact:'MED',
    summary:'Firearms must be stored trigger-locked and unloaded, ammunition stored separately. R v Montague: warrantless compliance inspections permitted under CFSA.',
    url:'https://laws-lois.justice.gc.ca/eng/regulations/sor-98-209/', source:'Justice Canada' },
  { name:'Pistol Brace — No Canadian Equivalent', status:'N/A', date:'N/A', impact:'LOW',
    summary:'Canada never had a pistol brace classification issue — stabilizing braces are irrelevant under Canadian law which classifies by receiver type.',
    url:'https://www.rcmp-grc.gc.ca/en/firearms', source:'RCMP' },
]

const PROVINCES = [
  { abbr:'AB', name:'Alberta', rating:'B+', note:'Most gun-friendly province. Strong provincial opposition to C-21. Alberta Firearms Advisory Committee. Rural majority protective.' },
  { abbr:'BC', name:'British Columbia', rating:'C', note:'Metro areas restrictive. CFO enforcement strict. Provincial data sharing with RCMP. Urban/rural divide significant.' },
  { abbr:'ON', name:'Ontario', rating:'C', note:'Strict CFO enforcement. Toronto handgun transfer de facto impossible even pre-C-21. Rural ON more accessible.' },
  { abbr:'QC', name:'Quebec', rating:'D', note:'Provincial long-gun registry (Bill 64) reinstated. Most restrictive province. Separate provincial firearms database.' },
  { abbr:'SK', name:'Saskatchewan', rating:'B', note:'Provincial legislation (Firearms Act) protects lawful owners from overreach. Strong industry and sport shooting community.' },
  { abbr:'MB', name:'Manitoba', rating:'C+', note:'Average enforcement. Rural-friendly policies. CFO offices accessible. Limited provincial restrictions beyond federal.' },
  { abbr:'NS', name:'Nova Scotia', rating:'C', note:'Rural hunting tradition strong. Urban areas follow federal restrictions closely. RCMP primary enforcement.' },
  { abbr:'NB', name:'New Brunswick', rating:'C+', note:'Strong rural hunting culture. RCMP jurisdiction. Above-average compliance and processing times for PAL.' },
]

const AMMO = [
  { caliber:'9mm',       cad:'C$0.42/rd', usd:'~US$0.31', availability:'High',    note:'Import-dependent. Weaker CAD raises cost vs US market.' },
  { caliber:'.223/5.56', cad:'C$0.85/rd', usd:'~US$0.63', availability:'Moderate',note:'Owners of C-21-banned rifles stockpiling. Supply constrained.' },
  { caliber:'.308 WIN',  cad:'C$1.65/rd', usd:'~US$1.22', availability:'Moderate',note:'Still popular for non-prohibited bolt-action rifles.' },
  { caliber:'.22 LR',    cad:'C$0.14/rd', usd:'~US$0.10', availability:'High',    note:'No import restrictions. Widely available nationally.' },
  { caliber:'12 GA',     cad:'C$0.85/rd', usd:'~US$0.63', availability:'High',    note:'Hunting-oriented. Plentiful across all provinces.' },
  { caliber:'7.62x39',   cad:'C$0.65/rd', usd:'~US$0.48', availability:'Low',     note:'AR-platform banned, demand dropped. Limited import channels.' },
]

const NEWS_SOURCES = [
  { name:'TheGunBlog.ca', url:'https://www.thegunblog.ca', type:'News', desc:'Best independent Canadian firearms news. Daily updates. No paywall.', rss:'https://www.thegunblog.ca/feed/' },
  { name:'CCFR — Canadian Coalition for Firearms Rights', url:'https://www.ccfr.ca', type:'Advocacy', desc:'Primary court challenge organization. C-21 challenges, legal updates, lobbying.', rss:null },
  { name:'National Firearms Association', url:'https://www.nfa.ca', type:'Advocacy', desc:'NFA Canada — advocacy and education. Different from US NRA.', rss:'https://www.nfa.ca/feed/' },
  { name:'Canadian Shooting Sports Assn', url:'https://www.cdnshootingsports.org', type:'Sport', desc:'Competition, training, and legislative advocacy for sport shooters.', rss:null },
  { name:'RCMP Firearms Program', url:'https://www.rcmp-grc.gc.ca/en/firearms', type:'Official', desc:'Official PAL applications, regulations, class lookup, and compliance.', rss:null },
  { name:'Parliament of Canada — Bill Tracker', url:'https://www.parl.ca/legisinfo/en/bills', type:'Official', desc:'Track all federal firearms-related legislation in real time.', rss:null },
  { name:'Public Safety Canada — Firearms', url:'https://www.canada.ca/en/public-safety-canada/services/firearms.html', type:'Official', desc:'Federal policy, OIC updates, and official press releases.', rss:null },
]

const IMPACT_COLORS = { CRITICAL:'#EF4444', HIGH:'#F97316', MED:'#FBBF24', LOW:'#9CA3AF' }

export default function CanadaPage() {
  const [tab, setTab] = useState('overview')

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="CANADA">
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
            <span style={{ fontSize:'28px' }}>🇨🇦</span>
            <span className="t-label-xs" style={{ color:'var(--text-dim)' }}>INTERNATIONAL COVERAGE</span>
          </div>
          <h1 className="page-hero-title">Canadian Firearms</h1>
          <p className="page-hero-sub">PAL · Bill C-21 · Province ratings · Ammo prices · Legal news · Sources</p>
        </div>
      </div>

      {/* Alert banner */}
      <div className="dr-alert-warn" style={{ borderRadius:0, borderLeft:'none', borderRight:'none' }}>
        🇨🇦 <strong>CRITICAL (Aug 2023):</strong> Bill C-21 froze all civilian handgun purchases. No new handgun acquisitions permitted. CCFR court challenge ongoing.{' '}
        <a href="https://www.thegunblog.ca" target="_blank" rel="noreferrer" style={{ color:'#60A5FA', textDecoration:'none' }}>Latest: TheGunBlog.ca ↗</a>
      </div>

      {/* Tab nav */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ background:'none', border:'none', borderBottom:`2px solid ${tab===t.key?'var(--gold)':'transparent'}`, color:tab===t.key?'var(--gold)':'var(--text-dim)', padding:'12px 18px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div>
              <div className="dr-grid-2" style={{ gap:'32px', marginBottom:'32px' }}>
                <div>
                  <h2 className="dr-section-title">At a Glance</h2>
                  <p className="t-body-md" style={{ marginBottom:'16px' }}>
                    Canada has some of the most restrictive firearms laws in the Western world, significantly tightened under Bill C-21 (2023). Constitutional protections for firearms ownership do not exist in Canada — all firearms rights are statutory and can be modified by Order in Council without Parliamentary debate.
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {[
                      ['PAL Required', 'All classes — no exceptions'],
                      ['Handgun Freeze', 'No new purchases since Aug 2023'],
                      ['Semi-Auto AWB', '1,500+ models banned (OIC 2020)'],
                      ['Mag Limit', '5rd centrefire / 10rd handgun'],
                      ['Safe Storage', 'Mandatory — inspections permitted'],
                      ['Most Restrictive', 'Quebec (provincial registry)'],
                      ['Most Permissive', 'Alberta, Saskatchewan, Manitoba'],
                    ].map(([k,v]) => (
                      <div key={k} className="dr-spec-row">
                        <span className="dr-spec-key">{k}</span>
                        <span className="dr-spec-val">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="dr-section-title">Quick Province Map</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {PROVINCES.map(p => {
                      const rc = {'A+':'#16A34A','A':'#22C55E','B+':'#65A30D','B':'#84CC16','C+':'#BEF264','C':'#EAB308','D':'#EF4444'}[p.rating]||'#9CA3AF'
                      return (
                        <div key={p.abbr} className="dr-card" style={{ padding:'10px 14px', display:'grid', gridTemplateColumns:'36px 60px 1fr', gap:10, alignItems:'center' }}>
                          <span className="t-display-xs text-gold">{p.abbr}</span>
                          <span className="dr-badge" style={{ color:rc, background:`${rc}18`, border:`1px solid ${rc}40` }}>{p.rating}</span>
                          <span className="t-label-sm" style={{ fontSize:'10px' }}>{p.note.split('.')[0]}.</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FEDERAL LAWS ── */}
          {tab === 'federal' && (
            <div>
              <h2 className="dr-section-title">Federal Firearms Laws</h2>
              <p className="dr-section-sub">All laws include direct links to official government sources</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {FEDERAL_LAWS.map(law => (
                  <div key={law.name} className="dr-card" style={{ borderLeft:`3px solid ${IMPACT_COLORS[law.impact]}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px', marginBottom:'8px', flexWrap:'wrap' }}>
                      <div style={{ flex:1 }}>
                        <h3 className="dr-card-title">{law.name}</h3>
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'4px' }}>
                          <span className="dr-badge" style={{ color:IMPACT_COLORS[law.impact], background:`${IMPACT_COLORS[law.impact]}15`, border:`1px solid ${IMPACT_COLORS[law.impact]}40` }}>{law.impact} IMPACT</span>
                          <span className="dr-badge dr-badge-dim">{law.status}</span>
                          <span className="dr-badge dr-badge-dim">{law.date}</span>
                        </div>
                      </div>
                      <a href={law.url} target="_blank" rel="noreferrer" className="dr-btn-outline" style={{ padding:'5px 12px', fontSize:'10px', flexShrink:0 }}>
                        {law.source} ↗
                      </a>
                    </div>
                    <p className="dr-card-body">{law.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROVINCES ── */}
          {tab === 'provinces' && (
            <div>
              <h2 className="dr-section-title">Province-by-Province Overview</h2>
              <p className="dr-section-sub">Federal law is the floor — provinces can add restrictions, not remove them</p>
              <div className="dr-grid-2">
                {PROVINCES.map(p => {
                  const rc = {'A+':'#16A34A','A':'#22C55E','B+':'#65A30D','B':'#84CC16','C+':'#BEF264','C':'#EAB308','D':'#EF4444'}[p.rating]||'#9CA3AF'
                  return (
                    <div key={p.abbr} className="dr-card dr-card-accent">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                        <div className="dr-card-title">{p.abbr} — {p.name}</div>
                        <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:rc }}>{p.rating}</div>
                      </div>
                      <p className="dr-card-body">{p.note}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── AMMO ── */}
          {tab === 'ammo' && (
            <div>
              <h2 className="dr-section-title">Canadian Ammo Prices (CAD)</h2>
              <p className="dr-section-sub">Current market prices — significantly higher than US due to import duties and weaker CAD</p>
              <div className="dr-table">
                <div className="dr-table-head" style={{ gridTemplateColumns:'120px 100px 80px 80px 1fr' }}>
                  {['Caliber','Price (CAD)','US Equiv.','Availability','Notes'].map(h=><span key={h}>{h}</span>)}
                </div>
                {AMMO.map(a => (
                  <div key={a.caliber} className="dr-table-row" style={{ gridTemplateColumns:'120px 100px 80px 80px 1fr' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:700, color:'var(--text)' }}>{a.caliber}</span>
                    <span className="dr-card-price" style={{ fontSize:'1.1rem' }}>{a.cad}</span>
                    <span className="t-label-md">{a.usd}</span>
                    <span className={`dr-badge ${a.availability==='High'?'dr-badge-green':a.availability==='Low'?'dr-badge-red':'dr-badge-gold'}`}>{a.availability}</span>
                    <span className="t-label-sm">{a.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── NEWS SOURCES ── */}
          {tab === 'news' && (
            <div>
              <h2 className="dr-section-title">Canadian Firearms News Sources</h2>
              <p className="dr-section-sub">Every source includes direct links — click to open</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {NEWS_SOURCES.map(s => (
                  <div key={s.name} className="dr-card" style={{ display:'grid', gridTemplateColumns:'240px 1fr auto', gap:'16px', alignItems:'center' }}>
                    <div>
                      <div className="dr-card-title" style={{ fontSize:'0.95rem' }}>{s.name}</div>
                      <span className="dr-badge dr-badge-dim" style={{ marginTop:'4px', display:'inline-flex' }}>{s.type}</span>
                    </div>
                    <p className="dr-card-body">{s.desc}</p>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 }}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="dr-btn-primary" style={{ padding:'6px 14px', fontSize:'11px' }}>VISIT ↗</a>
                      {s.rss && <a href={s.rss} target="_blank" rel="noreferrer" className="dr-btn-outline" style={{ padding:'5px 14px', fontSize:'10px' }}>RSS FEED ↗</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RESOURCES ── */}
          {tab === 'resources' && (
            <div>
              <h2 className="dr-section-title">Canadian Firearms Resources</h2>
              <div className="dr-grid-2">
                {[
                  { title:'Apply for Your PAL', url:'https://www.rcmp-grc.gc.ca/en/firearms/obtaining-firearms-licence', desc:'RCMP official PAL application process. Safety courses, forms, fees, and timelines. Start here if you are new.' },
                  { title:'CCFR Court Challenge Tracker', url:'https://www.ccfr.ca/legal', desc:'Track ongoing legal challenges to Bill C-21, the OIC, and handgun freeze. Donate to support litigation.' },
                  { title:'Canadian Firearms Safety Course', url:'https://www.rcmp-grc.gc.ca/en/firearms/firearms-safety-courses', desc:'CFSC and CRFSC are mandatory prerequisites for PAL. Find approved instructors in your province.' },
                  { title:'CFO by Province', url:'https://www.rcmp-grc.gc.ca/en/firearms/chief-firearms-officers', desc:'Find your Chief Firearms Officer for permits, transfers, ATT (Authorization to Transport) applications.' },
                  { title:'Prohibited Weapons List (OIC)', url:'https://www.canada.ca/en/public-safety-canada/news/2020/05/government-of-canada-takes-action-to-protect-canadians-from-gun-violence.html', desc:'Full text of the 2020 Order in Council listing all prohibited models.' },
                  { title:'TheGunBlog.ca — Daily News', url:'https://www.thegunblog.ca', desc:'The most reliable independent daily firearms news coverage in Canada. Bookmark it.' },
                ].map(r => (
                  <a key={r.title} href={r.url} target="_blank" rel="noreferrer" className="dr-card" style={{ textDecoration:'none', borderLeft:'3px solid var(--gold)' }}>
                    <div className="dr-card-title" style={{ marginBottom:'6px' }}>{r.title} ↗</div>
                    <p className="dr-card-body">{r.desc}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
