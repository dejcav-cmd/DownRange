import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
export const metadata = { title: 'Gun Safe & Storage Guide — DownRange', description: 'Complete guide to firearms safe storage. Reviews and recommendations for quick-access, biometric, and full-vault safes.' }

const SAFES = [
  { name:'Fort Knox PB1 Handgun Safe', category:'Quick-Access', price:200, rating:9.2, image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', pros:['Simplex mechanical lock — no batteries','Heavy 10-gauge steel','No electronics to fail','Lifetime warranty'], cons:['Combination only','Holds 1–2 handguns'], verdict:'Best for reliability purists. Mechanical lock means it works every time, no dead batteries.' },
  { name:'Hornady RAPiD Safe', category:'Biometric', price:170, rating:8.8, image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', pros:['RFID tag + fingerprint + keypad','Multiple access methods','Spring-assisted lid','AC + battery backup'], cons:['Fingerprint reader can be slow when wet','Small interior'], verdict:'Best multi-access quick safe. RFID means you just tap a bracelet or card — fastest entry.' },
  { name:'Vaultek VT20i', category:'Biometric', price:229, rating:9.0, image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', pros:['Bluetooth app monitoring','Anti-pry bars','Rechargeable battery','Impact detection alert'], cons:['Bluetooth adds complexity','Higher price'], verdict:'Best tech-forward safe. App alerts you if someone tampers with it. Good for bedside.' },
  { name:'Liberty Safe Fat Boy Jr', category:'Full Vault', price:1399, rating:9.4, image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', pros:['1200°F fire rating (75 min)','30 long gun capacity','Relocker system','12-gauge steel body'], cons:['700+ lbs — need help installing','Price'], verdict:'Best long gun vault. If you have a collection, this is the answer. Fire-rated and burglary-rated.' },
  { name:'GunVault MiniVault Deluxe', category:'Quick-Access', price:99, rating:8.3, image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', pros:['Budget-friendly','No-look keypad','Compact and mountable','Cable included'], cons:['16-gauge steel (thinner)','Keypad-only'], verdict:'Best budget option. Gets the job done at minimum cost. Perfect for first handgun safe.' },
]

const LAWS = [
  { state:'CA', req:'Firearm Safety Device required on all transfers. Must use approved safe or trigger lock.', ccw:'Required' },
  { state:'NY', req:'Handguns must be stored unloaded in locked container when not in use.', ccw:'Required' },
  { state:'MA', req:'All firearms must be stored with locking device. $7,500 fine for unlocked access by minor.', ccw:'Required' },
  { state:'TX', req:'No state storage law, but criminal liability if minor gains access.', ccw:'Encouraged' },
  { state:'FL', req:'Liability if minor under 16 gains access to unsecured firearm. Store safely when children present.', ccw:'Encouraged' },
]

function SafeCard({ safe }) {
  const catColor = { 'Quick-Access':'#60A5FA','Biometric':'#34D399','Full Vault':'#C8922A' }[safe.category] || '#9CA3AF'
  return (
    <div style={{ background:'#111318', border:'1px solid var(--border)', overflow:'hidden' }}>
      <div style={{ height:'180px', overflow:'hidden', position:'relative' }}>
        <img src={safe.image} alt={safe.name} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.6 }} />
        <div style={{ position:'absolute', top:'10px', left:'10px', background:'rgba(0,0,0,0.8)', border:`1px solid ${catColor}`, color:catColor, fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', padding:'3px 8px' }}>{safe.category.toUpperCase()}</div>
        <div style={{ position:'absolute', top:'10px', right:'10px', fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A' }}>{safe.rating}/10</div>
      </div>
      <div style={{ padding:'20px' }}>
        <h3 style={{ fontSize:'15px', fontWeight:700, color:'#F0EDE6', marginBottom:'4px' }}>{safe.name}</h3>
        <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', marginBottom:'12px' }}>${safe.price}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
          <div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34D399', marginBottom:'4px' }}>PROS</div>
            {safe.pros.slice(0,2).map((p,i)=><div key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#86EFAC', marginBottom:'2px' }}>✓ {p}</div>)}
          </div>
          <div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#EF4444', marginBottom:'4px' }}>CONS</div>
            {safe.cons.map((c,i)=><div key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#FCA5A5', marginBottom:'2px' }}>✗ {c}</div>)}
          </div>
        </div>
        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.6 }}>{safe.verdict}</p>
      </div>
    </div>
  )
}

export default function SafeStoragePage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="STORAGE">
        <div className="container">
          <h1 className="page-hero-title">Safe Storage Guide</h1>
          <p className="page-hero-sub">Secure your firearms. Reviews and recommendations for every budget and use case.</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>TOP-RATED SAFES BY CATEGORY</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'48px' }}>
            {SAFES.map(s=><SafeCard key={s.name} safe={s} />)}
          </div>
          <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>STATE STORAGE LAWS</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'32px' }}>
            {LAWS.map(l=>(
              <div key={l.state} style={{ background:'#111318', border:'1px solid var(--border)', padding:'14px 20px', display:'grid', gridTemplateColumns:'60px 1fr auto', gap:'16px', alignItems:'center' }}>
                <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A' }}>{l.state}</span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280', lineHeight:1.6 }}>{l.req}</span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color: l.ccw==='Required'?'#EF4444':'#34D399', background: l.ccw==='Required'?'#1A0000':'#001A0A', padding:'4px 10px', border:`1px solid ${l.ccw==='Required'?'#7F1D1D40':'#16603440'}`, whiteSpace:'nowrap' }}>{l.ccw === 'Required' ? 'SAFE REQUIRED' : 'RECOMMENDED'}</span>
              </div>
            ))}
          </div>
          <div style={{ padding:'20px 24px', background:'#111318', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
            ⚠ Storage laws vary by state and municipality. Always check current local laws. This guide is for informational purposes only.
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
