export const dynamic = 'force-dynamic'
export const maxDuration = 15

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

const VERCEL_PROJECT = process.env.VERCEL_PROJECT_ID || 'down-range-indol'
const VERCEL_TEAM    = process.env.VERCEL_TEAM_ID

function vercelHeaders() {
  return {
    'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function qs(extra = {}) {
  const p = { ...extra }
  if (VERCEL_TEAM) p.teamId = VERCEL_TEAM
  return '?' + new URLSearchParams(p).toString()
}

// GET /api/admin/deployments?limit=10   — list deployments
// GET /api/admin/deployments?id=xxx      — single deployment detail
// GET /api/admin/deployments?id=xxx&logs=true — deployment build logs
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const token = process.env.VERCEL_TOKEN
  if (!token) return Response.json({ ok: false, error: 'VERCEL_TOKEN not set', noToken: true })

  const url   = new URL(req.url)
  const depId = url.searchParams.get('id')
  const logs  = url.searchParams.get('logs') === 'true'
  const limit = url.searchParams.get('limit') || '15'

  try {
    // ── Single deployment logs ────────────────────────────────────────────
    if (depId && logs) {
      const r = await fetch(
        `https://api.vercel.com/v2/deployments/${depId}/events${qs({ builds: '1', limit: '500' })}`,
        { headers: vercelHeaders(), signal: AbortSignal.timeout(10000) }
      )
      const text = await r.text()
      // Vercel returns newline-delimited JSON
      const events = text.trim().split('\n').map(l => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
      const logLines = events
        .filter(e => e.type === 'stdout' || e.type === 'stderr' || e.type === 'command')
        .map(e => ({
          type: e.type,
          text: e.payload?.text || e.payload?.name || '',
          created: e.created,
        }))
      return Response.json({ ok: true, depId, logs: logLines })
    }

    // ── Single deployment detail ──────────────────────────────────────────
    if (depId) {
      const r = await fetch(
        `https://api.vercel.com/v13/deployments/${depId}${qs()}`,
        { headers: vercelHeaders(), signal: AbortSignal.timeout(10000) }
      )
      const d = await r.json()
      return Response.json({
        ok: true,
        deployment: normalizeDep(d),
      })
    }

    // ── List deployments ──────────────────────────────────────────────────
    const r = await fetch(
      `https://api.vercel.com/v6/deployments${qs({ projectId: VERCEL_PROJECT, limit, target: 'production' })}`,
      { headers: vercelHeaders(), signal: AbortSignal.timeout(10000) }
    )
    const data = await r.json()
    const deployments = (data.deployments || []).map(normalizeDep)
    return Response.json({ ok: true, deployments, pagination: data.pagination })

  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// POST /api/admin/deployments { action: 'redeploy', depId }
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const token = process.env.VERCEL_TOKEN
  if (!token) return Response.json({ ok: false, error: 'VERCEL_TOKEN not set', noToken: true })

  const { action, depId } = await req.json().catch(() => ({}))

  if (action === 'redeploy' && depId) {
    const r = await fetch(
      `https://api.vercel.com/v13/deployments?${VERCEL_TEAM ? 'teamId='+VERCEL_TEAM : ''}`,
      {
        method: 'POST',
        headers: vercelHeaders(),
        body: JSON.stringify({ deploymentId: depId, target: 'production', meta: { triggeredBy: 'DR Admin Mobile' } }),
        signal: AbortSignal.timeout(10000),
      }
    )
    const d = await r.json()
    return Response.json({ ok: !!d.id, deployment: normalizeDep(d), error: d.error?.message })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}

function normalizeDep(d) {
  return {
    id:        d.uid || d.id,
    url:       d.url ? `https://${d.url}` : null,
    state:     d.readyState || d.state || d.status,
    target:    d.target,
    createdAt: d.createdAt,
    buildingAt:d.buildingAt,
    ready:     d.ready,
    source:    d.meta?.githubCommitMessage || d.meta?.gitlabCommitMessage || null,
    commit:    d.meta?.githubCommitSha?.slice(0,7) || null,
    branch:    d.meta?.githubCommitRef || 'main',
    creator:   d.creator?.username || d.creator?.email || null,
    duration:  (d.ready && d.buildingAt) ? Math.round((d.ready - d.buildingAt) / 1000) : null,
    errorCode: d.errorCode || null,
  }
}
