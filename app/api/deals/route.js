export const dynamic   = 'force-dynamic'
export const revalidate = 0

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2023-08-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

// ── FLAIR MAPPING ─────────────────────────────────────────────────────────────
const FLAIR_META = {
  'Handgun':     { color:'#60A5FA', bg:'rgba(96,165,250,0.12)',  label:'HANDGUN'     },
  'Rifle':       { color:'#34D399', bg:'rgba(52,211,153,0.12)',  label:'RIFLE'       },
  'Shotgun':     { color:'#FBBF24', bg:'rgba(251,191,36,0.12)',  label:'SHOTGUN'     },
  'Ammo':        { color:'#C8922A', bg:'rgba(200,146,42,0.12)',  label:'AMMO'        },
  'Accessories': { color:'#C084FC', bg:'rgba(192,132,252,0.12)', label:'ACCESSORIES' },
  'NFA':         { color:'#EF4444', bg:'rgba(239,68,68,0.12)',   label:'NFA'         },
  'Optic':       { color:'#34D399', bg:'rgba(52,211,153,0.12)',  label:'OPTIC'       },
  'Gear':        { color:'#9CA3AF', bg:'rgba(156,163,175,0.12)', label:'GEAR'        },
  'Archery':     { color:'#84CC16', bg:'rgba(132,204,22,0.12)',  label:'ARCHERY'     },
  'Deals':       { color:'#FBBF24', bg:'rgba(251,191,36,0.12)',  label:'DEAL'        },
  'Other':       { color:'#4B5563', bg:'rgba(75,85,99,0.12)',    label:'OTHER'       },
}

function inferFlair(title = '') {
  const t = title.toLowerCase()
  if (/handgun|pistol|glock|sig sauer|beretta|kimber|1911|revolver/.test(t)) return 'Handgun'
  if (/rifle|ar-15|ar15|ak-|carbine|sbr|bolt.action|lever.action/.test(t))   return 'Rifle'
  if (/shotgun|mossberg|remington 870|benelli/.test(t))                        return 'Shotgun'
  if (/\bammo\b|9mm|\.223|\.308|5\.56|7\.62|\.45|\.357|rounds|gr fmj|gr hp/.test(t)) return 'Ammo'
  if (/suppressor|silencer|\bnfa\b|form 4|form4/.test(t))                      return 'NFA'
  if (/scope|optic|red dot|lpvo|vortex|leupold|eotech|aimpoint|holosun|burris|zeiss|monstrum/.test(t)) return 'Optic'
  if (/\bbow\b|archery|arrow|broadhead|quiver|recurve|compound bow|crossbow|nock|fletching|vane|mathews|hoyt|bowtech|pse bow|gold tip|carbon express|rage broadhead|barnett|tenpoint/.test(t)) return 'Archery'
  if (/holster|magazine|pmag|light|streamlight|sling|grip|trigger/.test(t))    return 'Accessories'
  if (/gear|vest|plate|carrier|bag|case|safe/.test(t))                         return 'Gear'
  return 'Deals'
}

function extractPrice(title = '') {
  const m = title.match(/\$[\d,]+(?:\.\d{2})?/)
  return m ? m[0] : null
}

// Extract magazine capacity from title.
// Handles: 13rd, 13-rd, 13 rd, 13rnd, 13+1, 30-round, 30 rounds, (17)rd
function extractMagCapacity(title = '') {
  if (!title) return null
  const m = title.match(/\b(\d{1,3})(?:\+\d+)?[\s-]?(?:rd|rnd|rounds?)\b/i)
          || title.match(/\b(\d{1,3})\+\d+\b/)
  if (!m) return null
  const cap = parseInt(m[1], 10)
  return (cap >= 5 && cap <= 200) ? cap : null
}

// ── IMAGE PROXY ───────────────────────────────────────────────────────────────
// gun.deals uses Cloudflare Image Resizing (cdn-cgi/image/*) which blocks hotlinking.
// Rewrite those URLs through our server-side proxy so the browser gets the image.
function proxyImage(url) {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host === 'gun.deals') {
      return `/api/img-proxy?url=${encodeURIComponent(url)}`
    }
  } catch { /* ignore */ }
  return url
}

// ── SOURCE 1: Sanity gunDeal docs ────────────────────────────────────────────
async function fetchSanityDeals() {
  try {
    const articles = await sanity.fetch(
      `*[_type=="gunDeal" && approved==true] | order(publishedAt desc) [0..200] {
        _id, title, source, imageUrl, externalUrl, publishedAt, summary, price, store
      }`
    )
    return articles.map(a => {
      const title  = a.title || ''
      const flair  = inferFlair(title)
      const imgUrl = proxyImage(a.imageUrl)
      return {
        id:        a._id,
        title,
        url:       a.externalUrl || `https://downrangeco.com/deals`,
        permalink: a.externalUrl || `https://downrangeco.com/deals`,
        score:     null,
        comments:  null,
        created:   a.publishedAt ? new Date(a.publishedAt).getTime() : Date.now(),
        flair,
        flairMeta: FLAIR_META[flair] || FLAIR_META.Deals,
        source:    a.source || 'gun.deals',
        domain:    a.source === 'amazon'
          ? 'amazon.com'
          : a.source === 'reddit'
          ? 'r/gundeals'
          : a.source === 'brownells'
          ? 'brownells.com'
          : a.source === 'psa'
          ? 'palmettostatearmory.com'
          : a.source === 'natchez'
          ? 'natchezss.com'
          : a.source === 'olight'
          ? 'olight.com'
          : a.externalUrl ? (() => { try { return new URL(a.externalUrl).hostname.replace('www.','') } catch { return 'gun.deals' } })() : 'gun.deals',
        imageUrl:  imgUrl,
        price:     a.price || extractPrice(title),
        detectedCapacity: extractMagCapacity(title),
        fromSanity: true,
      }
    })
  } catch (e) {
    console.error('[DEALS] Sanity fetch error:', e.message)
    return []
  }
}


// ── OG image scraper (for live RSS items without stored images) ───────────────
// Full browser UA — confirmed working against gun.deals from Vercel (HTTP 200, OG scraped)
const OG_SCRAPE_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

async function scrapeOGBatch(urls, concurrency = 4) {
  const results = new Map()
  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      chunk.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: OG_SCRAPE_HEADERS,
            signal: AbortSignal.timeout(3000),
          })
          if (!res.ok) return { url, img: null }
          const html = await res.text()
          // [\s\S] handles newlines inside meta tag attributes
          const m = html.match(/<meta[\s\S]*?property=["']og:image["'][\s\S]*?content=["']([^"']+)["']/i)
                 || html.match(/<meta[\s\S]*?content=["']([^"']+)["'][\s\S]*?property=["']og:image["']/i)
          return { url, img: m ? m[1].trim() : null }
        } catch(_e) { return { url, img: null } }
      })
    )
    for (const r of settled)
      if (r.status === 'fulfilled') results.set(r.value.url, r.value.img)
  }
  return results
}

// ── SOURCE 3: gun.deals RSS (direct fetch, no proxy) ─────────────────────────
const GUN_DEALS_RSS_URLS = [
  'https://gun.deals/feed/syndication/rss',
  'https://gun.deals/rss.xml',
  'https://gun.deals/feed',
  'https://gun.deals/feeds/items.rss',
]

async function fetchGunDeals() {
  const results = []
  try {
    let xml = null
    for (const url of GUN_DEALS_RSS_URLS) {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(8000),
        })
        if (res.ok) { xml = await res.text(); break }
      } catch(_e) { /* try next */ }
    }
    if (!xml) return results

    const itemRegex = /<item>([\s\S]*?)<\/item>/gi
    let match
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1]
      const get = (tag) => {
        const m = block.match(new RegExp('<' + tag + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + tag + '>'))
                 || block.match(new RegExp('<' + tag + '[^>]*>([^<]*)<\\/' + tag + '>'))
        return m ? m[1].trim() : ''
      }
      const title = get('title')
      const link  = get('link') || get('guid')
      const date  = get('pubDate')
      if (!title || !link) continue
      const flair = inferFlair(title)
      results.push({
        id:        'gd-' + Buffer.from(link).toString('base64').slice(0, 10),
        title,
        url:       link,
        permalink: link,
        score:     null,
        comments:  null,
        created:   date ? new Date(date).getTime() : Date.now(),
        flair,
        flairMeta: FLAIR_META[flair] || FLAIR_META.Deals,
        source:    'gun.deals',
        domain:    'gun.deals',
        imageUrl:  null, // filled below
        price:     extractPrice(title),
        detectedCapacity: extractMagCapacity(title),
      })
      if (results.length >= 30) break
    }

  } catch(_e) { /* gun.deals unreachable */ }
  return results
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const catFilter = searchParams.get('cat') || null
  const sortBy    = searchParams.get('sort') || 'hot'

  // Fetch from Sanity (all deals stored with images via hourly cron)
  const sanityDeals = await fetchSanityDeals()
  const gunDealsItems = []

  // Dedup by URL
  const seen = new Set()
  const deals = []
  for (const d of [...sanityDeals, ...gunDealsItems]) {
    const key = d.url
    if (seen.has(key)) continue
    seen.add(key)
    deals.push(d)
  }

  // Sort
  const sorted = sortBy === 'new'
    ? deals.sort((a, b) => b.created - a.created)
    : deals.sort((a, b) => {
        if (a.score !== null && b.score !== null) return b.score - a.score
        if (a.score !== null) return -1
        if (b.score !== null) return 1
        return b.created - a.created
      })

  // Filter
  const filtered = catFilter ? sorted.filter(d => d.flair === catFilter) : sorted

  const amazonCount  = deals.filter(d => d.source === 'amazon').length
  const redditCount  = deals.filter(d => d.source === 'reddit').length
  const webCount     = deals.filter(d => ['brownells','psa','natchez','olight'].includes(d.source)).length
  const sources = {
    sanity:   sanityDeals.filter(d => !['amazon','reddit','brownells','psa','natchez','olight'].includes(d.source)).length,
    gunDeals: gunDealsItems.length,
    amazon:   amazonCount,
    reddit:   redditCount,
    web:      webCount,
  }
  const live = gunDealsItems.length > 0

  return Response.json({
    deals: filtered,
    total: filtered.length,
    live,
    sources,
    cached: false,
    ts: Date.now(),
  })
}
