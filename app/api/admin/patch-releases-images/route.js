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

// ── IMAGE QUALITY FLAGS stored in Sanity ─────────────────────────────────────
// imageStatus: 'verified' | 'generic' | 'pending'
// imageVerifiedAt: ISO datetime
// imageMethod: 'article_og' | 'article_content' | 'manufacturer_cdn' | 'google' | 'fallback'

function isAuth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || req.headers.get('authorization') === `Bearer ${process.env.ADMIN_KEY}`
}

async function fetchHTML(url, timeout = 12000) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    })
    return r.ok ? await r.text() : null
  } catch { return null }
}

// ── IMAGE URL QUALITY SCORER ──────────────────────────────────────────────────
// Returns 0-100. Higher = more likely to be the actual product photo.
function scoreImageUrl(url, brand, model) {
  if (!url || !url.startsWith('http')) return 0
  const u = url.toLowerCase()
  const brandSlug = (brand || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const modelSlug = (model || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  // Hard disqualifiers
  if (u.includes('logo') || u.includes('favicon') || u.includes('icon-') ||
      u.includes('avatar') || u.includes('placeholder') || u.includes('no-image') ||
      u.includes('default-image') || u.includes('blank') || u.includes('spinner')) return 0

  // Generic fallback images (our own)
  if (u.includes('/img/photos/')) return 5

  // Stock photo CDNs — no specific gun photo
  if (u.includes('unsplash.com') || u.includes('pexels.com') ||
      u.includes('shutterstock') || u.includes('gettyimages') ||
      u.includes('istockphoto')) return 10

  // Social media / site thumbnails — usually not the product
  if (u.includes('twitter.com') || u.includes('facebook.com') ||
      u.includes('og-default') || u.includes('share-default')) return 15

  let score = 40 // base: it's an external image URL

  // Boost: image is on manufacturer's domain
  const mfrDomains = ['glock.com','sigsauer.com','sig-sauer.com','smith-wesson.com',
    'ruger.com','springfield-armory.com','taurususa.com','mossberg.com','fnamerica.com',
    'kimberamerica.com','waltherarms.com','canikusa.com','henryusa.com','browning.com',
    'winchesterguns.com','colt.com','danieldefense.com','christensenarms.com',
    'tikka.fi','weatherby.com','staccato2011.com','wilsoncombat.com',
    'shadowsystemscorp.com','iwi.us','aeroprecisionusa.com','keltecweapons.com',
    'savagearms.com','benelliusa.com','bergara.online','fusionfirearms.com',
    'palmettostatearmory.com']
  if (mfrDomains.some(d => u.includes(d))) score += 30

  // Boost: URL contains brand/model slug
  if (brandSlug.length > 3 && u.includes(brandSlug)) score += 15
  if (modelSlug.length > 3 && u.includes(modelSlug)) score += 20

  // Boost: looks like a product image path
  if (u.includes('/product') || u.includes('/products') || u.includes('/catalog') ||
      u.includes('/firearms') || u.includes('/guns') || u.includes('/pistol') ||
      u.includes('/rifle') || u.includes('/shotgun')) score += 10

  // Boost: common product image filename patterns
  if (/\d{4,}x\d{4,}/.test(u)) score += 5  // high-res dimensions in filename
  if (u.includes('_main') || u.includes('-main') || u.includes('_hero') ||
      u.includes('-hero') || u.includes('_front') || u.includes('-front')) score += 10

  // Penalty: looks like a blog/news thumbnail
  if (u.includes('/blog') || u.includes('/news') || u.includes('/press') ||
      u.includes('thumbnail') || u.includes('-thumb-') || u.includes('featured-image')) score -= 10

  return Math.min(100, Math.max(0, score))
}

// ── EXTRACT ALL IMAGES FROM HTML ──────────────────────────────────────────────
function extractAllImages(html, sourceUrl, brand, model) {
  if (!html) return []
  const images = []

  // 1. OG / Twitter meta (score 60+ base)
  const metas = [
    /<meta[^>]+property="og:image(?::secure_url)?"[^>]+content="([^"]+)"/gi,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:image(?::secure_url)?"/gi,
    /<meta[^>]+name="twitter:image[^"]*"[^>]+content="([^"]+)"/gi,
    /<meta[^>]+content="([^"]+)"[^>]+name="twitter:image[^"]*"/gi,
  ]
  for (const rx of metas) {
    let m; while ((m = rx.exec(html)) !== null) {
      const url = m[1]?.trim()
      if (url?.startsWith('http')) images.push({ url, source: 'og_meta' })
    }
  }

  // 2. JSON-LD structured data
  const ldRx = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let ldm
  while ((ldm = ldRx.exec(html)) !== null) {
    try {
      const walk = (obj) => {
        if (!obj) return
        if (typeof obj === 'string' && obj.startsWith('http') && /\.(jpe?g|png|webp)/i.test(obj))
          images.push({ url: obj, source: 'jsonld' })
        if (typeof obj === 'object') Object.values(obj).forEach(walk)
      }
      walk(JSON.parse(ldm[1]))
    } catch {}
  }

  // 3. Srcset (responsive product images)
  const srcsetRx = /srcset="([^"]+)"/gi
  let sm
  while ((sm = srcsetRx.exec(html)) !== null) {
    sm[1].split(',').forEach(part => {
      const url = part.trim().split(/\s+/)[0]
      if (url?.startsWith('http') && /\.(jpe?g|png|webp)/i.test(url))
        images.push({ url, source: 'srcset' })
    })
  }

  // 4. Regular img tags — rank by size
  const imgRx = /<img[^>]+src="(https?:\/\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"(?:[^>]*width="(\d+)")?[^>]*>/gi
  let im
  while ((im = imgRx.exec(html)) !== null) {
    const url = im[1], w = parseInt(im[2] || '0')
    if (url) images.push({ url, source: 'img_tag', width: w })
  }

  // Score, deduplicate, sort
  const seen = new Set()
  return images
    .map(img => ({ ...img, score: scoreImageUrl(img.url, brand, model) }))
    .filter(img => { if (seen.has(img.url) || img.score === 0) return false; seen.add(img.url); return true })
    .sort((a, b) => b.score - a.score)
}

// ── GOOGLE IMAGE SCRAPE ───────────────────────────────────────────────────────
async function googleImageSearch(brand, model, category) {
  const query = encodeURIComponent(`"${brand}" "${model}" ${category} firearm product photo`)
  const html = await fetchHTML(`https://www.google.com/search?q=${query}&tbm=isch`, 10000)
  if (!html) return null

  // Google embeds image URLs in multiple patterns
  const patterns = [
    /"ou":"(https?:\/\/(?!encrypted)[^"]+\.(?:jpe?g|png|webp)[^"]*)"/gi,
    /\["(https?:\/\/(?!encrypted)[^"]+\.(?:jpe?g|png|webp)(?:\?[^"]*)?)",\s*\d{3,},\s*\d{3,}\]/gi,
    /"imgurl=([^&"]+\.(?:jpe?g|png|webp)[^&"]*)"/gi,
  ]

  const candidates = []
  for (const rx of patterns) {
    let m; while ((m = rx.exec(html)) !== null) {
      const url = decodeURIComponent(m[1]).replace(/\\u003d/g,'=').replace(/\\u0026/g,'&')
      if (url.startsWith('http') && !url.includes('google') && !url.includes('gstatic')) {
        const score = scoreImageUrl(url, brand, model)
        if (score > 20) candidates.push({ url, score })
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]?.url || null
}

// ── MANUFACTURER PRODUCT PAGE SEARCH ─────────────────────────────────────────
async function findManufacturerPageImage(brand, model) {
  const modelSlug = model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const urls = []
  const b = brand.toLowerCase()

  if (b.includes('glock'))
    urls.push(`https://us.glock.com/en/pistols/${modelSlug}`)
  if (b.includes('sig') || b.includes('sauer'))
    urls.push(`https://www.sigsauer.com/products/pistols/${modelSlug}.html`,
               `https://www.sigsauer.com/search#q=${encodeURIComponent(model)}`)
  if (b.includes('smith') || b.includes('wesson'))
    urls.push(`https://www.smith-wesson.com/search?q=${encodeURIComponent(model)}`,
               `https://www.smith-wesson.com/products/${modelSlug}`)
  if (b.includes('ruger'))
    urls.push(`https://ruger.com/products/${modelSlug}/`)
  if (b.includes('springfield'))
    urls.push(`https://www.springfield-armory.com/${modelSlug}/`)
  if (b.includes('taurus'))
    urls.push(`https://www.taurususa.com/products/${modelSlug}`)
  if (b.includes('walther'))
    urls.push(`https://www.waltherarms.com/en-us/pistols/${modelSlug}.html`)
  if (b.includes('canik'))
    urls.push(`https://www.canikusa.com/products/${modelSlug}`)
  if (b.includes('henry'))
    urls.push(`https://www.henryusa.com/rifles/${modelSlug}/`)
  if (b.includes('savage'))
    urls.push(`https://savagearms.com/firearms/${modelSlug}`)

  for (const url of urls.slice(0, 3)) {
    const html = await fetchHTML(url, 8000)
    if (!html) continue
    const imgs = extractAllImages(html, url, brand, model)
    const best = imgs.find(i => i.score >= 60)
    if (best) return best.url
  }
  return null
}

// ── MAIN IMAGE FINDER ─────────────────────────────────────────────────────────
async function findVerifiedImage(doc) {
  const { brand, model, category, sourceUrl } = doc
  const label = `${brand} — ${model}`

  // Step 1: Manufacturer article source page
  if (sourceUrl) {
    const html = await fetchHTML(sourceUrl)
    if (html) {
      const imgs = extractAllImages(html, sourceUrl, brand, model)
      const best = imgs.find(i => i.score >= 50)
      if (best) {
        console.log(`  ✓ [article_og:${best.score}] ${label}`)
        return { url: best.url, method: 'article_og', score: best.score }
      }
    }
  }

  // Step 2: Manufacturer product page (direct URL construction)
  const mfrImg = await findManufacturerPageImage(brand, model)
  if (mfrImg) {
    console.log(`  ✓ [mfr_page] ${label}`)
    return { url: mfrImg, method: 'manufacturer_page', score: 80 }
  }

  // Step 3: Google image search for the exact gun
  const googleImg = await googleImageSearch(brand, model, category || 'firearm')
  if (googleImg) {
    console.log(`  ✓ [google] ${label}`)
    return { url: googleImg, method: 'google', score: 70 }
  }

  // Step 4: Category fallback — mark as unverified
  console.log(`  - [fallback] ${label}`)
  return { url: CAT_IMG[category] || CAT_IMG.default, method: 'fallback', score: 5 }
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
async function handler(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const forceAll = searchParams.get('force') === 'true'
  const offset   = parseInt(searchParams.get('offset') || '0')
  const limit    = parseInt(searchParams.get('limit')  || '25') // 25 per batch @ ~3s each = ~75s

  // Fetch all releases with image status
  const docs = await sanity.fetch(`
    *[_type=="firearmRelease"] | order(publishedAt desc) [0...300] {
      _id, brand, model, category, sourceUrl, imageUrl,
      imageStatus, imageMethod, imageScore
    }
  `).catch(() => [])

  console.log(`[PATCH-IMG] ${docs.length} total releases`)

  // Score all existing images first — some may already be verified without the flag
  const MFR_DOMAINS = ['smith-wesson.com','sigsauer.com','ruger.com','glock.com',
    'springfield-armory.com','taurususa.com','mossberg.com','fnamerica.com','waltherarms.com',
    'canikusa.com','henryusa.com','browning.com','winchesterguns.com','kimberamerica.com',
    'danieldefense.com','christensenarms.com','savagearms.com','benelliusa.com',
    'keltecweapons.com','colt.com','cz-usa.com','bergara.online','tikka.fi','weatherby.com',
    'staccato2011.com','wilsoncombat.com','shadowsystemscorp.com','iwi.us',
    'aeroprecisionusa.com','fusionfirearms.com','palmettostatearmory.com']

  const toProcess = docs.filter(d => {
    if (forceAll) return true
    // Already explicitly verified with good score → skip
    if (d.imageStatus === 'verified' && (d.imageScore || 0) >= 60) return false
    // Has a real manufacturer domain image → auto-verify and skip
    const url = (d.imageUrl || '').toLowerCase()
    if (d.imageUrl && MFR_DOMAINS.some(dom => url.includes(dom))) return false
    // Has /img/photos/ fallback or no image → needs work
    return true
  })

  // Auto-verify any untagged manufacturer images we just identified as good
  const autoVerify = docs.filter(d => {
    if (d.imageStatus === 'verified') return false
    const url = (d.imageUrl || '').toLowerCase()
    return d.imageUrl && MFR_DOMAINS.some(dom => url.includes(dom))
  })
  if (autoVerify.length > 0) {
    console.log(`[PATCH-IMG] Auto-verifying ${autoVerify.length} manufacturer domain images`)
    for (const d of autoVerify) {
      const score = scoreImageUrl(d.imageUrl, d.brand, d.model)
      await sanity.patch(d._id).set({
        imageStatus: 'verified', imageScore: score, imageMethod: 'manufacturer_domain',
        imageVerifiedAt: new Date().toISOString(),
      }).commit().catch(() => {})
    }
  }

  const skipped = docs.length - toProcess.length
  console.log(`[PATCH-IMG] Processing: ${toProcess.length} | Skipping (verified): ${skipped}`)

  const stats = { article_og: 0, manufacturer_page: 0, google: 0, fallback: 0, errors: 0, skipped }
  const results = []

  const paginated = toProcess.slice(offset, offset + limit)
  const totalPending = toProcess.length
  console.log(`[PATCH-IMG] Batch offset=${offset} limit=${limit}: processing ${paginated.length} of ${totalPending} pending`)

  for (const doc of paginated) {
    const { url, method, score } = await findVerifiedImage(doc)

    try {
      await sanity.patch(doc._id).set({
        imageUrl: url,
        imageStatus: score >= 60 ? 'verified' : score >= 30 ? 'partial' : 'fallback',
        imageMethod: method,
        imageScore: score,
        imageVerifiedAt: new Date().toISOString(),
      }).commit()

      stats[method] = (stats[method] || 0) + 1
      results.push({
        brand: doc.brand, model: doc.model,
        method, score, url: url.slice(0, 80),
        status: score >= 60 ? '✓' : score >= 30 ? '~' : '✗',
      })
    } catch (e) {
      stats.errors++
      console.error(`  ✗ save: ${e.message}`)
    }
    await sleep(300)
  }

  const verified = results.filter(r => r.score >= 60).length
  const partial  = results.filter(r => r.score >= 30 && r.score < 60).length
  const fallback = results.filter(r => r.score < 30).length

  const msg = `processed:${toProcess.length} verified:${verified} partial:${partial} fallback:${fallback} skipped:${skipped}`
  console.log('[PATCH-IMG] Done:', msg)

  const nextOffset = offset + limit
  const hasMore = nextOffset < toProcess.length

  return Response.json({
    ok: true,
    total: docs.length,
    processed: paginated.length,
    totalPending: toProcess.length,
    skipped,
    verified, partial, fallback, errors: stats.errors,
    breakdown: stats, results, message: msg,
    pagination: {
      offset, limit,
      nextOffset: hasMore ? nextOffset : null,
      hasMore,
      remaining: Math.max(0, toProcess.length - nextOffset),
    },
  })
}

export async function POST(req) { return handler(req) }
export async function GET(req)  { return handler(req) }
