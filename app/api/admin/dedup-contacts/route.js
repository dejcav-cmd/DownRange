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

// GET — find all duplicates (by name, website, or email)
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const all = await sanity.fetch(`
    *[_type == "outreachContact"] | order(name asc) {
      _id, name, email, website, type, status, addedAt
    }
  `)

  // Find duplicates by normalized name
  const byName = {}
  for (const c of all) {
    const key = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!byName[key]) byName[key] = []
    byName[key].push(c)
  }

  // Find duplicates by email
  const byEmail = {}
  for (const c of all) {
    if (!c.email) continue
    const key = c.email.toLowerCase().trim()
    if (!byEmail[key]) byEmail[key] = []
    byEmail[key].push(c)
  }

  // Find duplicates by website
  const byWebsite = {}
  for (const c of all) {
    if (!c.website) continue
    const key = c.website.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
    if (!byWebsite[key]) byWebsite[key] = []
    byWebsite[key].push(c)
  }

  const duplicateGroups = [
    ...Object.values(byName).filter(g => g.length > 1),
    ...Object.values(byEmail).filter(g => g.length > 1),
    ...Object.values(byWebsite).filter(g => g.length > 1),
  ]

  // Deduplicate groups (same _ids may appear in multiple groups)
  const seen = new Set()
  const uniqueGroups = []
  for (const group of duplicateGroups) {
    const key = group.map(c => c._id).sort().join(',')
    if (!seen.has(key)) { seen.add(key); uniqueGroups.push(group) }
  }

  return Response.json({
    ok: true,
    total: all.length,
    duplicateGroups: uniqueGroups,
    duplicateCount: uniqueGroups.reduce((s, g) => s + g.length - 1, 0),
  })
}

// POST — merge duplicates (keep first, delete rest) or delete specific IDs
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action } = body

  if (action === 'merge') {
    // Keep the contact with an email (or most data), delete the rest
    const { keepId, deleteIds } = body
    if (!keepId || !deleteIds?.length) return Response.json({ error: 'keepId and deleteIds required' }, { status: 400 })
    let deleted = 0
    for (const id of deleteIds) {
      try { await sanity.delete(id); deleted++ } catch {}
    }
    return Response.json({ ok: true, deleted })
  }

  if (action === 'delete-all-duplicates') {
    // Auto-merge: for each duplicate group, keep the one with the most data
    const all = await sanity.fetch(`*[_type == "outreachContact"] { _id, name, email, website, type, status, addedAt }`)
    const byName = {}
    for (const c of all) {
      const key = (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      if (!byName[key]) byName[key] = []
      byName[key].push(c)
    }

    let deleted = 0
    for (const group of Object.values(byName)) {
      if (group.length < 2) continue
      // Keep the one with email, or with most fields, or oldest
      group.sort((a, b) => {
        if (a.email && !b.email) return -1
        if (!a.email && b.email) return 1
        return new Date(a.addedAt) - new Date(b.addedAt)
      })
      const [keep, ...toDelete] = group
      for (const c of toDelete) {
        try { await sanity.delete(c._id); deleted++ } catch {}
      }
    }
    return Response.json({ ok: true, deleted })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
