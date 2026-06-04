'use client'
import { useState, useEffect } from 'react'

const ICON_DEFS = {
  bluesky:  { label:'Bluesky',   symbol:'🦋', color:'#0085FF', ariaLabel:'Follow on Bluesky' },
  twitter:  { label:'X/Twitter', symbol:'𝕏',  color:'#e5e5e5', ariaLabel:'Follow on X' },
  facebook: { label:'Facebook',  symbol:'f',  color:'#1877F2', ariaLabel:'Follow on Facebook' },
  threads:  { label:'Threads',   symbol:'@',  color:'#aaaaaa', ariaLabel:'Follow on Threads' },
  reddit:   { label:'Reddit',    symbol:'🔴', color:'#FF4500', ariaLabel:'Follow on Reddit' },
  youtube:  { label:'YouTube',   symbol:'▶',  color:'#FF0000', ariaLabel:'Watch on YouTube' },
}

export default function SocialIcons({ size = 'sm', style = {} }) {
  const [links, setLinks] = useState({})

  useEffect(() => {
    fetch('/api/social/links')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.links) setLinks(d.links) })
      .catch(() => {})
  }, [])

  const active = Object.entries(ICON_DEFS).filter(([key]) => links[key])
  if (!active.length) return null

  const sz = size === 'lg' ? 34 : size === 'md' ? 28 : 24
  const fs = size === 'lg' ? '15px' : size === 'md' ? '13px' : '12px'

  return (
    <div style={{ display:'flex', alignItems:'center', gap: size === 'sm' ? 6 : 8, ...style }}>
      {active.map(([key, def]) => (
        <a key={key} href={links[key]} target="_blank" rel="noreferrer noopener"
          aria-label={def.ariaLabel}
          title={def.label}
          style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:sz, height:sz, background: def.color+'18',
            border:`1px solid ${def.color}40`, borderRadius:2,
            color: def.color, fontSize:fs, fontFamily:"'IBM Plex Mono',monospace",
            fontWeight:700, textDecoration:'none', transition:'background 0.15s, border-color 0.15s',
            flexShrink:0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = def.color+'30'; e.currentTarget.style.borderColor = def.color+'80' }}
          onMouseLeave={e => { e.currentTarget.style.background = def.color+'18'; e.currentTarget.style.borderColor = def.color+'40' }}>
          {def.symbol}
        </a>
      ))}
    </div>
  )
}
