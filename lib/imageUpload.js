import { isOnTopicImage, downloadForCheck } from './imageVerify.js'

/**
 * Fetch an image URL and upload it to Sanity CDN.
 * Returns the CDN URL on success, null on any failure.
 *
 * Handles hotlink-blocked sources (Pixabay /get/ URLs, Pexels) by
 * fetching server-side and re-hosting on Sanity CDN.
 */
export async function uploadImageToSanity(imageUrl, label = 'image') {
  if (!imageUrl) return null
  const token = process.env.SANITY_API_TOKEN
  const project = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
  if (!token) return imageUrl  // can't upload, return as-is

  // Already on Sanity CDN — no need to re-upload
  if (imageUrl.includes('cdn.sanity.io')) return imageUrl

  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)',
        'Referer': 'https://downrangeco.com',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null

    const buf = await res.arrayBuffer()
    if (buf.byteLength < 5000) return null  // skip tiny placeholders

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const filename = `${label}-${Date.now()}.${ext}`

    const upload = await fetch(
      `https://${project}.api.sanity.io/v2024-01-01/assets/images/production?filename=${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': contentType,
        },
        body: buf,
      }
    )
    if (!upload.ok) return null
    const data = await upload.json()
    return data?.document?.url || data?.url || null
  } catch {
    return null
  }
}

/**
 * Search Pexels then Pixabay for a query and upload the first result that
 * passes a vision relevance check to the Sanity CDN.
 * Never uses an unchecked first result. Returns Sanity CDN URL or null.
 */
export async function fetchAndUploadImage(query, label = 'img', topic) {
  const candidates = []

  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=landscape`,
        { headers: { Authorization: pexelsKey }, signal: AbortSignal.timeout(10000) }
      )
      const data = await res.json()
      for (const p of data.photos || []) candidates.push(p.src.large || p.src.large2x)
    } catch {}
  }

  const pixabayKey = process.env.PIXABAY_API_KEY
  if (pixabayKey) {
    try {
      const url = new URL('https://pixabay.com/api/')
      url.searchParams.set('key', pixabayKey)
      url.searchParams.set('q', query)
      url.searchParams.set('image_type', 'photo')
      url.searchParams.set('orientation', 'horizontal')
      url.searchParams.set('per_page', '8')
      url.searchParams.set('safesearch', 'true')
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
      const data = await res.json()
      for (const h of data.hits || []) candidates.push(h.largeImageURL || h.webformatURL)
    } catch {}
  }

  let checked = 0
  for (const url of candidates.filter(Boolean)) {
    if (checked >= 8) break
    checked++
    const dl = await downloadForCheck(url)
    if (!dl) continue
    if (!(await isOnTopicImage(dl.buf, dl.contentType, topic || query))) continue
    const cdn = await uploadImageToSanity(url, label)
    if (cdn) return cdn
  }
  return null
}
