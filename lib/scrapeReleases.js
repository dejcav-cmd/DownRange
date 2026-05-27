/**
 * DownRange Releases Scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Pipeline:
 *   1. Fetch PRNewswire RSS for each manufacturer keyword
 *   2. Filter to firearm product announcements (not earnings, not events)
 *   3. Fetch full press release HTML
 *   4. Send to Claude API → extract structured data (name, caliber, MSRP, specs, image)
 *   5. Check Sanity for duplicates (by sourceUrl)
 *   6. Write new releases to Sanity as `firearmRelease` documents
 *   7. Return summary { added, skipped, failed }
 */

import { createClient } from '@sanity/client'
import { MANUFACTURERS, matchManufacturer } from '@/lib/manufacturers'
import { logPull, STATUS, PULL_SOURCES } from '@/lib/pullLogger'
import axios from 'axios'

// ── Sanity write client ───────────────────────────────────────────────────────

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// ── PRNewswire RSS base ───────────────────────────────────────────────────────
// PRNewswire provides free RSS at this URL pattern — no auth needed
const PRN_RSS = (keyword) =>
  `https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=${encodeURIComponent(keyword)}`

// BusinessWire RSS — secondary source
const BW_RSS = (keyword) =>
  `https://feed.businesswire.com/rss/home/?rss=G22&rssid=${encodeURIComponent(keyword)}`

// ── Firearm product keywords — filters out earnings/events ───────────────────
const PRODUCT_KEYWORDS = [
  'introduces', 'launches', 'announces', 'unveils', 'debuts', 'releases',
  'new pistol', 'new rifle', 'new shotgun', 'new suppressor', 'new firearm',
  'new handgun', 'new revolver', 'new carbine', 'new model',
  '9mm', '.45 acp', '5.56', '.308', '6.5 creedmoor', '10mm', '.357',
  'optic ready', 'mos', 'gen5', 'gen6', 'striker', 'semi-auto',
  'shot show', 'new for 2025', 'new for 2026',
]

const SKIP_KEYWORDS = [
  'earnings', 'quarterly', 'fiscal', 'revenue', 'lawsuit', 'settlement',
  'recall notice', 'hiring', 'executive', 'appointment', 'award', 'donation',
  'scholarship', 'sponsorship', 'construction',
]

function isProductRelease(title, summary) {
  const text = `${title} ${summary}`.toLowerCase()
  const hasProduct = PRODUCT_KEYWORDS.some(k => text.includes(k))
  const isSkip = SKIP_KEYWORDS.some(k => text.includes(k))
  return hasProduct && !isSkip
}

// ── Parse RSS XML ─────────────────────────────────────────────────────────────
function parseRSS(xml) {
  const items = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const block = match[1]
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`))
      return m ? (m[1] || m[2] || '').trim() : ''
    }
    items.push({
      title:   get('title'),
      link:    get('link'),
      summary: get('description'),
      pubDate: get('pubDate'),
    })
  }
  return items
}

// ── Fetch a manufacturer's PRN RSS ───────────────────────────────────────────
async function fetchPRNFeed(keyword) {
  try {
    const { data } = await axios.get(PRN_RSS(keyword), {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)' }
    })
    return parseRSS(data)
  } catch {
    return []
  }
}

// ── Fetch full press release HTML ─────────────────────────────────────────────
async function fetchFullPage(url) {
  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)' }
    })
    // Strip tags, collapse whitespace, limit to 4000 chars
    const text = data
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4000)

    // Also try to extract first <img> src
    const imgMatch = data.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
    const imageUrl = imgMatch ? imgMatch[1] : null

    return { text, imageUrl }
  } catch {
    return { text: '', imageUrl: null }
  }
}

// ── Claude AI extractor ───────────────────────────────────────────────────────
async function extractWithClaude(title, pressReleaseText, sourceUrl, manufacturer) {
  const prompt = `You are a firearms data extraction AI for DownRange, America's top firearms intelligence platform.

Extract structured product data from this press release about a new firearm or firearms product.

PRESS RELEASE TITLE: ${title}
SOURCE: ${sourceUrl}
KNOWN MANUFACTURER: ${manufacturer?.brand || 'Unknown'}

PRESS RELEASE TEXT:
${pressReleaseText.slice(0, 3500)}

Return ONLY a valid JSON object with exactly these fields (no markdown, no preamble):
{
  "title": "Full product name e.g. Glock G47 Gen5 MOS",
  "brand": "Manufacturer brand name",
  "model": "Model designation only e.g. G47 MOS",
  "category": "One of: Pistol, Rifle, Shotgun, Revolver, Suppressor, Optic, Accessory, Ammo",
  "caliber": "Primary caliber e.g. 9mm, 5.56 NATO, .308 Win — or null",
  "action": "Action type e.g. Striker-Fired, Semi-Auto, Pump, Bolt-Action — or null",
  "msrp": 0,
  "summary": "2-3 sentence editorial summary for gun owners. Specific, factual, no fluff. What makes this worth knowing about.",
  "specs": [
    {"label": "Barrel Length", "value": "4.02 in"},
    {"label": "Overall Length", "value": "7.44 in"},
    {"label": "Weight", "value": "24.5 oz"},
    {"label": "Capacity", "value": "17+1"},
    {"label": "Finish", "value": "nDLC"}
  ],
  "imageUrl": null,
  "availableDate": "YYYY-MM-DD or null",
  "isJustDropped": true,
  "pressReleaseExcerpt": "Key paragraph from the press release, max 300 chars"
}

Rules:
- msrp must be a number (no $ sign) or 0 if not stated
- specs array: include only specs actually mentioned in the release (2-8 items)
- summary must be 2-3 sentences max, written for serious gun owners
- If this is NOT a firearm product announcement, return {"skip": true}
- Do not invent data not present in the release`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const raw = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

// ── Check Sanity for existing release by sourceUrl ────────────────────────────
async function isDuplicate(sourceUrl) {
  try {
    const existing = await sanity.fetch(
      `*[_type == "firearmRelease" && sourceUrl == $url][0]._id`,
      { url: sourceUrl }
    )
    return !!existing
  } catch {
    return false
  }
}

// ── Write release to Sanity ───────────────────────────────────────────────────
async function saveToSanity(extracted, sourceUrl, imageUrl, pubDate) {
  const doc = {
    _type: 'firearmRelease',
    title: extracted.title,
    slug: {
      _type: 'slug',
      current: extracted.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 96),
    },
    brand: extracted.brand,
    model: extracted.model,
    category: extracted.category,
    caliber: extracted.caliber,
    action: extracted.action,
    msrp: extracted.msrp || 0,
    summary: extracted.summary,
    specs: (extracted.specs || []).map(s => ({
      _type: 'object',
      _key: s.label.toLowerCase().replace(/\s+/g, '-'),
      label: s.label,
      value: s.value,
    })),
    imageUrl: imageUrl || extracted.imageUrl || null,
    sourceUrl,
    availableDate: extracted.availableDate || null,
    isJustDropped: true,
    publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    pressReleaseExcerpt: extracted.pressReleaseExcerpt || null,
  }

  return sanity.create(doc)
}

// ── Main scrape function ──────────────────────────────────────────────────────
export async function scrapeReleases({ limit = 3, onlyNew = true } = {}) {
  const results = { added: [], skipped: [], failed: [] }

  // Rotate through manufacturers — don't hammer all at once
  for (const manufacturer of MANUFACTURERS) {
    if (results.added.length >= limit) break

    const items = await fetchPRNFeed(manufacturer.prnKeyword)

    for (const item of items.slice(0, 5)) {
      if (results.added.length >= limit) break
      if (!item.title || !item.link) continue

      // Pre-filter
      if (!isProductRelease(item.title, item.summary)) {
        results.skipped.push({ title: item.title, reason: 'not-product' })
        continue
      }

      // Duplicate check
      if (onlyNew && await isDuplicate(item.link)) {
        results.skipped.push({ title: item.title, reason: 'duplicate' })
        continue
      }

      // Fetch full page
      const { text: fullText, imageUrl } = await fetchFullPage(item.link)
      const combined = fullText || item.summary || ''

      // AI extract
      const extracted = await extractWithClaude(
        item.title,
        combined,
        item.link,
        manufacturer
      )

      if (!extracted || extracted.skip) {
        results.skipped.push({ title: item.title, reason: 'ai-skip' })
        continue
      }

      // Save to Sanity
      try {
        const doc = await saveToSanity(extracted, item.link, imageUrl, item.pubDate)
        results.added.push({
          id: doc._id,
          title: extracted.title,
          brand: extracted.brand,
          url: item.link,
        })
      } catch (err) {
        results.failed.push({ title: item.title, error: err.message })
      }

      // Rate limit — be polite
      await new Promise(r => setTimeout(r, 1200))
    }
  }

  // Log to pull logger
  try {
    await logPull({
      sourceId: PULL_SOURCES.PRN_SCRAPER.id,
      status: results.failed.length > 0 && results.added.length === 0
        ? STATUS.FAILED
        : results.added.length > 0
        ? STATUS.SUCCESS
        : STATUS.SKIPPED,
      itemCount: results.added.length + results.skipped.length,
      newItems: results.added.length,
      headlines: results.added.slice(0, 5).map(r => `${r.brand} — ${r.title}`),
      error: results.failed.length > 0 ? results.failed.map(f => f.error).join('; ') : null,
      meta: {
        triggeredBy: 'cron',
        added: results.added.length,
        skipped: results.skipped.length,
        failed: results.failed.length,
      },
    })
  } catch (logErr) {
    console.warn('[scrapeReleases] logPull failed:', logErr.message)
  }

  return results
}
