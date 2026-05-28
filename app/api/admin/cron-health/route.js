export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * GET /api/admin/cron-health
 * Returns complete diagnostic — env vars, cron schedule, last run times, feed status.
 * No auth required (values are booleans only, no secrets exposed).
 */
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

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
    { feed: 'news',     schedule: '*/15 * * * *', label: 'Every 15 min',  critical: true,  desc: 'RSS + NewsAPI + GNews → Sanity articles' },
    { feed: 'laws',     schedule: '0 */2 * * *',  label: 'Every 2 hrs',   critical: true,  desc: 'Congress.gov + LegiScan → legislation feed' },
    { feed: 'releases', schedule: '0 * * * *',    label: 'Every hour',    critical: false, desc: 'Manufacturer RSS → new product releases' },
    { feed: 'market',   schedule: '*/30 * * * *', label: 'Every 30 min',  critical: false, desc: 'AmmoSeek + Reddit → ammo price index' },
    { feed: 'video',    schedule: '0 */4 * * *',  label: 'Every 4 hrs',   critical: false, desc: 'YouTube API → video feed' },
    { feed: 'state',    schedule: '0 8 * * *',    label: 'Daily 8am',     critical: false, desc: 'LegiScan → per-state bill updates' },
    { feed: 'newsletter',schedule:'0 7 * * *',    label: 'Daily 7am',     critical: false, desc: 'Resend → weekly digest email' },
  ]

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

  if (sanityStatus.minutesSinceLastArticle !== null && sanityStatus.minutesSinceLastArticle > 480)
    issues.push({ severity: 'HIGH', msg: `Last article was ${sanityStatus.minutesSinceLastArticle} minutes ago (${Math.round(sanityStatus.minutesSinceLastArticle/60)}h). News feed may not be running — check System → Cron Jobs.` })

  if (!env.NEWSAPI_KEY.set && !env.GNEWS_KEY.set)
    issues.push({ severity: 'MEDIUM', msg: 'Neither NEWSAPI_KEY nor GNEWS_KEY set — news feed relies on RSS only (no API articles).' })

  const overallStatus = issues.some(i => i.severity === 'CRITICAL') ? 'BROKEN'
    : issues.some(i => i.severity === 'HIGH') ? 'DEGRADED'
    : issues.length > 0 ? 'WARNING'
    : 'HEALTHY'

  // Send email alert if degraded or broken (rate-limited via Redis)
  if (overallStatus === 'BROKEN' || overallStatus === 'DEGRADED') {
    sendHealthAlert(issues, overallStatus).catch(() => {})
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
