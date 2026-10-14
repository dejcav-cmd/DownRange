// Date helpers for the radar. "Today" is Pacific time so labels match what DJ and readers see.
export const todayPT = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
export const dayDiff = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 864e5)

// Most recent real activity: the lastDate field or any past timeline event.
export function lastActivity(item) {
  const t = todayPT()
  const ev = (item.events || []).map(e => e.date).filter(d => d && d <= t)
  return [item.lastDate, ...ev].filter(d => d && d <= t).sort().pop() || null
}

export function daysSince(date) { return date ? Math.max(0, dayDiff(todayPT(), date)) : null }

export function agoLabel(date) {
  const n = daysSince(date)
  if (n === null) return ''
  if (n === 0) return 'Updated today'
  return n === 1 ? 'Updated 1 day ago' : `Updated ${n} days ago`
}

export function inLabel(date) {
  if (!date) return ''
  const n = dayDiff(date, todayPT())
  if (n < 0) return `${-n} days ago`
  if (n === 0) return 'Today'
  return n === 1 ? 'Tomorrow' : `In ${n} days`
}

// fresh: 3 days or less, warm: 14 days or less, cold: older
export function freshness(date) {
  const n = daysSince(date)
  return n === null ? 'cold' : n <= 3 ? 'fresh' : n <= 14 ? 'warm' : 'cold'
}
