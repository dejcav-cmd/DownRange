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

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Query gunDeal type (migrated from newsArticle category=deals)
  const deals = await sanity.fetch(
    `*[_type == "gunDeal"] | order(publishedAt desc, _createdAt desc) [0...300] {
      _id, title, "slug": {"current": _id}, category, source, imageUrl,
      approved, editorLocked, publishedAt, _createdAt, summary,
      externalUrl, price, store, tags
    }`
  )

  // Normalize to match UCE expectations
  const normalized = deals.map(d => ({
    ...d,
    slug:      d.slug?.current || d._id,
    imageUrl:  d.imageUrl || null,
    sourceUrl: d.externalUrl || null,
    // UCE needs a body field even if empty
    body:      d.summary || '',
    category:  d.category || 'deal',
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
    await sanity.patch(id).set(fields).commit()
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
    const hash = Math.random().toString(36).slice(2, 8)
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

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
