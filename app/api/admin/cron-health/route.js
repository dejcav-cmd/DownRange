export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * GET /api/admin/cron-health
 * Returns complete diagnostic — env vars, cron schedule, last run times, feed status.
 * No auth required (values are booleans only, no secrets exposed).
 */
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'
import { sendSMSAlert } from '@/lib/smsAlert'

const ALERT_EMAIL = 'dejcav@gmail.com'
const ALERT_KEY   = 'dr:cron-health-last-status'

async function sendHealthAlert(issues, status) {
  if (!process.env.RESEND_API_KEY) return
  if (!issues.length) return

  // Use Redis to avoid spamming — only send if status changed
  let redis = null
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = await import('@upstash/redis')
      redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
      const lastStatus = await redis.get(ALERT_KEY)
      // Don't re-alert if same status persists (suppress for 2 hours)
      if (lastStatus === status) return
      await redis.setex(ALERT_KEY, 7200, status)  // expire after 2h so it re-alerts
    }
  } catch {}

  const { Resend } = await import('resend')
  const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")

  const color = status === 'BROKEN' ? '#ef4444' : status === 'DEGRADED' ? '#f59e0b' : '#f59e0b'
  const issueList = issues.map(i =>
    '<li style="margin-bottom:8px"><strong style="color:' + (i.severity==='CRITICAL'?'#ef4444':'#f59e0b') + '">[' + i.severity + ']</strong> ' + i.msg + '</li>'
  ).join('')

  await getResend().emails.send({
    from: 'DownRange System <dj@downrangeco.com>',
    to:   [ALERT_EMAIL],
    subject: '[DownRange Alert] ' + status + ' — ' + issues.length + ' issue' + (issues.length>1?'s':'') + ' detected',
    html: '<div style="font-family:monospace;max-width:600px;background:#09090B;color:#F0EDE6;padding:32px">'
      + '<div style="font-size:24px;font-weight:900;color:' + color + ';letter-spacing:4px;margin-bottom:8px">DOWNRANGE ALERT</div>'
      + '<div style="font-size:12px;color:#64748b;margin-bottom:24px">System status: <strong style="color:' + color + '">' + status + '</strong></div>'
      + '<ul style="padding-left:20px;line-height:2">' + issueList + '</ul>'
      + '<div style="margin-top:24px;padding:12px 16px;background:#111;border-left:3px solid #C8922A;font-size:11px;color:#94a3b8">'
      + 'Check the admin dashboard at <a href="https://downrangeco.com/admin" style="color:#C8922A">downrangeco.com/admin</a>'
      + '</div></div>',
  }).catch(e => console.error('[CRON-HEALTH] Email alert failed:', e.message))
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET    || 'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

export async function GET() {
  const t0 = Date.now()
  const now = new Date().toISOString()

  // ── ENV VAR HEALTH ────────────────────────────────────────────────────
  const env = {
    CRON_SECRET:                   { set: !!process.env.CRON_SECRET,                   critical: true,  note: 'Required for all cron jobs to authenticate' },
    ANTHROPIC_API_KEY:             { set: !!process.env.ANTHROPIC_API_KEY,             critical: true,  note: 'Required for AI article rewrites. Without it, raw RSS data is used.' },
    SANITY_API_TOKEN:              { set: !!process.env.SANITY_API_TOKEN,              critical: true,  note: 'Required for writing articles to Sanity CMS' },
    NEXT_PUBLIC_SANITY_PROJECT_ID: { set: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID, critical: true,  note: 'Required for all Sanity reads/writes' },
    RESEND_API_KEY:                { set: !!process.env.RESEND_API_KEY,                critical: false, note: 'Required for newsletter and email alerts' },
    NEWSAPI_KEY:                   { set: !!process.env.NEWSAPI_KEY,                   critical: false, note: 'Optional — adds NewsAPI.org articles to news feed' },
    GNEWS_KEY:                     { set: !!process.env.GNEWS_KEY,                     critical: false, note: 'Optional — adds GNews articles to news feed' },
    YOUTUBE_API_KEY:               { set: !!process.env.YOUTUBE_API_KEY,               critical: false, note: 'Required for live YouTube video feed' },
    GOOGLE_PLACES_API_KEY:         { set: !!process.env.GOOGLE_PLACES_API_KEY,         critical: false, note: 'Required for live range search' },
    ALGOLIA_APP_ID:                { set: !!process.env.ALGOLIA_APP_ID,                critical: false, note: 'Required for search indexing' },
    DISCORD_WEBHOOK_URL:           { set: !!process.env.DISCORD_WEBHOOK_URL,           critical: false, note: 'Optional — Discord status notifications' },
    LEGISCAN_KEY:                  { set: !!process.env.LEGISCAN_KEY,                  critical: false, note: 'Required for state legislation feed' },
  }

  const missingCritical = Object.entries(env)
    .filter(([, v]) => v.critical && !v.set)
    .map(([k]) => k)

  // ── SANITY DATA FRESHNESS ─────────────────────────────────────────────
  let sanityStatus = { connected: false, error: null, counts: {}, latest: null }
  try {
    const [articleCount, latestArticle, latestByCreated, alertCount] = await Promise.all([
      sanity.fetch(`count(*[_type == "newsArticle"])`),
      sanity.fetch(`*[_type == "newsArticle"] | order(publishedAt desc) [0] { title, publishedAt, source, category }`),
      sanity.fetch(`*[_type == "newsArticle"] | order(_createdAt desc) [0] { title, _createdAt, source }`),
      sanity.fetch(`count(*[_type == "breakingAlert" && active == true])`),
    ])
    // Use whichever is more recent: publishedAt of newest article OR _createdAt of newest doc
    const latestPublished = latestArticle?.publishedAt ? new Date(latestArticle.publishedAt).getTime() : 0
    const latestCreated   = latestByCreated?._createdAt  ? new Date(latestByCreated._createdAt).getTime()  : 0
    const latestTimestamp = Math.max(latestPublished, latestCreated)
    sanityStatus = {
      connected:    true,
      counts:       { articles: articleCount, activeAlerts: alertCount },
      latest:       latestArticle,
      latestCreated: latestByCreated,
      minutesSinceLastArticle: latestTimestamp > 0
        ? Math.round((Date.now() - latestTimestamp) / 60000)
        : null,
    }
  } catch (err) {
    sanityStatus.error = err.message
  }

  // ── CRON SCHEDULE ─────────────────────────────────────────────────────
  const crons = [
    { feed: 'news',       schedule: '*/30 * * * *', label: 'Every 30 min',  critical: true,  desc: 'RSS → AI rewrite → Sanity articles' },
    { feed: 'laws',       schedule: '0 */2 * * *',  label: 'Every 2 hrs',   critical: true,  desc: 'Congress.gov + LegiScan → legislation feed' },
    { feed: 'releases',   schedule: '0 * * * *',    label: 'Every hour',    critical: false, desc: 'Manufacturer RSS → new product releases' },
    { feed: 'market',     schedule: '0 */2 * * *',  label: 'Every 2 hrs',   critical: false, desc: 'AmmoSeek + Reddit → ammo price index' },
    { feed: 'video',      schedule: '0 */4 * * *',  label: 'Every 4 hrs',   critical: false, desc: 'YouTube API → video feed' },
    { feed: 'state',      schedule: '0 8 * * *',    label: 'Daily 8am',     critical: false, desc: 'LegiScan → per-state bill updates' },
    { feed: 'newsletter', schedule: '0 7 * * *',    label: 'Daily 7am',     critical: false, desc: 'Resend → weekly digest email' },
  ]

  // ── MISSION CONTROL: LAST NEWS CRON RUN ──────────────────────────────
  // Query this separately from article timestamps. The article-gap alert was
  // previously raised as HIGH any time no article published in 8h — but with
  // news now running every 30min, overnight quiet periods (sources not posting)
  // produce a false DEGRADED. We now check whether the cron itself has run
  // recently, and only raise HIGH if BOTH the article gap AND the cron inactivity
  // confirm the feed is actually stopped — not just that sources were quiet.
  let lastNewsCronRun = null
  let minutesSinceLastCronRun = null
  try {
    const lastRun = await sanity.fetch(
      `*[_type == "cronRun" && jobId == "news"] | order(at desc) [0] { at, status, details, error }`,
    )
    if (lastRun?.at) {
      lastNewsCronRun = lastRun
      minutesSinceLastCronRun = Math.round((Date.now() - new Date(lastRun.at).getTime()) / 60000)
    }
  } catch {}

  // ── DIAGNOSIS ─────────────────────────────────────────────────────────
  const issues = []

  if (!env.CRON_SECRET.set)
    issues.push({ severity: 'CRITICAL', msg: 'CRON_SECRET not set — ALL cron jobs return 401 Unauthorized. No data will ever update.' })

  if (!env.ANTHROPIC_API_KEY.set)
    issues.push({ severity: 'MEDIUM', msg: 'ANTHROPIC_API_KEY not set — articles publish as raw RSS text, no AI rewrite. Content quality reduced but feeds still run.' })

  if (!env.SANITY_API_TOKEN.set)
    issues.push({ severity: 'CRITICAL', msg: 'SANITY_API_TOKEN not set — feed agents cannot write to Sanity. No articles will save.' })

  if (!sanityStatus.connected)
    issues.push({ severity: 'CRITICAL', msg: `Sanity connection failed: ${sanityStatus.error}` })

  if (sanityStatus.minutesSinceLastArticle !== null) {
    // ── ADAPTIVE QUIET-PERIOD THRESHOLDS ────────────────────────────────
    // Firearms media posts far less on weekends and US federal holidays.
    // Using a flat 8h threshold causes constant false-WARNING noise all weekend.
    // Rules:
    //   Weekday (Mon-Fri), non-holiday : alert after 8h  (480 min)
    //   Weekend (Sat-Sun)              : alert after 18h (1080 min) — media goes quiet
    //   US federal holiday             : alert after 24h (1440 min) — essentially no posts
    // Only raise HIGH if the cron ALSO stopped (both article gap + cron gap confirm breakage).
    // Only raise MEDIUM if gap > threshold but cron is alive (sources quiet, not broken).
    // Below threshold → no issue emitted at all (HEALTHY if nothing else is wrong).
    const nowUtc = new Date()
    const dayOfWeek = nowUtc.getUTCDay() // 0=Sun, 6=Sat
    const mmdd = `${String(nowUtc.getUTCMonth()+1).padStart(2,'0')}-${String(nowUtc.getUTCDate()).padStart(2,'0')}`
    // US federal holidays that fall on a fixed date (the actual calendar date, not observed)
    const US_FEDERAL_HOLIDAYS = new Set([
      '01-01', // New Year's Day
      '06-19', // Juneteenth
      '07-04', // Independence Day
      '11-11', // Veterans Day
      '12-25', // Christmas Day
    ])
    // Monday holidays (observed when fixed date falls on weekend) — approximate with fixed Mon dates
    // MLK Day (3rd Mon Jan), Presidents Day (3rd Mon Feb), Memorial Day (last Mon May),
    // Labor Day (1st Mon Sep), Columbus Day (2nd Mon Oct), Thanksgiving (4th Thu Nov)
    // We can't compute "Nth Monday" cheaply here, so we cover them with the weekend threshold.
    const isHoliday   = US_FEDERAL_HOLIDAYS.has(mmdd)
    const isWeekend   = dayOfWeek === 0 || dayOfWeek === 6
    const quietThresh = isHoliday ? 1440 : isWeekend ? 1080 : 480
    const quietLabel  = isHoliday ? 'federal holiday' : isWeekend ? 'weekend' : 'weekday'

    if (sanityStatus.minutesSinceLastArticle > quietThresh) {
      // Gap exceeds even the expanded window — now check if cron also stopped.
      // If cron ran within 90min (3× the 30min interval): cron is alive, sources are dry.
      // If cron hasn't run in >90min: cron itself stopped → genuine HIGH alert.
      const cronStoppedToo = minutesSinceLastCronRun === null || minutesSinceLastCronRun > 90
      if (cronStoppedToo) {
        issues.push({ severity: 'HIGH', msg: `Last article was ${sanityStatus.minutesSinceLastArticle} minutes ago (${Math.round(sanityStatus.minutesSinceLastArticle/60)}h) AND news cron hasn't run in ${minutesSinceLastCronRun ?? 'unknown'} min — feed may have stopped. Check Vercel → Cron Jobs.` })
      } else {
        issues.push({ severity: 'MEDIUM', msg: `Last article was ${sanityStatus.minutesSinceLastArticle} minutes ago (${Math.round(sanityStatus.minutesSinceLastArticle/60)}h) but news cron is running (last run ${minutesSinceLastCronRun}min ago, status: ${lastNewsCronRun?.status}). Extended quiet period on ${quietLabel} — sources may simply not be posting.` })
      }
    }
    // Below threshold → no issue. HEALTHY unless something else is wrong.
  }

  if (!env.NEWSAPI_KEY.set && !env.GNEWS_KEY.set)
    issues.push({ severity: 'MEDIUM', msg: 'Neither NEWSAPI_KEY nor GNEWS_KEY set — news feed relies on RSS only (no API articles).' })

  const overallStatus = issues.some(i => i.severity === 'CRITICAL') ? 'BROKEN'
    : issues.some(i => i.severity === 'HIGH') ? 'DEGRADED'
    : issues.length > 0 ? 'WARNING'
    : 'HEALTHY'

  // Send email alert if degraded or broken (rate-limited via Redis)
  if (overallStatus === 'BROKEN' || overallStatus === 'DEGRADED') {
    sendHealthAlert(issues, overallStatus).catch(() => {})
    // SMS: BROKEN bypasses quiet hours, DEGRADED respects them
    const topIssue = issues[0]?.msg?.slice(0, 110) ?? 'Unknown issue'
    const smsBody = `DownRange-News ${overallStatus}: ${topIssue}`
    sendSMSAlert(smsBody, { jobId: 'cron-health', critical: overallStatus === 'BROKEN' }).catch(() => {})
  }

  // Log the health check run itself
  await reportCronRun('cron-health', {
    status: overallStatus === 'HEALTHY' ? 'success' : overallStatus === 'BROKEN' ? 'failed' : 'warning',
    ms: Date.now() - t0,
    details: overallStatus + ' — ' + issues.length + ' issue(s)',
    error: issues.length > 0 ? issues[0].msg : null,
  }).catch(() => {})

  return Response.json({
    status: overallStatus,
    timestamp: now,
    issues,
    env: Object.fromEntries(Object.entries(env).map(([k, v]) => [k, { set: v.set, critical: v.critical, note: v.note }])),
    missingCritical,
    sanity: sanityStatus,
    crons,
    fix: missingCritical.length > 0 ? {
      url: 'https://vercel.com/dashboard',
      steps: [
        '1. Go to Vercel Dashboard → your DownRange project',
        '2. Click Settings → Environment Variables',
        '3. Add each missing critical variable',
        '4. Redeploy for env vars to take effect',
        `5. Missing: ${missingCritical.join(', ')}`,
      ]
    } : null,
  })
}
