export const dynamic = 'force-dynamic'
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

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const reviews = await sanity.fetch(`
      *[_type == "review"] | order(publishedAt desc) [0...200] {
        _id, title, slug, brand, model, caliber, category,
        score, verdict, summary, msrp, testRounds, featured,
        publishedAt, body,
        pros, cons,
        specs[] { label, value },
        heroImage { asset->{ url } }
      }
    `)
    return Response.json({ ok: true, reviews })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { action, id } = body

    if (action === 'create') {
      const { title, brand, model, caliber, category, score, verdict, summary, msrp, body: articleBody, pros, cons, imageUrl } = body
      if (!title) return Response.json({ error: 'title required' }, { status: 400 })
      const doc = {
        _type:       'review',
        title,
        slug:        { _type: 'slug', current: slugify(title) },
        brand:       brand || '',
        model:       model || '',
        caliber:     caliber || '',
        category:    category || 'Pistol',
        score:       score ? parseFloat(score) : null,
        verdict:     verdict || '',
        summary:     summary || '',
        msrp:        msrp ? parseFloat(msrp) : null,
        body:        articleBody || '',
        pros:        pros || [],
        cons:        cons || [],
        featured:    false,
        publishedAt: new Date().toISOString(),
      }
      const created = await sanity.create(doc)
      return Response.json({ ok: true, review: created })
    }

    if (action === 'patch') {
      const { fields } = body
      // Handle pros/cons as arrays
      const cleaned = { ...fields }
      if (typeof cleaned.score === 'string') cleaned.score = parseFloat(cleaned.score) || null
      if (typeof cleaned.msrp === 'string') cleaned.msrp = parseFloat(cleaned.msrp) || null
      await sanity.patch(id).set(cleaned).commit()
      return Response.json({ ok: true })
    }

    if (action === 'delete') {
      await sanity.delete(id)
      return Response.json({ ok: true })
    }

    if (action === 'ai-write') {
      const { title, brand, model, caliber, category, summary } = body
      if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 400 })
      const prompt = `Write a professional firearms review for the ${brand} ${model} (${caliber}, ${category}).
Summary: ${summary || 'Write a comprehensive review based on the specs.'}
Return JSON only:
{
  "body": "<full review HTML using h2, p, ul, li, strong — 600-900 words>",
  "pros": ["pro 1","pro 2","pro 3","pro 4","pro 5"],
  "cons": ["con 1","con 2","con 3"],
  "verdict": "one of: Best in Class, Highly Recommended, Recommended, Good Value, Average, Skip It",
  "summary": "2-sentence summary"
}`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:2000, messages:[{role:'user',content:prompt}] }),
      })
      const d = await res.json()
      const text = d.content?.[0]?.text || ''
      const clean = text.split('```json').join('').split('```').join('').trim()
      const ai = JSON.parse(clean)
      const fields = {}
      if (ai.body) fields.body = ai.body
      if (ai.pros) fields.pros = ai.pros
      if (ai.cons) fields.cons = ai.cons
      if (ai.verdict) fields.verdict = ai.verdict
      if (ai.summary) fields.summary = ai.summary
      await sanity.patch(id).set(fields).commit()
      return Response.json({ ok: true, ...fields })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
