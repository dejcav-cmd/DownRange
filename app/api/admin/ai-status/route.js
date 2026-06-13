export const dynamic = 'force-dynamic'

export async function GET(req) {
  const key    = req.headers.get('x-admin-key')
  const cronHdr = req.headers.get('authorization')?.replace('Bearer ','')
  const isAdmin = key === process.env.ADMIN_KEY
  const isCron  = process.env.CRON_SECRET && cronHdr === process.env.CRON_SECRET
  if (!isAdmin && !isCron) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Check which keys exist on this server (without exposing values)
  const status = {
    ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY:    !!process.env.OPENAI_API_KEY,
    GLM_API_KEY:       !!process.env.GLM_API_KEY,
    GLM_MODEL:         process.env.GLM_MODEL || null,
    AI_CHAIN:          process.env.AI_CHAIN || null,
    AI_CHAIN_NEWS:     process.env.AI_CHAIN_NEWS || null,
    AI_CHAIN_BACKFILL: process.env.AI_CHAIN_BACKFILL || null,
    AI_CHAIN_INTEL:    process.env.AI_CHAIN_INTEL || null,
    AI_CHAIN_ARTICLE:  process.env.AI_CHAIN_ARTICLE || null,
    AI_CHAIN_OUTREACH: process.env.AI_CHAIN_OUTREACH || null,
    AI_CHAIN_LAW:      process.env.AI_CHAIN_LAW || null,
    AI_CHAIN_NEWSLETTER: process.env.AI_CHAIN_NEWSLETTER || null,
    AI_CHAIN_FAST:     process.env.AI_CHAIN_FAST || null,
    VERCEL_TOKEN:      !!process.env.VERCEL_TOKEN,
  }

  // Also do a quick live connectivity test for each configured provider
  const tests = {}

  if (status.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 5, messages: [{ role: 'user', content: 'Hi' }] }),
        signal: AbortSignal.timeout(8000),
      })
      const d = await r.json()
      tests.anthropic = r.ok ? { ok: true, model: 'claude-haiku-4-5-20251001' } : { ok: false, error: d.error?.message || `HTTP ${r.status}` }
    } catch(e) { tests.anthropic = { ok: false, error: e.message } }
  }

  if (status.GLM_API_KEY) {
    try {
      const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GLM_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'glm-4.5-air', max_tokens: 5, messages: [{ role: 'user', content: 'Hi' }] }),
        signal: AbortSignal.timeout(10000),
      })
      const d = await r.json()
      tests.glm = r.ok ? { ok: true, model: 'glm-4.5-air' } : { ok: false, error: d.error?.message || d.message || `HTTP ${r.status}` }
    } catch(e) { tests.glm = { ok: false, error: e.message } }
  }

  if (status.OPENAI_API_KEY) {
    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 5, messages: [{ role: 'user', content: 'Hi' }] }),
        signal: AbortSignal.timeout(8000),
      })
      const d = await r.json()
      tests.openai = r.ok ? { ok: true, model: 'gpt-4o-mini' } : { ok: false, error: d.error?.message || `HTTP ${r.status}` }
    } catch(e) { tests.openai = { ok: false, error: e.message } }
  }

  // Determine active routing for each use case
  const { GLM_API_KEY: glm, ANTHROPIC_API_KEY: anth } = process.env
  function resolveFirst(chainStr) {
    if (!chainStr) return null
    const [first] = chainStr.split(',')
    const [prov, ...rest] = first.trim().split(':')
    const model = rest.join(':')
    const hasKey = prov === 'glm' ? !!glm : prov === 'anthropic' ? !!anth : !!process.env.OPENAI_API_KEY
    return hasKey ? `${prov}/${model}` : `${prov}/${model} ⚠ KEY MISSING`
  }

  const routing = {
    news:       resolveFirst(process.env.AI_CHAIN_NEWS)     || (glm ? 'glm/glm-4.5-air' : anth ? 'anthropic/claude-haiku' : 'none'),
    backfill:   resolveFirst(process.env.AI_CHAIN_BACKFILL) || (glm ? 'glm/glm-4.5-air' : anth ? 'anthropic/claude-haiku' : 'none'),
    intel:      resolveFirst(process.env.AI_CHAIN_INTEL)    || (anth ? 'anthropic/claude-sonnet-4-5' : glm ? 'glm/glm-4.7' : 'none'),
    article:    resolveFirst(process.env.AI_CHAIN_ARTICLE)  || (glm ? 'glm/glm-4.5-air' : anth ? 'anthropic/claude-haiku' : 'none'),
    newsletter: resolveFirst(process.env.AI_CHAIN_NEWSLETTER) || (anth ? 'anthropic/claude-sonnet-4-5' : 'none'),
    outreach:   resolveFirst(process.env.AI_CHAIN_OUTREACH) || (anth ? 'anthropic/claude-haiku' : glm ? 'glm/glm-4.7' : 'none'),
  }

  return Response.json({ ok: true, status, tests, routing })
}
