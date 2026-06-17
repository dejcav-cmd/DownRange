import Parser from 'rss-parser'
import { decodeHtmlEntities } from '../../lib/decodeEntities.js'
import { rewriteWithClaude, isDuplicate, publishToSanity, notifyBreaking, notifyError, sleep } from '../utils.js'

const parser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'DownRange/1.0' } })

const CALIBERS = [
  { slug: '9mm', display: '9mm', unit: '115gr FMJ', rssSeg: 'ammo/9mm' },
  { slug: '223-remington', display: '.223 / 5.56', unit: '55gr FMJ', rssSeg: 'ammo/223-remington' },
  { slug: '308-winchester', display: '.308 WIN', unit: '147gr FMJ', rssSeg: 'ammo/308-winchester' },
  { slug: '45-acp', display: '.45 ACP', unit: '230gr FMJ', rssSeg: 'ammo/45-acp' },
  { slug: '12-gauge', display: '12 GA', unit: '00 Buck', rssSeg: 'ammo/12-gauge' },
  { slug: '65-creedmoor', display: '6.5 CM', unit: '140gr', rssSeg: 'ammo/65-creedmoor' },
  { slug: '22-lr', display: '.22 LR', unit: '40gr', rssSeg: 'ammo/22-lr' },
]

// gun.deals blog RSS — community-curated deals (free, no auth)
const GUN_DEALS_RSS = 'https://gun.deals/rss.xml'

// Reddit JSON API (more reliable than RSS, no auth needed)
const REDDIT_DEALS_FEEDS = [
  { url: 'https://www.reddit.com/r/gundeals/hot.json?limit=50',  source: 'r/gundeals' },
  { url: 'https://www.reddit.com/r/ammo/hot.json?limit=25',      source: 'r/ammo'     },
]

// Legacy RSS fallback
const REDDIT_AMMO_FEEDS = [
  'https://www.reddit.com/r/gundeals/.rss',
  'https://www.reddit.com/r/ammo/.rss',
]

function parsePriceFromTitle(title) {
  const match = title.match(/\$?([\d.]+)\s*\/\s*(?:rd|round|rnd)/i)
  if (match) return parseFloat(match[1])
  const match2 = title.match(/\$([\d.]+)\s+per\s+round/i)
  if (match2) return parseFloat(match2[1])
  return null
}

async function fetchAmmoSeekRSS(caliber) {
  try {
    const feed = await parser.parseURL(`https://www.ammoseek.com/${caliber.rssSeg}/rss`)
    const prices = []
    for (const item of feed.items.slice(0, 10)) {
      const p = parsePriceFromTitle(item.title || '')
      if (p && p > 0.01 && p < 5.0) prices.push(p)
    }
    if (!prices.length) return null

    prices.sort((a, b) => a - b)
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length
    const lowest = prices[0]
    const highest = prices[prices.length - 1]

    return { avg: Math.round(avg * 1000) / 1000, lowest, highest, count: prices.length }
  } catch (err) {
    console.error(`[MARKET] AmmoSeek error (${caliber.slug}):`, err.message)
    return null
  }
}

async function fetchGunDealsRSS() {
  const deals = []
  try {
    const feed = await parser.parseURL(GUN_DEALS_RSS)
    for (const item of feed.items.slice(0, 30)) {
      const price = parsePriceFromTitle(item.title || '')
      const title = decodeHtmlEntities(item.title || '').trim()
      if (!title) continue
      // Parse category from title brackets e.g. [Rifle], [Ammo]
      const catMatch = title.match(/^\[([^\]]+)\]/)
      const flair = catMatch ? catMatch[1] : 'Other'
      deals.push({
        title,
        price,
        url: item.link || '',
        source: 'gun.deals',
        flair,
        created: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
      })
    }
    console.log(`[MARKET] gun.deals RSS: ${deals.length} deals`)
  } catch (err) {
    console.error('[MARKET] gun.deals RSS error:', err.message)
  }
  return deals
}

async function fetchRedditJSON() {
  const deals = []
  for (const feed of REDDIT_DEALS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const posts = data?.data?.children || []
      for (const post of posts) {
        const p = post.data || {}
        if (!p.title || p.is_self || p.over_18) continue
        const price = parsePriceFromTitle(p.title)
        const isOOS = p.link_flair_text?.includes('OOS') || p.title.toLowerCase().includes('[oos]')
        if (isOOS) continue
        deals.push({
          title:   decodeHtmlEntities(p.title),
          price,
          url:     p.url || '',
          source:  feed.source,
          flair:   p.link_flair_text || 'Other',
          score:   p.score || 0,
          created: (p.created_utc || 0) * 1000,
        })
      }
      console.log(`[MARKET] Reddit JSON ${feed.source}: ${posts.length} posts`)
      await sleep(500)
    } catch (err) {
      console.error(`[MARKET] Reddit JSON ${feed.source} error:`, err.message)
    }
  }
  return deals
}

async function fetchRedditDeals() {
  const deals = []
  for (const url of REDDIT_AMMO_FEEDS) {
    try {
      const feed = await parser.parseURL(url)
      for (const item of feed.items.slice(0, 20)) {
        const price = parsePriceFromTitle(item.title || '')
        const isOOS = (item.title || '').toLowerCase().includes('oos')
        if (price) deals.push({ title: decodeHtmlEntities(item.title), price, isOOS, url: item.link })
      }
      await sleep(1000)
    } catch (err) {
      console.error('[MARKET] Reddit RSS error:', err.message)
    }
  }
  return deals
}

async function runMarketFeed() {
  console.log('[MARKET] Starting market feed...')
  const t = Date.now()
  let done = 0
  const saved = []

  // Parallel fetch all calibers simultaneously (was sequential with 2s sleeps = 14s+ minimum)
  const results = await Promise.allSettled(CALIBERS.map(async caliber => {
    const data = await fetchAmmoSeekRSS(caliber)
    if (!data) return null
    await publishToSanity({
      _id: `ammo-${caliber.slug}`,
      _type: 'ammoPrice',
      caliber: caliber.display,
      caliberSlug: caliber.slug,
      pricePerRound: data.avg,
      unit: caliber.unit,
      trendPercent: 0,
      trendDirection: 'flat',
      availabilityIndex: Math.min(100, data.count * 10),
      lowestPrice: data.lowest,
      highestPrice: data.highest,
      sampleSize: data.count,
      lastUpdated: new Date().toISOString()
    })
    console.log(`[MARKET] ${caliber.display}: $${data.avg.toFixed(3)}/rd`)
    return caliber.display
  }))

  done = results.filter(r => r.status === 'fulfilled' && r.value).length
  console.log(`[MARKET] Done. ${done}/${CALIBERS.length} calibers. ${Date.now() - t}ms`)
  return { done, saved, headlines: saved.slice(0, 20) }
}

// ── YOUTUBE FEED ──────────────────────────────────────────────────────
const YT_CHANNELS = [
  { id: 'UC5Gwxl2DmAZkdiuoWsLcRhg', name: 'Garand Thumb' },
  { id: 'UCIRgR4iANHI2taJdz8hjwLw', name: 'Paul Harrell' },
  { id: 'UCwIHnIpEIbyzmL9cB2l5Elw', name: 'Military Arms Channel' },
  { id: 'UCz8b2iV8CJxBNs3fP4jjRMg', name: 'IraqVeteran8888' },
]

async function runVideoFeed() {
  if (!process.env.YOUTUBE_API_KEY) {
    console.log('[VIDEO] No YouTube key, skipping')
    return
  }
  console.log('[VIDEO] Starting video feed...')
  let done = 0

  for (const channel of YT_CHANNELS) {
    try {
      const _ytParams = new URLSearchParams({ part: 'snippet', channelId: channel.id, order: 'date', maxResults: '5', type: 'video', key: process.env.YOUTUBE_API_KEY })
      const _ytR = await fetch('https://www.googleapis.com/youtube/v3/search?' + _ytParams, { signal: AbortSignal.timeout(15000) })
      if (!_ytR.ok) throw new Error(_ytR.statusText)
      const res = { data: await _ytR.json() }
      for (const item of res.data.items || []) {
        const sn = item.snippet
        await publishToSanity({
          _id: `video-${item.id.videoId}`,
          _type: 'video',
          title: decodeHtmlEntities(sn.title),
          videoId: item.id.videoId,
          channelName: channel.name,
          channelId: channel.id,
          thumbnailUrl: sn.thumbnails?.high?.url,
          category: 'review',
          publishedAt: sn.publishedAt,
        })
        done++
      }
      await sleep(1000)
    } catch (err) {
      console.error(`[VIDEO] YouTube error (${channel.name}):`, err.message)
    }
  }
  console.log(`[VIDEO] Done. ${done} videos`)
}

export { runMarketFeed, runVideoFeed }
