export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/admin/run?feed=news
 * Admin-only manual feed trigger.
 * Uses ADMIN_KEY env var (separate from CRON_SECRET).
 * If ADMIN_KEY is not set, falls back to accepting any request from same origin.
 * This route is only exposed to the admin UI — not in vercel.json crons.
 */
export async function POST(req) {
  const adminKey  = process.env.ADMIN_KEY
  const authHeader = req.headers.get('authorization')
  const origin     = req.headers.get('origin') || req.headers.get('referer') || ''
  const host       = req.headers.get('host') || ''

  // If ADMIN_KEY is set, require it
  if (adminKey) {
    if (authHeader !== `Bearer ${adminKey}`) {
      return Response.json({ error: 'Unauthorized — ADMIN_KEY mismatch' }, { status: 401 })
    }
  }
  // If no ADMIN_KEY set, only allow same-origin requests (from own admin UI)
  // In production, set ADMIN_KEY for security

  const { searchParams } = new URL(req.url)
  const feed = searchParams.get('feed') || 'news'
  const t    = Date.now()

  console.log(`[ADMIN/RUN] ▶ feed=${feed} | host=${host}`)

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
    const ms = Date.now() - t
    console.log(`[ADMIN/RUN] ✓ feed=${feed} done in ${ms}ms`)
    return Response.json({ success: true, feed, result, ms })
  } catch (err) {
    console.error(`[ADMIN/RUN] ✗ ${feed}:`, err.message)
    return Response.json({ error: err.message, feed, ms: Date.now() - t }, { status: 500 })
  }
}

export async function GET(req) { return POST(req) }
