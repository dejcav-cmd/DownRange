'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const POLL_INTERVAL = 3 * 60 * 1000 // 3 min

export default function GlobalBreakingTicker() {
  const pathname = usePathname()
  const [alerts, setAlerts] = useState([])
  const [flash,  setFlash]  = useState(false)
  const prevIds              = useRef(new Set())

  // Don't render on admin pages — admin has its own fixed header layout
  const isAdmin = pathname?.startsWith('/admin')

  useEffect(() => {
    if (isAdmin) return // Don't poll on admin
    async function fetchAlerts() {
      try {
        const res  = await fetch('/api/breaking-alerts', { cache: 'no-store' })
        const data = await res.json()
        if (!data.alerts?.length) return
        const incoming = data.alerts
        const hasNew   = incoming.some(a => !prevIds.current.has(a._id || a))
        if (hasNew) {
          setFlash(true)
          setTimeout(() => setFlash(false), 2000)
          prevIds.current = new Set(incoming.map(a => a._id || a))
        }
        setAlerts(incoming)
      } catch {}
    }
    fetchAlerts()
    const t = setInterval(fetchAlerts, POLL_INTERVAL)
    return () => clearInterval(t)
  }, [])

  // Never render on admin pages
  if (isAdmin) return null

  // Don't take up space if no alerts
  if (!alerts.length) return null

  const doubled = [...alerts, ...alerts]

  return (
    <div style={{
      background: flash ? '#991B1B' : '#B91C1C',
      padding: '8px 0', overflow: 'hidden',
      position: 'sticky', top: 0, zIndex: 9999,
      transition: 'background 0.4s ease',
      width: '100%',
    }} ref={el => {
      // Set CSS variable so Masthead knows exact ticker height
      if (el && typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--ticker-height', el.offsetHeight + 'px')
      }
    }}>
      <style>{`
        @keyframes scrollLeft {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes flashPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .breaking-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #fff;
          animation: flashPulse 1s infinite;
          display: inline-block; flex-shrink: 0;
        }
      `}</style>
      <div style={{ display:'flex', alignItems:'center' }}>
        <div style={{
          background:'#7F1D1D', color:'#fff',
          fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px',
          fontWeight:700, letterSpacing:'0.12em', padding:'0 16px',
          whiteSpace:'nowrap', flexShrink:0,
          display:'flex', alignItems:'center', gap:'7px', alignSelf:'stretch', zIndex:2,
        }}>
          <span className="breaking-dot" />
          BREAKING
        </div>
        <div style={{ overflow:'hidden', flex:1 }}>
          <div
            style={{
              display:'flex',
              animation: `scrollLeft ${Math.max(8, doubled.length * 2)}s linear infinite`,
              whiteSpace:'nowrap', paddingLeft:'40px',
            }}
            onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
            onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
          >
            {doubled.map((item, i) => {
              const headline = typeof item === 'string' ? item : item.headline || item.title
              const url      = typeof item === 'string' ? null : item.url
              const isHot    = typeof item !== 'string' && (item.urgencyScore >= 9)
              return (
                <span key={i} style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px',
                  color:'#fff', padding:'0 36px 0 0',
                  display:'inline-flex', alignItems:'center', gap:'10px',
                }}>
                  <span style={{ color:'rgba(255,255,255,0.35)', fontSize:'10px' }}>//</span>
                  {isHot && <span style={{ background:'#fff', color:'#B91C1C', fontSize:'9px', fontWeight:700, padding:'1px 5px', letterSpacing:'0.1em' }}>HOT</span>}
                  {url
                    ? <a href={url} style={{ color:'#fff', textDecoration:'none' }}
                        onMouseEnter={e => e.target.style.textDecoration='underline'}
                        onMouseLeave={e => e.target.style.textDecoration='none'}>{headline}</a>
                    : <span>{headline}</span>
                  }
                </span>
              )
            })}
          </div>
        </div>
        <div style={{
          background:'#7F1D1D', color:'rgba(255,255,255,0.6)',
          fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px',
          letterSpacing:'0.1em', padding:'0 12px',
          alignSelf:'stretch', display:'flex', alignItems:'center', flexShrink:0, gap:5,
        }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'flashPulse 2s infinite' }} />
          LIVE
        </div>
      </div>
    </div>
  )
}
