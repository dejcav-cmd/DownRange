export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// GET /api/outreach/contacts?type=youtuber&state=WA&limit=100&search=glock&status=active
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const p = new URL(req.url).searchParams
  const type   = p.get('type')
  const state  = p.get('state')
  const status = p.get('status') || 'active'
  const search = p.get('search')
  const limit  = Math.min(500, parseInt(p.get('limit') || '200'))

  let filter = `_type == "outreachContact"`
  if (type)   filter += ` && type == "${type}"`
  if (state)  filter += ` && state == "${state}"`
  if (status) filter += ` && status == "${status}"`
  if (search) filter += ` && (name match "*${search}*" || email match "*${search}*" || city match "*${search}*")`

  const contacts = await sanity.fetch(
    `*[${filter}] | order(addedAt desc) [0...${limit}] {
      _id, type, name, firstName, email, phone, website, youtubeUrl, youtubeChannel,
      subscribers, instagram, twitter, city, state, zip, fflLicense,
      nraInstructorId, specialties, tags, status, source, notes,
      addedAt, lastContactedAt, emailPermission
    }`
  )

  // Stats
  const stats = await sanity.fetch(`{
    "total":      count(*[_type == "outreachContact"]),
    "active":     count(*[_type == "outreachContact" && status == "active"]),
    "youtubers":  count(*[_type == "outreachContact" && type == "youtuber"]),
    "shops":      count(*[_type == "outreachContact" && type == "gun_shop"]),
    "instructors":count(*[_type == "outreachContact" && type == "instructor"]),
    "dealers":    count(*[_type == "outreachContact" && type == "ffl_dealer"]),
    "withEmail":  count(*[_type == "outreachContact" && defined(email) && email != ""]),
    "permitted":  count(*[_type == "outreachContact" && emailPermission == true]),
    "orgs":       count(*[_type == "outreachContact" && type == "organization"]),
  }`)

  return Response.json({ ok: true, contacts, stats, count: contacts.length })
}

// POST /api/outreach/contacts — create or bulk upsert
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  if (Array.isArray(body)) {
    // Bulk create — deduplicate by email
    const results = { created: 0, skipped: 0, errors: [] }
    for (const contact of body) {
      try {
        if (contact.email) {
          const exists = await sanity.fetch(
            `*[_type == "outreachContact" && email == $email][0]._id`,
            { email: contact.email }
          )
          if (exists) { results.skipped++; continue }
        }
        await sanity.create({ _type: 'outreachContact', ...contact, addedAt: new Date().toISOString() })
        results.created++
      } catch (err) {
        results.errors.push({ contact: contact.email || contact.name, error: err.message })
      }
    }
    return Response.json({ ok: true, ...results })
  }

  // Single create
  const doc = await sanity.create({ _type: 'outreachContact', ...body, addedAt: new Date().toISOString() })
  return Response.json({ ok: true, contact: doc })
}

// PATCH /api/outreach/contacts — update one
export async function PATCH(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  const doc = await sanity.patch(id).set(updates).commit()
  return Response.json({ ok: true, contact: doc })
}

// DELETE /api/outreach/contacts
export async function DELETE(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ids } = await req.json()
  if (ids) {
    await Promise.all(ids.map(i => sanity.delete(i)))
    return Response.json({ ok: true, deleted: ids.length })
  }
  await sanity.delete(id)
  return Response.json({ ok: true })
}
