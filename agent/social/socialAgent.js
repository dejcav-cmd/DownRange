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

// ── BLUESKY (100% free, AT Protocol) ────────────────────────────────────────
async function postBluesky(content) {
  const handle = process.env.BLUESKY_HANDLE
  const pass   = process.env.BLUESKY_APP_PASSWORD
  if (!handle || !pass) return { ok: false, error: 'Add BLUESKY_HANDLE and BLUESKY_APP_PASSWORD to Vercel env vars. Free at bsky.app — Settings → App Passwords.' }

  const auth = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password: pass }),
  }).then(r => r.json())

  if (!auth.accessJwt) return { ok: false, error: auth.message || 'Bluesky auth failed' }

  // Detect URLs and create facets for clickable links
  const urlRegex = /https?:\/\/[^\s]+/g
  const facets = []
  let match
  const encoder = new TextEncoder()
  while ((match = urlRegex.exec(content)) !== null) {
    const start = encoder.encode(content.slice(0, match.index)).length
    const end   = encoder.encode(content.slice(0, match.index + match[0].length)).length
    facets.push({ index: { byteStart: start, byteEnd: end }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: match[0] }] })
  }

  const post = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auth.accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo: auth.did, collection: 'app.bsky.feed.post',
      record: { $type: 'app.bsky.feed.post', text: content, createdAt: new Date().toISOString(), facets: facets.length ? facets : undefined },
    }),
  }).then(r => r.json())

  if (!post.uri) return { ok: false, error: post.message || 'Bluesky post failed' }
  const rkey   = post.uri.split('/').pop()
  return { ok: true, postId: post.uri, postUrl: `https://bsky.app/profile/${handle}/post/${rkey}` }
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

// ── TWITTER via Buffer API (free tier handles API cost) ─────────────────────
async function postViaBuffer(content, platform = 'twitter') {
  const token = process.env.BUFFER_ACCESS_TOKEN
  const profileId = platform === 'twitter'
    ? process.env.BUFFER_TWITTER_PROFILE_ID
    : process.env[`BUFFER_${platform.toUpperCase()}_PROFILE_ID`]

  if (!token) return { ok: false, error: 'Add BUFFER_ACCESS_TOKEN. Free at buffer.com — Settings → Apps & Integrations → Access Token. Buffer absorbs the X API cost ($0.20/URL tweet).' }
  if (!profileId) return { ok: false, error: `Add BUFFER_${platform.toUpperCase()}_PROFILE_ID. Found in Buffer → Connect Channels → select platform → copy profile ID from URL.` }

  const res = await fetch('https://api.bufferapp.com/1/updates/create.json', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ access_token: token, [`profile_ids[]`]: profileId, text: content, now: 'true' }),
  }).then(r => r.json())

  if (!res.success) return { ok: false, error: res.message || 'Buffer post failed' }
  const update = res.updates?.[0]
  // Buffer doesn't return the live post URL directly — we construct it
  return { ok: true, postId: update?.id, postUrl: null, note: 'Posted via Buffer. View in Buffer dashboard for live URL.' }
}

// ── Dispatcher ───────────────────────────────────────────────────────────────
async function dispatch(platform, content) {
  switch (platform) {
    case 'bluesky':  return postBluesky(content)
    case 'threads':  return postThreads(content)
    case 'facebook': return postFacebook(content)
    case 'twitter':  return postViaBuffer(content, 'twitter')
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
    // Fetch top articles — don't require urgencyScore (many articles lack it)
    // Filter by min urgency only when score is explicitly set
    articles = await sanity.fetch(
      `*[_type == "newsArticle" && (status == "published" || published == true) && defined(slug.current)] | order(coalesce(urgencyScore,5) desc, publishedAt desc)[0...30]{_id,title,summary,excerpt,category,urgencyScore,"slug":slug.current,imageUrl}`,
    ).catch(() => [])
    // Apply urgency filter post-fetch so articles without score still qualify
    articles = articles.filter(a => (a.urgencyScore ?? 5) >= minUrgency)
    // If still empty (all below threshold), grab latest 10 regardless
    if (!articles.length) {
      articles = await sanity.fetch(
        `*[_type == "newsArticle" && (status == "published" || published == true) && defined(slug.current)] | order(publishedAt desc)[0...10]{_id,title,summary,excerpt,category,urgencyScore,"slug":slug.current,imageUrl}`,
      ).catch(() => [])
    }
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

        const result = await dispatch(platform, content)
        await sanity.patch(logDoc._id).set({ status: result.ok ? 'posted' : 'failed', postId: result.postId || null, postUrl: result.postUrl || null, postedAt: result.ok ? new Date().toISOString() : null, error: result.error || null }).commit()
        posted += result.ok ? 1 : 0
        results.push({ platform, title: article.title, status: result.ok ? 'posted' : 'failed', postUrl: result.postUrl, error: result.error, note: result.note, docId: logDoc._id })
      } catch (e) { results.push({ platform, title: article.title, status: 'error', error: e.message }) }
    }
  }
  return { ok: true, posted, total: results.length, results, dryRun }
}
