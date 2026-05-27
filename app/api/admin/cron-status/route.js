export const dynamic = 'force-dynamic'

/**
 * GET  /api/admin/cron-status          — full status of all jobs
 * POST /api/admin/cron-status          — record a run result (called by each cron after running)
 * POST /api/admin/cron-status?trigger=true — manually trigger a job
 */

import { Redis } from '@upstash/redis'

const REDIS_KEY = 'dr:cron-runs'
const TTL = 30 * 86400  // 30 days

let _redis = null
function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  _redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  return _redis
}

// In-memory fallback
let _mem = {}

// ── All 15 cron jobs defined ─────────────────────────────────────────────────
export const ALL_JOBS = [
  // Agent feeds
  { id:'news',          path:'/api/agent?feed=news',          schedule:'*/15 * * * *', label:'News Feed',            group:'Content',    icon:'📰', critical:true,  desc:'RSS + NewsAPI + GNews → Sanity articles every 15 min' },
  { id:'market',        path:'/api/agent?feed=market',        schedule:'*/30 * * * *', label:'Market Feed',          group:'Content',    icon:'📊', critical:false, desc:'AmmoSeek + pricing data → ammo index every 30 min' },
  { id:'releases',      path:'/api/agent?feed=releases',      schedule:'0 * * * *',    label:'Releases Feed',        group:'Content',    icon:'🔫', critical:false, desc:'Manufacturer RSS → new product releases hourly' },
  { id:'laws',          path:'/api/agent?feed=laws',          schedule:'0 */2 * * *',  label:'Laws Feed',            group:'Content',    icon:'⚖',  critical:true,  desc:'Congress.gov + LegiScan → legislation every 2 hrs' },
  { id:'video',         path:'/api/agent?feed=video',         schedule:'0 */4 * * *',  label:'Video Feed',           group:'Content',    icon:'▶',  critical:false, desc:'YouTube RSS → video index every 4 hrs' },
  { id:'state',         path:'/api/agent?feed=state',         schedule:'0 8 * * *',    label:'State Feed',           group:'Content',    icon:'🗺',  critical:false, desc:'LegiScan → per-state bill updates daily 8am' },
  // System jobs
  { id:'site_health',   path:'/api/site-health',              schedule:'0 8,14,20 * * *', label:'Site Health',       group:'System',     icon:'🩺', critical:true,  desc:'Broken links, missing images, feed health — 3×/day' },
  { id:'intelligence',  path:'/api/intelligence',             schedule:'0 5 * * *',    label:'Intelligence Briefing',group:'System',     icon:'🧠', critical:false, desc:'Competitor research + Claude analysis midnight daily' },
  { id:'nics',          path:'/api/nics',                     schedule:'0 10 1 * *',   label:'NICS Data',            group:'System',     icon:'📈', critical:false, desc:'FBI NICS background check data — 1st of month' },
  // Outreach
  { id:'newsletter',    path:'/api/newsletter',               schedule:'0 7 * * *',    label:'Newsletter',           group:'Outreach',   icon:'📧', critical:false, desc:'Resend daily newsletter digest — 7am' },
  { id:'queue_digest',  path:'/api/outreach/queue/digest',    schedule:'0 13 * * *',   label:'Outreach Queue Digest',group:'Outreach',   icon:'📬', critical:false, desc:'Email pending approval queue summary — 1pm' },
  { id:'prn_releases',  path:'/api/cron/releases',            schedule:'0 12 * * *',   label:'PRN Scraper',          group:'Outreach',   icon:'🔍', critical:false, desc:'PRNewswire manufacturer press releases — noon' },
]

function parseSchedule(cron) {
  // Returns human-readable + next run Date
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return { label: cron, next: null }
  const [min, hour, dom, mon, dow] = parts

  let label = cron
  if (min.startsWith('*/') && hour === '*')  label = `Every ${min.slice(2)} min`
  else if (hour.startsWith('*/'))             label = `Every ${hour.slice(2)} hrs`
  else if (hour.includes(','))                label = `Daily at ${hour.split(',').map(h=>`${h.padStart(2,'0')}:${min.padStart(2,'0')} UTC`).join(', ')}`
  else if (dom === '1' && mon === '*')        label = `Monthly (1st) at ${hour.padStart(2,'0')}:${min.padStart(2,'0')} UTC`
  else                                        label = `Daily ${hour.padStart(2,'0')}:${min.padStart(2,'0')} UTC`

  // Calculate next run (simplified)
  const now = new Date()
  let next = new Date(now)
  try {
    if (min.startsWith('*/')) {
      const interval = parseInt(min.slice(2))
      const elapsed = now.getMinutes() % interval
      next = new Date(now.getTime() + (interval - elapsed) * 60000)
      next.setSeconds(0, 0)
    } else if (hour === '*') {
      next = new Date(now.getTime() + (parseInt(min) - now.getMinutes()) * 60000)
      if (next < now) next = new Date(next.getTime() + 3600000)
      next.setSeconds(0, 0)
    } else {
      const h = parseInt(hour.split(',')[0])
      const m = parseInt(min)
      next = new Date(now)
      next.setUTCHours(h, m, 0, 0)
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
    }
  } catch { next = null }

  return { label, next: next?.toISOString() || null }
}

async function readRuns() {
  const redis = getRedis()
  if (redis) {
    try {
      const d = await redis.get(REDIS_KEY)
      if (typeof d === 'object' && d !== null) return d
      if (typeof d === 'string') return JSON.parse(d)
    } catch {}
  }
  return _mem
}

async function writeRuns(data) {
  _mem = data
  const redis = getRedis()
  if (redis) {
    try { await redis.set(REDIS_KEY, JSON.stringify(data), { ex: TTL }) } catch {}
  }
}

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || req.headers.get('x-vercel-cron') === '1'
    || (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`)
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const runs  = await readRuns()
  const now   = Date.now()

  const jobs = ALL_JOBS.map(job => {
    const history   = (runs[job.id] || []).slice(0, 20)   // last 20 runs
    const lastRun   = history[0] || null
    const { label: schedLabel, next } = parseSchedule(job.schedule)

    // Streak — consecutive successes
    let streak = 0
    for (const r of history) {
      if (r.status === 'success') streak++
      else break
    }

    // Success rate last 10
    const last10 = history.slice(0, 10)
    const successRate = last10.length > 0
      ? Math.round((last10.filter(r => r.status === 'success').length / last10.length) * 100)
      : null

    // Overdue check — if next run was > 2 intervals ago
    const sinceLastRun = lastRun ? now - new Date(lastRun.at).getTime() : null
    const isOverdue = sinceLastRun !== null && next !== null
      ? new Date(next).getTime() < now - 300000   // more than 5 min past next scheduled
      : false

    return {
      ...job,
      scheduleLabel: schedLabel,
      nextRun:       next,
      lastRun:       lastRun || null,
      history:       history.slice(0, 10),
      streak,
      successRate,
      isOverdue,
      status: !lastRun ? 'never'
            : isOverdue && lastRun.status !== 'success' ? 'overdue'
            : lastRun.status,
    }
  })

  // Summary stats
  const summary = {
    total:     jobs.length,
    healthy:   jobs.filter(j => j.status === 'success').length,
    failing:   jobs.filter(j => j.status === 'failed' || j.status === 'overdue').length,
    never:     jobs.filter(j => j.status === 'never').length,
    critFailing: jobs.filter(j => j.critical && (j.status === 'failed' || j.status === 'overdue')).length,
  }

  // Env health
  const env = {
    CRON_SECRET:    !!process.env.CRON_SECRET,
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    SANITY_API_TOKEN:  !!process.env.SANITY_API_TOKEN,
    RESEND_API_KEY:    !!process.env.RESEND_API_KEY,
    UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
    ADMIN_KEY:         !!process.env.ADMIN_KEY,
  }

  return Response.json({ ok: true, jobs, summary, env, generatedAt: new Date().toISOString() })
}

// ── POST — record a run result ───────────────────────────────────────────────
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  // Manual trigger
  if (new URL(req.url).searchParams.get('trigger') === 'true') {
    const { jobId } = body
    const job = ALL_JOBS.find(j => j.id === jobId)
    if (!job) return Response.json({ error: 'Unknown job' }, { status: 404 })

    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://www.downrangeco.com'

    const start = Date.now()
    try {
      const res = await fetch(`${origin}${job.path}`, {
        headers: {
          'authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
          'x-admin-key':   process.env.ADMIN_KEY || '',
        },
      })
      const ms = Date.now() - start
      const ok = res.ok
      let responseText = ''
      try { const d = await res.json(); responseText = JSON.stringify(d).slice(0, 200) } catch {}

      // Record result
      const runs = await readRuns()
      runs[jobId] = [{ at: new Date().toISOString(), status: ok ? 'success' : 'failed', ms, trigger: 'manual', response: responseText }, ...(runs[jobId] || [])].slice(0, 50)
      await writeRuns(runs)

      return Response.json({ ok, jobId, ms, status: ok ? 'success' : 'failed', response: responseText })
    } catch (err) {
      return Response.json({ ok: false, error: err.message }, { status: 500 })
    }
  }

  // Record a run result
  const { jobId, status, ms, error: errMsg, details } = body
  if (!jobId || !status) return Response.json({ error: 'jobId and status required' }, { status: 400 })

  const runs = await readRuns()
  runs[jobId] = [
    { at: new Date().toISOString(), status, ms: ms || 0, trigger: 'cron', error: errMsg || null, details: details || null },
    ...(runs[jobId] || [])
  ].slice(0, 50)
  await writeRuns(runs)

  return Response.json({ ok: true, jobId, status })
}
