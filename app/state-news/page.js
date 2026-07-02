import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'State Firearms News — DownRange', description: 'Firearms news for all 50 states. Real-time feeds from state-level sources.', alternates: { canonical: 'https://www.downrangeco.com/state-news' } }

const STATES_WITH_ACTIVITY = [
  { abbr:'TX', name:'Texas', activity:'HIGH', note:'Constitutional carry expansion, no red flag law' },
  { abbr:'CA', name:'California', activity:'HIGH', note:'Multiple AWB challenges ongoing under Bruen' },
  { abbr:'FL', name:'Florida', activity:'MED', note:'Constitutional carry passed 2023' },
  { abbr:'WA', name:'Washington', activity:'HIGH', note:'Magazine ban challenged, AWB enacted 2023' },
  { abbr:'IL', name:'Illinois', activity:'HIGH', note:'PICA AWB challenged in multiple courts' },
  { abbr:'NY', name:'New York', activity:'HIGH', note:'Post-Bruen carry law modifications ongoing' },
  { abbr:'CO', name:'Colorado', activity:'MED', note:'Magazine limit challenged, new SB-279' },
  { abbr:'AZ', name:'Arizona', activity:'LOW', note:'Constitutional carry, no restrictions' },
  { abbr:'GA', name:'Georgia', activity:'LOW', note:'Constitutional carry passed 2022' },
  { abbr:'OH', name:'Ohio', activity:'LOW', note:'Constitutional carry passed 2022' },
  { abbr:'OR', name:'Oregon', activity:'HIGH', note:'Measure 114 blocked in courts' },
  { abbr:'MD', name:'Maryland', activity:'MED', note:'AWB challenged, Bruen compliance pending' },
  { abbr:'VA', name:'Virginia', activity:'MED', note:'Multiple bills in progress' },
  { abbr:'NJ', name:'New Jersey', activity:'HIGH', note:'Magazine limits, permit restrictions challenged' },
  { abbr:'PA', name:'Pennsylvania', activity:'MED', note:'Pre-emption battles, Pittsburgh law challenged' },
]

const ALL_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const STATE_NAMES = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' }
const ACTIVITY_COLORS = { HIGH:'#EF4444', MED:'#FBBF24', LOW:'#34D399' }

export default function StateNewsIndex() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="STATE NEWS">
        <div className="container">
          <h1 className="page-hero-title">State Firearms News</h1>
          <p className="page-hero-sub">State-by-state firearms news, legislation, and legal updates — sorted by urgency, not clicks</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>ACTIVE STATES — HIGH LEGISLATIVE ACTIVITY</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'40px' }}>
            {STATES_WITH_ACTIVITY.map(s=>(
              <Link key={s.abbr} href={`/state-news/${s.abbr.toLowerCase()}`} style={{ background:'#111318', border:'1px solid var(--border)', padding:'14px 16px', textDecoration:'none', display:'block' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#C8922A' }}>{s.abbr}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:ACTIVITY_COLORS[s.activity], background:`${ACTIVITY_COLORS[s.activity]}20`, padding:'2px 8px', alignSelf:'center' }}>{s.activity}</span>
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#F0EDE6', marginBottom:'4px' }}>{s.name}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', lineHeight:1.5 }}>{s.note}</div>
              </Link>
            ))}
          </div>
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>ALL 50 STATES</h2>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
            {ALL_STATES.map(s=>(
              <Link key={s} href={`/state-news/${s.toLowerCase()}`}
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', padding:'6px 14px', background:'#111318', border:'1px solid var(--border)', color:'#6B7280', textDecoration:'none', display:'flex', flexDirection:'column', alignItems:'center', minWidth:'60px' }}>
                <span style={{ fontWeight:700, color:'#C8922A' }}>{s}</span>
                <span style={{ fontSize:'9px', marginTop:'2px' }}>{STATE_NAMES[s]?.split(' ')[0]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
