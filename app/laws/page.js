import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import LawAssistant from '../../components/ui/LawAssistant'
import ReciprocityPlanner from '../../components/ui/ReciprocityPlanner'
import { fetchLegislation, fetchBreakingAlerts, fetchAllStateProfiles } from '../../sanity/lib/client'

export const metadata = {
  title: 'Laws & Legislation — DownRange',
  description: '2A law tracker: Federal bills, ATF rules, SCOTUS cases, state legislation. AI law assistant.'
}
export const revalidate = 900

// ── STATIC SEED DATA ────────────────────────────────────────────
const SCOTUS_CASES = [
  // ── ACTIVE 2025-26 TERM ────────────────────────────────────────────────
  { id:'hemani', name:'United States v. Hemani', year:2026, outcome:'PENDING', summary:'Can Congress disarm someone who habitually uses controlled substances (marijuana/cocaine)? Tests §922(g)(3). Trump DOJ supports conviction. Decision expected June/July 2026.', significance:'HIGH', status:'Oral arguments 2026', url:'https://www.scotusblog.com/case-files/cases/united-states-v-hemani/' },
  { id:'wolford', name:'Wolford v. Lopez', year:2026, outcome:'PENDING', summary:'Hawaii law barring concealed carry permit holders from carrying on private property without explicit owner permission. Tests public carry rights after Bruen. Oral arguments Jan 20, 2026.', significance:'HIGH', status:'Argued Jan 2026', url:'https://www.scotusblog.com/case-files/cases/wolford-v-lopez/' },
  { id:'viramontes', name:'Viramontes v. Cook County', year:2026, outcome:'PENDING', summary:'Challenge to Illinois/Cook County semi-automatic weapons ban. AWB constitutionality under Bruen text-and-history test. Under conference review.', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu' },
  { id:'duncan', name:'Duncan v. Bonta', year:2026, outcome:'PENDING', summary:'California magazine capacity law — 10-round limit. Relisted multiple times for conference. Whether large-capacity magazines are constitutionally protected arms.', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu' },
  { id:'nagr', name:'National Assn for Gun Rights v. Lamont', year:2026, outcome:'PENDING', summary:'Connecticut assault weapon ban challenge. Second major AWB case alongside Viramontes. Under conference consideration for cert grant.', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu' },
  // ── DECIDED 2024 ────────────────────────────────────────────────────────
  { id:'cargill', name:'Garland v. Cargill', year:2024, outcome:'WON', summary:'6-3 ruling: bump stocks are NOT machine guns under federal law. ATF rule struck down 2019 as exceeding statutory authority. Semi-auto fire regardless of rate is not automatic.', significance:'HIGH', status:'Decided June 2024', url:'https://www.supremecourt.gov/opinions/23pdf/22-976_1b82.pdf' },
  { id:'rahimi', name:'United States v. Rahimi', year:2024, outcome:'LOST', summary:'8-1 ruling upheld disarming individuals under domestic violence restraining orders. Coercive abusers may be temporarily disarmed consistent with historical tradition. Thomas dissented alone.', significance:'MED', status:'Decided June 2024', url:'https://www.supremecourt.gov/opinions/23pdf/22-915_9ok0.pdf' },
  { id:'vanderstock', name:'Bondi v. VanDerStok', year:2025, outcome:'LOST', summary:'7-2 ruling upheld the ATF ghost gun rule. ATF can regulate kits that are readily convertible to functional firearms under GCA. Gorsuch and Thomas dissented.', significance:'MED', status:'Decided 2025', url:'https://www.supremecourt.gov' },
  // ── LANDMARK PRECEDENTS ─────────────────────────────────────────────────
  { id:'bruen', name:'NY State Rifle & Pistol Assn v. Bruen', year:2022, outcome:'WON', summary:'Landmark 6-3 ruling established text-and-history test for 2A cases. Struck NY "proper cause" requirement for carry permits. Every subsequent 2A case is analyzed under the Bruen framework.', significance:'HIGH', status:'Decided June 2022', url:'https://www.supremecourt.gov/opinions/21pdf/20-843_7j80.pdf' },
  { id:'mcdonald', name:'McDonald v. City of Chicago', year:2010, outcome:'WON', summary:'Incorporated 2A against states via 14th Amendment. Struck Chicago handgun ban. Established 2A as a fundamental right binding on all 50 states.', significance:'HIGH', status:'Decided June 2010', url:'https://supreme.justia.com/cases/federal/us/561/742/' },
  { id:'heller', name:'DC v. Heller', year:2008, outcome:'WON', summary:'2A protects individual right to keep arms for self-defense independent of militia service. Struck DC handgun ban. The foundational modern 2A case.', significance:'HIGH', status:'Decided June 2008', url:'https://supreme.justia.com/cases/federal/us/554/570/' },
  // ── CERT DENIED ─────────────────────────────────────────────────────────
  { id:'gardner', name:'Gardner v. Maryland (AR-15 Ban)', year:2025, outcome:'CERT DENIED', summary:'SCOTUS declined to hear challenge to Maryland AR-15 ban after 15 relistings. Cert denied June 2, 2025. Maryland ban stands. Kavanaugh noted Court should address AR-15 question "soon."', significance:'HIGH', status:'Cert Denied Jun 2025', url:'https://scotus2a.com' },
]


const ATF_RULES = [
  { id:'34rules', title:'ATF Historic Regulatory Reform Package — 34 Rules', status:'advancing', date:'2026-04-29', summary:'DOJ/ATF released 34 notices of final and proposed rulemaking on April 29, 2026. Most significant regulatory reform in US history. Covers FFL operations, recordkeeping modernization, NFA compliance, import/export, and aligns regulations with Bruen and recent court precedents.', impact:'HIGH', url:'https://www.atf.gov/news/press-releases/doj-and-atf-announce-regulatory-reforms-to-reduce-burdens-law-abiding-gun-owners-and-businesses' },
  { id:'nfa-tax', title:'NFA Tax Stamp Eliminated — One Big Beautiful Bill Act', status:'passed', date:'2026-01-01', summary:'President Trump signed H.R. 1 on July 4, 2025 eliminating the $200 NFA tax stamp for suppressors, SBRs, SBSs, and AOWs effective January 1, 2026. Registration and Form 4 requirements remain. Machine guns and destructive devices still require $200 stamp.', impact:'HIGH', url:'https://www.congress.gov/bill/119th-congress/house-bill/1' },
  { id:'pistol-brace-rescinded', title:'Pistol Brace Rule Rescinded', status:'passed', date:'2025-06-01', summary:'ATF rescinded the 2023 pistol brace final rule (1140-AA98). Brace-equipped pistols are no longer classified as SBRs. Removes threat of felony prosecution for existing owners. Acknowledges courts that vacated the rule.', impact:'HIGH', url:'https://www.atf.gov/rules-and-regulations/atf-launches-new-era-reform' },
  { id:'bump-stock-revised', title:'Bump Stock Definition Revised Post-Cargill', status:'passed', date:'2025-07-01', summary:'Following Garland v. Cargill (2024, 6-3), ATF revised machine gun definition to exclude bump stocks. Semi-auto rate of fire regardless of method does not constitute machine gun fire.', impact:'HIGH', url:'https://www.atf.gov' },
  { id:'80pct-vander', title:'Frames & Receivers Rule (Bondi v. VanDerStok)', status:'challenged', date:'2022-08-24', summary:'80% lower kit rule upheld 7-2 by SCOTUS in 2025 (Bondi v. VanDerStok) as not facially invalid under GCA. ATF can regulate kits that are readily convertible. Standalone 80% lowers without kits treated differently. State laws vary.', impact:'HIGH', url:'https://www.atf.gov/rules-and-regulations/definition-frame-or-receiver' },
  { id:'engaged-business', title:'"Engaged in the Business" Rule Rescinded', status:'passed', date:'2025-08-01', summary:'ATF rescinded broad regulatory expansions of "engaged in the business" definition. Standard reverts to specific definitions codified in the Bipartisan Safer Communities Act (BSCA). Reduces enforcement risk for private sellers.', impact:'MED', url:'https://www.atf.gov/rules-and-regulations/atf-launches-new-era-reform' },
  { id:'forced-reset', title:'Forced Reset Triggers — Legal Federally', status:'passed', date:'2025-03-15', summary:'DOJ settlement restored federal legality of forced reset triggers (FRTs). State laws still apply and vary. FRTs remain prohibited in some states.', impact:'MED', url:'https://www.atf.gov' },
  { id:'dealer-records', title:'Dealer Records Retention Update', status:'passed', date:'2022-08-31', summary:'Part of 34-rule package revisit. ATF proposing modernized digital recordkeeping standards for 4473s. Permanent retention requirement under review as part of April 2026 reform package.', impact:'MED', url:'https://www.atf.gov' },
]



// Build exact Congress.gov bill URLs
function billUrl(number, type, congress) {
  const chamberMap = { 'H.R.':'house-bill', 'S.':'senate-bill', 'H.J.Res.':'house-joint-resolution', 'S.J.Res.':'senate-joint-resolution', 'H.Con.Res.':'house-concurrent-resolution' }
  const parts = (type || number || '').split(' ')
  const prefix = parts.length > 1 ? parts[0] : 'H.R.'
  const num = parts.length > 1 ? parts[1] : parts[0]
  const chamber = chamberMap[prefix] || 'house-bill'
  const cong = congress || '118th'
  return `https://www.congress.gov/bill/${cong}-congress/${chamber}/${num}`
}

const SEED_FEDERAL = [
  { _id:'f1', title:'Firearm Safety Act of 2024', billNumber:'H.R. 7910', status:'committee', level:'federal', summary:'Universal background checks on all firearm sales and transfers including private sales.', lastActionDate:'2024-09-15', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/house-bill/7910' },
  { _id:'f2', title:'National Concealed Carry Reciprocity Act', billNumber:'H.R. 38', status:'passed', level:'federal', summary:'Requires all states to recognize valid concealed carry permits from other states.', lastActionDate:'2024-07-20', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/house-bill/38' },
  { _id:'f3', title:'Hearing Protection Act', billNumber:'H.R. 2296', status:'committee', level:'federal', summary:'Removes suppressors from NFA regulation. Treats them like regular firearms.', lastActionDate:'2024-06-10', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/house-bill/2296' },
  { _id:'f4', title:'BSCA — Bipartisan Safer Communities Act', billNumber:'S. 2938', status:'passed', level:'federal', summary:'Enhanced background checks for under-21 buyers. Closes boyfriend loophole. $15B mental health funding.', lastActionDate:'2022-06-25', impact:'HIGH', url:'https://www.congress.gov/bill/117th-congress/senate-bill/2938' },
  { _id:'f5', title:'Equal Access to Justice for Victims of Gun Violence', billNumber:'S. 1223', status:'failed', level:'federal', summary:'Would repeal PLCAA liability protections for gun manufacturers.', lastActionDate:'2024-03-12', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/senate-bill/1223' },
  { _id:'f6', title:'Assault Weapons Ban of 2023', billNumber:'H.R. 698', status:'committee', level:'federal', summary:'Would ban sale and manufacture of semi-automatic rifles with certain features.', lastActionDate:'2023-11-30', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/house-bill/698' },
]

const SEED_STATE = [
  { _id:'s1', title:'Texas Firearms Freedom Act', billNumber:'TX SB 214', status:'passed', state:'TX', level:'state', summary:'Removes state requirement for license to carry handguns. Constitutional carry expansion.', lastActionDate:'2024-05-01', impact:'HIGH', url:'https://capitol.texas.gov' },
  { _id:'s2', title:'California Assault Weapon Control Act Update', billNumber:'CA AB 2364', status:'challenged', state:'CA', level:'state', summary:'Updates AWB definitions. Enjoined by 9th Circuit pending Bruen analysis.', lastActionDate:'2024-08-15', impact:'HIGH', url:'https://leginfo.legislature.ca.gov' },
  { _id:'s3', title:'Washington Magazine Limit', billNumber:'WA SB 5078', status:'challenged', state:'WA', level:'state', summary:'Bans manufacture and sale of magazines over 10 rounds. Challenged under Bruen.', lastActionDate:'2024-04-22', impact:'HIGH', url:'https://app.leg.wa.gov' },
  { _id:'s4', title:'Florida Permitless Carry Act', billNumber:'FL HB 543', status:'passed', state:'FL', level:'state', summary:'Removed license requirement for concealed carry. 26th constitutional carry state.', lastActionDate:'2023-04-03', impact:'HIGH', url:'https://www.flsenate.gov' },
  { _id:'s5', title:'Illinois PICA — Assault Weapons Ban', billNumber:'IL SB 2226', status:'challenged', state:'IL', level:'state', summary:'Banned assault weapons and large-capacity magazines. Multiple court challenges pending.', lastActionDate:'2024-07-10', impact:'HIGH', url:'https://www.ilga.gov' },
  { _id:'s6', title:'Georgia Constitutional Carry', billNumber:'GA HB 218', status:'passed', state:'GA', level:'state', summary:'Allows permitless carry for all legal firearm owners. No license required.', lastActionDate:'2022-04-12', impact:'MED', url:'https://www.legis.ga.gov' },
]

// ── HELPERS ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  passed:     { color:'#34D399', bg:'#001A0A', label:'PASSED'     },
  signed:     { color:'#34D399', bg:'#001A0A', label:'SIGNED'     },
  failed:     { color:'#EF4444', bg:'#1A0000', label:'FAILED'     },
  vetoed:     { color:'#EF4444', bg:'#1A0000', label:'VETOED'     },
  challenged: { color:'#FBBF24', bg:'#1A0E00', label:'CHALLENGED' },
  advancing:  { color:'#60A5FA', bg:'#001020', label:'ADVANCING'  },
  committee:  { color:'#9CA3AF', bg:'#111318', label:'COMMITTEE'  },
  pending:    { color:'#9CA3AF', bg:'#111318', label:'PENDING'    },
}
const IMPACT_COLORS = { HIGH:'#EF4444', MED:'#FBBF24', LOW:'#9CA3AF' }

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending
  return (
    <span style={{ fontFamily:'monospace', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', color:s.color, background:s.bg, padding:'3px 8px', border:`1px solid ${s.color}40`, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  )
}

function BillCard({ bill }) {
  const s = STATUS_CONFIG[bill.status?.toLowerCase()] || STATUS_CONFIG.pending
  return (
    <div style={{ background:'#111318', border:`1px solid #1F2428`, borderLeft:`3px solid ${s.color}`, padding:'16px 20px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:8 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#C8922A', fontWeight:700 }}>{bill.billNumber}</span>
          <StatusBadge status={bill.status} />
          {bill.state && <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563', background:'#1F2428', padding:'2px 6px' }}>{bill.state}</span>}
          {bill.impact && <span style={{ fontFamily:'monospace', fontSize:'9px', color:IMPACT_COLORS[bill.impact] || '#9CA3AF' }}>{bill.impact} IMPACT</span>}
        </div>
        {bill.lastActionDate && (
          <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', flexShrink:0 }}>
            {new Date(bill.lastActionDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
          </span>
        )}
      </div>
      <h3 style={{ fontSize:'15px', fontWeight:600, color:'#F0EDE6', lineHeight:1.35, marginBottom:6 }}>{bill.title}</h3>
      {bill.summary && <p style={{ fontSize:'13px', color:'#6B7280', lineHeight:1.6, marginBottom:10 }}>{bill.summary}</p>}
      {bill.url && <a href={bill.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily:'monospace', fontSize:'10px', color:'#60A5FA', textDecoration:'none' }}>VIEW FULL TEXT ↗</a>}
    </div>
  )
}

export default async function LawsPage({ searchParams }) {
  const tab = searchParams?.tab || 'federal'

  const [legislation, alerts, stateProfiles] = await Promise.all([
    fetchLegislation(40).catch(()=>[]),
    fetchBreakingAlerts(5).catch(()=>[]),
    fetchAllStateProfiles().catch(()=>[]),
  ])

  const federal = legislation.filter(l=>l.level==='federal').length > 0
    ? legislation.filter(l=>l.level==='federal')
    : SEED_FEDERAL

  const state = legislation.filter(l=>l.level==='state').length > 0
    ? legislation.filter(l=>l.level==='state')
    : SEED_STATE

  const TABS = [
    { key:'federal',     label:'🏛 Federal Bills',    count: federal.length },
    { key:'state',       label:'🗺 State Bills',       count: state.length },
    { key:'atf',         label:'📋 ATF Rules',         count: ATF_RULES.length },
    { key:'scotus',      label:'⚖ SCOTUS Cases',      count: SCOTUS_CASES.length },
    { key:'assistant',   label:'🤖 AI Law Assistant',  count: null },
    { key:'reciprocity', label:'🗺 CCW Reciprocity',    count: null },
  ]

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="LAWS">
        <div className="container">
          <h1 className="page-hero-title">Laws & Legislation</h1>
          <p className="page-hero-sub">
            Federal bills · State laws · ATF rules · SCOTUS tracker · AI law assistant · CCW reciprocity
          </p>
        </div>
      </div>

      {/* Breaking law alerts */}
      {alerts.length > 0 && (
        <div style={{ background:'#1A0000', borderBottom:'1px solid #7F1D1D', padding:'12px 0' }}>
          <div className="container">
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {alerts.slice(0,3).map(a => (
                <div key={a._id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#EF4444', display:'inline-block' }} />
                  <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#FCA5A5' }}>{a.headline}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:'32px 0' }}>
        <div className="container">

          {/* Tab nav */}
          <div style={{ display:'flex', gap:0, borderBottom:'1px solid #1F2428', marginBottom:32, flexWrap:'wrap' }}>
            {TABS.map(t => (
              <a key={t.key} href={`/laws?tab=${t.key}`}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'12px 20px', fontFamily:'monospace', fontSize:'12px', textDecoration:'none', letterSpacing:'0.05em', color: tab===t.key ? '#C8922A' : '#4B5563', borderBottom:`2px solid ${tab===t.key ? '#C8922A' : 'transparent'}`, transition:'color 0.15s', whiteSpace:'nowrap' }}>
                {t.label}
                {t.count !== null && (
                  <span style={{ background: tab===t.key ? '#C8922A20' : '#1F2428', color: tab===t.key ? '#C8922A' : '#4B5563', fontFamily:'monospace', fontSize:'9px', padding:'1px 6px', borderRadius:10 }}>
                    {t.count}
                  </span>
                )}
              </a>
            ))}
          </div>

          {/* ── FEDERAL BILLS ── */}
          {tab === 'federal' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em' }}>FEDERAL FIREARMS LEGISLATION</h2>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563' }}>SORT:</span>
                  {['newest','status','impact'].map(s=>(
                    <a key={s} href={`/laws?tab=federal&sort=${s}`}
                      style={{ fontFamily:'monospace', fontSize:'10px', padding:'3px 10px', border:'1px solid #1F2428', color: searchParams?.sort===s||(s==='newest'&&!searchParams?.sort)?'#C8922A':'#4B5563', textDecoration:'none', background: searchParams?.sort===s||(s==='newest'&&!searchParams?.sort)?'#C8922A20':'transparent' }}>
                      {s.toUpperCase()}
                    </a>
                  ))}
                  <a href="https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22firearms+second+amendment%22%2C%22congress%22%3A%22119%22%7D" target="_blank" rel="noreferrer"
                    style={{ fontFamily:'monospace', fontSize:'10px', color:'#60A5FA', textDecoration:'none' }}>CONGRESS.GOV ↗</a>
                </div>
              </div>

              {/* Status filter pills */}
              <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
                {['All','Passed','Committee','Challenging','Failed'].map(f => (
                  <a key={f} href={`/laws?tab=federal${f!=='All'?`&status=${f.toLowerCase()}`:''}` }
                    style={{ fontFamily:'monospace', fontSize:'10px', padding:'4px 12px', border:'1px solid #1F2428', color:'#6B7280', textDecoration:'none', background: searchParams?.status===f.toLowerCase()||(f==='All'&&!searchParams?.status) ? '#C8922A20' : 'transparent' }}>
                    {f}
                  </a>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {federal
                  .filter(b => !searchParams?.status || b.status?.toLowerCase().includes(searchParams.status))
                  .map(b => <BillCard key={b._id} bill={b} />)}
              </div>

              <div style={{ marginTop:24, padding:'16px', background:'#111318', border:'1px solid #1F2428', fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
                📡 Data auto-updated via Congress.gov API every 2 hours when CONGRESS_GOV_KEY is configured.
                Source: <a href="https://api.congress.gov" target="_blank" rel="noreferrer" style={{ color:'#60A5FA' }}>api.congress.gov</a>
              </div>
            </div>
          )}

          {/* ── STATE BILLS ── */}
          {tab === 'state' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em' }}>STATE FIREARMS LEGISLATION</h2>
              </div>

              {/* State filter */}
              <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
                {['All',...new Set(state.map(b=>b.state).filter(Boolean))].map(s => (
                  <a key={s} href={`/laws?tab=state${s!=='All'?`&state=${s}`:''}`}
                    style={{ fontFamily:'monospace', fontSize:'10px', padding:'4px 10px', border:'1px solid #1F2428', color: searchParams?.state===s||(s==='All'&&!searchParams?.state) ? '#C8922A' : '#6B7280', textDecoration:'none', background: searchParams?.state===s||(s==='All'&&!searchParams?.state) ? '#C8922A20' : 'transparent' }}>
                    {s}
                  </a>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                {state
                  .filter(b => !searchParams?.state || b.state === searchParams.state)
                  .map(b => <BillCard key={b._id} bill={b} />)}
              </div>

              <div style={{ marginTop:24, padding:'16px', background:'#111318', border:'1px solid #1F2428', fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
                📡 State data auto-updated via LegiScan API (all 50 states) when LEGISCAN_KEY is configured.
                Source: <a href="https://legiscan.com/legiscan" target="_blank" rel="noreferrer" style={{ color:'#60A5FA' }}>legiscan.com</a>
              </div>
            </div>
          )}

          {/* ── ATF RULES ── */}
          {tab === 'atf' && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:8 }}>ATF RULES & REGULATIONS</h2>
                <p style={{ fontFamily:'monospace', fontSize:'12px', color:'#4B5563', lineHeight:1.7 }}>
                  Current ATF rulemaking that affects lawful gun owners. Court challenge status updated by the news feed.
                </p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {ATF_RULES.map(rule => {
                  const s = STATUS_CONFIG[rule.status] || STATUS_CONFIG.pending
                  return (
                    <div key={rule.id} style={{ background:'#111318', border:`1px solid #1F2428`, borderLeft:`4px solid ${s.color}`, padding:'20px 24px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:10 }}>
                        <div>
                          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
                            <StatusBadge status={rule.status} />
                            <span style={{ fontFamily:'monospace', fontSize:'9px', color:IMPACT_COLORS[rule.impact], background:'#111318', padding:'2px 6px', border:`1px solid ${IMPACT_COLORS[rule.impact]}40` }}>{rule.impact} IMPACT</span>
                            <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563' }}>{rule.date}</span>
                          </div>
                          <h3 style={{ fontSize:'16px', fontWeight:700, color:'#F0EDE6', lineHeight:1.3, marginBottom:8 }}>{rule.title}</h3>
                          <p style={{ fontSize:'13px', color:'#6B7280', lineHeight:1.7 }}>{rule.summary}</p>
                        </div>
                      </div>
                      <a href={rule.url} target="_blank" rel="noreferrer" style={{ fontFamily:'monospace', fontSize:'10px', color:'#60A5FA', textDecoration:'none' }}>ATF SOURCE ↗</a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SCOTUS ── */}
          {tab === 'scotus' && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:8 }}>SUPREME COURT — 2A CASES</h2>
                <p style={{ fontFamily:'monospace', fontSize:'12px', color:'#4B5563', lineHeight:1.7 }}>
                  Key Second Amendment decisions that shape the legal landscape for every gun owner in America.
                </p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {SCOTUS_CASES.map(cas => (
                  <div key={cas.id} style={{ background:'#111318', border:`1px solid ${cas.outcome==='WON'?'#16603440':'#7F1D1D40'}`, padding:'24px', display:'grid', gridTemplateColumns:'80px 1fr', gap:20 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color: cas.outcome==='WON' ? '#34D399' : '#EF4444', lineHeight:1 }}>{cas.year}</div>
                      <div style={{ fontFamily:'monospace', fontSize:'9px', color: cas.outcome==='WON' ? '#34D399' : '#EF4444', marginTop:4, fontWeight:700 }}>{cas.outcome}</div>
                      <div style={{ fontFamily:'monospace', fontSize:'9px', color:IMPACT_COLORS[cas.significance], marginTop:4 }}>{cas.significance}</div>
                    </div>
                    <div>
                      <h3 style={{ fontSize:'16px', fontWeight:700, color:'#F0EDE6', marginBottom:10, lineHeight:1.3 }}>{cas.name}</h3>
                      <p style={{ fontSize:'13px', color:'#94A3B8', lineHeight:1.7, marginBottom:10 }}>{cas.summary}</p>
                      <a href={cas.url} target="_blank" rel="noreferrer" style={{ fontFamily:'monospace', fontSize:'10px', color:'#60A5FA', textDecoration:'none' }}>READ OPINION ↗</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI ASSISTANT ── */}
          {tab === 'assistant' && (
            <div style={{ maxWidth:720 }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:8 }}>AI LAW ASSISTANT</h2>
              <p style={{ fontFamily:'monospace', fontSize:'12px', color:'#4B5563', lineHeight:1.7, marginBottom:24 }}>
                Ask anything about US firearms law. Powered by Claude AI + DownRange state database.
                Requires ANTHROPIC_API_KEY in Vercel environment variables.
              </p>
              <LawAssistant />
            </div>
          )}

          {/* ── RECIPROCITY ── */}
          {tab === 'reciprocity' && (
            <div style={{ maxWidth:720 }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:8 }}>CCW RECIPROCITY PLANNER</h2>
              <p style={{ fontFamily:'monospace', fontSize:'12px', color:'#4B5563', lineHeight:1.7, marginBottom:24 }}>
                Select your home state to see where your permit is honored. Data from stateProfile database.
              </p>
              <ReciprocityPlanner stateProfiles={stateProfiles} />
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
