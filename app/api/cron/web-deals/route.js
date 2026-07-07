export const dynamic    = 'force-dynamic'
export const maxDuration = 300

/**
 * Web deals scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Scrapes deal/sale pages from retailers and manufacturers NOT covered by
 * gun.deals RSS or the Amazon pipeline. Each source uses direct HTML fetch
 * with realistic browser headers (no Jina — these sites don't block crawlers
 * the way Amazon does). Jina used as fallback if direct fetch fails.
 *
 * Sources:
 *   Brownells Daily Deals       brownells.com/daily-deals
 *   PSA Flash Sales             palmettostatearmory.com/deals
 *   Natchez Shooters Supply     natchezss.com/on-sale
 *   Olight Flash Sale           olight.com/flash-sale
 *   Primary Arms Sale           primaryarms.com/department/sales
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse }        from 'next/server'
import { createClient }        from '@sanity/client'
import { reportCronRun }       from '@/lib/cronReporter'
import { uploadImageToSanity } from '@/lib/imageUpload'

const ADMIN_KEY  = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'

const sanity = createClient({
  projectId:  PROJECT_ID,
  dataset:    'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN,
  useCdn:     false,
})

// ── Deal sources ──────────────────────────────────────────────────────────────
const SOURCES = [
  {
    id:     'brownells-daily',
    label:  'Brownells Daily Deals',
    store:  'Brownells',
    url:    'https://www.brownells.com/daily-deals/',
    cat:    'accessory',
    parse:  parseBrownells,
  },
  {
    id:     'psa-deals',
    label:  'PSA Flash Sales',
    store:  'Palmetto State Armory',
    url:    'https://palmettostatearmory.com/deals.html',
    cat:    'rifle',
    parse:  parsePSA,
  },
  {
    id:     'natchez-sale',
    label:  'Natchez Shooters Supply',
    store:  'Natchez Shooters Supply',
    url:    'https://www.natchezss.com/on-sale.html',
    cat:    'accessory',
    parse:  parseNatchez,
  },
  {
    id:     'olight-flash',
    label:  'Olight Flash Sale',
    store:  'Olight',
    url:    'https://www.olight.com/flash-sale.html',
    cat:    'accessory',
    parse:  parseOlight,
  },
]

// ── Generic HTML fetch (direct → Jina fallback) ───────────────────────────────
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchHtml(url) {
  // Direct fetch first
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':      BROWSER_UA,
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control':   'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) {
      const html = await res.text()
      if (html.length > 2000 && !html.includes('cf-browser-verification')) return html
    }
  } catch {}

  // Jina fallback (handles bot-detection redirects)
  try {
    const headers = {
      'User-Agent':     BROWSER_UA,
      'x-respond-with': 'html',
      'Accept':         'text/html',
    }
    if (process.env.JINA_API_KEY) headers['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY
    const res = await fetch('https://r.jina.ai/' + url, { headers, signal: AbortSignal.timeout(20000) })
    if (res.ok) {
      const html = await res.text()
      if (html.length > 2000) return html
    }
  } catch {}

  return null
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function extractPrice(text = '') {
  const m = text.match(/\$[\d,]+(?:\.\d{2})?/)
  return m ? m[0] : null
}

function detectCat(title = '') {
  const t = title.toLowerCase()
  if (/ammo|rounds|grain|fmj|hollow/.test(t))                          return 'ammo'
  if (/rifle|ar-?15|ak|carbine/.test(t))                               return 'rifle'
  if (/pistol|handgun|glock|sig|1911/.test(t))                         return 'pistol'
  if (/shotgun|mossberg|remington/.test(t))                            return 'shotgun'
  if (/suppressor|silencer|nfa/.test(t))                               return 'suppressor'
  if (/scope|optic|red dot|eotech|vortex|holosun|aimpoint/.test(t))   return 'optic'
  if (/flashlight|weapon light|olight|streamlight/.test(t))            return 'accessory'
  return null // use source default
}

// ── Site-specific parsers ─────────────────────────────────────────────────────
// Each returns an array of { title, url, price, imageUrl, cat }

function parseBrownells(html) {
  const items = []
  // Brownells product cards: <a href="/..."><img ... alt="Product Name">/...$XX.XX
  // Look for product links with prices
  const linkRe = /<a[^>]+href="(\/[^"]*)"[^>]*>(?:[\s\S]*?<img[^>]+alt="([^"]+)"[\s\S]*?)?<\/a>/gi
  const priceRe = /\$[\d,]+\.\d{2}/g
  // Simpler approach: find product title + price + image patterns in the HTML
  // Brownells uses structured JSON-LD or product schema
  const ldMatch = html.match(/"@type"\s*:\s*"Product"[\s\S]*?"name"\s*:\s*"([^"]+)"[\s\S]*?"price"\s*:\s*"([^"]+)"[\s\S]*?"image"\s*:\s*"([^"]+)"/g)
  if (ldMatch) {
    for (const block of ldMatch.slice(0, 20)) {
      const name  = block.match(/"name"\s*:\s*"([^"]+)"/)?.[1]
      const price = block.match(/"price"\s*:\s*"([^"]+)"/)?.[1]
      const img   = block.match(/"image"\s*:\s*"([^"]+)"/)?.[1]
      if (name && price) items.push({ title: name, price: `$${price}`, imageUrl: img || null, url: null })
    }
    return items
  }
  // Fallback: grab product names from alt text near prices
  const altRe = /<img[^>]+alt="([^"]{10,100})"[^>]*>/gi
  let m
  while ((m = altRe.exec(html)) !== null && items.length < 20) {
    const title = m[1].trim()
    if (!title || /logo|banner|icon/i.test(title)) continue
    // Look for a price near this element
    const nearby = html.slice(Math.max(0, m.index - 200), m.index + 500)
    const price  = extractPrice(nearby)
    if (!price) continue
    items.push({ title, price, imageUrl: null, url: null })
  }
  return items
}

function parsePSA(html) {
  const items = []
  // PSA deal pages list products with prices in structured HTML
  // Look for product titles (h2/h3/span with product name class) + price spans
  const blockRe = /<div[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
  let m
  while ((m = blockRe.exec(html)) !== null && items.length < 30) {
    const block = m[1]
    const titleM = block.match(/<(?:h[123]|span|a)[^>]*class="[^"]*(?:name|title)[^"]*"[^>]*>([^<]+)</)
              || block.match(/<a[^>]*>([^<]{10,100})<\/a>/)
    const priceM = block.match(/\$[\d,]+\.\d{2}/)
    const imgM   = block.match(/<img[^>]+src="(https?:[^"]+)"/)
    if (titleM && priceM) {
      items.push({
        title:    titleM[1].trim(),
        price:    priceM[0],
        imageUrl: imgM ? imgM[1] : null,
        url:      null,
      })
    }
  }
  return items
}

function parseNatchez(html) {
  const items = []
  // Natchez uses standard product grid with data-* attributes or structured HTML
  const productRe = /<article[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
  let m
  while ((m = productRe.exec(html)) !== null && items.length < 25) {
    const block = m[1]
    const titleM = block.match(/<h[23][^>]*>([^<]{10,100})</)
    const priceM = block.match(/\$[\d,]+\.\d{2}/)
    const imgM   = block.match(/<img[^>]+src="(https?:[^"]+)"/)
    const hrefM  = block.match(/<a[^>]+href="(https?:[^"]+)"/)
    if (titleM && priceM) {
      items.push({
        title:    titleM[1].trim(),
        price:    priceM[0],
        imageUrl: imgM ? imgM[1] : null,
        url:      hrefM ? hrefM[1] : null,
      })
    }
  }
  return items
}

function parseOlight(html) {
  const items = []
  // Olight flash sale page uses product cards with JSON data or structured divs
  // Try JSON-LD first
  const jsonBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || []
  for (const block of jsonBlocks) {
    try {
      const json = JSON.parse(block.replace(/<\/?script[^>]*>/g, '').trim())
      const products = json['@graph']
        ? json['@graph'].filter(x => x['@type'] === 'Product')
        : (json['@type'] === 'Product' ? [json] : [])
      for (const p of products.slice(0, 15)) {
        const price = p.offers?.price || p.offers?.[0]?.price
        items.push({
          title:    p.name,
          price:    price ? `$${price}` : null,
          imageUrl: Array.isArray(p.image) ? p.image[0] : p.image,
          url:      p.offers?.url || p.offers?.[0]?.url || null,
        })
      }
    } catch {}
  }
  if (items.length > 0) return items

  // Fallback: parse product cards
  const cardRe = /<div[^>]*class="[^"]*(?:product-item|flash-item)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi
  let m
  while ((m = cardRe.exec(html)) !== null && items.length < 20) {
    const block = m[1]
    const titleM = block.match(/<[^>]*class="[^"]*(?:name|title)[^"]*"[^>]*>([^<]{5,100})</)
    const priceM = block.match(/\$[\d.]+/)
    const imgM   = block.match(/<img[^>]+src="(https?:[^"]+)"/)
    const hrefM  = block.match(/<a[^>]+href="(https?:[^"]+)"/)
    if (titleM && priceM) {
      items.push({
        title:    titleM[1].trim(),
        price:    priceM[0],
        imageUrl: imgM ? imgM[1] : null,
        url:      hrefM ? hrefM[1] : null,
      })
    }
  }
  return items
}

// ── Deal dedup by URL hash ────────────────────────────────────────────────────
function urlTag(url = '', source = '') {
  const clean = url.replace(/[?#].*$/, '').toLowerCase().trim()
  // Simple 8-char hash from URL
  let h = 0
  for (const c of clean) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
  return `${source}:${Math.abs(h).toString(36)}`
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth       = req.headers.get('authorization')
  const adminKey   = req.headers.get('x-admin-key')
  const isCron     = cronSecret && auth === `Bearer ${cronSecret}`
  const isVercel   = req.headers.get('x-vercel-cron') === '1'
  const isAdmin    = adminKey === ADMIN_KEY

  if (!isCron && !isVercel && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const srcFilter = searchParams.get('source')
  const sources   = srcFilter ? SOURCES.filter(s => s.id === srcFilter) : SOURCES

  const t0       = Date.now()
  const DEADLINE = 240_000
  const stats    = { sources: 0, found: 0, added: 0, skipped: 0, imaged: 0 }

  try {
    // Load existing web-deal URL tags to dedup
    const existingDocs = await sanity.fetch(
      `*[_type == "gunDeal" && source in ["brownells","psa","natchez","olight-web"]] { tags }`,
      {}
    ).catch(() => [])
    const existingTags = new Set(
      existingDocs.flatMap(d => d.tags || []).filter(t => t.includes(':'))
    )

    for (const src of sources) {
      if (Date.now() - t0 > DEADLINE) break
      stats.sources++
      await new Promise(r => setTimeout(r, 1500))

      const html = await fetchHtml(src.url)
      if (!html) { console.error(`[web-deals] ${src.id}: fetch failed`); continue }

      let items = []
      try { items = src.parse(html) } catch (e) {
        console.error(`[web-deals] ${src.id} parse error:`, e.message)
        continue
      }
      stats.found += items.length

      const mutations = []
      for (const item of items) {
        if (!item.title || item.title.length < 8) continue

        // Build a dedup tag from URL or title
        const tag = item.url ? urlTag(item.url, src.id) : urlTag(item.title, src.id)
        if (existingTags.has(tag)) { stats.skipped++; continue }
        existingTags.add(tag)

        // Canonicalize URL — use source homepage if no product URL found
        const dealUrl = item.url || src.url

        // Upload image
        let sanityImg = null
        if (item.imageUrl) {
          sanityImg = await uploadImageToSanity(item.imageUrl, `${src.id}-${tag}`).catch(() => null)
          if (sanityImg) stats.imaged++
          await new Promise(r => setTimeout(r, 300))
        }

        const cat = (item.cat && item.cat !== 'inherit')
          ? item.cat
          : (detectCat(item.title) || src.cat)

        mutations.push({
          create: {
            _type:       'gunDeal',
            title:       item.title.slice(0, 200),
            externalUrl: dealUrl,
            source:      src.id.split('-')[0],   // 'brownells', 'psa', 'natchez', 'olight'
            store:       src.store,
            price:       item.price || '',
            category:    cat,
            summary:     [item.price, src.store].filter(Boolean).join(' · '),
            imageUrl:    sanityImg || null,
            approved:    true,
            publishedAt: new Date().toISOString(),
            tags:        [src.id.split('-')[0], tag, cat],
          },
        })
        stats.added++
      }

      for (let i = 0; i < mutations.length; i += 100) {
        await sanity.mutate(mutations.slice(i, i + 100))
      }
    }

    const ms = Date.now() - t0
    await reportCronRun('web-deals', {
      status: 'success', ms,
      details: `sources:${stats.sources} found:${stats.found} added:${stats.added} skipped:${stats.skipped} imaged:${stats.imaged}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true, ms, ...stats })

  } catch (err) {
    console.error('[web-deals] fatal:', err.message)
    await reportCronRun('web-deals', { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
