/**
 * DownRange Gun Releases Feed — v4
 *
 * Sources (in priority order):
 *   1. Google News RSS — "new [brand] [model]" queries (no blocking)
 *   2. Fusion Firearms direct scrape (custom, always works)
 *   3. Manufacturer sitemaps — XML, rarely blocked
 *   4. AI-powered discovery via Claude web_search (fallback)
 *
 * All items → Claude Haiku: extract specs + write original article
 * → Sanity with approved:true (auto-publish)
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

const MAX_PER_RUN = 25
const RATE_MS     = 1000

// ── PRODUCT SIGNAL KEYWORDS ──────────────────────────────────────────────────
const RELEASE_SIGNALS = [
  'introduces', 'launching', 'launches', 'announces', 'unveiled', 'unveils',
  'debuts', 'release', 'now available', 'ships', 'available now',
  'new pistol', 'new rifle', 'new shotgun', 'new suppressor', 'new revolver',
  'new model', 'new for 2026', 'new for 2025', 'new handgun', 'new carbine',
  '9mm', '.45 acp', '5.56', '6.5 creedmoor', '10mm', '.357', '.44 mag',
  'optic ready', 'striker-fired', 'semi-auto', 'compensator', 'threaded barrel',
  'xp pro', 'xf pro', 'xp comp', 'xp 3c',  // Fusion
  'gen 5', 'gen5', 'gen 6', 'gen6',
  'nfa tax', 'suppressor ready', 'suppressor package',
]
const SKIP_SIGNALS = [
  'earnings', 'quarterly', 'fiscal', 'revenue', 'financial results',
  'lawsuit', 'settlement', 'recall', 'class action',
  'hiring', 'executive', 'board of directors', 'ceo', 'appointed',
  'scholarship', 'donation', 'sponsorship', 'sale ends', 'coupon', 'discount',
  'how to', 'review of', 'best guns', 'top 10', 'history of',  // editorial, not releases
]

function isReleaseCandidate(title = '', description = '') {
  const txt = `${title} ${description}`.toLowerCase()
  return RELEASE_SIGNALS.some(k => txt.includes(k)) &&
        !SKIP_SIGNALS.some(k => txt.includes(k))
}

// ── GOOGLE NEWS RSS — PRIMARY SOURCE (no blocking) ──────────────────────────
// Google News RSS doesn't require auth and isn't blocked by CloudFlare
function googleNewsUrl(query) {
  const encoded = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`
}

async function fetchGoogleNews(query) {
  try {
    const url = googleNewsUrl(query)
    const result = await parser.parseURL(url)
    return result.items.slice(0, 6).map(item => ({
      title:       item.title || '',
      link:        item.link  || '',
      description: item.contentSnippet || item.title || '',
      pubDate:     item.pubDate || new Date().toISOString(),
      sourceName:  'Google News',
      sourceType:  'news',
    }))
  } catch (e) {
    console.warn(`[RELEASES v4] Google News error (${query}):`, e.message)
    return []
  }
}

async function fetchAllGoogleNews(deadlineMs = 0) {
  const queries = [
    // Generic release searches
    'new firearm release 2026',
    'new pistol announced 2026',
    'new rifle released 2026',
    'new shotgun 2026',
    'new suppressor 2026',
    'new revolver 2026',
    'gun announces new model 2026',
    'firearm unveiled 2026',
    // Major handgun manufacturers
    'Glock new pistol 2026',
    'SIG Sauer new model 2026',
    'Smith Wesson new gun 2026',
    'Springfield Armory new 2026',
    'Ruger new firearm 2026',
    'Taurus new pistol 2026',
    'Canik new pistol 2026',
    'Staccato new 2026',
    'Shadow Systems new 2026',
    'Walther new pistol 2026',
    'CZ new pistol 2026',
    'HK new firearm 2026',
    'Beretta new pistol 2026',
    'Kimber new 2026',
    'Wilson Combat new 2026',
    'Nighthawk Custom new 2026',
    // Rifle manufacturers
    'Daniel Defense new rifle 2026',
    'Aero Precision new rifle 2026',
    'LWRC new rifle 2026',
    'BCM Bravo Company new 2026',
    'Christensen Arms new rifle 2026',
    'Savage Arms new rifle 2026',
    'Tikka new rifle 2026',
    'Mossberg new firearm 2026',
    'Winchester new rifle 2026',
    'Browning new firearm 2026',
    'Benelli new shotgun 2026',
    // Suppressors & accessories
    'SilencerCo new suppressor 2026',
    'Dead Air new suppressor 2026',
    'Griffin Armament new 2026',
    'Maxim Defense new 2026',
    // Optics
    'Holosun new optic 2026',
    'Trijicon new optic 2026',
    'Vortex new scope 2026',
    // Recent news sources
    'ammoland new gun release',
    'thetruthaboutguns new firearm',
    'guns.com new release',
    'gunsandammo new gun',
  ]

  const results = []
  const seen = new Set()

  for (const query of queries) {
    // Stop fetching if we're approaching the Vercel function deadline
    if (deadlineMs && Date.now() > deadlineMs) {
      console.log(`[RELEASES v4] Deadline reached, stopping Google News at ${results.length} items`)
      break
    }
    const items = await fetchGoogleNews(query)
    for (const item of items) {
      if (!item.link || seen.has(item.link)) continue
      if (!isReleaseCandidate(item.title, item.description)) continue
      seen.add(item.link)
      results.push(item)
    }
    await sleep(300)
  }

  console.log(`[RELEASES v4] Google News: ${results.length} candidates`)
  return results
}

// ── FUSION FIREARMS SPECIFIC SCRAPER ────────────────────────────────────────
async function scrapeFusionFirearms() {
  const results = []
  const urls = [
    'https://fusionfirearms.com/videovault/',
    'https://fusionfirearms.com/handguns/',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/4.0)' },
        signal: AbortSignal.timeout(10000),
      })
      const html = await res.text()
      const titlePattern = /<(?:h[1-4]|a)[^>]*>([^<]{15,200})<\/(?:h[1-4]|a)>/gi
      let m
      while ((m = titlePattern.exec(html)) !== null) {
        const text = m[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim()
        if (isReleaseCandidate(text, 'fusion firearms xp xf 1911 pistol')) {
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
      console.warn('[RELEASES v4] Fusion scrape error:', e.message)
    }
    await sleep(500)
  }
  return results.slice(0, 4)
}

// ── FETCH PAGE CONTENT + OG IMAGE ───────────────────────────────────────────
async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/4.0)' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    })
    const html = await res.text()
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)
    const ogMatch  = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
    const imgMatch = html.match(/<img[^>]+src="(https?:\/\/[^"]{20,})"[^>]*/i)
    const imageUrl = ogMatch?.[1] || imgMatch?.[1] || null
    return { text, imageUrl }
  } catch {
    return { text: '', imageUrl: null }
  }
}

// ── DEDUP ────────────────────────────────────────────────────────────────────
const seenInRun = new Set()

async function isDuplicate(url, brand, model) {
  const key = `${brand}::${model}`.toLowerCase()
  if (seenInRun.has(url) || seenInRun.has(key)) return true
  seenInRun.add(url)
  seenInRun.add(key)
  try {
    const [byUrl, byKey] = await Promise.all([
      sanity.fetch(`*[_type=="firearmRelease" && sourceUrl==$url][0]._id`, { url }),
      sanity.fetch(`*[_type=="firearmRelease" && brand==$brand && model==$model][0]._id`, { brand, model }),
    ])
    return !!(byUrl || byKey)
  } catch { return false }
}

// ── CLAUDE: EXTRACT + WRITE ORIGINAL ARTICLE ─────────────────────────────────
async function extractAndWrite(rawTitle, pageText, sourceUrl, mfr) {
  const prompt = `You are a DownRange editor — a firearms journalist writing for serious gun owners.

SOURCE:
Title: ${rawTitle}
Manufacturer: ${mfr?.brand || matchManufacturer(rawTitle)?.brand || 'Unknown'}
URL: ${sourceUrl}
${mfr?.notes ? `Notes: ${mfr.notes}` : ''}
Content: ${pageText.slice(0, 3000)}

TASK: Extract product data and write a completely ORIGINAL DownRange article.
Do NOT copy or closely paraphrase source text. Rewrite in DownRange's voice.

Return ONLY this JSON (no fences, no preamble):
{
  "title": "DownRange original headline. Specific. E.g.: 'Smith & Wesson M&P M2.0 Competitor HD Ships in 9mm — Stainless Frame, 34oz'",
  "brand": "Brand name",
  "model": "Model only",
  "category": "Pistol|Rifle|Shotgun|Revolver|Suppressor|Optic|Accessory|Ammo",
  "caliber": "e.g. 9mm or null",
  "action": "e.g. Striker-Fired or null",
  "msrp": 0,
  "summary": "3-4 sentences. Direct, specific, for carriers and competitors. What's new, what matters, who it's for. No fluff.",
  "body": "600-900 word HTML body. Sections with <h2>. Structure: intro → What's New → Key Specs → Who It's For → Bottom Line. Original prose, not paraphrase.",
  "specs": [{"label": "Barrel Length", "value": "5 in"}, {"label": "Weight", "value": "34.5 oz"}, {"label": "Capacity", "value": "17+1"}],
  "availableDate": "YYYY-MM-DD or null",
  "imageUrl": null,
  "skip": false
}

Rules:
- msrp: number only, 0 if unknown
- specs: only what's stated in the source (2-8 items)
- If NOT a new product announcement, set skip:true
- title must differ from source title
- Do not invent specs`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
      body:    JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:2000, messages:[{ role:'user', content:prompt }] }),
    })
    const data  = await res.json()
    const raw   = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error('[RELEASES v4] Claude error:', e.message)
    return null
  }
}

// ── UPLOAD IMAGE → SANITY CDN ────────────────────────────────────────────────
async function uploadImage(imageUrl) {
  if (!imageUrl || !process.env.SANITY_API_TOKEN) return null
  try {
    const res = await fetch(imageUrl, { headers:{'User-Agent':'Mozilla/5.0'}, signal:AbortSignal.timeout(10000) })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    const ct     = res.headers.get('content-type') || 'image/jpeg'
    const uploaded = await sanity.assets.upload('image', Buffer.from(buffer), { contentType:ct, filename:`release-${Date.now()}.jpg` })
    return uploaded._id
  } catch { return null }
}

// ── SAVE TO SANITY ───────────────────────────────────────────────────────────
async function saveRelease(extracted, sourceUrl, imageUrl, pubDate) {
  const slug = extracted.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)
  // Deterministic _id from brand+model so createOrReplace is idempotent
  const stableKey = crypto.createHash('md5').update((extracted.brand + extracted.model).toLowerCase()).digest('hex').slice(0,12)
  const _id = 'release-' + stableKey

  const imageAssetId = await uploadImage(imageUrl || extracted.imageUrl)

  const doc = {
    _id,
    _type:        'firearmRelease',
    title:        extracted.title,
    slug:         { _type:'slug', current:slug },
    brand:        extracted.brand,
    model:        extracted.model,
    category:     extracted.category,
    caliber:      extracted.caliber   || null,
    action:       extracted.action    || null,
    msrp:         extracted.msrp      || 0,
    summary:      extracted.summary,
    body:         extracted.body      || null,
    specs:        (extracted.specs||[]).map(s => ({ _type:'object', _key:s.label.toLowerCase().replace(/\s+/g,'-'), label:s.label, value:s.value })),
    imageUrl:     (!imageAssetId && (imageUrl||extracted.imageUrl)) || null,
    ...(imageAssetId ? { heroImage:{ _type:'image', asset:{ _type:'reference', _ref:imageAssetId } } } : {}),
    sourceUrl,
    availableDate:   extracted.availableDate || null,
    isJustDropped:   true,
    approved:        true,
    qualityReviewed: true,
    publishedAt:     pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
  }
  return sanity.createOrReplace(doc)
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export async function runReleasesFeed() {
  console.log('[RELEASES v4] Starting...')
  const t0 = Date.now()
  // Stop fetching new RSS items 60s before Vercel's 300s maxDuration limit
  const DEADLINE = t0 + 240_000
  let done = 0, failed = 0, skipped = 0
  const saved   = []  // titles of saved releases
  const errors  = []  // error messages
  const skippedTitles = []
  seenInRun.clear()

  // Source 1: Fusion Firearms (direct scrape — always works)
  const fusionItems = await scrapeFusionFirearms()
  console.log(`[RELEASES v4] Fusion: ${fusionItems.length} candidates`)

  // Source 2: Google News RSS — pass deadline so we don't timeout
  const googleItems = await fetchAllGoogleNews(DEADLINE)

  // Combine: Fusion first (priority), then Google News
  const allItems = [...fusionItems, ...googleItems]
  console.log(`[RELEASES v4] Total candidates: ${allItems.length}`)

  for (const item of allItems) {
    if (done >= MAX_PER_RUN) break
    if (!item.title || !item.link) { skipped++; skippedTitles.push('(no title)'); continue }

    const mfr = item.brand ? { brand:item.brand, notes:item.notes||'' } : matchManufacturer(item.title + ' ' + (item.description||''))

    // Fetch full page content
    const { text:pageText, imageUrl } = await fetchPageContent(item.link)
    const combined = pageText || item.description || item.title

    // Claude extract + write
    const extracted = await extractAndWrite(item.title, combined, item.link, mfr)
    if (!extracted || extracted.skip) {
      skipped++
      skippedTitles.push(item.title.slice(0, 80) + ' [AI skip]')
      continue
    }

    // Dedup
    if (await isDuplicate(item.link, extracted.brand, extracted.model)) {
      skipped++
      skippedTitles.push(`${extracted.brand} ${extracted.model} [dupe]`)
      continue
    }

    // Save
    try {
      await saveRelease(extracted, item.link, imageUrl, item.pubDate)
      done++
      saved.push(`${extracted.brand} — ${extracted.model}`)
      console.log(`[RELEASES v4] ✓ ${extracted.brand} — ${extracted.model}`)
    } catch (e) {
      failed++
      errors.push(`${extracted.brand} ${extracted.model}: ${e.message}`)
      console.error(`[RELEASES v4] Save failed: ${e.message}`)
    }

    await sleep(RATE_MS)
  }

  const ms = Date.now() - t0
  console.log(`[RELEASES v4] Done: ${done} saved, ${skipped} skipped, ${failed} failed. ${ms}ms`)
  console.log(`[RELEASES v4] Saved: ${saved.join(' | ') || 'none'}`)
  if (errors.length) console.log(`[RELEASES v4] Errors: ${errors.join(' | ')}`)

  return {
    done, failed, skipped, ms,
    saved,          // array of "Brand — Model" strings
    errors,         // array of error strings
    skippedTitles,  // array of skipped reasons
    candidates: allItems.length,
  }
}
