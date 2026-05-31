import { callAIText } from '@/lib/aiClient.js'

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

import { createClient } from '@sanity/client'

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

const WIKIMEDIA = {
  law:      '/img/photos/law.jpg',
  rifle:    '/img/photos/rifle.jpg',
  pistol:   '/img/photos/pistol.jpg',
  ammo:     '/img/photos/ammo.jpg',
}

function autoPickImage(title, category) {
  const t = (title || '').toLowerCase()
  if (/\bban\b|lawsuit|saf\b|nra\b|goa\b|fpc\b|court|atf\b|congress|bill\b|\blaw\b|legislat|unconstitutional|bruen|heller|maryland|challenge|ruling|injunction|second.amend/.test(t)) return WIKIMEDIA.law
  if (/pistol|handgun|glock|sig|hellcat|p365|p320|shield|bodyguard|concealed|carry|edc|ccw|9mm|45.acp|40.s&w/.test(t)) return WIKIMEDIA.pistol
  if (/ar.?15|rifle|carbine|m4\b|ak.?47|suppressor|silencer|5\.56|\.308|bolt.action/.test(t)) return WIKIMEDIA.rifle
  if (/ammo|ammunition|cartridge|\bgrain\b|fmj|jhp|hollow.point/.test(t)) return WIKIMEDIA.ammo
  const catMap = { law: WIKIMEDIA.law, breaking: WIKIMEDIA.law, opinion: WIKIMEDIA.law, industry: WIKIMEDIA.rifle, training: WIKIMEDIA.pistol }
  return catMap[category] || WIKIMEDIA.pistol
}

// ── GET — list all articles ────────────────────────────────────────────────
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const articles = await sanity.fetch(
    `*[_type == "newsArticle"] | order(publishedAt desc) [0...500] {
      _id, title, slug, category, source, imageUrl, imageAlt,
      approved, editorLocked, publishedAt, summary, body,
      externalUrl, heroImage { asset->{url} }
    }`
  )

  // Normalize — expose effective imageUrl
  const normalized = articles.map(a => ({
    ...a,
    slug: a.slug?.current || '',
    imageUrl: a.heroImage?.asset?.url || a.imageUrl || null,
    sourceUrl: a.externalUrl || null,  // alias for manager components
  }))

  return Response.json({ ok: true, articles: normalized, total: normalized.length })
}

// ── POST — patch / delete / ai-rewrite / ai-image ─────────────────────────
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { action, id } = body

  // ── PATCH — update any fields ──────────────────────────────────────────
  if (action === 'patch') {
    const { fields } = body
    if (!id || !fields) return Response.json({ error: 'id and fields required' }, { status: 400 })
    await sanity.patch(id).set(fields).commit()
    return Response.json({ ok: true })
  }

  // ── DELETE ──────────────────────────────────────────────────────────────
  if (action === 'delete') {
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })
    await sanity.delete(id)
    return Response.json({ ok: true })
  }

  // ── AI-IMAGE — Claude picks best Wikimedia image ────────────────────────
  if (action === 'ai-image') {
    const { title, category } = body
    // Use keyword logic (no Claude API call needed — the logic is good enough)
    const imageUrl = autoPickImage(title, category)
    if (id) await sanity.patch(id).set({ imageUrl }).commit()
    return Response.json({ ok: true, imageUrl })
  }

  // ── AI-REWRITE — Claude rewrites the article body ───────────────────────
  if (action === 'ai-rewrite') {
    const { title, body: articleBody, summary } = body
    if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 400 })

    const content = articleBody || summary || ''
    if (!content.trim()) return Response.json({ error: 'No content to rewrite' }, { status: 400 })

    const prompt = [
      'Rewrite this firearms news article in the voice of DJ Cavalcanti — a gun owner and 2A advocate in Washington State.',
      'Direct sentences. Specific facts. Active voice. First person where natural.',
      'BANNED WORDS: comprehensive, dive into, cutting-edge, robust, leverage, game-changer, seamlessly, unprecedented, stakeholder',
      '',
      'Title: ' + title,
      '',
      'Original:',
      content.slice(0, 3000),
      '',
      'Rewrite as 3-4 solid paragraphs. No headers. Return plain text only.',
    ].join('\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }),
    })
    const d = await res.json()
    const rewritten = d.content?.[0]?.text?.trim()
    if (!rewritten) return Response.json({ error: 'Claude returned empty response' }, { status: 500 })

    if (id) await sanity.patch(id).set({ body: rewritten }).commit()
    return Response.json({ ok: true, body: rewritten })
  }

  
  if (action === 'fix-image') {
    const imageUrl = await fetchImageForItem(body.title, body.category || body.type)
    if (!imageUrl) return Response.json({ error: 'No image found' }, { status: 404 })
    await sanity.patch(id).set({ imageUrl }).commit()
    return Response.json({ ok: true, imageUrl })
  }

  return Response.json({ error: 'Unknown action: ' + action }, { status: 400 })
}
