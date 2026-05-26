export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/admin/scrape-releases
 * Body: { limit?: number, force?: boolean }
 *
 * Manually trigger the releases scraper from the admin panel.
 * force=true skips duplicate check (re-processes already-seen URLs).
 * Secured by ADMIN_KEY.
 */

import { scrapeReleases } from '@/lib/scrapeReleases'

export async function POST(request) {
  const adminKey = request.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const limit = Math.min(50, parseInt(body.limit || '10'))
    const force = body.force === true

    const results = await scrapeReleases({ limit, onlyNew: !force })

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      added: results.added.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      details: results,
    })
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
