export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const tier   = searchParams.get('tier')
  const q      = searchParams.get('q')

  let filter = '_type == "youtubeInfluencer" && active != false'
  if (status) filter += ` && outreachStatus == "${status}"`
  if (tier)   filter += ` && tier == "${tier}"`

  const items = await sanity.fetch(
    `*[${filter}] | order(subscribers desc) [0...200] {
      _id, channelName, hostName, email, email2, youtubeUrl, channelId,
      subscribers, monthlyViews, avgViews, uploadFreq,
      focus, tier, outreachStatus, lastContactedAt, nextFollowUpAt,
      partnershipType, instagram, twitter, website,
      bio, whyGoodFit, notes, tags, verified, addedAt, source,
      startedYear, videoCount, dealValue
    }`
  ).catch(() => [])

  const filtered = q
    ? items.filter(i =>
        (i.channelName || '').toLowerCase().includes(q.toLowerCase()) ||
        (i.hostName || '').toLowerCase().includes(q.toLowerCase()) ||
        (i.focus || []).some(f => f.toLowerCase().includes(q.toLowerCase()))
      )
    : items

  return Response.json({ ok: true, items: filtered })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const { action, id, fields } = body

  if (action === 'patch') {
    await sanity.patch(id).set(fields).commit()
    return Response.json({ ok: true })
  }

  if (action === 'create') {
    const doc = await sanity.create({
      _type:           'youtubeInfluencer',
      channelName:     body.channelName,
      hostName:        body.hostName || '',
      email:           body.email || '',
      youtubeUrl:      body.youtubeUrl || '',
      subscribers:     body.subscribers || 0,
      tier:            body.tier || 'micro (10K–50K)',
      outreachStatus:  'identified',
      active:          true,
      addedAt:         new Date().toISOString(),
      source:          'manual',
    })
    return Response.json({ ok: true, id: doc._id })
  }

  if (action === 'delete') {
    await sanity.delete(id)
    return Response.json({ ok: true })
  }

  if (action === 'bulk-status') {
    for (const _id of (body.ids || [])) {
      await sanity.patch(_id).set({ outreachStatus: body.status }).commit()
    }
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
