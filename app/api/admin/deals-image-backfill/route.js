export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Full browser UA — gun.deals returns 200 with these headers from Vercel
const SCRAPE_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
}

async function scrapeOGImage(url) {
  try {
    const res = await fetch(url, {
      headers: SCRAPE_HEADERS,
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()
    // [\s\S] handles newlines inside meta tag attributes (gun.deals sometimes has them)
    const m = html.match(/<meta[\s\S]*?property=["']og:image["'][\s\S]*?content=["']([^"']+)["']/i)
           || html.match(/<meta[\s\S]*?content=["']([^"']+)["'][\s\S]*?property=["']og:image["']/i)
    return m ? m[1].trim() : null
  } catch (_e) { return null }
}

export async function POST(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { limit = 50, force = false } = await req.json().catch(() => ({}))

  // force=true backfills ALL docs regardless of current imageUrl
  const groq = force
    ? `*[_type=="gunDeal"] | order(publishedAt desc) [0..${Math.min(limit, 100) - 1}] { _id, externalUrl, title, imageUrl }`
    : `*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(publishedAt desc) [0..${Math.min(limit, 100) - 1}] { _id, externalUrl, title }`

  const docs = await sanity.fetch(groq).catch(() => [])
  const results = { total: docs.length, updated: 0, failed: 0, skipped: 0 }

  const CONCURRENCY = 5
  for (let i = 0; i < docs.length; i += CONCURRENCY) {
    const chunk = docs.slice(i, i + CONCURRENCY)
    await Promise.allSettled(chunk.map(async (doc) => {
      if (!doc.externalUrl) { results.skipped++; return }
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
