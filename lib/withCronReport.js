// Wraps a cron route handler so scheduled runs are recorded in Mission Control
// (cronRun history) without touching the handler's own logic. Only runs invoked
// by the Vercel scheduler are recorded; manual/admin calls pass straight through.
import { reportCronRun } from './cronReporter'

function isScheduled(req) {
  const h = req?.headers
  if (!h) return false
  return h.get('x-vercel-cron') === '1' || /vercel-cron/i.test(h.get('user-agent') || '')
}

export function withCronReport(jobId, handler) {
  return async function GET(req, ctx) {
    if (!isScheduled(req)) return handler(req, ctx)
    const t0 = Date.now()
    try {
      const res = await handler(req, ctx)
      let details = null
      try {
        const body = await res.clone().json()
        details = JSON.stringify(body).slice(0, 160)
      } catch {}
      await reportCronRun(jobId, {
        status: res.ok ? 'success' : 'failed',
        ms: Date.now() - t0,
        details,
        error: res.ok ? null : `HTTP ${res.status}${details ? ' ' + details : ''}`,
      }).catch(() => {})
      return res
    } catch (err) {
      await reportCronRun(jobId, { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
      throw err
    }
  }
}
