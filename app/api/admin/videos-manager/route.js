import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const k = req.headers.get('x-admin-key')
  return k && k === process.env.ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const videos = await sanity.fetch(
      `*[_type == "video"] | order(publishedAt desc, addedAt desc) [0...200] {
        _id, title, videoId, youtubeId, channelName, category,
        thumbnail, thumbnailUrl, description, publishedAt, addedAt, featured, active
      }`
    )
    return Response.json({ ok: true, videos })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { action, id, video } = body

    if (action === 'create') {
      if (!video?.videoId) return Response.json({ error: 'videoId required' }, { status: 400 })
      const doc = {
        _type: 'video',
        title:       video.title || '',
        videoId:     video.videoId,
        youtubeId:   video.videoId,
        channelName: video.channelName || '',
        category:    video.category || 'review',
        thumbnail:   video.thumbnail || ('https://i.ytimg.com/vi/' + video.videoId + '/hqdefault.jpg'),
        addedAt:     new Date().toISOString(),
        featured:    false,
        active:      true,
      }
      const created = await sanity.create(doc)
      return Response.json({ ok: true, video: created })
    }

    if (action === 'patch') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 })
      await sanity.patch(id).set(body.fields || {}).commit()
      return Response.json({ ok: true })
    }

    if (action === 'delete') {
      if (!id) return Response.json({ error: 'id required' }, { status: 400 })
      await sanity.delete(id)
      return Response.json({ ok: true })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
