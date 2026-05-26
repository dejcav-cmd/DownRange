import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Firearms Preparedness & Survival Guide — DownRange',
  description: 'Complete guide to firearms-focused preparedness. Home defense planning, emergency ammo storage, grid-down protocols, and community resilience.',
}

const SECTIONS = [
  {
    id: 'home-defense',
    title: 'Home Defense Planning',
    icon: '🏠',
    color: '#60A5FA',
    intro: 'A home defense plan is more important than a home defense gun. Both matter, but most people buy the gun and skip the plan.',
    items: [
      { title: 'The Fatal Funnel', desc: 'Identify every entry point. Exterior doors, ground-floor windows, garage doors. Each is a potential fatal funnel — the attacker\'s most dangerous position. Never stand in them. Create a layered defense that slows an intruder before they reach your family.' },
      { title: 'Safe Room Concept', desc: 'Designate one room as the fortified retreat. Interior door with a solid core or reinforced frame. Your phone. Your defensive firearm. A flashlight. A simple plan agreed upon by everyone in the home. The goal is to call 911 and wait — not to search the house.' },
      { title: 'Weapon Selection by Room', desc: 'The 12-gauge shotgun\'s intimidation factor is real, but wall penetration matters in a home with children. Consider a pistol-caliber carbine or buckshot patterns for reduced over-penetration. Know where every round you fire can end up.' },
      { title: 'Night Operations', desc: 'You\'ll likely need your home defense firearm in the dark. Mount a weapon light. Practice finding your firearm in pitch black. Low-light shooting is a distinct skill set — take a course.' },
      { title: 'Communication Plan', desc: 'Every family member needs a role. What does the spouse do? Where do children go? Who calls 911? Practice this until it\'s automatic. Stress inoculation before the event saves lives.' },
    ]
  },
  {
    id: 'ammo-storage',
    title: 'Emergency Ammunition Storage',
    icon: '📦',
    color: '#C8922A',
    intro: 'Ammo is a consumable with a shelf life measured in decades when stored correctly. Build your stockpile during normal times.',
    items: [
      { title: 'Minimum Recommended Quantities', desc: 'Handgun: 500 rounds minimum, 1,000 ideal. Home defense rifle: 1,000 rounds. .22 LR trainer: 5,000 rounds. Shotgun defense: 200 shells. These numbers enable meaningful training AND reserve capacity.' },
      { title: 'Storage Conditions', desc: 'Ammunition degrades fastest under three conditions: humidity above 60%, temperature swings above 30°F, and direct UV exposure. A temperature-controlled interior closet outperforms a garage or basement in most climates. Use sealed ammo cans with desiccant packets.' },
      { title: 'Rotation Protocol', desc: 'FIFO — first in, first out. Date every purchase. Use the oldest stock for range training, replace with fresh. Properly stored ammo often outlives its owner, but rotation builds the habit of regular range visits.' },
      { title: 'Caliber Consolidation', desc: 'Every caliber you add to your inventory adds complexity and cost. The optimal prep loadout: 9mm handgun, 5.56 rifle, 12 gauge shotgun. Three calibers, three jobs, maximum interoperability with anyone who might assist you.' },
      { title: 'Legal Considerations', desc: 'No federal limit on ammunition storage for civilians. Some states have restrictions. Magazine capacity limits vary. Know your state law before building a large stockpile. Store securely to prevent theft and unauthorized access.' },
    ]
  },
  {
    id: 'grid-down',
    title: 'Grid-Down Protocols',
    icon: '⚡',
    color: '#FBBF24',
    intro: 'Power grid failure changes the threat environment. Your security posture must adapt within the first hour.',
    items: [
      { title: 'First 72 Hours', desc: 'Most urban crime spikes within 48-72 hours of a grid failure. Secure your perimeter immediately. Lower your visibility profile — no exterior lights, limit noise. Know your neighbors\' vehicles and patterns. Anything unusual is information.' },
      { title: 'Weapons Maintenance Without Power', desc: 'Battery-powered optics have limited runtime. Know how to use iron sights as a backup. Red dot batteries typically run 1,000-50,000 hours depending on model — know yours. Stock extra CR123s and AAAs.' },
      { title: 'Vehicle Security', desc: 'A vehicle is a force multiplier and an extraction platform. Keep fuel above half-tank. Know three routes out of your area. A rifle-capable carbine stored in a vehicle bag allows rapid deployment. Understand your state\'s laws on vehicle transport.' },
      { title: 'Neighborhood Security Networks', desc: 'The single most effective prep is knowing your neighbors. A trusted network of 3-5 households dramatically increases situational awareness, allows shift-based security watches, and pools resources and skills.' },
      { title: 'Night Vision Considerations', desc: 'Generation 1 night vision provides modest advantage at significant cost. Generation 3 provides substantial advantage at very high cost. A quality 50-lumen headlamp and thorough knowledge of your property in the dark may be more practical for most budgets.' },
    ]
  },
  {
    id: 'training-plan',
    title: 'Training for Real Scenarios',
    icon: '🎯',
    color: '#34D399',
    intro: 'Skills atrophy faster than equipment degrades. A $400 pistol with 500 rounds of training is more effective than a $2,000 pistol with 20 rounds.',
    items: [
      { title: 'Minimum Annual Round Count', desc: 'Defensive handgun: 500 rounds/year minimum to maintain perishable skills. Competition shooter or active carrier: 1,000-2,000 rounds. Dry fire sessions (free, no ammo) are equally important and can be done daily.' },
      { title: 'Force-on-Force Training', desc: 'No live-fire drill replicates the stress of an opponent shooting back. Airsoft, Simunitions, or MilSim exercises reveal how skills hold up under pressure. Take at least one FOF course per year.' },
      { title: 'Medical Training', desc: 'The gun stops the threat. The tourniquet saves the life. Every firearms owner should complete a Stop the Bleed course ($0-$40) and maintain a basic IFAK (Individual First Aid Kit) with tourniquet, chest seal, and hemostatic gauze.' },
      { title: 'Legal Education', desc: 'Knowing when you may legally use lethal force is as important as knowing how. The criminal and civil aftermath of a defensive shooting can last years. USCCA training, LETC courses, and your state\'s use-of-force statutes are required reading.' },
      { title: 'Physical Fitness', desc: 'A firearm is a force equalizer — but fitness still matters. Stress impairs fine motor skills. Cardiovascular fitness slows heart rate recovery after exertion. Grip strength affects recoil management. Basic fitness is part of your defensive kit.' },
    ]
  },
  {
    id: 'go-bag',
    title: 'Go-Bag & Vehicle Kit',
    icon: '🎒',
    color: '#C084FC',
    intro: 'A go-bag is not a zombie apocalypse fantasy. It\'s a practical response to the documented reality that Americans occasionally face mandatory evacuations — wildfires, hurricanes, chemical spills.',
    items: [
      { title: 'Firearms Component', desc: 'Your most portable handgun with 3 loaded magazines. A cleaning kit. Your carry permit (physically in the bag). A trigger lock for hotel/shelter stays where firearm storage options are unknown. State-specific carry information for your evacuation corridor.' },
      { title: 'Critical Documents', desc: 'Passport, birth certificates, property documents, insurance policies, medication list, emergency contacts. Digitized copies on encrypted thumb drive. These take 72 hours to replace in normal times — years in disaster conditions.' },
      { title: '72-Hour Supplies', desc: 'Water: 1 gallon per person per day. Calorie-dense food requiring no cooking. Medications (30-day supply in rotation). First aid kit. Cash in small bills. Battery bank. Emergency radio. Warm layer and rain protection.' },
      { title: 'Vehicle Kit', desc: 'Separate from your go-bag: a rifle-capable bag, 2-3 magazines, jumper cables, fix-a-flat, road flares, water, emergency blanket, and a basic tool kit. The car kit stays in the car. The go-bag is ready by the door.' },
      { title: 'Testing Your System', desc: 'Run a drill twice per year: start a timer, grab your go-bag, load your vehicle, and drive to a designated secondary location. Identify what slows you down. Fix it. Most people discover they\'re 40 minutes slower than they thought.' },
    ]
  },
]

const GEAR_LIST = [
  { cat:'Defensive Firearms', items:['Handgun (9mm recommended)', 'Home defense shotgun or rifle', 'Weapon-mounted light', 'Quality holster (IWB/OWB)', 'Backup iron sights'] },
  { cat:'Optics', items:['Red dot or LPVO for rifle', 'Extra batteries (CR123, AAA)', 'Optic covers/flip caps', 'Iron sight backup'] },
  { cat:'Medical', items:['CAT or SOFTT-W tourniquet', 'Israeli bandage', 'Hemostatic gauze (QuikClot)', 'Chest seal (vented)', 'Nitrile gloves + shears'] },
  { cat:'Storage & Maintenance', items:['Ammo cans with O-ring seals', 'Desiccant packets', 'Gun safe or lockbox', 'Bore snake + CLP', 'Spare recoil springs'] },
  { cat:'Communication', items:['Handheld ham radio (Baofeng)', 'Ham Technician license', 'Emergency contact list (paper)', 'Offline maps downloaded', 'Battery-powered AM/FM/NOAA'] },
]

const COURSES = [
  { name:'Stop the Bleed', org:'American College of Surgeons', cost:'Free – $40', desc:'Lifesaving bleeding control. 90 minutes. Every firearms owner needs this.' },
  { name:'NRA First Steps', org:'NRA', cost:'$60–$100', desc:'Fundamentals for new shooters. Safe handling, storage, basic marksmanship.' },
  { name:'Massad Ayoob Group — MAG-20', org:'MAG', cost:'$450', desc:'Legal use of lethal force. The gold standard for understanding legal aftermath.' },
  { name:'USCCA Fundamentals of Concealed Carry', org:'USCCA', cost:'$149', desc:'Comprehensive EDC training with legal and insurance context.' },
  { name:'Combat Focus Shooting', org:'I.C.E. Training', cost:'$350–$500', desc:'Stress-tested defensive shooting methodology. Science-based training.' },
]

export default function PrepPage() {
  return (
    <>
      <Masthead />

      {/* Hero */}
      <div style={{ background:'linear-gradient(180deg, #111318, #0A0B0C)', borderBottom:'1px solid #1F2428', padding:'60px 0 40px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center, #C8922A08, transparent 70%)', pointerEvents:'none' }} />
        <div className="container" style={{ position:'relative', zIndex:1, maxWidth:900 }}>
          <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A', letterSpacing:'0.2em', marginBottom:'16px' }}>FIREARMS PREPAREDNESS</div>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'clamp(3rem,8vw,5.5rem)', color:'#F5F5F3', letterSpacing:'0.03em', lineHeight:0.95, marginBottom:'20px' }}>
            BE READY.<br /><span style={{ color:'#C8922A' }}>BE TRAINED.</span><br />BE SAFE.
          </h1>
          <p style={{ fontSize:'17px', color:'#94A3B8', lineHeight:1.8, maxWidth:640, marginBottom:'28px' }}>
            This isn't about paranoia. It's about responsibility. Owning a firearm without a plan is worse than not owning one. This guide covers home defense planning, emergency storage, grid-down protocols, and the training that ties it all together.
          </p>
          <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
            <Link href="/training" style={{ background:'#C8922A', color:'#000', padding:'12px 24px', fontFamily:'monospace', fontWeight:700, fontSize:'13px', textDecoration:'none' }}>
              TRAINING DRILLS →
            </Link>
            <Link href="/safe-storage" style={{ background:'transparent', color:'#C8922A', border:'1px solid #C8922A', padding:'12px 24px', fontFamily:'monospace', fontWeight:700, fontSize:'13px', textDecoration:'none' }}>
              SAFE STORAGE GUIDE →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ background:'#111318', borderBottom:'1px solid #1F2428', padding:'14px 0' }}>
        <div className="container">
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {SECTIONS.map(s => (
              <a key={s.id} href={`#${s.id}`}
                style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', padding:'4px 12px', border:'1px solid #1F2428', textDecoration:'none', display:'flex', alignItems:'center', gap:'5px' }}>
                <span>{s.icon}</span> {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'48px 0', background:'#0A0B0C' }}>
        <div className="container" style={{ maxWidth:960 }}>

          {/* Main sections */}
          {SECTIONS.map((section, si) => (
            <div key={section.id} id={section.id} style={{ marginBottom:'56px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                <span style={{ fontSize:'28px' }}>{section.icon}</span>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2.2rem', color:section.color, letterSpacing:'0.05em', lineHeight:1 }}>
                  {section.title}
                </h2>
              </div>
              <p style={{ fontSize:'15px', color:'#94A3B8', lineHeight:1.8, marginBottom:'24px', borderLeft:`3px solid ${section.color}`, paddingLeft:'16px' }}>
                {section.intro}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'12px' }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{ background:'#111318', border:'1px solid #1F2428', borderTop:`2px solid ${section.color}40`, padding:'18px 20px' }}>
                    <h3 style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:'#F0EDE6', marginBottom:'8px' }}>{item.title}</h3>
                    <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Gear checklist */}
          <div style={{ marginBottom:'48px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>🛠 PREPAREDNESS GEAR CHECKLIST</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
              {GEAR_LIST.map(cat => (
                <div key={cat.cat} style={{ background:'#111318', border:'1px solid #1F2428', padding:'16px 18px' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A', fontWeight:700, letterSpacing:'0.08em', marginBottom:'12px' }}>{cat.cat.toUpperCase()}</div>
                  {cat.items.map((item, i) => (
                    <div key={i} style={{ display:'flex', gap:'8px', padding:'5px 0', borderBottom:'1px solid #1F2428' }}>
                      <span style={{ color:'#374151', flexShrink:0 }}>☐</span>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B7280' }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Recommended courses */}
          <div style={{ marginBottom:'40px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>📚 RECOMMENDED COURSES</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {COURSES.map(c => (
                <div key={c.name} style={{ background:'#111318', border:'1px solid #1F2428', padding:'16px 20px', display:'grid', gridTemplateColumns:'200px 1fr 120px', gap:'16px', alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#F0EDE6', marginBottom:'2px' }}>{c.name}</div>
                    <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563' }}>{c.org}</div>
                  </div>
                  <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B7280', lineHeight:1.5 }}>{c.desc}</p>
                  <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#C8922A', textAlign:'right' }}>{c.cost}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:'20px 24px', background:'#111318', border:'1px solid #1F2428', fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.8 }}>
            ⚠ Preparedness involves legal responsibilities. Always comply with local, state, and federal laws regarding firearm storage, transport, and use. This guide is for educational purposes. Consult an attorney regarding laws in your jurisdiction.
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
