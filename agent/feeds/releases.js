/**
 * DownRange Gun Releases Feed — v4
 *
 * Sources (in priority order):
 *   1. Fusion Firearms direct scrape (custom, always works)
 *
 * All items → Claude Haiku: extract specs + write original article
 * → Sanity with approved:true (auto-publish)
 */

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
// NOTE: og:image match is preferred (publisher-declared, almost always the actual
// product/article photo). The <img> tag fallback below is intentionally strict —
// the previous version took the FIRST <img src> on the page with no filtering,
// which regularly grabbed nav logos, ad banners, and social icons instead of the
// product photo on pages without an og:image tag. Now filters out common
// logo/icon/ad/tracking-pixel patterns and prefers images with larger declared
// width/height attributes, since real product photos are usually sized >=300px.
function pickBestImgTag(html) {
  const imgRe = /<img[^>]+src="(https?:\/\/[^"]{20,})"[^>]*>/gi
  const BAD_PATTERNS = /logo|icon|avatar|sprite|pixel|tracking|badge|button|spacer|favicon|placeholder|1x1|blank\.(gif|png)/i
  let best = null
  let bestScore = -1
  let m
  while ((m = imgRe.exec(html)) !== null) {
    const tag = m[0]
    const src = m[1]
    if (BAD_PATTERNS.test(src)) continue
    const wMatch = tag.match(/width=["']?(\d+)/i)
    const hMatch = tag.match(/height=["']?(\d+)/i)
    const w = wMatch ? parseInt(wMatch[1], 10) : 0
    const h = hMatch ? parseInt(hMatch[1], 10) : 0
    // Score: prefer declared larger dimensions; undeclared-size images get a
    // modest baseline score so they're still eligible, just ranked behind
    // anything explicitly sized as a real photo.
    const score = (w && h) ? (w * h) : 50000
    if (score > bestScore) { bestScore = score; best = src }
  }
  return best
}

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
    const imageUrl = ogMatch?.[1] || pickBestImgTag(html) || null
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
  let done = 0, failed = 0, skipped = 0
  const saved   = []  // titles of saved releases
  const errors  = []  // error messages
  const skippedTitles = []
  seenInRun.clear()

  // Source 1: Fusion Firearms (direct scrape)
  const fusionItems = await scrapeFusionFirearms()
  console.log(`[RELEASES v4] Fusion: ${fusionItems.length} candidates`)

  const allItems = [...fusionItems]
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
