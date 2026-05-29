export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Search for a real image URL related to the topic using DDG image search
async function searchImage(query) {
  try {
    // Use DuckDuckGo's image search API (no auth, freely accessible from Vercel)
    const encoded = encodeURIComponent(query + ' firearms gun high resolution photo')
    const vqd = await getVqd(encoded)
    if (!vqd) return null

    const res = await fetch(
      'https://duckduckgo.com/i.js?q=' + encoded + '&o=json&vqd=' + vqd,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)',
          'Referer': 'https://duckduckgo.com/',
        },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const results = data.results || []
    // Filter for high-quality images from reputable domains
    for (const img of results.slice(0, 15)) {
      const url = img.image || img.thumbnail
      if (!url) continue
      // Skip small images, gifs, svg
      if (url.endsWith('.gif') || url.endsWith('.svg')) continue
      if (img.width < 800 || img.height < 400) continue
      // Skip stock photo watermark sites
      const domain = new URL(url).hostname.toLowerCase()
      if (domain.includes('istock') || domain.includes('getty') || domain.includes('shutterstock') || domain.includes('alamy')) continue
      return url
    }
  } catch {}
  return null
}

async function getVqd(query) {
  try {
    const res = await fetch('https://duckduckgo.com/?q=' + query + '&iax=images&ia=images', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)' },
      signal: AbortSignal.timeout(6000),
    })
    const html = await res.text()
    const match = html.match(/vqd=['"]([^'"]+)['"]/)
    return match ? match[1] : null
  } catch { return null }
}

// Scrape og:image from a specific URL
async function fetchOgImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    return m ? m[1] : null
  } catch { return null }
}

// Topic-specific image searches — article slug → search query
const TOPIC_QUERIES = {
  'suppressor-revolution-2026':          'AR-15 suppressor silencer attached rifle range tactical',
  'micro-compact-pistol-market-2026':    'Glock 19 SIG P365 compact EDC handgun holster',
  'gun-prices-tariffs-2026':             'ammunition ammo bulk 9mm brass cartridges stacked',
  'bruen-standard-state-battles-2026':   'Second Amendment US Supreme Court Constitution gun rights',
  'red-dot-carry-guide-2026':            'red dot sight Trijicon pistol optic handgun range',
}

// Fallback curated CDN image URLs (Wikimedia Commons — truly public domain)
// These are direct file URLs that work from any server without auth
const FALLBACK_IMAGES = {
  'suppressor-revolution-2026':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/AR15_Rifle.jpg/1280px-AR15_Rifle.jpg',
  'micro-compact-pistol-market-2026':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Glock_17_Generations_1-4.jpg/1280px-Glock_17_Generations_1-4.jpg',
  'gun-prices-tariffs-2026':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Ammo_comparison.jpg/1280px-Ammo_comparison.jpg',
  'bruen-standard-state-battles-2026':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/SCOTUS_3_2010.jpg/1280px-SCOTUS_3_2010.jpg',
  'red-dot-carry-guide-2026':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Tactical_Pistol.jpg/1280px-Tactical_Pistol.jpg',
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { slug, query, useFallback } = body

  try {
    // If specific slug requested, handle it
    if (slug) {
      const searchQuery = query || TOPIC_QUERIES[slug]
      let imageUrl = null

      if (!useFallback && searchQuery) {
        imageUrl = await searchImage(searchQuery)
      }
      if (!imageUrl) {
        imageUrl = FALLBACK_IMAGES[slug] || null
      }

      if (!imageUrl) return NextResponse.json({ ok: false, error: 'No image found' })

      // Save to Sanity if this is a Sanity post
      const post = await sanity.fetch(
        '*[_type=="blogPost" && slug.current==$s][0]{_id}',
        { s: slug }
      ).catch(() => null)

      if (post?._id) {
        await sanity.patch(post._id).set({ imageUrl }).commit()
      }

      return NextResponse.json({ ok: true, slug, imageUrl })
    }

    // Batch: update all known static blog slugs + Sanity posts
    const results = []

    // Update static blog post slugs
    for (const [slugKey, searchQ] of Object.entries(TOPIC_QUERIES)) {
      let imageUrl = await searchImage(searchQ)
      if (!imageUrl) imageUrl = FALLBACK_IMAGES[slugKey]
      if (!imageUrl) { results.push({ slug: slugKey, ok: false }); continue }

      // Try to update Sanity post with matching slug
      const post = await sanity.fetch(
        '*[_type=="blogPost" && slug.current==$s][0]{_id}',
        { s: slugKey }
      ).catch(() => null)

      if (post?._id) {
        await sanity.patch(post._id).set({ imageUrl }).commit()
      }

      results.push({ slug: slugKey, ok: true, imageUrl })
    }

    // Also update all Sanity blog posts that have /img/ images
    const sanityPosts = await sanity.fetch(
      '*[_type=="blogPost" && (imageUrl == null || string::startsWith(imageUrl, "/img/"))] { _id, title, slug, category }'
    ).catch(() => [])

    for (const post of (sanityPosts || []).slice(0, 20)) {
      const q = (post.title || post.category || 'firearms gun tactical').slice(0, 80)
      let imageUrl = await searchImage(q)
      // If no image found, use category-based fallback
      if (!imageUrl) {
        const cat = (post.category || '').toLowerCase()
        imageUrl = cat.includes('law') ? FALLBACK_IMAGES['bruen-standard-state-battles-2026']
          : cat.includes('ammo') || cat.includes('market') ? FALLBACK_IMAGES['gun-prices-tariffs-2026']
          : FALLBACK_IMAGES['suppressor-revolution-2026']
      }
      if (imageUrl) {
        await sanity.patch(post._id).set({ imageUrl }).commit()
        results.push({ slug: post.slug?.current, ok: true, imageUrl: imageUrl.slice(0, 60) })
      }
    }

    return NextResponse.json({ ok: true, updated: results.filter(r => r.ok).length, results })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
