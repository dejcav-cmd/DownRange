import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
export const metadata = { title: 'Firearms Training & Drills — DownRange', description: 'Dry fire plans, live fire drills, and training resources. No theory — just the drills that build real skill.' }

const DRILLS = [
  { name:'1-Reload-1', level:'Beginner', time:'10 min', rounds:10, desc:'Draw, fire 1 round, emergency reload, fire 1 more. Builds reload speed under mild pressure.', target:'7 yards', par:'6 seconds' },
  { name:'Dot Torture', level:'Intermediate', time:'20 min', rounds:50, desc:'10 small dots on a single target. Draws, one-hand, two-hand, trigger control. Perfect practice for accuracy.', target:'3 yards', par:'No time limit' },
  { name:'IDPA 5x5', level:'Intermediate', time:'15 min', rounds:25, desc:'5 shots on a 5" circle, 5 times. Scored on hits and time. Excellent benchmark drill.', target:'10 yards', par:'25 seconds clean' },
  { name:'Bill Drill', level:'Advanced', time:'10 min', rounds:36, desc:'6 shots on a single target as fast as possible with all A-zone hits. Tests trigger speed and follow-through.', target:'7 yards', par:'Under 2 seconds' },
  { name:'Failure to Stop', level:'Intermediate', time:'10 min', rounds:30, desc:'2 to the body, 1 to the head. Tests target transitions and precision under speed.', target:'7 yards', par:'Under 1.5 seconds' },
  { name:'The F.A.S.T. Drill', level:'Advanced', time:'15 min', rounds:6, desc:'From concealment: 2 shots to 3x5" card (head), slide lock, reload, 4 shots to 8" body circle. FBI-developed.', target:'7 yards', par:'5 seconds (Novice: 10s)' },
]

const DRY_FIRE_PLAN = [
  { day:'Mon', focus:'Draw stroke', reps:50, desc:'Smooth consistent draw from holster to target. Focus on grip acquisition on the draw.' },
  { day:'Tue', focus:'Trigger press', reps:100, desc:'Dry-fire trigger pulls with focus on no sight movement. Use a laser trainer if available.' },
  { day:'Wed', focus:'Reloads', reps:30, desc:'Emergency and tactical reloads. Count seconds, build speed gradually.' },
  { day:'Thu', focus:'One-hand shooting', reps:50, desc:'Strong-hand only and weak-hand only dry fire. Critical for malfunction clearance.' },
  { day:'Fri', focus:'Full draw + trigger', reps:75, desc:'Complete integration: draw from holster, acquire sights, press trigger, re-holster.' },
  { day:'Sat', focus:'Scenario work', reps:20, desc:'Simulate real scenarios: drawing from seated position, around cover, multiple targets.' },
  { day:'Sun', focus:'Rest & review', reps:0, desc:'Review your week. Watch training videos. Plan next week goals. Rest is part of training.' },
]

const RESOURCES = [
  { name:'Massad Ayoob Group', type:'Course', url:'https://massadayoobgroup.com', desc:'Lethal force and legal aftermath training. Industry gold standard.' },
  { name:'USCCA Training', type:'Course', url:'https://www.uscca.com/training', desc:'Concealed carry and self-defense specific curriculum.' },
  { name:'US Shooting Academy', type:'Range', url:'https://usshootingacademy.com', desc:'Professional instruction in competition and self-defense shooting.' },
  { name:'SureFire Institute', type:'Course', url:'https://www.surefire.com/institute', desc:'Advanced carbine and pistol courses from military professionals.' },
]

export default function TrainingPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="TRAINING">
        <div className="container">
          <h1 className="page-hero-title">Training & Drills</h1>
          <p className="page-hero-sub">Structured range drills · 30-day dry fire program · Pro training resources</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>RANGE DRILLS</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px', marginBottom:'48px' }}>
            {DRILLS.map(d=>{
              const levelColor = { Beginner:'#34D399', Intermediate:'#FBBF24', Advanced:'#EF4444' }[d.level]
              return (
                <div key={d.name} style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', borderLeft:`3px solid ${levelColor}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
                    <h3 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.3rem', color:'#F0EDE6', letterSpacing:'0.03em' }}>{d.name}</h3>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:levelColor, background:`${levelColor}20`, padding:'3px 8px', alignSelf:'flex-start' }}>{d.level.toUpperCase()}</span>
                  </div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280', lineHeight:1.6, marginBottom:'12px' }}>{d.desc}</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                    {[['Rounds',d.rounds],['Distance',d.target],['Par',d.par]].map(([k,v])=>(
                      <div key={k} style={{ background:'#0D1117', padding:'8px', textAlign:'center' }}>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginBottom:'3px' }}>{k.toUpperCase()}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>30-MINUTE WEEKLY DRY FIRE PLAN</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'8px', marginBottom:'48px' }}>
            {DRY_FIRE_PLAN.map(d=>(
              <div key={d.day} style={{ background:'#111318', border:'1px solid var(--border)', padding:'14px 12px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', marginBottom:'6px' }}>{d.day}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#F0EDE6', fontWeight:700, marginBottom:'4px' }}>{d.focus}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', marginBottom:'8px' }}>{d.reps > 0 ? `${d.reps} reps` : 'Rest'}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', lineHeight:1.5 }}>{d.desc}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>PROFESSIONAL TRAINING RESOURCES</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px' }}>
            {RESOURCES.map(r=>(
              <a key={r.name} href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration:'none', background:'#111318', border:'1px solid var(--border)', padding:'16px 20px', display:'flex', gap:'16px', alignItems:'flex-start' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A', background:'#1A0E00', padding:'3px 8px', border:'1px solid #C8922A30', flexShrink:0, marginTop:'2px' }}>{r.type.toUpperCase()}</div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#F0EDE6', marginBottom:'4px' }}>{r.name}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.5 }}>{r.desc}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
