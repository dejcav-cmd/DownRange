export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

export async function POST(req) {
  try {
    const { email, billId, billTitle } = await req.json()
    if (!email || !billId) return Response.json({ error: 'Missing fields' }, { status: 400 })
    await sanity.createIfNotExists({
      _id: `tracker-${Buffer.from(email+billId).toString('base64').slice(0,32)}`,
      _type: 'billTracker',
      email, billId, billTitle,
      active: true, createdAt: new Date().toISOString(),
    })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
