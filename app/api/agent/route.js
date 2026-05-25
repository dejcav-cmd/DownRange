export const dynamic = 'force-dynamic'
/**
 * Agent API Route — triggered by Vercel cron jobs
 * Also accepts POST with secret for manual triggering
 */
export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  // Vercel cron sends CRON_SECRET automatically
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const feed = searchParams.get('feed') || 'news'

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
    console.error(`Agent error [${feed}]:`, err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const secret = req.headers.get('x-agent-secret')
  if (secret !== process.env.AGENT_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return GET(req)
}
