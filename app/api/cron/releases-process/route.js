/**
 * /api/cron/releases-process
 *
 * Phase-2 worker: dequeues and fully processes releases from Redis.
 * Called immediately after /api/agent?feed=releases&phase=scrape.
 * Also used for the full backfill drain.
 *
 * ?backfill=1  — drain the backfill queue (no 6-month cutoff)
 * ?backfill=0  — drain the regular queue  (default)
 */
export const dynamic    = 'force-dynamic'
export const maxDuration = 300

import { processReleases } from '@/agent/feeds/releases.js'

function isAuth(req) {
  const cron   = req.headers.get('x-vercel-cron')
  const bearer = req.headers.get('authorization')
  const admin  = req.headers.get('x-admin-key')
  return (
    cron === '1' ||
    (process.env.CRON_SECRET  && bearer === `Bearer ${process.env.CRON_SECRET}`)  ||
    (process.env.ADMIN_KEY    && admin  === process.env.ADMIN_KEY)
  )
}

export async function GET(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const backfill = req.nextUrl?.searchParams?.get('backfill') === '1'
  const result   = await processReleases({ backfill })

  return Response.json({ ok: true, ...result })
}
