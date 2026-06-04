/**
 * DownRange Social Media Agent
 * Generates platform-optimized posts from top articles and fires them
 * via configured platform APIs. Logs everything to Sanity socialPost docs.
 */
import { createClient } from '@sanity/client'
import { callAIText }   from '../../lib/aiClient.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

// ── Platform character limits ────────────────────────────────────────────────
const LIMITS = { twitter: 280, facebook: 500, instagram: 400, linkedin: 600, threads: 500, bluesky: 300 }

// ── Default hashtag sets by category ────────────────────────────────────────
const DEFAULT_HASHTAGS = {
  law:       '#2ADefense #GunRights #SecondAmendment #GunLaws #CCW',
  news:      '#Firearms #2A #GunNews #SecondAmendment #GunOwners',
  review:    '#GunReview #Firearms #Shooting #EDC #GunLife',
  industry:  '#GunIndustry #Firearms #SHOT2026 #2A',
  breaking:  '#Breaking #GunNews #2A #SecondAmendment',
  training:  '#GunTraining #CCW #SelfDefense #Shooting #FirearmsTraining',
  default:   '#Firearms #2A #GunOwners #SecondAmendment',
}

// ── Generate platform-optimized post copy ────────────────────────────────────
async function generatePostCopy(article, platform, config) {
  const limit    = LIMITS[platform] || 280
  const hashtags = (config?.hashtagSets?.[article.category] || DEFAULT_HASHTAGS[article.category] || DEFAULT_HASHTAGS.default)
  const url      = `https://downrangeco.com/news/${article.slug?.current || article.slug}`
  const reserve  = url.length + hashtags.length + 10  // space + newlines

  const styles = {
    twitter:   'punchy, direct, like a veteran gun writer. Max impact in fewest words. Use a strong opener. No fluff.',
    facebook:  'conversational and informative. 3-4 sentences. Ask a question at the end to drive comments.',
    instagram: 'energetic, 2A culture voice. Short punchy sentences. Use line breaks between thoughts.',
    linkedin:  'professional, industry-focused. One insight paragraph + one takeaway line.',
    threads:   'casual, direct, conversational. Like talking to a fellow 2A advocate.',
    bluesky:   'clear and factual. One sentence summary + one strong opinion. 2A community voice.',
  }

  const prompt = `You are a social media manager for DownRange Co, an independent Second Amendment and firearms intelligence portal.

Write a ${platform} post about this article:
TITLE: ${article.title}
SUMMARY: ${article.summary || article.excerpt || 'Breaking 2A news'}
CATEGORY: ${article.category}
URGENCY: ${article.urgencyScore || 5}/10

Style: ${styles[platform] || styles.twitter}
Character limit for the body text: ${limit - reserve} characters MAX.
Do NOT include the URL or hashtags — those will be appended automatically.
Do NOT use quotation marks around the post.
Return ONLY the post body text. Nothing else.`

  let body = await callAIText({ prompt, useCase: 'default', maxTokens: 200 })
  body = body.replace(/^["']|["']$/g, '').trim()

  // Enforce limit
  const maxBody = limit - reserve
  if (body.length > maxBody) body = body.slice(0, maxBody - 3) + '...'

  return `${body}\n\n${url}\n\n${hashtags}`
}

// ── Platform poster functions ────────────────────────────────────────────────
async function postToTwitter(content, mediaUrl) {
  const token = process.env.TWITTER_BEARER_TOKEN
  const oauthToken = process.env.TWITTER_ACCESS_TOKEN
  const oauthSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET
  const apiKey = process.env.TWITTER_API_KEY
  const apiSecret = process.env.TWITTER_API_SECRET

  if (!apiKey || !oauthToken) return { ok: false, error: 'Twitter API keys not configured. Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET to Vercel env vars.' }

  // Twitter API v2 with OAuth 1.0a
  const crypto = await import('crypto')
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString('hex')

  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: oauthToken,
    oauth_version: '1.0',
  }

  const paramString = Object.keys(oauthParams).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join('&')

  const baseString = `POST&${encodeURIComponent('https://api.twitter.com/2/tweets')}&${encodeURIComponent(paramString)}`
  const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(oauthSecret)}`
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')

  const authHeader = 'OAuth ' + Object.keys(oauthParams).sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ') + `, oauth_signature="${encodeURIComponent(signature)}"`

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: content }),
  })

  const data = await res.json()
  if (!res.ok) return { ok: false, error: data?.detail || data?.errors?.[0]?.message || JSON.stringify(data) }

  const tweetId  = data?.data?.id
  const handle   = process.env.TWITTER_HANDLE || 'DownRangeCo'
  const postUrl  = tweetId ? `https://twitter.com/${handle}/status/${tweetId}` : null
  return { ok: true, postId: tweetId, postUrl }
}

async function postToFacebook(content, mediaUrl) {
  const token  = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const pageId = process.env.FACEBOOK_PAGE_ID

  if (!token || !pageId) return { ok: false, error: 'Facebook not configured. Add FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID to Vercel env vars.' }

  const body = mediaUrl
    ? { message: content, link: mediaUrl }
    : { message: content }

  const res  = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  })
  const data = await res.json()
  if (!res.ok || data.error) return { ok: false, error: data?.error?.message || JSON.stringify(data) }

  const postId  = data.id
  const postUrl = postId ? `https://www.facebook.com/${postId.replace('_','/')}` : null
  return { ok: true, postId, postUrl }
}

async function postToThreads(content) {
  const token  = process.env.THREADS_ACCESS_TOKEN
  const userId = process.env.THREADS_USER_ID

  if (!token || !userId) return { ok: false, error: 'Threads not configured. Add THREADS_ACCESS_TOKEN and THREADS_USER_ID to Vercel env vars.' }

  // Step 1: Create container
  const containerRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: content, media_type: 'TEXT', access_token: token }),
  })
  const container = await containerRes.json()
  if (!containerRes.ok || !container.id) return { ok: false, error: container?.error?.message || 'Failed to create Threads container' }

  // Step 2: Publish
  const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  })
  const published = await publishRes.json()
  if (!publishRes.ok) return { ok: false, error: published?.error?.message || 'Failed to publish to Threads' }

  const postId  = published.id
  const handle  = process.env.THREADS_HANDLE || 'downrangeco'
  const postUrl = postId ? `https://www.threads.net/@${handle}/post/${postId}` : null
  return { ok: true, postId, postUrl }
}

async function postToBluesky(content) {
  const handle   = process.env.BLUESKY_HANDLE
  const password = process.env.BLUESKY_APP_PASSWORD

  if (!handle || !password) return { ok: false, error: 'Bluesky not configured. Add BLUESKY_HANDLE and BLUESKY_APP_PASSWORD to Vercel env vars.' }

  // Authenticate
  const authRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password }),
  })
  const auth = await authRes.json()
  if (!authRes.ok) return { ok: false, error: auth?.message || 'Bluesky auth failed' }

  // Post
  const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auth.accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo: auth.did,
      collection: 'app.bsky.feed.post',
      record: { '$type': 'app.bsky.feed.post', text: content, createdAt: new Date().toISOString() },
    }),
  })
  const postData = await postRes.json()
  if (!postRes.ok) return { ok: false, error: postData?.message || 'Bluesky post failed' }

  const rkey    = postData.uri?.split('/').pop()
  const did     = auth.did
  const postUrl = rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : null
  return { ok: true, postId: postData.uri, postUrl }
}

// ── Platform dispatcher ──────────────────────────────────────────────────────
async function dispatchPost(platform, content, mediaUrl) {
  switch (platform) {
    case 'twitter':   return postToTwitter(content, mediaUrl)
    case 'facebook':  return postToFacebook(content, mediaUrl)
    case 'threads':   return postToThreads(content)
    case 'bluesky':   return postToBluesky(content)
    default:          return { ok: false, error: `Platform ${platform} posting not yet implemented. Configure API keys and it will activate.` }
  }
}

// ── Main run function ────────────────────────────────────────────────────────
export async function runSocialAgent({ platforms, dryRun = false, forceArticleId = null } = {}) {
  // Load config from Sanity
  const config = await sanity.fetch(
    `*[_type == "socialConfig"][0]`
  ).catch(() => null)

  const activePlatforms = platforms || config?.platforms || ['twitter']
  const minUrgency      = config?.minUrgencyScore || 5
  const postsPerPlatform = config?.postsPerDay || 3

  // Fetch top articles not yet posted today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get articles already posted today (avoid duplicates)
  const alreadyPosted = await sanity.fetch(
    `*[_type == "socialPost" && postedAt > $today].articleSlug`,
    { today: today.toISOString() }
  ).catch(() => [])
  const postedSlugs = new Set(alreadyPosted.filter(Boolean))

  // Get top articles by urgency, not yet posted
  let articles
  if (forceArticleId) {
    articles = await sanity.fetch(`*[_type == "newsArticle" && _id == $id][0..0]{_id, title, summary, excerpt, category, urgencyScore, slug, imageUrl}`, { id: forceArticleId })
    if (!Array.isArray(articles)) articles = articles ? [articles] : []
  } else {
    articles = await sanity.fetch(
      `*[_type == "newsArticle" && (status == "published" || published == true) && urgencyScore >= $min] | order(urgencyScore desc, publishedAt desc) [0...20] {
        _id, title, summary, excerpt, category, urgencyScore, "slug": slug.current, imageUrl
      }`,
      { min: minUrgency }
    ).catch(() => [])
  }

  // Filter out already-posted articles
  const candidates = articles.filter(a => !postedSlugs.has(a.slug)).slice(0, postsPerPlatform * activePlatforms.length)

  if (candidates.length === 0) {
    return { ok: true, posted: 0, message: 'No new articles to post', dryRun }
  }

  const results = []
  let posted = 0

  for (const platform of activePlatforms) {
    // Take top N articles per platform (spread by urgency)
    const platformCandidates = candidates.slice(0, postsPerPlatform)

    for (const article of platformCandidates) {
      try {
        const content = await generatePostCopy(article, platform, config)

        // Create Sanity log entry first (optimistic)
        const logDoc = await sanity.create({
          _type:        'socialPost',
          platform,
          status:       dryRun ? 'draft' : 'scheduled',
          content,
          articleSlug:  article.slug,
          articleTitle: article.title,
          urgencyScore: article.urgencyScore,
          category:     article.category,
          mediaUrl:     article.imageUrl || null,
          scheduledAt:  new Date().toISOString(),
          autoGenerated: true,
        })

        if (dryRun) {
          results.push({ platform, title: article.title, status: 'draft', content: content.slice(0, 100) + '...', docId: logDoc._id })
          continue
        }

        // Fire the post
        const result = await dispatchPost(platform, content, article.imageUrl)

        // Update Sanity log with result
        await sanity.patch(logDoc._id).set({
          status:   result.ok ? 'posted' : 'failed',
          postId:   result.postId || null,
          postUrl:  result.postUrl || null,
          postedAt: result.ok ? new Date().toISOString() : null,
          error:    result.error || null,
        }).commit()

        posted += result.ok ? 1 : 0
        results.push({
          platform,
          title:   article.title,
          status:  result.ok ? 'posted' : 'failed',
          postUrl: result.postUrl,
          error:   result.error,
          docId:   logDoc._id,
        })
      } catch (e) {
        results.push({ platform, title: article.title, status: 'error', error: e.message })
      }
    }
  }

  return { ok: true, posted, total: results.length, results, dryRun }
}
