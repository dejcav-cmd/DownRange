export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// Exact images for specific slugs — manually curated
const MANUAL_PATCHES = [
  {
    slug:     'iron-sights-for-handguns-are-they-on-the-way-out',
    imageUrl: '/img/photos/pistol.jpg',
    reason:   'handguns article → pistol image',
  },
  {
    slug:     'most-viewed-bills-week-of-may-24-2026',
    imageUrl: '/img/photos/law.jpg',
    reason:   'legislation/bills article → law image',
  },
  {
    slug:     'saf-files-lawsuit-challenging-newly-signed-maryland-glock-ban',
    imageUrl: '/img/photos/law.jpg',
    reason:   'SAF lawsuit / Maryland Glock ban → law image',
  },
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = []

  for (const patch of MANUAL_PATCHES) {
    try {
      const article = await sanity.fetch(
        '*[_type=="newsArticle" && slug.current==$slug][0]{_id, title, imageUrl, approved}',
        { slug: patch.slug }
      )

      if (!article) {
        results.push({ slug: patch.slug, status: 'not found' })
        continue
      }

      await sanity.patch(article._id).set({ imageUrl: patch.imageUrl }).commit()

      results.push({
        slug:    patch.slug,
        title:   article.title,
        old:     article.imageUrl || 'none',
        new:     patch.imageUrl.split('/').pop(),
        reason:  patch.reason,
        status:  'patched',
      })
    } catch (e) {
      results.push({ slug: patch.slug, status: 'error', error: e.message })
    }
  }

  return Response.json({ ok: true, results })
}

export async function GET(req) { return POST(req) }
