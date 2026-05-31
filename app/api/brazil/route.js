import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

async function fetchImage(query) {
  const pKey = process.env.PEXELS_API_KEY
  if (pKey) {
    try {
      const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, { headers: { Authorization: pKey } })
      const d = await r.json()
      const p = d.photos?.[0]
      if (p) return p.src.large2x || p.src.large
    } catch {}
  }
  const xKey = process.env.PIXABAY_API_KEY
  if (xKey) {
    try {
      const r = await fetch(`https://pixabay.com/api/?key=${xKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=1200&per_page=5&safesearch=true`)
      const d = await r.json()
      const h = d.hits?.[0]
      if (h) return h.largeImageURL || h.webformatURL
    } catch {}
  }
  return null
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const all  = searchParams.get('all')
  // When all=1 (admin), skip active filter; otherwise only show active==true
  const activeFilter = all ? '' : ' && active==true'
  const query = type
    ? '*[_type=="brazilContent" && type==$type' + activeFilter + '] | order(order asc, publishedAt desc)'
    : '*[_type=="brazilContent"' + activeFilter + '] | order(type asc, order asc)'
  const items = await sanity.fetch(query, type ? { type } : {}).catch(() => [])
  return Response.json({ ok: true, items })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { action, id } = body

  if (action === 'create') {
    const doc = await sanity.create({
      _type: 'brazilContent',
      type: body.type, title: body.title,
      slug: { _type: 'slug', current: (body.title||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80) },
      status: body.status, impact: body.impact, effectiveDate: body.effectiveDate,
      summary: body.summary, detail: body.detail, sourceUrl: body.sourceUrl,
      abbr: body.abbr, rating: body.rating, highlights: body.highlights,
      body: body.body, imageUrl: body.imageUrl, tag: body.tag,
      readMins: body.readMins, author: body.author || 'DJ Cavalcanti',
      brlPrice: body.brlPrice, usdEquiv: body.usdEquiv,
      availability: body.availability, trend: body.trend, note: body.note,
      value: body.value, color: body.color, order: body.order ?? 99,
      active: true, publishedAt: new Date().toISOString(),
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
    const { type: t, topic } = body
    const langPrompt = 'ESCREVA EM PORTUGUÊS BRASILEIRO FLUENTE. Sem rodeios. Tom direto. Autor: DJ Cavalcanti.'
    const prompts = {
      artigo: `${langPrompt}\n\nEscreva um artigo de 900-1100 palavras sobre: ${topic}.\nContexto: mercado de armas e leis no Brasil. Formato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
      lei: `${langPrompt}\n\nEscreva um resumo detalhado (400-600 palavras) sobre esta lei/decreto de armas no Brasil: ${topic}.\nIncluir: status atual, impacto prático para atiradores, o que mudou.`,
      default: `${langPrompt}\n\nEscreva um texto informativo (300-500 palavras) sobre: ${topic} — contexto de armas de fogo no Brasil.`,
    }
    const prompt = prompts[t] || prompts.default
    const content = await callAIText({ prompt, useCase: 'brazil', maxTokens: 2000 })
    if (!content) return Response.json({ error: 'AI returned empty' }, { status: 500 })
    const imageUrl = await fetchImage(topic + ' firearms Brazil')
    await sanity.patch(id).set({ body: content, imageUrl: imageUrl || undefined, qualityReviewed: false }).commit()
    return Response.json({ ok: true, imageUrl })
  }

  if (action === 'fix-image') {
    const { title, type: t } = body
    const q = t === 'artigo' ? title + ' firearms Brazil' : title + ' gun law Brazil'
    const imageUrl = await fetchImage(q)
    if (!imageUrl) return Response.json({ error: 'No image found' }, { status: 404 })
    await sanity.patch(id).set({ imageUrl }).commit()
    return Response.json({ ok: true, imageUrl })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
