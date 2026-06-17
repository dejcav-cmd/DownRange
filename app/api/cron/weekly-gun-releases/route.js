export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { reportCronRun } from '@/lib/cronReporter'
import { runReleasesFeed } from '@/agent/feeds/releases.js'

export async function GET(req) {
  const t0     = Date.now()
  const auth   = req.headers.get('authorization')
  const cron   = req.headers.get('x-vercel-cron')
  const admin  = req.headers.get('x-admin-key')
  const secret = process.env.CRON_SECRET

  if (cron !== '1' && auth !== `Bearer ${secret}` && admin !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[WEEKLY-RELEASES] Delegating to runReleasesFeed (Google News + Fusion)...')
    const result = await runReleasesFeed()
    const ms = Date.now() - t0
    const details = `discovered:${result.candidates||0} created:${result.done} skipped:${result.skipped} failed:${result.failed} (${ms}ms)` +
      (result.saved?.length ? ' | Saved: ' + result.saved.join(', ') : ' | None saved')

    await reportCronRun('weekly-gun-releases', { status: 'success', ms, details }).catch(() => {})

    return Response.json({
      ok: true,
      discovered: result.candidates || 0,
      created: result.done,
      skipped: result.skipped,
      failed: result.failed,
      saved: result.saved || [],
      ms,
      message: details,
    })
  } catch (err) {
    const ms = Date.now() - t0
    console.error('[WEEKLY-RELEASES]', err.message)
    await reportCronRun('weekly-gun-releases', { status: 'failed', ms, error: err.message }).catch(() => {})
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
