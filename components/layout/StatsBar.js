export default function StatsBar({ stats = {} }) {
  const items = [
    { label: 'NICS TODAY', val: stats.nicsToday ? stats.nicsToday.toLocaleString() : '247,832' },
    { label: 'ATF RULES UNDER REVIEW', val: stats.atfRulesUnderReview || '14' },
    { label: 'STATE BILLS THIS SESSION', val: stats.stateBillsThisSession || '312' },
    { label: 'CC STATES', val: `${stats.ccStates || 29}/50` },
    { label: 'NEW RELEASES THIS WEEK', val: stats.newReleasesThisWeek || '7' },
    { label: 'PENDING SCOTUS CASES', val: stats.pendingScotus || '3' },
    { label: 'AVG 9MM ¢/RD', val: stats.avg9mm || '18.9¢' },
    { label: 'SUBSCRIBERS', val: stats.subscriberCount ? stats.subscriberCount.toLocaleString() : '412K' },
  ]
  const doubled = [...items, ...items]

  return (
    <div style={{ background: '#C8922A', padding: '12px 0', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', whiteSpace: 'nowrap',
        animation: 'scrollLeft 30s linear infinite'
      }}
        onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
        onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
      >
        {doubled.map((item, i) => (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '0 40px 0 0',
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px',
            color: '#09090B', fontWeight: 500
          }}>
            <span style={{ opacity: 0.65 }}>{item.label}</span>
            <span style={{ fontWeight: 700 }}>{item.val}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
