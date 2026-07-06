export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { reportCronRun } from '@/lib/cronReporter'
import { POST as writeBrazil } from '@/app/api/admin/write-brazil-articles/route'

export async function GET(req) {
  const auth   = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  const isCron = req.headers.get('x-vercel-cron') === '1'
  const isAdmin = req.headers.get('x-admin-key') === process.env.ADMIN_KEY
  if (!isCron && !(secret && auth === 'Bearer ' + secret) && !isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const t0 = Date.now()
  try {
    const fakeReq = new Request('https://downrangeco.com/api/admin/write-brazil-articles', {
      method: 'POST',
      headers: { 'x-admin-key': process.env.ADMIN_KEY || '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 1 }),
    })
    const res = await writeBrazil(fakeReq)
    const d = await res.json().catch(() => ({}))
    const ms = Date.now() - t0
    const created = (d.results||[]).filter(r => r.status === 'created').length
    const titles = (d.results||[]).filter(r => r.status === 'created').map(r => r.title || r.slug || 'Unknown').join(', ')
    const details = created + ' articles created' + (titles ? ' | ' + titles : '')
    await reportCronRun('write-brazil', { status: d.ok ? 'success' : 'failed', ms, details }).catch(() => {})
    return Response.json({ ok: true, created, details, ...d })
  } catch (err) {
    const ms = Date.now() - t0
    await reportCronRun('write-brazil', { status: 'failed', ms, error: err.message }).catch(() => {})
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
