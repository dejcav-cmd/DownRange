export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const items = await sanity.fetch(
    `*[_type=="video"&&active!=false]|order(publishedAt desc)[0...40]{title,youtubeId,videoId,channelName,category,publishedAt,thumbnail}`
  ).catch(() => [])

  return buildFeed({
    title:       'DownRange — Firearms Videos',
    description: 'Curated firearms videos — reviews, training, news, and tactical content from trusted channels.',
    feedUrl:     'https://downrangeco.com/feeds/video',
    items: items.map(v => {
      const vid = v.youtubeId || v.videoId
      return {
        title:       v.title,
        url:         vid ? `https://www.youtube.com/watch?v=${vid}` : 'https://downrangeco.com/video',
        description: `${v.channelName || 'DownRange Video'} — ${v.category || 'firearms'}`,
        date:        v.publishedAt,
        category:    v.category || 'video',
        author:      v.channelName || 'DownRange',
        image:       v.thumbnail,
      }
    }),
  })
}
