export const dynamic = 'force-dynamic'
import { reportCronRun } from '@/lib/cronReporter'
export const maxDuration = 300  // 5 minutes — required for feed processing

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

  const isValidBearer = secret && authHeader === `Bearer ${secret}`
  const isVercelCron  = cronHeader === '1'

  if (!isValidBearer && !isVercelCron) {
    console.error('[AGENT] 401 — authHeader:', authHeader?.slice(0,20), '| CRON_SECRET set:', !!secret)
    return Response.json({
      error: 'Unauthorized',
      hint: !secret
        ? 'CRON_SECRET env var is not set in Vercel. Go to: Vercel Dashboard → Project → Settings → Environment Variables'
        : 'Authorization header does not match CRON_SECRET'
    }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const feed = searchParams.get('feed') || 'news'
  const t    = Date.now()

  console.log(`[AGENT] ▶ feed=${feed} | cron=${isVercelCron} | manual=${isValidBearer}`)

  try {
    let result
    switch (feed) {
      case 'news':     { const { runNewsFeed }     = await import('../../../agent/feeds/news.js');     result = await runNewsFeed();     break }
      case 'laws':     { const { runLawsFeed }     = await import('../../../agent/feeds/laws.js');     result = await runLawsFeed();     break }
      case 'releases': { const { runReleasesFeed } = await import('../../../agent/feeds/releases.js'); result = await runReleasesFeed(); break }
      case 'market':   { const { runMarketFeed }   = await import('../../../agent/feeds/market.js');   result = await runMarketFeed();   break }
      case 'video':    { const { runVideoFeed }    = await import('../../../agent/feeds/video.js');    result = await runVideoFeed();    break }
      case 'state':    { const { runStateFeed }    = await import('../../../agent/feeds/state.js');    result = await runStateFeed();    break }
      default: return Response.json({ error: `Unknown feed: ${feed}` }, { status: 400 })
    }
    console.log(`[AGENT] ✓ feed=${feed} done in ${Date.now()-t}ms`)
    // Notify alert system of success (resets consecutive fail counter)
    fetch(`${req.nextUrl?.origin || 'https://www.downrangeco.com'}/api/system/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: feed, sourceLabel: `Agent: ${feed}`, status: 'success' }),
    }).catch(() => {})
    await reportCronRun(feed, { status:'success', ms:Date.now()-t, details: result ? JSON.stringify(result).slice(0,100) : undefined })
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
    return Response.json({ error: err.message, feed, ms: Date.now()-t }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
