/**
 * lib/aiClient.js
 * Multi-provider AI client with configurable fallback chains.
 *
 * FALLBACK CHAIN:
 *   Define an ordered list of {provider, model} slots.
 *   On failure (network error, rate limit, quota, API error), tries the next.
 *   Logs each attempt. Never silently fails — surfaces last error if all fail.
 *
 * CONFIG (Vercel env vars):
 *   AI_CHAIN          = "glm:glm-4.7,anthropic:claude-sonnet-4-5,openai:gpt-4o-mini"
 *   ANTHROPIC_API_KEY, OPENAI_API_KEY, GLM_API_KEY
 *
 * Per-use-case chains (override AI_CHAIN for specific tasks):
 *   AI_CHAIN_ARTICLE  = "glm:glm-4.7,anthropic:claude-sonnet-4-5"
 *   AI_CHAIN_INTEL    = "anthropic:claude-opus-4-5,glm:glm-4.7"
 *   AI_CHAIN_FAST     = "glm:glm-4.5-air,openai:gpt-4o-mini,anthropic:claude-haiku-4-5-20251001"
 */

// ── PROVIDER CONFIGS ─────────────────────────────────────────────────────────

const PROVIDERS = {
  anthropic: {
    call: async ({ prompt, systemPrompt, maxTokens, model }) => {
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) throw new Error('ANTHROPIC_API_KEY not set')
      const body = { model: model || 'claude-sonnet-4-5', max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }
      if (systemPrompt) body.system = systemPrompt
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) throw new Error('Anthropic ' + res.status + ' ' + (d.error?.message || ''))
      const text = d.content?.[0]?.text?.trim()
      if (!text) throw new Error('Anthropic returned empty response')
      return text
    },
  },

  openai: {
    call: async ({ prompt, systemPrompt, maxTokens, model }) => {
      const key = process.env.OPENAI_API_KEY
      if (!key) throw new Error('OPENAI_API_KEY not set')
      const messages = []
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
      messages.push({ role: 'user', content: prompt })
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'gpt-4o', max_tokens: maxTokens, messages }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error('OpenAI ' + res.status + ' ' + (d.error?.message || ''))
      const text = d.choices?.[0]?.message?.content?.trim()
      if (!text) throw new Error('OpenAI returned empty response')
      return text
    },
  },

  glm: {
    call: async ({ prompt, systemPrompt, maxTokens, model }) => {
      const key = process.env.GLM_API_KEY
      if (!key) throw new Error('GLM_API_KEY not set')
      const messages = []
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
      messages.push({ role: 'user', content: prompt })
      const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'glm-4.7', max_tokens: maxTokens, messages }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error('GLM ' + res.status + ' ' + (d.error?.message || d.message || ''))
      const text = d.choices?.[0]?.message?.content?.trim()
      if (!text) throw new Error('GLM returned empty response')
      return text
    },
  },
}

// ── CHAIN PARSER ─────────────────────────────────────────────────────────────

// Parse "glm:glm-4.7,anthropic:claude-sonnet-4-5" → [{provider:'glm',model:'glm-4.7'}, ...]
function parseChain(str) {
  if (!str) return []
  return str.split(',').map(s => {
    const [provider, ...rest] = s.trim().split(':')
    return { provider, model: rest.join(':') || null }
  }).filter(s => s.provider && PROVIDERS[s.provider])
}

// Build default chain from available env vars (no AI_CHAIN set)
function defaultChain() {
  const chain = []
  if (process.env.GLM_API_KEY)       chain.push({ provider: 'glm',       model: process.env.GLM_MODEL || 'glm-4.7' })
  if (process.env.ANTHROPIC_API_KEY) chain.push({ provider: 'anthropic', model: 'claude-sonnet-4-5' })
  if (process.env.OPENAI_API_KEY)    chain.push({ provider: 'openai',    model: 'gpt-4o' })
  // Always ensure at least Anthropic as final fallback
  if (chain.length === 0) chain.push({ provider: 'anthropic', model: 'claude-sonnet-4-5' })
  return chain
}

export function getChain(useCase = 'default') {
  const envKey = {
    article:  'AI_CHAIN_ARTICLE',
    intel:    'AI_CHAIN_INTEL',
    fast:     'AI_CHAIN_FAST',
    outreach: 'AI_CHAIN_OUTREACH',
    default:  'AI_CHAIN',
  }[useCase] || 'AI_CHAIN'

  const envChain = process.env[envKey] || process.env.AI_CHAIN
  return envChain ? parseChain(envChain) : defaultChain()
}

// ── MAIN CALL WITH FALLBACK ───────────────────────────────────────────────────

export async function callAI({ prompt, maxTokens = 1500, systemPrompt = null, useCase = 'default', chain = null }) {
  const slots = chain || getChain(useCase)
  const errors = []

  for (let i = 0; i < slots.length; i++) {
    const { provider, model } = slots[i]
    const prov = PROVIDERS[provider]
    if (!prov) { errors.push(`[${i+1}/${slots.length}] Unknown provider: ${provider}`); continue }

    try {
      console.log(`[AI] Trying ${provider}/${model || 'default'} (attempt ${i+1}/${slots.length})`)
      const result = await prov.call({ prompt, systemPrompt, maxTokens, model })
      if (i > 0) console.log(`[AI] Succeeded on fallback ${provider}/${model} after ${i} failure(s)`)
      return { text: result, provider, model, attempt: i + 1, fallbackUsed: i > 0 }
    } catch (err) {
      const msg = `[${i+1}/${slots.length}] ${provider}/${model}: ${err.message}`
      errors.push(msg)
      console.error('[AI] Failed:', msg)
      if (i < slots.length - 1) console.log(`[AI] Falling back to next provider...`)
    }
  }

  throw new Error('All AI providers failed:\n' + errors.join('\n'))
}

// Convenience — returns just the text string (most callers don't need metadata)
export async function callAIText(opts) {
  const result = await callAI(opts)
  return result.text
}

// Legacy single-provider calls (still work, no fallback)
export async function callAnthropic(opts) {
  const text = await PROVIDERS.anthropic.call({ ...opts, maxTokens: opts.maxTokens || 1500 })
  return text
}
export async function callOpenAI(opts) {
  const text = await PROVIDERS.openai.call({ ...opts, maxTokens: opts.maxTokens || 1500 })
  return text
}
export async function callGLM(opts) {
  const text = await PROVIDERS.glm.call({ ...opts, maxTokens: opts.maxTokens || 1500 })
  return text
}

// Status — what's configured
export function activeProvider() {
  const chain = getChain()
  return chain.map(s => s.provider + '/' + (s.model || 'default')).join(' → ')
}
