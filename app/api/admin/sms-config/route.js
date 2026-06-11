/**
 * GET  /api/admin/sms-config  — returns current config status + SMS log
 * POST /api/admin/sms-config  — saves override config to Redis
 * DELETE /api/admin/sms-config — clears override + SMS log
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSMSConfigStatus, getSMSOverrideConfig, setSMSOverrideConfig, readSMSLog, clearSMSLog } from '@/lib/smsAlert'

const ADMIN_KEY = process.env.ADMIN_KEY ?? process.env.AGENT_SECRET ?? 'drco-admin'

function auth(req) {
  return (req.headers.get('x-admin-key') ?? new URL(req.url).searchParams.get('key')) === ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [status, override, log] = await Promise.all([
    Promise.resolve(getSMSConfigStatus()),
    getSMSOverrideConfig(),
    readSMSLog(100),
  ])
  return NextResponse.json({ status, override, log, ts: new Date().toISOString() })
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const ok = await setSMSOverrideConfig(body)
  return NextResponse.json({ ok, saved: body, ts: new Date().toISOString() })
}

export async function DELETE(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url  = new URL(req.url)
  const what = url.searchParams.get('what') || 'log'
  if (what === 'log') {
    await clearSMSLog()
    return NextResponse.json({ ok: true, cleared: 'log' })
  }
  if (what === 'config') {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    await redis.del('dr:sms:config')
    return NextResponse.json({ ok: true, cleared: 'override-config' })
  }
  return NextResponse.json({ error: 'Invalid what param' }, { status: 400 })
}
