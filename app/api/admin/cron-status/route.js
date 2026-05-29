export const dynamic = 'force-dynamic'

import { getAllRuns, getAlertConfig, setAlertConfig, reportCronRun } from '@/lib/cronReporter'

// ── All cron jobs registry ────────────────────────────────────────────────────
export const ALL_JOBS = [
  { id:'news',             path:'/api/agent?feed=news',             schedule:'*/15 * * * *',  label:'News Feed',               group:'Content',  icon:'📰', critical:true,  desc:'RSS + NewsAPI + GNews → AI rewrite → Sanity every 15 min' },
  { id:'market',           path:'/api/agent?feed=market',           schedule:'*/30 * * * *',  label:'Market Feed',             group:'Content',  icon:'📊', critical:false, desc:'AmmoSeek + pricing data every 30 min' },
  { id:'releases',         path:'/api/agent?feed=releases',         schedule:'0 * * * *',     label:'Releases Feed',           group:'Content',  icon:'🔫', critical:false, desc:'Manufacturer RSS → new product releases hourly' },
  { id:'laws',             path:'/api/agent?feed=laws',             schedule:'0 */2 * * *',   label:'Laws Feed',               group:'Content',  icon:'⚖',  critical:true,  desc:'Congress.gov + LegiScan → legislation every 2 hrs' },
  { id:'video',            path:'/api/agent?feed=video',            schedule:'0 */4 * * *',   label:'Video Feed',              group:'Content',  icon:'▶',  critical:false, desc:'YouTube RSS → video index every 4 hrs' },
  { id:'state',            path:'/api/agent?feed=state',            schedule:'0 8 * * 0',     label:'State Laws (Weekly)',     group:'Content',  icon:'🗺',  critical:false, desc:'LegiScan → 50-state law profiles updated every Sunday 8am UTC' },
  { id:'goa',              path:'/api/agent?feed=goa',              schedule:'0 */2 * * *',   label:'GOA Feed',                group:'Content',  icon:'🦅', critical:false, desc:'Gun Owners of America press feed every 2 hrs' },
  { id:'quality-rewrite',  path:'/api/cron/quality-rewrite',        schedule:'0 * * * *',     label:'Quality Rewrite',         group:'Content',  icon:'✨', critical:true,  desc:'Scans all content for AI phrases + short bodies → rewrites failing items. Every hour.' },
  { id:'image-fix',        path:'/api/cron/image-fix',              schedule:'0 * * * *',     label:'Image Fix',               group:'Content',  icon:'🖼', critical:true,  desc:'Fetches OG images from source URLs, assigns real photo fallbacks. Every hour.' },
  { id:'site_health',      path:'/api/site-health',                 schedule:'0 8,14,20 * * *', label:'Site Health',           group:'System',   icon:'🩺', critical:true,  desc:'Health checks 3x/day at 8am, 2pm, 8pm UTC' },
  { id:'intelligence',     path:'/api/intelligence',                schedule:'0 1 * * *',     label:'Intelligence Briefing',   group:'System',   icon:'🧠', critical:true,  desc:'Daily AI briefing at 1am UTC → email digest' },
  { id:'nics',             path:'/api/nics',                        schedule:'0 10 1 * *',    label:'NICS Data',               group:'System',   icon:'📈', critical:false, desc:'FBI NICS background check data — 1st of each month' },
  { id:'nfa-wait-times',   path:'/api/nfa-wait-times',              schedule:'0 6 * * *',     label:'NFA Wait Times',          group:'System',   icon:'⏳', critical:false, desc:'Scrapes ATF + SilencerShop for NFA processing times daily 6am UTC' },
  { id:'newsletter',       path:'/api/newsletter',                  schedule:'0 7 * * *',     label:'Newsletter',              group:'Outreach', icon:'📧', critical:false, desc:'Resend daily newsletter digest at 7am UTC' },
  { id:'queue_digest',     path:'/api/outreach/queue/digest',       schedule:'0 13 * * *',    label:'Outreach Queue Digest',   group:'Outreach', icon:'📬', critical:false, desc:'Email pending approval queue summary at 1pm UTC' },
  { id:'prn_releases',     path:'/api/cron/releases',               schedule:'0 12 * * *',    label:'PRN Scraper',             group:'Outreach', icon:'🔍', critical:false, desc:'PRNewswire manufacturer press releases at noon UTC' },
  { id:'fetch-images',     path:'/api/admin/fetch-article-images',  schedule:'*/30 * * * *',  label:'Fetch Article Images',    group:'System',   icon:'📷', critical:false, desc:'Fetch og:image from source URLs → Sanity CDN every 30 min' },
  { id:'cron-health',      path:'/api/admin/cron-health',           schedule:'*/30 * * * *',  label:'Cron Health Check',       group:'System',   icon:'❤', critical:true,  desc:'System health check + email alerts every 30 min' },
  { id:'copyright-review', path:'/api/cron/copyright-review', schedule:'0 6 * * *', label:'Copyright Compliance', group:'System', icon:'⚖', critical:true, desc:'Daily scan of last 48h articles for copyright risk — old structure, no source, no analysis. Emails report.' },
  { id:'backup',           path:'/api/admin/backup',                schedule:'0 10,15 * * *', label:'Sanity Backup',           group:'System',   icon:'💾', critical:true,  desc:'Full Sanity export → GitHub backup repo at 10am & 3pm UTC. No AI cost.' },
  { id:'backfill',         path:'/api/admin/backfill-articles',     schedule:'0 12-23,0-3 * * *', label:'Article Backfill (legacy)', group:'Content', icon:'✍', critical:false, desc:'Legacy backfill — replaced by quality-rewrite' },
  { id:'fix-images',       path:'/api/admin/fix-images',            schedule:'0 12-23,0-3 * * *', label:'Image Patcher (legacy)',    group:'System',  icon:'🖼', critical:false, desc:'Legacy image patcher — replaced by image-fix' },
]

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || req.headers.get('x-vercel-cron') === '1'
    || (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`)
}

// ── GET: Full status of all jobs ──────────────────────────────────────────────
export async function GET(req) {
  const allRuns = await getAllRuns(20)

  const now = Date.now()
  const jobs = ALL_JOBS.map(job => {
    const history = allRuns[job.id] || []
    const lastRun = history[0] || null

    // Parse schedule to determine expected interval
    const intervalMs = parseScheduleInterval(job.schedule)
    const lastRunAge = lastRun ? now - new Date(lastRun.at).getTime() : Infinity
    const isOverdue  = intervalMs && lastRunAge > intervalMs * 2.5

    // Compute streak (consecutive successes from latest)
    let streak = 0
    for (const r of history) {
      if (r.status !== 'success') break
      streak++
    }

    // Success rate
    const total    = history.length
    const successes = history.filter(r => r.status === 'success').length
    const rate     = total > 0 ? Math.round((successes / total) * 100) : null

    let status = 'never'
    if (lastRun) {
      if (lastRun.status === 'failed') status = 'failed'
      else if (isOverdue) status = 'overdue'
      else status = lastRun.status || 'success'
    }

    return {
      ...job,
      history,
      lastRun,
      status,
      streak,
      rate,
      isOverdue,
      lastRunAge: lastRun ? Math.round(lastRunAge / 60000) : null, // minutes
    }
  })

  const alertConfig = await getAlertConfig().catch(() => ({}))

  return Response.json({
    ok:      true,
    jobs,
    alerts:  alertConfig,
    fetched: new Date().toISOString(),
  })
}

// ── POST: Record a run result OR manually trigger a job ───────────────────────
export async function POST(req) {
  const url = new URL(req.url)

  // Manual trigger
  if (url.searchParams.get('trigger') === 'true') {
    if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobId } = await req.json().catch(() => ({}))
    if (!jobId) return Response.json({ error: 'jobId required' }, { status: 400 })

    const job = ALL_JOBS.find(j => j.id === jobId)
    if (!job) return Response.json({ error: `Unknown job: ${jobId}` }, { status: 404 })

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://www.downrangeco.com'

    const t0  = Date.now()
    const isGet = job.path.includes('?feed=') || job.path === '/api/site-health' || job.path === '/api/nfa-wait-times'

    try {
      const res = await fetch(`${baseUrl}${job.path}`, {
        method:  isGet ? 'GET' : 'POST',
        headers: {
          'x-admin-key':   process.env.ADMIN_KEY || '',
          'authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
          'Content-Type':  'application/json',
        },
        signal: AbortSignal.timeout(270000), // 4.5 min
      })
      const text = await res.text().catch(() => '')
      const ms   = Date.now() - t0
      const ok   = res.ok

      // Record the manual trigger run
      await reportCronRun(jobId, {
        status:  ok ? 'success' : 'failed',
        ms,
        error:   ok ? null : `HTTP ${res.status}: ${text.slice(0, 200)}`,
        details: ok ? text.slice(0, 300) : null,
        trigger: 'manual',
      })

      return Response.json({ ok, ms, status: res.status, response: text.slice(0, 500) })
    } catch (e) {
      const ms = Date.now() - t0
      await reportCronRun(jobId, { status: 'failed', ms, error: e.message, trigger: 'manual' })
      return Response.json({ ok: false, error: e.message, ms }, { status: 500 })
    }
  }

  // Record a run result (called by each cron job via reportCronRun)
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { jobId, status, ms, error, details, trigger } = await req.json().catch(() => ({}))
  if (!jobId) return Response.json({ error: 'jobId required' }, { status: 400 })

  await reportCronRun(jobId, { status, ms, error, details, trigger })
  return Response.json({ ok: true })
}

// Parse cron schedule to approximate interval in ms
function parseScheduleInterval(schedule) {
  if (!schedule) return null
  const parts = schedule.split(' ')
  if (!parts[0] || parts[0] === '*') return null
  if (parts[0].startsWith('*/')) return parseInt(parts[0].slice(2)) * 60000
  if (parts[1]?.startsWith('*/')) return parseInt(parts[1].slice(2)) * 3600000
  if (parts[1] === '*') return 3600000
  if (parts[2] === '*' && parts[3] === '*' && parts[4] === '*') return 86400000
  return null
}
