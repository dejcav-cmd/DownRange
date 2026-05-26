export const dynamic = 'force-dynamic'
/**
 * Agent API Route — triggered by Vercel cron jobs
 * Also accepts manual GET with Authorization: Bearer CRON_SECRET
 *
 * Vercel cron automatically sends:
 *   Authorization: Bearer <CRON_SECRET>
 * So CRON_SECRET MUST be set in Vercel env vars.
 * Without it, process.env.CRON_SECRET is undefined and the check becomes
 *   authHeader !== 'Bearer undefined'  which ALWAYS fails.
 *
 * Fix: also accept x-vercel-cron header as a secondary auth path,
 * and handle missing CRON_SECRET gracefully.
 */
export async function GET(req) {
  const authHeader   = req.headers.get('authorization')
  const cronHeader   = req.headers.get('x-vercel-cron')  // Vercel sets this on cron calls
  const secret       = process.env.CRON_SECRET

  const isValidBearer = secret && authHeader === `Bearer ${secret}`
  const isVercelCron  = cronHeader === '1'  // Vercel internal cron marker

  if (!isValidBearer && !isVercelCron) {
    console.error('[AGENT] Auth failed. authHeader:', authHeader, '| CRON_SECRET set:', !!secret)
    return Response.json({ error: 'Unauthorized', hint: 'Set CRON_SECRET in Vercel env vars' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const feed = searchParams.get('feed') || 'news'

  console.log(`[AGENT] Running feed: ${feed} | triggered by: ${isVercelCron ? 'vercel-cron' : 'manual'}`)

  try {
    let result
    switch (feed) {
      case 'news': {
        const { runNewsFeed }     = await import('../../../agent/feeds/news.js')
        result = await runNewsFeed()
        break
      }
      case 'laws': {
        const { runLawsFeed }     = await import('../../../agent/feeds/laws.js')
        result = await runLawsFeed()
        break
      }
      case 'releases': {
        const { runReleasesFeed } = await import('../../../agent/feeds/releases.js')
        result = await runReleasesFeed()
        break
      }
      case 'market': {
        const { runMarketFeed }   = await import('../../../agent/feeds/market.js')
        result = await runMarketFeed()
        break
      }
      case 'video': {
        const { runVideoFeed }    = await import('../../../agent/feeds/video.js')
        result = await runVideoFeed()
        break
      }
      case 'state': {
        const { runStateFeed }    = await import('../../../agent/feeds/state.js')
        result = await runStateFeed()
        break
      }
      default:
        return Response.json({ error: `Unknown feed: ${feed}` }, { status: 400 })
    }
    return Response.json({ success: true, feed, result })
  } catch (err) {
    console.error(`[AGENT] Error [${feed}]:`, err)
    return Response.json({ error: err.message, feed }, { status: 500 })
  }
}

export async function POST(req) {
  // Allow POST with same auth (for manual triggers from admin panel)
  return GET(req)
}
