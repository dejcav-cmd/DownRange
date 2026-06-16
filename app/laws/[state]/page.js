import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import Link from 'next/link'
import { fetchStateProfile, fetchBreakingAlerts } from '../../../sanity/lib/client'

export const revalidate = 3600

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

export async function generateMetadata({ params }) {
  const abbr = params.state?.toUpperCase()
  const name = STATE_NAMES[abbr] || abbr
  return {
    title: `${name} Gun Laws ${new Date().getFullYear()} | DownRange`,
    description: `${name} firearms laws: constitutional carry, CCW permit, magazine limits, AWB status, waiting period, red flag law, and reciprocity.`,
    alternates: { canonical: `https://downrangeco.com/laws/${params.state}` },
  }
}

const S = { mono:"'IBM Plex Mono',monospace", bebas:"'Bebas Neue',sans-serif", sans:"'IBM Plex Sans',sans-serif", cond:"'Barlow Condensed',sans-serif" }

function Row({ label, value, good }) {
  const color = good === true ? '#34D399' : good === false ? '#EF4444' : '#9CA3AF'
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid #1a1a1a' }}>
      <span style={{ fontFamily:S.mono, fontSize:11, color:'#6B7280', letterSpacing:'0.05em' }}>{label}</span>
      <span style={{ fontFamily:S.mono, fontSize:12, color, fontWeight:600, textAlign:'right', maxWidth:'55%' }}>{value || '—'}</span>
    </div>
  )
}

// Seed data for states not yet in Sanity
const SEED = {
  WA: { name:'Washington', abbr:'WA', constitutionalCarry:false, ccwPermit:'Concealed Pistol License (CPL)', redFlagLaw:true, magLimit:10, waitPeriod:10, awbStatus:'Full', suppressors:false, openCarry:'Legal (no permit)', bgcPrivate:true, rating:'D', reciprocityStates:['AK','AZ','ID','MT'] },
  TX: { name:'Texas', abbr:'TX', constitutionalCarry:true, ccwPermit:'License to Carry (LTC) — optional', redFlagLaw:false, magLimit:null, waitPeriod:0, awbStatus:'none', suppressors:true, openCarry:'Legal (no permit)', bgcPrivate:false, rating:'A', reciprocityStates:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','UT','VT','VA','WV','WI','WY'] },
  CA: { name:'California', abbr:'CA', constitutionalCarry:false, ccwPermit:'Concealed Carry Permit (may-issue)', redFlagLaw:true, magLimit:10, waitPeriod:10, awbStatus:'Full', suppressors:false, openCarry:'Prohibited', bgcPrivate:true, rating:'F', reciprocityStates:[] },
  FL: { name:'Florida', abbr:'FL', constitutionalCarry:true, ccwPermit:'Concealed Weapon License (CWL) — optional', redFlagLaw:true, magLimit:null, waitPeriod:3, awbStatus:'none', suppressors:true, openCarry:'Prohibited', bgcPrivate:false, rating:'B+', reciprocityStates:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'] },
}

export default async function StateLawPage({ params }) {
  const abbr = params.state?.toUpperCase()
  if (!STATE_NAMES[abbr]) notFound()

  const stateName = STATE_NAMES[abbr]
  const profile = await fetchStateProfile(abbr).catch(() => null)
  const data = profile || SEED[abbr] || { name: stateName, abbr }

  const faqItems = [
    { question: `Do I need a permit to carry a concealed firearm in ${stateName}?`, answer: data.constitutionalCarry ? `No. ${stateName} is a constitutional carry state — you can carry concealed without a permit if you're legally allowed to possess a firearm. A permit is still available and useful for reciprocity.` : `Yes. ${stateName} requires a ${data.ccwPermit || 'concealed carry permit'} to carry a concealed handgun.` },
    { question: `What is the magazine capacity limit in ${stateName}?`, answer: data.magLimit ? `${stateName} limits magazine capacity to ${data.magLimit} rounds. Magazines over this limit cannot be manufactured, sold, or imported into the state.` : `There is no magazine capacity limit in ${stateName}.` },
    { question: `Is there a waiting period to buy a gun in ${stateName}?`, answer: data.waitPeriod > 0 ? `Yes. ${stateName} has a ${data.waitPeriod}-day waiting period on certain firearm purchases.` : `${stateName} does not have a state waiting period on firearm purchases.` },
    { question: `Are assault weapons banned in ${stateName}?`, answer: data.awbStatus && data.awbStatus !== 'none' ? `${stateName} has an assault weapons ban in effect. This restricts semi-automatic firearms with certain features. Always check current statute for specifics.` : `${stateName} does not have a state-level assault weapons ban.` },
    { question: `Does ${stateName} have a red flag law?`, answer: data.redFlagLaw ? `Yes. ${stateName} has an Extreme Risk Protection Order (ERPO) law that allows courts to temporarily remove firearms from individuals deemed a risk.` : `No. ${stateName} does not have a red flag or ERPO law.` },
  ]

  return (
    <>
      <Masthead />

      {/* HERO */}
      <div style={{ background:'#0d0d10', borderBottom:'1px solid #1a1a1a', padding:'52px 0 32px' }}>
        <div className="container">
          <div style={{ fontFamily:S.mono, fontSize:10, color:'#4B5563', letterSpacing:'0.15em', marginBottom:8 }}>
            <Link href="/laws" style={{ color:'#4B5563', textDecoration:'none' }}>Laws</Link>
            <span style={{ margin:'0 8px' }}>›</span>
            <Link href="/laws/states" style={{ color:'#4B5563', textDecoration:'none' }}>All States</Link>
            <span style={{ margin:'0 8px' }}>›</span>
            <span style={{ color:'#C8922A' }}>{abbr}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16 }}>
            <div>
              <h1 style={{ fontFamily:S.bebas, fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'#fff', lineHeight:0.92, margin:0, letterSpacing:'0.02em' }}>
                {stateName}<br /><span style={{ color:'#C8922A' }}>Gun Laws {new Date().getFullYear()}</span>
              </h1>
            </div>
            {data.rating && (
              <div style={{ textAlign:'center', background:'#111318', border:'1px solid #1a1a1a', padding:'16px 24px' }}>
                <div style={{ fontFamily:S.bebas, fontSize:48, color: data.rating.startsWith('A') ? '#34D399' : data.rating.startsWith('B') ? '#60A5FA' : data.rating.startsWith('C') ? '#FBBF24' : '#EF4444', lineHeight:1 }}>{data.rating}</div>
                <div style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563', letterSpacing:'0.1em' }}>FREEDOM RATING</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding:'48px 0 64px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48 }}>

          {/* LEFT COLUMN — law details */}
          <div>
            <div style={{ fontFamily:S.mono, fontSize:10, color:'#C8922A', letterSpacing:'0.15em', marginBottom:16, paddingBottom:8, borderBottom:'2px solid #C8922A' }}>CARRY</div>
            <Row label="Constitutional Carry" value={data.constitutionalCarry ? 'YES — No permit needed' : 'NO — Permit required'} good={!!data.constitutionalCarry} />
            <Row label="CCW Permit Name" value={data.ccwPermit} />
            <Row label="Open Carry" value={data.openCarry} good={data.openCarry === 'Legal (no permit)'} />
            <Row label="Waiting Period" value={data.waitPeriod > 0 ? `${data.waitPeriod} days` : 'None'} good={!(data.waitPeriod > 0)} />
            <Row label="Private Sale BGC" value={data.bgcPrivate ? 'Required' : 'Not required'} good={!data.bgcPrivate} />

            <div style={{ fontFamily:S.mono, fontSize:10, color:'#C8922A', letterSpacing:'0.15em', margin:'32px 0 16px', paddingBottom:8, borderBottom:'2px solid #C8922A' }}>RESTRICTIONS</div>
            <Row label="Magazine Limit" value={data.magLimit ? `${data.magLimit} rounds max` : 'None'} good={!data.magLimit} />
            <Row label="Assault Weapon Ban" value={!data.awbStatus || data.awbStatus === 'none' ? 'None' : data.awbStatus} good={!data.awbStatus || data.awbStatus === 'none'} />
            <Row label="Suppressors" value={data.suppressors ? 'Legal (NFA rules apply)' : 'Restricted / Prohibited'} good={!!data.suppressors} />
            <Row label="Red Flag Law" value={data.redFlagLaw ? 'Yes (ERPO)' : 'No'} good={!data.redFlagLaw} />

            {/* Summary */}
            {(data.summary || data.nraLawSummary) && (
              <div style={{ marginTop:32, padding:20, background:'#111318', border:'1px solid #1a1a1a' }}>
                <div style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563', letterSpacing:'0.12em', marginBottom:10 }}>OVERVIEW</div>
                <p style={{ fontFamily:S.sans, fontSize:14, color:'#9CA3AF', lineHeight:1.85, margin:0, textAlign:'justify' }}>
                  {data.nraLawSummary || data.summary}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — reciprocity + bills */}
          <div>
            <div style={{ fontFamily:S.mono, fontSize:10, color:'#C8922A', letterSpacing:'0.15em', marginBottom:16, paddingBottom:8, borderBottom:'2px solid #C8922A' }}>RECIPROCITY</div>
            {data.reciprocityStates?.length > 0 ? (
              <>
                <p style={{ fontFamily:S.sans, fontSize:13, color:'#6B7280', marginBottom:16 }}>
                  Your {abbr} permit is honored in {data.reciprocityStates.length} states:
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:24 }}>
                  {data.reciprocityStates.map(s => (
                    <Link key={s} href={`/laws/${s.toLowerCase()}`}
                      style={{ fontFamily:S.mono, fontSize:11, fontWeight:700, color:'#34D399', background:'#0A1F0A', border:'1px solid #34D39930', padding:'4px 10px', textDecoration:'none' }}>
                      {s}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontFamily:S.sans, fontSize:13, color:'#6B7280', marginBottom:24 }}>
                {abbr} does not maintain formal reciprocity with other states. Check each state individually before traveling.
              </p>
            )}

            {/* Recent bills */}
            {data.recentBills?.length > 0 && (
              <>
                <div style={{ fontFamily:S.mono, fontSize:10, color:'#C8922A', letterSpacing:'0.15em', marginBottom:16, paddingBottom:8, borderBottom:'2px solid #C8922A' }}>ACTIVE LEGISLATION</div>
                {data.recentBills.slice(0,4).map((b,i) => (
                  <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid #1a1a1a' }}>
                    <div style={{ fontFamily:S.mono, fontSize:9, color:'#C8922A', marginBottom:4 }}>{b.billNumber} · {b.status}</div>
                    <div style={{ fontFamily:S.cond, fontSize:15, fontWeight:700, color:'#E5E5E5' }}>{b.title}</div>
                    {b.summary && <div style={{ fontFamily:S.sans, fontSize:12, color:'#6B7280', marginTop:4, lineHeight:1.6 }}>{b.summary}</div>}
                  </div>
                ))}
              </>
            )}

            {/* Related links */}
            <div style={{ marginTop:32, display:'flex', flexDirection:'column', gap:8 }}>
              <Link href="/laws/my-state" style={{ padding:'12px 16px', background:'#C8922A', color:'#09090B', textAlign:'center', fontFamily:S.mono, fontSize:11, fontWeight:700, textDecoration:'none', letterSpacing:'0.08em' }}>
                ← Switch State
              </Link>
              <Link href="/laws/states" style={{ padding:'12px 16px', background:'#111318', border:'1px solid #2A2F38', color:'#9CA3AF', textAlign:'center', fontFamily:S.mono, fontSize:11, textDecoration:'none', letterSpacing:'0.08em' }}>
                All 50 States
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop:56 }}>
          <div style={{ fontFamily:S.mono, fontSize:10, color:'#C8922A', letterSpacing:'0.15em', marginBottom:20, paddingBottom:8, borderBottom:'2px solid #C8922A' }}>
            FREQUENTLY ASKED — {stateName.toUpperCase()} GUN LAWS
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {faqItems.map((faq, i) => (
              <details key={i} style={{ background:'#111318', border:'1px solid #1a1a1a' }}>
                <summary style={{ padding:'16px 20px', cursor:'pointer', fontFamily:S.cond, fontSize:16, fontWeight:700, color:'#E5E5E5', letterSpacing:'0.03em', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  {faq.question}
                  <span style={{ color:'#C8922A', fontSize:18, flexShrink:0, marginLeft:12 }}>+</span>
                </summary>
                <div style={{ padding:'0 20px 16px', fontFamily:S.sans, fontSize:14, color:'#9CA3AF', lineHeight:1.85, borderTop:'1px solid #1a1a1a' }}>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop:32, padding:'14px 18px', background:'#111318', border:'1px solid #1a1a1a', fontFamily:S.mono, fontSize:11, color:'#4B5563', lineHeight:1.7 }}>
          ⚠ Laws change frequently. Always verify with your state's statutes before carrying. This is general information, not legal advice.
        </div>
      </div>

      <Footer />
    </>
  )
}
