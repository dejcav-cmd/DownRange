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
// ── COPY WRITING ENGINE ──────────────────────────────────────────────────────
//
// Twitter: 280 chars total. URLs count as 23 chars (t.co). So we have
//   280 - 23 (url) = 257 chars for text + hashtags.
//   Hashtags ~55 chars → ~200 chars for actual copy body.
//   That's enough for 2-3 meaty sentences if written tightly.
//
// Platform character budgets (body text only, URL/hashtags appended separately):
const CHAR_BUDGETS = {
  twitter:  200,  // 280 total - 23 (t.co URL) - 55 (hashtags) - 2 (newlines)
  bluesky:  220,  // 300 GRAPHEME limit - 65 (URL worst case) - 2 (newlines) - 13 (safety)
  threads:  430,  // 500 limit - 50 (URL) - 20 (newlines)
  facebook: 450,  // No hard limit; keep focused
  reddit:   250,  // Title-only post; this is the title
}

const HASHTAGS = {
  law:      '#2A #GunRights #SecondAmendment #ConstitutionalCarry',
  news:     '#Firearms #2A #GunNews #GunOwners',
  review:   '#GunReview #EDC #Firearms #GearReview',
  industry: '#GunIndustry #2A #Firearms #SHOT',
  breaking: '#Breaking #2A #GunNews #Firearms',
  training: '#CCW #SelfDefense #Firearms #GunTraining',
  hunting:  '#Hunting #2A #Outdoors #HuntingLife',
  default:  '#2A #Firearms #GunOwners #SecondAmendment',
}

// Per-platform writing instructions — what the AI must produce
const PLATFORM_PROMPTS = {
  twitter: `TWITTER POST RULES (STRICT):
- Total copy budget: 200 characters MAX (NOT counting the URL or hashtags we add)
- COUNT EVERY CHARACTER. Stay under 200.
- Structure: [Hook line] [Key fact/what happened] [Why it matters to gun owners]
- Lead with the most alarming or surprising fact — not the title
- Write like a gun owner who's angry, informed, or excited — not a press release
- Use 2-3 emojis woven into the text naturally (not just at the start)
- Be specific: name the state, the court, the ATF rule number, the gun model
- DO NOT include the URL or hashtags — added automatically
- Example of GOOD copy: "🚨 New Jersey just authorized warrantless gun seizures — no crime needed, just a 'tip.' A federal court already blocked this. State police are defying the order. 🔫 This is where it starts."
- Example of BAD copy (too vague/short): "Big 2A news from NJ. Courts involved. Read more."`,

  bluesky: `BLUESKY POST RULES:
- Copy budget: 220 characters MAX for the body text (URL is appended separately)
- No hashtags on Bluesky — they kill algorithmic reach
- Write like a knowledgeable gun owner talking to another gun owner
- Lead with the specific development — state, ruling, number, company name
- Include the key implication: what does this mean for carry rights / gun owners?
- Use 1-2 emojis max, placed naturally
- DO NOT include the URL — added automatically`,

  threads: `THREADS POST RULES:
- Copy budget: 430 characters MAX (not counting URL/hashtags)
- Conversational tone — like you're telling a friend the news
- 3-4 sentences: hook → what happened → context → question or reaction
- End with a question or hot take to drive replies
- Use 2-3 emojis naturally through the text
- DO NOT include the URL or hashtags — added automatically`,

  facebook: `FACEBOOK POST RULES:
- Copy budget: 450 characters MAX (not counting URL/hashtags)
- More informative than other platforms — Facebook users want context
- 3-5 sentences: lead with the news, explain the background, state the 2A impact
- End with a question to drive comments ("What do you think?" / "Will you be affected?")
- Use 2-3 emojis naturally
- DO NOT include the URL or hashtags — added automatically`,

  reddit: `REDDIT POST TITLE RULES:
- This is the LINK POST TITLE — 300 characters MAX
- Reddit titles must be factual and specific — no clickbait, no hype words
- Include: location/jurisdiction, what happened, and the relevant right/law
- Example: "New Jersey: State Police Defying Federal Court Order Blocking Warrantless Gun Seizures Under Red Flag Law"
- NO emojis in Reddit titles
- DO NOT include the URL`,
}

async function generateCopy(article, platform, contentType) {
  const url    = `https://downrangeco.com/${contentType === 'blog' ? 'blog' : 'news'}/${article.slug}`
  const tags   = ['twitter','threads','facebook'].includes(platform)
    ? '\n' + (HASHTAGS[article.category] || HASHTAGS.default) : ''
  const budget = CHAR_BUDGETS[platform] || 200

  // Build a rich article brief for the AI — the more context, the better the copy
  const summary = article.summary || article.excerpt || ''
  const brief = [
    `TITLE: ${article.title}`,
    summary ? `SUMMARY: ${summary.slice(0, 400)}` : '',
    `CATEGORY: ${article.category || 'news'}`,
    `TYPE: ${contentType === 'blog' ? 'Analysis / Blog' : 'Breaking News'}`,
    article.urgencyScore >= 8 ? `URGENCY: HIGH (${article.urgencyScore}/10) — treat as breaking` : '',
  ].filter(Boolean).join('\n')

  const instructions = PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.twitter

  const raw = await callAIText({
    prompt: `You are the social media editor for DownRange Co — an independent Second Amendment intelligence portal run by DJ Cavalcanti, a daily carrier in Washington State. DownRange readers are gun owners who follow 2A case law, carry daily, and want real information — not fluff.

ARTICLE TO PROMOTE:
${brief}

${instructions}

CHARACTER BUDGET REMINDER: ${budget} characters MAX for the copy body.
Write the post body now. Return ONLY the post text. No quotes, no preamble, no "Here's a post:".`,
    useCase: 'default',
    maxTokens: 300,
  })

  let body = raw
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/^(Here'?s?( a| the)?( draft| post| copy)?:?\s*)/i, '')
    .trim()

  // Grapheme-aware truncation
  // For Bluesky: the 300 grapheme limit applies to the ENTIRE post including URL
  // We must enforce this on the full assembled string, not just the body
  const suffix = `\n\n${url}${tags}`

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter()
    // Count graphemes in suffix to know how many body graphemes we can use
    const suffixGraphemes = [...segmenter.segment(suffix)].length
    const bodyLimit = (platform === 'bluesky' ? 298 : budget * 2) - suffixGraphemes
    const bodyGraphemes = [...segmenter.segment(body)].map(s => s.segment)
    if (bodyGraphemes.length > bodyLimit) {
      body = bodyGraphemes.slice(0, bodyLimit - 1).join('') + '…'
    }
  } else {
    const suffixLen = suffix.length
    const bodyLimit = budget - suffixLen
    if (body.length > bodyLimit) body = body.slice(0, bodyLimit - 1) + '…'
  }

  return `${body}${suffix}`
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
  // Strip invisible chars and @ if accidentally included
  const cleanId = accountId
    .replace(/[\u0000-\u001F\u007F-\u00A0\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    .replace(/^@/, '').trim()
  if (!cleanId || cleanId.length < 8) {
    return { ok: false, error: `ZERNIO_TWITTER_ACCOUNT_ID "${accountId}" is invalid. Must be the Zernio account ID (e.g. 6a2109ef2b2567671ac1458c), not your @handle. Update ZERNIO_TWITTER_ACCOUNT_ID in Vercel.` }
  }

  const body = {
    content,
    publishNow: true,
    platforms: [{ platform: 'twitter', accountId: cleanId }],
    ...(imageUrl ? { mediaItems: [{ type: 'image', url: imageUrl }] } : {}),
  }
  const res  = await fetch('https://zernio.com/api/v1/posts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const raw  = await res.text()
  let data = {}
  try { data = JSON.parse(raw) } catch {}

  // 2xx = success (Zernio returns 201 on publish)
  if (res.status >= 200 && res.status < 300) {
    const postId  = data._id || data.id || data.postId || data.post?._id || data.post?.id || null
    const postUrl = data.url || data.post?.url || data.posts?.[0]?.url || null
    return { ok: true, postId, postUrl, hasImage: !!imageUrl }
  }
  return { ok: false, error: `Zernio error (${res.status}): ${data.message || data.error || data.detail || raw.slice(0,300)}` }
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
  // Per-platform dedup: track platform+slug pairs already posted (ever, not just today)
  // This prevents reposting the same article to the same platform
  // We do allow re-posting to a DIFFERENT platform (e.g. Bluesky can post what X already did)
  const postedPairs = new Set(
    (await sanity.fetch(
      `*[_type == "socialPost" && status == "posted" && defined(articleSlug) && defined(platform)]{platform, articleSlug}`,
    ).catch(() => [])).map(p => `${p.platform}::${p.articleSlug}`)
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

  // Merge + filter: exclude articles already posted to this specific platform
  // minUrgency applied, with fallback to latest 10 if all filtered out
  const all = [...news, ...blogs].filter(a => (a.urgencyScore ?? 5) >= minUrgency)
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
    // Filter out articles already posted to THIS platform
    const postedPairs = new Set(
      (await sanity.fetch(
        `*[_type == "socialPost" && status == "posted" && platform == $p && defined(articleSlug)].articleSlug`,
        { p: platform }
      ).catch(() => [])).filter(Boolean)
    )
    const fresh = pool.filter(a => !postedPairs.has(a.slug))
    articles = fresh.length ? fresh.slice(0, count) : []
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
