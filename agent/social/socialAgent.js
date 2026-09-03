/**
 * DownRange Social Media Agent v2
 * - Pulls from BOTH newsArticle and blogPost
 * - Images required on all posts (category fallback if no imageUrl)
 * - Per-platform scheduling via Sanity socialConfig
 * - Platform-optimized copy (tone + length per platform)
 */
import { createClient } from '@sanity/client'
import { callAIText }   from '../../lib/aiClient.js'
import { searchForImage } from '../utils.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

// ── Image resolution ──────────────────────────────────────────────────────
// Previously fell back to local files (/img/photos/law.jpg, rifle.jpg,
// news.jpg, etc.) whenever article.imageUrl was empty. Those files turned
// out to be auto-generated vector/wireframe placeholder graphics, not real
// photos -- law.jpg is a flat scales-of-justice/gavel icon illustration,
// rifle.jpg is a flat firearm silhouette diagram, news.jpg is a site UI
// mockup screenshot. Posting any of these to Instagram/Facebook as "the
// article image" is exactly the wrong-image-worse-than-no-image failure
// mode. Now: use the real article image if present, otherwise do a live
// Pexels/Pixabay search (same function news ingestion uses) for an actual
// photo, otherwise return null and let dispatch()/postInstagram's existing
// "no image" handling skip the post rather than ever using a fake fallback.
async function getImage(article) {
  if (article.imageUrl) return article.imageUrl
  try {
    return await searchForImage(article.title, article.category || 'default')
  } catch {
    return null
  }
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
// Character limits per platform (body copy only — footer appended separately)
// Footer format: "\n\nFull article: <url>" + optional hashtags
// URL on downrangeco.com averages ~55 chars. "Full article: " = 14 chars.
// Twitter: 280 total. t.co wraps URLs to 23 chars. "Full article: " + t.co = 37.
//   280 - 37 (footer URL) - 2 (newlines) - 55 (hashtags) - 5 (safety) = 181
// Bluesky: 300 graphemes total. URL counts as full length (no shortening).
//   300 - 14 ("Full article: ") - 55 (url) - 2 (newlines) - 9 (safety) = 220
// Threads: 500 chars. 
//   500 - 14 - 55 - 2 - 55 (hashtags) - 4 (safety) = 370
// Facebook: No hard limit — keep focused.
//   800 soft target - 14 - 55 - 2 = 729 max, cap at 600 for quality
// Reddit: title only, no footer needed in body budget.
const CHAR_BUDGETS = {
  twitter:  175,  // 280 total - 37 (Full article: + t.co) - 2 (\n) - 55 (tags) - 11 (safety)
  bluesky:  215,  // 300 grapheme limit - 14 - 55 - 2 - 14 (safety)
  threads:  360,  // 500 limit - 14 - 55 - 2 - 55 (tags) - 14 (safety)
  facebook: 580,  // soft cap for quality, well under any limit
  instagram: 400, // captions can run to 2200, but keep it tight and scannable
  reddit:   250,  // post title only
}

const HASHTAG_POOLS = {
  law:       ['#2A', '#GunRights', '#SecondAmendment', '#ConstitutionalCarry', '#GunLaw', '#2ANews', '#RightToBear', '#GunPolicy'],
  news:      ['#2A', '#Firearms', '#GunNews', '#GunOwners', '#BreakingNews', '#2ACommunity', '#SecondAmendment'],
  review:    ['#GunReview', '#EDC', '#Firearms', '#GearReview', '#2A', '#RangeDay', '#GunTest', '#WeaponsReview'],
  industry:  ['#GunIndustry', '#2A', '#Firearms', '#SHOT', '#GunMaker', '#2AIndustry'],
  breaking:  ['#Breaking', '#2A', '#GunNews', '#Firearms', '#BreakingNews2A'],
  training:  ['#CCW', '#SelfDefense', '#Firearms', '#GunTraining', '#EDC', '#ConcealedCarry', '#TacticalTraining'],
  hunting:   ['#Hunting', '#2A', '#Outdoors', '#HuntingLife', '#HuntingSeason', '#Sportsman'],
  pistol:    ['#Pistol', '#Handgun', '#EDC', '#GunReview', '#2A', '#ConcealedCarry', '#CCW'],
  rifle:     ['#Rifle', '#AR15', '#GunReview', '#2A', '#RifleReview', '#PrecisionRifle'],
  shotgun:   ['#Shotgun', '#GunReview', '#2A', '#ShotgunLife', '#Scattergun'],
  optic:     ['#Optics', '#GunReview', '#2A', '#RedDot', '#Scope', '#PrecisionShooting'],
  suppressor:['#Suppressor', '#Silencer', '#NFA', '#2A', '#SuppressedLife', '#SilencerShop'],
  accessory: ['#GunAccessories', '#2A', '#EDC', '#GearReview', '#Firearms'],
  ammo:      ['#Ammo', '#Reloading', '#2A', '#Ammunition', '#GunReview'],
  default:   ['#2A', '#Firearms', '#GunOwners', '#SecondAmendment', '#2ACommunity'],
}

// Core tags included on every post for brand consistency; remaining slots
// filled from the category pool at random so posts aren't identical every time.
const CORE_TAGS = ['#2A', '#SecondAmendment']

function pickHashtags(category, platform) {
  const pool = HASHTAG_POOLS[(category || '').toLowerCase()] || HASHTAG_POOLS.default
  const targetCount = platform === 'instagram' ? 8 : 4
  const core = CORE_TAGS.filter(t => pool.includes(t) || true) // always include core tags
  const rest = pool.filter(t => !core.includes(t))
  // Fisher-Yates shuffle the remaining pool for variety
  const shuffled = [...rest]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const picked = [...new Set([...core, ...shuffled])].slice(0, targetCount)
  return picked.join(' ')
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
- DO NOT add "Full article:" — added automatically below the copy
- Example of GOOD copy: "🚨 New Jersey just authorized warrantless gun seizures — no crime needed, just a 'tip.' A federal court already blocked this. State police are defying the order. 🔫 This is where it starts."
- Example of BAD copy (too vague/short): "Big 2A news from NJ. Courts involved. Read more."
- BAD: ending with "Read more at DownRange" — the footer handles that`,

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

  instagram: `INSTAGRAM CAPTION RULES:
- Copy budget: 350 characters MAX for the main caption (not counting hashtags)
- The first ~125 characters are what shows before "more" gets tapped — put the hook there
- Punchy, visual, scannable — short paragraphs/line breaks, not a wall of text
- Lead with the most striking fact, then 2-3 sentences of context and 2A impact
- Use 3-4 emojis naturally throughout
- DO NOT write your own "link in bio" or call-to-action line — that's added automatically below your caption
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
  // Ensure we have a real slug string — never use _id as URL
  const slugStr = (typeof article.slug === 'string' && article.slug && !article.slug.startsWith('news-') && !article.slug.startsWith('blog-'))
    ? article.slug
    : null
  if (!slugStr) throw new Error(`Article "${article.title?.slice(0,50)}" has no valid slug — skipping to avoid broken URL`)
  const urlPath = contentType === 'blog' ? 'blog' : contentType === 'release' ? 'releases' : contentType === 'review' ? 'reviews' : 'news'
  // UTM params so traffic from each platform is actually measurable in analytics
  const utm = `utm_source=${platform}&utm_medium=social&utm_campaign=auto_post`
  const url    = `https://downrangeco.com/${urlPath}/${slugStr}?${utm}`
  const tags   = ['twitter','threads','facebook','instagram'].includes(platform)
    ? '\n' + pickHashtags(article.category, platform) : ''
  const budget = CHAR_BUDGETS[platform] || 200

  // Build a rich article brief for the AI — the more context, the better the copy
  const summary = article.summary || article.excerpt || ''
  const brief = [
    `TITLE: ${article.title}`,
    summary ? `SUMMARY: ${summary.slice(0, 400)}` : '',
    `CATEGORY: ${article.category || 'news'}`,
    `TYPE: ${contentType === 'blog' ? 'DownRange Analysis / Blog' : contentType === 'release' ? 'New Firearm Release' : contentType === 'review' ? 'DownRange Gun Review' : 'Breaking News from DownRange'}`,
    article.score ? `REVIEW SCORE: ${article.score}/10` : '',
    article.source ? `SOURCE: ${article.source} (original reporting — DownRange portal link added in footer)` : '',
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
    useCase: 'social',
    maxTokens: 300,
  })

  let body = raw
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/^(Here'?s?( a| the)?( draft| post| copy)?:?\s*)/i, '')
    .trim()

  // Safety net: strip any hashtag line(s) the model wrote on its own despite
  // instructions not to — hashtags are appended once, automatically, below.
  // Prevents duplicate hashtag blocks, which look sloppy on platforms like
  // Instagram where a bad post can't be cleanly deleted after the fact.
  if (tags) {
    body = body
      .split('\n')
      .filter(line => !/^\s*(#\w+\s*)+$/.test(line))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  // Grapheme-aware truncation
  // For Bluesky: the 300 grapheme limit applies to the ENTIRE post including URL
  // We must enforce this on the full assembled string, not just the body
  // Footer: "Full article: <url>" on all platforms (clearly labels the portal link)
  // Source attribution shown when article has a known external source
  const sourceLabel = article.source && !['DownRange','downrangeco.com'].includes(article.source)
    ? ` (via ${article.source})`
    : ''
  // Instagram doesn't render URLs as clickable links in captions — showing
  // a dead-looking raw link just reads as broken. Reverted back to pointing
  // readers to the bio link instead (2026-08-28, DJ request after testing).
  const suffix = platform === 'instagram'
    ? `\n\n📖 Full story — link in bio${sourceLabel}${tags}`
    : `\n\nFull article: ${url}${sourceLabel}${tags}`

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter()
    // Count graphemes in suffix to know how many body graphemes we can use
    const suffixGraphemes = [...segmenter.segment(suffix)].length
    // Bluesky: hard 300 grapheme limit on entire post (body + footer)
    // Give 2 grapheme safety margin → 298 total; subtract suffix graphemes = body budget
    const platformLimit = platform === 'bluesky' ? 298 : 
                          platform === 'twitter'  ? 275 :  // 280 - 5 safety (t.co wraps URL)
                          9999  // no hard grapheme limit for others
    const bodyLimit = platformLimit - suffixGraphemes
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
      signal: AbortSignal.timeout(15000),
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
    signal: AbortSignal.timeout(15000),
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

  // HARD LIMIT: Enforce 300 grapheme max on the FINAL string sent to Bluesky — no exceptions.
  let safeContent = content
  try {
    const segs = [...new Intl.Segmenter().segment(content)]
    if (segs.length > 298) safeContent = segs.slice(0, 297).map(s => s.segment).join('') + '…'
  } catch { if (safeContent.length > 298) safeContent = safeContent.slice(0, 297) + '…' }

  // Recompute facets on the safe content (positions may have shifted after truncation)
  const safeFacets = []
  const urlRegex2 = /https?:\/\/[^\s]+/g
  const enc2 = new TextEncoder()
  let m2
  while ((m2 = urlRegex2.exec(safeContent)) !== null) {
    const start = enc2.encode(safeContent.slice(0, m2.index)).length
    const end   = enc2.encode(safeContent.slice(0, m2.index + m2[0].length)).length
    safeFacets.push({ index: { byteStart: start, byteEnd: end }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: m2[0] }] })
  }

  const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    signal: AbortSignal.timeout(15000),
    method: 'POST',
    headers: { 'Authorization': `Bearer ${auth.accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: auth.did, collection: 'app.bsky.feed.post', record: {
      $type: 'app.bsky.feed.post', text: safeContent, createdAt: new Date().toISOString(),
      ...(safeFacets.length ? { facets: safeFacets } : {}), ...(embed ? { embed } : {}),
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
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ url: imageUrl, caption: content, access_token: token }),
    }).then(r => r.json())
    if (!res.id) return { ok: false, error: res?.error?.message || 'Facebook photo post failed' }
    return { ok: true, postId: res.id, postUrl: `https://www.facebook.com/photo?fbid=${res.id}`, hasImage: true }
  }

  const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ message: content, access_token: token }),
  }).then(r => r.json())
  if (!res.id) return { ok: false, error: res?.error?.message || 'Facebook post failed' }
  const [pid, eid] = res.id.split('_')
  return { ok: true, postId: res.id, postUrl: `https://www.facebook.com/permalink.php?story_fbid=${eid}&id=${pid}`, hasImage: false }
}

// ── INSTAGRAM ─────────────────────────────────────────────────────────────────
// Graph API content publishing is a two-step flow: create a media container,
// then publish it. Instagram requires an image (no text-only posts), and
// container creation is asynchronous — we poll status_code before publishing
// to avoid publishing a container that isn't ready yet (documented Meta behavior).
async function postInstagram(content, imageUrl, category) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  if (!token || !igUserId) return { ok: false, error: 'Missing INSTAGRAM_ACCESS_TOKEN/FACEBOOK_PAGE_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID.' }
  if (!imageUrl) return { ok: false, error: 'Instagram requires an image — no image available for this article.' }

  // Instagram only accepts images between 4:5 (0.8) and 1.91:1. Wide banner/
  // header-style article images fail with a generic "aspect ratio is not
  // supported" error. Sanity's CDN embeds pixel dimensions in the asset
  // filename itself (…-{width}x{height}.{ext}), so we can check this without
  // an extra fetch for CDN-hosted images. Previously, when the ratio was
  // confirmed bad OR couldn't be confirmed at all (any external URL — e.g.
  // live Pexels/Pixabay results, which don't follow Sanity's naming
  // convention), this substituted a local "category fallback" image. Those
  // files turned out to be vector/wireframe placeholder graphics, not real
  // photos — that's the direct cause of vector images appearing on
  // Instagram. Skip the post instead: a skipped post is retried next run
  // once a usable image exists; a fake image posted is permanent.
  const dims = imageUrl.match(/-(\d+)x(\d+)\.\w+(?:\?.*)?$/)
  if (dims) {
    const ratio = parseInt(dims[1], 10) / parseInt(dims[2], 10)
    if (ratio < 0.8 || ratio > 1.91) {
      return { ok: false, error: `Image aspect ratio ${ratio.toFixed(2)} outside Instagram's 0.8–1.91 range.` }
    }
  }
  const safeImageUrl = imageUrl

  const createRes = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ image_url: safeImageUrl, caption: content, access_token: token }),
  }).then(r => r.json())
  if (!createRes.id) return { ok: false, error: createRes?.error?.message || 'Instagram media container creation failed' }
  const containerId = createRes.id

  // Poll for container readiness — usually near-instant for images, but Meta
  // recommends checking status_code before publish rather than assuming FINISHED
  let ready = false
  for (let i = 0; i < 5; i++) {
    const statusRes = await fetch(
      `https://graph.facebook.com/v20.0/${containerId}?fields=status_code&access_token=${token}`
    ).then(r => r.json())
    if (statusRes.status_code === 'FINISHED') { ready = true; break }
    if (statusRes.status_code === 'ERROR') {
      return { ok: false, error: 'Instagram container processing failed (status_code ERROR)' }
    }
    await new Promise(r => setTimeout(r, 1500))
  }
  if (!ready) return { ok: false, error: 'Instagram container did not finish processing in time' }

  const publishRes = await fetch(`https://graph.facebook.com/v20.0/${igUserId}/media_publish`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: containerId, access_token: token }),
  }).then(r => r.json())
  if (!publishRes.id) return { ok: false, error: publishRes?.error?.message || 'Instagram publish failed' }

  // media_publish returns a media ID, not the public permalink shortcode —
  // fetch the actual permalink so postUrl is real and clickable
  let permalink = null
  try {
    const permRes = await fetch(
      `https://graph.facebook.com/v20.0/${publishRes.id}?fields=permalink&access_token=${token}`
    ).then(r => r.json())
    permalink = permRes.permalink || null
  } catch {}

  return { ok: true, postId: publishRes.id, postUrl: permalink || `https://www.instagram.com/${igUserId}/`, hasImage: true }
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
    case 'instagram': return postInstagram(content, imageUrl, category)
    case 'twitter':  return postViaZernio(content, imageUrl)
    case 'reddit':   return postReddit(content, imageUrl, category)
    default:         return { ok: false, error: `${platform} not supported` }
  }
}

// ── Article + Blog fetcher ────────────────────────────────────────────────────
async function fetchCandidates(minUrgency = 5, limit = 20) {
  const today = new Date(); today.setHours(0,0,0,0)
  // Hard freshness cutoff — nothing older than this is ever eligible for
  // social posting, regardless of urgency score. Fixes old backlog articles
  // (sitting unposted with a stale high urgencyScore) from outranking
  // today's actual news just because urgency used to be sorted before date.
  const FRESHNESS_DAYS = 5
  const cutoff = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Per-platform dedup: track platform+slug pairs already posted (ever, not just today)
  // This prevents reposting the same article to the same platform
  // We do allow re-posting to a DIFFERENT platform (e.g. Bluesky can post what X already did)
  const postedPairs = new Set(
    (await sanity.fetch(
      `*[_type == "socialPost" && status == "posted" && defined(articleSlug) && defined(platform)]{platform, articleSlug}`,
    ).catch(() => [])).map(p => `${p.platform}::${p.articleSlug}`)
  )

  // News articles — sorted by recency, NOT urgency. Urgency is still used
  // as a filter (minUrgency) and for "BREAKING" framing in the AI prompt,
  // but must not let an old high-urgency article outrank fresh news.
  const news = await sanity.fetch(
    `*[_type == "newsArticle" && defined(slug.current) && defined(publishedAt) && publishedAt > $cutoff] | order(publishedAt desc)[0...${limit}]{
      _id, "type":"news", title, summary, excerpt, category, urgencyScore, publishedAt,
      "slug": slug.current, imageUrl
    }`, { cutoff }
  ).catch(() => [])

  // Blog posts (published only)
  const blogs = await sanity.fetch(
    `*[_type == "blogPost" && status == "published" && defined(slug.current) && defined(publishedAt) && publishedAt > $cutoff] | order(publishedAt desc)[0...10]{
      _id, "type":"blog", title, "summary": excerpt, excerpt, category, publishedAt,
      "urgencyScore": 6, "slug": slug.current, imageUrl
    }`, { cutoff }
  ).catch(() => [])

  // Firearm releases (approved only)
  const releases = await sanity.fetch(
    `*[_type == "firearmRelease" && approved == true && defined(slug.current) && defined(publishedAt) && publishedAt > $cutoff] | order(publishedAt desc)[0...10]{
      _id, "type":"release", title, summary, category, publishedAt,
      "urgencyScore": 6, "slug": slug.current, imageUrl
    }`, { cutoff }
  ).catch(() => [])

  // Gun reviews (published only)
  const reviews = await sanity.fetch(
    `*[_type == "review" && defined(publishedAt) && defined(slug.current) && publishedAt > $cutoff] | order(publishedAt desc)[0...10]{
      _id, "type":"review", title, summary, category, score, publishedAt,
      "urgencyScore": 6, "slug": slug.current, imageUrl
    }`, { cutoff }
  ).catch(() => [])

  // Merge ALL types into one pool and sort by true recency (publishedAt),
  // not by concatenation order. Previously news was always first in the
  // array, so with count=1/run, blog/release/review content was almost
  // never actually selected even when it was fresher — fixed by sorting
  // the merged pool globally rather than taking whichever type happened
  // to be listed first.
  const merged = [...news, ...blogs, ...releases, ...reviews]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  const filtered = merged.filter(a => (a.urgencyScore ?? 5) >= minUrgency)
  // Fallback if urgency filter removes everything: use the freshest available
  // regardless of urgency, but NEVER relax the freshness cutoff itself.
  return filtered.length ? filtered : merged.slice(0, 10)
}

// ── Main run — single platform ────────────────────────────────────────────────
export async function runSocialAgent({ platform, count = 2, dryRun = false, forceArticleId = null } = {}) {
  const config       = await sanity.fetch(`*[_type == "socialConfig"][0]`).catch(() => null)
  const minUrgency   = config?.minUrgencyScore ?? 5

  let articles
  if (forceArticleId) {
    const a = await sanity.fetch(`*[(_type == "newsArticle" || _type == "blogPost") && _id == $id][0]{_id, _type, title,summary,excerpt,category,urgencyScore,"slug":slug.current,imageUrl}`, { id: forceArticleId })
    // Normalize _type to the 'blog'/'news' string used everywhere else in this
    // file (fetchCandidates aliases it the same way) — using the raw _type
    // value here ("blogPost") instead of 'blog' made generateCopy's
    // `contentType === 'blog'` check always fail for forced blog posts,
    // silently building a /news/<slug> URL instead of /blog/<slug> (404).
    articles = a ? [{ ...a, type: a._type === 'blogPost' ? 'blog' : 'news' }] : []
  } else {
    const pool = await fetchCandidates(minUrgency)
    // Filter out articles already posted to THIS platform
    const postedPairs = new Set(
      (await sanity.fetch(
        `*[_type == "socialPost" && status == "posted" && platform == $p && defined(articleSlug)].articleSlug`,
        { p: platform }
      ).catch(() => [])).filter(Boolean)
    )
    // Only include articles with real slugs (not Sanity _id hashes like news-abc123)
    const validPool = pool.filter(a =>
      a.slug &&
      typeof a.slug === 'string' &&
      !a.slug.match(/^(news|blog)-[a-f0-9]{20,}$/)
    )
    const fresh = validPool.filter(a => !postedPairs.has(a.slug))
    articles = fresh.length ? fresh.slice(0, count) : []
  }

  if (!articles.length) return { ok: true, posted: 0, total: 0, message: 'No unposted articles available.', dryRun }

  const results = []; let posted = 0
  for (const article of articles) {
    try {
      const imageUrl    = await getImage(article)
      const contentType = article.type === 'blog' ? 'blog' : article.type === 'release' ? 'release' : article.type === 'review' ? 'review' : 'news'
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
