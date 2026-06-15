export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
const sanity = createClient({
  projectId: PROJECT_ID,
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

const GUN_DEALS_URLS = [
  'https://gun.deals/feed/syndication/rss',
  'https://gun.deals/rss.xml',
  'https://gun.deals/feed',
  'https://gun.deals/rss',
  'https://gun.deals/feed.rss',
]

async function fetchRSS() {
  for (const url of GUN_DEALS_URLS) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
        signal: AbortSignal.timeout(12000),
      })
      if (res.ok) return res.text()
    } catch (_e) { /* try next */ }
  }
  throw new Error('gun.deals: all RSS URLs failed')
}

function parseRSS(xml) {
  const items = []
  const itemRe = /<item>([\s\S]*?)<\/item>/gi
  let m
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1]
    const get = (tag) => {
      const r = block.match(new RegExp('<' + tag + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + tag + '>'))
             || block.match(new RegExp('<' + tag + '[^>]*>([^<]*)<\\/' + tag + '>'))
      return r ? r[1].trim() : ''
    }
    const title = get('title'), link = get('link') || get('guid')
    const desc  = get('description'), date = get('pubDate')
    const cats  = [...block.matchAll(/<category[^>]*>([^<]+)<\/category>/gi)].map(c => c[1].trim())
    const price = title.match(/\$[\d,]+(?:\.\d{2})?/) ? title.match(/\$[\d,]+(?:\.\d{2})?/)[0]
                : desc.match(/\$[\d,]+(?:\.\d{2})?/)?.[0] || ''
    const store = desc.match(/Store: <a[^>]*>([^<]+)<\/a>/)?.[1] || ''
    if (!title || !link) continue
    items.push({ title, link, desc, date, price, cats, store })
  }
  return items
}

const SCRAPE_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

const IMG_HEADERS = {
  'User-Agent':  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer':     'https://gun.deals/',
  'Accept':      'image/webp,image/apng,image/*,*/*',
}

// Scrape OG image URL from a gun.deals product page
// gun.deals serves og:image via Cloudflare image transforms (/cdn-cgi/image/)
// We extract the underlying /sites/default/files/ URL for direct download
async function scrapeOGImage(url) {
  try {
    const res = await fetch(url, { headers: SCRAPE_HEADERS, signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/<meta[\s\S]*?property=["']og:image["'][\s\S]*?content=["']([^"']+)["']/i)
           || html.match(/<meta[\s\S]*?content=["']([^"']+)["'][\s\S]*?property=["']og:image["']/i)
    if (!m) {
      // Fallback: look for structured data or direct img tags with product images
      const imgMatch = html.match(/sites\/default\/files\/[^"'\s]+\.(jpg|jpeg|png|webp|gif)/i)
      if (imgMatch) return 'https://gun.deals/' + imgMatch[0]
      return null
    }
    let imgUrl = m[1].trim()
    // gun.deals wraps images in Cloudflare image transforms — extract underlying URL
    const cdnCgiMatch = imgUrl.match(/\/cdn-cgi\/image\/[^\/]+\/(.+)/)
    if (cdnCgiMatch) {
      // Reconstruct the direct image URL
      const origin = new URL(imgUrl).origin
      imgUrl = origin + '/' + cdnCgiMatch[1]
    }
    return imgUrl
  } catch { return null }
}

// Download image bytes from gun.deals CDN (needs Referer header)
async function downloadImage(url) {
  try {
    const res = await fetch(url, { headers: IMG_HEADERS, signal: AbortSignal.timeout(15000) })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const ct  = res.headers.get('content-type') || 'image/jpeg'
    return { buf, ct }
  } catch { return null }
}

// Upload image to Sanity CDN — returns stable cdn.sanity.io URL
async function uploadToSanity(buf, contentType, filename) {
  try {
    const ext = contentType.includes('webp') ? 'webp'
              : contentType.includes('png')  ? 'png'
              : contentType.includes('gif')  ? 'gif' : 'jpg'
    const safeName = (filename || 'deal').replace(/[^\w.-]/g, '_').slice(0, 60) + '.' + ext
    const token = process.env.SANITY_API_TOKEN
    const res = await fetch(
      `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/production`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${safeName}"`,
        },
        body: buf,
        signal: AbortSignal.timeout(20000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.document?.url || null
  } catch { return null }
}

// Full pipeline: scrape OG URL → download → upload to Sanity CDN
// Returns a stable cdn.sanity.io URL, or falls back to the gun.deals URL (proxy will handle it)
async function getStableImageUrl(pageUrl) {
  const ogUrl = await scrapeOGImage(pageUrl)
  if (!ogUrl) return null

  // Try to upload to Sanity for a stable URL
  const img = await downloadImage(ogUrl)
  if (img && img.buf) {
    const filename = ogUrl.split('/').pop()?.split('?')[0] || 'deal'
    const sanityUrl = await uploadToSanity(img.buf, img.ct, filename)
    if (sanityUrl) return sanityUrl
  }

  // Fall back to the gun.deals URL (proxy handles it at serve time)
  return ogUrl
}

// Process URLs in small batches
async function processImages(urls, concurrency = 3) {
  const results = new Map()
  for (let i = 0; i < urls.length; i += concurrency) {
    const chunk = urls.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      chunk.map(async (url) => ({ url, img: await getStableImageUrl(url) }))
    )
    for (const r of settled)
      if (r.status === 'fulfilled') results.set(r.value.url, r.value.img)
  }
  return results
}

function detectCategory(title, cats = []) {
  const t = (title + ' ' + cats.join(' ')).toLowerCase()
  if (/ammo|9mm|rounds|\.223|5\.56|bulk|cartridge|grain|fmj|jhp|hst/.test(t)) return 'ammo'
  if (/ar-15|ar15|rifle|ak-47|carbine|sbr|nato|5\.56|300 blk/.test(t)) return 'rifle'
  if (/pistol|glock|handgun|sig |p365|p320|1911|revolver|hk|beretta|kimber/.test(t)) return 'pistol'
  if (/shotgun|gauge|mossberg|remington/.test(t)) return 'shotgun'
  if (/suppressor|silencer|nfa/.test(t)) return 'suppressor'
  if (/optic|scope|red dot|lpvo|sight|eotech|vortex|leupold/.test(t)) return 'optic'
  if (/holster|magazine|mag |parts|trigger|light|sling|grip/.test(t)) return 'accessory'
  return 'deal'
}

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth       = req.headers.get('authorization')
  const adminKey   = req.headers.get('x-admin-key')
  const isCron     = cronSecret && auth === 'Bearer ' + cronSecret
  const isAdmin    = adminKey === ADMIN_KEY
  if (!isCron && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0    = Date.now()
  const stats = { fetched: 0, added: 0, skipped: 0, imaged: 0, healed: 0 }

  try {
    const xml   = await fetchRSS()
    const deals = parseRSS(xml)
    stats.fetched = deals.length

    const existing = await sanity.fetch(
      '*[_type=="gunDeal" && source=="gun.deals"]{externalUrl}'
    ).catch(() => [])
    const existingUrls = new Set((existing || []).map(d => d.externalUrl))

    const newDeals = deals.slice(0, 80).filter(d => !existingUrls.has(d.link))
    stats.skipped  = deals.slice(0, 80).length - newDeals.length

    if (newDeals.length > 0) {
      // Scrape + upload images to Sanity CDN (3 concurrent)
      const imageMap = await processImages(newDeals.map(d => d.link), 3)
      stats.imaged = [...imageMap.values()].filter(Boolean).length

      const mutations = newDeals.map(deal => ({
        create: {
          _type:       'gunDeal',
          title:       deal.title,
          summary:     `${deal.price ? deal.price + ' · ' : ''}${deal.store ? 'at ' + deal.store : ''}`.trim() || (deal.desc || '').slice(0, 200),
          externalUrl: deal.link,
          source:      'gun.deals',
          category:    detectCategory(deal.title, deal.cats),
          approved:    true,
          publishedAt: deal.date ? new Date(deal.date).toISOString() : new Date().toISOString(),
          imageUrl:    imageMap.get(deal.link) || null,
          tags:        ['deals', 'gun.deals', detectCategory(deal.title, deal.cats)],
          price:       deal.price,
          store:       deal.store,
        }
      }))

      await sanity.mutate(mutations)
      stats.added = mutations.length
    }

    // ── SELF-HEAL: backfill any docs still missing imageUrl (up to 30 per run) ──
    const needsImage = await sanity.fetch(
      `*[_type=="gunDeal" && source=="gun.deals" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(_createdAt desc) [0..29] { _id, externalUrl }`
    ).catch(() => [])

    if (needsImage.length > 0) {
      const healUrls = needsImage.filter(d => d.externalUrl).map(d => d.externalUrl)
      const healMap  = await processImages(healUrls, 3)
      const healMuts = needsImage
        .filter(d => d.externalUrl && healMap.get(d.externalUrl))
        .map(d => ({ patch: { id: d._id, set: { imageUrl: healMap.get(d.externalUrl) } } }))
      if (healMuts.length > 0) {
        await sanity.mutate(healMuts)
        stats.healed = healMuts.length
      }
    }

    return NextResponse.json({ ok: true, ms: Date.now() - t0, ...stats })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
