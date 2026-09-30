export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

// Daily automatic deal cleanup. Deletes gunDeal documents older than the number of
// days DJ sets in Admin > Content > Cleanup (cleanupSettings.dealsAutoDays), only
// while dealsAutoEnabled is on. No backup for deals (DJ, Sep 2026). Editor-locked
// deals are kept. 240s budget; anything left is picked up on the next run.

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const isCron = !!cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`
  const key = req.headers.get('x-admin-key')
  const isAdmin = !!key && key === (process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY)
  if (!isCron && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  try {
    const cfg = await sanity.fetch('*[_id=="cleanupSettings"][0]')
    if (!cfg?.dealsAutoEnabled) {
      await reportCronRun('cleanup-deals', { status: 'success', ms: Date.now() - t0, details: 'Auto-delete off (Admin > Content > Cleanup)' })
      return Response.json({ ok: true, skipped: 'disabled' })
    }
    const days = Math.max(7, parseInt(cfg.dealsAutoDays, 10) || 30)
    const cutoff = new Date(Date.now() - days * 86400000).toISOString()
    const ids = await sanity.fetch(
      `*[_type=="gunDeal" && !(_id in path("drafts.**")) && defined(publishedAt) && publishedAt < $cutoff && editorLocked != true]._id`,
      { cutoff }
    )
    let deleted = 0
    for (let i = 0; i < ids.length; i += 100) {
      if (Date.now() - t0 > 240_000) break
      const tx = sanity.transaction()
      ids.slice(i, i + 100).forEach(id => tx.delete(id))
      await tx.commit({ visibility: 'async' })
      deleted += Math.min(100, ids.length - i)
    }
    const remaining = ids.length - deleted
    const lastRun = { at: new Date().toISOString(), days, deleted, remaining }
    await sanity.patch('cleanupSettings').set({ lastRun }).commit().catch(() => {})
    await reportCronRun('cleanup-deals', { status: 'success', ms: Date.now() - t0, details: `Deleted ${deleted} deals older than ${days}d${remaining ? ` (${remaining} left for next run)` : ''}` })
    return Response.json({ ok: true, ...lastRun })
  } catch (e) {
    await reportCronRun('cleanup-deals', { status: 'failed', ms: Date.now() - t0, error: e.message }).catch(() => {})
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
