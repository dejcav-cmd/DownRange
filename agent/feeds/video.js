/**
 * Video Feed Agent — DownRange
 * Fetches latest videos from whitelisted YouTube channels
 * Runs every 4 hours via cron — all channel IDs verified
 */
import { isDuplicate, publishToSanity, notifyError, sleep } from '../utils.js'

// ── Channel registry — edit via Admin → Media → Channels ──────────────────
// Channel IDs verified against actual YouTube channel URLs
const CHANNELS = [
  // ── Classic Review / Entertainment ────────────────────────────────────
  { id: 'UC5Gwxl2DmAZkdiuoWsLcRhg', name: 'Garand Thumb',          tags: ['review','tactical','military'] },
  { id: 'UCIRgR4iANHI2taJdz8hjwLw', name: 'Paul Harrell',           tags: ['review','demonstration','training'] },
  { id: 'UCwIHnIpEIbyzmL9cB2l5Elw', name: 'Military Arms Channel',  tags: ['review','industry','ar15'] },
  { id: 'UCz8b2iV8CJxBNs3fP4jjRMg', name: 'Iraqveteran8888',        tags: ['review','demonstration','historical'] },
  { id: 'UCDpNK2b8NlJSfMl_k4p_fJg', name: 'InRange TV',             tags: ['review','historical','competition'] },
  { id: 'UC_GOthrJTq5EFrPNsHhJJBQ', name: 'Forgotten Weapons',      tags: ['historical','collector','review'] },
  // ── Training / Self Defense ────────────────────────────────────────────
  { id: 'UC_zQ_9vNGE9ORtO_8b1HUPA', name: 'Active Self Protection',  tags: ['training','self-defense','ccw'] },
  { id: 'UCpAQxclFD9eGCqRoIDNIGsA', name: 'Lucky Gunner',            tags: ['ammo','testing','review'] },
  // ── Industry / Big Channels ────────────────────────────────────────────
  { id: 'UCVdMoKcLQ7-4lxjhJXx_E8A', name: 'Hickok45',               tags: ['demonstration','review','entertainment'] },
  { id: 'UCpUJCA4YcMVMdSolcaWOQOw', name: 'Mr. Guns N Gear',         tags: ['review','edc','carry'] },
  { id: 'UCftEYpFBf_m8gJEWMXXfqVg', name: 'Brownells',              tags: ['industry','parts','build'] },
]

function inferCategory(title) {
  const t = title.toLowerCase()
  if (t.includes('review') || t.includes('tested') || t.includes('hands on')) return 'review'
  if (t.includes('training') || t.includes('drill') || t.includes('technique')) return 'training'
  if (t.includes('news') || t.includes('update') || t.includes('breaking'))     return 'news'
  if (t.includes('vs') || t.includes('compare') || t.includes('shootoff'))      return 'comparison'
  if (t.includes('build') || t.includes('assemble') || t.includes('setup'))     return 'build'
  if (t.includes('clean') || t.includes('maintenance') || t.includes('lube'))   return 'maintenance'
  if (t.includes('match') || t.includes('competition') || t.includes('uspsa'))  return 'competition'
  if (t.includes('history') || t.includes('historical') || t.includes('ww'))    return 'history'
  if (t.includes('ammo') || t.includes('ammunition') || t.includes('ballistic')) return 'ammo'
  return 'review'
}

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
    console.warn(`[VIDEO] No items for ${channelName}: ${data.error?.message || 'unknown error'}`)
    return []
  }

  return data.items.map(item => ({
    _id:         `yt-${item.id.videoId}`,
    _type:       'video',
    title:       item.snippet.title,
    videoId:     item.id.videoId,
    youtubeId:   item.id.videoId,
    channelName,
    channelId,
    thumbnail:   item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
    description: item.snippet.description?.slice(0, 400) || '',
    category:    inferCategory(item.snippet.title),
    publishedAt: item.snippet.publishedAt,
    addedAt:     new Date().toISOString(),
    featured:    false,
    active:      true,
  }))
}

async function runVideoFeed() {
  console.log('[VIDEO] Feed starting...')
  if (!process.env.YOUTUBE_API_KEY) {
    console.warn('[VIDEO] YOUTUBE_API_KEY not set — skipping')
    return { done: 0, channels: 0, error: 'YOUTUBE_API_KEY not configured' }
  }

  let total = 0
  let channelsDone = 0

  for (const channel of CHANNELS) {
    try {
      await sleep(1200) // 1.2s between channels — protect quota
      const videos = await fetchChannelVideos(channel.id, channel.name)

      for (const video of videos) {
        try {
          const dup = await isDuplicate(video.videoId, 'video')
          if (!dup) {
            await publishToSanity(video)
            total++
          }
        } catch (err) {
          console.error(`[VIDEO] Failed to save ${video.videoId}:`, err.message)
        }
      }
      channelsDone++
      console.log(`[VIDEO] ✓ ${channel.name}: ${videos.length} videos checked`)
    } catch (err) {
      console.error(`[VIDEO] ✗ ${channel.name}: ${err.message}`)
      try { await notifyError('video', err.message) } catch {}
    }
  }

  console.log(`[VIDEO] Done — ${total} new videos from ${channelsDone}/${CHANNELS.length} channels`)
  return { done: total, channels: channelsDone }
}

export { runVideoFeed }
