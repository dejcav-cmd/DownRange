import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: 'vbnsqnkg', dataset: 'production',
  apiVersion: '2023-08-01', token: process.env.SANITY_API_TOKEN, useCdn: false,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// Image search helpers for fix-image action
async function searchPexels(query) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    return data.photos?.[0]?.src?.large || null
  } catch { return null }
}

async function searchPixabay(query) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) return null
  try {
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=800&per_page=3&safesearch=true`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    const hit = (data.hits || [])[0]
    return hit?.largeImageURL || hit?.webformatURL || null
  } catch { return null }
}

function dealQuery(title = '') {
  const t = title.toLowerCase()
  if (/pistol|handgun|glock|sig|beretta|1911|revolver/.test(t)) return 'handgun pistol firearm deal'
  if (/rifle|ar.?15|carbine|ak|bolt/.test(t)) return 'rifle firearm AR-15 deal'
  if (/shotgun|mossberg|gauge|pump/.test(t)) return 'shotgun firearm deal'
  if (/suppressor|silencer/.test(t)) return 'firearm suppressor NFA deal'
  if (/ammo|ammunition|cartridge|bullet/.test(t)) return 'ammunition bullets firearm deal'
  if (/optic|scope|red.dot|eotech|aimpoint|trijicon|vortex/.test(t)) return 'gun optic scope deal'
  if (/holster/.test(t)) return 'gun holster concealed carry deal'
  return 'firearms gun deal sale discount'
}

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Query gunDeal type
  const deals = await sanity.fetch(
    `*[_type == "gunDeal"] | order(publishedAt desc, _createdAt desc) [0...300] {
      _id, title, "slug": {"current": _id}, category, source, imageUrl,
      approved, publishedAt, _createdAt, summary,
      externalUrl, price, store, tags
    }`
  )

  // Normalize to match UCE expectations
  const normalized = deals.map(d => ({
    ...d,
    slug:        d.slug?.current || d._id,
    imageUrl:    d.imageUrl || null,
    sourceUrl:   d.externalUrl || null,
    body:        d.summary || '',
    category:    d.category || 'deal',
    editorLocked: false,  // gunDeal doesn't have editorLocked; default to false so UCE renders correctly
  }))

  return NextResponse.json({ ok: true, articles: normalized, total: normalized.length })
}

export async function POST(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { action, id } = body

  if (action === 'patch') {
    const { fields } = body
    if (!id || !fields) return NextResponse.json({ error: 'id and fields required' }, { status: 400 })
    // Strip fields that don't exist in gunDeal schema
    const { editorLocked, status, ...safeFields } = fields
    await sanity.patch(id).set(safeFields).commit()
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await sanity.delete(id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'create') {
    const { title, source, externalUrl, imageUrl, summary, price } = body
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    const doc = {
      _type:       'gunDeal',
      title,
      category:    'deal',
      source:      source || 'DownRange',
      externalUrl: externalUrl || null,
      imageUrl:    imageUrl || null,
      summary:     summary || null,
      price:       price || null,
      approved:    true,
      publishedAt: new Date().toISOString(),
    }
    const created = await sanity.create(doc)
    return NextResponse.json({ ok: true, id: created._id })
  }

  // UCE fix-image action — search Pexels/Pixabay for a deal product image
  if (action === 'fix-image') {
    const { title } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const query = dealQuery(title || '')
    const imageUrl = await searchPexels(query) || await searchPixabay(query)
    if (!imageUrl) return NextResponse.json({ ok: false, error: 'No image found' })
    await sanity.patch(id).set({ imageUrl }).commit()
    return NextResponse.json({ ok: true, imageUrl })
  }

  // UCE ai-write action — not applicable for deals, but acknowledge gracefully
  if (action === 'ai-write') {
    return NextResponse.json({ ok: false, error: 'AI write not supported for deals' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
