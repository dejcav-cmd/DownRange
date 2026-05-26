import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Firearms Preparedness & Survival Guide — DownRange',
  description: 'Home defense planning, ammo storage, grid-down basics, and go-bag essentials. No fantasy prepper content — just what actually works.',
}

const SECTIONS = [
  {
    id:'home-defense', title:'Home Defense Planning', icon:'🏠',
    intro:'A home defense plan is more important than a home defense gun. Both matter, but most people buy the gun and skip the plan.',
    items:[
      { title:'The Fatal Funnel', desc:'Identify every entry point. Each is a fatal funnel — the attacker\'s most dangerous position. Never stand in doorways. Create layered defense that slows an intruder before they reach your family.' },
      { title:'Safe Room Concept', desc:'Designate one room as your fortified retreat: interior door, solid core, your phone, your firearm, a flashlight. One agreed-upon plan for everyone. The goal is to call 911 and wait — not to search the house.' },
      { title:'Weapon Selection', desc:'Wall penetration matters in a home with children. Consider pistol-caliber carbine or appropriate buckshot. Know where every round you fire can end up.' },
      { title:'Night Operations', desc:'You will need your firearm in the dark. Mount a weapon light. Practice finding your firearm in pitch black. Low-light shooting is a distinct skill — take a course.' },
      { title:'Communication Plan', desc:'Every family member needs a role. Who calls 911? Where do children go? Practice until it is automatic. Stress inoculation before the event saves lives.' },
    ]
  },
  {
    id:'ammo-storage', title:'Emergency Ammunition Storage', icon:'📦',
    intro:'Ammo has a shelf life measured in decades when stored correctly. Build your stockpile during normal times, at normal prices.',
    items:[
      { title:'Minimum Quantities', desc:'Handgun: 500 rounds minimum, 1,000 ideal. Home defense rifle: 1,000 rounds. .22 LR trainer: 5,000 rounds. Shotgun: 200 shells. These enable meaningful training AND reserve capacity.' },
      { title:'Storage Conditions', desc:'Ammo degrades fastest with humidity above 60%, temperature swings over 30°F, and UV exposure. A temperature-controlled interior closet beats a garage. Use sealed ammo cans with desiccant packets.' },
      { title:'Rotation Protocol', desc:'FIFO — first in, first out. Date every purchase. Use oldest stock for range training, replace with fresh. Properly stored ammo often outlives its owner.' },
      { title:'Caliber Consolidation', desc:'Optimal prep loadout: 9mm handgun, 5.56 rifle, 12 gauge shotgun. Three calibers, three jobs, maximum interoperability. Every additional caliber adds complexity and cost.' },
      { title:'Legal Considerations', desc:'No federal limit on ammunition for civilians. Some states have restrictions. Store securely to prevent theft and unauthorized access — you are responsible for your inventory.' },
    ]
  },
  {
    id:'grid-down', title:'Grid-Down Protocols', icon:'⚡',
    intro:'Power grid failure changes the threat environment. Your security posture must adapt within the first hour.',
    items:[
      { title:'First 72 Hours', desc:'Most urban crime spikes within 48–72 hours of grid failure. Secure your perimeter immediately. Lower visibility — no exterior lights, limit noise. Know your neighbors vehicles and patterns.' },
      { title:'Battery & Optics', desc:'Red dot batteries run 1,000–50,000 hours depending on model — know yours. Know how to use iron sights as backup. Stock CR123s and AAAs. A quality headlamp is often more practical than night vision.' },
      { title:'Vehicle Security', desc:'A vehicle is an extraction platform. Keep fuel above half-tank. Know three routes out. Understand your state\'s laws on vehicle firearm transport before you need them.' },
      { title:'Neighborhood Networks', desc:'The single most effective prep is knowing your neighbors. A trusted network of 3–5 households dramatically increases situational awareness and pools resources and skills.' },
      { title:'Night Vision', desc:'Gen 1 provides modest advantage at significant cost. Gen 3 provides substantial advantage at very high cost. Thorough knowledge of your property in the dark may be more practical for most budgets.' },
    ]
  },
  {
    id:'training', title:'Training for Real Scenarios', icon:'🎯',
    intro:'Skills atrophy faster than equipment degrades. A $400 pistol with 500 rounds of training is more effective than a $2,000 pistol with 20.',
    items:[
      { title:'Minimum Annual Round Count', desc:'Defensive handgun: 500 rounds per year minimum. Active carrier or competitive shooter: 1,000–2,000. Dry fire sessions — free, no ammo — are equally important and can be done daily.' },
      { title:'Force-on-Force Training', desc:'No live-fire drill replicates the stress of an opponent who can shoot back. Airsoft, Simunitions, or MilSim exercises reveal how skills hold under pressure. Take at least one FOF course per year.' },
      { title:'Medical Training', desc:'The gun stops the threat. The tourniquet saves the life. Every firearms owner should complete a Stop the Bleed course ($0–$40) and maintain a basic IFAK with CAT tourniquet, hemostatic gauze, and chest seal.' },
      { title:'Legal Education', desc:'Knowing when you may legally use lethal force is as critical as knowing how. USCCA training, MAG-20, and your state\'s use-of-force statutes are required reading before you carry.' },
      { title:'Physical Fitness', desc:'A firearm is a force equalizer — but fitness still matters. Stress impairs fine motor skills. Cardiovascular fitness slows heart rate recovery after exertion. Grip strength affects recoil management.' },
    ]
  },
  {
    id:'go-bag', title:'Go-Bag & Vehicle Kit', icon:'🎒',
    intro:'A go-bag is a practical response to the documented reality that Americans occasionally face mandatory evacuations — wildfires, hurricanes, chemical spills.',
    items:[
      { title:'Firearms Component', desc:'Your most portable handgun with 3 loaded magazines. A cleaning kit. Your carry permit — physically in the bag. A trigger lock for hotel/shelter stays. State carry information for your evacuation corridor.' },
      { title:'Critical Documents', desc:'Passport, birth certificates, property and insurance documents, medication list. Digitized on encrypted thumb drive. These take 72 hours to replace in normal times — years in disaster conditions.' },
      { title:'72-Hour Supplies', desc:'Water: 1 gallon per person per day. Calorie-dense food, no cooking required. 30-day medication supply. First aid kit. Cash in small bills. Battery bank. Emergency radio.' },
      { title:'Vehicle Kit', desc:'Separate from go-bag: a rifle-capable bag, 2–3 magazines, jumper cables, fix-a-flat, road flares, water, emergency blanket, basic tools. Car kit stays in the car. Go-bag is ready by the door.' },
      { title:'Testing Your System', desc:'Run a drill twice per year: start a timer, grab your go-bag, load your vehicle, drive to a designated secondary location. Most people discover they are 40 minutes slower than they thought. Fix what slows you.' },
    ]
  },
]

const GEAR = [
  { cat:'Defensive Firearms',  items:['Handgun (9mm recommended)','Home defense shotgun or carbine','Weapon-mounted light','Quality holster (IWB/OWB)','Backup iron sights'] },
  { cat:'Optics',              items:['Red dot or LPVO for rifle','Extra batteries (CR123, AAA)','Iron sight backup'] },
  { cat:'Medical',             items:['CAT or SOFTT-W tourniquet','Israeli bandage','Hemostatic gauze (QuikClot)','Chest seal (vented)','Nitrile gloves + shears'] },
  { cat:'Storage & Maintenance',items:['Ammo cans with O-ring seals','Desiccant packets','Gun safe or lockbox','Bore snake + CLP','Spare recoil springs'] },
  { cat:'Communication',       items:['Handheld ham radio (Baofeng)','Ham Technician license','Contact list on paper','Offline maps downloaded','Battery-powered NOAA radio'] },
]

const COURSES = [
  { name:'Stop the Bleed',             org:'American College of Surgeons', cost:'Free–$40', desc:'Lifesaving bleeding control. 90 minutes. Every firearms owner needs this first.' },
  { name:'NRA First Steps',            org:'NRA',   cost:'$60–$100', desc:'Fundamentals for new shooters. Safe handling, storage, basic marksmanship.' },
  { name:'MAG-20 (Massad Ayoob Group)',org:'MAG',   cost:'$450', desc:'Legal use of lethal force. Gold standard for understanding legal aftermath.' },
  { name:'USCCA Fundamentals',         org:'USCCA', cost:'$149', desc:'Comprehensive EDC training with legal and insurance context.' },
  { name:'Combat Focus Shooting',      org:'I.C.E. Training', cost:'$350–$500', desc:'Stress-tested defensive shooting methodology. Science-based.' },
]

export default function PrepPage() {
  return (
    <>
      <Masthead />

      {/* ── Hero ── */}
      <div className="page-hero" data-title="PREP">
        <div className="container">
          <div className="dr-breadcrumb" style={{ marginBottom:'14px' }}>
            <span className="dr-breadcrumb-cur">Outdoors</span>
            <span className="dr-breadcrumb-sep">›</span>
            <span className="dr-breadcrumb-cur">Preparedness</span>
          </div>
          <h1 className="page-hero-title">Firearms Preparedness</h1>
          <p className="page-hero-sub">Home defense · Ammo storage · Grid-down · Go-bag · Training</p>
          <div style={{ display:'flex', gap:'8px', marginTop:'16px', flexWrap:'wrap' }}>
            <Link href="/training" className="dr-btn-primary" style={{ padding:'10px 20px' }}>Training Drills →</Link>
            <Link href="/safe-storage" className="dr-btn-outline" style={{ padding:'9px 19px' }}>Safe Storage →</Link>
          </div>
        </div>
      </div>

      {/* ── Quick nav ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'12px 0' }}>
        <div className="container">
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`} className="dr-badge dr-badge-dim">
                {s.icon} {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container" style={{ maxWidth:960 }}>

          {/* ── Main sections ── */}
          {SECTIONS.map(section => (
            <div key={section.id} id={section.id} className="dr-section">
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                <span style={{ fontSize:'26px' }}>{section.icon}</span>
                <h2 className="dr-section-title" style={{ marginBottom:0 }}>{section.title}</h2>
              </div>
              <p className="t-body-md" style={{ borderLeft:'3px solid var(--gold)', paddingLeft:'16px', marginBottom:'20px' }}>
                {section.intro}
              </p>
              <div className="dr-grid-2">
                {section.items.map((item, i) => (
                  <div key={i} className="dr-infoblock">
                    <div className="dr-infoblock-title">{item.title}</div>
                    <div className="dr-infoblock-body">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── Gear checklist ── */}
          <div className="dr-section">
            <h2 className="dr-section-title">Preparedness Gear Checklist</h2>
            <p className="dr-section-sub">Minimum kit for a firearms-ready household</p>
            <div className="dr-grid-3" style={{ gap:'12px' }}>
              {GEAR.map(cat => (
                <div key={cat.cat} className="dr-card">
                  <div className="dr-card-meta">{cat.cat}</div>
                  {cat.items.map((item, i) => (
                    <div key={i} className="dr-spec-row" style={{ padding:'6px 0' }}>
                      <span className="dr-spec-key" style={{ color:'var(--text-dim)' }}>☐</span>
                      <span className="dr-spec-val" style={{ textAlign:'left', fontSize:'11px', color:'var(--text-muted)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── Courses ── */}
          <div className="dr-section">
            <h2 className="dr-section-title">Recommended Courses</h2>
            <p className="dr-section-sub">Invest in training before you need it</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {COURSES.map(c => (
                <div key={c.name} className="dr-card" style={{ display:'grid', gridTemplateColumns:'200px 1fr 100px', gap:'16px', alignItems:'center' }}>
                  <div>
                    <div className="dr-card-title" style={{ fontSize:'1rem' }}>{c.name}</div>
                    <div className="dr-card-meta" style={{ marginBottom:0 }}>{c.org}</div>
                  </div>
                  <p className="dr-card-body">{c.desc}</p>
                  <div className="dr-card-price" style={{ textAlign:'right' }}>{c.cost}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dr-alert-info">
            ⚠ This guide is for educational purposes. Always comply with local, state, and federal laws regarding firearm storage, transport, and use. Consult an attorney for laws in your jurisdiction.
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
