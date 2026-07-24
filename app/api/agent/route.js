export const dynamic = 'force-dynamic'
import { reportCronRun } from '@/lib/cronReporter'
import { sendCronAlert, shouldAlertConsecutive } from '@/lib/cronAlert'
import { logPull, STATUS } from '@/lib/pullLogger'
export const maxDuration = 300  // 5 minutes — required for feed processing

function formatDetails(feed, result) {
  if (!result) return `${feed} completed`
  const r = result

  // Helper: append headlines list to a summary string
  const withHeadlines = (summary) => {
    const titles = r.headlines || r.saved || []
    if (!titles.length) return summary + ' | None pulled'
    return summary + ' | ' + titles.slice(0, 15).join(' · ')
  }

  // News feed
  if (r.done != null && r.total != null && r.withAI != null) {
    const base = `${r.done} published (${r.withAI} AI, ${r.done - r.withAI} raw) of ${r.total} fetched · ${r.dupes || 0} dupes`
    const gateStr = r.gates ? ` | gates: ${JSON.stringify(r.gates)}` : ''
    return withHeadlines(base) + gateStr
  }

  // Video feed
  if (r.summary && r.channelLog != null) {
    if (r.fatal) return `FATAL: ${r.fatal}`
    const errSuffix = r.errors?.length ? ` | ${r.errors.length} errors: ${r.errors[0].slice(0,80)}` : ''
    return r.summary + errSuffix + (r.channelLog?.length ? ' | ' + r.channelLog.slice(0,10).join(' · ') : '')
  }

  // Releases (has saved + skippedTitles + errors)
  if (r.done != null && r.failed != null && r.candidates != null) {
    const base = `${r.done} saved · ${r.skipped||0} skipped · ${r.failed} failed · ${r.candidates} candidates`
    const savedLine   = r.saved?.length       ? ' | Saved: '   + r.saved.slice(0,15).join(' · ')         : ' | None saved'
    const errLine     = r.errors?.length      ? ' | Errors: '  + r.errors.slice(0,3).join('; ')          : ''
    const skipLine    = r.skippedTitles?.length ? ' | Skipped: ' + r.skippedTitles.slice(0,5).join(' · ') : ''
    return base + savedLine + errLine + skipLine
  }

  // Laws, GOA, Giveaways, Outdoors, Blog — all now return saved/headlines
  if (r.done != null && r.failed != null) {
    const base = `${r.done} saved · ${r.failed} failed`
    return withHeadlines(base)
  }

  // GOA specific (done + total)
  if (r.done != null && r.total != null) {
    const base = `${r.done} of ${r.total} saved`
    return withHeadlines(base)
  }

  // Giveaways / Blog / Outdoors (done + skipped/errors)
  if (r.done != null && (r.skipped != null || r.errors != null)) {
    const base = `${r.done} saved · ${r.skipped||0} skipped · ${r.errors?.length||0} errors`
    return withHeadlines(base)
  }

  // Market (just done count — calibers)
  if (r.done != null) {
    return withHeadlines(`${r.done} items processed`)
  }

  // Fallback
  return Object.entries(r)
    .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ')
    .slice(0, 300)
}

/**
 * Agent API Route
 * Triggered by Vercel cron (x-vercel-cron: 1 header) or manually with Bearer token.
 *
 * VERCEL CRON AUTH:
 *   Vercel sends `Authorization: Bearer <CRON_SECRET>` on all cron requests.
 *   CRON_SECRET must be set in Vercel env vars. Without it every cron = 401.
 *   Fallback: also accepts x-vercel-cron: 1 (internal Vercel header).
 */
export async function GET(req) {
  const authHeader  = req.headers.get('authorization')
  const cronHeader  = req.headers.get('x-vercel-cron')
  const secret      = process.env.CRON_SECRET
  const adminKey    = process.env.ADMIN_KEY

  const isVercelCron  = cronHeader === '1'
  const isValidCron   = secret && authHeader === 'Bearer ' + secret
  const isValidAdmin  = adminKey && authHeader === 'Bearer ' + adminKey
  const isXAdminKey   = req.headers.get('x-admin-key') === adminKey && !!adminKey
  // If CRON_SECRET is not configured, allow Vercel cron calls through (no secret = no restriction)
  const noSecretConfigured = !secret

  if (!isVercelCron && !isValidCron && !isValidAdmin && !isXAdminKey && !noSecretConfigured) {
    console.error('[AGENT] 401 — CRON_SECRET set:', !!secret, '| x-vercel-cron:', cronHeader)
    return Response.json({
      error: 'Unauthorized — set CRON_SECRET in Vercel env vars',
    }, { status: 401 })
  }

  if (noSecretConfigured && !isVercelCron && !isValidAdmin && !isXAdminKey) {
    console.warn('[AGENT] Running without CRON_SECRET — set it in Vercel for security')
  }

  const { searchParams } = new URL(req.url)
  const feed = searchParams.get('feed') || 'news'
  const t    = Date.now()

  console.log(`[AGENT] ▶ feed=${feed} | cron=${isVercelCron} | admin=${isValidAdmin}`)

  try {
    let result
    switch (feed) {
      case 'news':     { const { runNewsFeed }     = await import('../../../agent/feeds/news.js');     result = await runNewsFeed();     break }
      case 'laws':     { const { runLawsFeed }     = await import('../../../agent/feeds/laws.js');     result = await runLawsFeed();     break }
      case 'releases': {
        const { scrapeReleases, processReleases, runReleasesFeed } = await import('../../../agent/feeds/releases.js')
        const phase    = req.nextUrl?.searchParams?.get('phase') || 'both'
        const backfill = req.nextUrl?.searchParams?.get('backfill') === '1'
        if (phase === 'scrape')       result = await scrapeReleases({ backfill })
        else if (phase === 'process') result = await processReleases({ backfill })
        else                          result = await runReleasesFeed()
        break
      }
      case 'video':    { const { runVideoFeed }    = await import('../../../agent/feeds/video.js');    result = await runVideoFeed();    break }
      case 'state':    { const { runStateFeed }    = await import('../../../agent/feeds/state.js');    result = await runStateFeed();    break }
      case 'goa':      { const { runGOAFeed }      = await import('../../../agent/feeds/goa.js');      result = await runGOAFeed();      break }
      case 'giveaways':{ const { runGiveawaysFeed } = await import('../../../agent/feeds/giveaways.js'); result = await runGiveawaysFeed(); break }
      case 'outdoors': { const { runOutdoorsFeed }  = await import('../../../agent/feeds/outdoors.js');  result = await runOutdoorsFeed();  break }
      case 'blog':     { const { runBlogFeed }     = await import('../../../agent/feeds/blog.js');     result = await runBlogFeed();     break }
      default: return Response.json({ error: `Unknown feed: ${feed}` }, { status: 400 })
    }
    console.log(`[AGENT] ✓ feed=${feed} done in ${Date.now()-t}ms`)
    // Notify alert system of success (resets consecutive fail counter)
    fetch(`${req.nextUrl?.origin || 'https://www.downrangeco.com'}/api/system/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: feed, sourceLabel: `Agent: ${feed}`, status: 'success' }),
    }).catch(() => {})
    await reportCronRun(feed, {
      status:  (feed === 'news' && result?.done === 0 && result?.total === 0) ? 'warning'
             : (feed === 'news' && result?.done === 0 && result?.total > 0)  ? 'warning'
             : 'success',
      ms:      Date.now()-t,
      details: result ? formatDetails(feed, result) : `${feed} completed`,
      error:   (feed === 'news' && result?.done === 0 && result?.total === 0) ? 'Zero items fetched — RSS feeds may be blocked or returning empty'
             : (feed === 'news' && result?.done === 0 && result?.total > 0)  ? `All ${result.total} items were duplicates — dedup cache may be stale`
             : null,
    })
    // Log to pull log dashboard
    logPull({
      sourceId:  feed,
      status:    STATUS.SUCCESS,
      itemCount: result?.done ?? result?.total ?? 0,
      newItems:  result?.done ?? 0,
      duration:  Date.now()-t,
      headlines: result?.headlines || [],
    }).catch(() => {})

    // ── Sitemap ping — notify Google + IndexNow when new articles saved ──
    const newCount = result?.done ?? result?.saved ?? 0
    if (newCount > 0 && ['news','blog','releases','goa','laws'].includes(feed)) {
      // Google ping (asks Googlebot to re-crawl sitemap)
      fetch('https://www.google.com/ping?sitemap=https://downrangeco.com/sitemap.xml').catch(() => {})
      fetch('https://www.google.com/ping?sitemap=https://downrangeco.com/news-sitemap.xml').catch(() => {})
      // Bing/IndexNow ping for immediate indexing
      if (result?.slugs?.length > 0) {
        fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: 'downrangeco.com',
            key: process.env.INDEXNOW_KEY || 'downrangeco',
            urlList: result.slugs.slice(0, 100).map(s => `https://downrangeco.com/news/${s}`),
          }),
        }).catch(() => {})
      }
    }

    return Response.json({ success: true, feed, result, ms: Date.now()-t })
  } catch (err) {
    console.error(`[AGENT] ✗ feed=${feed} error:`, err.message)
    // Notify alert system of failure
    fetch(`${req.nextUrl?.origin || 'https://www.downrangeco.com'}/api/system/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: feed, sourceLabel: `Agent: ${feed}`, status: 'failed', error: err.message }),
    }).catch(() => {})
    await reportCronRun(feed, { status:'failed', ms:Date.now()-t, error:err.message })
    // Email alert on 3 consecutive failures for critical feeds
    const CRITICAL_FEEDS = ['news', 'laws', 'gun-deals']
    if (CRITICAL_FEEDS.includes(feed)) {
      const shouldAlert = await shouldAlertConsecutive(feed, 3).catch(() => false)
      if (shouldAlert) {
        const alertBody = `DownRange feed "${feed}" failed 3x in a row: ${err.message.slice(0, 100)}`
        sendCronAlert(alertBody, {
          jobId: feed,
          context: {
            error: err.message,
            stack: err.stack,
            meta: {
              feed,
              consecutiveFailures: 3,
              lastRunMs: Date.now() - t,
              env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
            },
          },
        }).catch(() => {})
      }
    }
    logPull({
      sourceId: feed,
      status:   STATUS.FAILED,
      itemCount:0, newItems:0,
      duration: Date.now()-t,
      error:    err.message,
    }).catch(() => {})
    return Response.json({ error: err.message, feed, ms: Date.now()-t }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
