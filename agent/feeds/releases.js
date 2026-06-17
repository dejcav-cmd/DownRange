/**
 * DownRange Gun Releases Feed — v3
 * 
 * Pipeline:
 *   1. Scrape manufacturer news pages for product announcements
 *   2. Scrape PRNewswire RSS for press releases
 *   3. Scrape TTAG / TFB / American Rifleman for editorial release coverage
 *   4. Dedup by URL + brand+model hash
 *   5. Claude Haiku: extract specs + write original DownRange article (copyright-safe)
 *   6. Upload OG image from manufacturer page → Sanity CDN
 *   7. Save to Sanity as firearmRelease with approved:true (auto-publish)
 */

import Parser from 'rss-parser'
import crypto from 'crypto'
import { createClient } from '@sanity/client'
import { MANUFACTURERS, matchManufacturer } from '../../lib/manufacturers.js'
import { decodeHtmlEntities } from '../../lib/decodeEntities.js'
import { sleep } from '../utils.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const parser = new Parser({ timeout: 8000 })

// ── CONFIG ────────────────────────────────────────────────────────────────────
const MAX_PER_RUN   = 12   // max new releases per cron run
const PER_SOURCE    = 3    // max items per source before moving on
const RATE_MS       = 1200 // ms between requests

// ── PRODUCT SIGNAL KEYWORDS ───────────────────────────────────────────────────
const RELEASE_SIGNALS = [
  'introduces', 'launching', 'launches', 'announces', 'unveiled', 'unveils',
  'debuts', 'release', 'now available', 'ships', 'in stock',
  'new pistol', 'new rifle', 'new shotgun', 'new suppressor', 'new revolver',
  'new model', 'new for 2026', 'new for 2025',
  '9mm', '.45 acp', '5.56', '6.5 creedmoor', '10mm', '.357', '.44',
  'gen5', 'gen6', 'optic ready', 'mos', 'striker', 'semi-auto',
  'compensator', 'threaded barrel', 'suppressor ready',
  'xp pro', 'xf pro', 'xp comp', 'xp 3c', // Fusion Firearms specific
]

const SKIP_SIGNALS = [
  'earnings', 'quarterly results', 'fiscal year', 'revenue', 'financial',
  'lawsuit', 'settlement', 'recall', 'class action',
  'hiring', 'ceo appointed', 'executive', 'board of directors',
  'scholarship', 'donation', 'sponsorship',
  'gun show', 'convention', 'trade show', // events, not products
  'sale ends', 'coupon', 'discount',      // promotions
]

function isReleaseCandidate(title = '', description = '') {
  const txt = `${title} ${description}`.toLowerCase()
  return RELEASE_SIGNALS.some(k => txt.includes(k)) &&
        !SKIP_SIGNALS.some(k => txt.includes(k))
}

// ── PRN RSS — PRIMARY PRESS RELEASE SOURCE ────────────────────────────────────
const PRN_RSS = kw =>
  `https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=${encodeURIComponent(kw)}`

async function fetchPRN(keyword) {
  try {
    const res = await fetch(PRN_RSS(keyword), {
      headers: { 'User-Agent': 'Mozilla/5.0 (DownRangeBot/3.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const xml = await res.text()
    return parseXML(xml)
  } catch { return [] }
}

// ── EDITORIAL RSS — TFB, TTAG, AMERICAN RIFLEMAN ─────────────────────────────
const EDITORIAL_FEEDS = [
  { name: 'The Firearm Blog',   url: 'https://www.thefirearmblog.com/blog/feed/', cat: 'editorial' },
  { name: 'TTAG',               url: 'https://www.thetruthaboutguns.com/feed/',   cat: 'editorial' },
  { name: 'American Rifleman',  url: 'https://www.americanrifleman.org/feed/',    cat: 'editorial' },
  { name: 'Guns.com',           url: 'https://www.guns.com/feed',                 cat: 'editorial' },
]

async function fetchEditorialFeeds() {
  const results = []
  for (const feed of EDITORIAL_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of parsed.items.slice(0, 8)) {
        if (!isReleaseCandidate(item.title, item.contentSnippet)) continue
        results.push({
          title:       item.title,
          link:        item.link,
          description: item.contentSnippet?.slice(0, 500) || '',
          pubDate:     item.pubDate,
          sourceName:  feed.name,
          sourceType:  'editorial',
        })
      }
    } catch (e) {
      console.warn(`[RELEASES] Editorial feed error (${feed.name}):`, e.message)
    }
    await sleep(600)
  }
  return results
}

// ── MANUFACTURER DIRECT PAGE SCRAPE ──────────────────────────────────────────
async function scrapeManufacturerPage(mfr) {
  if (!mfr.directNewsUrl) return []
  try {
    const res = await fetch(mfr.directNewsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (DownRangeBot/3.0)' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()
    return extractLinksFromHTML(html, mfr.directNewsUrl, mfr.brand)
  } catch { return [] }
}

function extractLinksFromHTML(html, baseUrl, brand) {
  const items = []
  const base  = new URL(baseUrl)

  // Find article/news links — look for <a> tags near heading text
  const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]{15,200})<\/a>/gi
  let match
  while ((match = linkPattern.exec(html)) !== null) {
    const [, href, text] = match
    const cleanText = text.replace(/\s+/g, ' ').trim()
    if (!isReleaseCandidate(cleanText, '')) continue

    let url = href
    try {
      url = new URL(href, base.origin).href
    } catch { continue }

    if (!url.includes(base.hostname) && !url.startsWith('/')) continue
    items.push({ title: cleanText, link: url, brand, sourceType: 'manufacturer' })
  }

  return items.slice(0, PER_SOURCE)
}

// ── FUSION FIREARMS SPECIFIC SCRAPER ─────────────────────────────────────────
async function scrapeFusionFirearms() {
  const results = []
  const urls = [
    'https://fusionfirearms.com/videovault/',
    'https://fusionfirearms.com/handguns/',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (DownRangeBot/3.0)' },
        signal: AbortSignal.timeout(10000),
      })
      const html = await res.text()
      // Extract posts with product-related titles
      const titlePattern = /<(?:h[1-4]|a)[^>]*>([^<]{15,200})<\/(?:h[1-4]|a)>/gi
      let m
      while ((m = titlePattern.exec(html)) !== null) {
        const text = m[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim()
        if (isReleaseCandidate(text, 'fusion firearms xp xf 1911')) {
          results.push({
            title: text,
            link: url,
            brand: 'Fusion Firearms',
            description: text,
            sourceType: 'manufacturer',
            pubDate: new Date().toISOString(),
          })
        }
      }
    } catch (e) {
      console.warn('[RELEASES] Fusion scrape error:', e.message)
    }
    await sleep(RATE_MS)
  }
  return results.slice(0, PER_SOURCE)
}

// ── FETCH FULL PAGE + EXTRACT IMAGE ──────────────────────────────────────────
async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (DownRangeBot/3.0)' },
      signal: AbortSignal.timeout(10000),
    })
    const html = await res.text()

    // Strip scripts/styles, collapse whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)

    // OG image > first img > null
    const ogMatch  = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    const imgMatch = html.match(/<img[^>]+src="(https?:\/\/[^"]{10,})"[^>]*/i)
    const imageUrl = ogMatch?.[1] || imgMatch?.[1] || null

    return { text, imageUrl }
  } catch {
    return { text: '', imageUrl: null }
  }
}

// ── XML PARSER (for PRN) ──────────────────────────────────────────────────────
function parseXML(xml) {
  const items = []
  const rx = /<item>([\s\S]*?)<\/item>/g
  let m
  while ((m = rx.exec(xml)) !== null) {
    const block = m[1]
    const get = tag => {
      const r = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`))
      return r ? (r[1] || r[2] || '').trim() : ''
    }
    items.push({ title: get('title'), link: get('link'), description: get('description'), pubDate: get('pubDate') })
  }
  return items
}

// ── DEDUP CHECK ───────────────────────────────────────────────────────────────
const seenInRun = new Set()

async function isDuplicate(url, brand, model) {
  const key = `${brand}::${model}`.toLowerCase()
  if (seenInRun.has(url) || seenInRun.has(key)) return true
  seenInRun.add(url)
  seenInRun.add(key)

  try {
    const [byUrl, byBrandModel] = await Promise.all([
      sanity.fetch(`*[_type=="firearmRelease" && sourceUrl==$url][0]._id`, { url }),
      sanity.fetch(`*[_type=="firearmRelease" && brand==$brand && model==$model][0]._id`, { brand, model }),
    ])
    return !!(byUrl || byBrandModel)
  } catch { return false }
}

// ── CLAUDE: EXTRACT + WRITE ORIGINAL ARTICLE ─────────────────────────────────
async function extractAndWrite(rawTitle, pageText, sourceUrl, mfr) {
  const mfrNotes = mfr?.notes || ''
  const prompt = `You are a DownRange editor — a firearms journalist who writes for serious gun owners.

SOURCE DATA:
Title: ${rawTitle}
Manufacturer: ${mfr?.brand || 'Unknown'}
${mfrNotes ? `Manufacturer notes: ${mfrNotes}` : ''}
URL: ${sourceUrl}
Page text (truncated): ${pageText.slice(0, 3000)}

TASK: Extract product data and write a completely original DownRange article.
This article must be rewritten in DownRange's voice — NOT copied from the source.
We need original analysis, not a paraphrase of marketing copy.

Return ONLY this JSON (no markdown fences, no preamble):
{
  "title": "DownRange-written headline. Specific and factual. E.g.: 'Fusion Firearms XP 3C Compact Carry Hits Pre-Order — 9mm Double-Stack 1911-Pattern'",
  "brand": "Exact manufacturer name",
  "model": "Model designation only",
  "category": "Pistol|Rifle|Shotgun|Revolver|Suppressor|Optic|Accessory|Ammo",
  "caliber": "e.g. 9mm Luger, or null",
  "action": "e.g. Striker-Fired, Semi-Auto, Pump, Bolt-Action, or null",
  "msrp": 0,
  "summary": "3-4 sentence DownRange summary. Direct, specific, written for carriers and competitors. What matters about this gun. What makes it different from existing options. No marketing fluff. No AI filler.",
  "body": "600-900 word HTML article body. Sections with <h2> tags. Structure: intro → What's New → Key Specs → Who It's For → Bottom Line. Write like a gun owner, not a press release. Use specific details from the source text. Do NOT reproduce manufacturer marketing copy verbatim.",
  "specs": [
    {"label": "Barrel Length", "value": "4.25 in"},
    {"label": "Overall Length", "value": "7.8 in"},
    {"label": "Weight", "value": "28.5 oz"},
    {"label": "Capacity", "value": "17+1"},
    {"label": "Frame", "value": "Aluminum"}
  ],
  "availableDate": "YYYY-MM-DD or null",
  "imageUrl": null,
  "skip": false
}

Rules:
- msrp: number only, no $ sign, 0 if not mentioned
- specs: only specs explicitly stated in the source (2-8 items max)
- If this is NOT a new product announcement, set skip:true
- title must be DownRange original — NOT the manufacturer's title verbatim
- body must be original prose, NOT marketing copy reproduced or paraphrased closely
- Do not invent specs not present in the source`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const raw  = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error('[RELEASES] Claude error:', e.message)
    return null
  }
}

// ── UPLOAD IMAGE TO SANITY CDN ────────────────────────────────────────────────
async function uploadImageToSanity(imageUrl) {
  if (!imageUrl || !process.env.SANITY_API_TOKEN) return null
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'

    const uploaded = await sanity.assets.upload('image',
      Buffer.from(buffer),
      { contentType, filename: `release-${Date.now()}.jpg` }
    )
    return uploaded._id
  } catch { return null }
}

// ── SAVE TO SANITY ────────────────────────────────────────────────────────────
async function saveRelease(extracted, sourceUrl, imageUrl, pubDate) {
  const slug = extracted.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)

  // Try to upload image to Sanity CDN
  const imageAssetId = await uploadImageToSanity(imageUrl || extracted.imageUrl)

  const doc = {
    _type:        'firearmRelease',
    title:        extracted.title,
    slug:         { _type: 'slug', current: slug },
    brand:        extracted.brand,
    model:        extracted.model,
    category:     extracted.category,
    caliber:      extracted.caliber  || null,
    action:       extracted.action   || null,
    msrp:         extracted.msrp     || 0,
    summary:      extracted.summary,
    body:         extracted.body     || null,
    specs:        (extracted.specs || []).map(s => ({
      _type: 'object',
      _key:  s.label.toLowerCase().replace(/\s+/g, '-'),
      label: s.label,
      value: s.value,
    })),
    imageUrl:     (!imageAssetId && (imageUrl || extracted.imageUrl)) || null,
    ...(imageAssetId ? { heroImage: { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } } } : {}),
    sourceUrl,
    availableDate:        extracted.availableDate || null,
    isJustDropped:        true,
    approved:             true,   // ← AUTO-PUBLISH: show immediately
    qualityReviewed:      true,
    publishedAt:          pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    pressReleaseExcerpt:  null,
  }

  return sanity.create(doc)
}

// ── MAIN FUNCTION ─────────────────────────────────────────────────────────────
export async function runReleasesFeed() {
  console.log('[RELEASES v3] Starting...')
  const t0 = Date.now()
  let done = 0, failed = 0, skipped = 0
  seenInRun.clear()

  // ── 1. Editorial RSS (TTAG, TFB, American Rifleman) ─────────────────────────
  const editorialItems = await fetchEditorialFeeds()
  console.log(`[RELEASES v3] Editorial: ${editorialItems.length} candidates`)

  // ── 2. PRNewswire for each manufacturer ──────────────────────────────────────
  const prnItems = []
  for (const mfr of MANUFACTURERS) {
    if (done >= MAX_PER_RUN) break
    const items = await fetchPRN(mfr.prnKeyword)
    const filtered = items
      .filter(i => isReleaseCandidate(i.title, i.description))
      .slice(0, PER_SOURCE)
      .map(i => ({ ...i, brand: mfr.brand, mfr, sourceType: 'prn' }))
    prnItems.push(...filtered)
    await sleep(500)
  }
  console.log(`[RELEASES v3] PRN: ${prnItems.length} candidates`)

  // ── 3. Fusion Firearms direct scrape ─────────────────────────────────────────
  const fusionItems = await scrapeFusionFirearms()
  console.log(`[RELEASES v3] Fusion Firearms: ${fusionItems.length} candidates`)

  // ── 4. Process all candidates in priority order ───────────────────────────────
  const allItems = [...fusionItems, ...prnItems, ...editorialItems]

  for (const item of allItems) {
    if (done >= MAX_PER_RUN) break
    if (!item.title || !item.link) { skipped++; continue }

    // Identify manufacturer
    const mfr = item.mfr || matchManufacturer(item.title + ' ' + (item.description || '') + ' ' + (item.brand || ''))

    // Fetch page
    const { text: pageText, imageUrl } = await fetchPageContent(item.link)
    const combined = pageText || item.description || item.title

    // Claude extract + write
    const extracted = await extractAndWrite(item.title, combined, item.link, mfr)
    if (!extracted || extracted.skip) { skipped++; continue }

    // Dedup
    if (await isDuplicate(item.link, extracted.brand, extracted.model)) { skipped++; continue }

    // Save
    try {
      await saveRelease(extracted, item.link, imageUrl, item.pubDate)
      done++
      console.log(`[RELEASES v3] ✓ ${extracted.brand} ${extracted.model}`)
    } catch (e) {
      failed++
      console.error(`[RELEASES v3] Save failed: ${e.message}`)
    }

    await sleep(RATE_MS)
  }

  const elapsed = Date.now() - t0
  console.log(`[RELEASES v3] Done. ${done} saved, ${skipped} skipped, ${failed} failed. ${elapsed}ms`)
  return { done, failed, skipped }
}
