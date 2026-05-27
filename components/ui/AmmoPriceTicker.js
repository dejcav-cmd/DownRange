'use client'

const PRICES = [
  { cal: '9mm',    price: '18¢/rd', trend: '↓', good: true  },
  { cal: '.223',   price: '32¢/rd', trend: '↑', good: false },
  { cal: '.308',   price: '75¢/rd', trend: '↓', good: true  },
  { cal: '.45 ACP',price: '39¢/rd', trend: '↑', good: false },
  { cal: '.22 LR', price: '7¢/rd',  trend: '↓', good: true  },
  { cal: '6.5 CM', price: '$1.42',  trend: '↑', good: false },
  { cal: '12 GA',  price: '41¢/rd', trend: '↓', good: true  },
  { cal: '7.62x39',price: '29¢/rd', trend: '↑', good: false },
]

export default function AmmoPriceTicker() {
  const items = [...PRICES, ...PRICES] // double for seamless loop

  return (
    <div style={{ background:'var(--bg2)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', overflow:'hidden', height:'32px', display:'flex', alignItems:'center' }}>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', background:'var(--bg3)', padding:'0 12px', height:'100%', display:'flex', alignItems:'center', flexShrink:0, borderRight:'1px solid var(--border)', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>
        AMMO INDEX
      </div>
      <div style={{ overflow:'hidden', flex:1 }}>
        <div style={{ display:'flex', gap:'0', animation:'ticker 15s linear infinite', width:'max-content' }}>
          {items.map((p, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0 20px', borderRight:'1px solid var(--border)', height:'32px', flexShrink:0 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', letterSpacing:'0.08em' }}>{p.cal}</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', fontWeight:700, color: p.good ? '#22C55E' : 'var(--text)' }}>{p.price}</span>
              <span style={{ fontSize:'9px', color: p.good ? '#22C55E' : '#EF4444' }}>{p.trend}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  )
}
