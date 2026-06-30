/**
 * lib/aiClient.js  —  Smart mixed-mode AI client with fallback chains
 *
 * COST STRATEGY (baked in as defaults, all overridable via Vercel env vars):
 *
 *  HIGH-VOLUME / LOW-VALUE  →  GLM-4.5 Air (~$0.07/M in) or Haiku (~$0.8/M in)
 *    - News article rewrites  (96 runs/day × 10 articles)
 *    - Backfill summaries     (hourly, 5 articles)
 *    - Law bill enrichment    (every 2h)
 *
 *  MID-TIER WRITING  →  GLM-4.7 or Claude Sonnet
 *    - Blog posts
 *    - Release articles
 *    - Outreach emails
 *
 *  FLAGSHIP / FLAGSHIP  →  Claude Sonnet or Opus
 *    - Intelligence briefings (once/day, high quality matters)
 *    - Newsletter (once/day, goes to subscribers)
 *
 * Override any chain via Vercel env vars:
 *   AI_CHAIN_NEWS     = "glm:glm-4.5-air,anthropic:claude-haiku-4-5-20251001"
 *   AI_CHAIN_BACKFILL = "glm:glm-4.5-air,anthropic:claude-haiku-4-5-20251001"
 *   AI_CHAIN_LAW      = "glm:glm-4.7,anthropic:claude-haiku-4-5-20251001"
 *   AI_CHAIN_ARTICLE  = "glm:glm-4.7,anthropic:claude-sonnet-4-5"
 *   AI_CHAIN_INTEL    = "anthropic:claude-sonnet-4-5,glm:glm-4.7"
 *   AI_CHAIN_FAST     = "glm:glm-4.5-air,anthropic:claude-haiku-4-5-20251001"
 *   AI_CHAIN          = "glm:glm-4.7,anthropic:claude-sonnet-4-5"   (global fallback)
 */

// ── PROVIDER IMPLEMENTATIONS ─────────────────────────────────────────────────

const PROVIDERS = {
  anthropic: {
    call: async ({ prompt, systemPrompt, maxTokens, model }) => {
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) throw new Error('ANTHROPIC_API_KEY not set')
      const body = {
        model:      model || 'claude-sonnet-4-5-20251022',
        max_tokens: maxTokens,
        messages:   [{ role: 'user', content: prompt }],
      }
      if (systemPrompt) body.system = systemPrompt
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(`Anthropic ${res.status}: ${d.error?.message || JSON.stringify(d).slice(0,100)}`)
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
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', max_tokens: maxTokens, messages }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${d.error?.message || ''}`)
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
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model || 'glm-4.5-air', max_tokens: maxTokens, messages }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(`GLM ${res.status}: ${d.error?.message || d.message || ''}`)
      const text = d.choices?.[0]?.message?.content?.trim()
      if (!text) throw new Error('GLM returned empty response')
      return text
    },
  },
}

// ── DEFAULT CHAINS PER USE CASE ───────────────────────────────────────────────
// These are the smart defaults — all overridable via env vars

const DEFAULT_CHAINS = {
  // News rewrites — need real word count (750-1100 words), GLM-nano can't do it
  news:     'anthropic:claude-haiku-4-5-20251001,glm:glm-4.7',
  // Backfill — same quality bar as news  
  backfill: 'anthropic:claude-haiku-4-5-20251001,glm:glm-4.7',
  // Laws every 2h — slightly better reasoning needed
  law:             'glm:glm-4.7,anthropic:claude-haiku-4-5-20251001',
  // Law assistant Q&A — short answers, high volume, cheapest model
  'law-assistant': 'glm:glm-4.5-air,anthropic:claude-haiku-4-5-20251001',
  // Article writing (blog, releases) — mid tier
  article:  'anthropic:claude-haiku-4-5-20251001,anthropic:claude-sonnet-4-5-20251022',
  // Outreach — mid tier, professional tone
  outreach: 'anthropic:claude-haiku-4-5-20251001,anthropic:claude-sonnet-4-5-20251022',
  // Intelligence briefing — best quality, runs once/day, worth the cost
  intel:    'anthropic:claude-sonnet-4-5-20251022,anthropic:claude-haiku-4-5-20251001',
  // Newsletter — Haiku handles structured digest assembly fine; Sonnet fallback only
  // Cost: $12/mo → $4/mo by swapping primary model
  newsletter: 'anthropic:claude-haiku-4-5-20251001,anthropic:claude-sonnet-4-5-20251022',
  // Fast/bulk operations — cheapest (summaries, dedup — NOT full articles)
  fast:     'glm:glm-4.5-air,anthropic:claude-haiku-4-5-20251001',
  // Explicit mappings for useCases that previously fell to 'default' silently
  // Prevents surprise Sonnet fallbacks and enables per-useCase cost tracking
  laws:     'glm:glm-4.7,anthropic:claude-haiku-4-5-20251001',    // enrichLawWithClaude (plural)
  blog:     'anthropic:claude-haiku-4-5-20251001,anthropic:claude-sonnet-4-5-20251022',
  canada:   'anthropic:claude-haiku-4-5-20251001,glm:glm-4.7',
  brazil:   'anthropic:claude-haiku-4-5-20251001,glm:glm-4.7',
  // Default fallback for anything unspecified
  default:  'anthropic:claude-haiku-4-5-20251001,anthropic:claude-sonnet-4-5-20251022',
}

// Env var names for each use case (user can override via Vercel)
const ENV_KEYS = {
  news:             'AI_CHAIN_NEWS',
  backfill:         'AI_CHAIN_BACKFILL',
  law:              'AI_CHAIN_LAW',
  'law-assistant':  'AI_CHAIN_LAW_ASSISTANT',
  article:          'AI_CHAIN_ARTICLE',
  outreach:         'AI_CHAIN_OUTREACH',
  intel:            'AI_CHAIN_INTEL',
  newsletter:       'AI_CHAIN_NEWSLETTER',
  fast:             'AI_CHAIN_FAST',
  default:    'AI_CHAIN',
}

// ── CHAIN PARSER ──────────────────────────────────────────────────────────────

function parseChain(str) {
  return str.split(',').map(s => {
    const [provider, ...rest] = s.trim().split(':')
    return { provider: provider.trim(), model: rest.join(':').trim() || null }
  }).filter(s => s.provider && PROVIDERS[s.provider])
}

export function getChain(useCase = 'default') {
  const envKey     = ENV_KEYS[useCase] || ENV_KEYS.default
  const chainStr   = process.env[envKey]
                  || process.env[ENV_KEYS.default]
                  || DEFAULT_CHAINS[useCase]
                  || DEFAULT_CHAINS.default
  return parseChain(chainStr)
}

// ── MAIN CALL WITH FALLBACK ───────────────────────────────────────────────────

export async function callAI({ prompt, maxTokens = 4000, systemPrompt = null, useCase = 'default', chain = null }) {
  const slots  = chain ? (typeof chain === 'string' ? parseChain(chain) : chain) : getChain(useCase)
  const errors = []

  for (let i = 0; i < slots.length; i++) {
    const { provider, model } = slots[i]
    const prov = PROVIDERS[provider]
    if (!prov) { errors.push(`Unknown provider: ${provider}`); continue }

    try {
      console.log(`[AI:${useCase}] ${provider}/${model || 'default'} (attempt ${i + 1}/${slots.length})`)
      const text = await prov.call({ prompt, systemPrompt, maxTokens, model })
      if (i > 0) console.log(`[AI:${useCase}] ✓ Succeeded on fallback ${provider}/${model}`)
      return { text, provider, model, attempt: i + 1, fallback: i > 0 }
    } catch (err) {
      const msg = `${provider}/${model}: ${err.message}`
      errors.push(msg)
      console.error(`[AI:${useCase}] ✗ ${msg}`)
      if (i < slots.length - 1) console.log(`[AI:${useCase}] → trying next...`)
    }
  }

  throw new Error(`All AI providers failed for useCase="${useCase}":\n${errors.join('\n')}`)
}

// Convenience — returns just the text string
export async function callAIText(opts) {
  const r = await callAI(opts)
  return r.text
}

// Legacy single-provider direct calls (still work, no chain)
export const callAnthropic = (opts) => PROVIDERS.anthropic.call({ maxTokens: opts.maxTokens || 1200, ...opts })
export const callOpenAI    = (opts) => PROVIDERS.openai.call({    maxTokens: opts.maxTokens || 1200, ...opts })
export const callGLM       = (opts) => PROVIDERS.glm.call({       maxTokens: opts.maxTokens || 1200, ...opts })

// Which providers are configured + active chain per use case
export function providerStatus() {
  return {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai:    !!process.env.OPENAI_API_KEY,
    glm:       !!process.env.GLM_API_KEY,
    chains: Object.fromEntries(
      Object.keys(DEFAULT_CHAINS).map(uc => [uc, getChain(uc).map(s => `${s.provider}/${s.model || 'default'}`).join(' → ')])
    ),
  }
}
