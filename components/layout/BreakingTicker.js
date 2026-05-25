'use client'

export default function BreakingTicker({ alerts = [] }) {
  const defaultAlerts = [
    'ATF Rule Challenge Filed in 5th Circuit — Decision Expected Q3 2026',
    'Senate Judiciary Advances National Reciprocity Act 11-9',
    'NICS Background Check Volume Hits 18-Month High',
    'Smith & Wesson Unveils M&P 2.0 Compact Pro Series',
    '9mm 115gr FMJ Average Down 4.2% This Week',
  ]
  const items = alerts.length > 0 ? alerts : defaultAlerts
  const doubled = [...items, ...items]

  return (
    <div style={{ background: '#B91C1C', padding: '8px 0', overflow: 'hidden', position: 'relative', zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{
          background: '#7F1D1D', color: '#fff',
          fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px',
          fontWeight: 500, letterSpacing: '0.1em',
          padding: '0 16px', whiteSpace: 'nowrap',
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px',
          height: '100%', position: 'relative', zIndex: 2
        }}>
          <span className="pulse-dot" style={{ background: '#fff' }} />
          BREAKING
        </div>
        <div style={{
          display: 'flex',
          animation: 'scrollLeft 45s linear infinite',
          whiteSpace: 'nowrap', paddingLeft: '40px',
        }}
          onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
          onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
        >
          {doubled.map((item, i) => (
            <span key={i} style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px',
              color: '#fff', padding: '0 32px 0 0',
              display: 'inline-flex', alignItems: 'center', gap: '10px'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>//</span>
              {typeof item === 'string' ? item : item.headline}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
