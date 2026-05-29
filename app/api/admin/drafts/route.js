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
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // 1. ALL blogPosts regardless of status (including unpublished)
    const blogPosts = await sanity.fetch(
      `*[_type == "blogPost"] | order(_createdAt desc) [0...500] {
        _id, _type, title, slug, status, publishedAt, excerpt, body, category,
        approved, editorLocked, author, _createdAt, imageUrl
      }`
    )

    // 2. ALL newsArticles where approved != true (unpublished/draft news)
    const newsArticles = await sanity.fetch(
      `*[_type == "newsArticle" && (approved != true || !defined(approved))] | order(_createdAt desc) [0...500] {
        _id, _type, title, slug, category, source, externalUrl, approved, publishedAt, summary, body, _createdAt
      }`
    )

    // 3. ALL firearmRelease drafts
    const releases = await sanity.fetch(
      `*[_type == "firearmRelease" && (approved != true || !defined(approved))] | order(_createdAt desc) [0...200] {
        _id, _type, title, slug, brand, approved, publishedAt, _createdAt
      }`
    )

    // 4. Try to access Sanity draft documents (ids starting with "drafts.")
    // These are auto-created by Sanity Studio when editing
    const draftQuery = `*[_id in path("drafts.**")] | order(_createdAt desc) [0...200] {
      _id, _type, title, slug, status, approved, publishedAt, _createdAt
    }`
    let sanityDrafts = []
    try {
      sanityDrafts = await sanity.fetch(draftQuery)
    } catch (e) {
      console.warn('Draft query failed:', e.message)
    }

    // Classify blog posts
    const published    = blogPosts.filter(p => p.status === 'published' || p.publishedAt)
    const drafts       = blogPosts.filter(p => p.status === 'draft' || p.status === 'review' || (!p.status && !p.publishedAt))
    const unpublished  = blogPosts.filter(p => p.status === 'unpublished' || p.status === 'archived')

    return Response.json({
      ok: true,
      summary: {
        blogPosts:       { total: blogPosts.length, published: published.length, drafts: drafts.length, unpublished: unpublished.length },
        newsArticles:    { unapproved: newsArticles.length },
        releases:        { unapproved: releases.length },
        sanityDrafts:    { total: sanityDrafts.length },
      },
      blogDrafts:        drafts,
      blogPublished:     published,
      blogUnpublished:   unpublished,
      unapprovedNews:    newsArticles.slice(0, 50),
      unapprovedReleases: releases.slice(0, 50),
      sanityDrafts:      sanityDrafts.slice(0, 50),
    })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// POST: publish a draft
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, id, type } = await req.json()

  if (action === 'publish') {
    const patch = {
      status: 'published',
      approved: true,
      publishedAt: new Date().toISOString(),
    }
    await sanity.patch(id).set(patch).commit()
    return Response.json({ ok: true, published: id })
  }

  if (action === 'publish-draft') {
    // Promote a Sanity draft (drafts.XXX) to published doc
    const draftDoc = await sanity.getDocument(id)
    if (!draftDoc) return Response.json({ error: 'Draft not found' }, { status: 404 })
    const publishedId = id.replace(/^drafts\./, '')
    const publishedDoc = { ...draftDoc, _id: publishedId, status: 'published', approved: true, publishedAt: new Date().toISOString() }
    delete publishedDoc._id  // let Sanity assign
    await sanity.createOrReplace({ ...publishedDoc, _id: publishedId })
    await sanity.delete(id)  // remove draft
    return Response.json({ ok: true, promoted: publishedId })
  }

  if (action === 'delete') {
    await sanity.delete(id)
    return Response.json({ ok: true, deleted: id })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
