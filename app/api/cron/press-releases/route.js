export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { reportCronRun } from '@/lib/cronReporter'
import { runPressPull, runPressRepair } from '@/lib/pressPipeline'

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
    // mode=images: only fix/add real images on existing articles. Otherwise pull new releases,
    // then spend any leftover time repairing images.
    if (url.searchParams.get('mode') === 'images') {
      const rep = await runPressRepair({ max: parseInt(url.searchParams.get('max') || '30', 10), force: url.searchParams.get('force') === '1' })
      const details = `images fixed:${rep.fixed} missing:${rep.missing} failed:${rep.failed} remaining:${rep.remaining} (${rep.ms}ms)`
      await reportCronRun('press-releases', { status: 'success', ms: Date.now() - t0, details }).catch(() => {})
      return Response.json({ ok: true, mode: 'images', ...rep, message: details })
    }
    const r = await runPressPull({ ...opts, deadlineMs: 190000 })
    let rep = null
    const left = 270000 - (Date.now() - t0)
    if (left > 25000) rep = await runPressRepair({ max: 12, deadlineMs: left - 10000 }).catch(() => null)
    const details = `created:${r.created} noImage:${r.noImage} skipped:${r.skipped} stale:${r.stale} failed:${r.failed} remaining:${r.remaining}`
      + (rep ? ` | images fixed:${rep.fixed} missing:${rep.missing}` : '') + ` (${Date.now() - t0}ms)`
      + (r.saved.length ? ' | ' + r.saved.slice(0, 6).join('; ') : ' | none new')
    await reportCronRun('press-releases', { status: 'success', ms: Date.now() - t0, details: details.slice(0, 480) }).catch(() => {})
    return Response.json({ ok: true, ...r, repair: rep, message: details, done: r.done && (!rep || rep.done) })
  } catch (err) {
    await reportCronRun('press-releases', { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
