export const dynamic = 'force-dynamic'
import { chainDetails } from '@/lib/aiClient'
import { CLAUDE_MODELS, MODEL_ALIASES, resolveModel, modelState, USE_CASES, FAST_MODEL } from '@/lib/aiModels'

// GET /api/admin/ai-status[?live=1]
// Returns what the server will actually use: keys, effective chain per task with a health state per slot,
// and (with live=1) the model list straight from Anthropic plus a connectivity ping per provider.
export async function GET(req) {
  const key     = req.headers.get('x-admin-key')
  const cronHdr = req.headers.get('authorization')?.replace('Bearer ', '')
  const isAdmin = !!process.env.ADMIN_KEY && key === process.env.ADMIN_KEY
  const isCron  = process.env.CRON_SECRET && cronHdr === process.env.CRON_SECRET
  if (!isAdmin && !isCron) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const live = new URL(req.url).searchParams.get('live') === '1'

  const keys = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai:    !!process.env.OPENAI_API_KEY,
    glm:       !!process.env.GLM_API_KEY,
    vercel:    !!process.env.VERCEL_TOKEN,
  }

  // Which env vars are set (names only, never values). Used by the mobile API-keys screen.
  const status = Object.fromEntries(['ANTHROPIC_API_KEY','OPENAI_API_KEY','GLM_API_KEY','SANITY_API_TOKEN','RESEND_API_KEY','CRON_SECRET','YOUTUBE_API_KEY','NEWSAPI_KEY','PEXELS_API_KEY','PIXABAY_API_KEY','VERCEL_TOKEN'].map(k => [k, !!process.env[k]]))

  // Live model list from Anthropic (the real IDs this key can call)
  let liveModels = null, liveModelsError = null
  const tests = {}
  if (live && keys.anthropic) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/models?limit=100', {
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        signal: AbortSignal.timeout(8000),
      })
      const d = await r.json()
      if (r.ok) liveModels = (d.data || []).map(m => ({ id: m.id, name: m.display_name, created: m.created_at }))
      else liveModelsError = d.error?.message || `HTTP ${r.status}`
    } catch (e) { liveModelsError = e.message }

    try {
      const t0 = Date.now()
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: FAST_MODEL, max_tokens: 5, messages: [{ role: 'user', content: 'Hi' }] }),
        signal: AbortSignal.timeout(8000),
      })
      const d = await r.json()
      tests.anthropic = r.ok ? { ok: true, model: FAST_MODEL, ms: Date.now() - t0 } : { ok: false, error: d.error?.message || `HTTP ${r.status}` }
    } catch (e) { tests.anthropic = { ok: false, error: e.message } }
  }
  if (live && keys.openai) {
    try {
      const t0 = Date.now()
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 5, messages: [{ role: 'user', content: 'Hi' }] }),
        signal: AbortSignal.timeout(8000),
      })
      const d = await r.json()
      tests.openai = r.ok ? { ok: true, model: 'gpt-4o-mini', ms: Date.now() - t0 } : { ok: false, error: d.error?.message || `HTTP ${r.status}` }
    } catch (e) { tests.openai = { ok: false, error: e.message } }
  }

  const liveIds = liveModels ? new Set(liveModels.map(m => m.id)) : null
  const meta = Object.fromEntries(USE_CASES.map(u => [u.key, u]))

  const routing = chainDetails().map(c => {
    const slots = c.slots.map(s => {
      const state   = modelState(s.provider, s.model)
      const effective = resolveModel(s.provider, s.model)
      let health = state            // ok | retired | unknown | disabled
      if (s.provider !== 'glm' && !keys[s.provider]) health = 'nokey'
      // a model Anthropic's own list does not contain is invalid even if our catalog accepts the spelling
      if (liveIds && s.provider === 'anthropic' && health !== 'nokey' && !liveIds.has(effective)) health = 'invalid'
      return { ...s, effective, health }
    })
    const runnable = slots.filter(s => s.health !== 'disabled' && s.health !== 'nokey' && s.health !== 'invalid')
    return {
      useCase: c.useCase, label: meta[c.useCase]?.label || c.useCase, desc: meta[c.useCase]?.desc || '',
      source: c.source, raw: c.raw, slots,
      primary: runnable[0] ? `${runnable[0].provider}/${runnable[0].effective}` : null,
      needsFix: slots.some(s => s.health === 'retired' || s.health === 'unknown' || s.health === 'invalid' || s.health === 'disabled'),
    }
  })

  // Corrected env values the "Fix" button can push: retired IDs swapped, disabled providers dropped.
  const fixes = routing
    .filter(r => r.source !== 'built-in default' && r.needsFix)
    .map(r => {
      const kept = r.slots
        .filter(s => s.provider !== 'glm')
        .map(s => `${s.provider}:${s.effective || ''}`)
      const dedup = [...new Set(kept)]
      return { env: r.source, from: r.raw, to: dedup.join(',') || `anthropic:${FAST_MODEL}` }
    })
    .filter((f, i, a) => a.findIndex(x => x.env === f.env) === i)

  return Response.json({
    ok: true, keys, status, tests, routing, fixes,
    catalog: CLAUDE_MODELS, aliases: MODEL_ALIASES,
    liveModels, liveModelsError,
    checkedAt: new Date().toISOString(),
  })
}
