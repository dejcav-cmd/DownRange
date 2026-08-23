'use client'
import { useState, useEffect } from 'react'

// Simple, consistent line-icon glyphs for every platform — replaces the old
// mix of emoji and text characters (e.g. a camera emoji for Instagram) with
// a uniform SVG icon set. All use currentColor so the existing per-platform
// tint/border styling still drives the color.
const ICONS = {
  bluesky: (
    <svg viewBox="0 0 24 24" width="100%" height="100%">
      <path d="M12 9c-1.3-2-3.8-3.4-5.7-2.6-1.2.5-1.4 1.9-.5 2.9.8.9 2.1 1.3 3.4 1.2-1.3.3-2.5 1.1-2.7 2.4-.2 1.4 1 2.4 2.4 2 1.3-.4 2.4-1.6 3.1-3.1.7 1.5 1.8 2.7 3.1 3.1 1.4.4 2.6-.6 2.4-2-.2-1.3-1.4-2.1-2.7-2.4 1.3.1 2.6-.3 3.4-1.2.9-1 .7-2.4-.5-2.9-1.9-.8-4.4.6-5.7 2.6z" fill="currentColor"/>
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M13.5 8.5h1.5V6h-1.5c-1.66 0-3 1.34-3 3v1.5H9v2.5h1.5V18h2.5v-5h1.8l.4-2.5h-2.2V9c0-.28.22-.5.5-.5z" fill="currentColor"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/>
    </svg>
  ),
  threads: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M9.5 8.8c1-.6 2.2-.9 3.3-.7 2.3.4 3.4 2.2 3.1 4.6-.3 2.6-2.1 4.3-4.4 4-1.5-.2-2.5-1.1-2.7-2.3-.2-1.5 1-2.4 2.6-2.4 1.1 0 2.1.3 2.7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  reddit: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
      <circle cx="12" cy="13.5" r="6.5" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="9" cy="13.2" r="1.1" fill="currentColor"/>
      <circle cx="15" cy="13.2" r="1.1" fill="currentColor"/>
      <path d="M9 16c1 1 5 1 6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M12 7V4M12 4l2-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="14.3" cy="3" r="1" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M10 9.5v5l4.5-2.5z" fill="currentColor"/>
    </svg>
  ),
}

const ICON_DEFS = {
  bluesky:  { label:'Bluesky',   color:'#0085FF', ariaLabel:'Follow on Bluesky' },
  twitter:  { label:'X/Twitter', color:'#e5e5e5', ariaLabel:'Follow on X' },
  facebook: { label:'Facebook',  color:'#1877F2', ariaLabel:'Follow on Facebook' },
  instagram:{ label:'Instagram', color:'#E4405F', ariaLabel:'Follow on Instagram' },
  threads:  { label:'Threads',   color:'#aaaaaa', ariaLabel:'Follow on Threads' },
  reddit:   { label:'Reddit',    color:'#FF4500', ariaLabel:'Follow on Reddit' },
  youtube:  { label:'YouTube',   color:'#FF0000', ariaLabel:'Watch on YouTube' },
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
  const iconPad = size === 'lg' ? 8 : size === 'md' ? 7 : 5

  return (
    <div style={{ display:'flex', alignItems:'center', gap: size === 'sm' ? 5 : 7, ...style }}>
      {active.map(([key, def]) => (
        <a key={key} href={links[key]} target="_blank" rel="noreferrer noopener"
          aria-label={def.ariaLabel} title={def.label}
          style={{
            display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:sz, height:sz, padding:iconPad, boxSizing:'border-box',
            background: def.color + '18',
            border: `1px solid ${def.color}50`,
            borderRadius:2, color:def.color,
            textDecoration:'none', flexShrink:0, lineHeight:1,
            transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = def.color+'35'; e.currentTarget.style.borderColor = def.color+'90' }}
          onMouseLeave={e => { e.currentTarget.style.background = def.color+'18'; e.currentTarget.style.borderColor = def.color+'50' }}>
          {ICONS[key]}
        </a>
      ))}
    </div>
  )
}
