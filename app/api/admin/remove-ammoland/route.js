export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

async function purgeAmmoLand() {
  // Find ALL AmmoLand articles by source field OR URL
  const articles = await sanity.fetch(
    `*[_type == "newsArticle" && (
      source == "AmmoLand" ||
      source == "ammoland" ||
      string::startsWith(coalesce(externalUrl, ""), "https://ammoland.com") ||
      string::startsWith(coalesce(externalUrl, ""), "https://www.ammoland.com")
    )] { _id, title, source, externalUrl }`
  ).catch(() => [])

  console.log('[remove-ammoland] Found', (articles||[]).length, 'AmmoLand articles')

  if (!articles || articles.length === 0) {
    return { deleted: 0, message: 'No AmmoLand articles found in Sanity' }
  }

  // Delete in batches of 50
  let deleted = 0
  const batchSize = 50
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize)
    await sanity.mutate(batch.map(a => ({ delete: { id: a._id } })))
    deleted += batch.length
    console.log('[remove-ammoland] Deleted batch:', deleted, 'total')
  }

  return { deleted, message: deleted + ' AmmoLand articles removed from Sanity' }
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await purgeAmmoLand()
  return NextResponse.json({ ok: true, ...result })
}

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await purgeAmmoLand()
  return NextResponse.json({ ok: true, ...result })
}
