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

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    // Pull drafts + scheduled from all content types
    const [blogs, releases, news] = await Promise.all([
      sanity.fetch(`*[_type == "blogPost" && status in ["draft","scheduled"]] | order(_createdAt desc) [0...50] {
        _id, title, slug, status, scheduledAt, _createdAt
      }`),
      sanity.fetch(`*[_type == "firearmRelease" && status in ["draft","scheduled"]] | order(_createdAt desc) [0...50] {
        _id, title, slug, status, scheduledAt, _createdAt
      }`),
      sanity.fetch(`*[_type == "newsArticle" && approved != true] | order(publishedAt desc) [0...50] {
        _id, title, slug, category, publishedAt, approved
      }`),
    ])

    const schedules = [
      ...blogs.map(p => ({ ...p, type: 'Blog Post' })),
      ...releases.map(p => ({ ...p, type: 'Gun Release' })),
      ...news.map(p => ({ ...p, type: 'News Article', status: 'pending-approval', scheduledAt: p.publishedAt })),
    ].sort((a, b) => new Date(b._createdAt || b.scheduledAt) - new Date(a._createdAt || a.scheduledAt))

    return Response.json({ ok: true, schedules })
  } catch (e) {
    return Response.json({ ok: false, error: e.message, schedules: [] }, { status: 500 })
  }
}

// PATCH — update scheduled publish time
export async function PATCH(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, scheduledAt, status } = await req.json()
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })
    const fields = {}
    if (scheduledAt) fields.scheduledAt = scheduledAt
    if (status)      fields.status      = status
    await sanity.patch(id).set(fields).commit()
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
