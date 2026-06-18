export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

export async function POST(req) {
  const admin = req.headers.get('x-admin-key')
  if (admin !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let total = 0
  let rounds = 0
  while (rounds < 20) {
    rounds++
    const docs = await sanity.fetch(`*[_type=="firearmRelease"][0...100]{_id}`).catch(() => [])
    if (!docs.length) break
    await sanity.mutate(docs.map(d => ({ delete: { id: d._id } })))
    total += docs.length
    await new Promise(r => setTimeout(r, 300))
  }

  return Response.json({ ok: true, deleted: total, message: `Deleted ${total} releases` })
}
