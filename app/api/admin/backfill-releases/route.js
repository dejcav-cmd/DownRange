export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import crypto from 'crypto'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── SOURCES ───────────────────────────────────────────────────────────────────
const SOURCES = [
  { brand: 'Smith & Wesson',     url: 'https://www.smith-wesson.com/products/new' },
  { brand: 'Ruger',              url: 'https://ruger.com/micros/newProducts/' },
  { brand: 'SIG Sauer',         url: 'https://www.sigsauer.com/blog/category/company-news' },
  { brand: 'Springfield Armory', url: 'https://www.springfield-armory.com/intel/press-releases/' },
  { brand: 'Savage Arms',        url: 'https://savagearms.com/news' },
  { brand: 'Mossberg',           url: 'https://www.mossberg.com/corporate/press-releases' },
  { brand: 'FN America',         url: 'https://fnamerica.com/press-releases/' },
  { brand: 'Benelli USA',        url: 'https://www.benelliusa.com/resources/press-releases' },
  { brand: 'Browning',           url: 'https://www.browning.com/news/articles.html' },
  { brand: 'Palmetto State Armory', url: 'https://palmettostatearmory.com/blog/category/product-releases.html' },
  { brand: 'KelTec',             url: 'https://www.keltecweapons.com/blog/' },
  { brand: 'Winchester',         url: 'https://www.winchesterguns.com/news/articles.html' },
  { brand: 'Colt',               url: 'https://www.colt.com/category/colt-news/' },
  { brand: 'Glock',              url: 'https://us.glock.com/en/press-release' },
  { brand: 'CZ-USA',             url: 'https://cz-usa.com/' },
  { brand: 'Daniel Defense',     url: 'https://danieldefense.com/blog/' },
  { brand: 'Kimber',             url: 'https://www.kimberamerica.com/press' },
  { brand: 'Walther',            url: 'https://waltherarms.com/blog/' },
  { brand: 'Beretta',            url: 'https://www.beretta.com/en-us/news' },
  { brand: 'Canik',              url: 'https://www.canikusa.com/news' },
  { brand: 'Taurus',             url: 'https://www.taurususa.com/blog' },
  { brand: 'Henry Repeating',    url: 'https://www.henryusa.com/news/' },
  { brand: 'Weatherby',          url: 'https://weatherby.com/news/' },
  { brand: 'Christensen Arms',   url: 'https://christensenarms.com/blog/' },
  { brand: 'Staccato',           url: 'https://staccato2011.com/shop/new-arrivals' },
  { brand: 'Wilson Combat',      url: 'https://wilsoncombat.com/news/' },
  { brand: 'Shadow Systems',     url: 'https://shadowsystemscorp.com/category/press-release/' },
  { brand: 'IWI US',             url: 'https://iwi.us/news/' },
  { brand: 'Aero Precision',     url: 'https://www.aeroprecisionusa.com/blog' },
  { brand: 'Fusion Firearms',    url: 'https://fusionfirearms.com/videovault/category/announcements' },
  { brand: null, rss: true, label: 'TTAG',        url: 'https://www.thetruthaboutguns.com/feed/' },
  { brand: null, rss: true, label: 'AmmoLand',    url: 'https://www.ammoland.com/feed/' },
  { brand: null, rss: true, label: 'Guns.com',    url: 'https://www.guns.com/feed' },
  { brand: null, rss: true, label: 'G&A',         url: 'https://www.gunsandammo.com/feed/' },
  { brand: null, rss: true, label: 'AmRifleman',  url: 'https://www.americanrifleman.org/feed/' },
]

// ── FILTERS ───────────────────────────────────────────────────────────────────
const INCLUDE_KW = ['new ','release','releases','introduces','announces','launches','launched',
  'now available','now shipping','pistol','rifle','shotgun','revolver','firearm','handgun','1911',
  'carbine','semi-auto','bolt-action','pump-action']
const EXCLUDE_KW = ['daily deal','flash deal','blem ','blemished','sale price','sale ends',
  'rifle kit','pistol kit','build kit','ar-15 kit','stripped lower','complete upper','brace kit',
  'parts kit','apparel','t-shirt','holster','magazine',' mag ','coupon','horoscope',
  'astrology','zodiac','lawsuit','recall ','earnings','quarterly']
const SKIP_URLS  = ['/about','/contact','/support','/faq','/cart','/account','/login',
  '/register','/terms','/privacy','/shipping','/careers','/dealers','/warranty','/catalog']

const CAT_IMGS = {
  Pistol:     '/img/photos/pistol.jpg',
  Revolver:   '/img/photos/pistol.jpg',
  Rifle:      '/img/photos/rifle.jpg',
  Shotgun:    '/img/photos/shotgun.jpg',
  Suppressor: '/img/photos/suppressor.jpg',
  default:    '/img/photos/pistol.jpg',
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function hasExclude(text) { return EXCLUDE_KW.some(k => text.toLowerCase().includes(k)) }
function hasInclude(text) { return INCLUDE_KW.some(k => text.toLowerCase().includes(k)) }

async function fetchPage(url) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(12000), redirect: 'follow',
    })
    if (!r.ok) return null
    return await r.text()
  } catch { return null }
}

function parseRSS(xml) {
  const items = []; const rx = /<item[^>]*>([\s\S]*?)<\/item>/gi; let m
  while ((m = rx.exec(xml)) !== null) {
    const b = m[1]
    const title   = (b.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)    ||[])[1]?.trim()||''
    const link    = (b.match(/<link[^>]*>([\s\S]*?)<\/link>/)                                  ||[])[1]?.trim()
                 || (b.match(/<guid[^>]*>(https?[^<]+)<\/guid>/)                               ||[])[1]?.trim()||''
    const desc    = (b.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ||[])[1]
                   ?.replace(/<[^>]+>/g,'').trim().slice(0,500)||''
    const pubDate = (b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)                            ||[])[1]?.trim()||''
    if (title && link) items.push({ title, link, desc, pubDate })
  }
  return items
}

function extractLinks(html, baseUrl) {
  try {
    const base = new URL(baseUrl); const links = new Set()
    const rx = /<a[^>]+href=["']([^"'#][^"']*?)["'][^>]*>/gi; let m
    while ((m = rx.exec(html)) !== null) {
      const href = m[1]?.trim()
      if (!href || href.startsWith('javascript') || href.startsWith('mailto')) continue
      try {
        const abs = href.startsWith('http') ? href : new URL(href, base).href
        if (!abs.includes(base.hostname)) continue
        if (abs === baseUrl || abs === baseUrl + '/') continue
        if (SKIP_URLS.some(s => abs.toLowerCase().includes(s))) continue
        if (abs.match(/\.(pdf|zip|jpg|png|gif|svg|css|js)$/i)) continue
        links.add(abs)
      } catch {}
    }
    return [...links].slice(0, 60)
  } catch { return [] }
}

// ── PAGINATION: find next page URL ───────────────────────────────────────────
function findNextPage(html, currentUrl) {
  try {
    const base = new URL(currentUrl)
    // Common pagination patterns
    const patterns = [
      /<a[^>]+href="([^"]+)"[^>]*>(?:Next|next|›|»|→)[^<]*<\/a>/i,
      /<a[^>]+rel="next"[^>]*href="([^"]+)"/i,
      /<a[^>]+href="([^"]+)"[^>]*rel="next"/i,
      /class="[^"]*next[^"]*"[^>]*href="([^"]+)"/i,
      /href="([^"]+)"[^>]*class="[^"]*next[^"]*"/i,
    ]
    for (const rx of patterns) {
      const m = html.match(rx)
      if (m?.[1]) {
        const next = m[1].startsWith('http') ? m[1] : new URL(m[1], base).href
        if (next !== currentUrl) return next
      }
    }
  } catch {}
  return null
}

function extractOgImage(html) {
  if (!html) return null
  for (const rx of [
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
    /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
  ]) {
    const m = html.match(rx)
    if (m?.[1]?.startsWith('http') && !m[1].includes('logo') && !m[1].includes('icon')) return m[1]
  }
  return null
}

async function aiExtract(title, text, url, brand) {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const prompt = `You are a DownRange firearms editor. Analyze this article.

Title: ${title}
Manufacturer hint: ${brand || 'unknown'}  
Article text: ${text.slice(0, 2000)}
Source: ${url}

TASK: Extract a NEW COMPLETE FIREARM product if announced.
ONLY extract: pistols, rifles, shotguns, revolvers — complete named production firearms.
REJECT: deals, sales, kits, blemished items, parts, accessories, accessories-only, non-gun content.
REJECT if model name looks like a sentence or news headline (more than 6 words).
If not a specific new complete firearm: {"skip":true}

Return ONLY valid JSON, no markdown:
{
  "brand": "Exact manufacturer name",
  "model": "Exact model designation e.g. P365-XMACRO Comp, G47 MOS",
  "category": "Pistol|Rifle|Shotgun|Revolver",
  "caliber": "e.g. 9mm Luger or null",
  "action": "Semi-Auto|Bolt-Action|Pump|Lever-Action|Revolver or null",
  "msrp": 0,
  "summary": "2-3 sentences. Specific specs, features, who it is for.",
  "body": "<h2>What Is It</h2><p>...</p><h2>Key Specs</h2><p>...</p><h2>Bottom Line</h2><p>...</p>",
  "specs": [{"label":"Barrel Length","value":"4 in"},{"label":"Weight","value":"25 oz"}],
  "skip": false
}`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(25000),
    })
    const data = await res.json()
    const raw  = data.content?.[0]?.text || ''
    const clean = raw.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    if (!clean) return null
    const parsed = JSON.parse(clean)
    if (parsed.skip || !parsed.brand || !parsed.model) return null
    if (parsed.model.split(' ').length > 7) return null
    return parsed
  } catch (e) { console.error('[AI]', e.message); return null }
}

async function saveRelease(ext, sourceUrl, imageUrl) {
  const slug = `${ext.brand}-${ext.model}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)
  const _id  = 'release-' + crypto.createHash('md5').update(`${ext.brand}::${ext.model}`.toLowerCase()).digest('hex').slice(0,12)
  return sanity.createOrReplace({
    _id, _type: 'firearmRelease',
    title:    `${ext.brand} ${ext.model}: ${(ext.summary||'').split('.')[0]}`.slice(0,120),
    slug:     { _type: 'slug', current: slug },
    brand:    ext.brand, model: ext.model, category: ext.category || 'Rifle',
    caliber:  ext.caliber || null, action: ext.action || null,
    msrp:     typeof ext.msrp === 'number' ? ext.msrp : 0,
    summary:  ext.summary || '', body: ext.body || null,
    imageUrl: imageUrl || CAT_IMGS[ext.category] || CAT_IMGS.default,
    specs: (ext.specs||[]).map(s=>({ _type:'object', _key:s.label.toLowerCase().replace(/\s+/g,'-'), label:s.label, value:s.value })),
    sourceUrl, isJustDropped: true, approved: true, qualityReviewed: true,
    publishedAt: new Date().toISOString(),
  })
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
function isAuth(req) {
  const admin = req.headers.get('x-admin-key')
  const auth  = req.headers.get('authorization')
  return admin === process.env.ADMIN_KEY || auth === `Bearer ${process.env.ADMIN_KEY}`
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // ?offset=0 (sources 0-9), ?offset=10 (10-19), etc. Default runs ALL
  const { searchParams } = new URL(req.url)
  const offset    = parseInt(searchParams.get('offset') || '0')
  const batchSize = parseInt(searchParams.get('batch')  || String(SOURCES.length))
  const sourceBatch = SOURCES.slice(offset, offset + batchSize)

  const t0 = Date.now()
  const stats = {
    created: 0, skipped: 0, failed: 0, saved: [], errors: [],
    skipFetch: 0, skipFilter: 0, skipAI: 0, skipDupe: 0,
    sourceLog: [], offset, batchSize: sourceBatch.length,
  }
  const seenKeys = new Set()

  // Load existing releases for dedup
  const existing = await sanity.fetch(`*[_type=="firearmRelease"]{brand,model}`).catch(() => [])
  const existingKeys = new Set(existing.map(d => `${d.brand}::${d.model}`.toLowerCase()))
  console.log(`[BACKFILL] Start offset=${offset} sources=${sourceBatch.length}/${SOURCES.length} existing=${existingKeys.size} AI=${!!process.env.ANTHROPIC_API_KEY}`)

  for (const source of sourceBatch) {
    if (stats.created >= 300) break
    const label = source.brand || source.label || 'unknown'

    const html = await fetchPage(source.url)
    if (!html) {
      console.log(`[BACKFILL] ${label}: fetch failed`)
      stats.sourceLog.push(`${label}: fetch failed`)
      continue
    }

    // Build candidate list
    let candidates = []
    if (source.rss) {
      // RSS — require include keyword, reject exclude
      const items = parseRSS(html)
      for (const item of items) {
        const text = `${item.title} ${item.desc}`
        if (hasExclude(text)) continue
        if (!hasInclude(text)) continue
        candidates.push({ title: item.title, url: item.link, desc: item.desc, pubDate: item.pubDate })
      }
      console.log(`[BACKFILL] ${label}: ${candidates.length}/${items.length} RSS candidates`)
      stats.sourceLog.push(`${label}: ${candidates.length}/${items.length} RSS`)
    } else {
      // Manufacturer HTML page — paginate up to 5 pages to get 8 months back
      let pageUrl = source.url
      let pageNum = 0
      const seenLinks = new Set()

      while (pageUrl && pageNum < 5) {
        const pageHtml = pageNum === 0 ? html : await fetchPage(pageUrl)
        if (!pageHtml) break
        pageNum++

        const links = extractLinks(pageHtml, source.url)
        let added = 0
        for (const link of links) {
          if (!seenLinks.has(link)) {
            seenLinks.add(link)
            candidates.push({ title: link.split('/').pop().replace(/-/g,' '), url: link, brand: source.brand })
            added++
          }
        }
        if (added > 0) console.log(`[BACKFILL] ${label} p${pageNum}: +${added} links (total:${candidates.length})`)

        // Find and follow next page link
        const next = findNextPage(pageHtml, pageUrl)
        pageUrl = (next && next !== source.url) ? next : null
        if (pageUrl) await sleep(400)
      }
      console.log(`[BACKFILL] ${label}: ${candidates.length} total links (${pageNum} pages crawled)`)
      stats.sourceLog.push(`${label}: ${candidates.length} links / ${pageNum}p`)
    }

    let srcCreated = 0
    for (const cand of candidates.slice(0, 40)) {
      if (stats.created >= 300) break

      // Fetch article
      const aHtml = await fetchPage(cand.url)
      if (!aHtml) { stats.skipped++; stats.skipFetch++; continue }

      const ogImg   = extractOgImage(aHtml)
      const ogTitle = (aHtml.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)||[])[1]
                   || (aHtml.match(/<title[^>]*>([^<]+)/i)||[])[1]?.split(/[|\-–]/)[0]?.trim()
                   || cand.title
      const aText   = aHtml.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'')
                           .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()

      // Filter: exclude always applies; include only required for RSS sources
      if (hasExclude(ogTitle + ' ' + aText.slice(0,300))) {
        const which = EXCLUDE_KW.find(k => (ogTitle+' '+aText.slice(0,300)).toLowerCase().includes(k))
        console.log(`[SKIP:excl] ${ogTitle.slice(0,60)} — "${which}"`)
        stats.skipped++; stats.skipFilter++; continue
      }
      if (source.rss && !hasInclude(ogTitle + ' ' + aText.slice(0,500))) {
        console.log(`[SKIP:incl] ${ogTitle.slice(0,60)} — no include keyword`)
        stats.skipped++; stats.skipFilter++; continue
      }

      // AI extract
      const ext = await aiExtract(ogTitle, aText, cand.url, cand.brand || source.brand)
      if (!ext) {
        console.log(`[SKIP:AI]   ${ogTitle.slice(0,60)}`)
        stats.skipped++; stats.skipAI++; await sleep(150); continue
      }

      // Dedup
      const key = `${ext.brand}::${ext.model}`.toLowerCase()
      if (seenKeys.has(key) || existingKeys.has(key)) {
        console.log(`[SKIP:dupe] ${ext.brand} — ${ext.model}`)
        stats.skipped++; stats.skipDupe++; continue
      }
      seenKeys.add(key); existingKeys.add(key)

      // Save
      try {
        await saveRelease(ext, cand.url, ogImg)
        stats.created++; srcCreated++
        stats.saved.push(`${ext.brand} — ${ext.model}`)
        console.log(`[SAVED ✓]  [${stats.created}] ${ext.brand} — ${ext.model} (${ext.category})`)
      } catch(e) {
        stats.failed++
        stats.errors.push(`${ext.brand} ${ext.model}: ${e.message}`)
        console.error(`[SAVE ERR] ${e.message}`)
      }
      await sleep(500)
    }
    if (srcCreated > 0) console.log(`[BACKFILL] ${label}: ${srcCreated} saved`)
    await sleep(300)
  }

  const ms = Date.now() - t0
  const details = [
    `created:${stats.created} skipped:${stats.skipped} failed:${stats.failed}`,
    `skips→ fetch:${stats.skipFetch} filter:${stats.skipFilter} AI:${stats.skipAI} dupe:${stats.skipDupe}`,
    stats.saved.length ? `saved: ${stats.saved.join(', ')}` : 'none saved',
  ].join(' | ')

  console.log('[BACKFILL] Done:', details)
  await reportCronRun('backfill-releases', { status: 'success', ms, details }).catch(() => {})

  const nextOffset = offset + batchSize
  const hasMore = nextOffset < SOURCES.length

  return Response.json({
    ok: true, created: stats.created, skipped: stats.skipped, failed: stats.failed,
    saved: stats.saved, errors: stats.errors, ms,
    skipBreakdown: { fetch: stats.skipFetch, filter: stats.skipFilter, ai: stats.skipAI, dupe: stats.skipDupe },
    sourceLog: stats.sourceLog,
    details,
    pagination: { offset, batchSize: sourceBatch.length, nextOffset: hasMore ? nextOffset : null, totalSources: SOURCES.length, hasMore },
  })
}

export async function POST(req) { return GET(req) }
