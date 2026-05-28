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

function stripAttribution(body) {
  if (!body || typeof body !== 'string') return body
  // Remove all variants of the embedded attribution div
  return body
    .replace(/<div[^>]+class=["\']dr-source-attribution["\'][\s\S]*?<\/div>\s*/gi, '')
    .trim()
}

// POST /api/admin/patch-by-slug
// Body: { slug, fields } — patch any newsArticle by its slug
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { slug, fields, imageUrl, stripAttrib } = await req.json()

    if (!slug) return Response.json({ error: 'slug required' }, { status: 400 })

    // Find the article
    const article = await sanity.fetch(
      '*[_type == "newsArticle" && slug.current == $slug][0]{ _id, title, imageUrl, body }',
      { slug }
    )

    if (!article) return Response.json({ error: 'Article not found for slug: ' + slug }, { status: 404 })

    const patch = { ...fields }

    // Apply imageUrl if provided
    if (imageUrl) patch.imageUrl = imageUrl

    // Strip attribution from body if requested (or if body has it)
    if (stripAttrib !== false && article.body) {
      const stripped = stripAttribution(article.body)
      if (stripped !== article.body) {
        patch.body = stripped
      }
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ ok: true, message: 'Nothing to update', _id: article._id, title: article.title })
    }

    await sanity.patch(article._id).set(patch).commit()

    return Response.json({
      ok: true,
      _id: article._id,
      title: article.title,
      patched: Object.keys(patch),
      message: 'Updated: ' + Object.keys(patch).join(', '),
    })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
