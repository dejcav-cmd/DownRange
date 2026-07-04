/**
 * DownRange Gun Releases Feed — v6
 *
 * Architecture:
 *   1. Scrape 40 manufacturer press/news listing pages in parallel
 *   2. Pre-filter links with keyword gate (PRODUCT signal + FIREARM signal, no SKIP signals)
 *   3. Fetch each article page — extract text + image
 *   4. Claude Haiku: validate it's a real product launch + extract specs + write article
 *   5. Image waterfall: og:image → twitter:image → largest <img> → Bing image search fallback
 *   6. Upload image to Sanity CDN
 *   7. Dedup: Redis set (fast, TTL 90d) + Sanity query (authoritative)
 *   8. Save firearmRelease doc with heroImage + full article
 *
 * Schedule: twice a week — Mon & Thu at 06:45 UTC
 *
 * Sources (57):
 *   Pistols:     Glock, SIG Sauer ×2, S&W, Springfield, Taurus, Beretta, Kimber,
 *                Walther, CZ-USA, CZ Firearms, HK USA, FN America, Ruger, Canik,
 *                Staccato, Shadow Systems, Wilson Combat, Nighthawk Custom
 *   2011/Comp:   Bul Armory, MAC (Military Armament Corp), Colt
 *   Rifles:      Daniel Defense, Aero Precision, BCM, LWRC, Christensen Arms,
 *                Savage Arms, Mossberg, Winchester, Browning, Benelli USA,
 *                Maxim Defense, PSA, MPA, Tikka, Fusion Firearms
 *   Shotguns:    Stoeger, TriStar Arms, Hatsan USA, Weatherby, Retay
 *   Suppressors: SilencerCo, Dead Air, Griffin Armament, Rugged Suppressors,
 *                AAC, Gemtech, Q LLC, SureFire, HUXWRX
 *   Turkish:     SAR USA, Girsan (via EAA), Tisas (via SDS Imports)
 *   Nordic:      Sako
 *   Optics:      Holosun, Trijicon, Vortex
 */

import crypto from 'crypto'
import { createClient } from '@sanity/client'
import { matchManufacturer } from '../../lib/manufacturers.js'
import { decodeHtmlEntities } from '../../lib/decodeEntities.js'
import { sleep } from '../utils.js'
import { reportCronRun } from '../../lib/cronReporter.js'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

const MAX_PER_RUN = 20   // max new releases per run
const RATE_MS     = 1500 // delay between article fetches
const DEDUP_TTL   = 90 * 24 * 3600 // 90 days in seconds

// ── FETCH HELPER ─────────────────────────────────────────────────────────────
async function fetchHtml(url, timeoutMs = 12000) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal:   AbortSignal.timeout(timeoutMs),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// ── LAYER 1: KEYWORD GATE ─────────────────────────────────────────────────────
// A candidate must pass ALL three: has a PRODUCT signal, has a FIREARM signal,
// and has zero SKIP signals. Applied to listing-page titles before any HTTP fetch.

const PRODUCT_SIGNALS = [
  'introduces', 'launches', 'launch', 'announces', 'announced', 'unveiled', 'unveils',
  'debuts', 'now available', 'ships', 'available now', 'new model', 'new for 20',
  'just dropped', 'introducing', 'released', 'release', 'new pistol', 'new rifle',
  'new shotgun', 'new revolver', 'new carbine', 'new suppressor', 'new optic',
  'first look', 'shot show', 'nra show', 'limited edition', 'now shipping',
]
const FIREARM_SIGNALS = [
  'pistol', 'handgun', 'revolver', 'rifle', 'shotgun', 'carbine', 'sbr', 'pcc',
  'suppressor', 'silencer', 'firearm', 'gun', 'barrel', 'trigger', 'slide', 'frame',
  'receiver', 'magazine', 'caliber', '9mm', '.45', '10mm', '5.56', '6.5', '.308',
  '.300', '.357', '.44', '.380', '12 gauge', '.22', 'semi-auto', 'striker-fired',
  'bolt-action', 'lever-action', 'pump-action', 'optic', 'red dot', 'scope', 'sight',
  'threaded barrel', 'compensator', 'chassis', 'precision rifle', 'nfa',
]
const SKIP_SIGNALS = [
  // Financial noise
  'earnings', 'quarterly report', 'fiscal year', 'financial results', 'investor',
  'stock price', 'dividend', 'acquisition', 'merger', 'partnership agreement',
  // Legal
  'lawsuit', 'settlement', 'recall notice', 'class action', 'court ruling', 'injunction',
  // HR / corporate PR
  'we are hiring', 'job opening', 'ceo appointed', 'new ceo', 'board of directors',
  'scholarship', 'charity event', 'corporate donation', 'community sponsorship',
  // Pure editorial
  'best guns of', 'top 10 guns', 'history of the', 'retrospective', "buyer's guide",
  'which is better', 'vs.', 'comparison guide', 'how to clean', 'how to shoot',
  // Sales / promotions (not product launches)
  'sale ends', 'coupon code', 'black friday', 'cyber monday', 'price drop', 'clearance',
  // Non-firearm accessory content
  'cleaning solution', 'lubricant', 'bore cleaner', 'gun oil', 'cleaning kit',
  'holster review', 'range bag review', 'ammo test', 'ammunition review',
  // Company events not about products
  'trade show booth', 'attending shot show', 'competition results', 'shooting team',
]

function passesKeywordGate(title, context = '') {
  const txt = `${title} ${context}`.toLowerCase()
  if (SKIP_SIGNALS.some(s => txt.includes(s))) return false
  const hasProduct = PRODUCT_SIGNALS.some(s => txt.includes(s))
  const hasFirearm = FIREARM_SIGNALS.some(s => txt.includes(s))
  return hasProduct && hasFirearm
}

// ── MANUFACTURER SOURCES ──────────────────────────────────────────────────────
const MFR_SOURCES = [
  // Pistols
  { brand:'Glock',              url:'https://us.glock.com/en/press-release/news-page',            base:'https://us.glock.com',             pat:/\/press-release\/news-page\/[a-z0-9-]{5,}$/i },
  { brand:'SIG Sauer',          url:'https://www.sigsauer.com/blog/category/new-products',         base:'https://www.sigsauer.com',          pat:/\/blog\/[a-z0-9-]{10,}$/i },
  { brand:'SIG Sauer',          url:'https://www.sigsauer.com/blog/category/company-news',         base:'https://www.sigsauer.com',          pat:/\/blog\/[a-z0-9-]{10,}$/i },
  { brand:'Smith & Wesson',     url:'https://www.smith-wesson.com/company/news',                   base:'https://www.smith-wesson.com',      pat:/\/company\/news\/[a-z0-9-]+$/i },
  { brand:'Springfield Armory', url:'https://www.springfield-armory.com/intel/press-releases/',   base:'https://www.springfield-armory.com', pat:/\/intel\/press-releases\/.{5,}/i },
  { brand:'Taurus',             url:'https://www.taurususa.com/company/news/',                     base:'https://www.taurususa.com',         pat:/\/company\/news\/.{5,}/i },
  { brand:'Beretta',            url:'https://www.berettausa.com/en-us/press-releases/',            base:'https://www.berettausa.com',        pat:/\/press-releases?\/.{5,}/i },
  { brand:'Kimber',             url:'https://www.kimberamerica.com/press/',                        base:'https://www.kimberamerica.com',     pat:/\/press\/.{5,}/i },
  { brand:'Walther',            url:'https://waltherarms.com/journal',                             base:'https://waltherarms.com',           pat:/\/journal\/.{5,}/i },
  { brand:'CZ',                 url:'https://cz-usa.com/category/press-release',                   base:'https://cz-usa.com',                pat:/cz-usa\.com\/\d{4}\/.{5,}/i },
  { brand:'CZ',                 url:'https://www.czfirearms.com/en-us/news',                       base:'https://www.czfirearms.com',        pat:/\/news\/.{5,}/i },
  { brand:'HK',                 url:'https://www.hk-usa.com/news',                                 base:'https://www.hk-usa.com',            pat:/\/news\/.{5,}/i },
  { brand:'FN America',         url:'https://fnamerica.com/news/',                                 base:'https://fnamerica.com',             pat:/\/news\/.{5,}/i },
  { brand:'Ruger',              url:'https://ruger.com/news/',                                     base:'https://ruger.com',                 pat:/ruger\.com\/news\/[\d-]{5,}/i },
  { brand:'Canik',              url:'https://canikusa.com/news',                                   base:'https://canikusa.com',              pat:/canikusa\.com\/(news|blog)\/.{5,}/i },
  { brand:'Staccato',           url:'https://staccato2011.com/blogs/news',                         base:'https://staccato2011.com',          pat:/\/blogs\/news\/.{5,}/i },
  { brand:'Shadow Systems',     url:'https://shadowsystemscorp.com/blog/',                         base:'https://shadowsystemscorp.com',     pat:/\/blog\/.{5,}/i },
  { brand:'Wilson Combat',      url:'https://wilsoncombat.com/news/',                              base:'https://wilsoncombat.com',          pat:/\/news\/.{5,}/i },
  { brand:'Nighthawk Custom',   url:'https://www.nighthawkcustom.com/news/',                       base:'https://www.nighthawkcustom.com',   pat:/\/news\/.{5,}/i },
  // Rifles / Long guns
  { brand:'Daniel Defense',     url:'https://danieldefense.com/press-media',                       base:'https://danieldefense.com',         pat:/danieldefense\.com\/(blog|press|new)\/.{5,}/i },
  { brand:'Aero Precision',     url:'https://aeroprecisionusa.com/blogs/news',                     base:'https://aeroprecisionusa.com',      pat:/\/blogs\/news\/.{5,}/i },
  { brand:'Bravo Company',      url:'https://bravocompanymfg.com/blogs/news',                      base:'https://bravocompanymfg.com',       pat:/\/blogs\/news\/.{5,}/i },
  { brand:'LWRC',               url:'https://lwrci.com/blogs/news',                                base:'https://lwrci.com',                 pat:/\/blogs\/news\/.{5,}/i },
  { brand:'Christensen Arms',   url:'https://christensenarms.com/blogs/news',                      base:'https://christensenarms.com',       pat:/\/blogs\/news\/.{5,}/i },
  { brand:'Savage Arms',        url:'https://www.savagearms.com/news',                             base:'https://www.savagearms.com',        pat:/\/news\/.{5,}/i },
  { brand:'Mossberg',           url:'https://www.mossberg.com/news/',                              base:'https://www.mossberg.com',          pat:/\/news\/.{5,}/i },
  { brand:'Winchester',         url:'https://www.winchester.com/en-US/news/',                      base:'https://www.winchester.com',        pat:/\/news\/.{5,}/i },
  { brand:'Browning',           url:'https://www.browning.com/news/',                              base:'https://www.browning.com',          pat:/\/news\/.{5,}/i },
  { brand:'Benelli',            url:'https://www.benelliusa.com/news/',                            base:'https://www.benelliusa.com',        pat:/\/news\/.{5,}/i },
  { brand:'Maxim Defense',      url:'https://maximdefense.com/blogs/news',                         base:'https://maximdefense.com',          pat:/\/blogs\/news\/.{5,}/i },
  { brand:'Palmetto State Armory', url:'https://www.palmettostatearmory.com/blog/',               base:'https://www.palmettostatearmory.com', pat:/\/blog\/.{5,}/i },
  { brand:'MasterPiece Arms',   url:'https://www.masterpiece-arms.com/news/',                     base:'https://www.masterpiece-arms.com',  pat:/\/news\/.{5,}/i },
  { brand:'Tikka',              url:'https://www.tikka.fi/en/news',                                base:'https://www.tikka.fi',              pat:/\/news\/.{5,}/i },
  // Suppressors
  { brand:'SilencerCo',         url:'https://silencerco.com/news/',                                base:'https://silencerco.com',            pat:/\/news\/.{5,}/i },
  { brand:'Dead Air',           url:'https://deadairsilencers.com/news/',                          base:'https://deadairsilencers.com',      pat:/\/news\/.{5,}/i },
  // Optics
  { brand:'Holosun',            url:'https://www.holosun.com/news.html',                           base:'https://www.holosun.com',           pat:/holosun\.com\/.{10,}/i },
  { brand:'Trijicon',           url:'https://www.trijicon.com/news/',                              base:'https://www.trijicon.com',          pat:/\/news\/.{5,}/i },
  { brand:'Vortex',             url:'https://www.vortexoptics.com/blog/',                          base:'https://www.vortexoptics.com',      pat:/\/blog\/.{5,}/i },

  // ── 2011 / COMPETITION PISTOLS ──────────────────────────────────────────────
  { brand:'Bul Armory',         url:'https://www.global.bularmory.com/blog',                       base:'https://www.global.bularmory.com',  pat:/\/blog\/.{5,}/i },
  { brand:'MAC',                url:'https://www.milarmamentcorp.com/news/',                       base:'https://www.milarmamentcorp.com',   pat:/\/news\/.{5,}/i },
  { brand:'Colt',               url:'https://www.colt.com/category/colt-news/',                    base:'https://www.colt.com',              pat:/\/colt-news\/.{5,}/i },

  // ── SHOTGUNS ─────────────────────────────────────────────────────────────────
  { brand:'Stoeger',            url:'https://www.stoegerindustries.com/news/',                     base:'https://www.stoegerindustries.com', pat:/\/news\/.{5,}/i },
  { brand:'TriStar Arms',       url:'https://tristararms.com/news/',                               base:'https://tristararms.com',           pat:/\/news\/.{5,}/i },
  { brand:'Hatsan USA',         url:'https://hatsan.com.tr/en/news',                               base:'https://hatsan.com.tr',             pat:/hatsan\.com\.tr\/en\/news\/.{5,}/i },
  { brand:'Weatherby',          url:'https://www.weatherby.com/blog/',                             base:'https://www.weatherby.com',         pat:/\/blog\/.{5,}/i },
  { brand:'Retay',              url:'https://retay.com/news/',                                     base:'https://retay.com',                 pat:/retay\.com\/news\/.{5,}/i },

  // ── SUPPRESSORS (EXPANDED) ────────────────────────────────────────────────────
  { brand:'Griffin Armament',   url:'https://griffinarmament.com/blog/',                           base:'https://griffinarmament.com',       pat:/griffinarmament\.com\/blog\/.{5,}/i },
  { brand:'Rugged Suppressors', url:'https://ruggedsuppressors.com/blog/',                         base:'https://ruggedsuppressors.com',     pat:/\/blog\/.{5,}/i },
  { brand:'AAC',                url:'https://advanced-armament.com/news/',                         base:'https://advanced-armament.com',     pat:/\/news\/.{5,}/i },
  { brand:'Gemtech',            url:'https://www.gemtech.com/blogs/news',                          base:'https://www.gemtech.com',           pat:/\/blogs\/news\/.{5,}/i },
  { brand:'Q LLC',              url:'https://www.theqcompany.com/blogs/news',                      base:'https://www.theqcompany.com',       pat:/\/blogs\/news\/.{5,}/i },
  { brand:'SureFire',           url:'https://www.surefire.com/blogs/news',                         base:'https://www.surefire.com',          pat:/\/blogs\/news\/.{5,}/i },
  { brand:'HUXWRX',             url:'https://huxwrx.com/blogs/news',                               base:'https://huxwrx.com',                pat:/\/blogs\/news\/.{5,}/i },

  // ── TURKISH BRANDS ────────────────────────────────────────────────────────────
  { brand:'SAR USA',            url:'https://www.sarusa.com/news/',                                base:'https://www.sarusa.com',            pat:/sarusa\.com\/news\/.{5,}/i },
  { brand:'Girsan',             url:'https://www.eaacorp.com/news/',                               base:'https://www.eaacorp.com',           pat:/eaacorp\.com\/(news|blog)\/.{5,}/i },
  { brand:'Tisas',              url:'https://sdsimports.com/blogs/news',                           base:'https://sdsimports.com',            pat:/\/blogs\/news\/.{5,}/i },

  // ── NORDIC PRECISION ──────────────────────────────────────────────────────────
  { brand:'Sako',               url:'https://www.sako.global/articles/press-release',              base:'https://www.sako.global',           pat:/sako\.global\/article\/.{5,}/i },
]

// ── LAYER 2: SCRAPE LISTING PAGE ─────────────────────────────────────────────
async function scrapeListingPage({ brand, url, base, pat }) {
  const results = []
  try {
    const html = await fetchHtml(url)
    // Extract <a href> + anchor text
    const re = /<a[^>]+href="([^"#?][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    const seen = new Set()
    let m
    while ((m = re.exec(html)) !== null) {
      let href = m[1].trim()
      if (href.startsWith('/')) href = base + href
      if (!href.startsWith('http')) continue
      if (!pat.test(href)) continue
      if (seen.has(href)) continue
      seen.add(href)

      const rawText = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      const title   = decodeHtmlEntities(rawText).slice(0, 200)
      if (title.length < 12) continue

      if (!passesKeywordGate(title, brand)) continue

      results.push({ title, link: href, brand, pubDate: null })
    }
    if (results.length) console.log(`[RELEASES v6] ${brand}: ${results.length} candidates`)
  } catch (e) {
    console.warn(`[RELEASES v6] ${brand} listing error: ${e.message}`)
  }
  return results
}

// Fusion Firearms custom scraper (no article pages — product names on category pages)
async function scrapeFusion() {
  const results = []
  for (const url of ['https://fusionfirearms.com/handguns/', 'https://fusionfirearms.com/videovault/']) {
    try {
      const html = await fetchHtml(url, 10000)
      const re   = /<(?:h[1-4]|a)[^>]*>([^<]{15,200})<\/(?:h[1-4]|a)>/gi
      let m
      while ((m = re.exec(html)) !== null) {
        const t = decodeHtmlEntities(m[1].trim())
        if (passesKeywordGate(t, 'fusion firearms 1911 pistol xp xf')) {
          results.push({ title: t, link: url, brand: 'Fusion Firearms', pubDate: null })
        }
      }
    } catch {}
    await sleep(400)
  }
  return results.slice(0, 4)
}

// ── IMAGE EXTRACTION ─────────────────────────────────────────────────────────
const BAD_IMG = /logo|icon|avatar|sprite|pixel|tracking|badge|button|spacer|favicon|placeholder|1x1|blank\.(gif|png)|\.svg$|googleusercontent|news\.google|gstatic\.com\/news/i

function extractMetaImage(html, pageUrl) {
  const pats = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]
  for (const p of pats) {
    const m = html.match(p)
    if (!m?.[1]) continue
    let u = m[1].trim()
    if (u.startsWith('//')) u = 'https:' + u
    if (u.startsWith('/') && pageUrl) { try { u = new URL(pageUrl).origin + u } catch {} }
    if (!BAD_IMG.test(u) && /\.(jpg|jpeg|png|webp)/i.test(u)) return u
  }
  return null
}

function extractLargestImg(html) {
  const re = /<img[^>]+src="(https?:\/\/[^"]{20,})"[^>]*>/gi
  let best = null, bestScore = -1, m
  while ((m = re.exec(html)) !== null) {
    const tag = m[0], src = m[1]
    if (BAD_IMG.test(src)) continue
    if (!/\.(jpg|jpeg|png|webp)/i.test(src)) continue
    const w = parseInt((tag.match(/width=["']?(\d+)/i)||[])[1] || '0', 10)
    const h = parseInt((tag.match(/height=["']?(\d+)/i)||[])[1] || '0', 10)
    // Only consider images declared ≥250px wide (filters thumbnails, icons)
    const score = (w >= 250 && h >= 150) ? w * h : (w >= 250) ? w * 300 : -1
    if (score > bestScore) { bestScore = score; best = src }
  }
  return best
}

// Bing Image Search — no API key required, scrapes HTML results
// Query: "{brand} {model} firearm" — returns first product photo
async function bingImageSearch(brand, model) {
  const query = encodeURIComponent(`${brand} ${model} firearm official`)
  const url   = `https://www.bing.com/images/search?q=${query}&qft=+filterui:imagesize-large&first=1`
  try {
    const html = await fetchHtml(url, 10000)
    // Bing embeds image URLs in murl= params inside JSON-like data attrs
    const murlRe = /murl&quot;:&quot;(https?:\/\/[^&"]+\.(?:jpg|jpeg|png|webp)[^&"]*)/gi
    let m, candidates = []
    while ((m = murlRe.exec(html)) !== null) {
      const u = decodeURIComponent(m[1].replace(/&amp;/g, '&'))
      if (!BAD_IMG.test(u)) candidates.push(u)
    }
    // Also try unencoded JSON format
    const jsonRe = /"murl":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
    while ((m = jsonRe.exec(html)) !== null) {
      const u = m[1]
      if (!BAD_IMG.test(u)) candidates.push(u)
    }
    if (candidates.length) {
      console.log(`[RELEASES v6] Bing fallback found ${candidates.length} candidates for "${brand} ${model}"`)
      return candidates[0]
    }
  } catch (e) {
    console.warn(`[RELEASES v6] Bing search error for "${brand} ${model}": ${e.message}`)
  }
  return null
}

// Full image waterfall: article page → bing fallback
async function resolveImage(articleUrl, articleHtml, brand, model) {
  // 1. og:image / twitter:image from article
  const meta = extractMetaImage(articleHtml, articleUrl)
  if (meta) return { url: meta, source: 'og' }

  // 2. Largest <img> from article body
  const largest = extractLargestImg(articleHtml)
  if (largest) return { url: largest, source: 'img' }

  // 3. Bing image search fallback using brand + model
  if (brand && model) {
    const bing = await bingImageSearch(brand, model)
    if (bing) return { url: bing, source: 'bing' }
  }

  return null
}

// ── UPLOAD IMAGE → SANITY CDN ─────────────────────────────────────────────────
async function uploadToSanity(imageUrl) {
  if (!imageUrl || !process.env.SANITY_API_TOKEN) return null
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const ct     = res.headers.get('content-type') || 'image/jpeg'
    if (!ct.startsWith('image/')) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 5000) return null // reject tiny files (icons, pixels)
    const up = await sanity.assets.upload('image', buffer, {
      contentType: ct,
      filename: `release-${Date.now()}.jpg`,
    })
    return up._id
  } catch { return null }
}

// ── LAYER 3: REDIS + SANITY DEDUP ────────────────────────────────────────────
// Redis: O(1) set membership, 90-day TTL — fast guard on every run
// Sanity: authoritative fallback if Redis misses (cold start, TTL expired)
let _redis = null
async function getRedis() {
  if (_redis) return _redis
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) return null
    const { Redis } = await import('@upstash/redis')
    _redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    return _redis
  } catch { return null }
}

// Dedup key: SHA-256(url) + SHA-256(brand::model) — both must be unseen
function dedupKey(val) {
  return 'dr:release:seen:' + crypto.createHash('sha256').update(val.toLowerCase()).digest('hex').slice(0, 16)
}

const _seenThisRun = new Set()

async function alreadySeen(url, brand, model) {
  const urlKey   = dedupKey(url)
  const modelKey = dedupKey(`${brand}::${model}`)

  // In-process guard (fastest)
  if (_seenThisRun.has(urlKey) || _seenThisRun.has(modelKey)) return true

  // Redis check
  const redis = await getRedis()
  if (redis) {
    try {
      const [u, bm] = await Promise.all([ redis.exists(urlKey), redis.exists(modelKey) ])
      if (u || bm) return true
    } catch {}
  }

  // Sanity fallback (authoritative)
  try {
    const [byUrl, byKey] = await Promise.all([
      sanity.fetch(`*[_type=="firearmRelease" && sourceUrl==$u][0]._id`, { u: url }),
      sanity.fetch(`*[_type=="firearmRelease" && brand==$b && model==$m][0]._id`, { b: brand, m: model }),
    ])
    if (byUrl || byKey) return true
  } catch {}

  return false
}

async function markSeen(url, brand, model) {
  const urlKey   = dedupKey(url)
  const modelKey = dedupKey(`${brand}::${model}`)
  _seenThisRun.add(urlKey)
  _seenThisRun.add(modelKey)
  const redis = await getRedis()
  if (redis) {
    try {
      await Promise.all([
        redis.set(urlKey,   '1', { ex: DEDUP_TTL }),
        redis.set(modelKey, '1', { ex: DEDUP_TTL }),
      ])
    } catch {}
  }
}

// ── LAYER 4: CLAUDE HAIKU VALIDATION + ARTICLE WRITER ────────────────────────
// Two-stage prompt:
//  a) Validate: is this genuinely a new firearm/suppressor/optic product launch?
//  b) If yes: extract structured specs and write a 700-word DownRange article

async function validateAndWrite(title, pageText, sourceUrl, brand) {
  const systemPrompt = `You are a senior editor at DownRange, America's firearms intelligence portal.
Your job is to: (1) determine if a source article is a genuine NEW product launch announcement, and if so,
(2) extract specifications and write an original DownRange article in the portal's voice.

DownRange voice: Direct, technical, no fluff. Written for serious gun owners — carriers, competitors, veterans.
Banned words: comprehensive, robust, leverage, seamlessly, empower, game-changer.`

  const userPrompt = `SOURCE ARTICLE:
Title: ${title}
Brand: ${brand}
URL: ${sourceUrl}
Content: ${pageText.slice(0, 3500)}

TASK:
Decide if this is a NEW PRODUCT LAUNCH for a firearm, suppressor, or optic.

A genuine launch: manufacturer announces a new model now shipping or available for order.
NOT a launch: company events, financial reports, sponsorships, editorial content, product reviews,
cleaning accessories, ammo-only announcements, holster releases, magazine promotions.

If NOT a launch, return: {"skip":true,"skip_reason":"<one sentence>"}

If IS a launch, return this exact JSON (no markdown, no fences):
{
  "skip": false,
  "title": "Sharp, specific headline: Brand + Model + defining feature. Example: 'Glock G19 Gen6 Ships with Factory Aimpoint COA — 9mm, Optic-Ready Out of Box'",
  "brand": "Official brand name",
  "model": "Model designation only (no brand prefix)",
  "category": "Pistol|Rifle|Shotgun|Revolver|Suppressor|Optic|Accessory",
  "caliber": "Primary caliber string, e.g. '9mm Luger' or null",
  "action": "e.g. 'Striker-Fired' or 'Bolt-Action' or null",
  "msrp": 0,
  "summary": "3 sentences max. What it is, what's new about it, who it's for. No filler.",
  "body": "700–900 word HTML article. Sections: <h2>What's New</h2> → <h2>Key Specs</h2> → <h2>Who It's For</h2> → <h2>Bottom Line</h2>. Original prose. Do not copy source text.",
  "specs": [{"label":"Caliber","value":"9mm Luger"},{"label":"Barrel Length","value":"4.02 in"}],
  "availableDate": "YYYY-MM-DD or null",
  "msrp": 0
}

Rules:
- msrp: number only, 0 if not stated
- specs: 3–8 items, only what is explicitly stated in source
- title must contain the model name and differ from source title
- body must be original — rewrite in DownRange's voice, do not paraphrase`

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
        max_tokens: 2500,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    })
    const data  = await res.json()
    const raw   = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const obj   = JSON.parse(clean)
    if (obj.skip) console.log(`[RELEASES v6] AI skip: "${title.slice(0, 55)}" — ${obj.skip_reason}`)
    return obj
  } catch (e) {
    console.error('[RELEASES v6] Claude error:', e.message)
    return null
  }
}

// ── FETCH ARTICLE PAGE ───────────────────────────────────────────────────────
async function fetchArticle(url) {
  try {
    const html = await fetchHtml(url, 14000)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)
    return { html, text }
  } catch {
    return { html: '', text: '' }
  }
}

// ── SAVE TO SANITY ────────────────────────────────────────────────────────────
async function saveRelease(extracted, sourceUrl, imageAssetId, imageUrl, pubDate) {
  const slug = extracted.title
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90)
  // Deterministic _id: hash of brand+model — idempotent createOrReplace
  const stableId = 'release-' + crypto
    .createHash('md5').update((extracted.brand + extracted.model).toLowerCase()).digest('hex').slice(0, 12)

  return sanity.createOrReplace({
    _id:             stableId,
    _type:           'firearmRelease',
    title:           extracted.title,
    slug:            { _type: 'slug', current: slug },
    brand:           extracted.brand,
    model:           extracted.model,
    category:        extracted.category,
    caliber:         extracted.caliber   || null,
    action:          extracted.action    || null,
    msrp:            extracted.msrp      || 0,
    summary:         extracted.summary,
    body:            extracted.body      || null,
    specs:           (extracted.specs || []).map(s => ({
      _type: 'object',
      _key:  s.label.toLowerCase().replace(/\s+/g, '-'),
      label: s.label,
      value: s.value,
    })),
    // Prefer Sanity CDN heroImage; fall back to hotlink imageUrl as last resort
    ...(imageAssetId
      ? { heroImage: { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } } }
      : {}),
    imageUrl:        (!imageAssetId && imageUrl) ? imageUrl : null,
    sourceUrl,
    availableDate:   extracted.availableDate || null,
    isJustDropped:   true,
    approved:        true,
    qualityReviewed: true,
    publishedAt:     pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
  })
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export async function runReleasesFeed() {
  const t0 = Date.now()
  console.log('[RELEASES v6] Starting...')
  _seenThisRun.clear()

  const stats = { done: 0, failed: 0, skipped: 0, noImage: 0, saved: [], errors: [] }

  // ── Step 1: Scrape all listing pages in parallel batches ──────────────────
  const raw = []
  raw.push(...(await scrapeFusion()))

  const BATCH = 7
  for (let i = 0; i < MFR_SOURCES.length; i += BATCH) {
    const batch   = MFR_SOURCES.slice(i, i + BATCH)
    const results = await Promise.allSettled(batch.map(s => scrapeListingPage(s)))
    results.forEach(r => { if (r.status === 'fulfilled') raw.push(...r.value) })
    await sleep(600)
  }

  // ── Step 2: Dedupe by URL within this run ─────────────────────────────────
  const linkSeen = new Set()
  const candidates = raw.filter(item => {
    if (!item.link || linkSeen.has(item.link)) return false
    linkSeen.add(item.link)
    return true
  })
  console.log(`[RELEASES v6] ${candidates.length} candidates after listing dedup`)

  // ── Step 3: Process each candidate ───────────────────────────────────────
  for (const item of candidates) {
    if (stats.done >= MAX_PER_RUN) break

    // Fetch article page
    const { html: articleHtml, text: articleText } = await fetchArticle(item.link)
    if (!articleText) { stats.skipped++; continue }

    // Layer 4: Claude validates + writes
    const extracted = await validateAndWrite(item.title, articleText, item.link, item.brand)
    if (!extracted || extracted.skip) { stats.skipped++; continue }

    // Layer 3: Dedup against Redis + Sanity
    if (await alreadySeen(item.link, extracted.brand, extracted.model)) {
      stats.skipped++
      console.log(`[RELEASES v6] Dupe: ${extracted.brand} ${extracted.model}`)
      continue
    }

    // Image waterfall
    const imgResult = await resolveImage(item.link, articleHtml, extracted.brand, extracted.model)
    let imageAssetId = null
    let hotlinkUrl   = null

    if (imgResult) {
      console.log(`[RELEASES v6] Image via ${imgResult.source}: ${imgResult.url.slice(0, 80)}`)
      imageAssetId = await uploadToSanity(imgResult.url)
      if (!imageAssetId) hotlinkUrl = imgResult.url // CDN upload failed, store URL as fallback
    } else {
      stats.noImage++
      console.warn(`[RELEASES v6] ⚠ No image found for ${extracted.brand} ${extracted.model}`)
    }

    // Save
    try {
      await saveRelease(extracted, item.link, imageAssetId, hotlinkUrl, item.pubDate)
      await markSeen(item.link, extracted.brand, extracted.model)
      stats.done++
      const img = imageAssetId ? '📷CDN' : hotlinkUrl ? '🔗link' : '⚠none'
      stats.saved.push(`${extracted.brand} ${extracted.model} [${img}]`)
      console.log(`[RELEASES v6] ✓ ${extracted.brand} — ${extracted.model} [${img}]`)
    } catch (e) {
      stats.failed++
      stats.errors.push(`${extracted.brand} ${extracted.model}: ${e.message}`)
      console.error(`[RELEASES v6] Save failed: ${e.message}`)
    }

    await sleep(RATE_MS)
  }

  const ms = Date.now() - t0
  const detail = `${stats.done} saved | ${stats.skipped} skipped | ${stats.failed} failed | ${stats.noImage} no-image | ${ms}ms`
  console.log(`[RELEASES v6] Done: ${detail}`)
  if (stats.saved.length)  console.log(`[RELEASES v6] Saved: ${stats.saved.join(' | ')}`)
  if (stats.errors.length) console.log(`[RELEASES v6] Errors: ${stats.errors.join(' | ')}`)

  await reportCronRun('releases', {
    status:  stats.failed > 0 && stats.done === 0 ? 'failed' : 'success',
    ms,
    details: detail,
  })

  return { ...stats, ms, candidates: candidates.length }
}
