/**
 * lib/aiRouter.js — Tiered AI cost optimizer
 *
 * TIERS (cheapest → most capable):
 *   nano   → GLM-4.5 Air   ($0.14/M in+out)  — bulk rewrites, dedup checks
 *   cheap  → GLM-4.7        ($0.28/M out)     — news summaries, laws
 *   mid    → Claude Haiku   ($0.80/$4/M)      — backfill, outreach, Canada
 *   smart  → Claude Sonnet  ($3/$15/M)        — blog, releases, briefings
 *   best   → Claude Opus    ($15/$75/M)       — nothing automatic (manual only)
 *
 * USAGE:
 *   import { ai } from '@/lib/aiRouter'
 *   const text = await ai.nano(prompt)     // bulk cron work
 *   const text = await ai.cheap(prompt)    // news summaries
 *   const text = await ai.smart(prompt)    // important articles
 *
 * FALLBACK CHAIN:
 *   Each tier automatically falls back up the chain on failure.
 *   nano → cheap → mid → smart
 */

const ENDPOINTS = {
  glm: {
    url:    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    getKey: () => process.env.GLM_API_KEY,
    call:   async (model, messages, maxTokens) => {
      const key = process.env.GLM_API_KEY
      if (!key) throw new Error('GLM_API_KEY not set')
      const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model, max_tokens: maxTokens, messages }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(`GLM ${res.status}: ${d.error?.message || d.message || ''}`)
      const text = d.choices?.[0]?.message?.content?.trim()
      if (!text) throw new Error('GLM empty response')
      // Track cost
      trackCost('glm', model, d.usage?.prompt_tokens || 0, d.usage?.completion_tokens || 0)
      return text
    }
  },
  anthropic: {
    call: async (model, messages, maxTokens, system) => {
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) throw new Error('ANTHROPIC_API_KEY not set')
      const body = { model, max_tokens: maxTokens, messages }
      if (system) body.system = system
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(`Anthropic ${res.status}: ${d.error?.message || ''}`)
      const text = d.content?.[0]?.text?.trim()
      if (!text) throw new Error('Anthropic empty response')
      trackCost('anthropic', model, d.usage?.input_tokens || 0, d.usage?.output_tokens || 0)
      return text
    }
  }
}

// ── Cost tracker (in-memory + Redis if available) ────────────────────────────
let _costs = { today: {}, total: {}, lastReset: new Date().toDateString() }

function trackCost(provider, model, inTok, outTok) {
  // Cost per million tokens
  const rates = {
    'glm-4.5-air':       { in: 0.14, out: 0.14 },
    'glm-4.7':           { in: 0.14, out: 0.28 },
    'claude-haiku-4-5-20251001': { in: 0.80, out: 4.00 },
    'claude-sonnet-4-5': { in: 3.00, out: 15.00 },
    'claude-opus-4-5':   { in: 15.0, out: 75.00 },
  }
  const r = rates[model] || { in: 3.00, out: 15.00 }
  const usd = (inTok / 1e6 * r.in) + (outTok / 1e6 * r.out)

  // Reset daily counter
  const today = new Date().toDateString()
  if (_costs.lastReset !== today) { _costs.today = {}; _costs.lastReset = today }

  const k = `${provider}/${model}`
  if (!_costs.today[k])  _costs.today[k]  = { calls: 0, inTok: 0, outTok: 0, usd: 0 }
  if (!_costs.total[k]) _costs.total[k]  = { calls: 0, inTok: 0, outTok: 0, usd: 0 }

  for (const bucket of [_costs.today[k], _costs.total[k]]) {
    bucket.calls++; bucket.inTok += inTok; bucket.outTok += outTok; bucket.usd += usd
  }
  console.log(`[AI-COST] ${k} | in:${inTok} out:${outTok} | $${usd.toFixed(5)} | day:$${Object.values(_costs.today).reduce((s,v)=>s+v.usd,0).toFixed(4)}`)
}

export function getCosts() { return _costs }

// ── Core call with fallback chain ────────────────────────────────────────────
async function callWithFallback(slots, prompt, maxTokens, system) {
  const messages = [{ role: 'user', content: prompt }]
  const errors = []
  for (const { provider, model } of slots) {
    try {
      return await ENDPOINTS[provider].call(model, messages, maxTokens, system)
    } catch(e) {
      errors.push(`${model}: ${e.message}`)
      console.warn(`[AI-ROUTER] ${model} failed, trying next...`)
    }
  }
  throw new Error('All AI providers failed: ' + errors.join(' | '))
}

// ── Tier definitions ─────────────────────────────────────────────────────────
// nano  → GLM-4.5 Air → GLM-4.7 → Haiku  (bulk, disposable quality ok)
// cheap → GLM-4.7 → Haiku → Sonnet        (summaries, short content)
// mid   → Haiku → GLM-4.7 → Sonnet        (quality summaries, laws)
// smart → Sonnet → GLM-4.7 → Haiku        (important articles, intelligence)

function makeChain(primary, fallbacks) {
  return async (prompt, opts = {}) => {
    const maxTokens = opts.maxTokens || 4000
    const system    = opts.system || null
    const chain = [primary, ...fallbacks].filter(s => {
      // Only include slot if the key is available
      if (s.provider === 'glm'       && !process.env.GLM_API_KEY)       return false
      if (s.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) return false
      return true
    })
    if (!chain.length) throw new Error('No AI provider configured')
    return callWithFallback(chain, prompt, maxTokens, system)
  }
}

export const ai = {
  // ~$0.14/M — use for all bulk cron work: news rewrites, backfill summaries
  nano:  makeChain(
    { provider:'glm',       model:'glm-4.5-air' },
    [{ provider:'glm',       model:'glm-4.7' },
     { provider:'anthropic', model:'claude-haiku-4-5-20251001' }]
  ),

  // ~$0.28/M — use for laws, short summaries, dedup checks
  cheap: makeChain(
    { provider:'glm',       model:'glm-4.7' },
    [{ provider:'anthropic', model:'claude-haiku-4-5-20251001' },
     { provider:'anthropic', model:'claude-sonnet-4-5' }]
  ),

  // ~$0.80/M — use for backfill, outreach, Canada content
  mid:   makeChain(
    { provider:'anthropic', model:'claude-haiku-4-5-20251001' },
    [{ provider:'glm',       model:'glm-4.7' },
     { provider:'anthropic', model:'claude-sonnet-4-5' }]
  ),

  // ~$3/M — use for intelligence briefing, release articles, blog posts
  smart: makeChain(
    { provider:'anthropic', model:'claude-sonnet-4-5' },
    [{ provider:'glm',       model:'glm-4.7' },
     { provider:'anthropic', model:'claude-haiku-4-5-20251001' }]
  ),
}

// Parse "glm:glm-4.5-air,anthropic:claude-sonnet-4-5" → slot array
function parseEnvChain(str) {
  if (!str) return null
  return str.split(',').map(s => {
    const [provider, ...rest] = s.trim().split(':')
    return { provider, model: rest.join(':') || null }
  }).filter(s => s.provider && ENDPOINTS[s.provider])
}

// Convenience: pick tier automatically, respecting AI_CHAIN_* env vars
export function aiForUseCase(useCase) {
  // Check for per-use-case env override first (set by admin chain builder)
  const envKey = {
    article:    'AI_CHAIN_ARTICLE',
    intel:      'AI_CHAIN_INTEL',
    intelligence:'AI_CHAIN_INTEL',
    fast:       'AI_CHAIN_FAST',
    outreach:   'AI_CHAIN_OUTREACH',
  }[useCase]

  const envChain = parseEnvChain(
    (envKey && process.env[envKey]) || process.env.AI_CHAIN
  )
  if (envChain?.length) {
    return (prompt, opts = {}) => callWithFallback(
      envChain.filter(s => {
        if (s.provider === 'glm'       && !process.env.GLM_API_KEY)       return false
        if (s.provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) return false
        return true
      }),
      prompt, opts.maxTokens || 4000, opts.system || null
    )
  }

  // Default tier mapping
  const tierMap = {
    news:        'mid',    // was nano — GLM can't produce 800-word structured articles
    backfill:    'mid',    // was nano — same issue
    laws:        'cheap',
    market:      'nano',
    releases:    'smart',
    outreach:    'mid',
    canada:      'mid',
    newsletter:  'mid',
    blog:        'smart',
    intelligence:'smart',
    intel:       'smart',
    default:     'mid',
  }
  const tier = tierMap[useCase] || 'cheap'
  return ai[tier]
}
