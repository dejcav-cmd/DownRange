import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Hunting Hub — DownRange',
  description: 'Season dates, cartridge guide, rifle recommendations, field dressing, scouting, and hunting license resources for all 50 states.',
}

const RIFLES = [
  { name:'Tikka T3x Lite', calibers:'6.5 CM / .308 / .300 Win Mag', use:'Best overall value. Sub-MOA guarantee. Lightest in class. Used by guides worldwide.', price:'$699–$849', rating:'9.4', pros:['Sub-MOA factory guarantee','Lightest bolt-action in class','Exceptional trigger'] },
  { name:'Remington 700', calibers:'Available in every hunting cartridge', use:'The 60-year benchmark. US Marine Corps sniper platform. Enormous aftermarket.', price:'$699–$899', rating:'9.2', pros:['60-year proven record','Most customizable bolt-action','Iconic design'] },
  { name:'Winchester Model 70', calibers:'.30-06 / .308 / .300 WM / .375 H&H', use:'The Rifleman\'s Rifle. Controlled round feed for dangerous game. Classic craft.', price:'$899–$1,100', rating:'9.0', pros:['Controlled round feed','Classic aesthetics','Superb trigger'] },
  { name:'Savage 110 Apex Hunter XP', calibers:'Multiple calibers', use:'Best value complete package. AccuTrigger AND Vortex Crossfire scope included.', price:'$549–$699', rating:'8.9', pros:['Scope included','Factory AccuTrigger','Threaded barrel'] },
  { name:'Browning X-Bolt Max', calibers:'Multiple calibers', use:'Adjustable comb, integrated muzzle brake, detachable mag. Long-range ready.', price:'$1,099–$1,399', rating:'9.1', pros:['Adjustable stock','Integrated brake','Detachable magazine'] },
]

const CARTRIDGES = [
  { name:'.308 WIN',       use:'Whitetail, black bear, elk (close)',  range:'500 yds', energy:'2,600 ft-lbs', recoil:'Moderate',       note:'The all-around standard. Affordable, effective on most NA game.', popular:true },
  { name:'.30-06 Springfield', use:'Everything in North America',    range:'600 yds', energy:'2,900 ft-lbs', recoil:'Moderate',       note:'100+ years proven. Handles anything from deer to moose.', popular:true },
  { name:'6.5 Creedmoor',  use:'Deer, antelope, moderate elk',       range:'800 yds', energy:'2,500 ft-lbs', recoil:'Light-Moderate', note:'Best BC-to-recoil ratio. Ideal for long-range hunting.', popular:true },
  { name:'.300 Win Mag',   use:'Elk, moose, bear, long range',        range:'800 yds', energy:'3,500 ft-lbs', recoil:'Heavy',         note:'Go-to elk cartridge. Hits hard at any distance.', popular:true },
  { name:'7mm Rem Mag',    use:'Everything deer to elk',              range:'700 yds', energy:'3,000 ft-lbs', recoil:'Moderate-Heavy',note:'Flat-shooting, high BC bullets. Popular for mountain hunts.', popular:false },
  { name:'.243 Winchester',use:'Varmints, whitetail deer',            range:'500 yds', energy:'1,800 ft-lbs', recoil:'Light',         note:'Perfect youth or recoil-sensitive cartridge. Low cost.', popular:false },
  { name:'.350 Legend',    use:'Deer in straight-wall states',        range:'200 yds', energy:'1,800 ft-lbs', recoil:'Light',         note:'SAAMI straight-wall for MI, OH, IA, IN zones.', popular:false },
]

const SKILLS = [
  { title:'Scouting Whitetail',  icon:'🦌', desc:'Find south-facing slopes for morning sun. Look for rubs on 2–4" saplings and scrapes near travel corridors. Hunt the wind — deer scent you from 300 yards.' },
  { title:'Elk Calling',         icon:'🦌', desc:'Bull elk vocalize aggressively during the September rut. Cow calls (estrus mews) draw bulls from half a mile. Location bugling from ridgelines at dawn finds vocal bulls.' },
  { title:'Turkey Hunting',      icon:'🦃', desc:'Scout the roost tree the night before. Set up 100–150 yards away pre-dawn. Use soft tree yelps at legal light. Gobblers come to sound — patience, no overcalling.' },
  { title:'Field Dressing',      icon:'🔪', desc:'Body temp must drop below 40°F within 2 hours. Use a clean knife, avoid puncturing intestines. Remove all organs including esophagus. Pack cavity with ice in warm weather.' },
  { title:'Shot Placement',      icon:'🎯', desc:'Broadside: aim the crease directly behind the front leg, one-third up the body. Targets both lungs and often the heart. Avoid neck and head shots — high wound rate.' },
  { title:'Meat Care in Field',  icon:'🥩', desc:'Quarter immediately in warm weather. Use breathable game bags — plastic traps heat and bacteria. Hang quarters in shade with airflow. When in doubt, cool it out.' },
]

const SEASONS = [
  { abbr:'TX', whitetail:'Oct 5 – Jan 19',    elk:'N/A',              turkey:'Mar 29 – May 11', dove:'Sep 1 – Nov 12',  notes:'Year-round hog hunting' },
  { abbr:'CO', whitetail:'Oct 18 – Nov 3',    elk:'Rifle Oct 18–Nov 3', turkey:'Apr 12 – May 25', dove:'Sep 1 – Nov 14',  notes:'Draw system for premium units' },
  { abbr:'WA', whitetail:'Oct 12 – Nov 24',   elk:'Unit dependent',   turkey:'Apr 15 – May 31', dove:'Sep 1 – Oct 31',  notes:'Three-point restriction many units' },
  { abbr:'WY', whitetail:'Oct 1 – Nov 30',    elk:'Sep 15 – Oct 31',  turkey:'Apr 15 – May 31', dove:'Sep 1 – Nov 5',   notes:'Excellent public land access' },
  { abbr:'MT', whitetail:'Oct 26 – Nov 24',   elk:'Oct 26 – Nov 24',  turkey:'May only',        dove:'Sep 1 – Nov 9',   notes:'Best elk hunting in lower 48' },
  { abbr:'ID', whitetail:'Oct 10 – Nov 20',   elk:'Aug 30 – Nov 20',  turkey:'Apr 15 – May 31', dove:'Sep 1 – Nov 10',  notes:'General elk tag OTC most zones' },
]

export default function HuntingPage() {
  return (
    <>
      <Masthead />

      {/* ── Hero ── */}
      <div className="page-hero" data-title="HUNTING">
        <div className="container">
          <div className="dr-breadcrumb" style={{ marginBottom:'14px' }}>
            <span className="dr-breadcrumb-cur">Outdoors</span>
            <span className="dr-breadcrumb-sep">›</span>
            <span className="dr-breadcrumb-cur">Hunting Hub</span>
          </div>
          <h1 className="page-hero-title">Hunters Hub</h1>
          <p className="page-hero-sub">Season dates · Rifle selection · Cartridge guide · Field skills · Licensing</p>
          <div style={{ display:'flex', gap:'8px', marginTop:'16px', flexWrap:'wrap' }}>
            {[['Precision Shooting','/precision'],['Training & Drills','/training'],['Preparedness','/preparedness'],['Safe Storage','/safe-storage']].map(([l,h])=>(
              <Link key={h} href={h} className="dr-btn-outline" style={{ padding:'5px 14px', fontSize:'11px' }}>{l} →</Link>
            ))}
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          {/* ── Rifles ── */}
          <div className="dr-section">
            <h2 className="dr-section-title">Top Hunting Rifles</h2>
            <p className="dr-section-sub">Field-tested platforms recommended by guides and competitive hunters</p>
            <div className="dr-grid-3" style={{ gap:'12px' }}>
              {RIFLES.map(r => (
                <div key={r.name} className="dr-card dr-card-accent">
                  <div className="dr-card-meta">{r.calibers}</div>
                  <div className="dr-card-title">{r.name}</div>
                  <p className="dr-card-body" style={{ marginBottom:'10px' }}>{r.use}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'10px' }}>
                    {r.pros.map(p => <span key={p} className="dr-pill dr-pill-green">✓ {p}</span>)}
                  </div>
                  <div className="dr-card-price">{r.price}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cartridge guide ── */}
          <div className="dr-section">
            <h2 className="dr-section-title">Hunting Cartridge Selector</h2>
            <p className="dr-section-sub">Match your cartridge to your quarry, terrain, and maximum ethical range</p>
            <div className="dr-table">
              <div className="dr-table-head" style={{ gridTemplateColumns:'130px 170px 80px 110px 110px 1fr' }}>
                {['Cartridge','Best For','Max Range','Energy','Recoil','Notes'].map(h=><span key={h}>{h}</span>)}
              </div>
              {CARTRIDGES.map(c => (
                <div key={c.name} className="dr-table-row" style={{ gridTemplateColumns:'130px 170px 80px 110px 110px 1fr', background: c.popular ? 'var(--bg2)' : 'var(--bg)' }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:700, color:'var(--text)' }}>{c.name}</span>
                  <span className="t-label-md">{c.use}</span>
                  <span className="t-label-md text-gold">{c.range}</span>
                  <span className="t-label-md">{c.energy}</span>
                  <span className="t-label-md">{c.recoil}</span>
                  <span className="t-label-sm">{c.note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Skills ── */}
          <div className="dr-section">
            <h2 className="dr-section-title">Essential Hunting Skills</h2>
            <p className="dr-section-sub">Practical knowledge from experienced hunters and professional guides</p>
            <div className="dr-grid-3">
              {SKILLS.map(s => (
                <div key={s.title} className="dr-infoblock">
                  <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'8px' }}>
                    <span style={{ fontSize:'18px' }}>{s.icon}</span>
                    <div className="dr-infoblock-title" style={{ margin:0 }}>{s.title}</div>
                  </div>
                  <div className="dr-infoblock-body">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Season dates ── */}
          <div className="dr-section">
            <h2 className="dr-section-title">2024–2025 Season Dates</h2>
            <p className="dr-section-sub">Selected states — always verify with your state wildlife agency</p>
            <div className="dr-table" style={{ marginBottom:'12px' }}>
              <div className="dr-table-head" style={{ gridTemplateColumns:'58px 1fr 1fr 1fr 1fr 1fr' }}>
                {['State','Whitetail','Elk','Turkey','Dove','Notes'].map(h=><span key={h}>{h}</span>)}
              </div>
              {SEASONS.map(s => (
                <div key={s.abbr} className="dr-table-row" style={{ gridTemplateColumns:'58px 1fr 1fr 1fr 1fr 1fr' }}>
                  <Link href={`/state-hub/${s.abbr.toLowerCase()}`} className="t-display-sm text-gold" style={{ textDecoration:'none' }}>{s.abbr}</Link>
                  <span className="t-label-md">{s.whitetail}</span>
                  <span className="t-label-md">{s.elk}</span>
                  <span className="t-label-md">{s.turkey}</span>
                  <span className="t-label-md">{s.dove}</span>
                  <span className="t-label-xs">{s.notes}</span>
                </div>
              ))}
            </div>
            <p className="t-label-xs" style={{ opacity:0.6 }}>⚠ Verify exact dates with your state wildlife agency before hunting. Regulations change annually.</p>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
