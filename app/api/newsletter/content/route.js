// app/api/newsletter/content/route.js
// Fetch curated content for daily newsletter

import { client } from '@/sanity/lib/client'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const adminKey = searchParams.get('adminKey')
    
    // Check auth for manual preview
    if (adminKey && adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate 48-hour window
    const now = new Date()
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const isoTime = fortyEightHoursAgo.toISOString()

    // Fetch top 6 news articles from last 48 hours
    const newsArticles = await client.fetch(`
      *[_type == "newsArticle" && publishedAt > $time && approved == true] 
      | order(publishedAt desc) 
      [0...6] {
        _id,
        title,
        slug,
        summary,
        category,
        urgencyScore,
        imageUrl,
        publishedAt,
        author->{name}
      }
    `, { time: isoTime })

    // Fetch latest 3 blog articles
    const blogArticles = await client.fetch(`
      *[_type == "blogPost" && status == "published" && _createdAt > $time]
      | order(_createdAt desc)
      [0...3] {
        _id,
        title,
        slug,
        summary,
        heroImage,
        _createdAt,
        author->{name}
      }
    `, { time: isoTime })

    // Fetch latest deals
    const deals = await client.fetch(`
      *[_type == "gunDeal" && _createdAt > $time]
      | order(_createdAt desc)
      [0...8] {
        _id,
        title,
        description,
        retailer,
        originalPrice,
        dealPrice,
        savings,
        url,
        imageUrl,
        category,
        _createdAt
      }
    `, { time: isoTime })

    return Response.json({
      news: newsArticles,
      blogs: blogArticles,
      deals: deals,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('[newsletter/content] Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
