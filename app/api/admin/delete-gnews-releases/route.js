export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

export async function GET(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all firearmRelease docs whose sourceUrl is a Google News redirect URL.
  // These were ingested via the now-removed Google News RSS source.
  const docs = await sanity.fetch(
    `*[_type == "firearmRelease" && (
      sourceUrl match "*news.google.com*"
      || sourceUrl match "*google.com/rss*"
    )] { _id, title, sourceUrl }`
  )

  if (docs.length === 0) {
    return Response.json({ ok: true, deleted: 0, message: 'No Google News releases found' })
  }

  const ids = docs.map(d => d._id)
  const batches = []
  for (let i = 0; i < ids.length; i += 50) batches.push(ids.slice(i, i + 50))

  let deleted = 0
  for (const batch of batches) {
    await sanity.mutate(batch.map(id => ({ delete: { id } })))
    deleted += batch.length
  }

  return Response.json({
    ok: true,
    deleted,
    titles: docs.map(d => d.title?.slice(0, 60)),
  })
}
