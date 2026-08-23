'use client'
import { useState, useEffect } from 'react'

const ICON_DEFS = {
  bluesky:  { label:'Bluesky',   symbol:'🦋', color:'#0085FF', ariaLabel:'Follow on Bluesky' },
  twitter:  { label:'X/Twitter', symbol:'𝕏',  color:'#e5e5e5', ariaLabel:'Follow on X' },
  facebook: { label:'Facebook',  symbol:'f',  color:'#1877F2', ariaLabel:'Follow on Facebook' },
  instagram:{ label:'Instagram', symbol:'📷', color:'#E4405F', ariaLabel:'Follow on Instagram' },
  threads:  { label:'Threads',   symbol:'@',  color:'#aaaaaa', ariaLabel:'Follow on Threads' },
  reddit:   { label:'Reddit',    symbol:'🔴', color:'#FF4500', ariaLabel:'Follow on Reddit' },
  youtube:  { label:'YouTube',   symbol:'▶',  color:'#FF0000', ariaLabel:'Watch on YouTube' },
}

export default function SocialIcons({ size = 'sm', style = {} }) {
  const [links, setLinks] = useState(null) // null = loading

  useEffect(() => {
    fetch('/api/social/links')
      .then(r => r.ok ? r.json() : { links: {} })
      .then(d => setLinks(d?.links || {}))
      .catch(() => setLinks({}))
  }, [])

  // Still loading — render placeholder slots to avoid layout shift
  if (links === null) return (
    <div style={{ display:'flex', gap:6, ...style }}>
      {[1,2].map(i => <div key={i} style={{ width:24, height:24, background:'#1f2428', borderRadius:2, opacity:0.4 }} />)}
    </div>
  )

  const active = Object.entries(ICON_DEFS).filter(([key]) => links[key])
  if (!active.length) return null

  const sz = size === 'lg' ? 34 : size === 'md' ? 28 : 24
  const fs = size === 'lg' ? '15px' : size === 'md' ? '14px' : '12px'

  return (
    <div style={{ display:'flex', alignItems:'center', gap: size === 'sm' ? 5 : 7, ...style }}>
      {active.map(([key, def]) => (
        <a key={key} href={links[key]} target="_blank" rel="noreferrer noopener"
          aria-label={def.ariaLabel} title={def.label}
          style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:sz, height:sz,
            background: def.color + '18',
            border: `1px solid ${def.color}50`,
            borderRadius:2, color:def.color,
            fontSize: key === 'twitter' ? String(parseInt(fs)-1)+'px' : fs,
            fontFamily:"'IBM Plex Mono',monospace", fontWeight:700,
            textDecoration:'none', flexShrink:0, lineHeight:1,
            transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = def.color+'35'; e.currentTarget.style.borderColor = def.color+'90' }}
          onMouseLeave={e => { e.currentTarget.style.background = def.color+'18'; e.currentTarget.style.borderColor = def.color+'50' }}>
          {def.symbol}
        </a>
      ))}
    </div>
  )
}
