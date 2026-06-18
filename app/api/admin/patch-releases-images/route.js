export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

const sleep = ms => new Promise(r => setTimeout(r, ms))
const CAT_IMG = {
  Pistol: '/img/photos/pistol.jpg', Revolver: '/img/photos/pistol.jpg',
  Rifle: '/img/photos/rifle.jpg', Shotgun: '/img/photos/shotgun.jpg',
  Suppressor: '/img/photos/suppressor.jpg', default: '/img/photos/pistol.jpg',
}

function isAuth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || req.headers.get('authorization') === `Bearer ${process.env.ADMIN_KEY}`
}

// ── FETCH WITH BROWSER UA ─────────────────────────────────────────────────────
async function fetchHTML(url, timeout = 12000) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    })
    return r.ok ? await r.text() : null
  } catch { return null }
}

// ── EXTRACT ALL CANDIDATE IMAGES FROM HTML ────────────────────────────────────
function extractImages(html, sourceUrl) {
  if (!html) return []
  const images = []
  const baseHost = sourceUrl ? new URL(sourceUrl).hostname : ''

  // 1. OG / Twitter meta tags (highest priority)
  const metaPatterns = [
    /<meta[^>]+property="og:image(?::secure_url)?"[^>]+content="([^"]+)"/gi,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:image(?::secure_url)?"/gi,
    /<meta[^>]+name="twitter:image(?::src)?"[^>]+content="([^"]+)"/gi,
    /<meta[^>]+content="([^"]+)"[^>]+name="twitter:image(?::src)?"/gi,
  ]
  for (const rx of metaPatterns) {
    let m
    while ((m = rx.exec(html)) !== null) {
      const url = m[1]?.trim()
      if (url && url.startsWith('http')) images.push({ url, score: 100 })
    }
  }

  // 2. JSON-LD structured data
  const jsonldRx = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let jm
  while ((jm = jsonldRx.exec(html)) !== null) {
    try {
      const data = JSON.parse(jm[1])
      const extractImg = (obj) => {
        if (!obj) return
        if (typeof obj === 'string' && obj.startsWith('http') && /\.(jpg|jpeg|png|webp)/i.test(obj)) {
          images.push({ url: obj, score: 90 })
        }
        if (typeof obj === 'object') {
          for (const v of Object.values(obj)) extractImg(v)
        }
      }
      extractImg(data)
    } catch {}
  }

  // 3. Large content images (skip logos, icons, avatars)
  const imgRx = /<img[^>]+src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"[^>]*(?:width="(\d+)")?[^>]*(?:height="(\d+)")?[^>]*>/gi
  let im
  while ((im = imgRx.exec(html)) !== null) {
    const url = im[1], w = parseInt(im[2] || '0'), h = parseInt(im[3] || '0')
    if (!url) continue
    const urlLower = url.toLowerCase()
    if (urlLower.includes('logo') || urlLower.includes('icon') || urlLower.includes('avatar') ||
        urlLower.includes('banner') || urlLower.includes('ad-') || urlLower.includes('sprite')) continue
    // Score based on dimensions
    const dimScore = w > 600 ? 80 : w > 400 ? 60 : w > 200 ? 40 : 20
    images.push({ url, score: dimScore })
  }

  // 4. Srcset images (responsive images often have good product photos)
  const srcsetRx = /srcset="([^"]+)"/gi
  let sm
  while ((sm = srcsetRx.exec(html)) !== null) {
    const parts = sm[1].split(',').map(p => p.trim().split(/\s+/)[0])
    for (const url of parts) {
      if (url.startsWith('http') && /\.(jpg|jpeg|png|webp)/i.test(url)) {
        images.push({ url, score: 50 })
      }
    }
  }

  // Deduplicate and sort by score
  const seen = new Set()
  return images
    .filter(img => {
      if (seen.has(img.url)) return false
      seen.add(img.url)
      return true
    })
    .sort((a, b) => b.score - a.score)
    .map(img => img.url)
}

// ── GOOGLE SEARCH FOR GUN IMAGE ───────────────────────────────────────────────
async function googleImageSearch(brand, model, category) {
  // Google Images — parse the HTML response for image URLs
  const query = encodeURIComponent(`"${brand}" "${model}" ${category} gun firearm product photo`)
  const googleUrl = `https://www.google.com/search?q=${query}&tbm=isch&tbs=isz:l`

  try {
    const html = await fetchHTML(googleUrl, 10000)
    if (!html) return null

    // Google embeds image URLs in AF_initDataCallback or data-src attributes
    const patterns = [
      /"(https?:\/\/(?!encrypted)[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"(?:[^>]*?(?:width|height)"?\s*:?\s*[3-9]\d{2,})/gi,
      /\["(https?:\/\/(?!encrypted)[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)",\d{3,},\d{3,}\]/gi,
      /"ou":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
    ]
    for (const rx of patterns) {
      const m = rx.exec(html)
      if (m?.[1]) {
        const url = m[1].replace(/\\u003d/g, '=').replace(/\\u0026/g, '&')
        if (!url.includes('google') && !url.includes('gstatic') && !url.includes('logo')) {
          return url
        }
      }
    }
  } catch {}
  return null
}

// ── MANUFACTURER PRODUCT PAGE SEARCH ─────────────────────────────────────────
async function findManufacturerImage(brand, model) {
  const modelSlug = model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Known manufacturer CDN patterns
  const attempts = []

  if (brand.includes('Glock')) {
    attempts.push(`https://us.glock.com/content/dam/glock/global/products/${modelSlug.replace(/-/g,'').toUpperCase()}.jpg`)
    attempts.push(`https://us.glock.com/content/dam/glock/global/products/${modelSlug.replace(/-/g,'')}.jpg`)
  }
  if (brand.includes('SIG') || brand.includes('Sig')) {
    attempts.push(`https://www.sigsauer.com/media/catalog/product/p/${modelSlug[0]}/${modelSlug}.jpg`)
    attempts.push(`https://www.sigsauer.com/media/catalog/product/${modelSlug}.jpg`)
  }
  if (brand.includes('Smith') || brand.includes('S&W') || brand.includes('SW')) {
    attempts.push(`https://www.smith-wesson.com/media/catalog/product/${modelSlug}.jpg`)
  }
  if (brand.includes('Ruger')) {
    attempts.push(`https://www.ruger.com/images/guns/${modelSlug}.jpg`)
    attempts.push(`https://www.ruger.com/files/productImages/${modelSlug}.jpg`)
  }
  if (brand.includes('Springfield')) {
    attempts.push(`https://www.springfield-armory.com/media/catalog/product/${modelSlug}.jpg`)
  }
  if (brand.includes('Walther') || brand.includes('walther')) {
    attempts.push(`https://www.waltherarms.com/media/catalog/product/${modelSlug}.jpg`)
  }

  for (const url of attempts) {
    try {
      const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
      if (r.ok && r.headers.get('content-type')?.includes('image')) return url
    } catch {}
  }
  return null
}

// ── FIND BEST IMAGE FOR A RELEASE ─────────────────────────────────────────────
async function findBestImage(doc) {
  console.log(`[IMG] ${doc.brand} — ${doc.model}`)

  // Step 1: Try original article source URL — most aggressive extraction
  if (doc.sourceUrl) {
    const html = await fetchHTML(doc.sourceUrl)
    if (html) {
      const imgs = extractImages(html, doc.sourceUrl)
      // Skip the first image if it looks like a site logo/banner
      for (const img of imgs.slice(0, 5)) {
        const lower = img.toLowerCase()
        if (!lower.includes('logo') && !lower.includes('banner') && !lower.includes('header')) {
          console.log(`  ✓ source article: ${img.slice(0, 70)}`)
          return { url: img, method: 'article_og' }
        }
      }
    }
  }

  // Step 2: Try manufacturer's product page directly
  const mfrImg = await findManufacturerImage(doc.brand, doc.model)
  if (mfrImg) {
    console.log(`  ✓ manufacturer CDN: ${mfrImg.slice(0, 70)}`)
    return { url: mfrImg, method: 'manufacturer_cdn' }
  }

  // Step 3: Google image search for the specific gun
  const googleImg = await googleImageSearch(doc.brand, doc.model, doc.category || 'firearm')
  if (googleImg) {
    console.log(`  ✓ google: ${googleImg.slice(0, 70)}`)
    return { url: googleImg, method: 'google' }
  }

  // Step 4: Category fallback
  console.log(`  - fallback category image`)
  return { url: CAT_IMG[doc.category] || CAT_IMG.default, method: 'fallback' }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
async function handler(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const docs = await sanity.fetch(
    `*[_type=="firearmRelease"] | order(publishedAt desc) [0...300] {
      _id, brand, model, category, sourceUrl, imageUrl
    }`
  ).catch(() => [])

  console.log(`[PATCH-IMG] ${docs.length} total releases`)

  // Process ALL releases — prioritize ones with generic/missing images first
  const priority = docs.filter(d =>
    !d.imageUrl || d.imageUrl.includes('/img/photos/') ||
    d.imageUrl.includes('unsplash.com') || d.imageUrl.includes('pexels.com')
  )
  const hasImage = docs.filter(d =>
    d.imageUrl && !d.imageUrl.includes('/img/photos/') &&
    !d.imageUrl.includes('unsplash.com') && !d.imageUrl.includes('pexels.com')
  )

  console.log(`[PATCH-IMG] ${priority.length} need images, ${hasImage.length} already have real images`)

  const stats = { article_og: 0, manufacturer_cdn: 0, google: 0, fallback: 0, errors: 0 }
  const results = []

  // Process priority items first, then try to improve existing ones
  for (const doc of priority) {
    const { url, method } = await findBestImage(doc)
    try {
      await sanity.patch(doc._id).set({ imageUrl: url }).commit()
      stats[method] = (stats[method] || 0) + 1
      results.push({ brand: doc.brand, model: doc.model, method, url: url.slice(0, 80) })
    } catch (e) {
      stats.errors++
      console.error(`  ✗ save error: ${e.message}`)
    }
    await sleep(600)
  }

  const msg = `article_og:${stats.article_og} mfr_cdn:${stats.manufacturer_cdn} google:${stats.google} fallback:${stats.fallback} errors:${stats.errors}`
  console.log('[PATCH-IMG] Done:', msg)

  return Response.json({
    ok: true,
    total: docs.length,
    processed: priority.length,
    alreadyHaveImages: hasImage.length,
    stats,
    results,
    message: msg,
  })
}

export async function POST(req) { return handler(req) }
export async function GET(req)  { return handler(req) }
