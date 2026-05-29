export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { url, id, type } = body
  if (!url || !id)
    return NextResponse.json({ error: 'url and id are required' }, { status: 400 })

  if (!url.startsWith('http'))
    return NextResponse.json({ error: 'url must start with http' }, { status: 400 })

  try {
    // Step 1: Download the image binary from the external URL
    const imgRes = await fetch(url, {
      headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!imgRes.ok)
      return NextResponse.json({ error: 'Download failed: ' + imgRes.status + ' from ' + url }, { status: 400 })

    // Step 2: Get content type and build filename from URL
    const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : 'jpg'
    const slug = (url.split('/').pop().split('?')[0].replace(/[^a-z0-9.-]/gi, '-') || 'image') + '.' + ext
    const filename = slug.slice(0, 80)

    // Step 3: Upload binary to Sanity asset store
    const imageBuffer = await imgRes.arrayBuffer()
    const uint8 = new Uint8Array(imageBuffer)

    const asset = await sanity.assets.upload('image', Buffer.from(uint8), {
      filename,
      contentType,
    })

    // asset.url is the permanent cdn.sanity.io URL
    const cdnUrl = asset.url
    if (!cdnUrl)
      return NextResponse.json({ error: 'Sanity upload returned no URL' }, { status: 500 })

    // Step 4: Patch the article with the CDN URL
    if (type && id) {
      await sanity.patch(id).set({ imageUrl: cdnUrl }).commit()
    }

    return NextResponse.json({
      ok:      true,
      cdnUrl,
      assetId: asset._id,
      original: url,
    })

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
