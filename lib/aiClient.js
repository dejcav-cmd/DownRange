/**
 * lib/aiClient.js
 * Unified AI client — Anthropic, OpenAI, or GLM (Z.ai)
 * Server-side only. Reads from Vercel env vars.
 * Priority: GLM_API_KEY > ANTHROPIC_API_KEY (Anthropic is always the fallback)
 */

export async function callAI({ prompt, maxTokens = 1500, systemPrompt = null }) {
  // GLM takes priority if configured
  if (process.env.GLM_API_KEY) {
    return callGLM({ prompt, maxTokens, systemPrompt })
  }
  // OpenAI if configured
  if (process.env.OPENAI_API_KEY) {
    return callOpenAI({ prompt, maxTokens, systemPrompt })
  }
  // Anthropic default
  return callAnthropic({ prompt, maxTokens, systemPrompt })
}

export async function callAnthropic({ prompt, maxTokens = 1500, systemPrompt = null }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

  const body = {
    model:      'claude-sonnet-4-5',
    max_tokens: maxTokens,
    messages:   [{ role: 'user', content: prompt }],
  }
  if (systemPrompt) body.system = systemPrompt

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const d = await res.json()
  if (!res.ok) throw new Error('Anthropic ' + res.status + ': ' + (d.error?.message || JSON.stringify(d).slice(0,100)))
  return d.content?.[0]?.text?.trim() || ''
}

export async function callOpenAI({ prompt, maxTokens = 1500, systemPrompt = null }) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')

  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model: 'gpt-4o', max_tokens: maxTokens, messages }),
  })
  const d = await res.json()
  if (!res.ok) throw new Error('OpenAI ' + res.status + ': ' + (d.error?.message || JSON.stringify(d).slice(0,100)))
  return d.choices?.[0]?.message?.content?.trim() || ''
}

export async function callGLM({ prompt, maxTokens = 1500, systemPrompt = null, model = null }) {
  const apiKey = process.env.GLM_API_KEY
  if (!apiKey) throw new Error('GLM_API_KEY not configured')

  const selectedModel = model || process.env.GLM_MODEL || 'glm-4.7'
  const messages = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method:  'POST',
    headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model: selectedModel, max_tokens: maxTokens, messages }),
  })
  const d = await res.json()
  if (!res.ok) throw new Error('GLM ' + res.status + ': ' + (d.error?.message || d.message || JSON.stringify(d).slice(0,100)))
  return d.choices?.[0]?.message?.content?.trim() || ''
}

// Which provider is active
export function activeProvider() {
  if (process.env.GLM_API_KEY)       return 'glm/' + (process.env.GLM_MODEL || 'glm-4.7')
  if (process.env.OPENAI_API_KEY)    return 'openai/gpt-4o'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic/claude-sonnet-4-5'
  return 'none'
}
