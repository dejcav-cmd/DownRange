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
  let b = body
  // 1. Full div with class dr-source-attribution (double or single quotes)
  b = b.replace(/<div[^>]+class="dr-source-attribution"[^>]*>[\s\S]*?<\/div>\s*/gi, '')
  b = b.replace(/<div[^>]+class='dr-source-attribution'[^>]*>[\s\S]*?<\/div>\s*/gi, '')
  // 2. Orphaned <p> with monospace style containing the attribution text
  b = b.replace(/<p[^>]+font-family:monospace[^>]*>\s*This editorial was written by DownRange[^<]*<\/p>\s*/gi, '')
  // 3. Orphaned ORIGINAL SOURCE heading div left behind
  b = b.replace(/<div[^>]*>\s*ORIGINAL SOURCE\s*<\/div>\s*/gi, '')
  // 4. Dangling closing </div> at very end of body (after all real content)
  b = b.replace(/(<\/p>|<\/ul>|<\/ol>|<\/h[1-6]>)\s*<\/div>\s*$/, '$1')
  return b.trim()
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { ids } = await req.json()
  if (!ids?.length) return Response.json({ error: 'ids array required' }, { status: 400 })

  const idList = ids.map(id => '"' + id + '"').join(',')
  const docs = await sanity.fetch('*[_id in [' + idList + ']] { _id, body }')

  const mutations = []
  for (const doc of docs) {
    if (!doc.body) continue
    const stripped = strip(doc.body)
    if (stripped === doc.body) continue
    mutations.push({ patch: { id: doc._id, set: { body: stripped } } })
  }

  if (!mutations.length) {
    return Response.json({ ok: true, cleaned: 0, total: docs.length, message: 'All already clean' })
  }

  const tx = sanity.transaction()
  for (const m of mutations) tx.patch(m.patch.id, p => p.set(m.patch.set))
  await tx.commit()

  return Response.json({ ok: true, cleaned: mutations.length, total: docs.length })
}
