import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import BreakingTicker from '../../../components/layout/BreakingTicker'
import { fetchStateProfile, fetchBreakingAlerts } from '../../../sanity/lib/client'
import Link from 'next/link'
import { buildStateFaqSchema, buildStateFaqHtml } from '../../../lib/stateFaq'

export const revalidate = 3600

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
}

const SEED_PROFILES = {
  WA: { name:'Washington', abbr:'WA', constitutionalCarry:false, ccwPermit:'Concealed Pistol License (CPL)', redFlagLaw:true, magLimit:10, waitPeriod:'10 days (handguns)', awbStatus:'Banned (2023)', suppressors:'Legal (NFA rules)', openCarry:'Legal (no permit)', bgcPrivate:true, rating:'D', reciprocityStates:['AK','AZ','ID','MT'] },
  TX: { name:'Texas', abbr:'TX', constitutionalCarry:true, ccwPermit:'License To Carry (LTC) — optional', redFlagLaw:false, magLimit:null, waitPeriod:'None', awbStatus:'None', suppressors:'Legal (NFA rules)', openCarry:'Legal (no permit)', bgcPrivate:false, rating:'A', reciprocityStates:['AL','AK','AZ','AR','CO','FL','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','UT','VT','VA','WV','WI','WY'] },
  FL: { name:'Florida', abbr:'FL', constitutionalCarry:true, ccwPermit:'Concealed Weapon License (CWL) — optional', redFlagLaw:true, magLimit:null, waitPeriod:'3 days (handguns)', awbStatus:'None', suppressors:'Legal (NFA rules)', openCarry:'Prohibited', bgcPrivate:false, rating:'B+', reciprocityStates:['AL','AK','AZ','AR','CO','GA','ID','IN','IA','KS','KY','LA','ME','MI','MS','MO','MT','NE','NV','NH','NM','NC','ND','OH','OK','PA','SC','SD','TN','TX','UT','VT','VA','WV','WI','WY'] },
}

export async function generateMetadata({ params }) {
  const abbr = params.state?.toUpperCase()
  const name = STATE_NAMES[abbr] || abbr
  return { title: `${name} Gun Laws — DownRange`, description: `Firearms laws, CCW requirements, and reciprocity for ${name}.`, alternates: { canonical: `https://downrangeco.com/state-hub/${abbr}` } }
}

function LawRow({ label, value, good }) {
  const color = good === true ? '#34D399' : good === false ? '#EF4444' : '#9CA3AF'
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280' }}>{label}</span>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color, fontWeight:600, textAlign:'right', maxWidth:'55%' }}>{value || 'Not specified'}</span>
    </div>
  )
}

export default async function StatePage({ params }) {
  const abbr = params.state?.toUpperCase()
  if (!STATE_NAMES[abbr]) notFound()

  let profile, alerts
  try {
    ;[profile, alerts] = await Promise.all([
      fetchStateProfile(abbr).catch(() => null),
      fetchBreakingAlerts(3).catch(() => []),
    ])
  } catch { profile = null; alerts = [] }

  const data = profile || SEED_PROFILES[abbr] || { name: STATE_NAMES[abbr], abbr }
  const stateName = data.name || STATE_NAMES[abbr]
  const faqSchema = buildStateFaqSchema(stateName, abbr, data)
  const faqItems  = buildStateFaqHtml(stateName, abbr, data)

  const ratingColor = { 'A':'#34D399','A+':'#34D399','B':'#60A5FA','B+':'#60A5FA','C':'#FBBF24','D':'#EF4444','D-':'#EF4444','F':'#B91C1C' }[data.rating] || '#9CA3AF'

  return (
    <>
      {/* ── FAQPage structured data ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <BreakingTicker alerts={alerts} />
      <Masthead />
      <div className="page-hero" data-title={abbr}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
            <Link href="/state-hub" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', textDecoration:'none' }}>← STATE HUB</Link>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:'20px' }}>
            <div>
              <h1 className="page-hero-title">{stateName}</h1>
              <p className="page-hero-sub">Firearms laws, CCW requirements, and reciprocity guide</p>
            </div>
            {data.rating && (
              <div style={{ textAlign:'center', marginBottom:'8px' }}>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'4rem', color:ratingColor, lineHeight:1 }}>{data.rating}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', letterSpacing:'0.1em' }}>2A RATING</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px' }}>

            {/* Carry laws */}
            <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>CARRY LAWS</h2>
              <LawRow label="Constitutional Carry" value={data.constitutionalCarry ? '✓ YES — No permit required' : '✗ NO — Permit required'} good={data.constitutionalCarry} />
              <LawRow label="CCW Permit" value={data.ccwPermit} good={null} />
              <LawRow label="Open Carry" value={data.openCarry} good={data.openCarry?.includes('Legal')} />
              <LawRow label="Wait Period" value={data.waitPeriod || 'None'} good={!data.waitPeriod || data.waitPeriod === 'None'} />
              <LawRow label="Private Sale BGC" value={data.bgcPrivate ? 'Required' : 'Not required'} good={!data.bgcPrivate} />
            </div>

            {/* Restrictions */}
            <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>RESTRICTIONS</h2>
              <LawRow label="Red Flag Law (ERPO)" value={data.redFlagLaw ? '⚠ YES — In effect' : '✓ NO'} good={!data.redFlagLaw} />
              <LawRow label="Magazine Limit" value={data.magLimit ? `${data.magLimit} rounds max` : 'None'} good={!data.magLimit} />
              <LawRow label="AWB Status" value={data.awbStatus || 'None'} good={!data.awbStatus || data.awbStatus === 'None'} />
              <LawRow label="Suppressors" value={data.suppressors || 'Legal (NFA rules apply)'} good={null} />
            </div>

            {/* Reciprocity */}
            {data.reciprocityStates?.length > 0 && (
              <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px', gridColumn:'1/-1' }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>
                  CCW RECIPROCITY — {data.reciprocityStates.length} STATES HONOR YOUR {abbr} PERMIT
                </h2>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {data.reciprocityStates.map(s => (
                    <Link key={s} href={`/state-hub/${s.toLowerCase()}`}
                      style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#34D399', background:'#001A0A', border:'1px solid #16603440', padding:'4px 10px', textDecoration:'none' }}>
                      {s}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent bills */}
            {data.recentBills?.length > 0 && (
              <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px', gridColumn:'1/-1' }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>RECENT LEGISLATION</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {data.recentBills.slice(0,5).map((b, i) => (
                    <div key={i} style={{ padding:'12px 16px', background:'#0D1117', border:'1px solid var(--border)' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', marginBottom:'4px' }}>{b.billNumber} · {b.status}</div>
                      <div style={{ fontSize:'14px', color:'#F0EDE6', fontWeight:600 }}>{b.title}</div>
                      {b.summary && <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'4px' }}>{b.summary}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop:'24px', padding:'16px', background:'#111318', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
            ⚠ Laws change frequently. Always verify current statutes before carrying. This is general information, not legal advice. Consult a licensed attorney for legal decisions.
            {!profile && <span style={{ color:'#C8922A' }}> · Live data populates when LegiScan feed runs.</span>}
          </div>

          {/* ── Rich editorial content — AI-generated, 600+ words for SEO ── */}
          {data.richContent && (
            <div style={{ marginTop:'40px' }}>
              <style>{`
                .state-rich-body h2 { font-family:'Bebas Neue',sans-serif; font-size:1.4rem; color:#C8922A; letter-spacing:0.04em; margin:2rem 0 0.75rem; padding-bottom:0.4rem; border-bottom:2px solid #1F2428; }
                .state-rich-body h2:first-child { margin-top:0; }
                .state-rich-body p { font-size:15px; line-height:1.85; color:#9CA3AF; margin-bottom:1.2rem; font-family:'IBM Plex Sans',sans-serif; text-align:justify; }
                .state-rich-body strong { color:#E5E5E5; font-weight:700; }
              `}</style>
              <div className="state-rich-body" dangerouslySetInnerHTML={{ __html: data.richContent }} />
            </div>
          )}

          {/* ── FAQ Accordion — indexed by Google as FAQPage schema ── */}
          <div style={{ marginTop:'40px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px', borderBottom:'2px solid #1F2428', paddingBottom:'8px' }}>
              {`FREQUENTLY ASKED QUESTIONS — ${stateName.toUpperCase()} GUN LAWS`}
            </h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
              {faqItems.map((faq, i) => (
                <details key={i} style={{ background:'#111318', border:'1px solid #1F2428', overflow:'hidden' }}>
                  <summary style={{ padding:'14px 18px', cursor:'pointer', fontFamily:"'Barlow Condensed', sans-serif", fontSize:'16px', fontWeight:700, color:'#E5E5E5', letterSpacing:'0.04em', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    {faq.question}
                    <span style={{ color:'#C8922A', fontSize:'20px', flexShrink:0, marginLeft:'12px' }}>+</span>
                  </summary>
                  <div style={{ padding:'14px 18px 16px', fontFamily:"'IBM Plex Sans', sans-serif", fontSize:'14px', color:'#9CA3AF', lineHeight:1.8, borderTop:'1px solid #1F2428' }}>
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* ── Internal links to related pages ── */}
          <div style={{ marginTop:'32px', padding:'20px 24px', background:'#111318', border:'1px solid #1F2428' }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', letterSpacing:'0.12em', fontWeight:700, marginBottom:'12px' }}>RELATED RESOURCES</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
              {[
                [`/ccw`, `${stateName} CCW Permit Guide`],
                [`/laws?tab=state`, `All State Gun Laws`],
                [`/laws?tab=federal`, `Federal Bills Tracker`],
                [`/news`, `Latest 2A News`],
                [`/state-hub`, `All 50 States`],
                [`/nfa-tracker`, `NFA Wait Times`],
              ].map(([href, label]) => (
                <Link key={href} href={href} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280', background:'#09090B', border:'1px solid #1F2428', padding:'6px 14px', textDecoration:'none' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
