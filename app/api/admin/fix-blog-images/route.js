export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const articles = [
  {
    slug: 'gun-prices-tariffs-2026',
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=900&fit=crop'
  },
  {
    slug: 'bruen-standard-state-battles-2026',
    imageUrl: 'https://images.unsplash.com/photo-1554115176-72a380f824c7?w=1400&h=900&fit=crop'
  },
  {
    slug: 'micro-compact-pistol-market-2026',
    imageUrl: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&h=900&fit=crop'
  }
]

export async function POST(req) {
  const t0 = Date.now()
  const adminKey = req.headers.get('x-admin-key')
  
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[FIX-BLOG-IMAGES] Starting blog image fix...')

    const docs = await sanity.fetch(
      `*[_type == "blogPost" && slug.current in [${articles.map(a => `"${a.slug}"`).join(',')}]] {
        _id, slug, title, imageUrl
      }`
    )

    console.log(`[FIX-BLOG-IMAGES] Found ${docs.length} blog posts`)

    if (docs.length === 0) {
      return Response.json({ error: 'No blog posts found', ms: Date.now() - t0 }, { status: 404 })
    }

    const mutations = docs.map(doc => ({
      patch: {
        id: doc._id,
        set: {
          imageUrl: articles.find(a => a.slug === doc.slug.current)?.imageUrl
        }
      }
    })).filter(m => m.patch.set.imageUrl)

    console.log(`[FIX-BLOG-IMAGES] Applying ${mutations.length} mutations`)

    if (mutations.length > 0) {
      await sanity.mutate(mutations)
    }

    const results = docs.map(doc => {
      const article = articles.find(a => a.slug === doc.slug.current)
      return {
        slug: doc.slug.current,
        title: doc.title,
        oldImage: doc.imageUrl,
        newImage: article?.imageUrl
      }
    })

    const ms = Date.now() - t0
    const message = `Updated ${mutations.length} blog post images in ${ms}ms`

    console.log(`[FIX-BLOG-IMAGES] ✓ ${message}`)

    await reportCronRun('fix-blog-images', {
      status: 'success',
      ms,
      details: `Updated ${mutations.length} blog posts with real images`
    }).catch(() => {})

    return Response.json({
      ok: true,
      message,
      updated: mutations.length,
      results,
      ms
    })

  } catch (err) {
    console.error('[FIX-BLOG-IMAGES] Error:', err.message)
    const ms = Date.now() - t0

    await reportCronRun('fix-blog-images', {
      status: 'failed',
      ms,
      error: err.message
    }).catch(() => {})

    return Response.json({
      error: err.message,
      ms
    }, { status: 500 })
  }
}
