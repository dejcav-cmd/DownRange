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

async function resolveGroupId(report) {
  const envVal = (process.env.MAILERLITE_GROUP_ID || '').trim()

  // Numeric ID — use directly
  if (/^\d+$/.test(envVal)) {
    report.groupIdSource = `env var (numeric): ${envVal}`
    return envVal
  }

  // Name or unset — list groups and look up
  const searchName = envVal || 'DownRange'
  report.groupIdSource = `name lookup for: "${searchName}"`

  const res = await fetch(`${BASE}/groups?limit=100`, { headers: mlHeaders() })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || `Groups list failed: ${res.status}`)

  const groups = json.data || []
  report.groupsCheck = {
    ok: true,
    count: groups.length,
    groups: groups.map(g => ({ id: g.id, name: g.name, active_count: g.active_count })),
  }

  const match = groups.find(g => g.name.toLowerCase() === searchName.toLowerCase())
  if (!match) throw new Error(`Group "${searchName}" not found. Available: ${groups.map(g => `"${g.name}"`).join(', ')}`)

  report.groupMatch = { found: true, id: match.id, name: match.name }
  return match.id
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
    groupIdSource: null,
    groupsCheck: null,
    groupMatch: null,
    subscribeTest: null,
  }

  if (!process.env.MAILERLITE_API_KEY) {
    return Response.json({ ...report, fatal: 'MAILERLITE_API_KEY missing' })
  }

  let groupId
  try {
    groupId = await resolveGroupId(report)
  } catch (e) {
    return Response.json({ ...report, fatal: e.message })
  }

  // Test subscribe with resolved numeric ID
  try {
    const testEmail = `dr_debug_${Date.now()}@test-placeholder.invalid`
    const body = { email: testEmail, status: 'active', groups: [groupId] }
    report.subscribeTest = { attempt: { groupId, body } }

    const res = await fetch(`${BASE}/subscribers`, {
      method: 'POST',
      headers: mlHeaders(),
      body: JSON.stringify(body),
    })
    const json = await res.json()

    if (res.ok) {
      report.subscribeTest.ok = true
      report.subscribeTest.subscriberId = json.data?.id
      // Clean up
      if (json.data?.id) {
        await fetch(`${BASE}/subscribers/${json.data.id}`, {
          method: 'DELETE', headers: mlHeaders(),
        }).catch(() => {})
      }
    } else {
      report.subscribeTest.ok = false
      report.subscribeTest.status = res.status
      report.subscribeTest.error = json
    }
  } catch (e) {
    report.subscribeTest = { ok: false, error: e.message }
  }

  return Response.json(report)
}
