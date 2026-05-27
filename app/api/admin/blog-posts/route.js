import { createClient } from '@sanity/client'
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

// GET — list all blog posts
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const posts = await sanity.fetch(
      `*[_type == "blogPost"] | order(publishedAt desc) [0...200] {
        _id, title, slug, category, status, publishedAt, readTime,
        heroImage { asset->{ url } }
      }`
    )
    return Response.json({ ok: true, posts })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// POST — patch or delete a blog post
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

    return Response.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
