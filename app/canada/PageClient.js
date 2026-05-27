'use client'
import { useState, useEffect } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'

// ── DATA ─────────────────────────────────────────────────────────────────────

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

const NEWS_SOURCES = [
  { name:'TheGunBlog.ca', url:'https://www.thegunblog.ca', type:'News', rss:'https://www.thegunblog.ca/feed/', desc:'Best independent Canadian firearms news. Daily updates, court tracking, policy analysis.' },
  { name:'CCFR', url:'https://www.ccfr.ca', type:'Legal', rss:null, desc:'Canadian Coalition for Firearms Rights — C-21 court challenge lead organization.' },
  { name:'National Firearms Association', url:'https://www.nfa.ca', type:'Advocacy', rss:'https://www.nfa.ca/feed/', desc:'NFA Canada (not the US NFA). Lobbying, education, and member services.' },
  { name:'CSSA', url:'https://www.cdnshootingsports.org', type:'Sport', rss:'https://www.cdnshootingsports.org/feed/', desc:'Canadian Shooting Sports Association — competition, training, advocacy.' },
  { name:'RCMP Firearms Program', url:'https://www.rcmp-grc.gc.ca/en/firearms', type:'Official', rss:null, desc:'Official PAL applications, regulations, class lookup, compliance.' },
  { name:'Public Safety Canada', url:'https://www.canada.ca/en/public-safety-canada/services/firearms.html', type:'Official', rss:null, desc:'Federal policy, OIC updates, official press releases.' },
]

const ARTICLES = [
  {
    title: "Bill C-21's Handgun Freeze: What It Actually Means for Canadian Gun Owners",
    date: 'Updated May 2026',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/US_Supreme_Court_Building.jpg/1280px-US_Supreme_Court_Building.jpg',
    tag: 'LAW',
    mins: '8 min read',
    body: `<p>When Bill C-21 came into force in August 2023, it didn't just change Canadian firearms law — it effectively ended the legal handgun market in Canada. No new handgun purchases. No transfers. No imports. Existing owners keep what they have, but that's where it stops.</p>

<p>The practical effect is this: if you own a handgun in Canada right now, its value just became theoretical. You can shoot it at a range. You can pass it to a licensed heir when you die. You cannot sell it to another civilian. The secondary market for handguns in Canada is legally dead.</p>

<h2>What the Law Actually Says</h2>
<p>Section 58.1 of the amended Firearms Act prohibits the transfer of handguns to civilians. The exceptions are narrow: police, military, some registered collectors, and export. Dealers still hold inventory they legally cannot sell. Some estimates put the value of frozen dealer stock in the hundreds of millions of dollars.</p>

<h2>The CCFR Challenge</h2>
<p>The Canadian Coalition for Firearms Rights filed a constitutional challenge arguing the freeze is arbitrary, violates section 7 rights (life, liberty, security of the person), and was enacted through a process that bypassed proper legislative scrutiny. The federal court ruling is expected sometime in 2025. Don't hold your breath — constitutional firearms challenges in Canada have a poor track record.</p>

<h2>What Happens to Your Handguns When You Die</h2>
<p>You can bequeath restricted firearms to a licensed heir. The heir must hold a valid RPAL. They cannot sell the inherited handguns either — the freeze applies to them too. Executor estates with no licensed heir face a complicated situation involving surrender to CFO or dealer consignment in legal grey areas.</p>

<p><strong>Bottom line:</strong> If you're a Canadian handgun owner, your collection is effectively frozen assets. The CCFR challenge is the only realistic path to reversal, and it's a long shot.</p>`,
    url: 'https://www.ccfr.ca'
  },
  {
    title: "Getting Your PAL in Canada: The Realistic Timeline Nobody Tells You",
    date: 'Updated April 2026',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg',
    tag: 'GUIDE',
    mins: '6 min read',
    body: `<p>The RCMP says PAL processing takes "45 business days." That's the official number. The actual number varies from 6 weeks in Alberta on a good month to 6+ months in Quebec during any backlog period. Here's what the process actually looks like.</p>

<h2>The Course Weekend</h2>
<p>CFSC is a two-day course — typically Saturday/Sunday. Day one covers safe handling, storage rules, and Canadian law. Day two is practical: you demonstrate safe handling of non-restricted firearms and fire some rounds. The written exam has a passing grade of 80%. Most people pass. If you want an RPAL too, the CRFSC is usually offered the same weekend for an extra half-day and fee.</p>

<h2>The Application Bottleneck</h2>
<p>The Canadian Firearms Program processes applications in batches. Your reference calls happen after submission — and if either reference is hard to reach, it stalls everything. The CFP has been chronically understaffed. Summers and post-election periods tend to see longer backlogs.</p>

<h2>Province Reality Check</h2>
<p>Alberta: fastest. Typical non-restricted PAL in 45–60 days. Quebec: slowest. Budget 90–180 days. Ontario varies enormously by CFO office load. RCMP-jurisdiction provinces (Saskatchewan, New Brunswick, Nova Scotia, PEI, Manitoba) are generally faster than CFO provinces because the federal CFP processes applications directly.</p>

<p><strong>Bottom line:</strong> Budget three months minimum, don't book range time based on the RCMP's advertised timeline, and make sure your references answer their phones.</p>`,
    url: 'https://www.rcmp-grc.gc.ca/en/firearms/obtaining-firearms-licence'
  },
  {
    title: "The OIC Assault Weapon Ban: What's Still on the Table in 2026",
    date: 'May 2026',
    img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/M4A1_SOPMOD_Block_II.jpg/1280px-M4A1_SOPMOD_Block_II.jpg',
    tag: 'POLICY',
    mins: '7 min read',
    body: `<p>The 2020 Order in Council banned over 1,500 firearm models by name and description. The mandatory buyback program was announced, contracted, and then cancelled when the Conservative government took office. So where does that leave Canadian owners of AR-15s, Mini-14s, and the other prohibited models?</p>

<h2>Current Legal Status</h2>
<p>Prohibited. But you're not in immediate legal jeopardy — the amnesty order that was extended year after year remains in effect. You cannot sell, transfer, or transport the prohibited firearm (except to a licensed business for destruction or to comply with deactivation requirements). You can store it. That's it.</p>

<h2>What the Conservative Government Has Said</h2>
<p>The Conservatives, who won in 2025, have signalled intent to reverse the OIC ban. This would require either a new OIC (fast, no Parliamentary vote) or legislative amendment (slower, more permanent). No formal reversal has been enacted as of mid-2026. The political will appears present but the legislative calendar is crowded.</p>

<h2>The Buyback That Wasn't</h2>
<p>The Liberal government contracted a buyback program for an estimated C$756 million to C$1.5 billion. The contracts were cancelled. Taxpayers paid for program design, database work, and administration that produced nothing. The affected firearm owners — roughly 150,000 by some estimates — remain in regulatory limbo.</p>

<p><strong>Bottom line:</strong> If you own a prohibited firearm under the OIC, stay current on amnesty renewals and don't hold your breath for quick resolution either way. The political situation is moving but slowly.</p>`,
    url: 'https://www.thegunblog.ca'
  },
]

const IMPACT_C = { CRITICAL:'#ef4444', HIGH:'#f97316', MED:'#f59e0b', REQUIRED:'#3b82f6', 'IN FORCE':'#22c55e' }

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function CanadaPage({ laws=[], provinces=[], articles=[], ammo=[], alerts=[], stats=[] }) {
  // Merge Sanity data with static fallbacks
  const activeLaws      = laws.length      > 0 ? laws      : FEDERAL_LAWS
  const activeProvinces = provinces.length > 0 ? provinces : PROVINCES
  const activeArticles  = articles.length  > 0 ? articles  : ARTICLES
  const activeAmmo      = ammo.length      > 0 ? ammo      : AMMO_DATA
  const [tab,      setTab]      = useState('overview')
  const [expanded, setExpanded] = useState(null)
  const [palStep,  setPalStep]  = useState(null)
  const [news,     setNews]     = useState([])

  // Pull Canadian articles from the site feed
  useEffect(() => {
    fetch('/api/news?category=law&limit=8')
      .then(r => r.json())
      .then(d => {
        const canadian = (d.articles || []).filter(a =>
          /canada|bill c-21|pal\b|rcmp|handgun freeze|ccfr|nfa canada|c21|canadian/i.test(a.title + ' ' + (a.summary||''))
        )
        setNews(canadian)
      }).catch(() => {})
  }, [])

  const TABS = [
    {key:'overview',  label:'🇨🇦 Overview'},
    {key:'laws',      label:'Federal Laws'},
    {key:'provinces', label:'Province Map'},
    {key:'pal',       label:'PAL Guide'},
    {key:'articles',  label:'Articles'},
    {key:'ammo',      label:'Ammo Prices'},
    {key:'sources',   label:'Sources'},
  ]

  return (
    <>
      <Masthead />

      {/* ── HERO ── */}
      <div style={{background:'linear-gradient(180deg,#09090B 0%,#0d1117 100%)',borderBottom:'1px solid var(--border)',padding:'48px 0 32px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'url(https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Canada_%28Pantone%29.svg/1200px-Flag_of_Canada_%28Pantone%29.svg.png)',backgroundPosition:'right center',backgroundSize:'600px',backgroundRepeat:'no-repeat',opacity:.04}} />
        <div className="container" style={{position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <span style={{fontSize:36}}>🇨🇦</span>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',letterSpacing:'.15em',fontWeight:700,textTransform:'uppercase'}}>International Coverage</span>
          </div>
          <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'clamp(3rem,8vw,5rem)',color:'#F0EDE6',letterSpacing:'.04em',lineHeight:1,margin:'0 0 12px'}}>Canadian Firearms</h1>
          <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#6b7280',margin:'0 0 24px',maxWidth:600,lineHeight:1.8}}>
            PAL licensing · Bill C-21 handgun freeze · OIC assault weapon ban · Province-by-province ratings · Ammo prices · Legal news
          </p>

          {/* Status pills */}
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[
              ['Handgun Freeze','#ef4444','In Force'],
              ['OIC Rifle Ban','#ef4444','In Force (Amnesty)'],
              ['PAL Required','#3b82f6','All Classes'],
              ['CCFR Challenge','#f59e0b','Pending'],
              ['Conservative Gov','#22c55e','2025–Present'],
            ].map(([label,color,sub])=>(
              <div key={label} style={{background:color+'18',border:'1px solid '+color+'44',padding:'6px 14px'}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color,letterSpacing:'.08em',textTransform:'uppercase'}}>{label}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#6b7280',marginTop:2}}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ALERT BANNER ── */}
      <div style={{background:'rgba(239,68,68,.08)',borderBottom:'1px solid rgba(239,68,68,.25)',padding:'10px 0'}}>
        <div className="container" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#f87171',display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontWeight:700,flexShrink:0}}>🔴 ACTIVE RESTRICTION:</span>
          <span>Bill C-21 handgun freeze in force since Aug 2023. No civilian handgun purchases or transfers permitted.</span>
          <a href="https://www.ccfr.ca" target="_blank" rel="noreferrer" style={{color:'#C8922A',textDecoration:'none',flexShrink:0}}>CCFR Challenge →</a>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--border)',position:'sticky',top:60,zIndex:20}}>
        <div className="container">
          <div style={{display:'flex',gap:0,overflowX:'auto',scrollbarWidth:'none'}}>
            {TABS.map(t=>(
              <button key={t.key} onClick={()=>setTab(t.key)} style={{background:'none',border:'none',borderBottom:`2px solid ${tab===t.key?'var(--gold)':'transparent'}`,color:tab===t.key?'var(--gold)':'var(--text-dim)',padding:'12px 16px',fontFamily:"'IBM Plex Mono',monospace",fontSize:11,cursor:'pointer',whiteSpace:'nowrap',letterSpacing:'.04em',transition:'color .15s'}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{padding:'40px 0 80px',background:'var(--bg)'}}>
        <div className="container">

          {/* ── OVERVIEW ── */}
          {tab==='overview' && (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32,marginBottom:40}}>
                <div>
                  <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.6rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:16}}>At a Glance</h2>
                  <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#9ca3af',lineHeight:1.9,marginBottom:16}}>
                    Canada has some of the most restrictive civilian firearms laws in the Western world — and they tightened significantly in 2020 and 2023. Unlike the United States, there is no constitutional right to bear arms in Canada. All firearms rights are statutory and can be modified or removed by Order in Council without Parliamentary debate.
                  </p>
                  <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#9ca3af',lineHeight:1.9}}>
                    The result is a system where roughly 2.2 million Canadians hold firearms licences, own an estimated 13 million firearms, and navigate an increasingly complex regulatory environment that shifted dramatically under the Trudeau government and is now in flux under the Conservative government that won in 2025.
                  </p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  {[
                    ['Licensed Owners','~2.2 million PAL holders'],
                    ['Registered Firearms','~13 million (est.)'],
                    ['Handgun Owners','~1.1 million (frozen)'],
                    ['OIC Banned Owners','~150,000 (est. affected)'],
                    ['Governing Party','Conservative (2025–)'],
                    ['PAL Processing','45–120 days by province'],
                    ['Magazine Limit','5 (centrefire) / 10 (handgun)'],
                  ].map(([l,v])=>(
                    <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:'var(--bg2)',border:'1px solid var(--border)'}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>{l}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,color:'var(--text)'}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 3 Laws */}
              <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:16}}>Critical Laws Right Now</h2>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12,marginBottom:40}}>
                {activeLaws.slice(0,3).map(law=>(
                  <div key={law.name} style={{background:'var(--bg2)',border:'1px solid '+(IMPACT_C[law.impact]||'var(--border)')+'44',padding:'16px 20px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:IMPACT_C[law.impact]||'#9ca3af',letterSpacing:'.08em'}}>{law.impact}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563'}}>{law.effectiveDate || law.date}</span>
                    </div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:8,lineHeight:1.2}}>{law.name}</div>
                    <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#9ca3af',lineHeight:1.7,margin:0}}>{law.summary}</p>
                  </div>
                ))}
              </div>

              {/* Live Canadian news */}
              {news.length > 0 && (
                <div>
                  <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:16}}>Latest from Canada</h2>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {news.slice(0,5).map((a,i)=>(
                      <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{display:'flex',gap:12,padding:'12px 16px',background:'var(--bg2)',border:'1px solid var(--border)',textDecoration:'none',transition:'border-color .15s'}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor='#C8922A'}
                        onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:4,lineHeight:1.25}}>{a.title}</div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563'}}>{a.source} · {a.publishedAt?.slice(0,10)}</div>
                        </div>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',flexShrink:0,alignSelf:'center'}}>→</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── FEDERAL LAWS ── */}
          {tab==='laws' && (
            <div>
              <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.8rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:8}}>Federal Firearms Laws</h2>
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginBottom:24}}>Click any law to expand full detail and source links.</p>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {activeLaws.map((law,i)=>(
                  <div key={i} style={{border:'1px solid '+(expanded===i?IMPACT_C[law.impact]||'var(--gold)':'var(--border)'),background:'var(--bg2)',transition:'all .15s'}}>
                    <div onClick={()=>setExpanded(expanded===i?null:i)} style={{padding:'16px 20px',cursor:'pointer',display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{flexShrink:0,width:80,textAlign:'center'}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,padding:'3px 8px',background:(IMPACT_C[law.impact]||'#374151')+'22',color:IMPACT_C[law.impact]||'#9ca3af',letterSpacing:'.06em'}}>{law.impact || law.status}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginTop:4}}>{law.effectiveDate || law.date}</div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,fontWeight:700,color:'var(--text)',marginBottom:6,lineHeight:1.2}}>{law.name}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#9ca3af',lineHeight:1.7}}>{law.summary}</div>
                      </div>
                      <span style={{color:expanded===i?'var(--gold)':'#4b5563',fontSize:14,flexShrink:0}}>{expanded===i?'▼':'▶'}</span>
                    </div>
                    {expanded===i && (
                      <div style={{borderTop:'1px solid var(--border)',padding:'16px 20px 16px 112px',background:'rgba(0,0,0,.2)'}}>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#9ca3af',lineHeight:1.9,margin:'0 0 12px'}}>{law.detail}</p>
                        <a href={law.url} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',textDecoration:'none'}}>Source: Parliament of Canada / RCMP ↗</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROVINCES ── */}
          {tab==='provinces' && (
            <div>
              <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.8rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:8}}>Province Ratings</h2>
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginBottom:24}}>Based on CFO enforcement, processing times, and provincial legislation. Click to expand.</p>

              {/* Legend */}
              <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
                {[['B+/B','#22c55e','Gun-friendly'],['C+/C','#f59e0b','Average'],['C-','#ef4444','Restrictive'],['D','#dc2626','Most Restrictive']].map(([grade,color,label])=>(
                  <div key={grade} style={{display:'flex',alignItems:'center',gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>
                    <span style={{background:color,width:10,height:10,borderRadius:2,display:'block'}} />
                    <span>{grade} — {label}</span>
                  </div>
                ))}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:10}}>
                {activeProvinces.map((p,i)=>(
                  <div key={p.abbr} style={{border:'1px solid '+(expanded===('p'+i)?(p.color || (p.rating>='B'?'#22c55e':p.rating>='C'?'#f59e0b':p.rating==='D'?'#dc2626':'#ef4444')):'var(--border)'),background:'var(--bg2)',transition:'all .15s'}}>
                    <div onClick={()=>setExpanded(expanded===('p'+i)?null:('p'+i))} style={{padding:'14px 16px',cursor:'pointer',display:'flex',gap:12,alignItems:'center'}}>
                      <div style={{width:42,height:42,background:(p.color || (p.rating>='B'?'#22c55e':p.rating>='C'?'#f59e0b':p.rating==='D'?'#dc2626':'#ef4444'))+'22',border:'1px solid '+(p.color || (p.rating>='B'?'#22c55e':p.rating>='C'?'#f59e0b':p.rating==='D'?'#dc2626':'#ef4444'))+'44',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700,color:(p.color || (p.rating>='B'?'#22c55e':p.rating>='C'?'#f59e0b':p.rating==='D'?'#dc2626':'#ef4444'))}}>{p.abbr}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--text)'}}>{p.name}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>{p.summary.slice(0,60)}...</div>
                      </div>
                      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:(p.color || (p.rating>='B'?'#22c55e':p.rating>='C'?'#f59e0b':p.rating==='D'?'#dc2626':'#ef4444')),letterSpacing:'.04em',flexShrink:0}}>{p.rating}</div>
                    </div>
                    {expanded===('p'+i) && (
                      <div style={{borderTop:'1px solid var(--border)',padding:'14px 16px',background:'rgba(0,0,0,.15)'}}>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#9ca3af',lineHeight:1.8,marginBottom:12}}>{p.summary}</p>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {p.highlights.map((h,j)=>(
                            <div key={j} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',display:'flex',gap:6}}>
                              <span style={{color:(p.color || (p.rating>='B'?'#22c55e':p.rating>='C'?'#f59e0b':p.rating==='D'?'#dc2626':'#ef4444')),flexShrink:0}}>›</span>{h}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PAL GUIDE ── */}
          {tab==='pal' && (
            <div style={{maxWidth:760}}>
              <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.8rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:8}}>How to Get Your PAL</h2>
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginBottom:32}}>Step-by-step. Click each step for detail.</p>
              <div style={{position:'relative',paddingLeft:32}}>
                <div style={{position:'absolute',left:11,top:0,bottom:0,width:1,background:'var(--border)'}} />
                {PAL_STEPS.map((s,i)=>(
                  <div key={i} style={{position:'relative',marginBottom:20}}>
                    <div style={{position:'absolute',left:-32,top:16,width:22,height:22,background:palStep===i?'var(--gold)':'var(--bg2)',border:'2px solid '+(palStep===i?'var(--gold)':'var(--border)'),borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:palStep===i?'#000':'#64748b'}}>{s.step}</span>
                    </div>
                    <div onClick={()=>setPalStep(palStep===i?null:i)} style={{border:'1px solid '+(palStep===i?'var(--gold)':'var(--border)'),background:'var(--bg2)',padding:'14px 18px',cursor:'pointer',transition:'all .15s'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:4}}>{s.title}</div>
                          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A'}}>⏱ {s.time}</span>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>💰 {s.cost}</span>
                          </div>
                        </div>
                        <span style={{color:palStep===i?'var(--gold)':'#4b5563',fontSize:12,flexShrink:0}}>{palStep===i?'▼':'▶'}</span>
                      </div>
                      {palStep===i && (
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#9ca3af',lineHeight:1.9,margin:'12px 0 0'}}>{s.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:24,padding:'16px 20px',background:'rgba(200,146,42,.06)',border:'1px solid rgba(200,146,42,.3)'}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',fontWeight:700,marginBottom:8}}>IMPORTANT NOTES</div>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {['Spousal/partner notification is mandatory — they have legal standing to object to your application.',
                    'A criminal record does not automatically disqualify you — severity and recency matter.',
                    'PAL must be renewed every 5 years — lapsed PAL makes your firearms unlicensed.',
                    'Youth under 18 may get a Possession Only Licence (POL) with parental consent.',
                    'RPAL is required for any restricted firearm (most handguns, certain semi-autos).'].map((n,i)=>(
                    <div key={i} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#9ca3af',display:'flex',gap:8}}>
                      <span style={{color:'#C8922A',flexShrink:0}}>›</span>{n}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ARTICLES ── */}
          {tab==='articles' && (
            <div>
              <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.8rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:8}}>Canadian Firearms Analysis</h2>
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginBottom:28}}>Written by the DownRange team. No press release rewriting.</p>
              <div style={{display:'flex',flexDirection:'column',gap:32}}>
                {activeArticles.map((a,i)=>(
                  <article key={i} style={{border:'1px solid var(--border)',background:'var(--bg2)',overflow:'hidden'}}>
                    <div style={{height:200,overflow:'hidden',position:'relative'}}>
                      <img src={a.imageUrl || a.img} alt={a.title} style={{width:'100%',height:'100%',objectFit:'cover',opacity:.7}} />
                      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,#111318 0%,transparent 60%)'}} />
                      <div style={{position:'absolute',bottom:12,left:16,display:'flex',gap:8}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,padding:'3px 8px',background:'#C8922A',color:'#000'}}>{a.tag}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:'3px 8px',background:'rgba(0,0,0,.7)',color:'#9ca3af'}}>{a.mins}</span>
                      </div>
                    </div>
                    <div style={{padding:'20px 24px'}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginBottom:8}}>{a.date}</div>
                      <h3 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.6rem',color:'var(--text)',letterSpacing:'.03em',lineHeight:1.1,marginBottom:16}}>{a.title}</h3>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#9ca3af',lineHeight:1.9}} dangerouslySetInnerHTML={{__html:a.body}} />
                      <a href={a.url} target="_blank" rel="noreferrer" style={{display:'inline-block',marginTop:16,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',textDecoration:'none'}}>Source / Further Reading ↗</a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* ── AMMO ── */}
          {tab==='ammo' && (
            <div>
              <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.8rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:8}}>Canadian Ammo Prices</h2>
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginBottom:8}}>Approximate retail prices. Import-dependent calibers carry a 25–35% premium vs. US retail due to CAD/USD exchange and logistics.</p>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',marginBottom:24}}>CAD/USD rate: ~0.74 as of mid-2026</div>
              <div style={{border:'1px solid var(--border)',overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'140px 110px 110px 90px 1fr',background:'rgba(0,0,0,.4)',borderBottom:'2px solid var(--border)'}}>
                  {['Caliber','CAD Price','USD Equiv','Availability','Notes'].map((h,i)=>(
                    <div key={i} style={{padding:'10px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:700}}>{h}</div>
                  ))}
                </div>
                {activeAmmo.map((a,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'140px 110px 110px 90px 1fr',borderBottom:i<activeAmmo.length-1?'1px solid var(--border)':'none',background:i%2?'rgba(0,0,0,.1)':'transparent'}}>
                    <div style={{padding:'12px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:700,color:'var(--text)'}}>{a.caliber}</div>
                    <div style={{padding:'12px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:700,color:'#C8922A'}}>{a.cadPrice || a.cad}</div>
                    <div style={{padding:'12px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#6b7280'}}>{a.usdEq}</div>
                    <div style={{padding:'12px 14px'}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,padding:'2px 7px',background:a.avail==='High'?'rgba(34,197,94,.15)':a.avail==='Moderate'?'rgba(245,158,11,.15)':'rgba(239,68,68,.15)',color:a.avail==='High'?'#22c55e':a.avail==='Moderate'?'#f59e0b':'#ef4444'}}>{a.avail}</span>
                    </div>
                    <div style={{padding:'12px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#6b7280'}}>{a.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SOURCES ── */}
          {tab==='sources' && (
            <div>
              <h2 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.8rem',color:'var(--text)',letterSpacing:'.04em',marginBottom:8}}>Canadian Firearms Sources</h2>
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginBottom:24}}>Primary sources DownRange monitors and recommends for Canadian firearms law.</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
                {NEWS_SOURCES.map(s=>(
                  <a key={s.name} href={s.url} target="_blank" rel="noreferrer" style={{textDecoration:'none',display:'block',background:'var(--bg2)',border:'1px solid var(--border)',padding:'16px 20px',transition:'border-color .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor='#C8922A'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
                    <div style={{display:'flex',gap:8,alignItems:'flex-start',marginBottom:8}}>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:3}}>{s.name}</div>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,padding:'2px 7px',background:'rgba(200,146,42,.15)',color:'#C8922A',letterSpacing:'.06em',textTransform:'uppercase'}}>{s.type}</span>
                      </div>
                      <span style={{color:'#C8922A',fontSize:14,flexShrink:0}}>↗</span>
                    </div>
                    <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#6b7280',lineHeight:1.7,margin:'0 0 8px'}}>{s.desc}</p>
                    {s.rss && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#f97316'}}>● RSS feed — in DownRange pull queue</div>}
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
