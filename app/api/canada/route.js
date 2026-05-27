import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// ── GET — fetch all canada content by type ───────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')  // law|province|article|ammo|alert|stat
  const all  = searchParams.get('all')   // admin: fetch everything

  const query = type
    ? `*[_type=="canadaContent" && type==$type && active==true] | order(order asc, publishedAt desc)`
    : `*[_type=="canadaContent"${all ? '' : ' && active==true'}] | order(type asc, order asc)`

  const items = await sanity.fetch(query, type ? { type } : {}).catch(() => [])
  return Response.json({ ok: true, items })
}

// ── POST — create/patch/delete/ai-write ─────────────────────────────────────
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { action, id } = body

  if (action === 'create') {
    const doc = await sanity.create({
      _type:       'canadaContent',
      type:        body.type,
      title:       body.title,
      slug:        { _type: 'slug', current: (body.title||'').toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      status:      body.status,
      impact:      body.impact,
      effectiveDate: body.effectiveDate,
      summary:     body.summary,
      detail:      body.detail,
      sourceUrl:   body.sourceUrl,
      abbr:        body.abbr,
      rating:      body.rating,
      highlights:  body.highlights || [],
      body:        body.body,
      imageUrl:    body.imageUrl,
      tag:         body.tag,
      readMins:    body.readMins,
      author:      body.author || 'DJ Cavalcanti',
      cadPrice:    body.cadPrice,
      usdEquiv:    body.usdEquiv,
      availability:body.availability,
      trend:       body.trend,
      note:        body.note,
      value:       body.value,
      color:       body.color,
      order:       body.order || 99,
      active:      true,
      publishedAt: new Date().toISOString(),
    })
    return Response.json({ ok: true, id: doc._id })
  }

  if (action === 'patch') {
    const { fields } = body
    await sanity.patch(id).set(fields).commit()
    return Response.json({ ok: true })
  }

  if (action === 'delete') {
    await sanity.delete(id)
    return Response.json({ ok: true })
  }

  if (action === 'ai-write') {
    // AI write an article about a Canadian topic
    const { topic, type: contentType } = body
    if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 400 })

    const prompt = [
      `Write a Canadian firearms ${contentType === 'article' ? 'analysis article' : 'summary'} about: ${topic}`,
      'You are DJ Cavalcanti — a gun owner and 2A advocate based in Washington State who also covers Canadian firearms law.',
      '',
      'VOICE: Direct, informed, written for gun owners — not a legal brief. Explain the real-world impact.',
      'BANNED: comprehensive, game-changer, cutting-edge, seamlessly, unprecedented',
      contentType === 'article'
        ? 'FORMAT: 400-700 word HTML article (h2, p, ul, li, strong only). No h1. End with <p><strong>Bottom Line:</strong>...</p>'
        : 'FORMAT: 2-3 sentence plain text summary.',
      'Return the content only — no preamble.',
    ].join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    })
    const d = await res.json()
    const content = d.content?.[0]?.text?.trim()
    if (!content) return Response.json({ error: 'Claude returned empty' }, { status: 500 })

    if (id) await sanity.patch(id).set(contentType === 'article' ? { body: content } : { summary: content }).commit()
    return Response.json({ ok: true, content })
  }

  if (action === 'seed') {
    // Seed the static page data into Sanity for first-time setup
    const { FEDERAL_LAWS, PROVINCES, ARTICLES, AMMO_DATA } = body
    let created = 0
    for (const item of [...(FEDERAL_LAWS||[]), ...(PROVINCES||[]), ...(ARTICLES||[]), ...(AMMO_DATA||[])]) {
      try {
        await sanity.create({ _type: 'canadaContent', ...item, active: true, publishedAt: new Date().toISOString() })
        created++
      } catch {}
    }
    return Response.json({ ok: true, created })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
