export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

async function scrapeOGImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    return m ? m[1].trim() : null
  } catch (_e) { return null }
}

export async function POST(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { limit = 20 } = await req.json().catch(() => ({}))

  // Fetch deals with no imageUrl
  const docs = await sanity.fetch(
    `*[_type=="gunDeal" && (imageUrl == null || imageUrl == "")] | order(publishedAt desc) [0..${Math.min(limit, 50) - 1}] { _id, externalUrl, title }`
  ).catch(() => [])

  const results = { total: docs.length, updated: 0, failed: 0 }

  // Process 5 at a time
  const BATCH = 5
  for (let i = 0; i < docs.length; i += BATCH) {
    const chunk = docs.slice(i, i + BATCH)
    await Promise.allSettled(chunk.map(async (doc) => {
      const img = await scrapeOGImage(doc.externalUrl)
      if (img) {
        await sanity.patch(doc._id).set({ imageUrl: img }).commit()
        results.updated++
      } else {
        results.failed++
      }
    }))
  }

  return NextResponse.json({ ok: true, ...results })
}
