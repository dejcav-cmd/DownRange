export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const VALID_TYPES = ['newsArticle','firearmRelease','blogPost','review','canadaContent','competition']

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, lock = true } = await req.json().catch(() => ({}))
  if (!type || !VALID_TYPES.includes(type))
    return Response.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 })

  // Fetch all IDs for the type (paginate in 200-item batches)
  let all = [], offset = 0
  while (true) {
    const batch = await sanity.fetch(
      `*[_type == $type][${offset}...${offset+200}]{ _id }`, { type }
    )
    if (!batch.length) break
    all.push(...batch)
    offset += 200
    if (batch.length < 200) break
  }

  if (!all.length) return Response.json({ ok: true, updated: 0, type, lock })

  // Batch mutate — Sanity allows up to 200 mutations per call
  const chunks = []
  for (let i = 0; i < all.length; i += 200) chunks.push(all.slice(i, i+200))
  let updated = 0
  for (const chunk of chunks) {
    await sanity.mutate(chunk.map(doc => ({ patch: { id: doc._id, set: { editorLocked: lock } } })))
    updated += chunk.length
  }

  return Response.json({ ok: true, updated, type, lock })
}
