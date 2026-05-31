
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
export const maxDuration = 60

import { callAIText } from '@/lib/aiClient.js'
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

// ── GET — list all releases ─────────────────────────────────────────────────
export async function GET(req) {
  if (!auth(req)) return Response.json({ error:'Unauthorized' }, { status:401 })

  const releases = await sanity.fetch(
    `*[_type=="firearmRelease"] | order(publishedAt desc, _createdAt desc) [0...200] {
      _id, title, slug, brand, model, category, caliber, action, msrp,
      summary, body, sourceUrl, imageUrl, approved, isJustDropped,
      publishedAt, availableDate, specs,
      heroImage { asset->{url} }
    }`
  )

  const normalized = releases.map(r => ({
    ...r,
    slug:     r.slug?.current ? r.slug : { current: '' },
    imageUrl: r.heroImage?.asset?.url || r.imageUrl || null,
  }))

  return Response.json({ ok:true, releases:normalized })
}

// ── POST — all mutations ────────────────────────────────────────────────────
export async function POST(req) {
  if (!auth(req)) return Response.json({ error:'Unauthorized' }, { status:401 })

  const body = await req.json().catch(()=>({}))
  const { action, id } = body

  // ── PATCH ──────────────────────────────────────────────────────────────────
  if (action === 'patch') {
    if (!id) return Response.json({ error:'id required' }, { status:400 })
    await sanity.patch(id).set(body.fields).commit()
    return Response.json({ ok:true })
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (action === 'delete') {
    if (!id) return Response.json({ error:'id required' }, { status:400 })
    await sanity.delete(id)
    return Response.json({ ok:true })
  }

  // ── CREATE ─────────────────────────────────────────────────────────────────
  if (action === 'create') {
    const { brand, model, category, caliber, action:actionType, msrp, sourceUrl, imageUrl, summary, body:articleBody, slug } = body
    if (!brand || !model) return Response.json({ error:'brand and model required' }, { status:400 })
    const doc = await sanity.create({
      _type:      'firearmRelease',
      title:      brand + ' ' + model,
      slug:       { _type:'slug', current: slug || (brand+'-'+model).toLowerCase().replace(/[^a-z0-9]+/g,'-') },
      brand, model, category, caliber,
      action:     actionType,
      msrp:       msrp || null,
      sourceUrl:  sourceUrl || null,
      imageUrl:   imageUrl || null,
      summary:    summary || null,
      body:       articleBody || null,
      approved:   false,
      isJustDropped: true,
      publishedAt: new Date().toISOString(),
    })
    return Response.json({ ok:true, id:doc._id })
  }

  // ── AI-REWRITE — write full article body ───────────────────────────────────
  if (action === 'ai-rewrite') {
    const { brand, model, category, caliber, msrp, summary, sourceUrl, specs } = body
    if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error:'ANTHROPIC_API_KEY not configured' }, { status:400 })

    const specList = specs?.length > 0
      ? specs.map(s => `${s.label}: ${s.value}`).join(', ')
      : [caliber&&`Caliber: ${caliber}`, category&&`Type: ${category}`, msrp&&`MSRP: $${msrp}`].filter(Boolean).join(', ')

    const prompt = [
      `Write a detailed firearms product article for the ${brand} ${model}.`,
      `You are DJ Cavalcanti, a gun owner and 2A advocate in Washington State who carries daily.`,
      '',
      `Product: ${brand} ${model}`,
      `Type: ${category || 'Firearm'}`,
      specList ? `Specs: ${specList}` : '',
      summary ? `Notes: ${summary}` : '',
      sourceUrl ? `Manufacturer page: ${sourceUrl}` : '',
      '',
      'WRITING RULES:',
      '- Write like a real gun owner reviewing gear, not a press release',
      '- Lead with what makes this gun worth paying attention to',
      '- Be specific: mention real competing guns, real use cases, who should buy it',
      '- Include: what it is, key specs, who it\'s for, how it compares to competition, bottom line',
      '- BANNED: comprehensive, game-changer, cutting-edge, innovative, robust, seamlessly, unprecedented',
      '- 600-900 words',
      '',
      'FORMAT: Return HTML using only h2, h3, p, ul, li, strong tags.',
      'End with a <p><strong>Bottom Line:</strong> ...</p>',
      'DO NOT include the gun name as an h1 — that\'s already on the page.',
      'Return ONLY the HTML, no markdown fences.',
    ].filter(Boolean).join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
      body: JSON.stringify({ model:'claude-sonnet-4-5', max_tokens:2000, messages:[{role:'user',content:prompt}] }),
    })

    const d = await res.json()
    const articleBody = d.content?.[0]?.text?.trim()
    if (!articleBody) return Response.json({ error:'Claude returned empty response' }, { status:500 })

    if (id) await sanity.patch(id).set({ body: articleBody }).commit()

    return Response.json({ ok:true, body:articleBody })
  }

  
  if (action === 'fix-image') {
    const imageUrl = await fetchImageForItem(body.title, body.category || body.type)
    if (!imageUrl) return Response.json({ error: 'No image found' }, { status: 404 })
    await sanity.patch(id).set({ imageUrl }).commit()
    return Response.json({ ok: true, imageUrl })
  }

  return Response.json({ error:'Unknown action: '+action }, { status:400 })
}
