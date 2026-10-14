export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { reportCronRun } from '../../../../lib/cronReporter'
import { runRadar } from '../../../../lib/legalRadar/pipeline'
import { SEED } from '../../../../lib/legalRadar/seed'
import { lastActivity } from '../../../../lib/legalRadar/dates'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const auth = (req) => !!process.env.ADMIN_KEY && req.headers.get('x-admin-key') === process.env.ADMIN_KEY

const EDITABLE = ['title', 'topic', 'stage', 'stageLabel', 'status', 'outcome', 'summary', 'question', 'ruling', 'impact', 'legal', 'plain',
  'ifWin', 'ifLose', 'watch', 'nextDate', 'nextLabel', 'lastDate', 'url', 'needsReview', 'locked', 'circuit', 'states']

// GET: items (seed merged with Sanity), last run state, run history, key health (booleans only)
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const [docs, state, runs] = await Promise.all([
    sanity.fetch(`*[_type == "legalCase"]{ ..., "inSanity": true }`),
    sanity.fetch(`*[_id == "legal-radar-state"][0]{ lastRunAt, mode, result }`).catch(() => null),
    sanity.fetch(`*[_type == "cronRun" && jobId in ["legal-radar","legal-radar-weekly"]] | order(at desc)[0...12]{ at, status, ms, trigger, details, error }`).catch(() => []),
  ])
  const map = new Map(SEED.map(s => [s._id, { ...s, inSanity: false }]))
  for (const d of docs) map.set(d._id, { ...(map.get(d._id) || {}), ...d })
  const items = [...map.values()].map(i => ({
    _id: i._id, kind: i.kind, title: i.title, slug: i.slug, docket: i.docket, court: i.court, circuit: i.circuit, states: i.states || [],
    topic: i.topic, stage: i.stage, stageLabel: i.stageLabel, status: i.status, summary: i.summary, nextDate: i.nextDate, nextLabel: i.nextLabel,
    lastDate: i.lastDate, activity: lastActivity(i), url: i.url, source: i.source, needsReview: !!i.needsReview, locked: !!i.locked, inSanity: !!i.inSanity,
    hasWriteup: !!(i.legal && i.plain),
  })).sort((a, b) => String(b.activity || '').localeCompare(String(a.activity || '')))
  let result = null
  try { result = state?.result ? JSON.parse(state.result) : null } catch {}
  return Response.json({
    ok: true, items, state: state ? { lastRunAt: state.lastRunAt, mode: state.mode, result } : null, runs,
    schedule: { cron: '20 6 * * *', label: 'Daily 6:20 UTC, full sweep Mondays' },
    env: {
      CONGRESS_GOV_KEY: !!process.env.CONGRESS_GOV_KEY, COURTLISTENER_TOKEN: !!process.env.COURTLISTENER_TOKEN,
      DISCORD_WEBHOOK_ALERTS: !!process.env.DISCORD_WEBHOOK_ALERTS, ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    },
    counts: {
      total: items.length, unverified: items.filter(i => i.needsReview).length, locked: items.filter(i => i.locked).length,
      notSaved: items.filter(i => !i.inSanity).length,
    },
  })
}

// Make sure a seed-only item exists in Sanity before editing it
async function ensure(id) {
  const seed = SEED.find(s => s._id === id)
  if (seed) await sanity.createIfNotExists({ ...seed })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  let b = {}
  try { b = await req.json() } catch {}
  const { action, id } = b

  if (action === 'patch' || action === 'verify' || action === 'lock') {
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })
    let set = {}
    if (action === 'verify') set = { needsReview: false }
    else if (action === 'lock') set = { locked: !!b.value }
    else for (const k of EDITABLE) if (b.fields && k in b.fields) set[k] = b.fields[k]
    if (!Object.keys(set).length) return Response.json({ error: 'nothing to change' }, { status: 400 })
    await ensure(id)
    await sanity.patch(id).set(set).commit()
    return Response.json({ ok: true })
  }

  if (action === 'delete') {
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })
    await sanity.delete(id)
    return Response.json({ ok: true, note: SEED.some(s => s._id === id) ? 'Curated seed item: it still shows on the site until removed from the code.' : undefined })
  }

  if (action === 'run') {
    const mode = ['seed', 'light', 'full'].includes(b.mode) ? b.mode : 'light'
    const t0 = Date.now()
    try {
      const res = await runRadar({ mode, dryRun: !!b.dry })
      if (!b.dry) await reportCronRun('legal-radar', { status: res.errors.length && !(res.created + res.updated + res.unchanged) ? 'failed' : 'success', ms: Date.now() - t0, trigger: 'manual', details: JSON.stringify(res).slice(0, 300) }).catch(() => {})
      return Response.json({ ok: true, result: res })
    } catch (e) {
      if (!b.dry) await reportCronRun('legal-radar', { status: 'failed', ms: Date.now() - t0, trigger: 'manual', error: e.message }).catch(() => {})
      return Response.json({ ok: false, error: e.message }, { status: 500 })
    }
  }
  return Response.json({ error: 'unknown action' }, { status: 400 })
}
