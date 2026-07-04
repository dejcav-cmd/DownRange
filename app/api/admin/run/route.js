export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { logPull, STATUS } from '@/lib/pullLogger'

/**
 * POST /api/admin/run?feed=news
 * Manual feed trigger — no CRON_SECRET needed from admin UI.
 * Writes to pull log so dashboard shows activity.
 */
export async function POST(req) {
  const adminKey = process.env.ADMIN_KEY
  const key      = req.headers.get('x-admin-key')

  if (!adminKey) return Response.json({ error: 'Server misconfigured' }, { status: 500 })
  if (key !== adminKey) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const feed = searchParams.get('feed') || 'news'
  const t    = Date.now()

  console.log(`[ADMIN/RUN] ▶ feed=${feed}`)

  // Log as pending immediately so dashboard shows activity
  await logPull({
    sourceId:  feed,
    status:    STATUS.PENDING,
    meta:      { triggeredBy: 'manual', feed },
  })

  try {
    let result
    switch (feed) {
      case 'news':     { const { runNewsFeed }     = await import('../../../../agent/feeds/news.js');     result = await runNewsFeed();     break }
      case 'laws':     { const { runLawsFeed }     = await import('../../../../agent/feeds/laws.js');     result = await runLawsFeed();     break }
      case 'releases': { const { runReleasesFeed } = await import('../../../../agent/feeds/releases.js'); result = await runReleasesFeed(); break }
      case 'video':    { const { runVideoFeed }    = await import('../../../../agent/feeds/video.js');    result = await runVideoFeed();    break }
      case 'state':    { const { runStateFeed }    = await import('../../../../agent/feeds/state.js');    result = await runStateFeed();    break }
      default: return Response.json({ error: `Unknown feed: ${feed}` }, { status: 400 })
    }

    const ms      = Date.now() - t
    const done    = result?.done ?? result?.published ?? result?.processed ?? 0
    const total   = result?.total ?? result?.items ?? done
    const withAI  = result?.withAI ?? 0

    // Log success to pull log
    await logPull({
      sourceId:  feed,
      status:    done > 0 ? STATUS.SUCCESS : STATUS.PARTIAL,
      itemCount: total,
      newItems:  done,
      duration:  ms,
      meta:      { triggeredBy: 'manual', feed, withAI, claudeUp: result?.claudeUp },
      headlines: result?.headlines || [],
    })

    console.log(`[ADMIN/RUN] ✓ feed=${feed} done=${done} total=${total} ms=${ms}`)
    return Response.json({
      success: true, feed,
      result: { done, total, withAI, claudeUp: result?.claudeUp, ...result },
      ms,
    })
  } catch (err) {
    const ms = Date.now() - t
    console.error(`[ADMIN/RUN] ✗ ${feed}: ${err.message}`)

    // Log failure
    await logPull({
      sourceId: feed,
      status:   STATUS.FAILED,
      duration: ms,
      error:    err.message,
      meta:     { triggeredBy: 'manual', feed },
    })

    return Response.json({
      error: err.message,
      hint: err.message.includes('Cannot find module')
        ? `Agent file for '${feed}' feed threw an import error. Check agent/feeds/${feed}.js exists.`
        : err.message.includes('SANITY_API_TOKEN')
        ? 'SANITY_API_TOKEN not set in Vercel env vars — articles cannot be saved.'
        : null,
      feed, ms,
    }, { status: 500 })
  }
}

export async function GET(req) { return POST(req) }
