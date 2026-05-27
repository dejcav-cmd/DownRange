export const dynamic = 'force-dynamic'

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider, model, openaiKey, glmKey } = await req.json().catch(() => ({}))

  try {
    // ── Anthropic ──────────────────────────────────────────────────────────
    if (provider === 'anthropic' || !provider) {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return Response.json({ error: 'ANTHROPIC_API_KEY not set in Vercel' })

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model:      model || 'claude-sonnet-4-5',
          max_tokens: 50,
          messages:   [{ role: 'user', content: 'Reply with only: "DownRange Anthropic OK"' }],
        }),
      })
      const d = await res.json()
      if (!res.ok) return Response.json({ error: 'Anthropic API error: ' + (d.error?.message || res.status) })
      return Response.json({ ok: true, response: d.content?.[0]?.text?.trim() })
    }

    // ── OpenAI ────────────────────────────────────────────────────────────
    if (provider === 'openai') {
      const apiKey = openaiKey || process.env.OPENAI_API_KEY
      if (!apiKey) return Response.json({ error: 'No OpenAI API key. Enter it above or set OPENAI_API_KEY in Vercel.' })

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      model || 'gpt-4o',
          max_tokens: 50,
          messages:   [{ role: 'user', content: 'Reply with only: "DownRange OpenAI OK"' }],
        }),
      })
      const d = await res.json()
      if (!res.ok) return Response.json({ error: 'OpenAI error: ' + (d.error?.message || res.status) })
      return Response.json({ ok: true, response: d.choices?.[0]?.message?.content?.trim() })
    }

    // ── GLM (Z.ai / ZhipuAI) ─────────────────────────────────────────────
    if (provider === 'glm') {
      const apiKey = glmKey || process.env.GLM_API_KEY
      if (!apiKey) return Response.json({
        error: 'No GLM API key. Enter it in the field above or add GLM_API_KEY to Vercel env vars. Get a key at bigmodel.cn or z.ai.'
      })

      // Z.ai uses OpenAI-compatible endpoint
      const endpoint = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      model || 'glm-4.7',
          max_tokens: 50,
          messages:   [{ role: 'user', content: 'Reply with only: "DownRange GLM OK"' }],
        }),
      })
      const d = await res.json()
      if (!res.ok) return Response.json({
        error: 'GLM API error ' + res.status + ': ' + (d.error?.message || d.message || JSON.stringify(d).slice(0,100))
      })
      return Response.json({ ok: true, response: d.choices?.[0]?.message?.content?.trim() })
    }

    return Response.json({ error: 'Unknown provider: ' + provider })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
