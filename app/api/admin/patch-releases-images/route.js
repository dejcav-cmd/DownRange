export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

const CAT_IMGS = {
  Pistol:     '/img/photos/pistol.jpg',
  Revolver:   '/img/photos/pistol.jpg',
  Rifle:      '/img/photos/rifle.jpg',
  Shotgun:    '/img/photos/shotgun.jpg',
  Suppressor: '/img/photos/suppressor.jpg',
  default:    '/img/photos/pistol.jpg',
}

async function fetchOgImage(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36' },
      signal: AbortSignal.timeout(8000), redirect: 'follow',
    })
    if (!r.ok) return null
    const html = await r.text()
    const m = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
           || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
    const img = m?.[1]
    return img && img.startsWith('http') && !img.includes('logo') && !img.includes('icon') ? img : null
  } catch { return null }
}

export async function POST(req) {
  const admin = req.headers.get('x-admin-key')
  if (admin !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const docs = await sanity.fetch(
    `*[_type=="firearmRelease" && defined(sourceUrl)] | order(publishedAt desc) [0...200] { _id, brand, model, category, sourceUrl, imageUrl }`
  )

  let patched = 0, fallback = 0, skipped = 0

  for (const doc of docs) {
    // Skip only if already has a real manufacturer image (not a generic fallback)
    const isGeneric = !doc.imageUrl 
      || doc.imageUrl.includes('unsplash.com') 
      || doc.imageUrl.includes('pexels.com')
    if (!isGeneric) { skipped++; continue }

    const img = await fetchOgImage(doc.sourceUrl)
    const finalImg = img || CAT_IMGS[doc.category] || CAT_IMGS.default

    await sanity.patch(doc._id).set({ imageUrl: finalImg }).commit()
    if (img) patched++; else fallback++
    await new Promise(r => setTimeout(r, 300))
  }

  return Response.json({ ok: true, patched, fallback, skipped, message: `${patched} real images, ${fallback} category fallbacks, ${skipped} already had images` })
}

export async function GET(req) { return POST(req) }
