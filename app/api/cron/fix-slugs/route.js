export const dynamic = 'force-dynamic'
export const maxDuration = 120
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const key = req.headers.get('x-admin-key')
  const cron = req.headers.get('authorization')
  return key === process.env.ADMIN_KEY ||
    cron === 'Bearer ' + process.env.CRON_SECRET ||
    req.headers.get('x-vercel-cron') === '1'
}

function isHashSlug(slug) {
  return typeof slug === 'string' && /^[a-z]+-[a-f0-9]{20,}$/.test(slug)
}

function buildSlug(title, _id) {
  const raw = (title || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/, '')
    .slice(0, 80)
  const suffix = (_id || '').replace(/^[a-z]+-/, '').slice(0, 6) || 'fixed'
  return raw ? `${raw}-${suffix}` : `article-${suffix}`
}

export async function GET(req) {
  const t0 = Date.now()
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = parseInt(new URL(req.url).searchParams.get('limit') || '200')

  // Find all newsArticles where slug.current matches the hash-style pattern
  const articles = await sanity.fetch(
    `*[_type == "newsArticle" && defined(slug.current) && editorLocked != true]
     | order(_createdAt desc) [0...${limit}]
     { _id, title, sourceTitle, "slugCurrent": slug.current, publishedAt }`
  )

  const badSlugs = articles.filter(a => isHashSlug(a.slugCurrent))
  console.log(`[FIX-SLUGS] Found ${badSlugs.length} hash-slug articles out of ${articles.length} checked`)

  const results = []
  for (const art of badSlugs) {
    const newSlug = buildSlug(art.title || art.sourceTitle, art._id)
    try {
      await sanity.patch(art._id).set({
        slug: { _type: 'slug', current: newSlug }
      }).commit()
      results.push({ _id: art._id, old: art.slugCurrent, new: newSlug, ok: true })
      console.log(`[FIX-SLUGS] Fixed: ${art._id} → ${newSlug}`)
    } catch (e) {
      results.push({ _id: art._id, old: art.slugCurrent, error: e.message, ok: false })
    }
  }

  await reportCronRun('fix-slugs', {
    status: 'success',
    ms: Date.now() - t0,
    details: `Fixed ${results.filter(r=>r.ok).length}/${badSlugs.length} hash slugs`,
  }).catch(() => {})

  return Response.json({
    ok: true,
    checked: articles.length,
    found: badSlugs.length,
    fixed: results.filter(r => r.ok).length,
    results,
    ms: Date.now() - t0,
  })
}

// Also allow POST for manual trigger
export const POST = GET
