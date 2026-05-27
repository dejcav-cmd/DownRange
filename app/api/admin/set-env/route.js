export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/set-env
 * Push env vars to Vercel via Vercel API.
 * Requires VERCEL_TOKEN in env. VERCEL_PROJECT_ID defaults to 'down-range-indol'.
 *
 * If VERCEL_TOKEN is not set, returns manual instructions instead.
 * Handles 409 (var already exists) by PATCHing the existing var.
 */
export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { vars } = body
  if (!vars || typeof vars !== 'object') {
    return Response.json({ error: 'vars object required' }, { status: 400 })
  }

  // Filter out empty values
  const toSet = Object.entries(vars).filter(([, v]) => v && String(v).trim())

  const token     = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || 'down-range-indol'
  const teamId    = process.env.VERCEL_TEAM_ID

  // ── No token: return manual instructions ────────────────────────────────
  if (!token) {
    const envLines = toSet
      .filter(([k]) => !k.includes('KEY') || k.startsWith('AI_CHAIN')) // hide API keys from display
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    const allEnvLines = toSet.map(([k, v]) => `${k}=${v}`).join('\n')

    return Response.json({
      ok:          false,
      manual:      true,
      message:     'VERCEL_TOKEN is not set in Vercel env vars. Add the following variables manually, or add VERCEL_TOKEN to enable auto-push.',
      envLines:    allEnvLines,
      varCount:    toSet.length,
      howToGetToken: 'Go to vercel.com/account/tokens → Create Token → paste as VERCEL_TOKEN in Vercel → Project → Settings → Env Vars',
    })
  }

  // ── Push to Vercel API ────────────────────────────────────────────────────
  const base = `https://api.vercel.com/v10/projects/${projectId}/env`
  const qs   = teamId ? `?teamId=${teamId}` : ''

  const results = []

  for (const [name, value] of toSet) {
    try {
      // POST (create)
      const postRes = await fetch(base + qs, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          key:    name,
          value:  String(value),
          type:   'encrypted',
          target: ['production', 'preview'],
        }),
      })

      if (postRes.ok) {
        const d = await postRes.json()
        results.push({ name, ok: true, action: 'created', id: d.id })
        continue
      }

      // 409 = already exists — fetch existing ID then PATCH
      if (postRes.status === 409) {
        const listRes = await fetch(`${base}${qs}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (listRes.ok) {
          const list = await listRes.json()
          const existing = list.envs?.find(e => e.key === name)
          if (existing) {
            const patchRes = await fetch(`${base}/${existing.id}${qs}`, {
              method:  'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body:    JSON.stringify({ value: String(value), target: ['production', 'preview'] }),
            })
            if (patchRes.ok) {
              results.push({ name, ok: true, action: 'updated', id: existing.id })
              continue
            } else {
              const err = await patchRes.json().catch(() => ({}))
              results.push({ name, ok: false, action: 'patch-failed', status: patchRes.status, error: err.error?.message || `HTTP ${patchRes.status}` })
              continue
            }
          }
        }
        results.push({ name, ok: false, action: 'conflict', status: 409, error: 'Already exists but could not find ID to update' })
        continue
      }

      // Other error
      const errBody = await postRes.json().catch(() => ({}))
      results.push({
        name,
        ok:     false,
        action: 'failed',
        status: postRes.status,
        error:  errBody.error?.message || errBody.message || `HTTP ${postRes.status}`,
      })

    } catch (e) {
      results.push({ name, ok: false, action: 'exception', error: e.message })
    }
  }

  const succeeded = results.filter(r => r.ok).length
  const failed    = results.filter(r => !r.ok).length

  return Response.json({
    ok:      failed === 0,
    message: failed === 0
      ? `${succeeded} env var${succeeded !== 1 ? 's' : ''} pushed to Vercel. Trigger a redeploy to activate.`
      : `${succeeded} succeeded, ${failed} failed. Check results for details.`,
    results,
    succeeded,
    failed,
  })
}
