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
  if (/scope|optic|red dot|lpvo|vortex|leupold|eotech|aimpoint/.test(t))       return 'Optic'
  if (/holster|magazine|pmag|light|streamlight|sling|grip|trigger/.test(t))    return 'Accessories'
  if (/gear|vest|plate|carrier|bag|case|safe/.test(t))                         return 'Gear'
  return 'Deals'
}

function extractPrice(title = '') {
  const m = title.match(/\$[\d,]+(?:\.\d{2})?/)
  return m ? m[0] : null
}

// ── SOURCE 1: Sanity gunDeal docs ────────────────────────────────────────────
async function fetchSanityDeals() {
  try {
    const articles = await sanity.fetch(
      `*[_type=="gunDeal" && approved==true] | order(publishedAt desc) [0..150] {
        _id, title, source, imageUrl, externalUrl, publishedAt, summary, price
      }`
    )
    return articles.map(a => {
      const title  = a.title || ''
      const flair  = inferFlair(title)
      const imgUrl = a.imageUrl || null
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
        domain:    a.externalUrl ? (() => { try { return new URL(a.externalUrl).hostname.replace('www.','') } catch { return 'gun.deals' } })() : 'gun.deals',
        imageUrl:  imgUrl,
        price:     a.price || extractPrice(title),
        fromSanity: true,
      }
    })
  } catch (e) {
    console.error('[DEALS] Sanity fetch error:', e.message)
    return []
  }
}

// ── SOURCE 2: r/gundeals (live Reddit) ───────────────────────────────────────
async function fetchRedditDeals() {
  const results = []
  const urls = [
    'https://old.reddit.com/r/gundeals/hot.json?limit=50&raw_json=1',
    'https://old.reddit.com/r/gundeals/new.json?limit=25&raw_json=1',
    'https://old.reddit.com/r/ammo/hot.json?limit=20&raw_json=1',
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DownRange/2.0 (firearms platform; contact@downrangeco.com)' },
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) continue
      const data  = await res.json()
      const posts = data?.data?.children || []
      for (const { data: p } of posts) {
        if (p.stickied || !p.title || p.score < 5) continue
        const flair   = p.link_flair_text || 'Deals'
        const preview = p.preview?.images?.[0]
        const imgUrl  = preview?.resolutions?.find(r => r.width >= 400)?.url?.replace(/&amp;/g,'&')
                      || preview?.source?.url?.replace(/&amp;/g,'&')
                      || (p.thumbnail?.startsWith('http') ? p.thumbnail : null)
        results.push({
          id:        'r-' + p.id,
          title:     p.title,
          url:       p.url?.startsWith('http') ? p.url : `https://reddit.com${p.permalink}`,
          permalink: `https://reddit.com${p.permalink}`,
          score:     p.score,
          comments:  p.num_comments,
          created:   p.created_utc * 1000,
          flair,
          flairMeta: FLAIR_META[flair] || FLAIR_META.Deals,
          source:    'r/gundeals',
          domain:    p.domain,
          imageUrl:  imgUrl,
          price:     extractPrice(p.title),
        })
      }
      if (results.length > 0) break
    } catch { /* Reddit unreachable */ }
  }
  return results
}


// ── OG image scraper (for live RSS items without stored images) ───────────────
async function scrapeOGBatch(urls, concurrency = 4) {
  const results = new Map()
  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      chunk.map(async (url) => {
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)' },
            signal: AbortSignal.timeout(5000),
          })
          if (!res.ok) return { url, img: null }
          const html = await res.text()
          const m = html.match(/<meta[^>]+property=["'']og:image["''][^>]+content=["'']([^"'']+)["'']/i)
                 || html.match(/<meta[^>]+content=["'']([^"'']+)["''][^>]+property=["'']og:image["'']/i)
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
      })
      if (results.length >= 30) break
    }

    // Scrape OG images for all live items (4 concurrent, 5s timeout each)
    if (results.length > 0) {
      const imgs = await scrapeOGBatch(results.map(r => r.url), 4)
      for (const r of results) if (imgs.get(r.url)) r.imageUrl = imgs.get(r.url)
    }
  } catch(_e) { /* gun.deals unreachable */ }
  return results
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const catFilter = searchParams.get('cat') || null
  const sortBy    = searchParams.get('sort') || 'hot'

  // Fetch all sources in parallel
  const [sanityDeals, redditDeals, gunDealsItems] = await Promise.all([
    fetchSanityDeals(),
    fetchRedditDeals(),
    fetchGunDeals(),
  ])

  // Merge — Sanity first, then live sources; dedup by URL
  const seen = new Set()
  const deals = []
  for (const d of [...sanityDeals, ...redditDeals, ...gunDealsItems]) {
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

  const sources = {
    sanity:   sanityDeals.length,
    reddit:   redditDeals.length,
    gunDeals: gunDealsItems.length,
  }
  const live = redditDeals.length > 0 || gunDealsItems.length > 0

  return Response.json({
    deals: filtered,
    total: filtered.length,
    live,
    sources,
    cached: false,
    ts: Date.now(),
  })
}
