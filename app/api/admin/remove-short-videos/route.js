import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function isoToSecs(iso) {
  if (!iso) return 9999
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 9999
  return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0)
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const videos = await sanity.fetch('*[_type == "video"]{ _id, title, duration }')
  const short  = videos.filter(v => isoToSecs(v.duration) <= 120)

  if (!short.length) return Response.json({ ok: true, deleted: 0, total: videos.length })

  const tx = sanity.transaction()
  for (const v of short) tx.delete(v._id)
  await tx.commit()

  return Response.json({
    ok: true,
    deleted: short.length,
    total: videos.length,
    titles: short.slice(0, 10).map(v => v.title?.slice(0,60)),
  })
}
