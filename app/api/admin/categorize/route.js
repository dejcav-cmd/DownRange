export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// GET — fetch articles for categorization
export async function GET(req) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const articles = await sanity.fetch(`
    *[_type=="newsArticle"&&approved==true]|order(publishedAt desc)[0...50]{
      _id, title, category, urgencyScore, publishedAt, source, externalUrl, excerpt
    }
  `).catch(() => [])
  return Response.json({ articles })
}

// PATCH — update article category
export async function PATCH(req) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id, category } = await req.json()
  if (!id || !category) return Response.json({ error: 'Missing id or category' }, { status: 400 })
  await sanity.patch(id).set({ category }).commit()
  return Response.json({ success: true, id, category })
}
