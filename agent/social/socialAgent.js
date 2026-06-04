/**
 * DownRange Social Media Agent v2
 * - Pulls from BOTH newsArticle and blogPost
 * - Images required on all posts (category fallback if no imageUrl)
 * - Per-platform scheduling via Sanity socialConfig
 * - Platform-optimized copy (tone + length per platform)
 */
import { createClient } from '@sanity/client'
import { callAIText }   from '../../lib/aiClient.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

// ── Category image fallbacks ─────────────────────────────────────────────────
const FALLBACK_IMAGES = {
  law:        'https://downrangeco.com/img/photos/law.jpg',
  breaking:   'https://downrangeco.com/img/photos/law.jpg',
  news:       'https://downrangeco.com/img/photos/news.jpg',
  review:     'https://downrangeco.com/img/photos/rifle.jpg',
  industry:   'https://downrangeco.com/img/photos/rifle.jpg',
  training:   'https://downrangeco.com/img/photos/training.jpg',
  hunting:    'https://downrangeco.com/img/photos/hunting.jpg',
  default:    'https://downrangeco.com/img/photos/news.jpg',
}

function getImage(article) {
  return article.imageUrl || FALLBACK_IMAGES[article.category] || FALLBACK_IMAGES.default
}

// ── Platform copy config ──────────────────────────────────────────────────────
const PLATFORM_CONFIG = {
  bluesky:  { limit: 290, tone: 'Direct and punchy. Gun-owner voice. One strong insight. No hashtags on Bluesky — they hurt reach.' },
  threads:  { limit: 440, tone: 'Conversational, 2-3 short sentences. End with a question to drive replies. 2A community voice.' },
  facebook: { limit: 470, tone: 'Informative. 3-4 sentences with context. End with a question or CTA. Slightly longer is fine on Facebook.' },
  twitter:  { limit: 240, tone: 'Punchy. Max impact. Strong opener. 2-3 relevant hashtags at the end.' },
  reddit:   { limit: 290, tone: 'Factual and direct. No marketing language. r/CCW and r/guns users hate hype. Just the news.' },
}

// Emoji map per category — boosts reach on all platforms
const CATEGORY_EMOJI = {
  law:      '⚖️🔫', breaking: '🚨🔫', news:     '📰🔫',
  review:   '🎯🔫', industry: '🏭🔫', training: '🎯🛡️',
  hunting:  '🏹🌲', default:  '🔫🇺🇸',
}

const HASHTAGS = {
  law:      '#2A #GunRights #SecondAmendment #ConstitutionalCarry',
  news:     '#Firearms #2A #GunNews #GunOwners',
  review:   '#GunReview #EDC #Firearms #GearReview',
  industry: '#GunIndustry #2A #Firearms',
  breaking: '#Breaking #2A #GunNews #Firearms',
  training: '#CCW #SelfDefense #Firearms #GunTraining',
  hunting:  '#Hunting #2A #Outdoors #HuntingLife',
  default:  '#2A #Firearms #GunOwners #SecondAmendment',
}

async function generateCopy(article, platform, contentType) {
  const cfg      = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.bluesky
  const url      = `https://downrangeco.com/${contentType === 'blog' ? 'blog' : 'news'}/${article.slug}`
  const emoji    = CATEGORY_EMOJI[article.category] || CATEGORY_EMOJI.default
  // Twitter/Threads/Facebook get hashtags; Bluesky and Reddit don't
  const tags     = ['twitter','threads','facebook'].includes(platform) ? '\n' + (HASHTAGS[article.category] || HASHTAGS.default) : ''
  const reserve  = url.length + tags.length + emoji.length + 6
  const maxBody  = cfg.limit - reserve

  const typeLabel = contentType === 'blog' ? 'in-depth blog post' : 'breaking news article'
  const raw = await callAIText({
    prompt: `You are the social media voice for DownRange Co — an independent 2A intelligence portal. Founded by DJ Cavalcanti, a daily carrier in Washington State.

Write a ${platform} post promoting this ${typeLabel}:
TITLE: ${article.title}
SUMMARY: ${article.summary || article.excerpt || ''}
CATEGORY: ${article.category}
TYPE: ${contentType === 'blog' ? 'Blog / Analysis' : 'News'}

Tone: ${cfg.tone}
Start the post with 1-2 relevant emojis that match the content.
Use emojis naturally within the text to increase engagement (2-4 total).
Body character limit: ${maxBody} chars MAX (NOT including the URL and hashtags we append).
Do NOT include the URL or hashtags — appended automatically.
Return ONLY the post body. No quotes, no preamble.`,
    useCase: 'default', maxTokens: 160,
  })
  const body = raw.replace(/^["']|["']$/g, '').trim().slice(0, maxBody)
  return `${body}\n\n${url}${tags}`
}

// ── BLUESKY ───────────────────────────────────────────────────────────────────
async function uploadImageBluesky(imageUrl, accessJwt) {
  try {
    const imgRes = await fetch(imageUrl, { headers: { 'User-Agent': 'DownRange/1.0' } })
    if (!imgRes.ok) return null
    const imgBuffer = await imgRes.arrayBuffer()
    if (imgBuffer.byteLength > 976 * 1024) return null
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    const blobRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessJwt}`, 'Content-Type': contentType },
      body: imgBuffer,
    })
    const blob = await blobRes.json()
    return blob?.blob || null
  } catch { return null }
}

async function postBluesky(content, imageUrl) {
  let handle = (process.env.BLUESKY_HANDLE || '').trim()
    .replace(/[\u0000-\u001F\u007F-\u00A0\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '')
    .replace(/^https?:\/\/(www\.)?(bsky\.app\/profile\/)?/i, '')
    .replace(/^@+/, '').replace(/\/$/, '').replace(/\s+/g, '').toLowerCase()
  const pass = (process.env.BLUESKY_APP_PASSWORD || '').trim()
  if (!handle || !pass) return { ok: false, error: 'Missing BLUESKY_HANDLE or BLUESKY_APP_PASSWORD in Vercel.' }
  if (!handle.startsWith('did:') && !handle.includes('.')) handle += '.bsky.social'

  const authRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password: pass }),
  })
  const auth = await authRes.json()
  if (!auth.accessJwt) return { ok: false, error: `Bluesky auth failed: ${auth.message}` }

  // Image embed (required)
  let embed
  if (imageUrl) {
    const blob = await uploadImageBluesky(imageUrl, auth.accessJwt)
    if (blob) embed = { $type: 'app.bsky.embed.images', images: [{ image: blob, alt: 'DownRange — 2A News' }] }
  }

  // URL facets
  const urlRegex = /https?:\/\/[^\s]+/g
  const facets = [], encoder = new TextEncoder()
  let match
  while ((match = urlRegex.exec(content)) !== null) {
    const start = encoder.encode(content.slice(0, match.index)).length
    const end   = encoder.encode(content.slice(0, match.index + match[0].length)).length
    facets.push({ index: { byteStart: start, byteEnd: end }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: match[0] }] })
  }

  const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auth.accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: auth.did, collection: 'app.bsky.feed.post', record: {
      $type: 'app.bsky.feed.post', text: content, createdAt: new Date().toISOString(),
      ...(facets.length ? { facets } : {}), ...(embed ? { embed } : {}),
    }}),
  })
  const post = await postRes.json()
  if (!post.uri) return { ok: false, error: `Bluesky post failed: ${post.message}` }
  const rkey = post.uri.split('/').pop()
  return { ok: true, postId: post.uri, postUrl: `https://bsky.app/profile/${auth.did}/post/${rkey}`, hasImage: !!embed }
}

// ── THREADS ───────────────────────────────────────────────────────────────────
async function postThreads(content, imageUrl) {
  const token  = process.env.THREADS_ACCESS_TOKEN
  const userId = process.env.THREADS_USER_ID
  if (!token || !userId) return { ok: false, error: 'Missing THREADS_ACCESS_TOKEN or THREADS_USER_ID.' }

  const body = { media_type: imageUrl ? 'IMAGE' : 'TEXT', access_token: token }
  if (imageUrl) { body.image_url = imageUrl; body.text = content }
  else body.text = content

  const container = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).then(r => r.json())
  if (!container.id) return { ok: false, error: container?.error?.message || 'Threads container failed' }

  await new Promise(r => setTimeout(r, 2000))
  const published = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  }).then(r => r.json())
  if (!published.id) return { ok: false, error: published?.error?.message || 'Threads publish failed' }
  const handle = process.env.THREADS_HANDLE || 'downrangeco'
  return { ok: true, postId: published.id, postUrl: `https://www.threads.net/@${handle}/post/${published.id}`, hasImage: !!imageUrl }
}

// ── FACEBOOK ──────────────────────────────────────────────────────────────────
async function postFacebook(content, imageUrl) {
  const token  = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const pageId = process.env.FACEBOOK_PAGE_ID
  if (!token || !pageId) return { ok: false, error: 'Missing FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_PAGE_ID.' }

  // With image: use /photos endpoint for richer post
  if (imageUrl) {
    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/photos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl, caption: content, access_token: token }),
    }).then(r => r.json())
    if (!res.id) return { ok: false, error: res?.error?.message || 'Facebook photo post failed' }
    return { ok: true, postId: res.id, postUrl: `https://www.facebook.com/photo?fbid=${res.id}`, hasImage: true }
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content, access_token: token }),
  }).then(r => r.json())
  if (!res.id) return { ok: false, error: res?.error?.message || 'Facebook post failed' }
  const [pid, eid] = res.id.split('_')
  return { ok: true, postId: res.id, postUrl: `https://www.facebook.com/permalink.php?story_fbid=${eid}&id=${pid}`, hasImage: false }
}

// ── TWITTER via Zernio ────────────────────────────────────────────────────────
async function postViaZernio(content, imageUrl) {
  const apiKey    = (process.env.ZERNIO_API_KEY || '').trim()
  const accountId = (process.env.ZERNIO_TWITTER_ACCOUNT_ID || '').trim()
  if (!apiKey)     return { ok: false, error: 'Missing ZERNIO_API_KEY in Vercel.' }
  if (!accountId)  return { ok: false, error: 'Missing ZERNIO_TWITTER_ACCOUNT_ID in Vercel.' }
  // Zernio accountId must start with acc_ — NOT your Twitter handle (@username)
  // Get the real ID from: Admin → Social Media → Setup → "Look up my Account ID" button
  // Or call: GET https://zernio.com/api/v1/accounts  (Authorization: Bearer YOUR_API_KEY)
  const cleanId = accountId.replace(/^@/, '').trim()
  if (!cleanId.startsWith('acc_')) {
    return { ok: false, error: `ZERNIO_TWITTER_ACCOUNT_ID is set to "${accountId}" — this is your Twitter handle, not a Zernio account ID. The correct value starts with "acc_" and looks like acc_abc123. In Vercel: update ZERNIO_TWITTER_ACCOUNT_ID. To find it: call GET https://zernio.com/api/v1/accounts with your Zernio API key, or use Admin → Social Media → Command Center → Setup tab → X/Twitter → Look up Account ID button.` }
  }

  const body = {
    content,
    platforms: [{ platform: 'x', accountId: cleanId }],
    ...(imageUrl ? { media: [{ url: imageUrl }] } : {}),
  }
  const res  = await fetch('https://zernio.com/api/v1/posts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const raw  = await res.text()
  let data
  try { data = JSON.parse(raw) } catch { return { ok: false, error: `Zernio error (${res.status}): ${raw.slice(0,200)}` } }
  if (res.ok && (data.id || data.postId || data.success || data.posts?.length)) {
    const postId  = data.id || data.postId || data.posts?.[0]?.id || null
    const postUrl = data.url || data.posts?.[0]?.url || null
    return { ok: true, postId, postUrl, hasImage: !!imageUrl }
  }
  return { ok: false, error: `Zernio error (${res.status}): ${data.message || data.error || JSON.stringify(data).slice(0,200)}` }
}

// ── REDDIT ────────────────────────────────────────────────────────────────────
const SUBREDDITS = {
  law:['CCW','2ALiberals','guns'], breaking:['guns','CCW','2ALiberals'],
  news:['guns','CCW'], review:['guns','EDC'], training:['CCW','guns'],
  hunting:['hunting','guns'], default:['guns'],
}

async function postReddit(content, imageUrl, category) {
  const clientId  = process.env.REDDIT_CLIENT_ID
  const clientSec = process.env.REDDIT_CLIENT_SECRET
  const username  = process.env.REDDIT_USERNAME
  const password  = process.env.REDDIT_PASSWORD
  if (!clientId || !clientSec || !username || !password)
    return { ok: false, error: 'Missing Reddit env vars. See Setup Guide in admin.' }

  const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(`${clientId}:${clientSec}`)}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'DownRange/1.0 by u/DownRangeCo' },
    body: new URLSearchParams({ grant_type: 'password', username, password }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) return { ok: false, error: `Reddit auth failed: ${tokenData.error}` }

  const urlMatch  = content.match(/https?:\/\/[^\s]+/)
  const url       = urlMatch?.[0] || null
  const title     = content.split('\n')[0].replace(/https?:\/\/[^\s]+/g, '').trim().slice(0, 299) || 'DownRange Intel'
  const subreddit = (SUBREDDITS[category] || SUBREDDITS.default)[0]

  const submitRes = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'DownRange/1.0 by u/DownRangeCo' },
    body: new URLSearchParams({ sr: subreddit, kind: url ? 'link' : 'self', title, ...(url ? { url } : { text: content }), resubmit: 'true', nsfw: 'false' }),
  })
  const submitData = await submitRes.json()
  if (submitData?.json?.errors?.length) return { ok: false, error: submitData.json.errors[0][1] }
  const postUrl = submitData?.data?.url || null
  return { ok: true, postId: subreddit, postUrl, hasImage: false }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
async function dispatch(platform, content, imageUrl, category) {
  switch (platform) {
    case 'bluesky':  return postBluesky(content, imageUrl)
    case 'threads':  return postThreads(content, imageUrl)
    case 'facebook': return postFacebook(content, imageUrl)
    case 'twitter':  return postViaZernio(content, imageUrl)
    case 'reddit':   return postReddit(content, imageUrl, category)
    default:         return { ok: false, error: `${platform} not supported` }
  }
}

// ── Article + Blog fetcher ────────────────────────────────────────────────────
async function fetchCandidates(minUrgency = 5, limit = 20) {
  const today = new Date(); today.setHours(0,0,0,0)
  const postedToday = new Set(
    (await sanity.fetch(`*[_type == "socialPost" && postedAt > $t].articleSlug`, { t: today.toISOString() }).catch(() => [])).filter(Boolean)
  )

  // News articles
  const news = await sanity.fetch(
    `*[_type == "newsArticle" && defined(slug.current) && defined(publishedAt)] | order(coalesce(urgencyScore,5) desc, publishedAt desc)[0...${limit}]{
      _id, "type":"news", title, summary, excerpt, category, urgencyScore,
      "slug": slug.current, imageUrl
    }`
  ).catch(() => [])

  // Blog posts (published only)
  const blogs = await sanity.fetch(
    `*[_type == "blogPost" && status == "published" && defined(slug.current)] | order(publishedAt desc)[0...10]{
      _id, "type":"blog", title, "summary": excerpt, excerpt, category,
      "urgencyScore": 6, "slug": slug.current, imageUrl
    }`
  ).catch(() => [])

  // Merge, de-dupe already-posted, apply urgency filter
  const all = [...news, ...blogs]
    .filter(a => !postedToday.has(a.slug))
    .filter(a => (a.urgencyScore ?? 5) >= minUrgency)

  // If urgency filter wipes everything, fall back to latest regardless
  return all.length ? all : [...news.slice(0,5), ...blogs.slice(0,3)]
}

// ── Main run — single platform ────────────────────────────────────────────────
export async function runSocialAgent({ platform, count = 2, dryRun = false, forceArticleId = null } = {}) {
  const config       = await sanity.fetch(`*[_type == "socialConfig"][0]`).catch(() => null)
  const minUrgency   = config?.minUrgencyScore ?? 5

  let articles
  if (forceArticleId) {
    const a = await sanity.fetch(`*[(_type == "newsArticle" || _type == "blogPost") && _id == $id][0]{_id,"type":_type,title,summary,excerpt,category,urgencyScore,"slug":slug.current,imageUrl}`, { id: forceArticleId })
    articles = a ? [a] : []
  } else {
    const pool = await fetchCandidates(minUrgency)
    articles   = pool.slice(0, count)
  }

  if (!articles.length) return { ok: true, posted: 0, total: 0, message: 'No unposted articles available.', dryRun }

  const results = []; let posted = 0
  for (const article of articles) {
    try {
      const imageUrl    = getImage(article)
      const contentType = article.type === 'blog' ? 'blog' : 'news'
      const content     = await generateCopy(article, platform, contentType)

      const logDoc = await sanity.create({
        _type: 'socialPost', platform,
        status: dryRun ? 'draft' : 'scheduled',
        content, articleSlug: article.slug, articleTitle: article.title,
        urgencyScore: article.urgencyScore, category: article.category,
        mediaUrl: imageUrl, scheduledAt: new Date().toISOString(), autoGenerated: true,
      })

      if (dryRun) {
        results.push({ platform, title: article.title, status: 'draft', content, imageUrl, docId: logDoc._id })
        continue
      }

      const result = await dispatch(platform, content, imageUrl, article.category || 'default')
      await sanity.patch(logDoc._id).set({
        status: result.ok ? 'posted' : 'failed',
        postId: result.postId || null, postUrl: result.postUrl || null,
        postedAt: result.ok ? new Date().toISOString() : null,
        error: result.error || null, hasImage: result.hasImage || false,
      }).commit()

      posted += result.ok ? 1 : 0
      results.push({ platform, title: article.title, status: result.ok ? 'posted' : 'failed', postUrl: result.postUrl, error: result.error, hasImage: result.hasImage || false, docId: logDoc._id })
    } catch (e) {
      results.push({ platform, title: article.title, status: 'error', error: e.message })
    }
  }
  return { ok: true, posted, total: results.length, results, dryRun }
}
