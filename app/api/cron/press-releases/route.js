export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { reportCronRun } from '@/lib/cronReporter'
import { runPressPull } from '@/lib/pressPipeline'

// Twice a week (Tue + Fri): pull manufacturer press pages, rewrite each new release
// as a DownRange article that links back to the original, publish to the
// Manufacturer Press Releases section.
function isAuthorized(req) {
  const cron  = req.headers.get('x-vercel-cron')
  const auth  = req.headers.get('authorization')
  const admin = req.headers.get('x-admin-key')
  return cron === '1'
    || (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`)
    || (process.env.ADMIN_KEY && admin === process.env.ADMIN_KEY)
}

export async function GET(req) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const t0 = Date.now()
  const url = new URL(req.url)
  const opts = {
    maxCreate:  Math.min(40, parseInt(url.searchParams.get('max') || '24', 10) || 24),
    windowDays: Math.min(365, parseInt(url.searchParams.get('window') || '120', 10) || 120),
    brand:      url.searchParams.get('brand') || null,
  }
  try {
    const r = await runPressPull(opts)
    const details = `created:${r.created} skipped:${r.skipped} stale:${r.stale} failed:${r.failed} remaining:${r.remaining} (${r.ms}ms)`
      + (r.saved.length ? ' | ' + r.saved.slice(0, 6).join('; ') : ' | none new')
    await reportCronRun('press-releases', { status: 'success', ms: Date.now() - t0, details: details.slice(0, 480) }).catch(() => {})
    return Response.json({ ok: true, ...r, message: details })
  } catch (err) {
    await reportCronRun('press-releases', { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
