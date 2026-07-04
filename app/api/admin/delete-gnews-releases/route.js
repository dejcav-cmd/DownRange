export const dynamic  = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

function isAuth(req) {
  const key    = req.headers.get('x-admin-key')
  const bearer = req.headers.get('authorization')
  return (
    key === process.env.ADMIN_KEY ||
    bearer === `Bearer ${process.env.CRON_SECRET}` ||
    bearer === `Bearer ${process.env.ADMIN_KEY}`
  )
}

// ── IMAGE HELPERS ────────────────────────────────────────────────────────────

const BAD_IMG = /googleusercontent\.com|news\.google\.com|gstatic\.com\/news|logo|icon|favicon|1x1|pixel|spacer|placeholder/i

function isGoodImg(url) {
  if (!url || typeof url !== 'string') return false
  if (BAD_IMG.test(url)) return false
  if (!url.match(/\.(jpg|jpeg|png|webp)/i)) return false
  return true
}

async function scrapeImage(pageUrl) {
  if (!pageUrl) return null
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()

    // Try all meta image patterns in priority order
    const patterns = [
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i),
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i),
    ]
    for (const m of patterns) {
      if (!m?.[1]) continue
      let url = m[1].trim()
      if (url.startsWith('//')) url = 'https:' + url
      if (url.startsWith('/')) { const b = new URL(pageUrl); url = b.origin + url }
      if (isGoodImg(url)) return url
    }
    return null
  } catch { return null }
}

async function uploadToSanity(imageUrl, filename) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const ct  = res.headers.get('content-type') || 'image/jpeg'
    const buf = Buffer.from(await res.arrayBuffer())
    const uploaded = await sanity.assets.upload('image', buf, { contentType: ct, filename })
    return uploaded._id
  } catch { return null }
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

export async function GET(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = {
    gnews_deleted:  { count: 0, titles: [] },
    images_fixed:   { count: 0, fixed: [] },
    images_skipped: { count: 0 },
  }

  // ── PHASE 1: Delete all Google News sourced firearmRelease docs ───────────
  const gnewsDocs = await sanity.fetch(
    `*[_type == "firearmRelease" && (
      sourceUrl match "*news.google.com*"
      || sourceUrl match "*google.com/rss*"
    )] { _id, title }`
  )

  if (gnewsDocs.length > 0) {
    const ids = gnewsDocs.map(d => d._id)
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50)
      await sanity.mutate(batch.map(id => ({ delete: { id } })))
    }
    results.gnews_deleted.count  = gnewsDocs.length
    results.gnews_deleted.titles = gnewsDocs.map(d => d.title?.slice(0, 60))
    console.log(`[CLEANUP] Deleted ${gnewsDocs.length} Google News releases`)
  }

  // ── PHASE 2: Fix all releases with missing or bad images ─────────────────
  // Catches: null imageUrl, google logo URLs, no heroImage, external hotlinks
  const badImageReleases = await sanity.fetch(
    `*[_type == "firearmRelease" && (
      !defined(heroImage)
      && (
        !defined(imageUrl)
        || imageUrl == ""
        || imageUrl match "*googleusercontent.com*"
        || imageUrl match "*news.google.com*"
        || imageUrl match "*gstatic.com*"
      )
    ) && defined(sourceUrl)
    ] | order(publishedAt desc) [0...60] {
      _id, title, brand, model, sourceUrl, imageUrl
    }`
  )

  console.log(`[CLEANUP] Found ${badImageReleases.length} releases with bad/missing images`)

  for (const rel of badImageReleases) {
    const label = `${rel.brand || ''} ${rel.model || rel.title || ''}`.trim()
    console.log(`[CLEANUP] Fixing image: "${label}" — sourceUrl: ${rel.sourceUrl?.slice(0, 80)}`)

    const ogUrl = await scrapeImage(rel.sourceUrl)
    if (!ogUrl) {
      console.log(`[CLEANUP]   ✗ No image found at source`)
      results.images_skipped.count++
      continue
    }

    const slug      = label.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
    const assetId   = await uploadToSanity(ogUrl, `rel-${slug}-${rel._id.slice(-6)}.jpg`)

    if (assetId) {
      await sanity.patch(rel._id).set({
        heroImage: { _type: 'image', asset: { _type: 'reference', _ref: assetId } },
        imageUrl:  null, // clear the bad URL now that heroImage is set
      }).commit()
      results.images_fixed.count++
      results.images_fixed.fixed.push({ title: label, src: ogUrl.slice(0, 80) })
      console.log(`[CLEANUP]   ✓ Uploaded to Sanity CDN: ${assetId}`)
    } else {
      // CDN upload failed — store the raw URL as fallback
      await sanity.patch(rel._id).set({ imageUrl: ogUrl }).commit()
      results.images_fixed.count++
      results.images_fixed.fixed.push({ title: label, src: `(hotlink) ${ogUrl.slice(0, 70)}` })
      console.log(`[CLEANUP]   ~ Stored hotlink fallback`)
    }

    await new Promise(r => setTimeout(r, 500))
  }

  return Response.json({ ok: true, ...results })
}
