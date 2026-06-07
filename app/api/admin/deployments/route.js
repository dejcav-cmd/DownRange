export const dynamic = 'force-dynamic'
export const maxDuration = 20

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

const VERCEL_PROJECT = process.env.VERCEL_PROJECT_ID || 'down-range-indol'
const VERCEL_TEAM    = process.env.VERCEL_TEAM_ID

function vHeaders(extra = {}) {
  return {
    'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function qs(extra = {}) {
  const p = { ...extra }
  if (VERCEL_TEAM) p.teamId = VERCEL_TEAM
  return '?' + new URLSearchParams(p).toString()
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const token = process.env.VERCEL_TOKEN
  if (!token) return Response.json({ ok: false, error: 'VERCEL_TOKEN not set', noToken: true })

  const url   = new URL(req.url)
  const depId = url.searchParams.get('id')
  const logs  = url.searchParams.get('logs') === 'true'
  const limit = url.searchParams.get('limit') || '15'

  try {
    // ── Build logs for a deployment ───────────────────────────────────────
    if (depId && logs) {
      // v3 returns NDJSON when Accept is application/x-ndjson
      const r = await fetch(
        `https://api.vercel.com/v3/deployments/${depId}/events${qs({ direction: 'forward', limit: '2000' })}`,
        {
          headers: vHeaders({ 'Accept': 'application/x-ndjson' }),
          signal: AbortSignal.timeout(12000),
        }
      )
      const text = await r.text()
      // Parse NDJSON lines
      const lines = text.trim().split('\n')
        .map(l => { try { return JSON.parse(l) } catch { return null } })
        .filter(Boolean)

      const logLines = lines
        .filter(e => ['stdout','stderr','command','delimiter'].includes(e.type))
        .map(e => ({
          type:    e.type,
          text:    e.payload?.text ?? e.payload?.name ?? '',
          created: e.created,
        }))
        .filter(e => e.text.trim())

      return Response.json({ ok: true, depId, logs: logLines, raw: lines.length })
    }

    // ── Single deployment detail ──────────────────────────────────────────
    if (depId) {
      const r = await fetch(
        `https://api.vercel.com/v13/deployments/${depId}${qs()}`,
        { headers: vHeaders(), signal: AbortSignal.timeout(10000) }
      )
      const d = await r.json()
      return Response.json({ ok: true, deployment: normalizeDep(d) })
    }

    // ── List deployments (production + preview) ───────────────────────────
    const r = await fetch(
      `https://api.vercel.com/v6/deployments${qs({ projectId: VERCEL_PROJECT, limit })}`,
      { headers: vHeaders(), signal: AbortSignal.timeout(10000) }
    )
    const data = await r.json()
    const deployments = (data.deployments || []).map(normalizeDep)
    return Response.json({ ok: true, deployments, pagination: data.pagination })

  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const token = process.env.VERCEL_TOKEN
  if (!token) return Response.json({ ok: false, error: 'VERCEL_TOKEN not set', noToken: true })

  const { action, depId } = await req.json().catch(() => ({}))

  if (action === 'redeploy' && depId) {
    const r = await fetch(
      `https://api.vercel.com/v13/deployments${VERCEL_TEAM ? '?teamId='+VERCEL_TEAM : ''}`,
      {
        method: 'POST',
        headers: vHeaders(),
        body: JSON.stringify({ deploymentId: depId, target: 'production', meta: { triggeredBy: 'DR Admin Mobile' } }),
        signal: AbortSignal.timeout(12000),
      }
    )
    const d = await r.json()
    return Response.json({ ok: !!d.id, deployment: d.id ? normalizeDep(d) : null, error: d.error?.message })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}

function normalizeDep(d) {
  const createdAt  = d.createdAt  || d.created
  const buildingAt = d.buildingAt || d.building
  const readyAt    = d.ready      || d.readyAt
  return {
    id:        d.uid || d.id,
    url:       d.url    ? `https://${d.url}`    : null,
    inspectUrl:d.inspectorUrl || null,
    state:     d.readyState || d.state || d.status || 'UNKNOWN',
    target:    d.target || 'production',
    createdAt,
    buildingAt,
    ready:     readyAt,
    source:    (d.meta?.githubCommitMessage || d.meta?.gitlabCommitMessage || '').split('\n')[0].slice(0,80) || null,
    commit:    d.meta?.githubCommitSha?.slice(0,7) || null,
    branch:    d.meta?.githubCommitRef || 'main',
    creator:   d.creator?.username || d.creator?.email || null,
    duration:  (readyAt && buildingAt) ? Math.round((readyAt - buildingAt) / 1000) : null,
    errorCode: d.errorCode || null,
    buildError:d.buildError?.message || null,
  }
}
