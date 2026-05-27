export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { videos } = await req.json().catch(() => ({}))
  if (!videos?.length) return Response.json({ error: 'No videos provided' }, { status: 400 })

  // Store the video list as a Sanity singleton document
  await sanity.createOrReplace({
    _id:    'portal-video-list',
    _type:  'siteConfig',
    key:    'videoList',
    videos: videos.map(v => ({
      _key:        v.id || v.videoId,
      videoId:     v.videoId,
      title:       v.title,
      channelName: v.channelName || '',
      category:    v.category || 'review',
      duration:    v.duration || '',
    })),
    updatedAt: new Date().toISOString(),
  })

  return Response.json({ ok: true, count: videos.length })
}
