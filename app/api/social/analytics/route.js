/**
 * Social Media Analytics — fetch + store metrics from Zernio and Bluesky AT Protocol
 * GET  /api/social/analytics?refresh=1  — fetch fresh from platforms, store in Sanity
 * GET  /api/social/analytics            — return stored metrics from Sanity
 */
export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const key  = req.headers.get('x-admin-key')
  const cron = req.headers.get('authorization')
  return key === process.env.ADMIN_KEY || cron === 'Bearer ' + process.env.CRON_SECRET
}

// ── Fetch Zernio analytics for a single post ──────────────────────────────────
async function fetchZernioAnalytics(postId) {
  const apiKey = process.env.ZERNIO_API_KEY
  if (!apiKey || !postId) return null
  try {
    const res  = await fetch(`https://zernio.com/api/v1/analytics/${postId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    if (!res.ok) return null
    const data = await res.json()
    // Normalize — handle both response shapes
    const tw = data.platforms?.twitter || data.platformAnalytics?.find(p => p.platform === 'twitter')?.analytics || {}
    return {
      impressions:     tw.impressions    || data.analytics?.impressions    || 0,
      likes:           tw.likes          || data.analytics?.likes          || 0,
      reposts:         tw.retweets       || tw.reposts || data.analytics?.shares || 0,
      replies:         tw.replies        || tw.comments || data.analytics?.comments || 0,
      clicks:          tw.clicks         || data.analytics?.clicks         || 0,
      engagementRate:  tw.engagementRate || data.analytics?.engagementRate || 0,
    }
  } catch { return null }
}

// ── Fetch Bluesky post metrics via AT Protocol ────────────────────────────────
async function fetchBlueskyAnalytics(postUri) {
  if (!postUri) return null
  try {
    // AT Protocol: get post thread to read like/repost counts
    const res  = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(postUri)}&depth=0`,
      { headers: { 'Accept': 'application/json' } }
    )
    if (!res.ok) return null
    const data  = await res.json()
    const post  = data.thread?.post
    if (!post) return null
    return {
      likes:    post.likeCount    || 0,
      reposts:  post.repostCount  || 0,
      replies:  post.replyCount   || 0,
      impressions: 0, // Bluesky public API doesn't expose impressions
      clicks:   0,
      engagementRate: 0,
    }
  } catch { return null }
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const refresh = searchParams.get('refresh') === '1'

  if (refresh) {
    // Fetch all posted posts that have a postId and were posted in last 30 days
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const posts  = await sanity.fetch(
      `*[_type == "socialPost" && status == "posted" && defined(postId) && postedAt > $cutoff]{
        _id, platform, postId, postUrl, articleTitle, postedAt,
        "metrics": metrics
      }`,
      { cutoff }
    ).catch(() => [])

    let updated = 0
    for (const post of posts) {
      let metrics = null
      if (post.platform === 'twitter') {
        metrics = await fetchZernioAnalytics(post.postId)
      } else if (post.platform === 'bluesky') {
        // postId for Bluesky is the AT URI (at://did:.../app.bsky.feed.post/rkey)
        metrics = await fetchBlueskyAnalytics(post.postId)
      }

      if (metrics) {
        await sanity.patch(post._id).set({
          metrics: {
            likes:         metrics.likes,
            reposts:       metrics.reposts,
            replies:       metrics.replies,
            impressions:   metrics.impressions,
            clicks:        metrics.clicks,
            engagementRate:metrics.engagementRate,
            lastFetched:   new Date().toISOString(),
          }
        }).commit().catch(() => {})
        updated++
      }
    }
    return Response.json({ ok: true, refreshed: posts.length, updated })
  }

  // Return stored analytics summary
  const posts = await sanity.fetch(
    `*[_type == "socialPost" && status == "posted" && defined(metrics)] | order(postedAt desc)[0...100]{
      _id, platform, articleTitle, postedAt, postUrl,
      "likes":       metrics.likes,
      "reposts":     metrics.reposts,
      "replies":     metrics.replies,
      "impressions": metrics.impressions,
      "clicks":      metrics.clicks,
      "engagementRate": metrics.engagementRate,
      "lastFetched": metrics.lastFetched,
    }`
  ).catch(() => [])

  // Aggregate totals
  const totals = posts.reduce((acc, p) => ({
    impressions:   (acc.impressions   || 0) + (p.impressions || 0),
    likes:         (acc.likes         || 0) + (p.likes       || 0),
    reposts:       (acc.reposts       || 0) + (p.reposts     || 0),
    replies:       (acc.replies       || 0) + (p.replies     || 0),
    clicks:        (acc.clicks        || 0) + (p.clicks      || 0),
  }), {})

  return Response.json({ ok: true, posts, totals })
}
