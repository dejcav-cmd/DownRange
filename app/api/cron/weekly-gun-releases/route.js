export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import crypto from 'crypto'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── AUTH ──────────────────────────────────────────────────────────────────────
function isAuthorized(req) {
  const cron  = req.headers.get('x-vercel-cron')
  const auth  = req.headers.get('authorization')
  const admin = req.headers.get('x-admin-key')
  return cron === '1'
    || (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`)
    || admin === process.env.ADMIN_KEY
}

// ── MANUFACTURER SOURCES (from your curated list) ─────────────────────────────
const SOURCES = [
  { brand: 'Smith & Wesson',    url: 'https://www.smith-wesson.com/products/new',                         type: 'html' },
  { brand: 'Ruger',             url: 'https://ruger.com/micros/newProducts/',                              type: 'html' },
  { brand: 'SIG Sauer',         url: 'https://www.sigsauer.com/blog/category/company-news',               type: 'html' },
  { brand: 'Springfield Armory',url: 'https://www.springfield-armory.com/intel/press-releases/',          type: 'html' },
  { brand: 'Savage Arms',       url: 'https://savagearms.com/news',                                       type: 'html' },
  { brand: 'Mossberg',          url: 'https://www.mossberg.com/corporate/press-releases',                 type: 'html' },
  { brand: 'FN America',        url: 'https://fnamerica.com/press-releases/',                             type: 'html' },
  { brand: 'Benelli USA',       url: 'https://www.benelliusa.com/resources/press-releases',               type: 'html' },
  { brand: 'Browning',          url: 'https://www.browning.com/news/articles.html',                       type: 'html' },
  { brand: 'Palmetto State Armory', url: 'https://palmettostatearmory.com/blog/category/product-releases.html', type: 'html' },
  { brand: 'KelTec',            url: 'https://www.keltecweapons.com/blog/',                               type: 'html' },
  { brand: 'Winchester',        url: 'https://www.winchesterguns.com/news/articles.html',                 type: 'html' },
  { brand: 'Colt',              url: 'https://www.colt.com/category/colt-news/',                          type: 'html' },
  { brand: 'Glock',             url: 'https://us.glock.com/en/press-release',                             type: 'html' },
  { brand: 'CZ-USA',            url: 'https://cz-usa.com/',                                               type: 'html' },
  { brand: 'Daniel Defense',    url: 'https://danieldefense.com/blog/',                                   type: 'html' },
  { brand: 'Kimber',            url: 'https://www.kimberamerica.com/press',                               type: 'html' },
  { brand: 'Walther',           url: 'https://waltherarms.com/blog/',                                     type: 'html' },
  { brand: 'Beretta',           url: 'https://www.beretta.com/en-us/news',                                type: 'html' },
  { brand: 'Canik',             url: 'https://www.canikusa.com/news',                                     type: 'html' },
  { brand: 'Taurus',            url: 'https://www.taurususa.com/blog',                                    type: 'html' },
  { brand: 'Henry Repeating',   url: 'https://www.henryusa.com/news/',                                    type: 'html' },
  { brand: 'Weatherby',         url: 'https://weatherby.com/news/',                                       type: 'html' },
  { brand: 'Christensen Arms',  url: 'https://christensenarms.com/blog/',                                 type: 'html' },
  { brand: 'Bergara',           url: 'https://www.bergara.online/us/',                                    type: 'html' },
  { brand: 'Tikka',             url: 'https://choose.tikka.fi/usa/news',                                  type: 'html' },
  { brand: 'Sako',              url: 'https://www.sako.global/news',                                      type: 'html' },
  { brand: 'Staccato',          url: 'https://staccato2011.com/shop/new-arrivals',                        type: 'html' },
  { brand: 'Wilson Combat',     url: 'https://wilsoncombat.com/news/',                                    type: 'html' },
  { brand: 'Nighthawk Custom',  url: 'https://www.nighthawkcustom.com/news',                              type: 'html' },
  { brand: 'Shadow Systems',    url: 'https://shadowsystemscorp.com/category/press-release/',             type: 'html' },
  { brand: 'IWI US',            url: 'https://iwi.us/news/',                                              type: 'html' },
  { brand: 'LMT Defense',       url: 'https://lmtdefense.com/news/',                                      type: 'html' },
  { brand: 'Bravo Company',     url: 'https://bravocompanyusa.com/bcm-news/',                             type: 'html' },
  { brand: 'Aero Precision',    url: 'https://www.aeroprecisionusa.com/blog',                             type: 'html' },
  { brand: 'ZEV Technologies',  url: 'https://www.zevtechnologies.com/news',                              type: 'html' },
  { brand: 'Diamondback',       url: 'https://diamondbackfirearms.com/news/',                             type: 'html' },
  { brand: 'SCCY',              url: 'https://sccy.com/blogs/news',                                       type: 'html' },
  { brand: 'Standard Mfg',     url: 'https://stdgun.com/news/',                                           type: 'html' },
  { brand: 'Fusion Firearms',   url: 'https://fusionfirearms.com/videovault/category/announcements',      type: 'html' },
  { brand: 'MasterPiece Arms',  url: 'https://masterpiecearms.com/',                                      type: 'html' },
  // Supplemental: trusted gun media RSS (gun-specific only)
  { brand: null, url: 'https://www.thetruthaboutguns.com/feed/',   type: 'rss', label: 'TTAG'       },
  { brand: null, url: 'https://www.ammoland.com/feed/',            type: 'rss', label: 'AmmoLand'   },
  { brand: null, url: 'https://www.guns.com/feed',                 type: 'rss', label: 'Guns.com'   },
  { brand: null, url: 'https://www.gunsandammo.com/feed/',         type: 'rss', label: 'G&A'        },
  { brand: null, url: 'https://www.pewpewtactical.com/feed/',      type: 'rss', label: 'PPT'        },
  { brand: null, url: 'https://www.shootingillustrated.com/feed/', type: 'rss', label: 'SI'         },
  { brand: null, url: 'https://www.americanrifleman.org/feed/',    type: 'rss', label: 'AmRifleman' },
]

// ── INCLUDE: article MUST contain at least one of these ──────────────────────
const INCLUDE_KEYWORDS = [
  'new ', 'release', 'released', 'releases', 'new product', 'announces', 'announced',
  'introduces', 'introduced', 'launches', 'launched', 'now shipping', 'now available',
  'pre-order', 'available now', 'pistol', 'handgun', 'rifle', 'carbine',
  'shotgun', 'revolver', '1911', 'bolt-action', 'semi-auto', 'firearm', 'gun',
]

// ── EXCLUDE: articles containing ANY of these are dropped ────────────────────
const EXCLUDE_KEYWORDS = [
  // Apparel / merch (title-level only — these never appear in gun product titles)
  't-shirt', 'hoodie', 'apparel collection', 'hat drop',
  // Pure parts/kits (complete firearms always have a model name, not just "kit")
  'rifle kit', 'pistol kit', 'build kit', 'ar-15 kit', 'ak kit',
  'stripped lower', 'stripped upper', 'complete upper', 'complete lower',
  'lower parts kit', 'upper parts kit', 'brace kit', 'furniture kit',
  // Deals / sales
  'daily deal', 'flash deal', 'deal of the day', 'deal of the week',
  'blemished', ' blem-', 'sale ends', 'coupon code', 'promo code',
  'ammo deal', 'bulk ammo',
  // Non-gun junk
  'horoscope', 'astrology', 'zodiac', 'family feud', 'game show',
  'earnings report', 'quarterly results', 'fiscal year',
  'automobile', 'ford f-150', 'chevy', 'toyota',
  // NOTE: 'magazine', 'holster', 'recall', ' mag ', 'rail', 'handguard' intentionally
  // REMOVED — these words appear in virtually every legitimate gun product article
  // and cause massive false-positive exclusions. AI validates content instead.
]

// ── CATEGORY FALLBACK IMAGES (only used if OG fetch fails) ───────────────────
const CAT_IMGS = {
  Pistol:     '/img/photos/pistol.jpg',
  Revolver:   '/img/photos/pistol.jpg',
  Rifle:      '/img/photos/rifle.jpg',
  Shotgun:    '/img/photos/shotgun.jpg',
  Suppressor: '/img/photos/suppressor.jpg',
  default:    '/img/photos/pistol.jpg',
}

// ── FETCH PAGE (HTML or RSS) ──────────────────────────────────────────────────
async function fetchPage(url) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!r.ok) return null
    return await r.text()
  } catch { return null }
}

// ── PARSE RSS ─────────────────────────────────────────────────────────────────
function parseRSS(xml) {
  const items = []
  const rx = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m
  while ((m = rx.exec(xml)) !== null) {
    const b       = m[1]
    const title   = (b.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)         ||[])[1]?.trim() || ''
    const link    = (b.match(/<link[^>]*>([\s\S]*?)<\/link>/)                                       ||[])[1]?.trim()
                 || (b.match(/<guid[^>]*>(https?[^<]+)<\/guid>/)                                    ||[])[1]?.trim() || ''
    const desc    = (b.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ||[])[1]
                    ?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 600) || ''
    const pubDate = (b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)                                 ||[])[1]?.trim() || ''
    const encImg  = (b.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/i)                      ||[])[1] || null
    if (title && link) items.push({ title, link, desc, pubDate, encImg })
  }
  return items
}

// ── EXTRACT ARTICLE LINKS FROM MANUFACTURER HTML PAGES ───────────────────────
function extractLinksFromHTML(html, baseUrl) {
  const base = new URL(baseUrl)
  const links = new Set()
  // Match <a href="..."> tags
  const rx = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = rx.exec(html)) !== null) {
    const href    = m[1]?.trim()
    const text    = m[2]?.replace(/<[^>]+>/g, '').trim()
    if (!href || href.startsWith('#') || href.startsWith('javascript')) continue
    try {
      const abs = href.startsWith('http') ? href : new URL(href, base).href
      // Only same-domain links that look like articles
      if (abs.includes(base.hostname) && abs.length > baseUrl.length + 5) {
        // Skip PSA deal/sale URLs
        const skipUrlPatterns = ['/daily-deal', '/flash-deal', '/blem', '/sale/', '/ammo/', '/magazines/', '/accessories/']
        if (!skipUrlPatterns.some(p => abs.toLowerCase().includes(p))) {
          links.add(abs)
        }
      }
    } catch {}
  }
  return [...links].slice(0, 30)
}

// ── EXTRACT OG IMAGE FROM HTML ────────────────────────────────────────────────
function extractOgImage(html) {
  if (!html) return null
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]
  for (const rx of patterns) {
    const m = html.match(rx)
    if (m?.[1] && m[1].startsWith('http') && !m[1].includes('logo') && !m[1].includes('icon') && m[1].length > 20)
      return m[1]
  }
  return null
}

// ── SIGNAL CHECKS ─────────────────────────────────────────────────────────────
function hasIncludeSignal(text) {
  const t = text.toLowerCase()
  return INCLUDE_KEYWORDS.some(k => t.includes(k))
}
function hasExcludeSignal(text) {
  const t = text.toLowerCase()
  return EXCLUDE_KEYWORDS.some(k => t.includes(k))
}
function isValidArticle(title, desc) {
  const text = `${title} ${desc}`
  return hasIncludeSignal(text) && !hasExcludeSignal(text)
}

// ── AI: EXTRACT + WRITE ───────────────────────────────────────────────────────
async function extractAndWrite(title, pageText, sourceUrl, knownBrand) {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const prompt = `You are a DownRange firearms editor. Analyze this article and extract a NEW FIREARM PRODUCT if one is announced.

Article Title: ${title}
Source URL: ${sourceUrl}
${knownBrand ? `Known Manufacturer: ${knownBrand}` : ''}
Article Text: ${pageText.slice(0, 2000)}

STRICT RULES:
- Only extract if this announces a SPECIFIC new firearm product (pistol, rifle, shotgun, revolver)
- The "model" must be the ACTUAL product model name (e.g. "G19 Gen6", "P365 XMacro", "Mark V Backcountry")
- Do NOT extract: accessories, optics, suppressors, ammo, apparel, parts, training, events, financial news
- Do NOT extract: deals, sales, daily deals, blemished items, bundles, kits (rifle kit, pistol kit, build kit)
- Do NOT extract: stripped lowers, complete uppers, brace kits, furniture kits — these are parts not firearms
- Do NOT extract if you cannot confirm a COMPLETE, NAMED firearm model (e.g. "Glock 19 Gen5 MOS" is valid, "AR-15 Rifle Kit" is NOT)
- If not a new COMPLETE firearm product announcement: return {"skip": true}

Return ONLY valid JSON (no markdown, no preamble):
{
  "brand": "Exact manufacturer name",
  "model": "Exact model name/designation",
  "category": "Pistol|Rifle|Shotgun|Revolver",
  "caliber": "e.g. 9mm Luger, .308 Win, 12 Gauge, or null",
  "action": "e.g. Semi-Auto, Bolt-Action, Pump, Lever-Action, Revolver, or null",
  "msrp": 0,
  "summary": "3-4 sentences. Specific facts about this exact model: features, specs, who it is for. Direct voice, no fluff.",
  "body": "<h2>What Is It</h2><p>...</p><h2>Key Specs</h2><p>...</p><h2>Who Should Consider It</h2><p>...</p><h2>Bottom Line</h2><p>...</p>",
  "specs": [{"label": "Barrel Length", "value": "4.02 in"}, {"label": "Weight", "value": "25.5 oz"}, {"label": "Capacity", "value": "15+1"}],
  "skip": false
}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    })
    const data  = await res.json()
    const raw   = data.content?.[0]?.text || ''
    const clean = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    if (!clean || clean === '{"skip":true}' || clean.includes('"skip": true') || clean.includes('"skip":true')) return null
    const parsed = JSON.parse(clean)
    if (parsed.skip || !parsed.brand || !parsed.model) return null
    // Validate model name — must look like a real gun model
    if (parsed.model.split(' ').length > 8) return null  // too long = probably a headline
    if (/horoscope|today|june|attorney|lawsuit|congress|senate|ford|toyota/i.test(parsed.model)) return null
    return parsed
  } catch(e) {
    console.error('[RELEASES] AI error:', e.message)
    return null
  }
}

// ── DEDUP ─────────────────────────────────────────────────────────────────────
async function loadExistingKeys() {
  try {
    const docs = await sanity.fetch(`*[_type=="firearmRelease"]{ brand, model }`)
    return new Set(docs.map(d => `${d.brand}::${d.model}`.toLowerCase()))
  } catch { return new Set() }
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
async function saveRelease(extracted, sourceUrl, imageUrl, pubDate) {
  const slug = `${extracted.brand}-${extracted.model}`
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90)
  const _id = 'release-' + crypto.createHash('md5')
    .update(`${extracted.brand}::${extracted.model}`.toLowerCase()).digest('hex').slice(0, 12)

  return sanity.createOrReplace({
    _id, _type: 'firearmRelease',
    title:    `${extracted.brand} ${extracted.model}: ${extracted.summary?.split('.')[0] || 'New Release'}`.slice(0, 120),
    slug:     { _type: 'slug', current: slug },
    brand:    extracted.brand,
    model:    extracted.model,
    category: extracted.category || 'Pistol',
    caliber:  extracted.caliber  || null,
    action:   extracted.action   || null,
    msrp:     typeof extracted.msrp === 'number' ? extracted.msrp : 0,
    summary:  extracted.summary  || '',
    body:     extracted.body     || null,
    imageUrl: imageUrl || CAT_IMGS[extracted.category] || CAT_IMGS.default,
    specs:    (extracted.specs || []).map(s => ({
      _type: 'object',
      _key:  s.label.toLowerCase().replace(/\s+/g, '-'),
      label: s.label,
      value: s.value,
    })),
    sourceUrl,
    isJustDropped:   true,
    approved:        true,
    qualityReviewed: true,
    publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
  })
}

// ── PROCESS ONE SOURCE ────────────────────────────────────────────────────────
async function processSource(source, existingKeys, seenKeys, stats) {
  const html = await fetchPage(source.url)
  if (!html) {
    console.log(`[RELEASES] ${source.brand || source.label}: fetch failed`)
    return
  }

  let candidates = []

  if (source.type === 'rss') {
    // RSS: parse items directly
    const items = parseRSS(html)
    for (const item of items) {
      if (!isValidArticle(item.title, item.desc)) continue
      candidates.push({ title: item.title, url: item.link, desc: item.desc, pubDate: item.pubDate, encImg: item.encImg })
    }
    console.log(`[RELEASES] ${source.label}: ${candidates.length} candidates from ${items.length} RSS items`)
  } else {
    // HTML manufacturer page — trust all links (it's a gun manufacturer, not general news)
    const links = extractLinksFromHTML(html, source.url)
    const skipUrl = ['/about','/contact','/support','/faq','/cart','/account','/login',
      '/register','/terms','/privacy','/shipping','/careers','/dealers','/warranty']
    for (const link of links.slice(0, 20)) {
      if (skipUrl.some(s => link.toLowerCase().includes(s))) continue
      const slug = link.split('/').pop().replace(/-/g, ' ')
      candidates.push({ title: slug, url: link, desc: '', pubDate: '', encImg: null, brand: source.brand })
    }
    console.log(`[RELEASES] ${source.brand}: ${candidates.length} candidates from ${links.length} links`)
  }

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days

  for (const candidate of candidates.slice(0, 8)) {
    if (stats.created >= stats.maxCreate) return

    // Fetch the actual article page
    const articleHtml = await fetchPage(candidate.url)
    if (!articleHtml) continue

    const ogImage = extractOgImage(articleHtml)

    // Extract clean text
    const articleText = articleHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Title from OG if available
    const ogTitle = (articleHtml.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) || [])[1]
                 || (articleHtml.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]
                 || candidate.title

    const fullTitle = ogTitle.replace(/ ?[|\-–] .*$/, '').trim() // strip "| Site Name" suffix

    // For known manufacturer sources (brand set), only check excludes — trust the source
    // For RSS sources, require at least one include keyword
    const isKnownMfr = !!source.brand
    const hasExclude2 = EXCLUDE_KEYWORDS.some(k => (fullTitle + ' ' + articleText.slice(0,300)).toLowerCase().includes(k))
    const hasInclude2 = INCLUDE_KEYWORDS.some(k => (fullTitle + ' ' + articleText.slice(0,500)).toLowerCase().includes(k))
    if (hasExclude2 || (!isKnownMfr && !hasInclude2)) { stats.skipped++; continue }

    // AI extract + write
    const extracted = await extractAndWrite(fullTitle, articleText, candidate.url, candidate.brand || source.brand)
    if (!extracted) { stats.skipped++; await sleep(200); continue }

    const key = `${extracted.brand}::${extracted.model}`.toLowerCase()
    if (seenKeys.has(key) || existingKeys.has(key)) {
      stats.skipped++
      console.log(`[RELEASES] Dupe: ${extracted.brand} — ${extracted.model}`)
      continue
    }
    seenKeys.add(key)
    existingKeys.add(key)

    try {
      const pub = candidate.pubDate ? new Date(candidate.pubDate) : null
      const validPub = pub && pub > cutoff ? pub.toISOString() : new Date().toISOString()
      await saveRelease(extracted, candidate.url, ogImage, validPub)
      stats.created++
      stats.saved.push(`${extracted.brand} — ${extracted.model}`)
      console.log(`[RELEASES] ✓ SAVED: ${extracted.brand} — ${extracted.model} (${extracted.category})`)
    } catch(e) {
      stats.failed++
      stats.errors.push(`${extracted.brand} ${extracted.model}: ${e.message}`)
      console.error(`[RELEASES] Save failed: ${e.message}`)
    }

    await sleep(600) // rate limit between AI calls
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0  = Date.now()
  const stats = { created: 0, skipped: 0, failed: 0, maxCreate: 20, saved: [], errors: [] }
  const seenKeys = new Set()

  console.log(`[RELEASES] Starting — ${SOURCES.length} manufacturer sources`)
  console.log(`[RELEASES] ANTHROPIC_API_KEY: ${!!process.env.ANTHROPIC_API_KEY}`)

  // Batch dedup from Sanity
  const existingKeys = await loadExistingKeys()
  console.log(`[RELEASES] ${existingKeys.size} existing releases in Sanity`)

  // Process sources sequentially (respect rate limits)
  for (const source of SOURCES) {
    if (stats.created >= stats.maxCreate) break
    await processSource(source, existingKeys, seenKeys, stats)
    await sleep(500)
  }

  const ms      = Date.now() - t0
  const details = `created:${stats.created} skipped:${stats.skipped} failed:${stats.failed} (${ms}ms)`
    + (stats.saved.length ? ' | Saved: ' + stats.saved.join(', ') : ' | None saved')
    + (stats.errors.length ? ' | Errors: ' + stats.errors.slice(0, 3).join('; ') : '')

  console.log('[RELEASES] Done:', details)
  await reportCronRun('weekly-gun-releases', { status: 'success', ms, details }).catch(() => {})

  return Response.json({
    ok: true, created: stats.created, skipped: stats.skipped,
    failed: stats.failed, saved: stats.saved, errors: stats.errors, ms,
    message: details,
  })
}

export async function POST(req) { return GET(req) }
