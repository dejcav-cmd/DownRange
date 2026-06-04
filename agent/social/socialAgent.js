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
  let raw_handle = (process.env.BLUESKY_HANDLE || '').trim()
  const pass      = (process.env.BLUESKY_APP_PASSWORD || '').trim()
  if (!raw_handle || !pass) return { ok: false, error: 'Add BLUESKY_HANDLE and BLUESKY_APP_PASSWORD to Vercel env vars.' }

  // Aggressive sanitization — handle every possible format a user might paste
  let handle = raw_handle
    .replace(/^https?:\/\/(www\.)?(bsky\.app\/profile\/)?/i, '') // strip URL prefix
    .replace(/^@/, '')           // strip leading @
    .replace(/\/$/, '')          // strip trailing slash
    .replace(/\s+/g, '')         // strip any whitespace
    .toLowerCase()               // must be lowercase

  // If they pasted a full profile URL like bsky.app/profile/did:plc:xxx, extract handle
  if (handle.startsWith('did:')) {
    // They pasted a DID — use it directly as identifier
  } else if (!handle.includes('.')) {
    // No dot — append .bsky.social
    handle = handle + '.bsky.social'
  }

  const authRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password: pass }),
  })
  const auth = await authRes.json()
  if (!auth.accessJwt) {
    return { ok: false, error: `Bluesky auth failed (using identifier: "${handle}"): ${auth.message || authRes.status}. Check your handle in Vercel — set BLUESKY_HANDLE to exactly: yourname.bsky.social` }
  }

  // Build facets for clickable URLs
  const urlRegex = /https?:\/\/[^\s]+/g
  const facets = []
  let match
  const encoder = new TextEncoder()
  while ((match = urlRegex.exec(content)) !== null) {
    const start = encoder.encode(content.slice(0, match.index)).length
    const end   = encoder.encode(content.slice(0, match.index + match[0].length)).length
    facets.push({ index: { byteStart: start, byteEnd: end }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: match[0] }] })
  }

  const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auth.accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repo: auth.did, collection: 'app.bsky.feed.post',
      record: { $type: 'app.bsky.feed.post', text: content, createdAt: new Date().toISOString(), ...(facets.length ? { facets } : {}) },
    }),
  })
  const post = await postRes.json()
  if (!post.uri) return { ok: false, error: `Bluesky post failed: ${post.message || postRes.status}` }

  const rkey = post.uri.split('/').pop()
  return { ok: true, postId: post.uri, postUrl: `https://bsky.app/profile/${auth.did}/post/${rkey}` }
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

// ── TWITTER via Buffer API (free tier handles X API cost) ───────────────────
async function postViaBuffer(content, platform = 'twitter') {
  const token     = (process.env.BUFFER_ACCESS_TOKEN || '').trim()
  const profileId = (platform === 'twitter'
    ? process.env.BUFFER_TWITTER_PROFILE_ID
    : process.env[`BUFFER_${platform.toUpperCase()}_PROFILE_ID`] || '').trim()

  if (!token)     return { ok: false, error: 'Add BUFFER_ACCESS_TOKEN to Vercel env vars.' }
  if (!profileId) return { ok: false, error: `Add BUFFER_TWITTER_PROFILE_ID to Vercel. Get it from: https://api.bufferapp.com/1/profiles.json?access_token=YOUR_TOKEN` }

  // Buffer v1 API — must be form-encoded, NOT JSON
  const params = new URLSearchParams()
  params.append('access_token', token)
  params.append('profile_ids[]', profileId)
  params.append('text', content)
  params.append('now', 'true')

  const res  = await fetch('https://api.bufferapp.com/1/updates/create.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const raw  = await res.text()
  let data
  try { data = JSON.parse(raw) } catch { return { ok: false, error: `Buffer non-JSON (${res.status}): ${raw.slice(0,200)}` } }

  if (data.success === true) {
    const update = data.updates?.[0]
    return { ok: true, postId: update?.id || null, postUrl: null, note: 'Posted via Buffer. Check your X account or Buffer dashboard.' }
  }

  const errMsg = data.message || data.error || JSON.stringify(data).slice(0, 300)
  // OIDC error = wrong token type
  if (errMsg.includes('OIDC')) {
    return { ok: false, error: `Wrong token type. Buffer needs the legacy OAuth Access Token, NOT a JWT/OIDC token. In Buffer: go to buffer.com/developers/apps → click your app → copy the "Access Token" shown on that page (it starts with a long string of letters/numbers, not "eyJ").` }
  }
  return { ok: false, error: `Buffer error (${res.status}): ${errMsg}` }
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

        const result = await dispatch(platform, content)
        await sanity.patch(logDoc._id).set({ status: result.ok ? 'posted' : 'failed', postId: result.postId || null, postUrl: result.postUrl || null, postedAt: result.ok ? new Date().toISOString() : null, error: result.error || null }).commit()
        posted += result.ok ? 1 : 0
        results.push({ platform, title: article.title, status: result.ok ? 'posted' : 'failed', postUrl: result.postUrl, error: result.error, note: result.note, docId: logDoc._id })
      } catch (e) { results.push({ platform, title: article.title, status: 'error', error: e.message }) }
    }
  }
  return { ok: true, posted, total: results.length, results, dryRun }
}
