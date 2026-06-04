/**
 * DownRange Social Media Agent — Free/Low-Cost Stack
 *
 * Platform strategy:
 *   Bluesky   — 100% free, AT Protocol direct, app password auth
 *   Threads   — Free, Meta Graph API (needs one-time App Review)
 *   Facebook  — Free, Meta Graph API (same app as Threads)
 *   X/Twitter — Via Buffer free tier (3 channels, 10 queued posts)
 *               Buffer absorbs the $0.20/post X API cost.
 *               Buffer API key is free with a Buffer account.
 *
 * Cost at 3 posts/day across all 4 platforms: $0/month
 */
import { createClient } from '@sanity/client'
import { callAIText }   from '../../lib/aiClient.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

// ── Platform limits & tone ────────────────────────────────────────────────────
const PLATFORMS = {
  bluesky:  { limit: 295, tone: 'sharp and direct. One strong insight + the link. Gun-owner voice. No hashtags on Bluesky — they kill reach.' },
  threads:  { limit: 450, tone: 'conversational. 2-3 punchy sentences. Ask a question to drive replies. 2A community voice.' },
  facebook: { limit: 480, tone: 'informative and community-focused. 3-4 sentences. End with a question or call to action. Slightly longer is fine.' },
  twitter:  { limit: 265, tone: 'punchy, urgent, max impact in fewest words. Strong opener. Use 2-3 relevant hashtags.' },
}

const HASHTAGS = {
  law:      '#2A #GunRights #SecondAmendment',
  news:     '#Firearms #2A #GunNews',
  review:   '#GunReview #EDC #Firearms',
  industry: '#GunIndustry #2A #Firearms',
  breaking: '#Breaking #2A #GunNews',
  training: '#CCW #SelfDefense #Firearms',
  default:  '#2A #Firearms #GunOwners',
}

// ── AI copy generator ────────────────────────────────────────────────────────
async function generateCopy(article, platform) {
  const cfg   = PLATFORMS[platform]
  const url   = `https://downrangeco.com/news/${article.slug?.current || article.slug}`
  const tags  = platform === 'twitter' ? '\n' + (HASHTAGS[article.category] || HASHTAGS.default) : ''
  const reserve = url.length + tags.length + 4
  const maxBody = cfg.limit - reserve

  const raw = await callAIText({
    prompt: `You are the social media voice for DownRange Co — an independent firearms and Second Amendment intelligence portal. The founder, DJ Cavalcanti, is a daily carrier based in Washington State.

Write a ${platform} post about this article:
TITLE: ${article.title}
SUMMARY: ${article.summary || article.excerpt || ''}
CATEGORY: ${article.category}
URGENCY: ${article.urgencyScore || 5}/10

Tone: ${cfg.tone}
Body character limit: ${maxBody} chars MAX. Count carefully.
Do NOT include the URL or hashtags — they get appended automatically.
Return ONLY the body text. No quotes, no preamble.`,
    useCase: 'default',
    maxTokens: 150,
  })

  const body = raw.replace(/^["']|["']$/g, '').trim().slice(0, maxBody)
  return `${body}\n\n${url}${tags}`
}

// ── BLUESKY image upload helper ─────────────────────────────────────────────
async function uploadImageBluesky(imageUrl, accessJwt) {
  try {
    const imgRes = await fetch(imageUrl, { headers: { 'User-Agent': 'DownRange/1.0' } })
    if (!imgRes.ok) return null
    const imgBuffer = await imgRes.arrayBuffer()
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    if (imgBuffer.byteLength > 976 * 1024) return null // Bluesky 1MB limit
    const blobRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessJwt}`, 'Content-Type': contentType },
      body: imgBuffer,
    })
    const blob = await blobRes.json()
    return blob?.blob || null
  } catch { return null }
}

// ── BLUESKY (100% free, AT Protocol) ────────────────────────────────────────
async function postBluesky(content, imageUrl = null) {
  let raw_handle = (process.env.BLUESKY_HANDLE || '').trim()
  const pass      = (process.env.BLUESKY_APP_PASSWORD || '').trim()
  if (!raw_handle || !pass) return { ok: false, error: 'Add BLUESKY_HANDLE and BLUESKY_APP_PASSWORD to Vercel env vars.' }

  let handle = raw_handle
    .replace(/[\u0000-\u001F\u007F-\u00A0\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
    .replace(/^https?:\/\/(www\.)?(bsky\.app\/profile\/)?/i, '')
    .replace(/^@+/, '').replace(/\/$/, '').replace(/\s+/g, '').toLowerCase()
  if (!handle.startsWith('did:') && !handle.includes('.')) handle += '.bsky.social'

  const authRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password: pass }),
  })
  const auth = await authRes.json()
  if (!auth.accessJwt) return { ok: false, error: `Bluesky auth failed (using identifier: "${handle}"): ${auth.message || authRes.status}. Check BLUESKY_HANDLE in Vercel.` }

  // Upload image if available
  let embed
  if (imageUrl) {
    const blob = await uploadImageBluesky(imageUrl, auth.accessJwt)
    if (blob) embed = { $type: 'app.bsky.embed.images', images: [{ image: blob, alt: 'DownRange 2A News' }] }
  }

  // Build URL facets for clickable links
  const urlRegex = /https?:\/\/[^\s]+/g
  const facets = [], encoder = new TextEncoder()
  let match
  while ((match = urlRegex.exec(content)) !== null) {
    const start = encoder.encode(content.slice(0, match.index)).length
    const end   = encoder.encode(content.slice(0, match.index + match[0].length)).length
    facets.push({ index: { byteStart: start, byteEnd: end }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: match[0] }] })
  }

  const record = {
    $type: 'app.bsky.feed.post', text: content, createdAt: new Date().toISOString(),
    ...(facets.length ? { facets } : {}),
    ...(embed ? { embed } : {}),
  }

  const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auth.accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: auth.did, collection: 'app.bsky.feed.post', record }),
  })
  const post = await postRes.json()
  if (!post.uri) return { ok: false, error: `Bluesky post failed: ${post.message || postRes.status}` }
  const rkey = post.uri.split('/').pop()
  return { ok: true, postId: post.uri, postUrl: `https://bsky.app/profile/${auth.did}/post/${rkey}`, hasImage: !!embed }
}

// ── THREADS (free, Meta Graph API) ───────────────────────────────────────────
async function postThreads(content) {
  const token  = process.env.THREADS_ACCESS_TOKEN
  const userId = process.env.THREADS_USER_ID
  if (!token || !userId) return { ok: false, error: 'Add THREADS_ACCESS_TOKEN + THREADS_USER_ID. Free via Meta for Developers → Threads API. One-time App Review required.' }

  const container = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: content, media_type: 'TEXT', access_token: token }),
  }).then(r => r.json())

  if (!container.id) return { ok: false, error: container?.error?.message || 'Threads container failed' }

  // Brief pause — Threads requires container to be ready
  await new Promise(r => setTimeout(r, 1500))

  const published = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  }).then(r => r.json())

  if (!published.id) return { ok: false, error: published?.error?.message || 'Threads publish failed' }
  const handle = process.env.THREADS_HANDLE || 'downrangeco'
  return { ok: true, postId: published.id, postUrl: `https://www.threads.net/@${handle}/post/${published.id}` }
}

// ── FACEBOOK (free, Meta Graph API) ─────────────────────────────────────────
async function postFacebook(content) {
  const token  = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const pageId = process.env.FACEBOOK_PAGE_ID
  if (!token || !pageId) return { ok: false, error: 'Add FACEBOOK_PAGE_ACCESS_TOKEN + FACEBOOK_PAGE_ID. Free via Meta for Developers → Graph API Explorer → generate page token.' }

  const res  = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content, access_token: token }),
  }).then(r => r.json())

  if (!res.id) return { ok: false, error: res?.error?.message || 'Facebook post failed' }
  const [pid, eid] = res.id.split('_')
  return { ok: true, postId: res.id, postUrl: `https://www.facebook.com/permalink.php?story_fbid=${eid}&id=${pid}` }
}

// ── TWITTER via Zernio (free for 2 accounts, no developer portal needed) ──────
// Zernio abstracts the X API entirely — $0 for up to 2 connected accounts
async function postViaZernio(content, platform = 'twitter', imageUrl = null) {
  const apiKey    = (process.env.ZERNIO_API_KEY || '').trim()
  const accountId = platform === 'twitter'
    ? (process.env.ZERNIO_TWITTER_ACCOUNT_ID || '').trim()
    : (process.env[`ZERNIO_${platform.toUpperCase()}_ACCOUNT_ID`] || '').trim()

  if (!apiKey)     return { ok: false, error: 'Add ZERNIO_API_KEY to Vercel. Sign up free at zernio.com — Dashboard → API Keys.' }
  if (!accountId)  return { ok: false, error: `Add ZERNIO_TWITTER_ACCOUNT_ID to Vercel. In Zernio dashboard → Connected Accounts → copy the account ID next to your X profile.` }

  const body = {
    content,
    platforms: [{ platform, accountId }],
    ...(imageUrl ? { media: [{ url: imageUrl }] } : {}),
  }

  const res  = await fetch('https://zernio.com/api/v1/posts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const raw  = await res.text()
  let data
  try { data = JSON.parse(raw) } catch { return { ok: false, error: `Zernio non-JSON (${res.status}): ${raw.slice(0,200)}` } }

  if (res.ok && (data.id || data.postId || data.success || data.posts?.length)) {
    const postId  = data.id || data.postId || data.posts?.[0]?.id || null
    // Zernio returns the live X post URL when available
    const postUrl = data.url || data.posts?.[0]?.url || null
    return { ok: true, postId, postUrl, hasImage: !!imageUrl, note: postUrl ? null : 'Check your X account — tweet should be live.' }
  }

  const errMsg = data.message || data.error || data.detail || JSON.stringify(data).slice(0, 300)
  return { ok: false, error: `Zernio error (${res.status}): ${errMsg}` }
}

// ── REDDIT (free, PRAW-style API) ────────────────────────────────────────────
// Posts to relevant 2A subreddits based on article category
const SUBREDDITS = {
  law:      ['r/2ALiberals', 'r/CCW', 'r/guns'],
  breaking: ['r/guns', 'r/CCW', 'r/2ALiberals'],
  news:     ['r/guns', 'r/CCW'],
  review:   ['r/guns', 'r/EDC'],
  training: ['r/CCW', 'r/guns'],
  default:  ['r/guns'],
}

async function postReddit(content, imageUrl = null, category = 'default') {
  const clientId     = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET
  const username     = process.env.REDDIT_USERNAME
  const password     = process.env.REDDIT_PASSWORD
  if (!clientId || !clientSecret || !username || !password) {
    return { ok: false, error: 'Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD to Vercel. Free at reddit.com/prefs/apps.' }
  }

  // Get access token
  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'DownRange/1.0 by u/DownRangeCo',
    },
    body: new URLSearchParams({ grant_type: 'password', username, password }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) return { ok: false, error: `Reddit auth failed: ${tokenData.error || tokenRes.status}` }

  // Extract URL from content for link post
  const urlMatch = content.match(/https?:\/\/[^\s]+/)
  const url      = urlMatch?.[0] || null
  // Title = first sentence of content, truncated to 300 chars
  const title    = content.split('\n')[0].replace(/https?:\/\/[^\s]+/g, '').trim().slice(0, 299) || 'DownRange Intel'

  // Pick the primary subreddit for this category
  const subs     = SUBREDDITS[category] || SUBREDDITS.default
  const subreddit = subs[0].replace('r/', '')

  const postBody = new URLSearchParams({
    sr: subreddit,
    kind: url ? 'link' : 'self',
    title,
    ...(url ? { url } : { text: content }),
    resubmit: 'true',
    nsfw: 'false',
  })

  const submitRes = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'DownRange/1.0 by u/DownRangeCo',
    },
    body: postBody,
  })
  const submitData = await submitRes.json()
  const postUrl = submitData?.jquery?.find?.(x => Array.isArray(x) && x[2] === 'attr' && x[3] === 'href')?.[4]
    || submitData?.data?.url
    || null

  if (!submitRes.ok || submitData?.json?.errors?.length) {
    const err = submitData?.json?.errors?.[0]?.[1] || submitData?.message || JSON.stringify(submitData).slice(0,200)
    return { ok: false, error: `Reddit post failed: ${err}` }
  }

  return { ok: true, postId: subreddit, postUrl, hasImage: false }
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
async function dispatch(platform, content, imageUrl = null, category = 'default') {
  switch (platform) {
    case 'bluesky':  return postBluesky(content, imageUrl)
    case 'threads':  return postThreads(content, imageUrl)
    case 'facebook': return postFacebook(content, imageUrl)
    case 'twitter':  return postViaZernio(content, 'twitter', imageUrl)
    case 'reddit':   return postReddit(content, imageUrl, category)
    default:         return { ok: false, error: `${platform} not yet supported` }
  }
}

// ── Main run ─────────────────────────────────────────────────────────────────
export async function runSocialAgent({ platforms, dryRun = false, forceArticleId = null } = {}) {
  const config = await sanity.fetch(`*[_type == "socialConfig"][0]`).catch(() => null)
  const activePlatforms  = platforms || config?.platforms || ['bluesky']
  const minUrgency       = config?.minUrgencyScore || 5
  const postsPerPlatform = config?.postsPerDay || 3

  const today = new Date(); today.setHours(0,0,0,0)
  const postedSlugs = new Set(
    (await sanity.fetch(`*[_type == "socialPost" && postedAt > $today].articleSlug`, { today: today.toISOString() }).catch(() => [])).filter(Boolean)
  )

  let articles
  if (forceArticleId) {
    const a = await sanity.fetch(`*[_type == "newsArticle" && _id == $id][0]{_id,title,summary,excerpt,category,urgencyScore,"slug":slug.current,imageUrl}`, { id: forceArticleId })
    articles = a ? [a] : []
  } else {
    // newsArticle schema has no status/published field — filter by publishedAt + slug only
    articles = await sanity.fetch(
      `*[_type == "newsArticle" && defined(slug.current) && defined(publishedAt)] | order(coalesce(urgencyScore,5) desc, publishedAt desc)[0...30]{_id,title,summary,excerpt,category,urgencyScore,"slug":slug.current,imageUrl}`
    ).catch(() => [])
    // Apply urgency filter — treat missing score as 5
    const filtered = articles.filter(a => (a.urgencyScore ?? 5) >= minUrgency)
    // Fall back to latest 10 if urgency filter leaves nothing
    articles = filtered.length ? filtered : articles.slice(0, 10)
  }

  const candidates = articles.filter(a => !postedSlugs.has(a.slug)).slice(0, postsPerPlatform * 2)
  if (!candidates.length) return { ok: true, posted: 0, total: 0, message: 'No published articles found. Make sure articles are published in Sanity (status=published or published=true) and have a slug.', dryRun }

  const results = []; let posted = 0
  for (const platform of activePlatforms) {
    for (const article of candidates.slice(0, postsPerPlatform)) {
      try {
        const content = await generateCopy(article, platform)
        const logDoc  = await sanity.create({
          _type: 'socialPost', platform,
          status: dryRun ? 'draft' : 'scheduled',
          content, articleSlug: article.slug, articleTitle: article.title,
          urgencyScore: article.urgencyScore, category: article.category,
          scheduledAt: new Date().toISOString(), autoGenerated: true,
        })
        if (dryRun) { results.push({ platform, title: article.title, status: 'draft', content, docId: logDoc._id }); continue }

        const result = await dispatch(platform, content, article.imageUrl || null, article.category || 'default')
        await sanity.patch(logDoc._id).set({ status: result.ok ? 'posted' : 'failed', postId: result.postId || null, postUrl: result.postUrl || null, postedAt: result.ok ? new Date().toISOString() : null, error: result.error || null, hasImage: result.hasImage || false }).commit()
        posted += result.ok ? 1 : 0
        results.push({ platform, title: article.title, status: result.ok ? "posted" : "failed", postUrl: result.postUrl, error: result.error, note: result.note, hasImage: result.hasImage || false, docId: logDoc._id })
      } catch (e) { results.push({ platform, title: article.title, status: 'error', error: e.message }) }
    }
  }
  return { ok: true, posted, total: results.length, results, dryRun }
}
