import Parser from 'rss-parser'
import { rewriteWithClaude, isDuplicate, publishToSanity, notifyBreaking, notifyError, sleep } from '../utils.js'

const parser = new Parser()

const CALIBERS = [
  { slug: '9mm', display: '9mm', unit: '115gr FMJ', rssSeg: 'ammo/9mm' },
  { slug: '223-remington', display: '.223 / 5.56', unit: '55gr FMJ', rssSeg: 'ammo/223-remington' },
  { slug: '308-winchester', display: '.308 WIN', unit: '147gr FMJ', rssSeg: 'ammo/308-winchester' },
  { slug: '45-acp', display: '.45 ACP', unit: '230gr FMJ', rssSeg: 'ammo/45-acp' },
  { slug: '12-gauge', display: '12 GA', unit: '00 Buck', rssSeg: 'ammo/12-gauge' },
  { slug: '65-creedmoor', display: '6.5 CM', unit: '140gr', rssSeg: 'ammo/65-creedmoor' },
  { slug: '22-lr', display: '.22 LR', unit: '40gr', rssSeg: 'ammo/22-lr' },
]

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

async function fetchRedditDeals() {
  const deals = []
  for (const url of REDDIT_AMMO_FEEDS) {
    try {
      const feed = await parser.parseURL(url)
      for (const item of feed.items.slice(0, 20)) {
        const price = parsePriceFromTitle(item.title || '')
        const isOOS = (item.title || '').toLowerCase().includes('oos')
        if (price) deals.push({ title: item.title, price, isOOS, url: item.link })
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

  for (const caliber of CALIBERS) {
    const data = await fetchAmmoSeekRSS(caliber)
    if (data) {
      try {
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
        done++
        console.log(`[MARKET] ${caliber.display}: $${data.avg.toFixed(3)}/rd`)
      } catch (err) {
        console.error('[MARKET] Publish error:', err.message)
      }
    }
    await sleep(2000)
  }

  console.log(`[MARKET] Done. ${done}/${CALIBERS.length} calibers. ${Date.now() - t}ms`)
  return { done }
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
      const res = await (async()=>{ const _r=await fetch('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet', channelId: channel.id,
          order: 'date', maxResults: 5, type: 'video',
          key: process.env.YOUTUBE_API_KEY
        }
      },{signal:AbortSignal.timeout(15000)}); return {data: await _r.json()} })()
      for (const item of res.data.items || []) {
        const sn = item.snippet
        await publishToSanity({
          _id: `video-${item.id.videoId}`,
          _type: 'video',
          title: sn.title,
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
