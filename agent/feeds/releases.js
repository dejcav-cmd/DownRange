/**
 * DownRange Gun Releases Feed — v7
 *
 * Two-phase architecture to stay well under Vercel's 300s limit:
 *
 *   Phase 1 — scrape  (~60-90s)
 *     Scrape all 65 listing pages in parallel batches of 8.
 *     Keyword-filter candidate URLs. Push to Redis queue.
 *     Returns { queued: N }.
 *
 *   Phase 2 — process (~200s per batch of 6)
 *     Pop PROCESS_BATCH items from Redis queue.
 *     For each: fetch article → date check → Claude validate+write → image waterfall → save.
 *     Loops until queue empty OR wall-clock approaches 250s safety margin.
 *     Returns { done, remaining }.
 *
 * Regular cron (Mon+Thu 06:45 UTC) calls phase=scrape then phase=process.
 * Full backfill: phase=scrape?backfill=1 (no date cutoff) then repeated phase=process calls.
 *
 * Queue keys:
 *   dr:releases:queue    — regular (6-month window)
 *   dr:releases:backfill — backfill (no cutoff)
 *
 * Sources (65):
 *   Pistols:     Glock, SIG Sauer ×2, S&W, Springfield, Taurus, Beretta, Kimber,
 *                Walther, CZ-USA, CZ Firearms, HK USA, FN America, Ruger, Canik,
 *                Staccato, Shadow Systems, Wilson Combat, Nighthawk Custom
 *   2011/Comp:   Bul Armory, MAC, Colt
 *   Rifles:      Daniel Defense, Aero Precision, BCM, LWRC, Christensen Arms,
 *                Savage Arms, Mossberg, Winchester, Browning, Benelli USA,
 *                Maxim Defense, PSA, MPA, Tikka, Fusion Firearms
 *   Shotguns:    Stoeger, TriStar Arms, Hatsan USA, Weatherby, Retay
 *   Suppressors: SilencerCo, Dead Air, Griffin Armament, Rugged Suppressors,
 *                AAC, Gemtech, Q LLC, SureFire, HUXWRX, Liberty, YHM, TBAC
 *   Turkish:     SAR USA, Girsan (via EAA), Tisas (via SDS)
 *   Nordic:      Sako
 *   Optics:      Holosun, Trijicon, Vortex
 *   Competition: Jacob Grey, ZEV Technologies, Noveske, POF-USA, Kel-Tec
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

const PROCESS_BATCH   = 6            // articles processed per phase-2 batch
const RATE_MS         = 1200         // ms between article fetches
const DEDUP_TTL       = 90 * 24 * 3600          // Redis dedup key TTL: 90 days (seconds)
const QUEUE_TTL       = 48 * 3600               // queue item TTL: 48h (seconds)
const MAX_ARTICLE_AGE = 6 * 30 * 24 * 3600 * 1000  // 6-month cutoff (ms)
const WALL_CLOCK_SAFE = 250_000      // abort loop before Vercel 300s hard kill
const QUEUE_KEY       = 'dr:releases:queue'
const BACKFILL_KEY    = 'dr:releases:backfill'

// ── DATE EXTRACTION ───────────────────────────────────────────────────────────
// Tries to parse a publish date from article HTML or URL.
// Returns a Date object or null.
function extractDateFromHtml(html, articleUrl) {
  // 1. JSON-LD datePublished
  const ldMatch = html.match(/"datePublished"\s*:\s*"([^"]+)"/i)
  if (ldMatch?.[1]) { const d = new Date(ldMatch[1]); if (!isNaN(d)) return d }

  // 2. <meta> published time
  const metaPatterns = [
    /<meta[^>]+(?:property|name)=["'](?:article:published_time|pubdate|date|publishdate)["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:article:published_time|pubdate|date|publishdate)["']/i,
  ]
  for (const p of metaPatterns) {
    const m = html.match(p)
    if (m?.[1]) { const d = new Date(m[1]); if (!isNaN(d)) return d }
  }

  // 3. <time datetime="...">
  const timeMatch = html.match(/<time[^>]+datetime=["']([^"']+)["']/i)
  if (timeMatch?.[1]) { const d = new Date(timeMatch[1]); if (!isNaN(d)) return d }

  // 4. URL date pattern: /2025/01/15/ or /2025-01-15 or -jan-2025
  if (articleUrl) {
    const urlDate = articleUrl.match(/\/(20\d{2})[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])/)
    if (urlDate) {
      const d = new Date(`${urlDate[1]}-${urlDate[2].padStart(2,'0')}-${urlDate[3].padStart(2,'0')}`)
      if (!isNaN(d)) return d
    }
    // Year-month only: /2025/01/ or /2025-01
    const urlYM = articleUrl.match(/\/(20\d{2})[\/\-](0?[1-9]|1[0-2])[\/\-]/)
    if (urlYM) {
      const d = new Date(`${urlYM[1]}-${urlYM[2].padStart(2,'0')}-01`)
      if (!isNaN(d)) return d
    }
  }

  return null
}

function isTooOld(date) {
  if (!date || isNaN(date)) return false // no date = don't reject, let Claude decide
  return Date.now() - date.getTime() > MAX_ARTICLE_AGE
}

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

  // ── APPROVED ADDITIONS ───────────────────────────────────────────────────────
  { brand:'Jacob Grey',         url:'https://jacobgreyfirearms.com/blogs/news',                    base:'https://jacobgreyfirearms.com',     pat:/\/blogs\/news\/.{5,}/i },
  { brand:'ZEV Technologies',   url:'https://www.zevtech.com/blogs/news',                          base:'https://www.zevtech.com',           pat:/\/blogs\/news\/.{5,}/i },
  { brand:'Noveske',            url:'https://noveskerifleworks.com/blogs/news',                    base:'https://noveskerifleworks.com',     pat:/\/blogs\/news\/.{5,}/i },
  { brand:'POF-USA',            url:'https://pof-usa.com/blog',                                   base:'https://pof-usa.com',               pat:/pof-usa\.com\/blog\/.{5,}/i },
  { brand:'Kel-Tec',            url:'https://keltecweapons.com/news/',                            base:'https://keltecweapons.com',         pat:/\/news\/.{5,}/i },
  { brand:'Liberty Suppressors',url:'https://www.libertysuppressors.com/blog/',                   base:'https://www.libertysuppressors.com', pat:/\/blog\/.{5,}/i },
  { brand:'YHM',                url:'https://www.yhm.net/blogs/news',                             base:'https://www.yhm.net',               pat:/\/blogs\/news\/.{5,}/i },
  { brand:'TBAC',               url:'https://www.thunderbeastarms.com/blogs/news',                base:'https://www.thunderbeastarms.com',   pat:/\/blogs\/news\/.{5,}/i },
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
  // ── Step A: Haiku validates (cheap) ────────────────────────────────────────
  // Only asks: is this a real new product launch? Returns skip or a stub.
  // If text is too thin to validate, reject immediately — saves all AI cost.

  const cleanText = pageText.trim()
  if (cleanText.length < 400) {
    console.log(`[RELEASES v7] Too thin (${cleanText.length} chars): ${title.slice(0,55)}`)
    return { skip: true, skip_reason: 'insufficient source content' }
  }

  const validatePrompt = `You are a firearms editor. Determine if this is a genuine NEW PRODUCT LAUNCH.

Title: ${title}
Brand: ${brand}
URL: ${sourceUrl}
Content (first 1200 chars): ${cleanText.slice(0, 1200)}

Return ONLY one of:
- {"skip":true,"skip_reason":"<reason>"}  if NOT a new gun/suppressor/optic product launch
- {"skip":false,"category":"Pistol|Rifle|Shotgun|Revolver|Suppressor|Optic|Accessory","caliber":"9mm or null","msrp":0}  if IS a launch

A real launch: manufacturer announces a new model, shipping or available to order.
NOT a launch: events, financials, HR, editorial roundups, cleaning kits, holster-only, ammo tests, promos.`

  let validation
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:200,
        messages:[{ role:'user', content:validatePrompt }] }),
    })
    const raw = ((await res.json()).content?.[0]?.text || '{}').replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    validation = JSON.parse(raw)
  } catch (e) {
    console.error('[RELEASES v7] Validation error:', e.message)
    return null
  }

  if (validation.skip) {
    console.log(`[RELEASES v7] AI skip: "${title.slice(0,55)}" — ${validation.skip_reason}`)
    return validation
  }

  // ── Step B: Sonnet writes the article (quality) ───────────────────────────
  const systemPrompt = `You are the lead firearms editor at DownRange — America's no-BS firearms intelligence portal.

Your readers: serious gun owners. Active carriers. Competition shooters. Veterans. People who can tell a CZ Shadow from a P-10 at a glance, who know what a Marksman barrel is and why a pre-travel adjustment matters.

Your voice:
- Lead with what's actually new — the specific feature, innovation, or change that makes this release matter
- Technical but never academic. Use real terms (striker-fired, Cerakote, MIL-STD-1913, first-round pop) without defining them
- Honest about trade-offs. A budget pistol and a custom shop gun serve different buyers — say which
- No preamble. Never "In the world of firearms..." or "Smith & Wesson has announced..."
- Specific. "$679 MSRP" beats "aggressively priced." "8.5 oz suppressor" beats "lightweight."
- Short sentences. Active verbs. Zero filler.

BANNED: comprehensive, robust, leverage, seamlessly, empower, game-changer, innovative, cutting-edge, exciting, proud to announce, in today's market, look no further`

  const writePrompt = `PRODUCT LAUNCH:
Brand: ${brand}
Title: ${title}
Category: ${validation.category}
Caliber: ${validation.caliber || 'unknown'}
Source URL: ${sourceUrl}

FULL SOURCE CONTENT:
${cleanText.slice(0, 4000)}

Write a complete DownRange release article. Return ONLY valid JSON, no markdown fences:

{
  "skip": false,
  "title": "Punchy headline. Pattern: [Brand] [Model] [Specific Feature or Caliber] — [What Makes It Different]. Max 90 chars. E.g.: 'SIG P365-FUSE Ships in 9mm — Modular Grip Module Swaps In Under 30 Seconds'",
  "brand": "${brand}",
  "model": "Model name only, no brand prefix",
  "category": "${validation.category}",
  "caliber": "${validation.caliber || null}",
  "action": "e.g. Striker-Fired, Bolt-Action, or null",
  "msrp": 0,
  "summary": "2–3 tight sentences. Hit: what it is, the single most important spec or feature, who it's for. No 'The [model] is a...' opener. Example: 'Ruger's LC Carbine finally comes in 10mm — a 16-inch PCC that runs GLOCK mags and ships with a threaded barrel. At $729, it undercuts every competing option in the category by at least $150. Hunters and suppressor hosts are the obvious buyer.' Write at that level of specificity.",
  "body": "Write 900–1100 words of HTML. Structure:\n\n<h2>What Changed</h2>\n1–2 sharp paragraphs. Focus on the DELTA — what's new vs. what existed before, or why this model exists. If it's a first-gen product, explain the gap it fills. Be specific: new trigger geometry, new alloy, new mounting system, whatever. Mention real competitors if relevant.\n\n<h2>Specs That Matter</h2>\n1–2 paragraphs pulling the specs that actually affect how the gun performs or who can carry it. Frame them in context: a 24 oz carry pistol is lightweight, a 24 oz competition gun is heavy. Connect specs to real-world impact.\n\n<h2>In the Field</h2>\n1–2 paragraphs about how this thing actually works — carry, competition, hunting, home defense, whatever the use case is. Address practical questions: holster compatibility, suppressor-ready, optic footprint standards, magazine compatibility. This is where you earn reader trust by thinking about real use.\n\n<h2>The Call</h2>\n1 paragraph. Direct recommendation: who should buy this and why, who should pass and why. Name a specific competing option if one exists. Give a clear verdict, not a hedge.",
  "specs": [
    {"label": "Caliber", "value": "9mm Luger"},
    {"label": "Barrel Length", "value": "4.9 in"},
    {"label": "Overall Length", "value": "8.5 in"},
    {"label": "Weight", "value": "34.1 oz unloaded"},
    {"label": "Capacity", "value": "15+1"},
    {"label": "Action", "value": "SA, Striker-Fired"},
    {"label": "MSRP", "value": "$1,449"}
  ],
  "availableDate": "YYYY-MM-DD or null"
}

RULES:
- specs: list every spec stated in the source, 3–10 items, exact values only
- msrp: integer, 0 if not stated
- body: use the section structure above, HTML only, 900–1100 words — hit that range
- If the source is thin on specs, say so directly in the article: "FN hasn't released full specs yet"
- Do not invent specs. Do not paraphrase specs from sections you wrote yourself.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 4000,
        system:     systemPrompt,
        messages:   [{ role:'user', content:writePrompt }],
      }),
    })
    const data  = await res.json()
    const raw   = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    const obj   = JSON.parse(clean)
    // Merge validation fields
    obj.category = obj.category || validation.category
    obj.caliber  = obj.caliber  || validation.caliber
    if (!obj.msrp && validation.msrp) obj.msrp = validation.msrp
    return obj
  } catch (e) {
    console.error('[RELEASES v7] Write error:', e.message)
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
    const pubDate = extractDateFromHtml(html, url)
    return { html, text, pubDate }
  } catch {
    return { html: '', text: '', pubDate: null }
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

// ── REDIS QUEUE HELPERS ──────────────────────────────────────────────────────

async function queuePush(key, items) {
  const redis = await getRedis()
  if (!redis || !items.length) return 0
  // Push serialized items; each gets its own TTL via expireat-style
  const pipeline = redis.pipeline()
  for (const item of items) {
    pipeline.rpush(key, JSON.stringify(item))
  }
  pipeline.expire(key, QUEUE_TTL)
  await pipeline.exec()
  return items.length
}

async function queuePop(key, count) {
  const redis = await getRedis()
  if (!redis) return []
  const items = []
  for (let i = 0; i < count; i++) {
    const raw = await redis.lpop(key)
    if (!raw) break
    try { items.push(JSON.parse(raw)) } catch {}
  }
  return items
}

async function queueLen(key) {
  const redis = await getRedis()
  if (!redis) return 0
  return (await redis.llen(key)) || 0
}

async function queueClear(key) {
  const redis = await getRedis()
  if (!redis) return
  await redis.del(key)
}

// ── PHASE 1: SCRAPE — collect candidates, push to Redis queue ────────────────
// Runs in ~60-90s. Scrapes all 65 listing pages, keyword-gates titles,
// pushes candidate {title, link, brand, pubDate} objects to the queue.
// backfill=true skips the 6-month date window check at process time.

export async function scrapeReleases({ backfill = false } = {}) {
  const t0   = Date.now()
  const qKey = backfill ? BACKFILL_KEY : QUEUE_KEY
  console.log(`[RELEASES v7] Phase 1 — scrape (backfill=${backfill})`)

  // Clear stale queue from a previous incomplete run
  await queueClear(qKey)

  const raw = []
  raw.push(...(await scrapeFusion()))

  const BATCH = 8
  for (let i = 0; i < MFR_SOURCES.length; i += BATCH) {
    const batch   = MFR_SOURCES.slice(i, i + BATCH)
    const results = await Promise.allSettled(batch.map(s => scrapeListingPage(s)))
    results.forEach(r => { if (r.status === 'fulfilled') raw.push(...r.value) })
    await sleep(500)
  }

  // Dedupe by URL within this scrape
  const linkSeen = new Set()
  const candidates = raw.filter(item => {
    if (!item.link || linkSeen.has(item.link)) return false
    linkSeen.add(item.link)
    return true
  })

  const queued = await queuePush(qKey, candidates)
  const ms = Date.now() - t0
  console.log(`[RELEASES v7] Scraped ${candidates.length} candidates → queued ${queued} (${ms}ms)`)
  return { phase: 'scrape', queued, ms, backfill }
}

// ── PHASE 2: PROCESS — dequeue and fully process each candidate ──────────────
// Pops PROCESS_BATCH items per inner loop, keeps looping until queue is empty
// OR wall-clock approaches WALL_CLOCK_SAFE (250s), whichever comes first.
// Safe to call multiple times — Redis queue persists across invocations.

export async function processReleases({ backfill = false } = {}) {
  const t0   = Date.now()
  const qKey = backfill ? BACKFILL_KEY : QUEUE_KEY
  console.log(`[RELEASES v7] Phase 2 — process (backfill=${backfill})`)
  _seenThisRun.clear()

  const stats = { done: 0, failed: 0, skipped: 0, noImage: 0, saved: [], errors: [] }
  let remaining = await queueLen(qKey)
  console.log(`[RELEASES v7] Queue depth: ${remaining}`)

  // Keep processing batches until queue empty or wall-clock approaches limit
  outerLoop: while (remaining > 0 && (Date.now() - t0) < WALL_CLOCK_SAFE) {
    const batch = await queuePop(qKey, PROCESS_BATCH)
    if (!batch.length) break

    for (const item of batch) {
      // Bail out if we're approaching the time limit
      if ((Date.now() - t0) >= WALL_CLOCK_SAFE) {
        // Re-queue unprocessed item so it isn't lost
        await queuePush(qKey, [item])
        console.log(`[RELEASES v7] ⏱ Wall-clock limit — re-queued remaining items`)
        break outerLoop
      }

      // Fetch article page
      const { html: articleHtml, text: articleText, pubDate: articleDate } = await fetchArticle(item.link)
      if (!articleText) { stats.skipped++; continue }

      // 6-month cutoff (skipped in backfill mode)
      if (!backfill && isTooOld(articleDate)) {
        stats.skipped++
        console.log(`[RELEASES v7] Too old (${articleDate?.toISOString().slice(0,10)}): ${item.title.slice(0,55)}`)
        continue
      }

      // Claude: validate it's a real product launch + write article
      const extracted = await validateAndWrite(item.title, articleText, item.link, item.brand)
      if (!extracted || extracted.skip) { stats.skipped++; continue }

      // Dedup against Redis seen-set + Sanity
      if (await alreadySeen(item.link, extracted.brand, extracted.model)) {
        stats.skipped++
        console.log(`[RELEASES v7] Dupe: ${extracted.brand} ${extracted.model}`)
        continue
      }

      // Image waterfall: og:image → twitter:image → largest img → Bing fallback
      const imgResult = await resolveImage(item.link, articleHtml, extracted.brand, extracted.model)
      let imageAssetId = null
      let hotlinkUrl   = null

      if (imgResult) {
        console.log(`[RELEASES v7] Image via ${imgResult.source}: ${imgResult.url.slice(0, 70)}`)
        imageAssetId = await uploadToSanity(imgResult.url)
        if (!imageAssetId) hotlinkUrl = imgResult.url
      } else {
        stats.noImage++
        console.warn(`[RELEASES v7] ⚠ No image: ${extracted.brand} ${extracted.model}`)
      }

      // Save to Sanity
      try {
        await saveRelease(extracted, item.link, imageAssetId, hotlinkUrl, articleDate || item.pubDate)
        await markSeen(item.link, extracted.brand, extracted.model)
        stats.done++
        const img = imageAssetId ? '📷CDN' : hotlinkUrl ? '🔗link' : '⚠none'
        stats.saved.push(`${extracted.brand} ${extracted.model} [${img}]`)
        console.log(`[RELEASES v7] ✓ ${extracted.brand} — ${extracted.model} [${img}]`)
      } catch (e) {
        stats.failed++
        stats.errors.push(`${extracted.brand} ${extracted.model}: ${e.message}`)
        console.error(`[RELEASES v7] Save failed: ${e.message}`)
      }

      await sleep(RATE_MS)
    }

    remaining = await queueLen(qKey)
    console.log(`[RELEASES v7] Queue remaining: ${remaining}`)
  }

  const ms     = Date.now() - t0
  remaining    = await queueLen(qKey)
  const detail = `${stats.done} saved | ${stats.skipped} skipped | ${stats.failed} failed | ${stats.noImage} no-image | ${remaining} still queued | ${ms}ms`
  console.log(`[RELEASES v7] Done: ${detail}`)
  if (stats.saved.length)  console.log(`[RELEASES v7] Saved: ${stats.saved.join(' | ')}`)
  if (stats.errors.length) console.log(`[RELEASES v7] Errors: ${stats.errors.join(' | ')}`)

  await reportCronRun('releases', {
    status:  stats.failed > 0 && stats.done === 0 ? 'failed' : 'success',
    ms,
    details: detail,
  })

  return { phase: 'process', ...stats, ms, remaining }
}

// ── BACKWARDS COMPAT: called by legacy agent route with no phase param ────────
export async function runReleasesFeed() {
  const scrapeResult = await scrapeReleases()
  const processResult = await processReleases()
  return { ...processResult, queued: scrapeResult.queued }
}
