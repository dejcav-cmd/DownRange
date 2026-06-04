import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import { fetchAmmoByType , fetchBreakingAlerts } from '../../../sanity/lib/client'

const CALIBER_DATA = {
  '9mm': { name:'9mm Luger (9x19mm)', also:'9mm, 9x19', bullet:'115gr–147gr', velocity:'1100–1400 fps', use:'Handgun — EDC, duty, competition', history:'Developed 1901 by Georg Luger. Most popular pistol cartridge worldwide. NATO standard since 1980s.', bestFor:['Concealed carry','Home defense','Competition shooting','Law enforcement'], brands:['Federal HST','Speer Gold Dot','Hornady Critical Defense','Winchester Ranger'], pricePer:0.22, availability:'Very High', image:'/img/photos/rifle.jpg' },
  '556': { name:'5.56x45mm NATO', also:'5.56 NATO, .223 Rem (similar)', bullet:'55gr–77gr', velocity:'2700–3200 fps', use:'Rifle — AR-15, military carbine', history:'Developed from .222 Remington in early 1960s. US military standard since Vietnam. Most popular rifle cartridge in America.', bestFor:['AR-15 platform','Home defense','Varmint hunting','Competition'], brands:['Federal American Eagle','PMC Bronze','Hornady TAP','M855 Green Tip'], pricePer:0.42, availability:'High', image:'/img/photos/rifle.jpg' },
  '308': { name:'.308 Winchester (7.62x51mm NATO)', also:'.308 Win, 7.62 NATO', bullet:'147gr–175gr', velocity:'2500–2900 fps', use:'Rifle — bolt action, semi-auto, sniper', history:'Commercialized 1952. NATO standard battle rifle cartridge. Preferred by precision shooters and hunters.', bestFor:['Precision rifle','Big game hunting','Designated marksman rifle','1000-yard shooting'], brands:['Federal Gold Medal Match','Hornady A-MAX','Lapua Scenar','Black Hills'], pricePer:0.95, availability:'High', image:'/img/photos/rifle.jpg' },
  '45-acp': { name:'.45 ACP (Automatic Colt Pistol)', also:'.45 Auto', bullet:'185gr–230gr', velocity:'830–1000 fps', use:'Handgun — 1911, Glock 21, HK USP', history:'Designed by John Browning in 1904 for the Colt M1905. US military standard 1911–1985. Famous for stopping power.', bestFor:['1911 platform','Home defense','IDPA competition','Suppressed shooting'], brands:['Federal HST 230gr','Speer Gold Dot','Hornady Critical Defense','Winchester PDX1'], pricePer:0.42, availability:'High', image:'/img/photos/rifle.jpg' },
  '22lr': { name:'.22 Long Rifle', also:'.22 LR, .22', bullet:'36gr–40gr', velocity:'900–1300 fps', use:'Rimfire — training, small game, suppressed', history:'Introduced 1887. Most produced cartridge in history. Essential training round. Affordable and virtually no recoil.', bestFor:['Training and practice','Small game hunting','Suppressed shooting','Youth introduction'], brands:['CCI Standard','Federal Champion','Eley Match','CCI Minimag'], pricePer:0.07, availability:'Medium', image:'/img/photos/rifle.jpg' },
}

export async function generateStaticParams() {
  return Object.keys(CALIBER_DATA).map(c=>({ caliber: c }))
}

export async function generateMetadata({ params }) {
  const d = CALIBER_DATA[params.caliber]
  if (!d) return { title: 'Ammo Guide — DownRange' }
  return { title:`${d.name} Guide — DownRange Ammo`, description:`Complete ${d.name} guide: ballistics, best loads, price history, and availability.` }
}

export default async function CaliberPage({ params }) {
  const d = CALIBER_DATA[params.caliber]
  if (!d) return <div style={{ padding:'100px', textAlign:'center', color:'#6B7280', fontFamily:"'IBM Plex Mono',monospace" }}>Caliber not found. Try /ammo/9mm or /ammo/556</div>

  const sanityAmmo = await fetchAmmoByType(params.caliber).catch(()=>[])

  const alerts = await fetchBreakingAlerts(5).catch(() => [])

  return (
    <>

      <Masthead />
      <div style={{ width:'100%', height:'280px', overflow:'hidden', position:'relative' }}>
        <img src={d.image} alt={d.name} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.4 }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, #0A0B0C, transparent 50%)' }} />
        <div className="container" style={{ position:'absolute', bottom:'24px', left:'50%', transform:'translateX(-50%)', width:'100%' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'4px' }}>AMMO GUIDE</div>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'clamp(2rem,6vw,4rem)', color:'#F5F5F3', letterSpacing:'0.03em', lineHeight:1 }}>{d.name}</h1>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'40px' }}>
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'32px' }}>
                {[['Bullet Weight',d.bullet],['Muzzle Velocity',d.velocity],['Avg Price/rd',`$${d.pricePer.toFixed(2)}`]].map(([k,v])=>(
                  <div key={k} style={{ background:'#111318', border:'1px solid var(--border)', padding:'16px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.5rem', color:'#C8922A' }}>{v}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginTop:'4px' }}>{k.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'12px' }}>HISTORY & OVERVIEW</h2>
              <p style={{ fontSize:'14px', color:'#94A3B8', lineHeight:1.8, marginBottom:'24px' }}>{d.history}</p>

              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'12px' }}>BEST FOR</h2>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px' }}>
                {d.bestFor.map(u=>(
                  <span key={u} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#34D399', background:'#001A0A', border:'1px solid #16603440', padding:'6px 14px' }}>{u}</span>
                ))}
              </div>

              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'12px' }}>RECOMMENDED LOADS</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {d.brands.map((b,i)=>(
                  <div key={b} style={{ background:'#111318', border:'1px solid var(--border)', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#F0EDE6' }}>{b}</span>
                    {i===0 && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34D399', background:'#001A0A', padding:'2px 8px' }}>EDITOR'S PICK</span>}
                  </div>
                ))}
              </div>
            </div>

            <aside>
              <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', marginBottom:'16px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'16px', fontWeight:700 }}>QUICK SPECS</div>
                {[['Also Known As',d.also],['Primary Use',d.use],['Availability',d.availability]].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', flexDirection:'column', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>{k}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#F0EDE6', marginTop:'3px' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'12px', fontWeight:700 }}>OTHER CALIBERS</div>
                {Object.entries(CALIBER_DATA).filter(([k])=>k!==params.caliber).map(([k,c])=>(
                  <a key={k} href={`/ammo/${k}`} style={{ display:'block', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280', padding:'8px 0', borderBottom:'1px solid var(--border)', textDecoration:'none' }}>
                    {c.name} →
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
