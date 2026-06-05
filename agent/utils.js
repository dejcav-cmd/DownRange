import { callAIText } from '@/lib/aiClient.js'
import crypto from 'crypto'

// ── CLAUDE REWRITER ───────────────────────────────────────────────────
async function rewriteWithClaude(item) {
  // Copyright-safe: extract facts only, use max 400 chars of source to avoid derivative work
  const inputContent = (item.description || item.content || item.contentSnippet || '').slice(0, 400)
  const prompt = `You are writing a news summary for DownRange — a firearms and Second Amendment portal.

COPYRIGHT RULES — MANDATORY:
- This is a NEWS SUMMARY, not a rewrite of the source article.
- Extract FACTS ONLY: who, what, when, where, numbers, names, dates, bill numbers, rulings.
- DO NOT reproduce the source article's structure, flow, narrative, or wording.
- DO NOT do a paragraph-by-paragraph rewrite of the source.
- Build a NEW article in DownRange's own structure with original analysis.
- The reader should still benefit from visiting the original source for full details.
- Use the facts to create original commentary, not to reproduce the original reporting.

VOICE & STYLE:
- Write like a gun owner who carries daily and reads 2A case law. Direct. Specific. Active voice.
- BANNED WORDS: comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, shed light on, it remains to be seen, stakeholders, holistic, takeaway, unpack, explore
- Start with the hardest fact. First sentence names who did what.
- No passive voice. No hedging. No padded openings.
- Short sentences. Named people, specific numbers, calibers, dollar amounts.

TITLE RULE — MANDATORY:
- The article title MUST be rewritten in DownRange's own words. NEVER use the source article's exact title.
- Write a new headline that states the key fact differently — same news, original phrasing.
- Max 12 words. Active voice. No clickbait. No "Here's Why" or "What You Need to Know".

MANDATORY ARTICLE STRUCTURE — use this exact structure, not the source's:

<h2>[Original headline — state the key fact in DownRange's own words]</h2>
<p>[Lead paragraph: the essential who/what/when/where in 80-100 words. Key facts only, original phrasing.]</p>

<h2>Key Details</h2>
<p>[2-3 specific facts, numbers, or developments from the event. Bullet points allowed. 80-120 words.]</p>

<h2>Why It Matters for Gun Owners</h2>
<p>[Practical impact. What does this mean for someone who carries, competes, or collects? Which states, which guns, what to do. 100-130 words. ORIGINAL ANALYSIS — not from source.]</p>

<h2>DownRange Analysis</h2>
<p>[Original DownRange perspective. Does this survive Bruen scrutiny? Market implications? What should a gun owner actually do right now? 80-110 words. Pure original commentary.]</p>

REQUIREMENTS:
- 500-800 words total. Concise, not padded to fill space.
- HTML ONLY: h2, p, strong, em, ul, li, a. No div, span, br.
- strong = names, bill numbers, key facts only.
- The article must read as ORIGINAL CONTENT, not a rephrasing of the source.

SOURCE FACTS (extract facts from this — do NOT reproduce the writing):
Title: ${item.title}
Source: ${item.source || 'Unknown'}
Published: ${item.publishedAt || new Date().toISOString()}
Key facts to report: ${inputContent}

Return ONLY valid JSON:
{
  "title": "Rewritten headline — original DownRange phrasing, max 12 words",
  "summary": "2-3 sentences. Key facts in original language. Max 300 chars. No AI phrases.",
  "body": "<full HTML article in the structure above>",
  "category": "one of: breaking|news|law|industry|opinion|training",
  "urgencyScore": 1-10,
  "tags": ["4-8 kebab-case tags"],
  "relatedStates": ["state abbreviations"],
  "isBreaking": false
}
Start with { end with }. No markdown fences.`
  try {
    const text = await callAIText({ prompt, useCase: 'news', maxTokens: 1800 })
    // Strip any accidental markdown fences
    const clean = text.split('```json').join('').split('```').join('').trim()
    const parsed = JSON.parse(clean)
    // Ensure body is a string
    if (typeof parsed.body !== 'string') parsed.body = ''
    // Reject short bodies so backfill picks them up later
    const wordCount = parsed.body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length
    if (wordCount < 400) {
      console.warn(`[REWRITE] Body too short (${wordCount} words) for "${(item.title||'').slice(0,50)}" — saving null so backfill can retry`)
      parsed.body = ''
    }
    // Attribution is rendered by the page component — not baked into body HTML
    return parsed
  } catch (err) {
    console.error('Claude rewrite error:', err.message)
    return {
      summary: item.description?.slice(0, 300) || item.title,
      body: '',
      category: 'news',
      urgencyScore: 3,
      tags: [],
      relatedStates: [],
      isBreaking: false
    }
  }
}

// ── CLAUDE LAW ENRICHER ────────────────────────────────────────────────
async function enrichLawWithClaude(bill) {
  const prompt = `Analyze this firearms bill or law for DownRange gun owners. No AI phrases. No "comprehensive", "landmark", "significant development", "it remains to be seen", or padded language. Write like a gun owner who reads case law.

Produce a JSON response with:
- summary: 4-6 direct sentences. What the bill does, who sponsored it, current status, what it means for gun owners in plain terms. Include bill number, sponsor name, committee, vote counts if known. First sentence states the bottom line.
- impact: one of: HIGH, MED, LOW
- analysis: 2-3 sentences. Does this survive Bruen/Heller scrutiny? What circuit, what timeline? State a conclusion — do not hedge.

Bill data:
Title: ${bill.title}
Number: ${bill.billNumber || 'N/A'}
Status: ${bill.status}
State: ${bill.state || 'Federal'}
Level: ${bill.level}
Current summary: ${bill.summary || 'None'}
Last action: ${bill.lastActionText || bill.lastActionDate || 'Unknown'}

Return ONLY valid JSON, no markdown, no explanation.`

  try {
    const text = await callAIText({ prompt, useCase: 'laws', maxTokens: 400 })  // COST: laws tier
    const clean = text.split('```json').join('').split('```').join('').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.error('Claude law enrichment error:', err.message)
    return { summary: bill.summary, impact: 'MED', analysis: '' }
  }
}

// ── DEDUPLICATION ─────────────────────────────────────────────────────
const seenHashes = new Set()
// Sanity-backed dedup: titles and URLs we've seen across cron cycles
const _sanityDedup = { urls: new Set(), titles: new Set(), loaded: false }

async function loadSanityDedup() {
  if (_sanityDedup.loaded) return
  try {
    // Use a fast count + recent-first approach instead of loading ALL articles
    // Only load last 2000 articles — anything older won't appear in RSS feeds anyway
    // RSS feeds only serve the last 20-100 items, all published within days/weeks
    const query = encodeURIComponent(
      `*[_type == "newsArticle"] | order(_createdAt desc)[0...2000]{ "u": externalUrl, "t": title }`
    )
    const res = await fetch(
      `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/production?query=${query}&returnQuery=false`,
      { headers: { Authorization: `Bearer ${process.env.SANITY_API_TOKEN}` } }
    )
    const data = await res.json()
    for (const doc of (data.result || [])) {
      if (doc.u) _sanityDedup.urls.add(doc.u.toLowerCase().replace(/\/+$/, ''))
      if (doc.t) _sanityDedup.titles.add(doc.t.toLowerCase().slice(0, 80))
    }
    _sanityDedup.loaded = true
    console.log(`[DEDUP] Loaded ${_sanityDedup.urls.size} URLs, ${_sanityDedup.titles.size} titles from Sanity (last 2000 articles)`)
  } catch (e) {
    console.warn('[DEDUP] Could not load Sanity dedup cache:', e.message)
    // Don't block — continue without dedup cache rather than failing the whole feed
    _sanityDedup.loaded = true
  }
}

export async function isSanityDuplicate(url, title) {
  await loadSanityDedup()
  const normUrl = (url || '').toLowerCase().replace(/\/+$/, '')
  const normTitle = (title || '').toLowerCase().slice(0,80)
  if (normUrl && _sanityDedup.urls.has(normUrl)) return true
  if (normTitle && _sanityDedup.titles.has(normTitle)) return true
  // Add to cache so new items in same cycle are also deduped
  if (normUrl) _sanityDedup.urls.add(normUrl)
  if (normTitle) _sanityDedup.titles.add(normTitle)
  return false
}

function hashUrl(url) {
  return crypto.createHash('md5').update(url || '').digest('hex')
}

function isDuplicate(url) {
  const h = hashUrl(url)
  if (seenHashes.has(h)) return true
  seenHashes.add(h)
  return false
}

function resetDedup() { seenHashes.clear() }

// ── DISCORD NOTIFIER ─────────────────────────────────────────────────
async function discordNotify(webhookUrl, embed) {
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) })
  } catch (err) {
    console.error('Discord notify error:', err.message)
  }
}

async function notifyStatus({ done, total, failed, lastFeed, cycleNum, eta }) {
  await discordNotify(process.env.DISCORD_WEBHOOK_URL, {
    title: '⚡ DownRange Agent Status',
    color: 0xC8922A,
    fields: [
      { name: 'Cycle', value: `#${cycleNum}`, inline: true },
      { name: 'Progress', value: `${done}/${total}`, inline: true },
      { name: 'Failed', value: `${failed}`, inline: true },
      { name: 'Last Feed', value: lastFeed || '—', inline: true },
      { name: 'ETA', value: eta || 'Calculating...', inline: true },
    ],
    timestamp: new Date().toISOString()
  })
}

async function notifyBreaking(item) {
  await discordNotify(process.env.DISCORD_BREAKING_WEBHOOK, {
    title: '🚨 BREAKING: ' + item.title,
    description: item.summary || item.description?.slice(0, 200),
    color: 0xB91C1C,
    fields: [
      { name: 'Score', value: `${item.urgencyScore}/10`, inline: true },
      { name: 'Source', value: item.source || 'Unknown', inline: true },
    ],
    url: item.url || item.externalUrl,
    timestamp: new Date().toISOString()
  })
}

async function notifyError(message, context = '') {
  await discordNotify(process.env.DISCORD_ERRORS_WEBHOOK, {
    title: '❌ Agent Error',
    description: message,
    color: 0xEF4444,
    fields: context ? [{ name: 'Context', value: context }] : [],
    timestamp: new Date().toISOString()
  })
}

// ── SANITY WRITER ─────────────────────────────────────────────────────
const TRUSTED_IMAGE_DOMAINS = ['cdn.sanity.io','img.youtube.com','i.ytimg.com','upload.wikimedia.org','images.unsplash.com','pexels.com']

// Extract og:image from article source page and upload to Sanity CDN
// Returns cdn.sanity.io URL or null
async function fetchAndUploadOgImage(pageUrl, articleId) {
  if (!pageUrl || !process.env.SANITY_API_TOKEN) return null
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // Extract og:image
    const patterns = [
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i),
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
    ]

    let imgUrl = null
    for (const m of patterns) {
      if (m?.[1]) {
        let u = m[1].trim()
        if (u.startsWith('//')) u = 'https:' + u
        if (u.startsWith('/')) { const b = new URL(pageUrl); u = b.origin + u }
        // Skip SVGs, logos, tiny images
        if (u.match(/\.(jpg|jpeg|png|webp)/i) && !u.includes('.svg') && !u.includes('logo')) {
          imgUrl = u; break
        }
      }
    }
    if (!imgUrl) return null

    // Fetch image and upload to Sanity
    const imgRes = await fetch(imgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': pageUrl },
      signal: AbortSignal.timeout(10000),
    })
    if (!imgRes.ok) return null
    const buf = await imgRes.arrayBuffer()
    if (buf.byteLength < 8000) return null // skip tiny placeholders

    // Upload to Sanity CDN
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
    const filename = `article-${articleId.slice(-8)}.jpg`
    const uploadRes = await fetch(
      `https://${projectId}.api.sanity.io/v2024-01-01/assets/images/production?filename=${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SANITY_API_TOKEN}`,
          'Content-Type': imgRes.headers.get('content-type') || 'image/jpeg',
        },
        body: buf,
      }
    )
    if (!uploadRes.ok) return null
    const asset = await uploadRes.json()
    return asset?.document?.url || asset?.url || null
  } catch {
    return null
  }
}
function isTrustedImage(url) {
  if (!url) return false
  return TRUSTED_IMAGE_DOMAINS.some(d => url.includes(d))
}

async function publishToSanity(doc) {
  try {
    // For news articles: use createIfNotExists + patch to avoid overwriting
    // good imageUrls that were manually set by the patch-article job.
    // For other doc types (breakingAlert, etc.): still use createOrReplace.
    const mutations = doc._type === 'newsArticle'
      ? [
          // Create if new (preserves all fields on first write)
          { createIfNotExists: doc },
          // Only update metadata fields — never overwrite body/summary if already written
          { patch: {
              id: doc._id,
              set: Object.fromEntries(
                Object.entries(doc)
                  .filter(([k]) => !['_id','_type','imageUrl','body','summary','excerpt'].includes(k))
              ),
              // Fill in body/summary/excerpt ONLY if missing (don't destroy backfilled content)
              setIfMissing: {
                // Only set imageUrl if not already set to a real external image
                // (prevents overwriting Wikimedia/OG images with generic /img/photos/ fallbacks)
                body:    doc.body,
                summary: doc.summary,
                excerpt: doc.excerpt,
              },
              // Set imageUrl only if cron-provided value is a real external URL
              ...(doc.imageUrl && doc.imageUrl.startsWith('http') ? { imageUrl: doc.imageUrl } : {}),
          }},
          // Force-overwrite imageUrl ONLY if it's a real CDN/Wikimedia URL (never for /img/photos/ local fallbacks)
          ...(isTrustedImage(doc.imageUrl) && doc.imageUrl?.startsWith('http') ? [{ patch: { id: doc._id, set: { imageUrl: doc.imageUrl } } }] : []),
        ]
      : [{ createOrReplace: doc }]

    const _sanityR = await fetch(
      `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations })
      }
    )
    if (!_sanityR.ok) { const e = await _sanityR.text(); throw new Error(e) }
    return await _sanityR.json()
  } catch (err) {
    console.error('Sanity write error:', err.response?.data || err.message)
    throw err
  }
}

// ── RATE LIMITER ──────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function rateLimitedBatch(items, fn, delayMs = 1000) {
  const results = []
  for (const item of items) {
    try {
      results.push(await fn(item))
    } catch (err) {
      console.error('Batch item error:', err.message)
      results.push(null)
    }
    await sleep(delayMs)
  }
  return results
}

export { rewriteWithClaude, enrichLawWithClaude, hashUrl, isDuplicate, resetDedup, discordNotify, notifyStatus, notifyBreaking, notifyError, publishToSanity, sleep, rateLimitedBatch, fetchAndUploadOgImage }
