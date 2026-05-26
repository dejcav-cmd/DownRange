import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Hunting Hub — DownRange', description: 'Season dates, cartridge guide, rifle recommendations, field dressing, scouting, and hunting license resources for all 50 states.' }

const HUNTING_RIFLES = [
  { name:'Tikka T3x Lite', calibers:'6.5 Creedmoor / .308 / .300 Win Mag', use:'Best overall value hunting rifle. Sub-MOA guarantee. Lightest in its class. Used by professional guides worldwide.', price:'$699–$849', rating:9.4, pros:['Sub-MOA factory guarantee','Lightest bolt-action in class','Exceptional trigger','Finnish quality control'] },
  { name:'Remington 700', calibers:'Available in virtually every hunting cartridge', use:'The benchmark bolt-action rifle for 60+ years. US Marine Corps sniper rifle platform. Enormous aftermarket and custom options.', price:'$699–$899', rating:9.2, pros:['60-year proven track record','Most customizable bolt-action','Iconic design','Wide cartridge selection'] },
  { name:'Winchester Model 70', calibers:'.30-06 / .308 / .300 Win Mag / .375 H&H', use:'The "Rifleman\'s Rifle." Controlled round feed (CRF) is the most reliable design for dangerous game. Classic American craftsmanship.', price:'$899–$1,100', rating:9.0, pros:['Controlled round feed','Classic aesthetics','Superb trigger','Excellent accuracy'] },
  { name:'Savage 110 Apex Hunter XP', calibers:'Multiple calibers', use:'Best value complete package. Comes with AccuTrigger AND a Vortex Crossfire scope — everything you need to hunt out of the box.', price:'$549–$699', rating:8.9, pros:['Factory AccuTrigger','Scope included','Threaded barrel','Budget champion'] },
  { name:'Browning X-Bolt Max', calibers:'Multiple calibers', use:'Excellent trigger, adjustable comb stock, muzzle brake standard. Long-range capable hunting rifle with comfortable recoil management.', price:'$1,099–$1,399', rating:9.1, pros:['Adjustable stock','Integrated muzzle brake','Detachable magazine','Match trigger crisp'] },
]

const CARTRIDGE_GUIDE = [
  { name:'.308 WIN', use:'Whitetail, black bear, elk (close)', range:'500 yds', energy:'2,600 ft-lbs', recoil:'Moderate', popular:true, note:'The all-around standard. Affordable, widely available, effective on most North American game.' },
  { name:'.30-06 Springfield', use:'Everything in North America', range:'600 yds', energy:'2,900 ft-lbs', recoil:'Moderate', popular:true, note:'100+ years proven. Handles anything from deer to moose. The Swiss Army knife of hunting cartridges.' },
  { name:'6.5 Creedmoor', use:'Deer, antelope, moderate elk', range:'800 yds', energy:'2,500 ft-lbs', recoil:'Light-Moderate', popular:true, note:'Best ballistic coefficient to recoil ratio. Excellent for long-range hunting with reduced flinching.' },
  { name:'.300 Winchester Magnum', use:'Elk, moose, bear, long range', range:'800 yds', energy:'3,500 ft-lbs', recoil:'Heavy', popular:true, note:'The go-to elk cartridge. Hits hard at distance. Worth the recoil for big game at any range.' },
  { name:'7mm Remington Mag', use:'Everything deer to elk', range:'700 yds', energy:'3,000 ft-lbs', recoil:'Moderate-Heavy', popular:false, note:'Flat-shooting, high BC bullets. Popular in mountain hunting where shots can exceed 400 yards.' },
  { name:'.243 Winchester', use:'Varmints, whitetail deer', range:'500 yds', energy:'1,800 ft-lbs', recoil:'Light', popular:false, note:'Perfect youth or recoil-sensitive hunter cartridge. Exceptional varmint round. Light enough for long range sessions.' },
  { name:'.338 Lapua', use:'Dangerous game, extreme long range', range:'1,200+ yds', energy:'4,800 ft-lbs', recoil:'Very Heavy', popular:false, note:'Overkill for most applications. If you hunt dangerous game in Africa or shoot beyond 1,000 yards regularly.' },
  { name:'.350 Legend', use:'Deer in straight-wall states', range:'200 yds', energy:'1,800 ft-lbs', recoil:'Light', popular:false, note:'SAAMI-compliant straight-wall for Michigan, Ohio, Iowa, Indiana restricted zones. Semi-auto compatible.' },
]

const SEASONS = [
  { state:'TX', abbr:'TX', whitetail:'Oct 5 – Jan 19 (South TX different)', elk:'N/A', turkey:'Mar 29 – May 11', dove:'Sep 1 – Nov 12 & Dec 26 – Jan 23', notes:'Year-round hog hunting. Landowner permission key.' },
  { state:'CO', abbr:'CO', whitetail:'Rifle: Oct 18 – Nov 3 (4th season later)', elk:'Rifle Oct 18 – Nov 3', turkey:'Apr 12 – May 25', dove:'Sep 1 – Nov 14', notes:'Draw system for premium units. Apply by April.' },
  { state:'WA', abbr:'WA', whitetail:'Oct 12 – Nov 24 (modern firearm)', elk:'Vary by unit — check WDFW', turkey:'Apr 15 – May 31', dove:'Sep 1 – Oct 31', notes:'Three-point antler restriction in many units.' },
  { state:'WY', abbr:'WY', whitetail:'Oct 1 – Nov 30', elk:'General: Sep 15 – Oct 31', turkey:'Apr 15 – May 31', dove:'Sep 1 – Nov 5', notes:'Excellent public land. License application June 1.' },
  { state:'MT', abbr:'MT', whitetail:'Oct 26 – Nov 24', elk:'Oct 26 – Nov 24 (general)', turkey:'May only (spring)', dove:'Sep 1 – Nov 9', notes:'Best elk hunting in lower 48. Apply by June 1.' },
  { state:'ID', abbr:'ID', whitetail:'Oct 10 – Nov 20', elk:'Aug 30 – Nov 20 (archery earlier)', turkey:'Apr 15 – May 31', dove:'Sep 1 – Nov 10', notes:'General elk tag over counter in most zones.' },
]

const SKILLS = [
  { title:'Scouting Whitetail', icon:'🦌', desc:'Find south-facing slopes for morning sun exposure. Look for rubs on 2-4" saplings (buck territory marking) and scrapes (freshly pawed ground) near travel corridors between bedding and feeding areas. Hunt the wind — deer smell you from 300 yards.' },
  { title:'Elk Calling', icon:'🦌', desc:'Bull elk vocalize aggressively during the rut (late September). A cow call (estrus mews) can draw bulls from half a mile. Bugling is high-risk, high-reward — often spooks pressured elk. Location bugles from ridgelines at dawn to find vocal bulls.' },
  { title:'Turkey Hunting Basics', icon:'🦃', desc:'Scout the roost tree the night before by listening for yelping as birds fly up at dusk. Set up 100-150 yards away pre-dawn. Use soft tree yelps as legal shooting light arrives. Gobblers come to the sound — be patient, don\'t overcall.' },
  { title:'Field Dressing', icon:'🔪', desc:'Core body temperature must drop below 40°F within 2 hours to preserve meat quality. Use a clean knife, avoid puncturing the intestines. Remove all organs including esophagus and windpipe. In warm weather, pack the body cavity with ice immediately.' },
  { title:'Shot Placement', icon:'🎯', desc:'For broadside shots: aim for the crease directly behind the front leg, one-third up the body. This targets both lungs and often the heart. Avoid neck shots (high wound-to-recovery ratio) and head shots (extremely small margin of error). Patience for the right angle saves meat and suffering.' },
  { title:'Meat Care in the Field', icon:'🥩', desc:'Quarter immediately in warm weather. Keep meat in breathable game bags — plastic traps heat and bacterial growth. Hang quarters in shade with airflow. A spoiled elk represents significant economic and ethical loss. When in doubt, cool it out.' },
]

export default function HuntingPage() {
  return (
    <>
      <Masthead />

      {/* Hero */}
      <div style={{ background:'#111318', borderBottom:'1px solid #1F2428', padding:'48px 0 32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.05), transparent 60%)', pointerEvents:'none' }} />
        <div className="container">
          <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#34D399', letterSpacing:'0.2em', marginBottom:'12px' }}>OUTDOORS · HUNTING</div>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'clamp(2.5rem,7vw,5rem)', color:'#F5F5F3', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'12px' }}>HUNTERS HUB</h1>
          <p style={{ fontFamily:'monospace', fontSize:'13px', color:'#4B5563', lineHeight:1.7 }}>Season dates · Rifle selection · Cartridge guide · Skills · Field care · Licensing</p>
          <div style={{ display:'flex', gap:'8px', marginTop:'20px', flexWrap:'wrap' }}>
            {[['Precision Shooting','/precision'],['Training & Drills','/training'],['Preparedness','/preparedness'],['Safe Storage','/safe-storage']].map(([l,h])=>(
              <Link key={h} href={h} style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', border:'1px solid #1F2428', padding:'5px 12px', textDecoration:'none' }}>{l} →</Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'40px 0' }}>
        <div className="container">

          {/* Rifles */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>TOP HUNTING RIFLES</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'48px' }}>
            {HUNTING_RIFLES.map(r=>(
              <div key={r.name} style={{ background:'#111318', border:'1px solid #1F2428', padding:'20px', borderTop:'3px solid #C8922A' }}>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#F0EDE6', marginBottom:'4px', lineHeight:1.2 }}>{r.name}</div>
                <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#C8922A', marginBottom:'8px' }}>{r.calibers}</div>
                <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.6, marginBottom:'10px' }}>{r.use}</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'10px' }}>
                  {r.pros.map(p=><span key={p} style={{ fontFamily:'monospace', fontSize:'9px', color:'#34D399', background:'#001A0A', padding:'1px 7px' }}>✓ {p}</span>)}
                </div>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A' }}>{r.price}</div>
              </div>
            ))}
          </div>

          {/* Cartridge guide */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>HUNTING CARTRIDGE SELECTOR</h2>
          <div style={{ marginBottom:'48px', background:'#111318', border:'1px solid #1F2428', overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'140px 180px 80px 100px 100px 1fr', gap:0, padding:'10px 16px', background:'#16191F', fontFamily:'monospace', fontSize:'9px', color:'#4B5563', letterSpacing:'0.1em', borderBottom:'1px solid #1F2428' }}>
              {['CARTRIDGE','BEST FOR','MAX RANGE','ENERGY','RECOIL','NOTES'].map(h=><span key={h}>{h}</span>)}
            </div>
            {CARTRIDGE_GUIDE.map(c=>(
              <div key={c.name} style={{ display:'grid', gridTemplateColumns:'140px 180px 80px 100px 100px 1fr', gap:0, padding:'11px 16px', borderBottom:'1px solid #1F2428', background:c.popular?'#111318':'#0D1117', alignItems:'center' }}>
                <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#F0EDE6', fontWeight:700 }}>{c.name}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B7280' }}>{c.use}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A' }}>{c.range}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#94A3B8' }}>{c.energy}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#94A3B8' }}>{c.recoil}</span>
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', lineHeight:1.5 }}>{c.note}</span>
              </div>
            ))}
          </div>

          {/* Skills */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>ESSENTIAL HUNTING SKILLS</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'48px' }}>
            {SKILLS.map(s=>(
              <div key={s.title} style={{ background:'#111318', border:'1px solid #1F2428', borderLeft:'3px solid #34D399', padding:'16px 18px' }}>
                <div style={{ display:'flex', gap:'8px', marginBottom:'8px', alignItems:'center' }}>
                  <span style={{ fontSize:'18px' }}>{s.icon}</span>
                  <h3 style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:'#F0EDE6' }}>{s.title}</h3>
                </div>
                <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Season dates */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>2024–2025 SEASON DATES</h2>
          <div style={{ background:'#111318', border:'1px solid #1F2428', overflow:'hidden', marginBottom:'24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr 1fr 1fr 1fr', gap:0, padding:'10px 16px', background:'#16191F', fontFamily:'monospace', fontSize:'9px', color:'#4B5563', letterSpacing:'0.1em', borderBottom:'1px solid #1F2428' }}>
              {['ST','WHITETAIL','ELK','TURKEY','DOVE','NOTES'].map(h=><span key={h}>{h}</span>)}
            </div>
            {SEASONS.map(s=>(
              <div key={s.abbr} style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr 1fr 1fr 1fr', gap:0, padding:'10px 16px', borderBottom:'1px solid #1F2428', alignItems:'center' }}>
                <Link href={`/state-hub/${s.abbr.toLowerCase()}`} style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#C8922A', textDecoration:'none' }}>{s.abbr}</Link>
                {[s.whitetail,s.elk,s.turkey,s.dove,s.notes].map((v,i)=>(
                  <span key={i} style={{ fontFamily:'monospace', fontSize:'10px', color:i===4?'#374151':'#6B7280', lineHeight:1.5 }}>{v}</span>
                ))}
              </div>
            ))}
          </div>
          <p style={{ fontFamily:'monospace', fontSize:'10px', color:'#374151' }}>⚠ Verify exact dates with your state wildlife agency before hunting. Regulations change annually.</p>

        </div>
      </div>
      <Footer />
    </>
  )
}
