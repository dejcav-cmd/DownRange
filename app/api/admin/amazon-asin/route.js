export const dynamic    = 'force-dynamic'
export const maxDuration = 60

import { NextResponse }        from 'next/server'
import { createClient }        from '@sanity/client'
import { uploadImageToSanity } from '@/lib/imageUpload'

const ADMIN_KEY  = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
const ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'downrangeco-20'

const sanity = createClient({
  projectId: PROJECT_ID,
  dataset:   'production',
  apiVersion:'2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

// ── Extract ASIN from URL or raw string ───────────────────────────────────────
function extractAsin(input = '') {
  const s = input.trim()
  // /dp/XXXXXXXXXX or /gp/product/XXXXXXXXXX
  const dpMatch = s.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
  if (dpMatch) return dpMatch[1].toUpperCase()
  // Raw ASIN: exactly 10 alphanumeric chars
  if (/^[A-Z0-9]{10}$/i.test(s)) return s.toUpperCase()
  return null
}

// ── Detect category from title ────────────────────────────────────────────────
function detectCategory(title = '') {
  const t = title.toLowerCase()
  if (/scope|red dot|lpvo|eotech|aimpoint|optic|sight/.test(t)) return 'optic'
  return 'accessory'
}

// ── Fetch Amazon product page HTML (try direct, fall back to Jina) ────────────
async function fetchProductHtml(asin) {
  const url = `https://www.amazon.com/dp/${asin}`

  // 1. Try Jina proxy (bypasses datacenter IP blocks Amazon applies to Vercel)
  try {
    const headers = {
      'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'x-respond-with':  'html',
      'Accept':          'text/html',
    }
    if (process.env.JINA_API_KEY) headers['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY
    const res = await fetch('https://r.jina.ai/' + url, { headers, signal: AbortSignal.timeout(20000) })
    if (res.ok) {
      const html = await res.text()
      if (html.length > 2000 && !html.includes('api.jina.ai') && html.toLowerCase().includes('amazon')) {
        return html
      }
    }
  } catch { /* fall through */ }

  // 2. Direct fetch with realistic browser headers
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':       'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':           'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language':  'en-US,en;q=0.9',
        'Accept-Encoding':  'gzip, deflate, br',
        'Cache-Control':    'no-cache',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) return res.text()
  } catch { /* fall through */ }

  return null
}

// ── Parse product data out of Amazon HTML ─────────────────────────────────────
function parseProductData(html, asin) {
  if (!html) return {}

  const og = (tag) => {
    const m = html.match(new RegExp(`<meta[^>]*property=["']og:${tag}["'][^>]*content=["']([^"']+)["']`, 'i'))
           || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${tag}["']`, 'i'))
    return m ? m[1].trim() : null
  }

  const title = og('title')
    // Amazon og:title includes " - Amazon.com" suffix — strip it
    ?.replace(/\s*[-–|]\s*amazon\.com.*$/i, '')
    ?.replace(/\s*[-–|]\s*amazon\s*$/i, '')
    ?.trim() || null

  const imageUrl = og('image') || null

  // Price: look for structured data or common price patterns in the HTML
  let price = null
  const pricePatterns = [
    /"price":\s*"?([\d.]+)"?/,                     // JSON-LD
    /class="a-offscreen">\$?([\d,.]+)</,            // a-offscreen span
    /<span[^>]*class="[^"]*a-price-whole[^"]*"[^>]*>([\d,]+)</,  // a-price-whole
    /"priceAmount":\s*"?([\d.]+)"?/,                // priceAmount JSON
  ]
  for (const pat of pricePatterns) {
    const m = html.match(pat)
    if (m) { price = '$' + parseFloat(m[1].replace(/,/g, '')).toFixed(2); break }
  }

  return { title, imageUrl, price }
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await req.json() } catch { body = {} }

  const { input, category: reqCat, dryRun } = body
  if (!input) return NextResponse.json({ error: 'input is required' }, { status: 400 })

  const asin = extractAsin(input)
  if (!asin) {
    return NextResponse.json({
      error: 'Could not extract a valid ASIN. Paste the Amazon product URL or the 10-character ASIN directly.',
    }, { status: 400 })
  }

  // Check if already in Sanity
  const existing = await sanity.fetch(
    `*[_type == "gunDeal" && source == "amazon" && $tag in tags][0]{_id, title}`,
    { tag: `asin:${asin}` }
  ).catch(() => null)
  if (existing) {
    return NextResponse.json({
      error: `Already imported — "${existing.title}" (${asin})`,
      existing: true,
    }, { status: 409 })
  }

  // Scrape product data
  const html        = await fetchProductHtml(asin)
  const { title: scrapedTitle, imageUrl: scrapedImg, price } = parseProductData(html, asin)

  // If scraping failed, require explicit title from the caller
  const scraped = !!scrapedTitle
  const title   = scrapedTitle || body.manualTitle || null

  if (!title) {
    return NextResponse.json({
      ok:        false,
      scrapeFailed: true,
      asin,
      price,
      imageUrl:  scrapedImg,
      error:     'Amazon blocked the product page scrape. Enter the product title manually to save.',
    }, { status: 422 })
  }

  const category = body.category || reqCat || detectCategory(title)

  // If dryRun, return preview without saving
  if (dryRun) {
    return NextResponse.json({
      ok:          true,
      preview:     true,
      asin,
      title:       title || null,
      scrapeFailed: !scraped,
      imageUrl:    scrapedImg,
      price,
      category,
      affiliateUrl: `https://www.amazon.com/dp/${asin}?tag=${ASSOCIATE_TAG}&linkCode=ogi&th=1&psc=1`,
    })
  }

  // Upload image to Sanity CDN
  let sanityImageUrl = null
  if (scrapedImg) {
    sanityImageUrl = await uploadImageToSanity(scrapedImg, `amazon-${asin}`).catch(() => null)
  }

  const affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${ASSOCIATE_TAG}&linkCode=ogi&th=1&psc=1`

  const doc = await sanity.create({
    _type:       'gunDeal',
    title,
    externalUrl: affiliateUrl,
    source:      'amazon',
    store:       'Amazon',
    price:       price || '',
    category,
    summary:     price ? `${price} · Amazon${html ? '' : ' (manually added)'}` : 'Amazon',
    imageUrl:    sanityImageUrl || scrapedImg || null,
    approved:    true,
    publishedAt: new Date().toISOString(),
    tags:        ['amazon', `asin:${asin}`, category, 'manual'],
  })

  return NextResponse.json({
    ok:    true,
    id:    doc._id,
    asin,
    title,
    price,
    imageUrl: sanityImageUrl || scrapedImg || null,
    affiliateUrl,
    scraped: !!html,
  })
}
