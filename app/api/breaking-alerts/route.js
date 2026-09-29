export const dynamic = 'force-dynamic'

/**
 * GET /api/breaking-alerts
 * Returns live breaking alerts for the ticker.
 * Sources (in priority order):
 *   1. Sanity breakingAlert docs (active == true)
 *   2. Latest newsArticles with urgencyScore >= 7 (last 48 hours)
 *   3. Any latest 8 articles as fallback headlines
 */
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

export async function GET() {
  try {
    // Source 1: dedicated breaking alert docs — last 48h only, so stale alerts left
    // active can never freeze the ticker.
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const raw = await client.fetch(`
      *[_type == "breakingAlert" && active == true && publishedAt > $cutoff]
      | order(publishedAt desc) [0...10] {
        _id, headline, articleSlug, sourceUrl, url, urgencyScore, publishedAt,
        // Older alerts have no articleSlug — match our article by source URL / headline
        // Our articles are AI-retitled, so match on the original source URL first
        "matchedSlug": coalesce(
          *[_type == "newsArticle" && approved == true && defined(externalUrl)
            && (externalUrl == ^.sourceUrl || externalUrl == ^.url)][0].slug.current,
          *[_type == "newsArticle" && approved == true && title == ^.headline][0].slug.current
        )
      }
    `, { cutoff }).catch(() => [])

    // Link priority: our article -> matched article -> original source (external)
    const seen = new Set()
    const dedicated = []
    for (const a of raw) {
      const slug = a.articleSlug || a.matchedSlug
      const url = slug ? `/news/${slug}` : (a.sourceUrl || a.url || null)
      const key = slug || (a.headline || '').toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      dedicated.push({
        _id: a._id, headline: a.headline, url,
        external: !slug && !!url,
        urgencyScore: a.urgencyScore, publishedAt: a.publishedAt,
      })
      if (dedicated.length >= 8) break
    }

    if (dedicated.length >= 3) {
      return Response.json({ alerts: dedicated, source: 'breakingAlert' },
        { headers: { 'Cache-Control': 'no-store' } })
    }

    // Source 2: high-urgency articles from last 48h
    const urgent = await client.fetch(`
      *[_type == "newsArticle" && approved == true
        && urgencyScore >= 7
        && publishedAt > "${cutoff}"]
      | order(urgencyScore desc, publishedAt desc) [0...10] {
        _id, title, slug, urgencyScore, source, publishedAt, category
      }
    `).catch(() => [])

    if (urgent.length >= 2) {
      const alerts = urgent.map(a => ({
        _id:        a._id,
        headline:   a.title,
        url:        `/news/${a.slug?.current || a._id}`,
        urgencyScore: a.urgencyScore,
        source:     a.source,
        publishedAt: a.publishedAt,
      }))
      return Response.json({ alerts, source: 'urgent-articles' })
    }

    // Source 3: latest articles regardless of urgency — always show something fresh
    const latest = await client.fetch(`
      *[_type == "newsArticle" && approved == true]
      | order(publishedAt desc) [0...8] {
        _id, title, slug, urgencyScore, source, publishedAt, category
      }
    `).catch(() => [])

    const alerts = latest.map(a => ({
      _id:        a._id,
      headline:   a.title,
      url:        `/news/${a.slug?.current || a._id}`,
      urgencyScore: a.urgencyScore || 5,
      source:     a.source,
      publishedAt: a.publishedAt,
    }))

    return Response.json({ alerts, source: 'latest-articles' })
  } catch (err) {
    return Response.json({ alerts: [], error: err.message }, { status: 500 })
  }
}
