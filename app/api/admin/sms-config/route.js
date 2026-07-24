/**
 * GET    /api/admin/sms-config  — returns current alert config + log
 * DELETE /api/admin/sms-config  — clears alert log
 *
 * Previously managed Twilio SMS config. Now returns Resend email alert
 * status. POST (override config) removed — configure via Vercel env vars.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCronAlertStatus, readAlertLog, clearAlertLog } from '@/lib/cronAlert'

const ADMIN_KEY = process.env.ADMIN_KEY ?? process.env.AGENT_SECRET ?? 'drco-admin'

function auth(req) {
  return (req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')) === ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [status, log] = await Promise.all([
    Promise.resolve(getCronAlertStatus()),
    readAlertLog(100),
  ])
  return NextResponse.json({ status, log, ts: new Date().toISOString() })
}

export async function DELETE(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await clearAlertLog()
  return NextResponse.json({ ok: true, cleared: 'log' })
}
