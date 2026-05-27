export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

function auth(req) {
  const k = req.headers.get('x-admin-key')
  return k && k === process.env.ADMIN_KEY
}

// POST — create a new breaking alert
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { headline, url, urgency } = await req.json()
    if (!headline) return Response.json({ error: 'headline required' }, { status: 400 })
    const doc = {
      _type:        'breakingAlert',
      headline,
      sourceUrl:    url || null,
      urgencyScore: urgency || 7,
      active:       true,
      publishedAt:  new Date().toISOString(),
    }
    const result = await sanity.create(doc)
    return Response.json({ ok: true, id: result._id })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// DELETE — remove a breaking alert by id
export async function DELETE(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await req.json()
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })
    await sanity.delete(id)
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
