export const dynamic    = 'force-dynamic'
export const maxDuration = 300

/**
 * Web deals scraper — visits actual product pages for reliable URLs and images
 * ─────────────────────────────────────────────────────────────────────────────
 * Sources: Brownells Daily Deals · PSA Flash Sales · Natchez Shooters Supply
 *          · Olight Flash Sale · Primary Arms Sale
 *
 * Strategy: fetch each source's deals page → extract product links →
 * visit each product page for OG title + image + price → store as gunDeal.
 * Only saves deals with a specific product URL (no source-page fallbacks).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse }             from 'next/server'
import { createClient }             from '@sanity/client'
import { reportCronRun }            from '@/lib/cronReporter'
import { scrapeProductPage }        from '@/lib/scrapeProductImage'
import { uploadImageToSanity }      from '@/lib/imageUpload'

const ADMIN_KEY  = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'

const sanity = createClient({
  projectId:  PROJECT_ID,
  dataset:    'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN,
  useCdn:     false,
})

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ── Deal sources ──────────────────────────────────────────────────────────────
const SOURCES = [
  {
    id:       'brownells',
    store:    'Brownells',
    dealPage: 'https://www.brownells.com/daily-deals/',
    domain:   'brownells.com',
    cat:      'accessory',
    // Extract product links from the deals page
    extractLinks(html) {
      const links = []
      const re = /href="(https?:\/\/(?:www\.)?brownells\.com\/[^"?#]+(?:\/\d+\.aspx|\/[^"?#]+\.aspx)[^"]*)"/gi
      let m
      while ((m = re.exec(html)) !== null && links.length < 12) {
        const url = m[1]
        if (!links.includes(url) && !url.includes('/search') && !url.includes('/department')) links.push(url)
      }
      return links
    },
  },
  {
    id:       'psa',
    store:    'Palmetto State Armory',
    dealPage: 'https://palmettostatearmory.com/deals.html',
    domain:   'palmettostatearmory.com',
    cat:      'rifle',
    extractLinks(html) {
      const links = []
      const re = /href="(https?:\/\/(?:www\.)?palmettostatearmory\.com\/[a-z0-9-]+\.html[^"]*)"/gi
      let m
      while ((m = re.exec(html)) !== null && links.length < 12) {
        const url = m[1]
        if (!links.includes(url) && !url.includes('/deals.html') && !url.includes('/category')) links.push(url)
      }
      return links
    },
  },
  {
    id:       'natchez',
    store:    'Natchez Shooters Supply',
    dealPage: 'https://www.natchezss.com/on-sale.html',
    domain:   'natchezss.com',
    cat:      'accessory',
    extractLinks(html) {
      const links = []
      const re = /href="(https?:\/\/(?:www\.)?natchezss\.com\/[^"?#]+)"/gi
      let m
      while ((m = re.exec(html)) !== null && links.length < 12) {
        const url = m[1]
        if (!links.includes(url) && !url.includes('/on-sale') && url.match(/\/[a-z0-9-]{5,}$/)) links.push(url)
      }
      return links
    },
  },
  {
    id:       'olight',
    store:    'Olight',
    dealPage: 'https://www.olight.com/flash-sale.html',
    domain:   'olight.com',
    cat:      'accessory',
    extractLinks(html) {
      const links = []
      // Olight product links: /store/product-name.html
      const re = /href="(https?:\/\/(?:www\.)?olight\.com\/store\/[^"?#]+)"/gi
      let m
      while ((m = re.exec(html)) !== null && links.length < 10) {
        const url = m[1]
        if (!links.includes(url)) links.push(url)
      }
      return links
    },
  },
  {
    id:       'primary-arms',
    store:    'Primary Arms',
    dealPage: 'https://www.primaryarms.com/department/sales',
    domain:   'primaryarms.com',
    cat:      'optic',
    extractLinks(html) {
      const links = []
      const re = /href="(https?:\/\/(?:www\.)?primaryarms\.com\/[a-z0-9-]+-\d+\.html[^"]*)"/gi
      let m
      while ((m = re.exec(html)) !== null && links.length < 12) {
        const url = m[1]
        if (!links.includes(url)) links.push(url)
      }
      return links
    },
  },
]

// ── Fetch HTML from a deals page ──────────────────────────────────────────────
async function fetchPage(url) {
  // Direct fetch
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) {
      const html = await res.text()
      if (html.length > 3000 && !/cf-browser-verification/i.test(html)) return html
    }
  } catch {}

  // Jina fallback
  try {
    const h = { 'User-Agent': UA, 'x-respond-with': 'html', 'Accept': 'text/html' }
    if (process.env.JINA_API_KEY) h['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY
    const res = await fetch('https://r.jina.ai/' + url, { headers: h, signal: AbortSignal.timeout(20000) })
    if (res.ok) {
      const html = await res.text()
      if (html.length > 3000) return html
    }
  } catch {}

  return null
}

// ── Category detection ────────────────────────────────────────────────────────
function detectCat(title = '', fallback = 'accessory') {
  const t = title.toLowerCase()
  if (/ammo|rounds|grain|fmj|hollow point/.test(t))                           return 'ammo'
  if (/rifle|ar-?15|ak|carbine|sbr/.test(t))                                  return 'rifle'
  if (/pistol|handgun|glock|sig |1911|revolver/.test(t))                       return 'pistol'
  if (/shotgun|mossberg|remington/.test(t))                                    return 'shotgun'
  if (/suppressor|silencer|nfa/.test(t))                                       return 'suppressor'
  if (/scope|optic|red dot|eotech|vortex|holosun|aimpoint|lpvo/.test(t))      return 'optic'
  if (/flashlight|weapon light|olight|streamlight|baldr/.test(t))             return 'accessory'
  if (/bow|archery|broadhead|crossbow|arrow/.test(t))                          return 'archery'
  return fallback
}

// ── Simple URL → dedup hash tag ───────────────────────────────────────────────
function urlHash(url = '') {
  const clean = url.replace(/[?#].*$/, '').toLowerCase()
  let h = 0
  for (const c of clean) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0
  return Math.abs(h).toString(36)
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
  const stats    = { sources: 0, links: 0, added: 0, skipped: 0, imaged: 0 }

  try {
    // Load existing web-deal URL hashes to skip duplicates
    const existingDocs = await sanity.fetch(
      `*[_type == "gunDeal" && source in ["brownells","psa","natchez","olight","primary-arms"]] { tags }`,
      {}
    ).catch(() => [])
    const existingHashes = new Set(
      existingDocs.flatMap(d => d.tags || []).filter(t => /^[a-z]+-[0-9a-z]+$/.test(t))
    )

    for (const src of sources) {
      if (Date.now() - t0 > DEADLINE) break
      stats.sources++
      await new Promise(r => setTimeout(r, 2000))

      // Step 1: fetch the deals/sale listing page
      const listHtml = await fetchPage(src.dealPage)
      if (!listHtml) {
        console.error(`[web-deals] ${src.id}: listing page fetch failed`)
        continue
      }

      // Step 2: extract product links from the listing
      const links = src.extractLinks(listHtml)
      stats.links += links.length
      console.log(`[web-deals] ${src.id}: found ${links.length} product links`)

      const mutations = []

      for (const productUrl of links) {
        if (Date.now() - t0 > DEADLINE) break

        const tag = `${src.id}-${urlHash(productUrl)}`
        if (existingHashes.has(tag)) { stats.skipped++; continue }
        existingHashes.add(tag)

        await new Promise(r => setTimeout(r, 1000))

        // Step 3: visit the actual product page for OG metadata
        const pageData = await scrapeProductPage(productUrl, `${src.id}-${urlHash(productUrl)}`).catch(() => null)
        if (!pageData || !pageData.title) { stats.skipped++; continue }

        const title   = pageData.title.slice(0, 200)
        const price   = pageData.price || null
        const cdnUrl  = pageData.cdnUrl || null
        if (cdnUrl) stats.imaged++

        const cat = detectCat(title, src.cat)

        mutations.push({
          create: {
            _type:       'gunDeal',
            title,
            externalUrl: productUrl,          // ← actual product page URL
            source:      src.id,
            store:       src.store,
            price:       price || '',
            category:    cat,
            summary:     [price, src.store].filter(Boolean).join(' · '),
            imageUrl:    cdnUrl,              // ← real product OG image
            approved:    true,
            publishedAt: new Date().toISOString(),
            tags:        [src.id, tag, cat],
          },
        })
        stats.added++
      }

      for (let i = 0; i < mutations.length; i += 100) {
        await sanity.mutate(mutations.slice(i, i + 100))
      }
      console.log(`[web-deals] ${src.id}: added ${mutations.length}`)
    }

    const ms = Date.now() - t0
    await reportCronRun('web-deals', {
      status: 'success', ms,
      details: `sources:${stats.sources} links:${stats.links} added:${stats.added} skipped:${stats.skipped} imaged:${stats.imaged}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true, ms, ...stats })

  } catch (err) {
    console.error('[web-deals] fatal:', err.message)
    await reportCronRun('web-deals', { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
