export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// Domains we know have good og:images
const GOOD_SOURCES = [
  'thefirearmblog.com', 'thetruthaboutguns.com', 'ammoland.com',
  'bearingarms.com', 'gunowners.org', 'americanrifleman.org',
  'guns.com', 'gunsamerica.com', 'outdoorhub.com', 'pewpewtactical.com',
  'gunnewsdaily.com', 'thearmorylife.com', 'gunsandammo.com',
  'shootingillustrated.com', 'offthegridnews.com', 'concealednation.org',
]

// Only upload real photos — skip SVGs, 1x1 tracking pixels, logos
function isGoodImage(url) {
  if (!url) return false
  const lower = url.toLowerCase()
  if (lower.includes('.svg')) return false
  if (lower.includes('logo') && !lower.includes('gun')) return false
  if (lower.includes('favicon')) return false
  if (lower.includes('1x1') || lower.includes('pixel') || lower.includes('spacer')) return false
  if (lower.includes('placeholder') || lower.includes('default-image')) return false
  if (lower.includes('/img/') && lower.endsWith('.svg')) return false
  if (!lower.match(/\.(jpg|jpeg|png|webp)/)) return false
  return true
}

async function extractOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null

    const html = await res.text()

    // Try og:image first (most reliable for article images)
    const ogMatches = [
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i),
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i),
    ]

    for (const m of ogMatches) {
      if (m?.[1]) {
        let imgUrl = m[1].trim()
        // Make absolute
        if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl
        if (imgUrl.startsWith('/')) {
          const base = new URL(pageUrl)
          imgUrl = base.origin + imgUrl
        }
        if (isGoodImage(imgUrl)) return imgUrl
      }
    }

    // Fallback: first large image in article content
    const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]*>/gi)
    for (const m of imgMatches) {
      let imgUrl = m[1].trim()
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl
      if (imgUrl.startsWith('/')) {
        const base = new URL(pageUrl)
        imgUrl = base.origin + imgUrl
      }
      // Skip tiny thumbnails
      const widthMatch = m[0].match(/width=["']?(\d+)/i)
      if (widthMatch && parseInt(widthMatch[1]) < 200) continue
      if (isGoodImage(imgUrl)) return imgUrl
    }

    return null
  } catch (e) {
    return null
  }
}

async function uploadImageToSanity(imageUrl, filename) {
  try {
    // Fetch the image
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer':    imageUrl,
        'Accept':     'image/*,*/*',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!imgRes.ok) return null

    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    if (!contentType.includes('image')) return null

    const buffer = await imgRes.arrayBuffer()
    if (buffer.byteLength < 5000) return null // Too small, likely a placeholder

    // Upload to Sanity as an asset
    const asset = await sanity.assets.upload('image', Buffer.from(buffer), {
      filename,
      contentType,
    })

    return asset?.url || null
  } catch (e) {
    return null
  }
}

export async function POST(req) {
  const key       = req.headers.get('x-admin-key')
  const cronAuth  = req.headers.get('authorization')
  const cronSecret= process.env.CRON_SECRET
  const isCron    = cronSecret && cronAuth === `Bearer ${cronSecret}`
  const isAdmin   = key === process.env.ADMIN_KEY
  if (!isCron && !isAdmin) return Response.json({ error:'Unauthorized' }, { status:401 })

  const t0 = Date.now()
  try {
  const { limit = 30, force = false } = await req.json().catch(() => ({}))

  // Get articles with missing, placeholder, or non-CDN external images (incl AI-generated)
  const articles = await sanity.fetch(`
    *[_type == "newsArticle" && approved == true
      && defined(externalUrl) && externalUrl != null
      && (
        !defined(imageUrl) || imageUrl == null
        || string::startsWith(imageUrl, "/img/")
        || (!string::startsWith(imageUrl, "https://cdn.sanity.io") && !string::startsWith(imageUrl, "/img/photos/"))
      )
    ] | order(publishedAt desc) [0...\${Math.min(limit, 50)}] {
      _id, title, externalUrl, imageUrl, source, category
    }
  `)

  console.log(`[IMG-FETCH] ${articles.length} articles to process`)

  const results = { fetched: 0, uploaded: 0, skipped: 0, failed: 0, samples: [] }
  const mutations = []

  for (const article of articles) {
    if (!article.externalUrl) { results.skipped++; continue }

    // Skip sources that reliably block
    const domain = new URL(article.externalUrl).hostname.replace('www.', '')
    
    // Extract og:image from source article
    const ogImage = await extractOgImage(article.externalUrl)
    results.fetched++

    if (!ogImage) {
      results.skipped++
      continue
    }

    // Upload to Sanity CDN
    const slug = article.title.toLowerCase().replace(/[^a-z0-9]/g,'-').slice(0,40)
    const cdnUrl = await uploadImageToSanity(ogImage, `${slug}-${article._id.slice(-6)}.jpg`)

    if (cdnUrl) {
      mutations.push({ patch: { id: article._id, set: { imageUrl: cdnUrl } } })
      results.uploaded++
      if (results.samples.length < 10) {
        results.samples.push({
          title:  article.title.slice(0, 50),
          source: domain,
          ogImg:  ogImage.slice(0, 60),
          cdn:    cdnUrl.slice(0, 60),
        })
      }
    } else {
      results.failed++
    }

    // Rate limit - don't hammer sources
    await new Promise(r => setTimeout(r, 300))
  }

  // Batch write to Sanity
  if (mutations.length) {
    await sanity.mutate(mutations)
  }

  await reportCronRun('fetch-images', { status: 'success', ms: Date.now() - t0, details: `fetched:${results.fetched} uploaded:${results.uploaded} failed:${results.failed}` }).catch(() => {})
  return Response.json({ ok: true, total: articles.length, ...results })
  } catch (err) {
    console.error('[IMG-FETCH] crash:', err.message)
    await reportCronRun('fetch-images', { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req) {
  // Cron trigger — Vercel sends Authorization: Bearer <CRON_SECRET>
  return POST(req)
}
