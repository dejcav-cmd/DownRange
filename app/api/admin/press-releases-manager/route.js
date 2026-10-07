export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return !!process.env.ADMIN_KEY && req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// GET: list releases plus the last pull state
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const [rows, state] = await Promise.all([
    sanity.fetch(`*[_type == "pressRelease"] | order(publishedAt desc, _createdAt desc) [0...300] {
      _id, title, slug, brand, brandSlug, kind, category, summary, body, sourceUrl, sourceTitle, sourceDate,
      imageUrl, approved, editorLocked, publishedAt, readTime, tags,
      heroImage { asset->{url} }
    }`),
    sanity.fetch(`*[_id == "press-pull-state"][0]{ lastRunAt, lastCreated, sources }`).catch(() => null),
  ])
  const releases = rows.map(r => ({
    ...r,
    slug: r.slug?.current ? r.slug : { current: '' },
    imageUrl: r.heroImage?.asset?.url || r.imageUrl || null,
  }))
  return Response.json({ ok: true, releases, state })
}

const PATCHABLE = ['title', 'brand', 'kind', 'category', 'summary', 'body', 'sourceUrl', 'imageUrl', 'approved', 'editorLocked', 'publishedAt', 'tags']

// POST: patch / delete
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { action, id } = body
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  if (!String(id).startsWith('press-')) return Response.json({ error: 'not a press release id' }, { status: 400 })

  if (action === 'patch') {
    const fields = {}
    for (const k of PATCHABLE) if (body.fields && k in body.fields) fields[k] = body.fields[k]
    // manual edits lock the doc so a later pull never overwrites them
    fields.editorLocked = true
    await sanity.patch(id).set(fields).commit()
    return Response.json({ ok: true })
  }
  if (action === 'delete') {
    await sanity.delete(id)
    return Response.json({ ok: true })
  }
  return Response.json({ error: 'Unknown action: ' + action }, { status: 400 })
}
