export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

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

function decodeEntities(s = '') {
  if (!s) return s
  const named = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", '#39':"'", nbsp:' ', ndash:'–', mdash:'—', hellip:'…', rsquo:'’', lsquo:'‘', ldquo:'“', rdquo:'”', trade:'™', reg:'®', copy:'©', deg:'°' }
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9#]+);/gi, (m, e) => (named[e.toLowerCase()] !== undefined ? named[e.toLowerCase()] : m))
    .trim()
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
    const title = decodeEntities(get('title')), link = get('link') || get('guid')
    const desc  = decodeEntities(get('description')), date = get('pubDate')
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
    // gun.deals wraps images in Cloudflare image transforms, e.g.:
    //   https://gun.deals/cdn-cgi/image/format=auto,width=800/https://gun.deals/sites/default/files/foo.jpg
    //   https://gun.deals/cdn-cgi/image/f=auto/sites/default/files/foo.jpg
    // The capture group after the transform params may be:
    //   (a) a full https:// URL  → use as-is
    //   (b) a root-relative path → prepend gun.deals origin
    const cdnCgiMatch = imgUrl.match(/\/cdn-cgi\/image\/[^\/]+\/(.+)/)
    if (cdnCgiMatch) {
      const downstream = cdnCgiMatch[1]
      if (downstream.startsWith('http://') || downstream.startsWith('https://')) {
        imgUrl = downstream  // already a full URL
      } else {
        imgUrl = 'https://gun.deals/' + downstream.replace(/^\//, '')
      }
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

const DEAL_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

// gun.deals product pages 403 datacenter IPs (Cloudflare). We fetch the page
// through the Jina reader proxy, which returns the real HTML, then pull the
// actual product og:image — a gun.deals CDN url that IS directly downloadable.
async function scrapeOGImageViaJina(pageUrl) {
  try {
    const headers = { 'User-Agent': DEAL_UA, 'x-respond-with': 'html', 'Accept': 'text/html' }
    if (process.env.JINA_API_KEY) headers['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY
    const res = await fetch('https://r.jina.ai/' + pageUrl, { headers, signal: AbortSignal.timeout(25000) })
    if (!res.ok) return null
    const html = await res.text()
    const og = (html.match(/og:image["'\s]+content=["']([^"']+)["']/i) || [])[1]
      || (html.match(/(https?:\/\/gun\.deals\/cdn-cgi\/image\/[^\s"')]+\.(?:jpg|jpeg|png|webp)[^\s"')]*)/i) || [])[1]
      || (html.match(/(https?:\/\/gun\.deals\/[^\s"')]*sites\/default\/files\/[^\s"')]+\.(?:jpg|jpeg|png|webp))/i) || [])[1]
    return og || null
  } catch { return null }
}

// One deal → the REAL source image on Sanity CDN. No stock fallback: a
// placeholder is better than a wrong photo, so return null if unreachable.
async function getDealImage(deal) {
  const ogUrl = await scrapeOGImageViaJina(deal.link)
  if (!ogUrl) return null
  const img = await downloadImage(ogUrl)
  if (!img || !img.buf || img.buf.byteLength < 8000) return null  // reject logos / tiny fallbacks
  const filename = ogUrl.split('/').pop()?.split('?')[0] || 'deal'
  return await uploadToSanity(img.buf, img.ct, filename)
}

// Process deals in small batches. Each deal: { link, title, category }
async function processImages(deals, concurrency = 1) {
  const results = new Map()
  for (let i = 0; i < deals.length; i += concurrency) {
    const chunk = deals.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      chunk.map(async (d) => ({ link: d.link, img: await getDealImage(d) }))
    )
    for (const r of settled)
      if (r.status === 'fulfilled') results.set(r.value.link, r.value.img)
    if (i + concurrency < deals.length) await new Promise(r => setTimeout(r, 1200))  // stay under Jina rate limit
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
  const isVercel   = req.headers.get('x-vercel-cron') === '1'
  const isAdmin    = adminKey === ADMIN_KEY
  if (!isCron && !isVercel && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Re-sync: overwrite imageUrl on the N most-recent deals with the REAL source
  // image (used to fix deals that were previously given wrong/stock images).
  const sp = new URL(req.url).searchParams
  const resyncN = parseInt(sp.get('resync') || '0', 10)
  if (resyncN > 0) {
    const tr = Date.now()
    const off = parseInt(sp.get('offset') || '0', 10)
    const n = Math.min(resyncN, 30)
    const recent = await sanity.fetch(
      `*[_type=="gunDeal" && source=="gun.deals"] | order(_createdAt desc) [${off}...${off + n}] { _id, externalUrl }`
    ).catch(() => [])
    const dealsR = recent.filter(d => d.externalUrl).map(d => ({ link: d.externalUrl }))
    const mapR   = await processImages(dealsR, 1)
    const mutsR  = recent
      .filter(d => d.externalUrl && mapR.get(d.externalUrl))
      .map(d => ({ patch: { id: d._id, set: { imageUrl: mapR.get(d.externalUrl) } } }))
    if (mutsR.length) await sanity.mutate(mutsR)
    return NextResponse.json({ ok: true, resync: true, checked: recent.length, repatched: mutsR.length, ms: Date.now() - tr })
  }

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
      // Fetch real source images via Jina proxy → Sanity CDN (2 concurrent)
      const imageMap = await processImages(
        newDeals.map(d => ({ link: d.link, title: d.title, category: detectCategory(d.title, d.cats) })),
        1
      )
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

    // ── SELF-HEAL: backfill any docs still missing imageUrl (up to 25 per run) ──
    const needsImage = await sanity.fetch(
      `*[_type=="gunDeal" && source=="gun.deals" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(_createdAt desc) [0..24] { _id, externalUrl, title, category }`
    ).catch(() => [])

    if (needsImage.length > 0) {
      const healDeals = needsImage
        .filter(d => d.externalUrl)
        .map(d => ({ link: d.externalUrl, title: d.title, category: d.category || detectCategory(d.title || '') }))
      const healMap = await processImages(healDeals, 1)
      const healMuts = needsImage
        .filter(d => d.externalUrl && healMap.get(d.externalUrl))
        .map(d => ({ patch: { id: d._id, set: { imageUrl: healMap.get(d.externalUrl) } } }))
      if (healMuts.length > 0) {
        await sanity.mutate(healMuts)
        stats.healed = healMuts.length
      }
    }

    const ms = Date.now() - t0
    await reportCronRun('gun-deals', {
      status: 'success', ms,
      details: `fetched:${stats.fetched} added:${stats.added} skipped:${stats.skipped} healed:${stats.healed} imaged:${stats.imaged}`,
    }).catch(() => {})
    return NextResponse.json({ ok: true, ms, ...stats })
  } catch (err) {
    await reportCronRun('gun-deals', { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
