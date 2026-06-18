/**
 * 60-day backfill: crawls all 41 manufacturer sources more deeply
 * to populate the releases page with real content.
 * Run via GitHub Actions workflow.
 */
const https = require('https')
const http  = require('http')
const { URL } = require('url')

const PROJECT_ID = 'vbnsqnkg'
const DATASET    = 'production'
const SANITY_TOKEN = process.env.SANITY_API_TOKEN
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

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
  { brand: 'Bergara',            url: 'https://www.bergara.online/us/' },
  { brand: 'Tikka',              url: 'https://choose.tikka.fi/usa/news' },
  { brand: 'Staccato',           url: 'https://staccato2011.com/shop/new-arrivals' },
  { brand: 'Wilson Combat',      url: 'https://wilsoncombat.com/news/' },
  { brand: 'Shadow Systems',     url: 'https://shadowsystemscorp.com/category/press-release/' },
  { brand: 'IWI US',             url: 'https://iwi.us/news/' },
  { brand: 'Aero Precision',     url: 'https://www.aeroprecisionusa.com/blog' },
  { brand: 'Fusion Firearms',    url: 'https://fusionfirearms.com/videovault/category/announcements' },
  // Gun media RSS
  { brand: null, url: 'https://www.thetruthaboutguns.com/feed/', rss: true },
  { brand: null, url: 'https://www.ammoland.com/feed/', rss: true },
  { brand: null, url: 'https://www.guns.com/feed', rss: true },
  { brand: null, url: 'https://www.gunsandammo.com/feed/', rss: true },
  { brand: null, url: 'https://www.americanrifleman.org/feed/', rss: true },
]

const INCLUDE = ['new ', 'release', 'introduces', 'announces', 'launches', 'launched',
  'now available', 'now shipping', 'pistol', 'rifle', 'shotgun', 'revolver', 'firearm', 'handgun', '1911']
const EXCLUDE = ['daily deal', 'flash deal', 'blem', 'sale price', 'sale ends', 'ammo deal',
  'rifle kit', 'pistol kit', 'build kit', 'stripped lower', 'complete upper', 'brace kit',
  'apparel', 't-shirt', 'parts kit', 'holster', 'magazine', ' mag ', 'coupon',
  'horoscope', 'astrology', 'zodiac', 'lawsuit', 'recall ', 'earnings']

const CAT_IMGS = {
  Pistol: 'https://images.unsplash.com/photo-1578302758063-aaff0d54e35f?w=900&q=85',
  Revolver: 'https://images.unsplash.com/photo-1609205807115-b8ea8cf28a52?w=900&q=85',
  Rifle: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=900&q=85',
  Shotgun: 'https://images.unsplash.com/photo-1584552532191-fed9e2c2d21e?w=900&q=85',
  default: 'https://images.unsplash.com/photo-1578302758063-aaff0d54e35f?w=900&q=85',
}

function isValid(title, desc) {
  const t = `${title} ${desc}`.toLowerCase()
  return INCLUDE.some(k => t.includes(k)) && !EXCLUDE.some(k => t.includes(k))
}

// HTTP fetch with redirects
function fetchUrl(rawUrl, redirects = 0) {
  return new Promise(resolve => {
    if (redirects > 4) return resolve('')
    let u; try { u = new URL(rawUrl) } catch { return resolve('') }
    const mod = u.protocol === 'https:' ? https : http
    const req = mod.request({
      hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : u.origin + res.headers.location
        return resolve(fetchUrl(next, redirects + 1))
      }
      let d = ''; res.on('data', c => { d += c; if (d.length > 250000) req.destroy() })
      res.on('end', () => resolve(d))
    })
    req.on('error', () => resolve('')); req.on('timeout', () => { req.destroy(); resolve('') }); req.end()
  })
}

function extractLinks(html, baseUrl) {
  const base = new URL(baseUrl); const links = new Set()
  const rx = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi; let m
  const SKIP_URL = ['/daily-deal', '/blem', '/sale/', '/ammo/', '/magazines/', '/accessories/', '/apparel/', '/parts/']
  while ((m = rx.exec(html)) !== null) {
    const href = m[1]?.trim()
    if (!href || href.startsWith('#') || href.startsWith('javascript')) continue
    try {
      const abs = href.startsWith('http') ? href : new URL(href, base).href
      if (abs.includes(base.hostname) && abs.length > baseUrl.length + 5) {
        if (!SKIP_URL.some(p => abs.toLowerCase().includes(p))) links.add(abs)
      }
    } catch {}
  }
  return [...links].slice(0, 40)
}

function extractOgImage(html) {
  if (!html) return null
  const pats = [
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
    /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
  ]
  for (const rx of pats) {
    const m = html.match(rx)
    if (m?.[1] && m[1].startsWith('http') && !m[1].includes('logo') && !m[1].includes('icon')) return m[1]
  }
  return null
}

function parseRSS(xml) {
  const items = []; const rx = /<item[^>]*>([\s\S]*?)<\/item>/gi; let m
  while ((m = rx.exec(xml)) !== null) {
    const b = m[1]
    const title   = (b.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)    ||[])[1]?.trim()||''
    const link    = (b.match(/<link[^>]*>([\s\S]*?)<\/link>/)                                  ||[])[1]?.trim()
                 || (b.match(/<guid[^>]*>(https?[^<]+)<\/guid>/)                               ||[])[1]?.trim()||''
    const desc    = (b.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) ||[])[1]
                    ?.replace(/<[^>]+>/g,'').trim().slice(0,600)||''
    const pubDate = (b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)                            ||[])[1]?.trim()||''
    if (title && link) items.push({ title, link, desc, pubDate })
  }
  return items
}

async function callClaude(prompt) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001', max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    })
    const req = https.request({
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01', 'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => {
        try {
          const j = JSON.parse(d)
          const text = j.content?.[0]?.text || ''
          const clean = text.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
          const parsed = JSON.parse(clean)
          resolve(parsed.skip ? null : parsed)
        } catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null)); req.on('timeout', () => { req.destroy(); resolve(null) })
    req.write(body); req.end()
  })
}

function sanityRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/${path}`,
      method, headers: {
        Authorization: `Bearer ${SANITY_TOKEN}`, 'Content-Type': 'application/json',
        ...(b ? { 'Content-Length': Buffer.byteLength(b) } : {})
      }
    }, res => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve({}) } })
    })
    req.on('error', reject); if (b) req.write(b); req.end()
  })
}

const crypto = require('crypto')
async function saveRelease(extracted, sourceUrl, imageUrl) {
  const slug = `${extracted.brand}-${extracted.model}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)
  const _id = 'release-' + crypto.createHash('md5').update(`${extracted.brand}::${extracted.model}`.toLowerCase()).digest('hex').slice(0,12)
  const doc = {
    _id, _type: 'firearmRelease',
    title: `${extracted.brand} ${extracted.model}: ${(extracted.summary||'').split('.')[0]}`.slice(0,120),
    slug: { _type:'slug', current:slug },
    brand: extracted.brand, model: extracted.model,
    category: extracted.category || 'Rifle',
    caliber: extracted.caliber || null, action: extracted.action || null,
    msrp: typeof extracted.msrp === 'number' ? extracted.msrp : 0,
    summary: extracted.summary || '', body: extracted.body || null,
    imageUrl: imageUrl || CAT_IMGS[extracted.category] || CAT_IMGS.default,
    specs: (extracted.specs||[]).map(s => ({
      _type:'object', _key: s.label.toLowerCase().replace(/\s+/g,'-'), label:s.label, value:s.value
    })),
    sourceUrl, isJustDropped: true, approved: true, qualityReviewed: true,
    publishedAt: new Date().toISOString(),
  }
  return sanityRequest(`mutate/${DATASET}`, 'POST', { mutations: [{ createOrReplace: doc }] })
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function run() {
  console.log('=== 60-Day Backfill Starting ===')
  console.log(`Sources: ${SOURCES.length} | Anthropic: ${!!ANTHROPIC_KEY}`)

  // Load existing keys
  const { result: existing } = await sanityRequest(`query/${DATASET}?query=${encodeURIComponent('*[_type=="firearmRelease"]{brand,model}')}`, 'GET')
  const existingKeys = new Set((existing||[]).map(d => `${d.brand}::${d.model}`.toLowerCase()))
  console.log(`Existing releases: ${existingKeys.size}`)

  const seenKeys = new Set()
  let totalCreated = 0, totalSkipped = 0

  for (const source of SOURCES) {
    console.log(`\n--- ${source.brand || source.url.split('/')[2]} ---`)
    const html = await fetchUrl(source.url)
    if (!html) { console.log('Fetch failed'); continue }

    let candidates = []

    if (source.rss) {
      const items = parseRSS(html)
      for (const item of items) {
        if (isValid(item.title, item.desc)) candidates.push({ title: item.title, url: item.link, desc: item.desc })
      }
      console.log(`RSS: ${candidates.length} candidates from ${items.length} items`)
    } else {
      const links = extractLinks(html, source.url)
      for (const link of links) {
        const slug = decodeURIComponent(link.split('/').pop().replace(/-/g,' '))
        if (isValid(slug, source.brand || '')) candidates.push({ title: slug, url: link, desc: '', brand: source.brand })
      }
      console.log(`HTML: ${candidates.length} candidates from ${links.length} links`)
    }

    for (const candidate of candidates.slice(0, 12)) {
      const articleHtml = await fetchUrl(candidate.url)
      if (!articleHtml) continue

      const ogImage = extractOgImage(articleHtml)
      const ogTitle = (articleHtml.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)||[])[1]
                   || (articleHtml.match(/<title[^>]*>([^<]+)/i)||[])[1]?.split('|')[0]?.split('–')[0]?.trim()
                   || candidate.title

      const articleText = articleHtml
        .replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'')
        .replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()

      if (!isValid(ogTitle, articleText.slice(0,400))) { totalSkipped++; continue }

      const prompt = `You are a DownRange firearms editor. Extract NEW FIREARM PRODUCT data from this article.

Title: ${ogTitle}
Brand: ${candidate.brand || source.brand || 'Unknown'}
Text: ${articleText.slice(0,2000)}

RULES:
- Only extract a COMPLETE named firearm (pistol, rifle, shotgun, revolver)
- Reject: deals, sales, blemished items, kits, bundles, parts, accessories, apparel
- Reject if model name looks like a headline (longer than 8 words)
- If not a specific complete firearm product: {"skip":true}

Return ONLY JSON:
{"brand":"exact name","model":"exact model","category":"Pistol|Rifle|Shotgun|Revolver","caliber":"or null","action":"Semi-Auto|Bolt-Action|etc or null","msrp":0,"summary":"3 sentences, specific facts","body":"<h2>What Is It</h2><p>...</p><h2>Key Specs</h2><p>...</p><h2>Bottom Line</h2><p>...</p>","specs":[{"label":"Barrel","value":"4in"}],"skip":false}`

      const extracted = await callClaude(prompt)
      if (!extracted) { totalSkipped++; await sleep(200); continue }

      const key = `${extracted.brand}::${extracted.model}`.toLowerCase()
      if (seenKeys.has(key) || existingKeys.has(key)) { totalSkipped++; continue }

      seenKeys.add(key); existingKeys.add(key)

      try {
        await saveRelease(extracted, candidate.url, ogImage)
        totalCreated++
        console.log(`✓ [${totalCreated}] ${extracted.brand} — ${extracted.model} (${extracted.category})`)
      } catch(e) {
        console.log(`✗ Save failed: ${e.message}`)
      }

      await sleep(800)
      if (totalCreated >= 80) break
    }
    if (totalCreated >= 80) break
    await sleep(500)
  }

  console.log(`\n=== Done: ${totalCreated} releases created, ${totalSkipped} skipped ===`)
}

run().catch(e => { console.error(e); process.exit(1) })
