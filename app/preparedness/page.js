import Link from 'next/link'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'
import { createClient } from '@sanity/client'

export const metadata = {
  title: 'Firearms Preparedness — Home Defense, Go-Bag, Grid-Down | DownRange',
  description: 'Practical preparedness for gun owners: 72-hour kit, home defense planning, ammo storage, grid-down protocols, IFAK build, communications, and vehicle prep.',
  alternates: { canonical: 'https://downrangeco.com/preparedness' },
  openGraph: {
    title: 'Firearms Preparedness — Home Defense & Emergency Planning | DownRange',
    description: 'No-nonsense preparedness for gun owners. 72-hour kit, home defense setup, ammo storage, go-bag, IFAK, grid-down protocols.',
    url: 'https://downrangeco.com/preparedness',
  },
}

export const revalidate = 3600

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
})

// ── DATA ─────────────────────────────────────────────────────────────────────

const THREAT_LEVELS = [
  { level:'Tier 1', label:'72-Hour Disruption', color:'#22c55e', desc:'Power outage, severe weather, short supply disruption. You shelter in place. Most Americans experience this once a year.', items:['3 days water (1 gal/person/day)','72hrs food (shelf-stable)','Flashlights + batteries','First aid kit','Cash (small bills)','Important documents (copies)','Phone charger + power bank'] },
  { level:'Tier 2', label:'Extended Disruption (2–4 wks)', color:'#FBBF24', desc:'Extended grid failure, regional disaster, civil unrest. Evacuation may be required. Supply chains disrupted.', items:['2–4 weeks food supply','Water filtration (Sawyer/LifeStraw)','Generator or solar + battery bank','30+ days medications','Bug-out bag ready to go','Security plan for the home','Community contact list'] },
  { level:'Tier 3', label:'Long-Term Instability', color:'#ef4444', desc:'Sustained grid failure, societal breakdown. Self-sufficiency becomes critical. Think Hurricane Katrina + 6 months.', items:['3+ months food storage (freeze-dried)','Well or cistern water source','Ham radio license (Technician class)','Medical training (TCCC/first aid)','Barter goods','Multiple egress routes planned','Trusted network of neighbors'] },
]

const GO_BAG = [
  {
    cat:'Water & Food', icon:'💧', priority:'CRITICAL',
    items:[
      { item:'Water (1 liter minimum, 3L ideal)', why:'You die in 3 days without it' },
      { item:'Water purification tabs or filter', why:'Secondary source if you need to resupply' },
      { item:'3 days calories (bars, MRE, freeze-dried)', why:'Energy for movement under stress' },
    ]
  },
  {
    cat:'Medical / IFAK', icon:'🩹', priority:'CRITICAL',
    items:[
      { item:'CAT tourniquet (x2)', why:'Single most important trauma tool' },
      { item:'Israeli bandage (pressure dressing)', why:'Wound packing for major bleeding' },
      { item:'Combat gauze (QuikClot or Celox)', why:'Penetrating wound hemorrhage control' },
      { item:'Chest seals (vented x2)', why:'Tension pneumothorax prevention' },
      { item:'NPA (nasopharyngeal airway)', why:'Airway management unconscious casualty' },
      { item:'Nitrile gloves (x4 pairs)', why:'Protection + hygiene' },
    ]
  },
  {
    cat:'Navigation', icon:'🗺️', priority:'HIGH',
    items:[
      { item:'Physical map of your region', why:'GPS fails; maps don\'t' },
      { item:'Compass (baseplate)', why:'Dead reckoning when all else fails' },
      { item:'Phone with offline maps downloaded', why:'Backup navigation' },
    ]
  },
  {
    cat:'Communications', icon:'📡', priority:'HIGH',
    items:[
      { item:'Handheld ham radio (Baofeng UV-5R)', why:'Communication when cell towers fail' },
      { item:'NOAA weather radio', why:'Emergency alert reception' },
      { item:'Satellite communicator (Garmin inReach)', why:'Two-way communication off-grid' },
    ]
  },
  {
    cat:'Fire & Light', icon:'🔦', priority:'MEDIUM',
    items:[
      { item:'Headlamp (with extra batteries)', why:'Hands-free navigation in the dark' },
      { item:'Bic lighter (x3) + waterproof matches', why:'Fire in all conditions' },
      { item:'Tinder (cotton balls + petroleum jelly)', why:'Reliable fire ignition' },
    ]
  },
  {
    cat:'Shelter & Warmth', icon:'🏕️', priority:'MEDIUM',
    items:[
      { item:'Emergency mylar blankets (x2)', why:'Retain 90% body heat, 2 oz each' },
      { item:'Poncho or rain layer', why:'Hypothermia prevention' },
      { item:'Paracord 550 (50 ft)', why:'Shelter construction, gear repair' },
    ]
  },
  {
    cat:'Firearms & Security', icon:'🔫', priority:'CONTEXT-DEPENDENT',
    items:[
      { item:'Carry pistol (daily carry gun)', why:'Threat response in transit' },
      { item:'2–3 loaded magazines', why:'Combat reload capacity' },
      { item:'Holster (secure retention)', why:'Safe carry while moving' },
      { item:'Note: Check state laws when crossing state lines', why:'Legal compliance' },
    ]
  },
]

const HOME_DEFENSE = [
  {
    id:'audit', title:'Home Security Audit', icon:'🏠',
    steps:[
      { n:'1', title:'Map your entry points', desc:'Every door and window is a fatal funnel. Walk your home exterior and catalog every possible breach point. Ground-floor windows are the most common entry.' },
      { n:'2', title:'Harden the front door', desc:'Most residential door frames fail with a single kick. Install a door reinforcement kit (StrikeMaster II or equivalent). Strike plates with 3-inch screws into the stud, not the frame.' },
      { n:'3', title:'Establish a safe room', desc:'One room becomes your defended position. Master bedroom is typical. Solid-core door, phone charger, firearm secured but accessible, ability to call 911.' },
      { n:'4', title:'Exterior lighting', desc:'Motion-activated lighting eliminates concealment. Attackers choose dark, unlit entry points. Ring cameras provide documentation and deterrence.' },
      { n:'5', title:'Communication plan', desc:'Every adult in the household needs a defined role. Who calls 911? Where do children go? What is the codeword for shelter-in-place? Run it like a fire drill.' },
    ]
  },
  {
    id:'weapons', title:'Home Defense Weapon Selection', icon:'🔫',
    steps:[
      { n:'1', title:'Shotgun: close-range dominance', desc:'12 GA with 00 buckshot is devastating at room-clearing distances. Over-penetration is real — understand what is behind your walls. Pattern your load before relying on it.' },
      { n:'2', title:'Pistol-caliber carbine: balanced choice', desc:'9mm PCC (KelTec Sub-2000, CZ Scorpion, Ruger PC Carbine) offers rifle control with pistol penetration. Less wall-penetration risk than rifle rounds. Magazine sharing with your carry pistol is a bonus.' },
      { n:'3', title:'AR-15 (5.56): misunderstood penetration', desc:'Contrary to belief, 5.56 often penetrates less drywall than .40 S&W or 12 GA buckshot due to fragmentation. M193 55gr is the standard recommendation. Best for rural properties.' },
      { n:'4', title:'Pistol: the first responder', desc:'Your handgun is what you will actually reach first in the dark. It goes with you to the bathroom at night. A suppressed .45 or 9mm on a nightstand beats a shotgun in a case across the house.' },
    ]
  },
]

const AMMO_STORAGE = {
  minimums: [
    { type:'Handgun (9mm/.45)', minimum:'500 rounds', ideal:'1,000+ rounds', notes:'Practice with ball; store JHP for defense' },
    { type:'Rifle (5.56/.308)', minimum:'1,000 rounds', ideal:'2,000+ rounds', notes:'Ball for training; quality HP for use' },
    { type:'Shotgun (12 GA)', minimum:'250 shells', ideal:'500 shells', notes:'Mix of 00 buck + slugs' },
    { type:'.22 LR', minimum:'1,000 rounds', ideal:'5,000+ rounds', notes:'Training, small game, low noise option' },
  ],
  storage: [
    'Keep humidity under 60% — use desiccant packets or a dehumidifier rod',
    'Store off concrete floors (moisture wicking) — use wooden pallets or shelving',
    'Temperature stability matters more than specific temperature — avoid attic storage',
    'Ammo has a shelf life of 10+ years when stored properly',
    'FIFO rotation: mark every purchase with date, use oldest first',
    'Avoid storing near solvents or chemicals — propellant can absorb odors',
  ],
  legal: 'No federal limit on civilian ammunition stockpiles. Some states restrict certain types (AP, incendiary). California, New Jersey, Illinois have specific magazine and ammo restrictions — know your state law.',
}

const GRID_DOWN_PROTOCOLS = [
  { phase:'Hours 0–6', title:'Immediate Assessment', color:'#22c55e', actions:['Verify power outage is regional, not just your home','Check battery radio or NOAA for emergency broadcasts','Inventory food, water, fuel immediately','Charge all devices while any power remains','Notify family members of situation and meeting point'] },
  { phase:'Hours 6–24', title:'Secure and Stabilize', color:'#FBBF24', actions:['Fill bathtubs (100 gal emergency water per tub)','Move perishables to cooler with ice from freezer','Secure perimeter — lock gates, ensure exterior lighting is manual','Contact neighbors — community awareness is a force multiplier','Establish a radio check schedule for news updates'] },
  { phase:'Day 2–3', title:'Assess Duration', color:'#ef4444', actions:['If no restoration in sight, evaluate bug-out vs. shelter-in-place','Bug-out if: urban area, water supply compromised, civil unrest','Stay if: rural, water source available, community trust established','Fuel up vehicles now before gas stations are overwhelmed','Establish watch rotation if civil unrest is possible'] },
  { phase:'Day 4+', title:'Long-Term Posture', color:'#C084FC', actions:['Water rationing protocol: 1 gallon/day/person minimum','Food rationing to extend supplies — reduce caloric intake 20%','Ham radio contact with extended family/network','Security posture: limit exterior activity, reduce visibility','Document everything for insurance/FEMA claims post-event'] },
]

const MEDICAL_TRAINING = [
  { cert:'Stop the Bleed', provider:'American College of Surgeons', cost:'Free', duration:'2 hours', focus:'Tourniquet application, wound packing, pressure dressings', link:'https://www.stopthebleed.org' },
  { cert:'TCCC (Tactical Combat Casualty Care)', provider:'Various', cost:'$200–500', duration:'1–2 days', focus:'Military-derived trauma care; most applicable for armed citizens', link:'https://deployedmedicine.com' },
  { cert:'TECC (Tactical Emergency Casualty Care)', provider:'C-TECC, various', cost:'$200–400', duration:'1–2 days', focus:'Civilian adaptation of TCCC; mass casualty events', link:'https://c-tecc.org' },
  { cert:'Wilderness First Responder', provider:'NOLS, SOLO', cost:'$700–900', duration:'70–80 hours', focus:'Extended care when EMS is delayed', link:'https://nols.edu/wfr' },
  { cert:'CPR/AED + First Aid', provider:'Red Cross, AHA', cost:'$50–100', duration:'4–8 hours', focus:'Foundation skills everyone should have', link:'https://redcross.org' },
]

export default async function PreparednessPage({ searchParams }) {
  const tab = searchParams?.tab || 'levels'
  const alerts = await fetchBreakingAlerts(5).catch(() => [])

  let prepContent = []
  try {
    prepContent = await sanity.fetch(
      `*[_type == "prepContent"] | order(publishedAt desc) [0...12] { _id, title, category, body, publishedAt }`
    )
  } catch {}

  const TABS = [
    { key:'levels',     label:'⚡ Threat Levels'    },
    { key:'gobag',      label:'🎒 Go-Bag Build'     },
    { key:'homedefense',label:'🏠 Home Defense'     },
    { key:'ammo',       label:'📦 Ammo Storage'     },
    { key:'griddown',   label:'🔌 Grid-Down'        },
    { key:'medical',    label:'🩹 Medical Training' },
  ]

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* HERO */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 80% 50%, rgba(239,68,68,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'45%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'14vw', color:'#ef4444', lineHeight:0.85, paddingLeft:'20px', paddingTop:'10px' }}>PREP</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span style={{ background:'#ef4444', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>PREPAREDNESS</span>
              <span style={{ background:'rgba(239,68,68,.12)', color:'#ef4444', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, padding:'3px 10px', border:'1px solid rgba(239,68,68,.3)' }}>NO FANTASY PREPPING</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.4rem,5vw,3.8rem)', color:'var(--text)', letterSpacing:'0.04em', lineHeight:1, marginBottom:12 }}>
              FIREARMS PREPAREDNESS<br />
              <span style={{ color:'#ef4444' }}>FOR REAL SCENARIOS</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'var(--text-dim)', lineHeight:1.7, maxWidth:560 }}>
              No bunker fantasies. No 30-year food hoarding without a plan. This is practical preparedness for gun owners — home defense setups that work, go-bags you will actually carry, and medical training that saves lives.
            </p>
          </div>
        </div>
      </div>

      {/* STICKY TABS */}
      <div style={{ borderBottom:'1px solid var(--border)', background:'var(--bg2)', position:'sticky', top:60, zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none' }}>
            {TABS.map(t => (
              <Link key={t.key} href={`/preparedness?tab=${t.key}`}
                style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700,
                  letterSpacing:'.06em', padding:'12px 18px', whiteSpace:'nowrap', textDecoration:'none',
                  color: tab === t.key ? '#fff' : 'var(--text-dim)',
                  background: tab === t.key ? '#ef4444' : 'transparent',
                  borderBottom: tab === t.key ? '3px solid #ef4444' : '3px solid transparent' }}>
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'40px 0 80px', background:'var(--bg)' }}>
        <div className="container">

          {/* THREAT LEVELS */}
          {tab === 'levels' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>PREPAREDNESS TIERS — WHAT TO BUILD FIRST</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24 }}>Most people get 72-hour preparedness right before worrying about anything else. Build in order. Tier 1 is realistic for any household in under a week with less than $200.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
                {THREAT_LEVELS.map(t => (
                  <div key={t.level} style={{ background:'#111318', border:`1px solid var(--border)`, padding:'20px', borderTop:`3px solid ${t.color}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, background: t.color + '22', color: t.color, padding:'2px 8px', border:`1px solid ${t.color}44` }}>{t.level}</span>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color: t.color, letterSpacing:'.04em', marginBottom:8 }}>{t.label}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.6, marginBottom:12 }}>{t.desc}</div>
                    <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                      {t.items.map(item => (
                        <li key={item} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', paddingLeft:12, position:'relative' }}>
                          <span style={{ position:'absolute', left:0, color: t.color }}>▸</span>{item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GO-BAG */}
          {tab === 'gobag' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>GO-BAG BUILD — WHAT ACTUALLY GOES IN IT</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24 }}>Target weight: 25–35 lbs fully loaded. This is what you can actually move with. A 70-lb pack stays in the truck. Build for 72 hours of movement, not 30 days of camping.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
                {GO_BAG.map(cat => (
                  <div key={cat.cat} style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:20 }}>{cat.icon}</span>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:'var(--text)', letterSpacing:'.04em' }}>{cat.cat}</div>
                    </div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color: cat.priority === 'CRITICAL' ? '#ef4444' : cat.priority === 'HIGH' ? '#FBBF24' : '#6B7280', fontWeight:700, marginBottom:12, letterSpacing:'.08em' }}>{cat.priority}</div>
                    {cat.items.map(it => (
                      <div key={it.item} style={{ marginBottom:10, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text)', marginBottom:2 }}>{it.item}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6B7280' }}>Why: {it.why}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HOME DEFENSE */}
          {tab === 'homedefense' && (
            <div>
              {HOME_DEFENSE.map(section => (
                <div key={section.id} style={{ marginBottom:36 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                    <span style={{ fontSize:24 }}>{section.icon}</span>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em' }}>{section.title}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {section.steps.map(step => (
                      <div key={step.n} style={{ background:'#111318', border:'1px solid var(--border)', padding:'18px', display:'grid', gridTemplateColumns:'32px 1fr', gap:16 }}>
                        <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'#ef4444', lineHeight:1 }}>{step.n}</div>
                        <div>
                          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{step.title}</div>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6 }}>{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AMMO STORAGE */}
          {tab === 'ammo' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>EMERGENCY AMMUNITION STORAGE</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24 }}>Ammo has a shelf life measured in decades when stored correctly. Build your reserve during normal times when prices are stable. Panic-buying after an event means paying double.</p>
              <div style={{ overflowX:'auto', marginBottom:32 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid var(--gold)' }}>
                      {['Type','Minimum','Ideal','Notes'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'var(--gold)', fontWeight:700, letterSpacing:'.06em', fontSize:10 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AMMO_STORAGE.minimums.map((row, i) => (
                      <tr key={row.type} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                        <td style={{ padding:'10px 12px', color:'var(--text)', fontWeight:700 }}>{row.type}</td>
                        <td style={{ padding:'10px 12px', color:'#ef4444', fontWeight:700 }}>{row.minimum}</td>
                        <td style={{ padding:'10px 12px', color:'#22c55e', fontWeight:700 }}>{row.ideal}</td>
                        <td style={{ padding:'10px 12px', color:'#6B7280', fontSize:10 }}>{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', marginBottom:16 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:'var(--gold)', marginBottom:12 }}>STORAGE RULES</div>
                {AMMO_STORAGE.storage.map(rule => (
                  <div key={rule} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.6, paddingLeft:12, position:'relative', marginBottom:6 }}>
                    <span style={{ position:'absolute', left:0, color:'var(--gold)' }}>▸</span>{rule}
                  </div>
                ))}
              </div>
              <div style={{ padding:'14px 16px', background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.25)' }}>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#ef4444', fontWeight:700 }}>LEGAL: </span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)' }}>{AMMO_STORAGE.legal}</span>
              </div>
            </div>
          )}

          {/* GRID DOWN */}
          {tab === 'griddown' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>GRID-DOWN PROTOCOLS</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24 }}>Power grid failures change the threat environment. Most urban crime spikes within 48–72 hours. Your response in the first six hours determines your options for the next two weeks.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {GRID_DOWN_PROTOCOLS.map(phase => (
                  <div key={phase.phase} style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', borderLeft:`4px solid ${phase.color}` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color: phase.color, background: phase.color + '22', padding:'2px 8px', border:`1px solid ${phase.color}44` }}>{phase.phase}</span>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color: phase.color, letterSpacing:'.04em' }}>{phase.title}</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:6 }}>
                      {phase.actions.map(action => (
                        <div key={action} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.5, paddingLeft:12, position:'relative' }}>
                          <span style={{ position:'absolute', left:0, color: phase.color }}>▸</span>{action}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEDICAL */}
          {tab === 'medical' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>MEDICAL TRAINING FOR GUN OWNERS</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24 }}>The gun stops the threat. The tourniquet saves the life. Gunshot wounds bleed fast — you have 3–5 minutes before hemorrhagic shock becomes fatal. If you carry, you need to know how to stop bleeding. Start with Stop the Bleed. Add TCCC when you are ready for the full curriculum.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, marginBottom:32 }}>
                {MEDICAL_TRAINING.map(cert => (
                  <div key={cert.cert} style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', borderTop:'3px solid #ef4444' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:4 }}>{cert.cert}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', marginBottom:8 }}>{cert.provider}</div>
                    <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#22c55e', background:'rgba(34,197,94,.12)', padding:'2px 6px', border:'1px solid rgba(34,197,94,.3)' }}>{cert.cost}</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6B7280', background:'var(--bg2)', padding:'2px 6px', border:'1px solid var(--border)' }}>{cert.duration}</span>
                    </div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.5, marginBottom:12 }}>{cert.focus}</div>
                    <a href={cert.link} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#ef4444', textDecoration:'underline' }}>
                      Find a course →
                    </a>
                  </div>
                ))}
              </div>
              <div style={{ padding:'20px', background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.25)' }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:'#ef4444', marginBottom:8 }}>MINIMUM IFAK BUILD</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.8 }}>
                  CAT tourniquet · Israeli bandage · Combat gauze · Chest seal (vented) · NPA airway · Trauma shears · Gloves · Marker (to note tourniquet time)<br />
                  <span style={{ color:'#ef4444' }}>Cost: ~$80–120 for a proper IFAK. Get trained on everything in it before you need it.</span>
                </div>
              </div>
            </div>
          )}

          {prepContent.length > 0 && (
            <div style={{ marginTop:48 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--text)', letterSpacing:'.04em' }}>LATEST PREPAREDNESS INTEL</div>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
                {prepContent.slice(0,6).map(post => (
                  <div key={post._id} style={{ background:'#111318', border:'1px solid var(--border)', padding:'18px' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#ef4444', letterSpacing:'.08em', marginBottom:6 }}>{post.category?.toUpperCase()}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'var(--text)', lineHeight:1.3, marginBottom:8 }}>{post.title}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563' }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : ''}</div>
                  </div>
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
