export const dynamic = 'force-dynamic'

/**
 * GET /api/youtube?limit=12
 * Fetches latest videos from top firearms channels via YouTube public RSS.
 * No API key required.
 */

const CHANNELS = [
  { id: 'UCZQNua9BcpHo4nVJl4GJBiQ', name: 'Garand Thumb',         category: 'review'   },
  { id: 'UCo-h6Qu_QNGlj0TVBfxoeCA', name: 'Military Arms Channel', category: 'review'   },
  { id: 'UCnn5QEk2B4rBB0UHrn5MCUw', name: 'Forgotten Weapons',     category: 'history'  },
  { id: 'UCMkCnMBajEHlDKcuXRmGKcQ', name: 'InRange TV',            category: 'training' },
  { id: 'UCJeBB8QZJbxVkiHVoMNzSJw', name: 'Paul Harrell',          category: 'review'   },
  { id: 'UC0XKvO5bITFBFwGsm0Kc_KA', name: 'Iraqveteran8888',       category: 'news'     },
  { id: 'UCH4Mtq7BVOPyOZKGpeqDCNQ', name: 'Warrior Poet Society',  category: 'training' },
  { id: 'UCeydggXNKrDMl-3sGN98DkA', name: 'Pew Pew Tactical',      category: 'review'   },
]

async function fetchChannelFeed(channel) {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)' }, signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return []
    const xml = await res.text()
    const entries = []
    const re = /<entry>([\s\S]*?)<\/entry>/g
    let m
    while ((m = re.exec(xml)) !== null && entries.length < 2) {
      const b       = m[1]
      const videoId = (b.match(/<yt:videoId>(.*?)<\/yt:videoId>/)  || [])[1]
      const title   = (b.match(/<media:title>(.*?)<\/media:title>/)|| b.match(/<title>(.*?)<\/title>/)   || [])[1]
      const pub     = (b.match(/<published>(.*?)<\/published>/)     || [])[1]
      const views   = (b.match(/views="(\d+)"/)                    || [])[1]
      if (videoId && title) entries.push({
        _id: videoId, videoId,
        title: title.replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/<!\[CDATA\[|\]\]>/g,''),
        channelName: channel.name, category: channel.category,
        publishedAt: pub || new Date().toISOString(),
        viewCount: parseInt(views||'0'),
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      })
    }
    return entries
  } catch { return [] }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(24, parseInt(searchParams.get('limit') || '12'))
  const results = await Promise.allSettled(CHANNELS.map(fetchChannelFeed))
  const videos  = results
    .flatMap(r => r.status === 'fulfilled' ? r.value : [])
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit)
  return Response.json({ videos, count: videos.length, timestamp: new Date().toISOString() })
}
