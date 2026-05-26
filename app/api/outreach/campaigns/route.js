export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const campaigns = await sanity.fetch(`*[_type == "outreachCampaign"] | order(createdAt desc) {
    _id, name, type, status, targetTypes, targetTags, targetStates,
    scheduledAt, sentAt, fromName, fromEmail, stats, notes, createdAt,
    template->{ _id, name, subject }
  }`)
  return Response.json({ ok: true, campaigns })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const doc = await sanity.create({
    _type: 'outreachCampaign',
    ...body,
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, unsubscribed: 0 },
    createdAt: new Date().toISOString()
  })
  return Response.json({ ok: true, campaign: doc })
}

export async function PATCH(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  const doc = await sanity.patch(id).set(updates).commit()
  return Response.json({ ok: true, campaign: doc })
}

export async function DELETE(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await sanity.delete(id)
  return Response.json({ ok: true })
}
