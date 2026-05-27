export const dynamic = 'force-dynamic'

import { getAlertConfig, setAlertConfig } from '@/lib/cronReporter'

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || req.headers.get('x-vercel-cron') === '1'
    || (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`)
}

// GET — return current alert config
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const config = await getAlertConfig()
  return Response.json({ ok: true, config })
}

// POST — save alert config
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { config } = await req.json()
  if (!config || typeof config !== 'object') return Response.json({ error: 'Invalid config' }, { status: 400 })
  await setAlertConfig(config)
  return Response.json({ ok: true })
}
