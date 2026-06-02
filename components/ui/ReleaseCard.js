'use client'

export default function ReleaseCard({ rel }) {
  const img      = rel?.heroImage?.asset?.url || rel?.imageUrl || '/img/photos/pistol.jpg'
  const href     = rel?.slug?.current ? `/releases/${rel.slug.current}` : '/releases'
  const catColor = { pistol:'#60A5FA', rifle:'#34D399', shotgun:'#F59E0B', revolver:'#C084FC', suppressor:'#9CA3AF' }[rel.category] || '#C8922A'

  return (
    <a href={href} style={{ textDecoration:'none', display:'block' }}>
      <div style={{ background:'#111318', border:'1px solid var(--border)', overflow:'hidden', transition:'border-color .2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor='#C8922A'}
        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
        <div style={{ width:'100%', height:160, overflow:'hidden', position:'relative', background:'#0d1117' }}>
          <img src={img} alt={rel.title || rel.model}
            style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.85 }}
            onError={e => { e.target.src='/img/photos/pistol.jpg' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(9,9,11,.7) 0%,transparent 60%)' }} />
          {rel.isJustDropped && (
            <span style={{ position:'absolute', top:8, right:8, background:'#C8922A', color:'#000', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, padding:'2px 7px', letterSpacing:'.08em' }}>
              JUST DROPPED
            </span>
          )}
          <span style={{ position:'absolute', bottom:8, left:10, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:catColor, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>
            {rel.category}
          </span>
        </div>
        <div style={{ padding:'12px 14px' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563', marginBottom:4 }}>{rel.brand}</div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'#E5E5E5', lineHeight:1.25, marginBottom:8,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {rel.model}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {rel.caliber && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6B7280' }}>{rel.caliber}</span>}
            {rel.msrp    && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', fontWeight:700 }}>{rel.msrp}</span>}
          </div>
        </div>
      </div>
    </a>
  )
}
