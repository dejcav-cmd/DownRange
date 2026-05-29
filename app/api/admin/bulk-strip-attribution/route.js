import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

function strip(body) {
  if (!body) return body
  return body
    .replace(/<div[^>]+class="dr-source-attribution"[^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .replace(/<div[^>]+class='dr-source-attribution'[^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .trim()
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!ids?.length) return Response.json({ error: 'ids array required' }, { status: 400 })

  // Fetch all bodies in one GROQ query
  const idList = ids.map(id => '"' + id + '"').join(',')
  const docs = await sanity.fetch(
    '*[_id in [' + idList + ']] { _id, body }'
  )

  const mutations = []
  let skipped = 0

  for (const doc of docs) {
    if (!doc.body?.includes('dr-source-attribution')) { skipped++; continue }
    const stripped = strip(doc.body)
    if (stripped === doc.body) { skipped++; continue }
    mutations.push({ patch: { id: doc._id, set: { body: stripped } } })
  }

  if (!mutations.length) {
    return Response.json({ ok: true, cleaned: 0, skipped, message: 'All already clean' })
  }

  // One batched Sanity transaction
  const tx = sanity.transaction()
  for (const m of mutations) {
    tx.patch(m.patch.id, p => p.set(m.patch.set))
  }
  await tx.commit()

  return Response.json({ ok: true, cleaned: mutations.length, skipped, total: docs.length })
}
