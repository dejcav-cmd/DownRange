import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Hunting — DownRange', description: 'Hunting season dates, ballistics, rifle recommendations, and state hunting regulations.' }

const HUNTING_RIFLES = [
  { name:'Remington 700', calibers:'Multiple', use:'The original precision hunting rifle. Available in every hunting cartridge. Nearly unlimited customization.', price:'$699–$899', rating:9.2 },
  { name:'Winchester Model 70', calibers:'.30-06, .308, .300 Win Mag', use:'The "Rifleman\'s Rifle." Controlled round feed, classic push-feed option. Elk and bear standard.', price:'$899–$1,100', rating:9.0 },
  { name:'Tikka T3x', calibers:'Multiple', use:'Finnish precision at an honest price. Sub-MOA guarantee. Favorite of hunting guides.', price:'$699–$849', rating:9.4 },
  { name:'Browning X-Bolt', calibers:'Multiple', use:'Excellent trigger out of the box. Rotary magazine. Long-range hunting capability.', price:'$899–$1,299', rating:9.1 },
  { name:'Savage 110', calibers:'Multiple', use:'Exceptional value precision. AccuTrigger from the factory. Consistent sub-MOA performance.', price:'$449–$699', rating:8.9 },
]

const CARTRIDGE_GUIDE = [
  { name:'.308 WIN', use:'White-tail, black bear, elk (close)', range:'500 yds', energy:'2,600 ft-lbs', recoil:'Moderate', popular:true },
  { name:'.30-06 Springfield', use:'Everything in North America', range:'600 yds', energy:'2,900 ft-lbs', recoil:'Moderate', popular:true },
  { name:'.300 Winchester Magnum', use:'Elk, moose, bear, long range', range:'800 yds', energy:'3,500 ft-lbs', recoil:'Heavy', popular:true },
  { name:'6.5 Creedmoor', use:'Deer, antelope, moderate elk', range:'800 yds', energy:'2,500 ft-lbs', recoil:'Light', popular:true },
  { name:'.338 Lapua', use:'Dangerous game, extreme range', range:'1,200+ yds', energy:'4,800 ft-lbs', recoil:'Very heavy', popular:false },
  { name:'7mm Remington Mag', use:'Everything deer to elk', range:'700 yds', energy:'3,000 ft-lbs', recoil:'Moderate-heavy', popular:false },
]

const SEASON_DATES = [
  { state:'TX', whitetail:'Oct 5 – Jan 19 (archery earlier)', elk:'N/A', turkeypring:'Mar 29 – May 11', notes:'Year-round hog hunting' },
  { state:'CO', whitetail:'Rifle: Oct 18 – Nov 3', elk:'Rifle: Oct 18 – Nov 3', turkeypring:'Apr 12 – May 25', notes:'Draw system for most units' },
  { state:'WA', whitetail:'Oct 12 – Nov 24', elk:'Oct 26 – Nov 3 (general)', turkeypring:'Apr 15 – May 31', notes:'State-specific unit regulations' },
  { state:'WY', whitetail:'Oct 1 – Nov 30', elk:'General: Sep 15 – Oct 31', turkeypring:'Apr 15 – May 31', notes:'Excellent public land access' },
  { state:'MT', whitetail:'Oct 26 – Nov 24', elk:'Oct 26 – Nov 24', turkeypring:'Apr 15 – May 31', notes:'Best elk hunting in lower 48' },
]

export default function HuntingPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="HUNTING">
        <div className="container">
          <h1 className="page-hero-title">Hunters Hub</h1>
          <p className="page-hero-sub">Season dates · Ballistics guide · Rifle recommendations · State regulations</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <div style={{ display:'flex', gap:'8px', marginBottom:'32px' }}>
            {[['Hunting','/hunting'],['Precision Shooting','/precision']].map(([l,h])=>(
              <Link key={h} href={h} style={{ fontFamily:'monospace', fontSize:'12px', padding:'8px 18px', border:'1px solid #1F2428', color: h==='/hunting'?'#C8922A':'#4B5563', background: h==='/hunting'?'#C8922A20':'transparent', textDecoration:'none' }}>{l}</Link>
            ))}
          </div>

          {/* Rifle recommendations */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>TOP HUNTING RIFLES</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'40px' }}>
            {HUNTING_RIFLES.map(r=>(
              <div key={r.name} style={{ background:'#111318', border:'1px solid #1F2428', padding:'18px 20px', borderTop:`3px solid #C8922A` }}>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.3rem', color:'#F0EDE6', marginBottom:'4px' }}>{r.name}</div>
                <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#C8922A', marginBottom:'8px' }}>{r.calibers}</div>
                <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.6, marginBottom:'10px' }}>{r.use}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.1rem', color:'#C8922A' }}>{r.price}</span>
                  <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#34D399' }}>{r.rating}/10</span>
                </div>
              </div>
            ))}
          </div>

          {/* Cartridge guide */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>HUNTING CARTRIDGE GUIDE</h2>
          <div style={{ marginBottom:'40px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'130px 200px 80px 100px 100px 60px', gap:10, padding:'8px 14px', fontFamily:'monospace', fontSize:'9px', color:'#4B5563', borderBottom:'1px solid #1F2428', letterSpacing:'0.1em' }}>
              <span>CARTRIDGE</span><span>BEST FOR</span><span>MAX RANGE</span><span>ENERGY</span><span>RECOIL</span><span></span>
            </div>
            {CARTRIDGE_GUIDE.map(c=>(
              <div key={c.name} style={{ display:'grid', gridTemplateColumns:'130px 200px 80px 100px 100px 60px', gap:10, padding:'10px 14px', borderBottom:'1px solid #1F2428', background: c.popular?'#111318':'transparent', alignItems:'center' }}>
                <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#F0EDE6', fontWeight:700 }}>{c.name}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B7280' }}>{c.use}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A' }}>{c.range}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#94A3B8' }}>{c.energy}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#94A3B8' }}>{c.recoil}</span>
                {c.popular && <span style={{ fontFamily:'monospace', fontSize:'8px', color:'#34D399', background:'#001A0A', padding:'2px 6px' }}>POPULAR</span>}
              </div>
            ))}
          </div>

          {/* Season dates */}
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>2024–2025 SEASON DATES (Selected States)</h2>
          <div style={{ marginBottom:'16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'50px 180px 180px 150px 1fr', gap:10, padding:'8px 14px', fontFamily:'monospace', fontSize:'9px', color:'#4B5563', borderBottom:'1px solid #1F2428', letterSpacing:'0.1em' }}>
              <span>STATE</span><span>WHITETAIL</span><span>ELK</span><span>SPRING TURKEY</span><span>NOTES</span>
            </div>
            {SEASON_DATES.map(s=>(
              <div key={s.state} style={{ display:'grid', gridTemplateColumns:'50px 180px 180px 150px 1fr', gap:10, padding:'10px 14px', borderBottom:'1px solid #1F2428', background:'#111318', alignItems:'center' }}>
                <Link href={`/state-hub/${s.state.toLowerCase()}`} style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.1rem', color:'#C8922A', textDecoration:'none' }}>{s.state}</Link>
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#94A3B8' }}>{s.whitetail}</span>
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#94A3B8' }}>{s.elk}</span>
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#94A3B8' }}>{s.turkeypring}</span>
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563' }}>{s.notes}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily:'monospace', fontSize:'10px', color:'#374151' }}>⚠ Always verify exact dates with your state wildlife agency. Dates change annually.</p>
        </div>
      </div>
      <Footer />
    </>
  )
}
