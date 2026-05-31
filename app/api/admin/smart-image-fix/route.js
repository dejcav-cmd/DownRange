export const dynamic = 'force-dynamic'
export const maxDuration = 120
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const k = req.headers.get('x-admin-key')
  const c = req.headers.get('x-vercel-cron') === '1'
  return k === process.env.ADMIN_KEY || c
}

// Search Wikimedia Commons for CC0/public domain images on a topic
// Returns an array of image URLs safe to use without copyright concerns
async function searchWikimedia(query, limit = 3) {
  try {
    const q = encodeURIComponent(query + ' firearm gun')
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&srlimit=${limit}&format=json&origin=*`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DownRange/1.0 (downrangeco.com; dj@downrangeco.com)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const pages = data?.query?.search || []
    const results = []
    for (const page of pages.slice(0, limit)) {
      const title = page.title // e.g. "File:Glock 17.jpg"
      if (!title.match(/\.(jpg|jpeg|png|webp)/i)) continue
      const thumbUrl = await getWikimediaThumb(title)
      if (thumbUrl) results.push(thumbUrl)
    }
    return results
  } catch { return [] }
}

async function getWikimediaThumb(title) {
  try {
    const enc = encodeURIComponent(title)
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${enc}&prop=imageinfo&iiprop=url|mediatype&iiurlwidth=1200&format=json&origin=*`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DownRange/1.0 (downrangeco.com)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data?.query?.pages || {}
    for (const page of Object.values(pages)) {
      const info = page?.imageinfo?.[0]
      if (info?.thumburl) return info.thumburl
      if (info?.url) return info.url
    }
    return null
  } catch { return null }
}

// Try to fetch og:image from a source URL
async function tryOgImage(sourceUrl) {
  if (!sourceUrl?.startsWith('http')) return null
  try {
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    for (const pat of [
      /property=['"']og:image['"'][^>]*content=['"']([^'"']{20,})['"']/i,
      /content=['"']([^'"']{20,})['"'][^>]*property=['"']og:image['"']/i,
      /name=['"']twitter:image['"'][^>]*content=['"']([^'"']{20,})['"']/i,
    ]) {
      const m = html.match(pat)
      if (m?.[1]?.startsWith('http') &&
          !m[1].includes('placeholder') &&
          !m[1].includes('favicon') &&
          !m[1].includes('logo') &&
          !m[1].includes('1x1') &&
          m[1].match(/\.(jpg|jpeg|png|webp)/i)) {
        return m[1]
      }
    }
  } catch {}
  return null
}

// Build smart search query for Wikimedia based on article title
function buildSearchQuery(title) {
  const t = (title || '').toLowerCase()
  if (/glock|sig.sauer|p320|beretta|colt|smith.wesson|ruger|springfield|walther|kimber|canik/.test(t)) {
    const brand = (t.match(/glock|sig|beretta|colt|ruger|springfield|walther|kimber|canik/)?.[0] || 'pistol')
    return brand + ' pistol handgun'
  }
  if (/ar.?15|ar15|m16|m4\b|assault.rifle|semi.*auto.*rifle/.test(t)) return 'AR-15 rifle'
  if (/ak.?47|ak47|ak.?74/.test(t)) return 'AK-47 rifle'
  if (/shotgun|12.gauge|mossberg|remington.870/.test(t)) return 'shotgun firearm'
  if (/suppressor|silencer|nfa/.test(t)) return 'suppressor silencer firearm'
  if (/ammunition|ammo|9mm|bullet|cartridge/.test(t)) return 'ammunition firearm'
  if (/conceal|ccw|carry.permit|holster/.test(t)) return 'concealed carry holster'
  if (/atf|federal.court|supreme.court|legislation|bill\b|congress|senate|law/.test(t)) return 'united states capitol congress'
  if (/police|law.enforcement|sheriff|officer/.test(t)) return 'law enforcement police'
  if (/military|army|marine|navy|soldier|combat/.test(t)) return 'military soldier weapon'
  if (/home.defense|self.defense|nightstand/.test(t)) return 'home defense firearm'
  if (/range|training|practice/.test(t)) return 'shooting range firearm'
  return 'firearm gun second amendment'
}

// POST: patch specific articles by slug or ID
// GET: scan for articles with bad images and fix them
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const batch = Math.min(50, parseInt(url.searchParams.get('batch') || '20'))
  const slugs = url.searchParams.get('slugs')?.split(',').filter(Boolean) || []

  // Build query — either specific slugs or batch of articles with bad images
  const BAD_PATTERNS = ['/img/photos/', '/img/pistol.svg', '/img/rifle.svg', '/img/law.svg', '/img/shotgun.svg', '/img/suppressor.svg', '/img/ammo.svg']

  let docs = []
  if (slugs.length > 0) {
    // Fetch specific articles by slug
    for (const slug of slugs) {
      const doc = await sanity.fetch(
        `*[_type == "newsArticle" && slug.current == $s][0] { _id, title, imageUrl, "sourceUrl": externalUrl }`,
        { s: slug }
      ).catch(() => null)
      if (doc) docs.push(doc)
    }
  } else {
    // Fetch articles with generic/bad images — news articles only (most common issue)
    // Build a condition that doesn't use JS template literals inside GROQ
    const q = '*[_type == "newsArticle" && editorLocked != true && defined(imageUrl)] | order(publishedAt desc) [0...' + batch + '] { _id, title, imageUrl, "sourceUrl": externalUrl }'
    docs = await sanity.fetch(q).catch(() => [])
    // Filter to only bad images in JS
    docs = docs.filter(d => BAD_PATTERNS.some(p => (d.imageUrl || '').startsWith(p)))
  }

  const stats = { scanned: docs.length, ogSuccess: 0, wikimediaSuccess: 0, failed: 0, results: [] }

  for (const doc of docs) {
    let newImageUrl = null

    // Step 1: Try to get og:image from the source article
    if (doc.sourceUrl) {
      newImageUrl = await tryOgImage(doc.sourceUrl)
      if (newImageUrl) stats.ogSuccess++
    }

    // Step 2: Wikimedia Commons search (CC0 / public domain)
    if (!newImageUrl) {
      const query = buildSearchQuery(doc.title)
      const images = await searchWikimedia(query, 2)
      if (images.length > 0) {
        newImageUrl = images[0]
        stats.wikimediaSuccess++
      }
    }

    if (newImageUrl) {
      try {
        await sanity.patch(doc._id).set({ imageUrl: newImageUrl }).commit()
        stats.results.push({ id: doc._id, title: doc.title?.slice(0,60), newUrl: newImageUrl, source: newImageUrl.includes('wikimedia') ? 'wikimedia' : 'og:image' })
      } catch (e) {
        stats.failed++
        stats.results.push({ id: doc._id, title: doc.title?.slice(0,60), error: e.message })
      }
    } else {
      stats.failed++
      stats.results.push({ id: doc._id, title: doc.title?.slice(0,60), error: 'No image found' })
    }

    await new Promise(r => setTimeout(r, 200))
  }

  return Response.json({
    ok: true,
    ...stats,
    message: `${stats.scanned} articles · ${stats.ogSuccess} OG images · ${stats.wikimediaSuccess} Wikimedia · ${stats.failed} no image found`,
  })
}

export async function GET(req) { return POST(req) }
