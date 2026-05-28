export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const states = await sanity.fetch(`
      *[_type == "stateProfile"] | order(name asc) {
        _id, name, abbr, rating, constitutionalCarry, ccwPermit, redFlagLaw,
        magLimit, awbStatus, suppressors, openCarry, bgcPrivate,
        reciprocityStates[], _updatedAt
      }
    `)
    return Response.json({ ok: true, states, count: states.length })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
