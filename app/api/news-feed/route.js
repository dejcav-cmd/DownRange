export const dynamic = 'force-dynamic'

/**
 * GET /api/news-feed?limit=20&offset=6&category=news
 * Used by LiveNewsGrid client component for auto-refresh every 5 min.
 * Returns fresh articles from Sanity.
 */
import { fetchArticles } from '@/sanity/lib/client'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const category = searchParams.get('category') || null

    const articles = await fetchArticles(limit, category)

    return Response.json({
      articles,
      count: articles.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json({ error: err.message, articles: [] }, { status: 500 })
  }
}
