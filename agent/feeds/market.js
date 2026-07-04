import Parser from 'rss-parser'
import { decodeHtmlEntities } from '../../lib/decodeEntities.js'
import { publishToSanity, sleep } from '../utils.js'

const parser = new Parser({ timeout: 10000, headers: { 'User-Agent': 'DownRange/1.0' } })

// AmmoSeek RSS title format examples:
//   "Lucky Gunner - Federal American Eagle 9mm Luger 115gr FMJ 1000rds - $0.179/rd"
//   "Ammo.com - Blazer Brass 9mm 115gr FMJ 350rd - $0.184/round - In Stock"
//   "PSA - Winchester USA 9mm 115gr FMJ Bulk 1000ct - $183.99 ($0.184/rd)"
// item.link = "https://www.ammoseek.com/ammo/9mm?..." (working redirect to retailer listing)

const CALIBERS = [
  // Pistol / Handgun
  { slug: '9mm',             display: '9mm Luger',     unit: '115gr FMJ',   rssSeg: 'ammo/9mm',            priceFloor: 0.10, priceCeil: 0.50 },
  { slug: '45-acp',          display: '.45 ACP',       unit: '230gr FMJ',   rssSeg: 'ammo/45-acp',         priceFloor: 0.25, priceCeil: 0.85 },
  { slug: '40-sw',           display: '.40 S&W',       unit: '165gr FMJ',   rssSeg: 'ammo/40-sw',          priceFloor: 0.18, priceCeil: 0.70 },
  { slug: '380-acp',         display: '.380 ACP',      unit: '95gr FMJ',    rssSeg: 'ammo/380-acp',        priceFloor: 0.15, priceCeil: 0.65 },
  { slug: '357-magnum',      display: '.357 Magnum',   unit: '158gr JSP',   rssSeg: 'ammo/357-magnum',     priceFloor: 0.30, priceCeil: 1.20 },
  { slug: '44-magnum',       display: '.44 Magnum',    unit: '240gr JSP',   rssSeg: 'ammo/44-magnum',      priceFloor: 0.45, priceCeil: 1.60 },
  { slug: '10mm-auto',       display: '10mm Auto',     unit: '180gr FMJ',   rssSeg: 'ammo/10mm-auto',      priceFloor: 0.28, priceCeil: 0.90 },
  { slug: '57x28',           display: '5.7x28mm',      unit: '40gr V-Max',  rssSeg: 'ammo/57x28',          priceFloor: 0.30, priceCeil: 1.20 },
  // Rimfire
  { slug: '22-lr',           display: '.22 LR',        unit: '40gr',        rssSeg: 'ammo/22-lr',          priceFloor: 0.03, priceCeil: 0.18 },
  // Rifle — Common
  { slug: '223-remington',   display: '5.56 NATO',     unit: '55gr FMJ',    rssSeg: 'ammo/223-remington',  priceFloor: 0.20, priceCeil: 0.80 },
  { slug: '762x39',          display: '7.62x39mm',     unit: '123gr FMJ',   rssSeg: 'ammo/762x39',         priceFloor: 0.18, priceCeil: 0.70 },
  { slug: '308-winchester',  display: '.308 WIN',      unit: '147gr FMJ',   rssSeg: 'ammo/308-winchester', priceFloor: 0.45, priceCeil: 1.60 },
  { slug: '300-blackout',    display: '.300 BLK',      unit: '125gr FMJ',   rssSeg: 'ammo/300-blackout',   priceFloor: 0.30, priceCeil: 1.00 },
  // Precision / PRC Family
  { slug: '65-creedmoor',    display: '6.5 Creedmoor', unit: '140gr BTHP',  rssSeg: 'ammo/65-creedmoor',   priceFloor: 0.70, priceCeil: 2.50 },
  { slug: '65-prc',          display: '6.5 PRC',       unit: '143gr ELD-M', rssSeg: 'ammo/65-prc',         priceFloor: 1.00, priceCeil: 4.00 },
  { slug: '7mm-prc',         display: '7mm PRC',       unit: '175gr ELD-M', rssSeg: 'ammo/7mm-prc',        priceFloor: 1.20, priceCeil: 4.50 },
  { slug: '300-prc',         display: '.300 PRC',      unit: '225gr ELD-M', rssSeg: 'ammo/300-prc',        priceFloor: 1.40, priceCeil: 5.50 },
  // Magnum
  { slug: '300-win-mag',     display: '.300 Win Mag',  unit: '180gr SP',    rssSeg: 'ammo/300-win-mag',    priceFloor: 0.80, priceCeil: 3.50 },
  // Shotgun
  { slug: '12-gauge',        display: '12 Gauge',      unit: '00 Buck',     rssSeg: 'ammo/12-gauge',       priceFloor: 0.20, priceCeil: 1.00 },
]

// Known AmmoSeek vendor name patterns extracted from RSS titles
const VENDOR_PREFIXES = [
  'Lucky Gunner', 'Ammo.com', 'PSA', 'Palmetto State Armory',
  'Brownells', 'MidwayUSA', 'Midway USA', 'Cabela\'s', 'Cabelas',
  'Bass Pro', 'GrabAGun', 'Grab A Gun', 'AIM Surplus', 'Aim Surplus',
  'Ammunition Depot', 'Ammo Depot', 'SilencerShop', 'Silencer Shop',
  'Sportsman\'s Guide', 'Sportsmans Guide', 'Field Supply',
  'True Velocity', 'Buds Gun Shop', 'Bud\'s Gun Shop',
  'Cheaper Than Dirt', 'Natchez Shooters', 'Natchez',
  'Sportsman\'s Warehouse', 'Bulk Ammo', 'BulkAmmo',
  'Wideners', 'Freedom Munitions', 'SGAmmo', 'SG Ammo',
  'Ventura Munitions', 'Target Sports', 'TargetSports',
  'J&G Sales', 'Classic Firearms', 'Apex Gun Parts', 'Impact Guns',
]

function extractVendorFromTitle(title) {
  const t = title.trim()
  // Format: "Vendor Name - Product Description - $price/rd"
  // Try matching against known vendor list first
  for (const v of VENDOR_PREFIXES) {
    if (t.toLowerCase().startsWith(v.toLowerCase())) {
      return v
    }
  }
  // Fallback: grab everything before first " - "
  const dashIdx = t.indexOf(' - ')
  if (dashIdx > 0 && dashIdx < 40) {
    return t.slice(0, dashIdx).trim()
  }
  return null
}

function parsePricePerRound(title) {
  // "$0.189/rd" or "$0.189/round" or "18.9 cents/rd" or "18.9¢/rd"
  const m1 = title.match(/\$\s*([\d.]+)\s*\/\s*(?:rd|round|rnd)\b/i)
  if (m1) return parseFloat(m1[1])
  const m2 = title.match(/\b([\d.]+)\s*(?:cents?|¢)\s*\/\s*(?:rd|round|rnd)\b/i)
  if (m2) return parseFloat(m2[1]) / 100
  return null
}

// Fetch AmmoSeek RSS and return top N listings with vendor + price + url
async function fetchAmmoSeekListings(caliber, limit = 5) {
  try {
    const feed = await parser.parseURL(`https://www.ammoseek.com/${caliber.rssSeg}/rss`)
    const listings = []

    for (const item of feed.items) {
      if (listings.length >= limit * 3) break  // gather extras for filtering

      const title = decodeHtmlEntities(item.title || '').trim()
      const ppr = parsePricePerRound(title)
      if (!ppr) continue
      if (ppr < caliber.priceFloor || ppr > caliber.priceCeil) continue

      const vendor = extractVendorFromTitle(title)
      if (!vendor) continue

      // item.link is the AmmoSeek redirect URL — real, trackable, goes to retailer listing
      const url = item.link || `https://www.ammoseek.com/${caliber.rssSeg}`
      const inStock = !title.toLowerCase().includes('out of stock') &&
                      !title.toLowerCase().includes('backorder')

      listings.push({ vendor, price: Math.round(ppr * 10000) / 10000, url, inStock, label: title })
    }

    if (!listings.length) return null

    // Sort by price ascending, dedupe by vendor (keep cheapest per vendor)
    const byVendor = new Map()
    for (const l of listings.sort((a, b) => a.price - b.price)) {
      if (!byVendor.has(l.vendor)) byVendor.set(l.vendor, l)
    }

    const deduped = [...byVendor.values()].slice(0, limit)
    const prices  = deduped.map(l => l.price)
    const avg     = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length * 10000) / 10000

    return {
      avg,
      lowest:  prices[0],
      highest: prices[prices.length - 1],
      count:   listings.length,
      retailers: deduped,
    }
  } catch (err) {
    console.error(`[MARKET] AmmoSeek error (${caliber.slug}):`, err.message)
    return null
  }
}

async function runMarketFeed() {
  console.log('[MARKET] Starting market feed — 19 calibers...')
  const t = Date.now()
  let done = 0

  const results = await Promise.allSettled(CALIBERS.map(async caliber => {
    const data = await fetchAmmoSeekListings(caliber, 4)
    if (!data) return null

    await publishToSanity({
      _id:            `ammo-${caliber.slug}`,
      _type:          'ammoPrice',
      caliber:        caliber.display,
      caliberSlug:    caliber.slug,
      pricePerRound:  data.avg,
      unit:           caliber.unit,
      trendPercent:   0,
      trendDirection: 'flat',
      availabilityIndex: Math.min(100, data.count * 10),
      lowestPrice:    data.lowest,
      highestPrice:   data.highest,
      sampleSize:     data.count,
      bestVendor:     data.retailers[0]?.vendor || null,
      bestPrice:      data.retailers[0]?.price  || null,
      bestUrl:        data.retailers[0]?.url    || null,
      retailers:      data.retailers.map(r => ({
        _type:   'object',
        _key:    r.vendor.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20),
        vendor:  r.vendor,
        price:   r.price,
        url:     r.url,
        inStock: r.inStock,
        label:   r.label.slice(0, 120),
      })),
      lastUpdated: new Date().toISOString(),
    })

    console.log(`[MARKET] ${caliber.display}: avg $${data.avg.toFixed(3)}/rd | best: ${data.retailers[0]?.vendor} $${data.retailers[0]?.price}/rd | ${data.retailers.length} retailers`)
    return caliber.display
  }))

  done = results.filter(r => r.status === 'fulfilled' && r.value).length
  console.log(`[MARKET] Done. ${done}/${CALIBERS.length} calibers updated. ${Date.now() - t}ms`)
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
      const _ytParams = new URLSearchParams({ part: 'snippet', channelId: channel.id, order: 'date', maxResults: '5', type: 'video', key: process.env.YOUTUBE_API_KEY })
      const _ytR = await fetch('https://www.googleapis.com/youtube/v3/search?' + _ytParams, { signal: AbortSignal.timeout(15000) })
      if (!_ytR.ok) throw new Error(_ytR.statusText)
      const res = { data: await _ytR.json() }
      for (const item of res.data.items || []) {
        const sn = item.snippet
        await publishToSanity({
          _id: `video-${item.id.videoId}`, _type: 'video',
          title: decodeHtmlEntities(sn.title), videoId: item.id.videoId,
          channelName: channel.name, channelId: channel.id,
          thumbnailUrl: sn.thumbnails?.high?.url, category: 'review',
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
