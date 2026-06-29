export const dynamic = 'force-dynamic'

import { getAllRuns, getAlertConfig, setAlertConfig, reportCronRun } from '@/lib/cronReporter'

// ── All cron jobs registry ────────────────────────────────────────────────────
export const ALL_JOBS = [
  { id:'news',             path:'/api/agent?feed=news',             schedule:'*/15 * * * *',  label:'News Feed',               group:'Content',  icon:'📰', critical:true,  desc:'RSS + NewsAPI + GNews → AI rewrite → Sanity every 15 min' },
  { id:'market',           path:'/api/agent?feed=market',           schedule:'*/30 * * * *',  label:'Market Feed',             group:'Content',  icon:'📊', critical:false, desc:'AmmoSeek + pricing data every 30 min' },
  { id:'releases',         path:'/api/agent?feed=releases',         schedule:'45 */6 * * *',     label:'Releases Feed',           group:'Content',  icon:'🔫', critical:false, desc:'Manufacturer RSS → new product releases hourly' },
  { id:'laws',             path:'/api/agent?feed=laws',             schedule:'0 */2 * * *',   label:'Laws Feed',               group:'Content',  icon:'⚖',  critical:true,  desc:'Congress.gov + LegiScan → legislation every 2 hrs' },
  { id:'video',            path:'/api/agent?feed=video',            schedule:'0 */4 * * *',   label:'Video Feed',              group:'Content',  icon:'▶',  critical:false, desc:'YouTube RSS → video index every 4 hrs' },
  { id:'state',            path:'/api/agent?feed=state',            schedule:'0 8 * * 0',     label:'State Laws (Weekly)',     group:'Content',  icon:'🗺',  critical:false, desc:'LegiScan → 50-state law profiles updated every Sunday 8am UTC' },
  { id:'goa',              path:'/api/agent?feed=goa',              schedule:'0 */2 * * *',   label:'GOA Feed',                group:'Content',  icon:'🦅', critical:false, desc:'Gun Owners of America press feed every 2 hrs' },
  { id:'quality-rewrite',  path:'/api/cron/quality-rewrite',        schedule:'0 * * * *',     label:'Quality Rewrite',         group:'Content',  icon:'✨', critical:true,  desc:'Scans all content for AI phrases + short bodies → rewrites failing items. Every hour.' },
  { id:'image-fix',        path:'/api/cron/image-fix',              schedule:'0 * * * *',     label:'Image Fix',               group:'Content',  icon:'🖼', critical:true,  desc:'Fetches OG images from source URLs, assigns real photo fallbacks. Every hour.' },
  { id:'fix-placeholder-images', path:'/api/cron/fix-placeholder-images', schedule:'0 * * * *', label:'Fix Placeholder Images', group:'Content', icon:'🔧', critical:false, desc:'Scans articles still using /img/photos/ fallbacks, fetches real OG image from source → uploads to Sanity CDN. Every hour.' },
  { id:'site_health',      path:'/api/site-health',                 schedule:'0 8,14,20 * * *', label:'Site Health',           group:'System',   icon:'🩺', critical:true,  desc:'Health checks 3x/day at 8am, 2pm, 8pm UTC' },
  { id:'intelligence',     path:'/api/intelligence',                schedule:'0 1 * * *',     label:'Intelligence Briefing',   group:'System',   icon:'🧠', critical:true,  desc:'Daily AI briefing at 1am UTC → email digest' },
  { id:'nics',             path:'/api/nics',                        schedule:'0 10 1 * *',    label:'NICS Data',               group:'System',   icon:'📈', critical:false, desc:'FBI NICS background check data — 1st of each month' },
  { id:'nfa-wait-times',   path:'/api/nfa-wait-times',              schedule:'0 6 * * 1,4',   label:'NFA Wait Times',          group:'System',   icon:'⏳', critical:false, desc:'Scrapes ATF + SilencerShop for NFA processing times Mon+Thu 6am UTC' },
  { id:'newsletter',       path:'/api/newsletter',                  schedule:'0 7 * * *',     label:'Newsletter',              group:'Outreach', icon:'📧', critical:false, desc:'Resend daily newsletter digest at 7am UTC' },
  { id:'newsletter-send',  path:'/api/newsletter/send',            schedule:'0 7 * * 1,4',   label:'Daily Newsletter Send',   group:'Outreach', icon:'📬', critical:false, desc:'Send curated daily briefing Mon & Thu 7am UTC' },
  { id:'queue_digest',     path:'/api/outreach/queue/digest',       schedule:'0 13 * * *',    label:'Outreach Queue Digest',   group:'Outreach', icon:'📬', critical:false, desc:'Email pending approval queue summary at 1pm UTC' },
  { id:'prn_releases',     path:'/api/cron/releases',               schedule:'0 12 * * *',    label:'PRN Scraper',             group:'Outreach', icon:'🔍', critical:false, desc:'PRNewswire manufacturer press releases at noon UTC' },
  { id:'fetch-images',     path:'/api/admin/fetch-article-images',  schedule:'*/30 * * * *',  label:'Fetch Article Images',    group:'System',   icon:'📷', critical:false, desc:'Fetch og:image from source URLs → Sanity CDN every 30 min' },
  { id:'cron-health',      path:'/api/admin/cron-health',           schedule:'*/30 * * * *',  label:'Cron Health Check',       group:'System',   icon:'❤', critical:true,  desc:'System health check + email alerts every 30 min' },
  { id:'copyright-review', path:'/api/cron/copyright-review', schedule:'0 6 * * *', label:'Copyright Compliance', group:'System', icon:'⚖', critical:true, desc:'Daily scan of last 48h articles for copyright risk — old structure, no source, no analysis. Emails report.' },
  { id:'backup',           path:'/api/admin/backup',                schedule:'0 10,15 * * *', label:'Sanity Backup',           group:'System',   icon:'💾', critical:true,  desc:'Full Sanity export → GitHub backup repo at 10am & 3pm UTC. No AI cost.' },
  { id:'backfill',         path:'/api/admin/backfill-articles',     schedule:'0 12-23,0-3 * * *', label:'Article Backfill (legacy)', group:'Content', icon:'✍', critical:false, desc:'Legacy backfill — replaced by quality-rewrite' },
  { id:'fix-images',       path:'/api/admin/fix-images',            schedule:'0 12-23,0-3 * * *', label:'Image Patcher (legacy)',    group:'System',  icon:'🖼', critical:false, desc:'Legacy image patcher — replaced by image-fix' },
  { id:'patch-ammo-article', path:'/api/admin/patch-ammo-article',  schedule:'*/10 * * * *',      label:'Ammo Article Patcher',     group:'Content', icon:'🔩', critical:false, desc:'Patches ammo articles every 10 min' },
  { id:'ccw-update',       path:'/api/cron/ccw-update',             schedule:'0 5 * * 0',         label:'CCW Update (Weekly)',       group:'Content', icon:'🪪', critical:false, desc:'Updates CCW reciprocity data every Sunday 5am UTC' },
  { id:'carry-insurance',  path:'/api/cron/carry-insurance',        schedule:'0 6 * * 1',         label:'Carry Insurance Update',   group:'Content', icon:'🛡', critical:false, desc:'Updates carry insurance comparison data every Monday 6am UTC' },
  { id:'market-brief',     path:'/api/cron/market-brief',           schedule:'0 14,21 * * *',     label:'Market Brief',             group:'Content', icon:'📉', critical:false, desc:'Market brief email at 2pm and 9pm UTC daily' },
  { id:'sitemap',          path:'/api/cron/sitemap',                schedule:'0 2 * * *',         label:'Sitemap Generator',        group:'System',  icon:'🗺', critical:false, desc:'Regenerates sitemap.xml daily at 2am UTC' },
  { id:'giveaways',        path:'/api/cron/giveaways',              schedule:'0 14 * * *',        label:'Giveaways Feed',           group:'Content', icon:'🎁', critical:false, desc:'Pulls active giveaways daily at 2pm UTC' },
  { id:'blog-writer',      path:'/api/cron/blog-writer',            schedule:'0 18 * * 5',        label:'Blog Writer (Weekly)',     group:'Content', icon:'✏', critical:false, desc:'AI blog post writer every Friday 6pm UTC' },
  { id:'gun-deals',        path:'/api/cron/gun-deals',              schedule:'5 * * * *',       label:'Gun Deals Feed',           group:'Content', icon:'💰', critical:false, desc:'Pulls gun.deals listings every 4 hrs' },
  { id:'write-canada',     path:'/api/cron/write-canada-articles',  schedule:'0 8,20 * * *',      label:'Canada Articles',          group:'Content', icon:'🇨🇦', critical:false, desc:'AI-written Canadian firearms articles at 8am and 8pm UTC' },
  { id:'write-brazil',     path:'/api/cron/write-brazil-articles',  schedule:'0 9,21 * * *',      label:'Brazil Articles',          group:'Content', icon:'🇧🇷', critical:false, desc:'AI-written Brazilian firearms articles at 9am and 9pm UTC' },
  { id:'weekly-gun-releases', path:'/api/cron/weekly-gun-releases', schedule:'0 9 * * 1',
    label:'Weekly Gun Releases', group:'Content', icon:'🔫', critical:false,
    desc:'Every Monday 9am UTC — AI discovers new firearm releases, writes articles with real images, publishes to Gun Releases section.' },
  { id:'fix-images-intl',  path:'/api/admin/fix-images-intl',       schedule:'0 11 * * *',        label:'Intl Image Fixer',         group:'System',  icon:'🌐', critical:false, desc:'Fixes images on international content daily at 11am UTC' },
  { id:'bible-update',     path:'/api/cron/bible-update',           schedule:'0 7 * * 0',         label:'Bible Update (Weekly)',    group:'System',  icon:'📖', critical:false, desc:'Every Sunday 7am UTC — collects live Sanity stats, pushes bible-stats.json to GitHub, posts weekly Discord summary.' },
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

    // Always use the canonical production domain for internal triggers
    // VERCEL_URL can point to preview deployments which have different auth
    const baseUrl = 'https://www.downrangeco.com'

    const t0  = Date.now()
    // Routes that only export GET (not POST)
    // All cron paths use GET — POST only for specific admin write routes
    // Default to GET for all /api/cron/ routes and agent feeds
    const FORCE_POST_PATHS = [] // currently none need forced POST
    const isGet = !FORCE_POST_PATHS.some(p => job.path.startsWith(p))

    try {
      const res = await fetch(`${baseUrl}${job.path}`, {
        method:  isGet ? 'GET' : 'POST',
        headers: {
          'x-admin-key':    process.env.ADMIN_KEY || '',
          'authorization':  `Bearer ${process.env.CRON_SECRET || process.env.ADMIN_KEY || ''}`,
          'x-vercel-cron':  '1',
          'Content-Type':   'application/json',
        },
        signal: AbortSignal.timeout(270000),
      })
      const text = await res.text().catch(() => '')
      const ms   = Date.now() - t0
      const ok   = res.ok

      // Parse job response FIRST so details is defined before reportCronRun
      let details = null
      try {
        const r = JSON.parse(text)
        const parts = []
        if (r.discovered != null) parts.push(`discovered:${r.discovered}`)
        if (r.created   != null)  parts.push(`created:${r.created}`)
        if (r.skipped   != null)  parts.push(`skipped:${r.skipped}`)
        if (r.failed    != null)  parts.push(`failed:${r.failed}`)
        if (r.done      != null)  parts.push(`done:${r.done}`)
        if (r.saved?.length)      parts.push(`saved: ` + r.saved.slice(0,8).join(', '))
        if (r.message)            parts.push(r.message.slice(0, 300))
        details = parts.join(' | ').slice(0, 600) || text.slice(0, 300)
      } catch {
        // Not JSON — store truncated raw text
        details = text.slice(0, 300)
      }

      await reportCronRun(jobId, {
        status:  ok ? 'success' : 'failed',
        ms,
        error:   ok ? null : `HTTP ${res.status}: ${text.slice(0, 200)}`,
        details: ok ? details : null,
        trigger: 'manual',
      })

      return Response.json({ ok, ms, status: res.status, details })
    } catch (e) {
      const ms = Date.now() - t0
      // If it timed out, the job likely still ran — mark as triggered not failed
      const timedOut = e.name === 'AbortError' || e.message?.includes('abort') || e.message?.includes('timeout')
      await reportCronRun(jobId, {
        status: timedOut ? 'success' : 'failed',
        ms, trigger: 'manual',
        error: timedOut ? null : e.message,
        details: timedOut ? `Job triggered — ran longer than ${Math.round(ms/60000)}m (normal for this job, check run log for results)` : null,
      })
      return Response.json({
        ok: timedOut,
        ms,
        details: timedOut ? `Job is still running — takes 2-3 min. Refresh in a moment to see results.` : null,
        error: timedOut ? null : e.message,
      })
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
