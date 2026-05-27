export const dynamic = 'force-dynamic'

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { provider, model, openaiKey } = await req.json().catch(() => ({}))

  try {
    if (provider === 'openai') {
      const apiKey = openaiKey || process.env.OPENAI_API_KEY
      if (!apiKey) return Response.json({ error: 'No OpenAI API key provided' }, { status: 400 })

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'gpt-4o',
          max_tokens: 20,
          messages: [{ role: 'user', content: 'Say "DownRange OK" and nothing else.' }],
        }),
      })
      const d = await res.json()
      if (!res.ok) return Response.json({ error: d.error?.message || 'OpenAI error ' + res.status }, { status: 400 })
      return Response.json({ ok: true, provider: 'openai', model, response: d.choices?.[0]?.message?.content })

    } else {
      if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not set in Vercel' }, { status: 400 })

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-5',
          max_tokens: 20,
          messages: [{ role: 'user', content: 'Say "DownRange OK" and nothing else.' }],
        }),
      })
      const d = await res.json()
      if (!res.ok) return Response.json({ error: d.error?.message || 'Anthropic error ' + res.status }, { status: 400 })
      return Response.json({ ok: true, provider: 'anthropic', model, response: d.content?.[0]?.text })
    }
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
