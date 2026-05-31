import { createClient } from '@sanity/client'

async function fetchImageForItem(title, category) {
  const pKey = process.env.PEXELS_API_KEY
  if (pKey) {
    try {
      const r = await fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent((title||'') + ' ' + (category||'') + ' firearm') + '&per_page=5&orientation=landscape', { headers: { Authorization: pKey }, signal: AbortSignal.timeout(8000) })
      const d = await r.json()
      const p = d.photos?.[0]
      if (p) return p.src.large2x || p.src.large
    } catch {}
  }
  const xKey = process.env.PIXABAY_API_KEY
  if (xKey) {
    try {
      const r = await fetch('https://pixabay.com/api/?key=' + xKey + '&q=' + encodeURIComponent((title||'') + ' ' + (category||'') + ' firearm') + '&image_type=photo&orientation=horizontal&per_page=5&safesearch=true', { signal: AbortSignal.timeout(8000) })
      const d = await r.json()
      const h = d.hits?.[0]
      if (h) return h.largeImageURL || h.webformatURL
    } catch {}
  }
  return null
}

export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const k = req.headers.get('x-admin-key')
  return k && k === process.env.ADMIN_KEY
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const posts = await sanity.fetch(`
      *[_type == "blogPost"] | order(_createdAt desc) [0...500] {
        _id, title, slug, category, status, publishedAt, readTime,
        excerpt, body, imageUrl, author, seoTitle, metaDesc, editorLocked,
        heroImage { asset->{ url } },
        _createdAt
      }
    `)
    return Response.json({ ok: true, posts })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { action, id, fields } = body

    if (action === 'patch') {
      await sanity.patch(id).set(fields).commit()
      return Response.json({ ok: true })
    }

    if (action === 'delete') {
      await sanity.delete(id)
      return Response.json({ ok: true })
    }

    if (action === 'create') {
      const { title, category, excerpt, articleBody, imageUrl, readTime, author } = body
      if (!title) return Response.json({ error: 'title required' }, { status: 400 })
      const doc = {
        _type:      'blogPost',
        title,
        slug:       { _type:'slug', current: slugify(title) },
        category:   category || 'general',
        excerpt:    excerpt || '',
        body:       articleBody || '',
        imageUrl:   imageUrl || '/img/photos/news.jpg',
        readTime:   readTime || '5 min',
        author:     author || 'DownRange Editorial',
        status:     'draft',
        publishedAt: null,
        _createdAt:  new Date().toISOString(),
      }
      const created = await sanity.create(doc)
      return Response.json({ ok: true, post: created })
    }

    if (action === 'ai-write') {
      if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 400 })
      const { title, category } = body
      const prompt = `Write a firearms blog post titled "${title}" for category "${category}".
Write like a real gun owner — direct, specific, no AI filler phrases.
Return JSON only:
{
  "body": "<full article HTML using h2, p, ul, li, strong — 900-1100 words>",
  "excerpt": "2-sentence SEO summary",
  "readTime": "X min"
}`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
        body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:2500, messages:[{role:'user',content:prompt}] }),
      })
      const d = await res.json()
      const text = d.content?.[0]?.text || ''
      const ai = JSON.parse(text.split('```json').join('').split('```').join('').trim())
      const patchFields = {}
      if (ai.body) patchFields.body = ai.body
      if (ai.excerpt) patchFields.excerpt = ai.excerpt
      if (ai.readTime) patchFields.readTime = ai.readTime
      await sanity.patch(id).set(patchFields).commit()
      return Response.json({ ok:true, ...patchFields })
    }

    return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
