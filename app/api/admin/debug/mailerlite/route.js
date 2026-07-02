// app/api/admin/debug/mailerlite/route.js
export const dynamic = 'force-dynamic'

const BASE = 'https://connect.mailerlite.com/api'
function mlHeaders() {
  return {
    'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

export async function GET(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = {
    env: {
      MAILERLITE_API_KEY: process.env.MAILERLITE_API_KEY
        ? `SET (${process.env.MAILERLITE_API_KEY.slice(0, 8)}...)`
        : 'NOT SET',
      MAILERLITE_GROUP_ID: process.env.MAILERLITE_GROUP_ID || 'NOT SET',
    },
    groupsCheck: null,
    groupMatch: null,
    subscribeTest: null,
  }

  if (!process.env.MAILERLITE_API_KEY) {
    return Response.json({ ...report, fatal: 'MAILERLITE_API_KEY missing' })
  }

  // 1. List groups
  try {
    const res = await fetch(`${BASE}/groups?limit=100`, { headers: mlHeaders() })
    const json = await res.json()
    if (!res.ok) {
      report.groupsCheck = { ok: false, status: res.status, body: json }
    } else {
      const groups = json.data || []
      report.groupsCheck = {
        ok: true,
        count: groups.length,
        groups: groups.map(g => ({ id: g.id, name: g.name, active_count: g.active_count })),
      }
      const match = groups.find(g => g.name.toLowerCase() === 'downrange')
      report.groupMatch = match
        ? { found: true, id: match.id, name: match.name }
        : { found: false, note: 'No group named "DownRange" — check exact names in groups above' }
    }
  } catch (e) {
    report.groupsCheck = { ok: false, error: e.message }
  }

  // 2. Test subscribe with resolved group ID
  const groupId = process.env.MAILERLITE_GROUP_ID || report.groupMatch?.id || null
  if (groupId) {
    try {
      const testEmail = `dr_debug_${Date.now()}@test-placeholder.invalid`
      const res = await fetch(`${BASE}/subscribers`, {
        method: 'POST',
        headers: mlHeaders(),
        body: JSON.stringify({ email: testEmail, status: 'active', groups: [groupId] }),
      })
      const json = await res.json()
      if (res.ok) {
        report.subscribeTest = { ok: true, subscriberId: json.data?.id, groupId }
        if (json.data?.id) {
          await fetch(`${BASE}/subscribers/${json.data.id}`, {
            method: 'DELETE', headers: mlHeaders(),
          }).catch(() => {})
        }
      } else {
        report.subscribeTest = { ok: false, status: res.status, body: json }
      }
    } catch (e) {
      report.subscribeTest = { ok: false, error: e.message }
    }
  } else {
    report.subscribeTest = { skipped: 'No group ID resolved' }
  }

  return Response.json(report)
}
