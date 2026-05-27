export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const tag      = searchParams.get('tag')
  const limit    = parseInt(searchParams.get('limit') || '100')

  const filter = [
    `_type == "imageAsset"`,
    `approved == true`,
    category && `category == "${category}"`,
    tag && `"${tag}" in tags`,
  ].filter(Boolean).join(' && ')

  const images = await sanity.fetch(
    `*[${filter}] | order(usageCount asc, _createdAt desc) [0...${limit}] {
      _id, title, alt, category, tags, source, cdnUrl, imageUrl, usageCount, _createdAt
    }`
  )

  return Response.json({ ok: true, images, total: images.length })
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error:'Unauthorized' }, { status:401 })

  const { action, articleId, imageId, imageUrl } = await req.json().catch(() => ({}))

  if (action === 'assign') {
    // Assign an image from the repo to an article
    if (!articleId || !imageUrl) return Response.json({ error:'Missing articleId or imageUrl' }, { status:400 })

    await sanity.patch(articleId).set({ imageUrl }).commit()

    // Increment usage count
    if (imageId) {
      await sanity.patch(imageId).inc({ usageCount: 1 }).commit()
    }

    return Response.json({ ok: true, articleId, imageUrl })
  }

  if (action === 'add') {
    // Manually add an image to the repo
    const { title, category, tags, source, cdnUrl } = await req.json().catch(() => ({}))
    if (!title || !cdnUrl) return Response.json({ error:'Missing title or cdnUrl' }, { status:400 })

    const doc = await sanity.create({
      _type: 'imageAsset', title, category: category || 'news',
      tags: tags || [], source: source || 'Manual upload',
      cdnUrl, imageUrl: cdnUrl, approved: true, usageCount: 0,
    })
    return Response.json({ ok: true, id: doc._id })
  }

  if (action === 'delete') {
    if (!imageId) return Response.json({ error:'Missing imageId' }, { status:400 })
    await sanity.delete(imageId)
    return Response.json({ ok: true })
  }

  // Auto-assign: find best match for an article based on category+tags
  if (action === 'auto-assign') {
    const { articleId, title, category, tags } = await req.json().catch(() => ({}))
    if (!articleId) return Response.json({ error:'Missing articleId' }, { status:400 })

    // Build GROQ to find best matching image
    const catFilter = category ? `category == "${category}"` : 'true'
    const tagFilter = tags?.length
      ? `count(tags[@ in ${JSON.stringify(tags)}]) > 0`
      : 'true'

    const candidates = await sanity.fetch(
      `*[_type == "imageAsset" && approved == true && ${catFilter}] | order(usageCount asc) [0...10] {
        _id, title, cdnUrl, imageUrl, usageCount, tags
      }`
    )

    if (!candidates.length) return Response.json({ ok: false, error: 'No images in repo for this category' })

    // Pick one with least usage
    const chosen = candidates[0]
    await sanity.patch(articleId).set({ imageUrl: chosen.cdnUrl || chosen.imageUrl }).commit()
    await sanity.patch(chosen._id).inc({ usageCount: 1 }).commit()

    return Response.json({ ok: true, articleId, imageUrl: chosen.cdnUrl, imageTitle: chosen.title })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
