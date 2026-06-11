export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
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

// Full browser UA — confirmed working against gun.deals
const SCRAPE_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

async function scrapeOGImage(url) {
  try {
    const res = await fetch(url, {
      headers: SCRAPE_HEADERS,
      signal: AbortSignal.timeout(15000),  // increased from 10s → 15s
    })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/<meta[\s\S]*?property=["']og:image["'][\s\S]*?content=["']([^"']+)["']/i)
           || html.match(/<meta[\s\S]*?content=["']([^"']+)["'][\s\S]*?property=["']og:image["']/i)
    return m ? m[1].trim() : null
  } catch (_e) { return null }
}

// Scrape images sequentially in small batches (reduced from 5→3 concurrent to avoid rate limits)
async function scrapeImages(urls, concurrency = 3) {
  const results = new Map()
  const chunks = []
  for (let i = 0; i < urls.length; i += concurrency)
    chunks.push(urls.slice(i, i + concurrency))
  for (const chunk of chunks) {
    const settled = await Promise.allSettled(
      chunk.map(async (url) => ({ url, img: await scrapeOGImage(url) }))
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

    // Dedup
    const existing = await sanity.fetch(
      '*[_type=="gunDeal" && source=="gun.deals"]{externalUrl}'
    ).catch(() => [])
    const existingUrls = new Set((existing || []).map(d => d.externalUrl))

    const newDeals = deals.slice(0, 80).filter(d => !existingUrls.has(d.link))
    stats.skipped  = deals.slice(0, 80).length - newDeals.length

    if (newDeals.length > 0) {
      // Scrape OG images (3 concurrent, 15s timeout)
      const imageMap = await scrapeImages(newDeals.map(d => d.link), 3)
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

    // ── SELF-HEAL: backfill any gunDeal docs missing imageUrl (up to 30 per run) ──
    // Catches docs that were inserted with null imageUrl due to scrape failures
    const needsImage = await sanity.fetch(
      `*[_type=="gunDeal" && source=="gun.deals" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(_createdAt desc) [0..29] { _id, externalUrl }`
    ).catch(() => [])

    if (needsImage.length > 0) {
      const healUrls = needsImage.filter(d => d.externalUrl).map(d => d.externalUrl)
      const healMap  = await scrapeImages(healUrls, 3)
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
