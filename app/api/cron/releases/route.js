export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * GET /api/cron/releases
 *
 * Called by Vercel Cron daily at 7:00 AM ET.
 * Scrapes PRNewswire for new firearm product announcements,
 * extracts structured data via Claude AI, saves to Sanity.
 *
 * Secured by CRON_SECRET (set in Vercel env vars).
 */

import { scrapeReleases } from '@/lib/scrapeReleases'

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[releases-cron] Starting scrape:', new Date().toISOString())

    const results = await scrapeReleases({ limit: 10, onlyNew: true })

    console.log('[releases-cron] Done:', results)

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      added: results.added.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      details: results,
    })
  } catch (err) {
    console.error('[releases-cron] Error:', err)
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
