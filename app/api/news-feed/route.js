export const dynamic = 'force-dynamic'

/**
 * GET /api/news-feed?limit=20&offset=6&category=news
 * Used by LiveNewsGrid client component for auto-refresh every 5 min.
 * Returns fresh articles from Sanity.
 */
import { fetchArticlesPaginated } from '@/sanity/lib/client'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const offset   = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category') || null
    const page     = Math.floor(offset / limit) + 1

    const data = await fetchArticlesPaginated({ page, perPage: limit, category })

    return Response.json({
      articles: data.articles || data,
      count: (data.articles || data).length,
      total: data.total,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json({ error: err.message, articles: [] }, { status: 500 })
  }
}
