export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

export async function POST(req) {
  try {
    const { email, caliber, threshold } = await req.json()
    if (!email || !caliber || !threshold) return Response.json({ error: 'Missing fields' }, { status: 400 })

    await sanity.create({
      _type: 'priceAlert',
      email, caliber, threshold: parseFloat(threshold),
      active: true, createdAt: new Date().toISOString(),
    })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
