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

function isShort(video) {
  const title = (video.title || '').toLowerCase()
  const desc  = (video.description || '').toLowerCase()
  const url   = (video.url || video.videoId || video.youtubeId || '').toLowerCase()

  // Definite Shorts markers
  if (title.includes('#shorts') || title.includes('#short ') || title.endsWith('#short')) return true
  if (desc.includes('#shorts')) return true
  if (url.includes('/shorts/')) return true

  // YouTube Shorts video IDs are the same format — we can't tell from ID alone
  // But titles of Shorts are often very short (< 6 words) — don't use this heuristic
  return false
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all videos from Sanity
  const videos = await sanity.fetch(
    `*[_type == "video"] | order(publishedAt desc) [0...500] {
      _id, title, description, videoId, youtubeId, channelName, publishedAt
    }`
  )

  const shorts    = videos.filter(v => isShort(v))
  const notShorts = videos.filter(v => !isShort(v))

  return Response.json({
    ok: true,
    total: videos.length,
    shortsFound: shorts.length,
    shorts: shorts.map(v => ({ _id: v._id, title: v.title, channel: v.channelName })),
    kept: notShorts.length,
  })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { action } = await req.json().catch(() => ({}))

  // Delete all Shorts from Sanity
  if (action === 'delete-shorts') {
    const videos = await sanity.fetch(
      `*[_type == "video"] | order(publishedAt desc) [0...500] {
        _id, title, description, videoId, youtubeId
      }`
    )

    const shorts = videos.filter(v => isShort(v))
    if (!shorts.length) return Response.json({ ok: true, deleted: 0, msg: 'No Shorts found' })

    // Batch delete via transaction
    const tx = sanity.transaction()
    shorts.forEach(v => tx.delete(v._id))
    await tx.commit()

    return Response.json({ ok: true, deleted: shorts.length, ids: shorts.map(v => v._id) })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
