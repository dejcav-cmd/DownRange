import { reportCronRun } from '@/lib/cronReporter'
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

    const results = await scrapeReleases({ limit: 20, onlyNew: true })

    console.log('[releases-cron] Done:', results)

    const status = results.added.length > 0 ? 'success' : results.failed.length > 0 ? 'failed' : 'partial'
    fetch('https://www.downrangeco.com/api/system/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'prn_scraper', sourceLabel: 'PRN Releases Scraper', status, error: results.failed.map(f=>f.error).join('; ') || null }),
    }).catch(() => {})

    await reportCronRun('prn_releases', { status:'success', ms:Date.now()-start, details: results.added.length+' added, '+results.failed.length+' failed' }).catch(()=>{})
    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      added: results.added.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      details: results,
    })
  } catch (err) {
    await reportCronRun('prn_releases', { status:'failed', ms:Date.now()-start, error:err.message }).catch(()=>{})
    console.error('[releases-cron] Error:', err)
    fetch('https://www.downrangeco.com/api/system/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'prn_scraper', sourceLabel: 'PRN Releases Scraper', status: 'failed', error: err.message }),
    }).catch(() => {})
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
