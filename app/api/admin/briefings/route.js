export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// GET /api/admin/briefings?limit=30   — list briefings
// GET /api/admin/briefings?id=xxx     — single briefing full detail
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const p  = new URL(req.url).searchParams
  const id = p.get('id')

  if (id) {
    const b = await sanity.fetch(`*[_type == "dailyBriefing" && _id == $id][0]`, { id })
    return Response.json({ ok: true, briefing: b })
  }

  const limit = Math.min(90, parseInt(p.get('limit') || '30'))
  const briefings = await sanity.fetch(
    `*[_type == "dailyBriefing"] | order(date desc) [0...${limit}] {
      _id, date, runAt, status, score, headline, summary, emailSent,
      "recCount":  count(recommendations),
      "gapCount":  count(contentGaps),
      "issueCount": count(issues),
      "openRecs":   count(recommendations[done != true]),
      "openIssues": count(issues[fixed != true]),
    }`
  )

  return Response.json({ ok: true, briefings, count: briefings.length })
}

// PATCH /api/admin/briefings — mark rec done, issue fixed
export async function PATCH(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { briefingId, type, key, value } = await req.json()
  // type: 'rec' | 'issue'
  // key: the _key of the item
  // value: true/false

  const briefing = await sanity.fetch(
    `*[_type == "dailyBriefing" && _id == $id][0] { recommendations, issues }`,
    { id: briefingId }
  )
  if (!briefing) return Response.json({ error: 'Not found' }, { status: 404 })

  if (type === 'rec') {
    const recs = (briefing.recommendations || []).map(r =>
      r._key === key ? { ...r, done: value } : r
    )
    await sanity.patch(briefingId).set({ recommendations: recs }).commit()
  } else if (type === 'issue') {
    const issues = (briefing.issues || []).map(i =>
      i._key === key ? { ...i, fixed: value } : i
    )
    await sanity.patch(briefingId).set({ issues }).commit()
  }

  return Response.json({ ok: true })
}
