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
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// GET — preview how many AmmoLand articles are miscategorized
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const articles = await sanity.fetch(`
    *[_type == "newsArticle" && source match "AmmoLand*"] {
      _id, title, category, slug, source, publishedAt
    } | order(publishedAt desc)
  `)
  const wrongCat = articles.filter(a => a.category !== 'deals')
  return Response.json({
    ok: true,
    total: articles.length,
    wrongCategory: wrongCat.length,
    alreadyDeals: articles.length - wrongCat.length,
    preview: wrongCat.slice(0, 10).map(a => ({
      id: a._id, title: a.title, category: a.category, slug: a.slug?.current
    }))
  })
}

// POST — migrate all AmmoLand articles to category=deals
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const articles = await sanity.fetch(`
    *[_type == "newsArticle" && source match "AmmoLand*" && category != "deals"] {
      _id, title, slug, category
    }
  `)

  if (!articles.length) {
    return Response.json({ ok: true, migrated: 0, message: 'Nothing to migrate — all AmmoLand articles already in deals' })
  }

  // Patch in batches of 50
  let migrated = 0
  const errors = []
  const batch = articles.map(a => ({
    patch: {
      id: a._id,
      set: { category: 'deals' }
    }
  }))

  try {
    await sanity.mutate(batch)
    migrated = articles.length
  } catch (err) {
    errors.push(err.message)
  }

  return Response.json({
    ok: errors.length === 0,
    migrated,
    errors,
    articles: articles.slice(0, 20).map(a => ({
      id: a._id, title: a.title, slug: a.slug?.current, wasCategory: a.category
    }))
  })
}
