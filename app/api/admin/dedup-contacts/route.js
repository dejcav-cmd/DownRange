export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// Score a contact by data completeness — higher = keep this one
function score(c) {
  let s = 0
  if (c.email)          s += 10  // email is highest value
  if (c.phone)          s += 4
  if (c.website)        s += 3
  if (c.youtubeUrl)     s += 3
  if (c.firstName)      s += 2
  if (c.city)           s += 1
  if (c.state)          s += 1
  if (c.notes)          s += 2
  if (c.subscribers > 0) s += 2
  if (c.fflLicense)     s += 3
  if (c.instagram)      s += 1
  if (c.twitter)        s += 1
  if (c.tags?.length)   s += 1
  return s
}

const FULL_QUERY = `*[_type == "outreachContact"] | order(name asc) {
  _id, name, firstName, email, phone, website, youtubeUrl,
  type, status, city, state, notes, subscribers, fflLicense,
  instagram, twitter, tags, addedAt
}`

// GET — find all duplicate groups
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const all = await sanity.fetch(FULL_QUERY)

  const byName = {}
  for (const c of all) {
    const key = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!key) continue
    if (!byName[key]) byName[key] = []
    byName[key].push(c)
  }

  const byEmail = {}
  for (const c of all) {
    if (!c.email) continue
    const key = c.email.toLowerCase().trim()
    if (!byEmail[key]) byEmail[key] = []
    byEmail[key].push(c)
  }

  const byWebsite = {}
  for (const c of all) {
    if (!c.website) continue
    const key = c.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    if (!byWebsite[key]) byWebsite[key] = []
    byWebsite[key].push(c)
  }

  const seen = new Set()
  const uniqueGroups = []

  for (const group of [
    ...Object.values(byName),
    ...Object.values(byEmail),
    ...Object.values(byWebsite),
  ]) {
    if (group.length < 2) continue
    const key = group.map(c => c._id).sort().join(',')
    if (seen.has(key)) continue
    seen.add(key)

    // Sort: highest score first, ties broken by oldest addedAt
    const sorted = [...group].sort((a, b) => {
      const sd = score(b) - score(a)
      if (sd !== 0) return sd
      return new Date(a.addedAt || 0) - new Date(b.addedAt || 0)
    })

    uniqueGroups.push({
      contacts: sorted,
      keepId:   sorted[0]._id,
      deleteIds: sorted.slice(1).map(c => c._id),
      scores:   sorted.map(c => ({ _id: c._id, score: score(c) })),
    })
  }

  return Response.json({
    ok: true,
    total: all.length,
    duplicateGroups: uniqueGroups,
    duplicateCount: uniqueGroups.reduce((s, g) => s + g.deleteIds.length, 0),
  })
}

// POST — merge or auto-clean
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'merge') {
    const { keepId, deleteIds } = body
    if (!keepId || !deleteIds?.length) return Response.json({ error: 'keepId and deleteIds required' }, { status: 400 })
    let deleted = 0
    for (const id of deleteIds) {
      try { await sanity.delete(id); deleted++ } catch {}
    }
    return Response.json({ ok: true, deleted })
  }

  if (action === 'delete-all-duplicates') {
    const all = await sanity.fetch(FULL_QUERY)

    const byName = {}
    for (const c of all) {
      const key = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!key) continue
      if (!byName[key]) byName[key] = []
      byName[key].push(c)
    }

    let deleted = 0
    const deletedIds = new Set()

    for (const group of Object.values(byName)) {
      if (group.length < 2) continue

      // Sort by score desc, then oldest first for tiebreaks
      group.sort((a, b) => {
        const sd = score(b) - score(a)
        if (sd !== 0) return sd
        return new Date(a.addedAt || 0) - new Date(b.addedAt || 0)
      })

      // Keep first (highest score), delete the rest
      for (const c of group.slice(1)) {
        if (deletedIds.has(c._id)) continue
        try {
          await sanity.delete(c._id)
          deletedIds.add(c._id)
          deleted++
        } catch {}
      }
    }

    return Response.json({ ok: true, deleted })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
