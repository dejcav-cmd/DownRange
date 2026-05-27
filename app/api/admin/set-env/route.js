export const dynamic = 'force-dynamic'

// Vercel API to set environment variables
// Requires VERCEL_TOKEN and VERCEL_PROJECT_ID in env

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { vars } = await req.json().catch(() => ({}))
  if (!vars || typeof vars !== 'object') return Response.json({ error: 'vars object required' }, { status: 400 })

  const token     = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID || 'down-range-indol'
  const teamId    = process.env.VERCEL_TEAM_ID    // optional

  if (!token) {
    // No Vercel token — return the env var strings for manual entry
    const envLines = Object.entries(vars)
      .filter(([k]) => !['OPENAI_API_KEY','GLM_API_KEY'].includes(k) || vars[k]) // skip empty keys
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    return Response.json({
      ok:      false,
      manual:  true,
      message: 'VERCEL_TOKEN not set — add these manually to Vercel → Project → Settings → Environment Variables:',
      envLines,
      vars: Object.fromEntries(
        Object.entries(vars).filter(([k]) => !k.includes('KEY') || k.startsWith('AI_CHAIN'))
      ),
    })
  }

  // Push to Vercel API
  const base = 'https://api.vercel.com/v10/projects/' + projectId + '/env'
  const qs   = teamId ? '?teamId=' + teamId : ''

  const results = []
  for (const [name, value] of Object.entries(vars)) {
    if (!value) continue
    try {
      // Try to update existing first
      const upsertRes = await fetch(base + qs, {
        method:  'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key: name, value: String(value), type: 'encrypted', target: ['production', 'preview'] }),
      })
      const d = await upsertRes.json()
      results.push({ name, ok: upsertRes.ok, status: upsertRes.status, id: d.id })
    } catch (e) {
      results.push({ name, ok: false, error: e.message })
    }
  }

  const allOk = results.every(r => r.ok)
  return Response.json({
    ok:      allOk,
    message: allOk
      ? 'All ' + results.length + ' env vars set. Trigger a redeploy in Vercel for them to take effect.'
      : 'Some vars failed — check results',
    results,
  })
}
