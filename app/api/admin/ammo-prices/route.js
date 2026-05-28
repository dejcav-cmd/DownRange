export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const prices = await sanity.fetch(
      '*[_type=="ammoPrice"] | order(caliber asc) { _id, caliber, pricePerRound, trendDir, trendPct, inStock, recordedAt }'
    )
    return NextResponse.json({ ok: true, prices: prices || [] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
