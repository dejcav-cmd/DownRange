/**
 * Video Feed Agent
 * Fetches latest videos from whitelisted YouTube channels
 * Runs every 4 hours via cron
 */
const { sanityWrite, discordNotify, rateLimiter } = require('../utils')

const CHANNELS = [
  { id: 'UC5Gwxl2DmAZkdiuoWsLcRhg', name: 'Garand Thumb' },
  { id: 'UCIRgR4iANHI2taJdz8hjwLw', name: 'Paul Harrell' },
  { id: 'UCwIHnIpEIbyzmL9cB2l5Elw', name: 'Military Arms Channel' },
  { id: 'UCz8b2iV8CJxBNs3fP4jjRMg', name: 'Iraqveteran8888' },
  { id: 'UCDpNK2b8NlJSfMl_k4p_fJg', name: 'InRange TV' },
  { id: 'UC_GOthrJTq5EFrPNsHhJJBQ', name: 'Forgotten Weapons' },
]

async function fetchChannelVideos(channelId, channelName) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part',       'snippet')
  url.searchParams.set('channelId',  channelId)
  url.searchParams.set('order',      'date')
  url.searchParams.set('maxResults', '5')
  url.searchParams.set('type',       'video')
  url.searchParams.set('key',        process.env.YOUTUBE_API_KEY)

  const res  = await fetch(url.toString())
  const data = await res.json()

  if (!data.items) {
    console.warn(`No items for channel ${channelName}:`, data.error?.message)
    return []
  }

  return data.items.map(item => ({
    _id:         `yt-${item.id.videoId}`,
    _type:       'video',
    title:       item.snippet.title,
    youtubeId:   item.id.videoId,
    channelName,
    channelId,
    thumbnail:   item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
    description: item.snippet.description?.slice(0, 400),
    category:    inferCategory(item.snippet.title),
    publishedAt: item.snippet.publishedAt,
    addedAt:     new Date().toISOString(),
    featured:    false,
  }))
}

function inferCategory(title) {
  const t = title.toLowerCase()
  if (t.includes('review'))                  return 'Review'
  if (t.includes('training') || t.includes('drill')) return 'Training'
  if (t.includes('news') || t.includes('update'))    return 'News'
  if (t.includes('vs') || t.includes('compare'))     return 'Comparison'
  if (t.includes('clean') || t.includes('maintenance')) return 'Maintenance'
  if (t.includes('match') || t.includes('competition')) return 'Competition'
  return 'Review'
}

async function runVideoFeed() {
  console.log('🎬 Video feed starting...')
  let total = 0

  for (const channel of CHANNELS) {
    try {
      await rateLimiter(1200) // 1.2s between channels — protect quota
      const videos = await fetchChannelVideos(channel.id, channel.name)
      for (const video of videos) {
        await sanityWrite(video)
        total++
      }
      console.log(`✓ ${channel.name}: ${videos.length} videos`)
    } catch (err) {
      console.error(`✗ ${channel.name}: ${err.message}`)
    }
  }

  console.log(`🎬 Video feed done — ${total} videos processed`)
  return total
}

module.exports = { runVideoFeed }

if (require.main === module) {
  runVideoFeed().then(n => {
    console.log(`Done: ${n} videos`)
    process.exit(0)
  }).catch(err => {
    console.error(err)
    process.exit(1)
  })
}
