export const dynamic = 'force-dynamic'
/**
 * Admin manual feed trigger
 * GET/POST /api/admin/trigger?feed=news
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  const secret     = process.env.CRON_SECRET
  const cronHeader = req.headers.get('x-vercel-cron')

  if (!secret) {
    return Response.json({
      error: 'CRON_SECRET not configured',
      fix: 'Vercel Dashboard → Project → Settings → Environment Variables → add CRON_SECRET with any secure random value'
    }, { status: 503 })
  }

  const isValid = authHeader === `Bearer ${secret}` || cronHeader === '1'
  if (!isValid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const feed = searchParams.get('feed') || 'news'

  try {
    let result
    switch (feed) {
      case 'news':     { const { runNewsFeed }     = await import('../../../../agent/feeds/news.js');     result = await runNewsFeed();     break }
      case 'laws':     { const { runLawsFeed }     = await import('../../../../agent/feeds/laws.js');     result = await runLawsFeed();     break }
      case 'releases': { const { runReleasesFeed } = await import('../../../../agent/feeds/releases.js'); result = await runReleasesFeed(); break }
      case 'market':   { const { runMarketFeed }   = await import('../../../../agent/feeds/market.js');   result = await runMarketFeed();   break }
      case 'video':    { const { runVideoFeed }    = await import('../../../../agent/feeds/video.js');    result = await runVideoFeed();    break }
      case 'state':    { const { runStateFeed }    = await import('../../../../agent/feeds/state.js');    result = await runStateFeed();    break }
      default: return Response.json({ error: `Unknown feed: ${feed}` }, { status: 400 })
    }
    return Response.json({ success: true, feed, result })
  } catch (err) {
    return Response.json({ error: err.message, feed }, { status: 500 })
  }
}
export async function POST(req) { return GET(req) }
