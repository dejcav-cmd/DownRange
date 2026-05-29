export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Find all AmmoLand articles
    const articles = await sanity.fetch(
      '*[_type == "newsArticle" && (source == "AmmoLand" || string::startsWith(externalUrl, "https://ammoland.com") || string::startsWith(externalUrl, "https://www.ammoland.com"))] { _id, title }'
    )

    if (!articles || articles.length === 0) {
      return NextResponse.json({ ok: true, deleted: 0, message: 'No AmmoLand articles found' })
    }

    // Delete in batches
    let deleted = 0
    const batchSize = 50
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      await sanity.mutate(batch.map(a => ({ delete: { id: a._id } })))
      deleted += batch.length
    }

    return NextResponse.json({ ok: true, deleted, message: deleted + ' AmmoLand articles removed' })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const count = await sanity.fetch(
    'count(*[_type == "newsArticle" && (source == "AmmoLand" || string::startsWith(externalUrl, "https://ammoland.com"))])'
  ).catch(() => 0)

  return NextResponse.json({ ok: true, ammolandCount: count })
}
