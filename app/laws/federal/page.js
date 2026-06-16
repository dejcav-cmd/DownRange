import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import { fetchLegislation, fetchBreakingAlerts } from '../../../sanity/lib/client'

export const metadata = {
  title: 'Federal Gun Law Intelligence | DownRange',
  description: 'Bills in Congress, ATF rulemaking, and active SCOTUS cases. Every law that affects your Second Amendment rights at the federal level.',
  alternates: { canonical: 'https://downrangeco.com/laws/federal' },
}
export const revalidate = 120

const SCOTUS_CASES = [
  { id:'hemani', name:'United States v. Hemani', year:2026, outcome:'PENDING', significance:'HIGH', status:'Decision expected Jun/Jul 2026', url:'https://www.scotusblog.com/case-files/cases/united-states-v-hemani/', topic:'Drug user prohibition', summary:'Tests whether Congress can disarm someone who habitually uses controlled substances under 18 U.S.C. §922(g)(3). Decision expected June or July 2026.' },
  { id:'wolford', name:'Wolford v. Lopez', year:2026, outcome:'PENDING', significance:'HIGH', status:'Argued Jan 2026', url:'https://www.scotusblog.com/case-files/cases/wolford-v-lopez/', topic:'Carry ban (Hawaii)', summary:'Hawaii barred carry on any private property without explicit written owner permission — effectively a de facto carry ban. Could reshape sensitive-places doctrine post-Bruen.' },
  { id:'viramontes', name:'Viramontes v. Cook County', year:2026, outcome:'PENDING', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu', topic:'Assault weapon ban', summary:'Challenges Illinois/Cook County AWB under the Bruen text-and-history test. If cert granted, would be the first major SCOTUS ruling on AWBs.' },
  { id:'nagr', name:'NAGR v. Lamont', year:2026, outcome:'PENDING', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu', topic:'AWB (Connecticut)', summary:"Challenges Connecticut's assault weapons ban. Being considered alongside Viramontes — the Court's likely entry point on AWBs." },
  { id:'duncan', name:'Duncan v. Bonta', year:2026, outcome:'PENDING', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu', topic:'Magazine ban (CA)', summary:"California's 10-round magazine cap. Relisted at SCOTUS conference 12+ times. Would be first direct SCOTUS ruling on magazine restrictions." },
  { id:'cargill', name:'Garland v. Cargill', year:2024, outcome:'WON', significance:'HIGH', status:'Decided June 2024', url:'https://www.supremecourt.gov/opinions/23pdf/22-976_1b82.pdf', topic:'Bump stocks', summary:'6-3: Bump stocks do not convert semi-auto rifles into machine guns. Stripped ATF authority to redefine devices by regulatory fiat.' },
  { id:'vanderstock', name:'Bondi v. VanDerStok', year:2025, outcome:'LOST', significance:'MED', status:'Decided 2025', url:'https://www.supremecourt.gov', topic:'Ghost guns (80%)', summary:'7-2: ATF ghost gun rule not facially invalid — kits with jigs can qualify as firearms under GCA. As-applied challenges remain.' },
  { id:'rahimi', name:'United States v. Rahimi', year:2024, outcome:'LOST', significance:'MED', status:'Decided June 2024', url:'https://www.supremecourt.gov/opinions/23pdf/22-915_9ok0.pdf', topic:'Domestic violence disarmament', summary:'8-1: Upheld disarming those under domestic violence protective orders. Narrow ruling — applies only when credible threat found.' },
  { id:'gardner', name:'Gardner v. Maryland', year:2025, outcome:'CERT DENIED', significance:'HIGH', status:'Cert denied Jun 2025', url:'https://scotus2a.com', topic:'AR-15 ban (MD)', summary:'After 15 relistings, cert denied — leaving Maryland AWB intact for now. Justice Kavanaugh signaled Court should address AR-15 question soon.' },
  { id:'bruen', name:'NY State Rifle & Pistol v. Bruen', year:2022, outcome:'WON', significance:'HIGH', status:'Decided June 2022', url:'https://www.supremecourt.gov/opinions/21pdf/20-843_7j80.pdf', topic:'Public carry / text-and-history test', summary:'Landmark 6-3: Established text-and-history framework. All gun laws must now be grounded in founding-era tradition. Most significant 2A ruling since Heller.' },
  { id:'heller', name:'DC v. Heller', year:2008, outcome:'WON', significance:'HIGH', status:'Decided June 2008', url:'https://supreme.justia.com/cases/federal/us/554/570/', topic:'Individual right to bear arms', summary:'5-4: Second Amendment protects an individual right to possess firearms for self-defense. Struck DC handgun ban. The constitutional foundation of all 2A litigation.' },
]

const ATF_RULES = [
  { id:'nfa-tax', title:'NFA Tax Stamp Eliminated', status:'passed', date:'2026-01-01', topic:'NFA', impact:'HIGH', summary:'H.R. 1 (One Big Beautiful Bill Act) eliminated the $200 NFA tax for suppressors, SBRs, SBSs, and AOWs effective January 1, 2026. All other NFA requirements remain: Form 4 submissions, CLEO notification, fingerprints, photographs, and ATF wait times. Machine guns and destructive devices still require the $200 stamp.' },
  { id:'pistol-brace', title:'Pistol Brace Rule Rescinded', status:'passed', date:'2025-06-01', topic:'Braces', impact:'HIGH', summary:'ATF formally rescinded the January 2023 rule that reclassified brace-equipped pistols as SBRs. Owners do not need to register, modify, or remove their braces. No federal felony risk.' },
  { id:'frt', title:'Forced Reset Triggers — Federally Legal', status:'passed', date:'2025-03-15', topic:'Triggers', impact:'MED', summary:'DOJ settled Rare Breed Triggers v. Garland, restoring federal legality for FRTs. FRTs require a separate trigger function per round, removing them from the machine gun definition under Cargill. State laws vary — still prohibited under some state AWBs.' },
  { id:'34rules', title:'ATF 34-Rule Regulatory Reform Package', status:'advancing', date:'2026-04-29', topic:'Dealer / NFA', impact:'HIGH', summary:'DOJ and ATF released 34 proposed and final rules covering FFL dealer operations, digital recordkeeping, NFA compliance post-Cargill, and import/export. Most significant ATF reform in history. Some rules are final; others in comment period through fall 2026.' },
  { id:'80pct', title:'Frames & Receivers Rule (Ghost Guns)', status:'challenged', date:'2022-08-24', topic:'Ghost guns', impact:'HIGH', summary:"ATF's 2022 rule expanded the firearm definition to include certain 80% lower kits with jigs. Upheld 7-2 in Bondi v. VanDerStok (2025) as not facially invalid. As-applied challenges remain. Standalone 80% lowers sold without jigs may still fall outside the rule." },
  { id:'engaged', title:'"Engaged in the Business" Rule Rescinded', status:'passed', date:'2025-08-01', topic:'Private sales', impact:'MED', summary:"ATF rescinded the Biden-era expansion that would have required many private sellers to obtain FFLs. Reverts to BSCA statutory language requiring 'predominant purpose' to profit. Private collection sellers on a non-recurring basis are no longer at risk under the rescinded framework." },
]

const FEDERAL_BILLS = [
  { _id:'f2', title:'National Concealed Carry Reciprocity Act', billNumber:'H.R. 38', status:'passed', topic:'Carry', impact:'HIGH', summary:'Requires all states to recognize valid CCW permits from other states. House passed; Senate faces 60-vote threshold.', url:'https://www.congress.gov/bill/118th-congress/house-bill/38' },
  { _id:'f4', title:'Bipartisan Safer Communities Act', billNumber:'S. 2938', status:'passed', topic:'Background checks', impact:'HIGH', summary:'Enhanced background checks for under-21 buyers, closed "boyfriend loophole," $750M for state crisis programs. Most significant federal gun law in 30 years.', url:'https://www.congress.gov/bill/117th-congress/senate-bill/2938' },
  { _id:'f3', title:'Hearing Protection Act', billNumber:'H.R. 2296', status:'committee', topic:'Suppressors', impact:'HIGH', summary:'Would remove suppressors from NFA, requiring only a BGC. Partially moot after NFA tax elimination in H.R. 1, but supporters want full NFA deregulation.', url:'https://www.congress.gov/bill/118th-congress/house-bill/2296' },
  { _id:'f1', title:'Firearm Safety Act of 2024', billNumber:'H.R. 7910', status:'committee', topic:'Background checks', impact:'HIGH', summary:'Universal background checks on all firearm sales including private transfers. No floor vote in the 118th Congress.', url:'https://www.congress.gov/bill/118th-congress/house-bill/7910' },
  { _id:'f6', title:'Assault Weapons Ban of 2023', billNumber:'H.R. 698', status:'committee', topic:'AWB', impact:'HIGH', summary:'Bans semi-auto rifles with military features and mags over 10 rounds. Constitutionality unclear post-Bruen; SCOTUS may weigh in via Viramontes/NAGR.', url:'https://www.congress.gov/bill/118th-congress/house-bill/698' },
  { _id:'f5', title:'Equal Access to Justice for Victims of Gun Violence', billNumber:'S. 1223', status:'failed', topic:'PLCAA', impact:'HIGH', summary:'Would repeal PLCAA immunity for manufacturers. Failed to advance out of committee.', url:'https://www.congress.gov/bill/118th-congress/senate-bill/1223' },
]

const STATUS_STYLE = {
  passed:    { color:'#34D399', bg:'#001A0A', label:'PASSED' },
  signed:    { color:'#34D399', bg:'#001A0A', label:'SIGNED' },
  failed:    { color:'#EF4444', bg:'#1A0000', label:'FAILED' },
  challenged:{ color:'#FBBF24', bg:'#1A0E00', label:'CHALLENGED' },
  advancing: { color:'#60A5FA', bg:'#001020', label:'ADVANCING' },
  committee: { color:'#6B7280', bg:'#111318', label:'COMMITTEE' },
}

const OUTCOME_STYLE = {
  WON:         { color:'#34D399', bg:'#001A0A' },
  LOST:        { color:'#EF4444', bg:'#1A0000' },
  PENDING:     { color:'#FBBF24', bg:'#1A0E00' },
  'CERT DENIED':{ color:'#9CA3AF', bg:'#111318' },
}

const S = { mono:"'IBM Plex Mono',monospace", bebas:"'Bebas Neue',sans-serif", sans:"'IBM Plex Sans',sans-serif", cond:"'Barlow Condensed',sans-serif" }

function Badge({ status }) {
  const s = STATUS_STYLE[status?.toLowerCase()] || STATUS_STYLE.committee
  return <span style={{ fontFamily:S.mono, fontSize:9, fontWeight:700, letterSpacing:'0.12em', color:s.color, background:s.bg, padding:'3px 7px', border:`1px solid ${s.color}30` }}>{s.label}</span>
}

export default async function FederalPage({ searchParams }) {
  const filter = searchParams?.filter || 'all'
  const legislation = await fetchLegislation(40).catch(() => [])
  const liveBills = legislation.filter(b => b.level === 'federal')

  const allBills = liveBills.length > 0 ? liveBills : FEDERAL_BILLS
  const filtered = filter === 'all' ? allBills : allBills.filter(b => b.topic?.toLowerCase() === filter || b.status?.toLowerCase() === filter)

  return (
    <>
      <Masthead />

      {/* HERO */}
      <div style={{ background: '#0d0d10', borderBottom: '1px solid #1a1a1a', padding: '52px 0 32px' }}>
        <div className="container">
          <div style={{ fontFamily:S.mono, fontSize:10, color:'#60A5FA', letterSpacing:'0.15em', marginBottom:12 }}>FEDERAL INTELLIGENCE</div>
          <h1 style={{ fontFamily:S.bebas, fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'#fff', lineHeight:0.92, margin:'0 0 16px', letterSpacing:'0.02em' }}>
            Federal 2A<br /><span style={{ color:'#60A5FA' }}>Intelligence</span>
          </h1>
          <p style={{ fontFamily:S.sans, fontSize:15, color:'#6B7280', margin:0, maxWidth:480 }}>
            Bills in Congress, ATF rules that changed what's legal, and the SCOTUS cases that will define your rights for a generation.
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={{ background:'#111318', borderBottom:'1px solid #1a1a1a', position:'sticky', top:60, zIndex:20 }}>
        <div className="container" style={{ display:'flex', gap:0, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          {[['all','All'],['bills','Bills'],['atf','ATF Rules'],['scotus','SCOTUS']].map(([k,label]) => (
            <a key={k} href={`/laws/federal${k!=='all'?`?filter=${k}`:''}`}
              style={{ padding:'12px 18px', fontFamily:S.mono, fontSize:11, textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.06em', color:filter===k?'#60A5FA':'#4B5563', borderBottom:`2px solid ${filter===k?'#60A5FA':'transparent'}`, transition:'all 150ms' }}>
              {label}
            </a>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding:'48px 0 64px' }}>

        {/* ── BILLS ── */}
        {(filter === 'all' || filter === 'bills') && (
          <section style={{ marginBottom:56 }}>
            <div style={{ fontFamily:S.mono, fontSize:10, color:'#60A5FA', letterSpacing:'0.15em', marginBottom:20, paddingBottom:8, borderBottom:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>CONGRESS</span>
              <a href="https://www.congress.gov" target="_blank" rel="noreferrer" style={{ color:'#4B5563', fontSize:10, textDecoration:'none' }}>congress.gov ↗</a>
            </div>
            <div style={{ display:'grid', gap:2 }}>
              {(filter === 'bills' ? filtered : FEDERAL_BILLS).map(bill => (
                <a key={bill._id} href={bill.url || '#'} target="_blank" rel="noreferrer"
                  style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start', background:'#111318', border:'1px solid #1a1a1a', padding:'20px 24px', textDecoration:'none', transition:'all 150ms' }}>
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontFamily:S.mono, fontSize:10, color:'#4B5563' }}>{bill.billNumber}</span>
                      {bill.topic && <span style={{ fontFamily:S.mono, fontSize:9, color:'#6B7280', background:'#1a1a1a', padding:'2px 6px' }}>{bill.topic}</span>}
                    </div>
                    <div style={{ fontFamily:S.cond, fontSize:18, fontWeight:700, color:'#E5E5E5', marginBottom:8 }}>{bill.title}</div>
                    <div style={{ fontFamily:S.sans, fontSize:13, color:'#6B7280', lineHeight:1.7 }}>{bill.summary}</div>
                  </div>
                  <Badge status={bill.status} />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── ATF RULES ── */}
        {(filter === 'all' || filter === 'atf') && (
          <section style={{ marginBottom:56 }}>
            <div style={{ fontFamily:S.mono, fontSize:10, color:'#60A5FA', letterSpacing:'0.15em', marginBottom:20, paddingBottom:8, borderBottom:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between' }}>
              <span>ATF RULEMAKING</span>
              <a href="https://www.atf.gov/rules-and-regulations" target="_blank" rel="noreferrer" style={{ color:'#4B5563', fontSize:10, textDecoration:'none' }}>atf.gov ↗</a>
            </div>
            <div style={{ display:'grid', gap:2 }}>
              {ATF_RULES.map(rule => (
                <a key={rule.id} href={rule.url || '#'} target="_blank" rel="noreferrer"
                  style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start', background:'#111318', border:'1px solid #1a1a1a', padding:'20px 24px', textDecoration:'none', transition:'all 150ms' }}>
                  <div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563' }}>{rule.date}</span>
                      {rule.topic && <span style={{ fontFamily:S.mono, fontSize:9, color:'#6B7280', background:'#1a1a1a', padding:'2px 6px' }}>{rule.topic}</span>}
                    </div>
                    <div style={{ fontFamily:S.cond, fontSize:18, fontWeight:700, color:'#E5E5E5', marginBottom:8 }}>{rule.title}</div>
                    <div style={{ fontFamily:S.sans, fontSize:13, color:'#6B7280', lineHeight:1.7 }}>{rule.summary}</div>
                  </div>
                  <Badge status={rule.status} />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── SCOTUS ── */}
        {(filter === 'all' || filter === 'scotus') && (
          <section id="scotus">
            <div style={{ fontFamily:S.mono, fontSize:10, color:'#A78BFA', letterSpacing:'0.15em', marginBottom:20, paddingBottom:8, borderBottom:'1px solid #1a1a1a', display:'flex', justifyContent:'space-between' }}>
              <span>SUPREME COURT</span>
              <a href="https://www.scotusblog.com" target="_blank" rel="noreferrer" style={{ color:'#4B5563', fontSize:10, textDecoration:'none' }}>scotusblog.com ↗</a>
            </div>

            {/* Active / Pending first */}
            <div style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563', letterSpacing:'0.12em', marginBottom:12 }}>ACTIVE THIS TERM</div>
            <div style={{ display:'grid', gap:2, marginBottom:32 }}>
              {SCOTUS_CASES.filter(c => c.outcome === 'PENDING').map(c => {
                const os = OUTCOME_STYLE[c.outcome] || OUTCOME_STYLE.PENDING
                return (
                  <a key={c.id} href={c.url} target="_blank" rel="noreferrer"
                    style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, background:'#111318', border:'1px solid #1a1a1a', borderLeft:`3px solid #FBBF24`, padding:'20px 24px', textDecoration:'none' }}>
                    <div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                        <span style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563' }}>{c.year}</span>
                        <span style={{ fontFamily:S.mono, fontSize:9, color:'#6B7280', background:'#1a1a1a', padding:'2px 6px' }}>{c.topic}</span>
                        <span style={{ fontFamily:S.mono, fontSize:9, color:'#FBBF24' }}>{c.status}</span>
                      </div>
                      <div style={{ fontFamily:S.cond, fontSize:18, fontWeight:700, color:'#E5E5E5', marginBottom:6 }}>{c.name}</div>
                      <div style={{ fontFamily:S.sans, fontSize:13, color:'#6B7280', lineHeight:1.7 }}>{c.summary}</div>
                    </div>
                    <span style={{ fontFamily:S.mono, fontSize:9, fontWeight:700, color:os.color, background:os.bg, padding:'3px 7px', border:`1px solid ${os.color}30`, whiteSpace:'nowrap', alignSelf:'start' }}>PENDING</span>
                  </a>
                )
              })}
            </div>

            <div style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563', letterSpacing:'0.12em', marginBottom:12 }}>DECIDED & LANDMARK</div>
            <div style={{ display:'grid', gap:2 }}>
              {SCOTUS_CASES.filter(c => c.outcome !== 'PENDING').map(c => {
                const os = OUTCOME_STYLE[c.outcome] || OUTCOME_STYLE.PENDING
                const borderColor = c.outcome === 'WON' ? '#34D399' : c.outcome === 'LOST' ? '#EF4444' : '#6B7280'
                return (
                  <a key={c.id} href={c.url} target="_blank" rel="noreferrer"
                    style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, background:'#111318', border:'1px solid #1a1a1a', borderLeft:`3px solid ${borderColor}`, padding:'20px 24px', textDecoration:'none' }}>
                    <div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                        <span style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563' }}>{c.year}</span>
                        <span style={{ fontFamily:S.mono, fontSize:9, color:'#6B7280', background:'#1a1a1a', padding:'2px 6px' }}>{c.topic}</span>
                        <span style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563' }}>{c.status}</span>
                      </div>
                      <div style={{ fontFamily:S.cond, fontSize:18, fontWeight:700, color:'#E5E5E5', marginBottom:6 }}>{c.name}</div>
                      <div style={{ fontFamily:S.sans, fontSize:13, color:'#6B7280', lineHeight:1.7 }}>{c.summary}</div>
                    </div>
                    <span style={{ fontFamily:S.mono, fontSize:9, fontWeight:700, color:os.color, background:os.bg, padding:'3px 7px', border:`1px solid ${os.color}30`, whiteSpace:'nowrap', alignSelf:'start' }}>{c.outcome}</span>
                  </a>
                )
              })}
            </div>
          </section>
        )}

      </div>
      <Footer />
    </>
  )
}
