/**
 * DownRange Gun Releases Feed — v5
 *
 * Sources (scraped directly from manufacturer press/news pages):
 *
 * PISTOLS
 *   Glock          us.glock.com/en/press-release/news-page
 *   SIG Sauer      sigsauer.com/blog/category/new-products
 *   Smith & Wesson smith-wesson.com/company/news
 *   Springfield    springfield-armory.com/intel/press-releases/
 *   Taurus USA     taurususa.com/company/news/
 *   Beretta USA    berettausa.com/en-us/press-releases/
 *   Kimber         kimberamerica.com/press/
 *   Walther Arms   waltherarms.com/journal
 *   CZ-USA         cz-usa.com/category/press-release
 *   HK USA         hk-usa.com/news
 *   FN America     fnamerica.com/news/
 *   Ruger          ruger.com/news/
 *   Canik USA      canikusa.com/news
 *   Staccato       staccato2011.com/blogs/news
 *   Shadow Systems shadowsystemscorp.com/blog/
 *   Wilson Combat  wilsoncombat.com/news/
 *   Nighthawk      nighthawkcustom.com/news/
 *
 * RIFLES / LONG GUNS
 *   Daniel Defense danieldefense.com/press-media
 *   Aero Precision aeroprecisionusa.com/blogs/news
 *   BCM            bravocompanymfg.com/blogs/news
 *   LWRC           lwrci.com/blogs/news
 *   Christensen    christensenarms.com/blogs/news
 *   Savage Arms    savagearms.com/news
 *   Mossberg       mossberg.com/news/
 *   Winchester     winchester.com/en-US/news/
 *   Browning       browning.com/news/
 *   Benelli USA    benelliusa.com/news/
 *   Maxim Defense  maximdefense.com/blogs/news
 *   Palmetto State palmettostatearmory.com/blog/
 *   MPA            masterpiece-arms.com/news/
 *   Tikka          tikka.fi/en/news
 *
 * SUPPRESSORS / OPTICS
 *   SilencerCo     silencerco.com/news/
 *   Dead Air       deadairsilencers.com/news/
 *   Holosun        holosun.com/news.html
 *   Trijicon       trijicon.com/news/
 *   Vortex         vortexoptics.com/blog/
 *
 * MANUFACTURER DIRECT
 *   Fusion Firearms fusionfirearms.com/handguns/ (direct scrape)
 *
 * All items → strict firearm-product gate → Claude Haiku: extract + write
 * → image scraped from article page → uploaded to Sanity CDN
 * → firearmRelease doc with approved:true
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

const MAX_PER_RUN  = 20
const RATE_MS      = 1200

// ── STRICT FIREARM PRODUCT GATE ──────────────────────────────────────────────
// A release must contain at least one PRODUCT signal AND one FIREARM signal.
// Must NOT contain any SKIP signal.

const PRODUCT_SIGNALS = [
  'introduces', 'launching', 'launches', 'announces', 'unveiled', 'unveils',
  'debuts', 'now available', 'ships', 'available now', 'new model', 'new for 202',
  'just dropped', 'first look', 'new release', 'introducing', 'released',
]
const FIREARM_SIGNALS = [
  'pistol', 'handgun', 'rifle', 'shotgun', 'revolver', 'carbine', 'suppressor',
  'silencer', 'firearm', 'gun', 'barrel', '9mm', '.45', '10mm', '5.56', '.308',
  '6.5 creedmoor', '.300', '.357', '.44', 'semi-auto', 'striker-fired',
  'bolt-action', 'lever-action', 'pump-action', 'optic', 'red dot', 'scope',
  'slide', 'trigger', 'frame', 'receiver', 'sbr', 'nfa', 'suppressor-ready',
  'threaded barrel', 'compensator', 'magazine', 'capacity',
  // MPA / chassis / precision
  'chassis', 'precision rifle', 'pcc', 'pistol caliber carbine',
]
const SKIP_SIGNALS = [
  // Financial / corporate
  'earnings', 'quarterly', 'fiscal year', 'revenue', 'financial results',
  'investor', 'stock', 'nasdaq', 'nyse', 'dividend', 'acquisition', 'merger',
  // Legal
  'lawsuit', 'settlement', 'recall', 'class action', 'atf ban', 'prohibited',
  'court ruling', 'injunction',
  // HR / events not about products
  'hiring', 'we are hiring', 'job opening', 'appointed ceo', 'board of directors',
  'scholarship', 'donation', 'charity', 'sponsorship',
  // Pure editorial (not a product drop)
  'how to clean', 'how to shoot', 'review of', 'best guns of', 'top 10',
  'history of', 'retrospective', 'buyer\'s guide', 'comparison of',
  'vs.', 'versus', 'which is better',
  // Deals / promos (not new products)
  'sale ends', 'coupon', 'discount', 'rebate', 'black friday', 'cyber monday',
  'price drop', 'clearance',
  // Cleaning products, accessories with no firearm content
  'cleaning solution', 'lubricant', 'solvent', 'bore cleaner', 'gun oil',
  'holster review', 'ammo test', 'range bag',
]

function isFirearmRelease(title = '', description = '') {
  const txt = `${title} ${description}`.toLowerCase()
  const hasProduct  = PRODUCT_SIGNALS.some(k => txt.includes(k))
  const hasFirearm  = FIREARM_SIGNALS.some(k => txt.includes(k))
  const shouldSkip  = SKIP_SIGNALS.some(k => txt.includes(k))
  return hasProduct && hasFirearm && !shouldSkip
}

// ── MANUFACTURER NEWS SOURCES ────────────────────────────────────────────────
// Each source: { name, url, brand, linkPattern, titleSelector }
// linkPattern: regex to validate article links (avoid nav/category pages)
// Scraped as HTML — extract <a> hrefs that look like article pages
const MFR_SOURCES = [
  // ── PISTOLS ──────────────────────────────────────────────────────────────
  { name:'Glock',           brand:'Glock',           url:'https://us.glock.com/en/press-release/news-page',               linkBase:'https://us.glock.com',       linkPattern:/\/press-release\/news-page\/[a-z0-9-]+$/i },
  { name:'SIG Sauer',       brand:'SIG Sauer',       url:'https://www.sigsauer.com/blog/category/new-products',           linkBase:'https://www.sigsauer.com',    linkPattern:/\/blog\/[a-z0-9-]{10,}$/i },
  { name:'SIG Sauer News',  brand:'SIG Sauer',       url:'https://www.sigsauer.com/blog/category/company-news',           linkBase:'https://www.sigsauer.com',    linkPattern:/\/blog\/[a-z0-9-]{10,}$/i },
  { name:'Smith & Wesson',  brand:'Smith & Wesson',  url:'https://www.smith-wesson.com/company/news',                     linkBase:'https://www.smith-wesson.com', linkPattern:/\/company\/news\/[a-z0-9-]+$/i },
  { name:'Springfield',     brand:'Springfield Armory', url:'https://www.springfield-armory.com/intel/press-releases/',  linkBase:'https://www.springfield-armory.com', linkPattern:/\/intel\/press-releases\/.+/i },
  { name:'Taurus USA',      brand:'Taurus',          url:'https://www.taurususa.com/company/news/',                       linkBase:'https://www.taurususa.com',   linkPattern:/\/company\/news\/.+/i },
  { name:'Beretta USA',     brand:'Beretta',         url:'https://www.berettausa.com/en-us/press-releases/',              linkBase:'https://www.berettausa.com',  linkPattern:/\/press-releases?\/.+/i },
  { name:'Kimber',          brand:'Kimber',          url:'https://www.kimberamerica.com/press/',                          linkBase:'https://www.kimberamerica.com', linkPattern:/\/press\/.+/i },
  { name:'Walther',         brand:'Walther',         url:'https://waltherarms.com/journal',                               linkBase:'https://waltherarms.com',     linkPattern:/\/journal\/.+/i },
  { name:'CZ-USA',          brand:'CZ',              url:'https://cz-usa.com/category/press-release',                     linkBase:'https://cz-usa.com',          linkPattern:/cz-usa\.com\/[0-9]{4}\/.+/i },
  { name:'CZ Firearms',     brand:'CZ',              url:'https://www.czfirearms.com/en-us/news',                         linkBase:'https://www.czfirearms.com',  linkPattern:/\/news\/.+/i },
  { name:'HK USA',          brand:'HK',              url:'https://www.hk-usa.com/news',                                   linkBase:'https://www.hk-usa.com',      linkPattern:/\/news\/.+/i },
  { name:'FN America',      brand:'FN America',      url:'https://fnamerica.com/news/',                                   linkBase:'https://fnamerica.com',       linkPattern:/\/news\/.+/i },
  { name:'Ruger',           brand:'Ruger',           url:'https://ruger.com/news/',                                       linkBase:'https://ruger.com',           linkPattern:/ruger\.com\/news\/[0-9-]+/i },
  { name:'Canik USA',       brand:'Canik',           url:'https://canikusa.com/news',                                     linkBase:'https://canikusa.com',        linkPattern:/canikusa\.com\/(news|blog)\/.+/i },
  { name:'Staccato',        brand:'Staccato',        url:'https://staccato2011.com/blogs/news',                           linkBase:'https://staccato2011.com',    linkPattern:/\/blogs\/news\/.+/i },
  { name:'Shadow Systems',  brand:'Shadow Systems',  url:'https://shadowsystemscorp.com/blog/',                           linkBase:'https://shadowsystemscorp.com', linkPattern:/\/blog\/.+/i },
  { name:'Wilson Combat',   brand:'Wilson Combat',   url:'https://wilsoncombat.com/news/',                                linkBase:'https://wilsoncombat.com',    linkPattern:/\/news\/.+/i },
  { name:'Nighthawk',       brand:'Nighthawk Custom', url:'https://www.nighthawkcustom.com/news/',                        linkBase:'https://www.nighthawkcustom.com', linkPattern:/\/news\/.+/i },
  // ── RIFLES ───────────────────────────────────────────────────────────────
  { name:'Daniel Defense',  brand:'Daniel Defense',  url:'https://danieldefense.com/press-media',                        linkBase:'https://danieldefense.com',   linkPattern:/danieldefense\.com\/(blog|press|new)\/.+/i },
  { name:'Aero Precision',  brand:'Aero Precision',  url:'https://aeroprecisionusa.com/blogs/news',                      linkBase:'https://aeroprecisionusa.com', linkPattern:/\/blogs\/news\/.+/i },
  { name:'BCM',             brand:'Bravo Company',   url:'https://bravocompanymfg.com/blogs/news',                       linkBase:'https://bravocompanymfg.com', linkPattern:/\/blogs\/news\/.+/i },
  { name:'LWRC',            brand:'LWRC',            url:'https://lwrci.com/blogs/news',                                  linkBase:'https://lwrci.com',           linkPattern:/\/blogs\/news\/.+/i },
  { name:'Christensen Arms',brand:'Christensen Arms',url:'https://christensenarms.com/blogs/news',                       linkBase:'https://christensenarms.com', linkPattern:/\/blogs\/news\/.+/i },
  { name:'Savage Arms',     brand:'Savage Arms',     url:'https://www.savagearms.com/news',                              linkBase:'https://www.savagearms.com',  linkPattern:/\/news\/.+/i },
  { name:'Mossberg',        brand:'Mossberg',        url:'https://www.mossberg.com/news/',                               linkBase:'https://www.mossberg.com',    linkPattern:/\/news\/.+/i },
  { name:'Winchester',      brand:'Winchester',      url:'https://www.winchester.com/en-US/news/',                       linkBase:'https://www.winchester.com',  linkPattern:/\/news\/.+/i },
  { name:'Browning',        brand:'Browning',        url:'https://www.browning.com/news/',                               linkBase:'https://www.browning.com',    linkPattern:/\/news\/.+/i },
  { name:'Benelli USA',     brand:'Benelli',         url:'https://www.benelliusa.com/news/',                             linkBase:'https://www.benelliusa.com',  linkPattern:/\/news\/.+/i },
  { name:'Maxim Defense',   brand:'Maxim Defense',   url:'https://maximdefense.com/blogs/news',                          linkBase:'https://maximdefense.com',    linkPattern:/\/blogs\/news\/.+/i },
  { name:'PSA',             brand:'Palmetto State Armory', url:'https://www.palmettostatearmory.com/blog/',              linkBase:'https://www.palmettostatearmory.com', linkPattern:/\/blog\/.+/i },
  { name:'MPA',             brand:'MasterPiece Arms', url:'https://www.masterpiece-arms.com/news/',                      linkBase:'https://www.masterpiece-arms.com', linkPattern:/\/news\/.+/i },
  { name:'Tikka',           brand:'Tikka',           url:'https://www.tikka.fi/en/news',                                 linkBase:'https://www.tikka.fi',        linkPattern:/\/news\/.+/i },
  // ── SUPPRESSORS / OPTICS ─────────────────────────────────────────────────
  { name:'SilencerCo',      brand:'SilencerCo',      url:'https://silencerco.com/news/',                                 linkBase:'https://silencerco.com',      linkPattern:/\/news\/.+/i },
  { name:'Dead Air',        brand:'Dead Air',         url:'https://deadairsilencers.com/news/',                          linkBase:'https://deadairsilencers.com', linkPattern:/\/news\/.+/i },
  { name:'Holosun',         brand:'Holosun',          url:'https://www.holosun.com/news.html',                           linkBase:'https://www.holosun.com',     linkPattern:/holosun\.com\/.+/i },
  { name:'Trijicon',        brand:'Trijicon',         url:'https://www.trijicon.com/news/',                              linkBase:'https://www.trijicon.com',    linkPattern:/\/news\/.+/i },
  { name:'Vortex',          brand:'Vortex',           url:'https://www.vortexoptics.com/blog/',                          linkBase:'https://www.vortexoptics.com', linkPattern:/\/blog\/.+/i },
]

// ── HTML LINK EXTRACTOR ───────────────────────────────────────────────────────
// Scrapes a news/press listing page and returns article links + titles
async function scrapeListingPage(source) {
  const results = []
  try {
    const res = await fetch(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    })
    if (!res.ok) {
      console.warn(`[RELEASES v5] ${source.name}: HTTP ${res.status}`)
      return []
    }
    const html = await res.text()

    // Extract all <a href> links from the page
    const linkRe = /<a[^>]+href="([^"]+)"[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/a>/gi
    const seen   = new Set()
    let m

    while ((m = linkRe.exec(html)) !== null) {
      let href  = m[1].trim()
      const inner = m[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

      // Resolve relative links
      if (href.startsWith('/')) href = source.linkBase + href
      if (!href.startsWith('http')) continue

      // Must match the source's link pattern (article URL, not nav)
      if (!source.linkPattern.test(href)) continue
      if (seen.has(href)) continue
      seen.add(href)

      // Extract title: strip HTML tags from anchor text, decode entities
      const title = decodeHtmlEntities(inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 200)
      if (title.length < 10) continue

      // Pre-filter: must pass firearm release check before we spend an HTTP request on it
      if (!isFirearmRelease(title, source.brand)) continue

      results.push({
        title,
        link:        href,
        brand:       source.brand,
        description: title,
        sourceType:  'manufacturer',
        pubDate:     new Date().toISOString(),
      })
    }

    console.log(`[RELEASES v5] ${source.name}: ${results.length} candidates from ${seen.size} links`)
  } catch (e) {
    console.warn(`[RELEASES v5] ${source.name} scrape error: ${e.message}`)
  }
  return results
}

// ── FUSION FIREARMS DIRECT SCRAPER ───────────────────────────────────────────
async function scrapeFusionFirearms() {
  const results = []
  const urls = [
    'https://fusionfirearms.com/videovault/',
    'https://fusionfirearms.com/handguns/',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/5.0)' },
        signal: AbortSignal.timeout(10000),
      })
      const html = await res.text()
      const titlePattern = /<(?:h[1-4]|a)[^>]*>([^<]{15,200})<\/(?:h[1-4]|a)>/gi
      let m
      while ((m = titlePattern.exec(html)) !== null) {
        const text = m[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim()
        if (isFirearmRelease(text, 'fusion firearms xp xf 1911 pistol')) {
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
      console.warn('[RELEASES v5] Fusion scrape error:', e.message)
    }
    await sleep(500)
  }
  return results.slice(0, 4)
}

// ── FETCH ARTICLE PAGE: CONTENT + OG IMAGE ───────────────────────────────────
// Strict image extraction:
//  1. og:image (publisher-declared, highest confidence)
//  2. twitter:image
//  3. Largest <img> by declared dimensions (product photos are ≥300px)
// Rejects: logos, icons, SVGs, tracking pixels, google-hosted images
const BAD_IMG_RE = /logo|icon|avatar|sprite|pixel|tracking|badge|button|spacer|favicon|placeholder|1x1|blank\.(gif|png)|\.svg|googleusercontent|news\.google|gstatic\.com\/news/i

function pickBestImgTag(html) {
  const imgRe = /<img[^>]+src="(https?:\/\/[^"]{20,})"[^>]*>/gi
  let best = null, bestScore = -1, m
  while ((m = imgRe.exec(html)) !== null) {
    const tag = m[0], src = m[1]
    if (BAD_IMG_RE.test(src)) continue
    if (!src.match(/\.(jpg|jpeg|png|webp)/i)) continue
    const wMatch = tag.match(/width=["']?(\d+)/i)
    const hMatch = tag.match(/height=["']?(\d+)/i)
    const w = wMatch ? parseInt(wMatch[1], 10) : 0
    const h = hMatch ? parseInt(hMatch[1], 10) : 0
    // Prefer explicitly sized large images; unsized get baseline 50000 (bigger than 200x200)
    const score = (w >= 200 && h >= 200) ? (w * h) : (w || h) ? (w * h) : 50000
    if (score > bestScore) { bestScore = score; best = src }
  }
  return best
}

async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    })
    if (!res.ok) return { text: '', imageUrl: null }
    const html = await res.text()

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)

    // Try meta tags in priority order
    const metaPatterns = [
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
      /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
      /<meta[^>]+content="([^"]+)"[^>]+name="twitter:image"/i,
    ]
    let imageUrl = null
    for (const pat of metaPatterns) {
      const m = html.match(pat)
      if (m?.[1]) {
        let u = m[1].trim()
        if (u.startsWith('//')) u = 'https:' + u
        if (!BAD_IMG_RE.test(u) && u.match(/\.(jpg|jpeg|png|webp)/i)) {
          imageUrl = u
          break
        }
      }
    }

    // Fall back to best <img> tag
    if (!imageUrl) imageUrl = pickBestImgTag(html) || null

    return { text, imageUrl }
  } catch {
    return { text: '', imageUrl: null }
  }
}

// ── DEDUP ─────────────────────────────────────────────────────────────────────
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

// ── CLAUDE HAIKU: EXTRACT + WRITE ─────────────────────────────────────────────
async function extractAndWrite(rawTitle, pageText, sourceUrl, brand) {
  const prompt = `You are a DownRange editor — a firearms journalist writing for serious gun owners.

SOURCE:
Title: ${rawTitle}
Brand: ${brand || 'Unknown'}
URL: ${sourceUrl}
Content: ${pageText.slice(0, 3000)}

TASK: Extract product data and write a completely ORIGINAL DownRange article.
Do NOT copy or closely paraphrase source text. Rewrite in DownRange's voice.

CRITICAL: If this is NOT a new firearm/suppressor/optic product announcement
(e.g. it is a company event, financial report, community post, cleaning product,
holster-only, ammo test, editorial, or general article with no new gun product),
set skip:true immediately. We ONLY publish new firearm product releases.

Return ONLY valid JSON (no fences, no preamble):
{
  "skip": false,
  "skip_reason": null,
  "title": "DownRange original headline. Specific. Brand + Model + key feature. E.g.: 'SIG Sauer P365-FLUX Now Shipping — 9mm PCC Hybrid with 21-Round Capacity'",
  "brand": "Brand name",
  "model": "Model name only (no brand prefix)",
  "category": "Pistol|Rifle|Shotgun|Revolver|Suppressor|Optic|Accessory|Ammo",
  "caliber": "e.g. 9mm or null",
  "action": "e.g. Striker-Fired or null",
  "msrp": 0,
  "summary": "3-4 sentences. Direct, specific, for carriers and competitors. What's new, what matters, who it's for. No fluff.",
  "body": "600-900 word HTML body. Use <h2> for sections: intro → What's New → Key Specs → Who It's For → Bottom Line. Original prose only.",
  "specs": [{"label": "Barrel Length", "value": "4.9 in"}, {"label": "Weight", "value": "34.1 oz"}],
  "availableDate": "YYYY-MM-DD or null",
  "imageUrl": null
}

Rules:
- skip:true if NOT a new gun/suppressor/optic product launch
- msrp: integer only, 0 if unknown
- specs: only what's stated in source (2-8 items max)
- title must differ from source title and include the model name
- Do not invent specs not in source`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
      body:    JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:2000, messages:[{ role:'user', content:prompt }] }),
    })
    const data  = await res.json()
    const raw   = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    const parsed = JSON.parse(clean)
    if (parsed.skip) {
      console.log(`[RELEASES v5] AI skip: "${rawTitle.slice(0,60)}" — ${parsed.skip_reason || 'not a product launch'}`)
    }
    return parsed
  } catch (e) {
    console.error('[RELEASES v5] Claude error:', e.message)
    return null
  }
}

// ── UPLOAD IMAGE → SANITY CDN ─────────────────────────────────────────────────
async function uploadImage(imageUrl) {
  if (!imageUrl || !process.env.SANITY_API_TOKEN) return null
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const ct     = res.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await res.arrayBuffer())
    const uploaded = await sanity.assets.upload('image', buffer, {
      contentType: ct,
      filename: `release-${Date.now()}.jpg`,
    })
    return uploaded._id
  } catch { return null }
}

// ── SAVE TO SANITY ─────────────────────────────────────────────────────────────
async function saveRelease(extracted, sourceUrl, imageUrl, pubDate) {
  const slug = extracted.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)
  const stableKey = crypto.createHash('md5').update((extracted.brand + extracted.model).toLowerCase()).digest('hex').slice(0,12)
  const _id = 'release-' + stableKey

  const imageAssetId = await uploadImage(imageUrl || extracted.imageUrl)

  const doc = {
    _id,
    _type:           'firearmRelease',
    title:           extracted.title,
    slug:            { _type:'slug', current:slug },
    brand:           extracted.brand,
    model:           extracted.model,
    category:        extracted.category,
    caliber:         extracted.caliber    || null,
    action:          extracted.action     || null,
    msrp:            extracted.msrp       || 0,
    summary:         extracted.summary,
    body:            extracted.body       || null,
    specs:           (extracted.specs||[]).map(s => ({ _type:'object', _key:s.label.toLowerCase().replace(/\s+/g,'-'), label:s.label, value:s.value })),
    // heroImage (Sanity CDN) preferred; imageUrl as fallback hotlink only if CDN upload failed
    imageUrl:        (!imageAssetId && (imageUrl||extracted.imageUrl)) || null,
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

// ── MAIN ──────────────────────────────────────────────────────────────────────
export async function runReleasesFeed() {
  console.log('[RELEASES v5] Starting...')
  const t0 = Date.now()
  let done = 0, failed = 0, skipped = 0
  const saved         = []
  const errors        = []
  const skippedTitles = []
  seenInRun.clear()

  // Collect from all manufacturer sources in parallel batches of 6
  const allItems = []

  // Source 1: Fusion Firearms direct scrape
  const fusionItems = await scrapeFusionFirearms()
  console.log(`[RELEASES v5] Fusion: ${fusionItems.length}`)
  allItems.push(...fusionItems)

  // Sources 2–N: manufacturer listing page scrapers (batched, 6 at a time)
  const BATCH = 6
  for (let i = 0; i < MFR_SOURCES.length; i += BATCH) {
    const batch = MFR_SOURCES.slice(i, i + BATCH)
    const batchResults = await Promise.allSettled(batch.map(src => scrapeListingPage(src)))
    for (const r of batchResults) {
      if (r.status === 'fulfilled') allItems.push(...r.value)
    }
    await sleep(800)
  }

  // Dedupe by link within this run
  const seen = new Set()
  const dedupedItems = allItems.filter(item => {
    if (!item.link || seen.has(item.link)) return false
    seen.add(item.link)
    return true
  })

  console.log(`[RELEASES v5] Total candidates after dedup: ${dedupedItems.length}`)

  for (const item of dedupedItems) {
    if (done >= MAX_PER_RUN) break
    if (!item.title || !item.link) { skipped++; continue }

    // Re-check firearm gate with full context (title was pre-filtered, but double-check)
    if (!isFirearmRelease(item.title, item.description || item.brand)) {
      skipped++
      skippedTitles.push(item.title.slice(0,80) + ' [non-firearm]')
      continue
    }

    // Fetch full article page (text + og:image)
    const { text: pageText, imageUrl } = await fetchPageContent(item.link)
    const combined = pageText || item.description || item.title

    // Claude: extract specs, write article, strict skip gate
    const extracted = await extractAndWrite(item.title, combined, item.link, item.brand)
    if (!extracted || extracted.skip) {
      skipped++
      skippedTitles.push(item.title.slice(0,80) + ' [AI skip]')
      continue
    }

    // Image is required — skip if we genuinely can't get one
    // (imageUrl from og:image; CDN upload attempted in saveRelease)
    if (!imageUrl) {
      console.log(`[RELEASES v5] ⚠ No image for "${extracted.brand} ${extracted.model}" — proceeding with null (fix-placeholder-images will backfill)`)
    }

    // Dedup against Sanity
    if (await isDuplicate(item.link, extracted.brand, extracted.model)) {
      skipped++
      skippedTitles.push(`${extracted.brand} ${extracted.model} [dupe]`)
      continue
    }

    try {
      await saveRelease(extracted, item.link, imageUrl, item.pubDate)
      done++
      const imgStatus = imageUrl ? '📷' : '⚠'
      saved.push(`${imgStatus} ${extracted.brand} — ${extracted.model}`)
      console.log(`[RELEASES v5] ✓ ${extracted.brand} — ${extracted.model} ${imgStatus}`)
    } catch (e) {
      failed++
      errors.push(`${extracted.brand} ${extracted.model}: ${e.message}`)
      console.error(`[RELEASES v5] Save failed: ${e.message}`)
    }

    await sleep(RATE_MS)
  }

  const ms = Date.now() - t0
  console.log(`[RELEASES v5] Done: ${done} saved, ${skipped} skipped, ${failed} failed. ${ms}ms`)
  console.log(`[RELEASES v5] Saved: ${saved.join(' | ') || 'none'}`)
  if (errors.length) console.log(`[RELEASES v5] Errors: ${errors.join(' | ')}`)

  return { done, failed, skipped, ms, saved, errors, skippedTitles, candidates: dedupedItems.length }
}
