// app/api/newsletter/content/route.js
export const dynamic = 'force-dynamic'
import { client } from '@/sanity/lib/client'
import { getStateBlockData, getWeeklyOutlook } from '@/lib/newsletterPersonalization'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const adminKey = searchParams.get('adminKey')
    if (adminKey && adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Preview/demo personalization — defaults to WA (DJ's home state) unless overridden,
    // e.g. /api/newsletter/content?state=TX
    const previewState = (searchParams.get('state') || 'WA').toUpperCase()

    // Newsletter moved from daily to weekly (Thursdays) — window widened from 48h to 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Top 6 news from the past week
    const news = await client.fetch(`
      *[_type == "newsArticle" && publishedAt > $time && approved == true]
      | order(publishedAt desc)[0...6] {
        _id, title, slug, summary, category, urgencyScore,
        imageUrl, publishedAt, author->{name}
      }
    `, { time: sevenDaysAgo })

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

    const [state, outlook] = await Promise.all([
      getStateBlockData(previewState),
      getWeeklyOutlook(news.slice(0, 5).map(a => a.title).concat(deals.slice(0, 3).map(d => d.title)).filter(Boolean).join(' | ')),
    ])

    return Response.json({
      news,
      blogs,
      deals,
      state,
      outlook,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[newsletter/content] Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
