// Read layer for the 2A cases portal. Live Sanity docs are merged over the curated
// seed (by _id) so pages are never empty and live updates win. ISR via next.revalidate.
import { client } from './client'
import { SEED } from '../../lib/legalRadar/seed'

const FIELDS = `_id, kind, title, slug, docket, court, circuit, states, topic, stage, stageLabel, status,
  outcome, summary, question, ruling, impact, nextDate, nextLabel, lastDate, events, url, source, needsReview`

export async function fetchRadarItems() {
  let live = []
  try {
    live = await client.fetch(`*[_type == "legalCase"] { ${FIELDS} }`, {}, { next: { revalidate: 900 } })
  } catch {}
  const map = new Map(SEED.map(s => [s._id, s]))
  for (const d of live || []) map.set(d._id, { ...(map.get(d._id) || {}), ...d })
  return [...map.values()]
}

const byDateDesc = (a, b) => String(b.lastDate || '').localeCompare(String(a.lastDate || ''))
const byNext = (a, b) => String(a.nextDate || '9999').localeCompare(String(b.nextDate || '9999'))

export const sortRecent = (items) => [...items].sort(byDateDesc)
export const sortUpcoming = (items) => items.filter(i => i.nextDate && i.nextDate >= new Date().toISOString().slice(0, 10)).sort(byNext)
export const ofKind = (items, kind) => items.filter(i => i.kind === kind)
export const forState = (items, code) => items.filter(i => (i.states || []).includes(code))

export function summarize(items) {
  const cases = items.filter(i => i.kind === 'case')
  return {
    scotusActive: cases.filter(i => i.court === 'scotus' && i.status === 'active').length,
    granted: cases.filter(i => i.stage === 'granted').length,
    decided: cases.filter(i => i.status === 'decided').length,
    doj: items.filter(i => i.kind === 'doj').length,
    total: items.length,
  }
}
