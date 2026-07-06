export const dynamic    = 'force-dynamic'
export const maxDuration = 120

import { NextResponse }        from 'next/server'
import { createClient }        from '@sanity/client'
import { reportCronRun }       from '@/lib/cronReporter'
import { uploadImageToSanity } from '@/lib/imageUpload'

const ADMIN_KEY     = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID    = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
const ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'downrangeco-20'

const sanity = createClient({
  projectId:  PROJECT_ID,
  dataset:    'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN,
  useCdn:     false,
})

// ── Brand sources ─────────────────────────────────────────────────────────────
// Each brand gets a targeted search URL in the Sporting Goods index.
// brandWords are the always-pass keywords for this brand's product line — if
// the title contains any of them, it bypasses the generic 2A filter.

const BRAND_SOURCES = [
  {
    id:         'olight',
    label:      'Olight',
    store:      'Amazon – Olight',
    url:        'https://www.amazon.com/s?k=olight+flashlight+tactical+weapon&i=sporting',
    brandWords: ['olight', 'weapon light', 'torch', 'lamp', 'warrior', 'baldr', 'pl-pro',
                 'valkyrie', 'javelot', 'marauder', 'perun', 'turbo', 'mini'],
    cat:        'accessory',
  },
  {
    id:         'monstrum',
    label:      'Monstrum Tactical',
    store:      'Amazon – Monstrum',
    url:        'https://www.amazon.com/s?k=monstrum+tactical&i=sporting',
    brandWords: ['monstrum', 'scope mount', 'ring mount', 'cantilever', 'riser', 'offset',
                 'scope rail', 'picatinny', 'low profile', 'prism scope', 'red dot'],
    cat:        'optic',
  },
  {
    id:         'vortex',
    label:      'Vortex Optics',
    store:      'Amazon – Vortex',
    url:        'https://www.amazon.com/s?k=vortex+optics&i=sporting',
    brandWords: ['vortex', 'viper', 'sparc', 'strikefire', 'crossfire', 'diamondback',
                 'ranger', 'razor', 'pst', 'hs-lr', 'impact', 'fury', 'kaibab',
                 'spitfire', 'summit', 'strike eagle'],
    cat:        'optic',
  },
]

// ── 2A relevance filter ───────────────────────────────────────────────────────
const ALLOW_WORDS = [
  'flashlight', 'weapon light', 'tactical', 'gun', 'firearm', 'rifle', 'pistol',
  'shotgun', 'ar-15', 'ar15', 'scope', 'optic', 'red dot', 'sight', 'reticle',
  'magnifier', 'mount', 'ring', 'rail', 'picatinny', 'holster', 'magazine',
  'trigger', 'grip', 'bipod', 'sling', 'suppressor', 'muzzle', 'brake',
  'hunting', 'shooting', 'range', 'target', 'ammunition', 'ammo', 'rimfire',
  'centerfire', 'bore', 'cleaning', 'mil-spec', 'ar 15', 'ak47', 'handgun',
]

const BLOCK_WORDS = [
  'kitchen', 'cooking', 'baking', 'beauty', 'skincare', 'makeup', 'cosmetic',
  'jewelry', 'necklace', 'bracelet', 'earring', 'ring ',
  'clothing', 'shirt', 'pants', 'shoes', 'sneaker', 'boot ',
  'food', 'supplement', 'vitamin', 'protein powder', 'toy', 'kids',
  'garden', 'planter', 'furniture', 'pillow', 'bedding', 'curtain',
  'phone case', 'laptop', 'tablet', 'headphone', 'speaker', 'bluetooth',
  'pet food', 'dog food', 'cat food', 'aquarium',
]

function is2ARelevant(title = '', brandWords = []) {
  const t = title.toLowerCase()
  if (!t || t.length < 5) return false
  // Hard block
  if (BLOCK_WORDS.some(w => t.includes(w))) return false
  // Brand-specific pass (almost everything from these brands is relevant)
  if (brandWords.some(w => t.toLowerCase().includes(w))) return true
  // Generic 2A pass
  if (ALLOW_WORDS.some(w => t.includes(w))) return true
  return false
}

// ── Fetch a page via Jina proxy (handles Amazon's datacenter IP blocks) ────────
async function fetchViaJina(url) {
  const headers = {
    'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'x-respond-with':  'html',
    'Accept':          'text/html',
  }
  if (process.env.JINA_API_KEY) headers['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY

  const res = await fetch('https://r.jina.ai/' + url, {
    headers,
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Jina ${res.status} for ${url}`)
  const html = await res.text()
  if (html.length < 1000) throw new Error(`Jina returned too-short response (${html.length} chars)`)
  return html
}

// ── Parse search result items from Amazon search HTML ─────────────────────────
// Amazon server-renders data-asin attributes + product info in search results.
// We pull up to 15 ASINs per page + their titles, prices, and primary images.

function parseSearchResults(html) {
  const items = []
  const seen  = new Set()

  // Walk ASIN occurrences; grab a 4000-char window after each one
  const asinRe = /data-asin="([A-Z0-9]{10})"/gi
  let m
  while ((m = asinRe.exec(html)) !== null) {
    const asin = m[1]
    if (seen.has(asin)) continue
    seen.add(asin)

    const win = html.slice(m.index, m.index + 4000)

    // Title — several possible patterns across Amazon's A/B layouts
    let title = null
    const titlePatterns = [
      // a-size-medium / a-size-base-plus in a link
      /class="[^"]*a-size-(?:medium|base-plus|medium-bold)[^"]*"[^>]*>([\s\S]{10,250}?)<\/span>/i,
      // h2 > a > span pattern
      /<h2[^>]*>[\s\S]*?<span[^>]*>([\s\S]{10,250}?)<\/span>[\s\S]*?<\/h2>/i,
    ]
    for (const pat of titlePatterns) {
      const tm = win.match(pat)
      if (tm) {
        title = tm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
        if (title.length > 10) break
        title = null
      }
    }

    // Price — a-offscreen is the accessible price text
    let price = null
    const pm = win.match(/class="a-offscreen">\$?([\d,.]+)<\/span>/)
    if (pm) price = `$${parseFloat(pm[1].replace(/,/g, '')).toFixed(2)}`

    // Image — s-image class or m.media-amazon.com URL
    let imageUrl = null
    const im = win.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]*src="([^"]+)"/i)
            || win.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9%._-]+\.(?:jpg|jpeg|png|webp))"/i)
    if (im) {
      // Upgrade to a larger image variant (replace size code)
      imageUrl = im[1].replace(/\._[A-Z]{2,4}\d*_\./, '._SL500_.')
    }

    items.push({ asin, title, price, imageUrl })
    if (items.length >= 15) break
  }

  return items
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

  // Allow single-brand override via ?brand=olight|monstrum|vortex
  const { searchParams } = new URL(req.url)
  const brandFilter = searchParams.get('brand')
  const sources = brandFilter
    ? BRAND_SOURCES.filter(b => b.id === brandFilter)
    : BRAND_SOURCES

  const t0    = Date.now()
  const stats = { brands: 0, found: 0, filtered: 0, added: 0, skipped: 0, imaged: 0 }

  try {
    // Load ALL existing Amazon ASINs once (avoid N+1 per brand)
    const existingDocs = await sanity.fetch(
      `*[_type == "gunDeal" && source == "amazon"] { tags }`
    ).catch(() => [])
    const existingAsins = new Set(
      existingDocs
        .flatMap(d => d.tags || [])
        .filter(t => typeof t === 'string' && t.startsWith('asin:'))
        .map(t => t.slice(5))
    )

    for (const brand of sources) {
      stats.brands++

      // Throttle between brands
      if (stats.brands > 1) await new Promise(r => setTimeout(r, 2000))

      let html
      try {
        html = await fetchViaJina(brand.url)
      } catch (err) {
        console.error(`[amazon-brands] ${brand.id}: fetch failed — ${err.message}`)
        continue
      }

      const items = parseSearchResults(html)
      stats.found += items.length

      const mutations = []
      for (const item of items) {
        // Skip if no ASIN or already imported
        if (!item.asin || existingAsins.has(item.asin)) {
          stats.skipped++
          continue
        }

        // Skip if title doesn't pass 2A filter (null titles also skip)
        if (!item.title || !is2ARelevant(item.title, brand.brandWords)) {
          stats.filtered++
          continue
        }

        existingAsins.add(item.asin)  // prevent intra-run dups

        // Upload product image to Sanity CDN
        let sanityImg = null
        if (item.imageUrl) {
          sanityImg = await uploadImageToSanity(item.imageUrl, `amazon-${item.asin}`).catch(() => null)
          if (sanityImg) stats.imaged++
        }

        // Throttle image uploads
        await new Promise(r => setTimeout(r, 500))

        const summary = [item.price, `${brand.label}`, 'Amazon'].filter(Boolean).join(' · ')

        mutations.push({
          create: {
            _type:       'gunDeal',
            title:       item.title,
            externalUrl: `https://www.amazon.com/dp/${item.asin}?tag=${ASSOCIATE_TAG}&linkCode=ogi&th=1&psc=1`,
            source:      'amazon',
            store:        brand.store,
            price:        item.price || '',
            category:     brand.cat,
            summary,
            imageUrl:     sanityImg || item.imageUrl || null,
            approved:     true,
            publishedAt:  new Date().toISOString(),
            tags:         [
              'amazon',
              `asin:${item.asin}`,
              brand.id,
              brand.cat,
            ],
          },
        })
        stats.added++
      }

      // Write this brand's batch to Sanity
      if (mutations.length > 0) {
        for (let i = 0; i < mutations.length; i += 100) {
          await sanity.mutate(mutations.slice(i, i + 100))
        }
      }
    }

    const ms = Date.now() - t0
    await reportCronRun('amazon-brands', {
      status:  'success',
      ms,
      details: `brands:${stats.brands} found:${stats.found} filtered:${stats.filtered} added:${stats.added} skipped:${stats.skipped} imaged:${stats.imaged}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true, ms, ...stats })

  } catch (err) {
    console.error('[amazon-brands] fatal:', err.message)
    await reportCronRun('amazon-brands', {
      status: 'failed',
      ms:     Date.now() - t0,
      error:  err.message,
    }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
