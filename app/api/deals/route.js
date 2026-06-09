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

// ── SOURCE 1: Sanity newsArticle deals ───────────────────────────────────────
async function fetchSanityDeals() {
  try {
    const articles = await sanity.fetch(
      `*[_type=="newsArticle" && category=="deals" && approved==true] | order(publishedAt desc) [0..150] {
        _id, title, slug, source, imageUrl, externalUrl, publishedAt, summary,
        heroImage { asset->{ url } }
      }`
    )
    return articles.map(a => {
      const title  = a.title || ''
      const flair  = inferFlair(title)
      const imgUrl = a.heroImage?.asset?.url || a.imageUrl || null
      return {
        id:        a._id,
        title,
        url:       a.externalUrl || `https://downrangeco.com/news/${a.slug?.current || a._id}`,
        permalink: a.externalUrl || `https://downrangeco.com/news/${a.slug?.current || a._id}`,
        score:     null,
        comments:  null,
        created:   a.publishedAt ? new Date(a.publishedAt).getTime() : Date.now(),
        flair,
        flairMeta: FLAIR_META[flair] || FLAIR_META.Deals,
        source:    a.source || 'DownRange',
        domain:    a.externalUrl ? (() => { try { return new URL(a.externalUrl).hostname.replace('www.','') } catch { return 'downrangeco.com' } })() : 'downrangeco.com',
        imageUrl:  imgUrl,
        price:     extractPrice(title),
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

// ── SOURCE 3: gun.deals RSS ───────────────────────────────────────────────────
async function fetchGunDeals() {
  const results = []
  try {
    const res = await fetch(
      'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://gun.deals/rss.xml') + '&count=40',
      { next: { revalidate: 0 }, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return results
    const json = await res.json()
    if (json.status !== 'ok' || !json.items?.length) return results
    for (const item of json.items.slice(0, 30)) {
      const title = item.title || ''
      if (!title || !item.link) continue
      const flair = inferFlair(title)
      results.push({
        id:        'gd-' + Buffer.from(item.link).toString('base64').slice(0,10),
        title,
        url:       item.link,
        permalink: item.link,
        score:     null,
        comments:  null,
        created:   item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        flair,
        flairMeta: FLAIR_META[flair] || FLAIR_META.Deals,
        source:    'gun.deals',
        domain:    'gun.deals',
        imageUrl:  item.enclosure?.link || item.thumbnail || null,
        price:     extractPrice(title),
      })
    }
  } catch { /* gun.deals unreachable */ }
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
