export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// GET /api/outreach/history?contactId=xxx   → history for one contact
// GET /api/outreach/history?limit=100        → global recent sends
// GET /api/outreach/history?view=stats       → aggregate stats
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const p = new URL(req.url).searchParams
  const contactId = p.get('contactId')
  const view      = p.get('view')
  const limit     = Math.min(500, parseInt(p.get('limit') || '100'))

  if (view === 'stats') {
    const stats = await sanity.fetch(`{
      "totalSent":      count(*[_type == "outreachSendLog"]),
      "sent":           count(*[_type == "outreachSendLog" && status == "sent"]),
      "opened":         count(*[_type == "outreachSendLog" && status == "opened"]),
      "clicked":        count(*[_type == "outreachSendLog" && status == "clicked"]),
      "replied":        count(*[_type == "outreachSendLog" && status == "replied"]),
      "bounced":        count(*[_type == "outreachSendLog" && status == "bounced"]),
      "failed":         count(*[_type == "outreachSendLog" && status == "failed"]),
      "last24h":        count(*[_type == "outreachSendLog" && sentAt > $since]),
      "uniqueContacts": count(*[_type == "outreachContact" && defined(lastContactedAt)]),
    }`, { since: new Date(Date.now() - 86400000).toISOString() })
    return Response.json({ ok: true, stats })
  }

  if (contactId) {
    const logs = await sanity.fetch(
      `*[_type == "outreachSendLog" && contact._ref == $id] | order(sentAt desc) [0...50] {
        _id, status, toEmail, subject, sentAt, openedAt, clickedAt, repliedAt, error, resendId,
        campaign->{ _id, name, type }
      }`,
      { id: contactId }
    )
    return Response.json({ ok: true, logs })
  }

  const logs = await sanity.fetch(
    `*[_type == "outreachSendLog"] | order(_createdAt desc) [0...${limit}] {
      _id, status, toEmail, toName, subject, bodyHtml, sentAt, draftedAt, approvedAt,
      openedAt, clickedAt, repliedAt, error, resendId,
      contact->{ _id, name, type, youtubeUrl },
      campaign->{ _id, name, type }
    }`
  )
  return Response.json({ ok: true, logs, count: logs.length })
}

// PATCH /api/outreach/history — update a log entry status (e.g. mark replied)
export async function PATCH(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status, notes } = await req.json()
  const updates = { status }
  if (status === 'replied')  updates.repliedAt  = new Date().toISOString()
  if (status === 'opened')   updates.openedAt   = new Date().toISOString()
  if (status === 'clicked')  updates.clickedAt  = new Date().toISOString()
  if (notes) updates.notes = notes
  const doc = await sanity.patch(id).set(updates).commit()
  return Response.json({ ok: true, log: doc })
}
