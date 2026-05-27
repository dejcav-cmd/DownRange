export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error:'Unauthorized' }, { status:401 })

  const matches = await sanity.fetch(
    '*[_type=="competition"] | order(startDate asc) [0...500] { _id, name, org, discipline, matchType, level, startDate, endDate, city, state, country, entryFee, registrationUrl, approved, featured, description }'
  ).catch(() => [])

  return Response.json({ ok:true, matches })
}
