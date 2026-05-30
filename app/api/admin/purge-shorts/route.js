import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

function isoToSecs(iso) {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return null
  return (parseInt(m[1]||0)*3600) + (parseInt(m[2]||0)*60) + parseInt(m[3]||0)
}

function isShort(video) {
  const title = (video.title || '').toLowerCase()
  const desc  = (video.description || '').toLowerCase()
  const url   = (video.url || video.videoId || video.youtubeId || '').toLowerCase()

  // Hashtag markers
  if (title.includes('#shorts') || title.includes('#short ') || title.endsWith('#short')) return true
  if (desc.includes('#shorts')) return true
  if (url.includes('/shorts/')) return true

  // Duration under 2 minutes
  const secs = isoToSecs(video.duration)
  if (secs !== null && secs <= 120) return true

  return false
}

const VIDEO_QUERY = `*[_type == "video"] | order(publishedAt desc) [0...1000] {
  _id, title, description, videoId, youtubeId, channelName, publishedAt, duration
}`

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const videos    = await sanity.fetch(VIDEO_QUERY)
  const shorts    = videos.filter(v => isShort(v))
  const notShorts = videos.filter(v => !isShort(v))

  return Response.json({
    ok: true,
    total: videos.length,
    shortsFound: shorts.length,
    shorts: shorts.map(v => ({ _id: v._id, title: v.title, channel: v.channelName, duration: v.duration })),
    kept: notShorts.length,
  })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json().catch(() => ({}))

  if (action === 'delete-shorts') {
    const videos = await sanity.fetch(VIDEO_QUERY)
    const shorts = videos.filter(v => isShort(v))
    if (!shorts.length) return Response.json({ ok: true, deleted: 0, msg: 'No short videos found' })

    const tx = sanity.transaction()
    shorts.forEach(v => tx.delete(v._id))
    await tx.commit()

    return Response.json({ ok: true, deleted: shorts.length, ids: shorts.map(v => v._id) })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
