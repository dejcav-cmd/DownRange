// app/api/newsletter/content/route.js
export const dynamic = 'force-dynamic'
import { client } from '@/sanity/lib/client'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const adminKey = searchParams.get('adminKey')
    if (adminKey && adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    // Top 6 news from last 48 hours
    const news = await client.fetch(`
      *[_type == "newsArticle" && publishedAt > $time && approved == true]
      | order(publishedAt desc)[0...6] {
        _id, title, slug, summary, category, urgencyScore,
        imageUrl, publishedAt, author->{name}
      }
    `, { time: fortyEightHoursAgo })

    // Latest 3 published blog posts (no time filter — just most recent)
    const blogs = await client.fetch(`
      *[_type == "blogPost" && status == "published"]
      | order(publishedAt desc)[0...3] {
        _id, title, slug, summary, imageUrl, publishedAt, author->{name}
      }
    `)

    // Latest deals (no time filter — just most recent with prices)
    const deals = await client.fetch(`
      *[_type == "gunDeal" && defined(dealPrice)]
      | order(_createdAt desc)[0...8] {
        _id, title, retailer, originalPrice, dealPrice,
        savings, url, imageUrl, category, _createdAt
      }
    `)

    return Response.json({
      news,
      blogs,
      deals,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[newsletter/content] Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
