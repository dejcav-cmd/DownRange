// Shared, pure helpers for the Manufacturer Press Releases UI (safe in server + client components).
export const PRESS_BASE = '/news/manufacturer-press-releases'

export const KIND_META = {
  product:     { label: 'PRODUCT',     color: 'var(--gold)' },
  corporate:   { label: 'CORPORATE',   color: 'var(--blue)' },
  event:       { label: 'EVENT',       color: '#C084FC' },
  recall:      { label: 'RECALL',      color: 'var(--red-bright)' },
  partnership: { label: 'PARTNERSHIP', color: 'var(--green)' },
}

export const KIND_FILTERS = [
  ['', 'All types'], ['product', 'Products'], ['corporate', 'Corporate'],
  ['event', 'Events'], ['recall', 'Recalls'], ['partnership', 'Partnerships'],
]

export function pressHref({ brand, kind, month, page } = {}) {
  const q = new URLSearchParams()
  if (brand) q.set('brand', brand)
  if (kind)  q.set('type', kind)
  if (month) q.set('month', month)
  if (page && page > 1) q.set('page', String(page))
  const s = q.toString()
  return s ? PRESS_BASE + '?' + s : PRESS_BASE
}

export function timeAgo(date) {
  if (!date) return ''
  const min = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (min < 60) return Math.max(1, min) + 'm ago'
  const hr = Math.floor(min / 60)
  if (hr < 24) return hr + 'h ago'
  const d = Math.floor(hr / 24)
  if (d < 45) return d + 'd ago'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function fmtDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(Date.UTC(+y, +m - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
