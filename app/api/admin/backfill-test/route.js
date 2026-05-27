export const dynamic = 'force-dynamic'

// Diagnostic endpoint — tests each backfill dependency step by step
export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {}

  // Step 1: env vars
  results.env = {
    ANTHROPIC_API_KEY:   !!process.env.ANTHROPIC_API_KEY,
    SANITY_API_TOKEN:    !!process.env.SANITY_API_TOKEN,
    SANITY_PROJECT_ID:   !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    ADMIN_KEY:           !!process.env.ADMIN_KEY,
  }

  // Step 2: Sanity import
  try {
    const { createClient } = await import('@sanity/client')
    results.sanityImport = 'ok'

    // Step 3: Sanity connection
    try {
      const sanity = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
        dataset: 'production',
        apiVersion: '2024-01-01',
        useCdn: false,
        token: process.env.SANITY_API_TOKEN,
      })
      const count = await sanity.fetch('count(*[_type == "newsArticle"])')
      results.sanityQuery = `ok — ${count} articles`
    } catch (e) {
      results.sanityQuery = `FAILED: ${e.message}`
    }
  } catch (e) {
    results.sanityImport = `FAILED: ${e.message}`
  }

  // Step 4: Anthropic API
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'say ok' }],
      }),
    })
    const d = await res.json()
    if (res.ok) {
      results.anthropicApi = `ok — ${d.content?.[0]?.text || 'responded'}`
    } else {
      results.anthropicApi = `FAILED ${res.status}: ${JSON.stringify(d).slice(0, 100)}`
    }
  } catch (e) {
    results.anthropicApi = `FAILED: ${e.message}`
  }

  return Response.json({ ok: true, results })
}
