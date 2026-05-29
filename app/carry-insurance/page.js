import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts, fetchBreakingAlerts } from '../../sanity/lib/client'
export const revalidate = 604800  // Weekly — updated by /api/cron/carry-insurance

export const metadata = { title: 'CCW Insurance Comparison — DownRange', description: 'Compare USCCA, CCW Safe, Second Call Defense, and US Law Shield concealed carry insurance.' }

const PLANS = [
  { name:'USCCA', tier:'Elite', monthly:47, annual:497, coverage:'$2M civil', criminal:'Attorney fees paid upfront', bail:'$100K', training:'Included ($25 value)', verdict:'Best overall — upfront attorney payment is key. No reimbursement delays.', rating:9.4, url:'https://www.uscca.com', pros:['Pays attorney before trial','Best training resources','Established 2003','$2M civil coverage','Bail bond coverage'], cons:['Most expensive','Monthly cost adds up'] },
  { name:'CCW Safe', tier:'Ultimate', monthly:55, annual:659, coverage:'Unlimited civil', criminal:'Unlimited attorney fees', bail:'Unlimited', training:'Not included', verdict:'Best for high-stakes coverage. Unlimited attorney fees is unmatched. Popular with attorneys.', rating:9.2, url:'https://ccwsafe.com', pros:['Unlimited attorney coverage','Unlimited civil','Attorney chosen by member','Fastest claims response'], cons:['No training benefits','Most expensive tier'] },
  { name:'Second Call Defense', tier:'Ultimate', monthly:27, annual:324, coverage:'$1M civil', criminal:'$150K criminal', bail:'$25K', training:'Not included', verdict:'Best value. Significantly cheaper than top competitors. Good for budget-conscious carriers.', rating:8.5, url:'https://www.secondcalldefense.org', pros:['Lowest price','Immediate access to attorneys','Covers cleaning fees','Crime scene cleanup'], cons:['Lower coverage limits','No training'] },
  { name:'US Law Shield', tier:'Defender', monthly:11, annual:131, coverage:'Unlimited civil', criminal:'Unlimited attorney', bail:'Not included', training:'Not included', verdict:'Ultra-budget entry point. Unlimited coverage at lowest cost but limited extras.', rating:8.0, url:'https://www.uslawshield.com', pros:['Cheapest monthly','Unlimited attorney','Available in all 50 states','Simple signup'], cons:['No bail coverage','Limited support outside legal','No training'] },
]

const FACTORS = ['Upfront Attorney Payment','Civil Coverage Limit','Criminal Defense','Bail Bond','Training Included','Monthly Cost']

export default function CarryInsurancePage() {
  return (
    <>
      <BreakingTicker alerts={alerts || []} />
      M />
      <div className="page-hero" data-title="INSURANCE">
        <div className="container">
          <h1 className="page-hero-title">CCW Insurance Comparison</h1>
          <p className="page-hero-sub">USCCA · CCW Safe · Second Call Defense · US Law Shield — what you actually get</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <div style={{ background:'#1A0000', border:'1px solid #7F1D1D', padding:'14px 20px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#FCA5A5', marginBottom:'28px', lineHeight:1.7 }}>
            ⚠ These are legal service plans, not traditional insurance. The most critical factor is whether attorney fees are paid <strong>upfront vs reimbursed</strong> — in a self-defense situation, you may not be able to pay out of pocket first.
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'16px', marginBottom:'40px' }}>
            {PLANS.map((p,i)=>(
              <div key={p.name} style={{ background:'#111318', border:`1px solid ${i===0?'#C8922A':'#1F2428'}`, padding:'20px', position:'relative' }}>
                {i===0&&<div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', background:'#C8922A', color:'#000', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', fontWeight:700, padding:'3px 10px', whiteSpace:'nowrap' }}>EDITOR'S PICK</div>}
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.03em', marginBottom:'2px' }}>{p.name}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginBottom:'12px' }}>{p.tier} Tier</div>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:'#F0EDE6', lineHeight:1 }}>${p.monthly}<span style={{ fontSize:'1rem', color:'#4B5563' }}>/mo</span></div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginBottom:'16px' }}>${p.annual}/year</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'14px' }}>
                  {[['Civil',p.coverage],['Criminal',p.criminal],['Bail',p.bail]].map(([k,v])=>(
                    <div key={k} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280' }}>
                      <span style={{ color:'#374151' }}>{k}: </span>{v}
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#C8922A', marginBottom:'6px' }}>{p.rating}/10</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', lineHeight:1.6, marginBottom:'14px' }}>{p.verdict}</p>
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', textAlign:'center', background:'transparent', border:'1px solid #C8922A', color:'#C8922A', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'11px', padding:'8px', textDecoration:'none' }}>
                  VIEW PLANS →
                </a>
              </div>
            ))}
          </div>

          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151', marginBottom:'40px', lineHeight:1.7, padding:'16px 20px', background:'#111318', border:'1px solid var(--border)' }}>
            DownRange does not accept compensation from these companies. Rankings are based on coverage quality, attorney payment structure, and member reviews. Always read the full policy before purchasing.
          </div>

          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>WHAT TO LOOK FOR</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px' }}>
            {[
              ['🔑 Upfront vs Reimbursement','The most important factor. "Upfront" means they pay your attorney before your trial. "Reimbursement" means you pay first — possibly $100K+ — and get it back if you win.'],
              ['⚖ Criminal vs Civil Coverage','Criminal covers your defense if you\'re charged. Civil covers lawsuits by the shooter\'s family. You need both. Civil can bankrupt you even if you\'re acquitted criminally.'],
              ['💰 Bail Bond Coverage','If you\'re charged and held, bail can be $50K+. Plans with bail coverage keep you out of jail while awaiting trial — critical.'],
              ['📱 24/7 Access to Attorneys','You\'ll call immediately after a defensive shooting. Plans that give you direct attorney access at 3am are worth the premium.'],
            ].map(([t,d])=>(
              <div key={t} style={{ background:'#111318', border:'1px solid var(--border)', borderLeft:'3px solid #C8922A', padding:'16px 20px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', fontWeight:700, color:'#F0EDE6', marginBottom:'8px' }}>{t}</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
