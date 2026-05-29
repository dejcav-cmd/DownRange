/**
 * Video Feed Agent — DownRange
 * Fetches latest videos from whitelisted YouTube channels
 * Runs every 4 hours via cron — all channel IDs verified
 */
import { publishToSanity, notifyError, sleep } from '../utils.js'

const CHANNELS = [
  { id: 'UC5Gwxl2DmAZkdiuoWsLcRhg', name: 'Garand Thumb',          tags: ['review','tactical','military'] },
  { id: 'UCIRgR4iANHI2taJdz8hjwLw', name: 'Paul Harrell',           tags: ['review','demonstration','training'] },
  { id: 'UCwIHnIpEIbyzmL9cB2l5Elw', name: 'Military Arms Channel',  tags: ['review','industry','ar15'] },
  { id: 'UCz8b2iV8CJxBNs3fP4jjRMg', name: 'Iraqveteran8888',        tags: ['review','demonstration','historical'] },
  { id: 'UCDpNK2b8NlJSfMl_k4p_fJg', name: 'InRange TV',             tags: ['review','historical','competition'] },
  { id: 'UC_GOthrJTq5EFrPNsHhJJBQ', name: 'Forgotten Weapons',      tags: ['historical','collector','review'] },
  { id: 'UC_zQ_9vNGE9ORtO_8b1HUPA', name: 'Active Self Protection',  tags: ['training','self-defense','ccw'] },
  { id: 'UCpAQxclFD9eGCqRoIDNIGsA', name: 'Lucky Gunner',            tags: ['ammo','testing','review'] },
  { id: 'UCVdMoKcLQ7-4lxjhJXx_E8A', name: 'Hickok45',               tags: ['demonstration','review','entertainment'] },
  { id: 'UCpUJCA4YcMVMdSolcaWOQOw', name: 'Mr. Guns N Gear',         tags: ['review','edc','carry'] },
  { id: 'UCftEYpFBf_m8gJEWMXXfqVg', name: 'Brownells',              tags: ['industry','parts','build'] },
]

function inferCategory(title) {
  const t = (title || '').toLowerCase()
  if (t.includes('hunt') || t.includes('deer') || t.includes('elk') || t.includes('waterfowl') || t.includes('turkey')) return 'hunting'
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

async function checkExists(videoId) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
  const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET   || 'production'
  const token     = process.env.SANITY_API_TOKEN
  if (!token) throw new Error('SANITY_API_TOKEN not set')
  const query = `count(*[_type=="video" && youtubeId=="${videoId}"])`
  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Sanity dedup check failed ${res.status}: ${err.slice(0, 120)}`)
  }
  const data = await res.json()
  return (data.result || 0) > 0
}

async function fetchChannelVideos(channelId, channelName) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not set in Vercel env vars')

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part',       'snippet')
  url.searchParams.set('channelId',  channelId)
  url.searchParams.set('order',      'date')
  url.searchParams.set('maxResults', '5')
  url.searchParams.set('type',       'video')
  url.searchParams.set('key',        apiKey)

  const res  = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`YouTube API HTTP ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()

  if (data.error) {
    const code = data.error.code
    const msg  = data.error.message || data.error.errors?.[0]?.reason || 'unknown'
    // Quota exhausted is a known recoverable issue — surface it clearly
    if (code === 403 || msg.includes('quota') || msg.includes('quotaExceeded')) {
      throw new Error(`YouTube quota exhausted (403) — reset at midnight Pacific. Channel: ${channelName}`)
    }
    throw new Error(`YouTube API error ${code}: ${msg} — Channel: ${channelName}`)
  }

  if (!data.items || !Array.isArray(data.items)) {
    console.warn(`[VIDEO] ⚠ ${channelName}: no items array in response — ${JSON.stringify(data).slice(0, 200)}`)
    return []
  }

  const videos = data.items
    .filter(item => item.id?.videoId && item.snippet) // guard against malformed items
    .map(item => ({
      _type:       'video',
      title:       item.snippet.title,
      videoId:     item.id.videoId,
      youtubeId:   item.id.videoId,
      channelName,
      channelId,
      thumbnail:   item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      description: (item.snippet.description || '').slice(0, 400),
      category:    inferCategory(item.snippet.title),
      publishedAt: item.snippet.publishedAt,
      addedAt:     new Date().toISOString(),
      featured:    false,
      active:      true,
    }))

  console.log(`[VIDEO] ${channelName}: YouTube returned ${data.items.length} items, ${videos.length} valid videos`)
  return videos
}

async function runVideoFeed() {
  console.log('[VIDEO] ===== Video feed starting =====')

  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    const msg = 'YOUTUBE_API_KEY not set in Vercel env vars — video feed cannot run'
    console.error('[VIDEO] FATAL:', msg)
    return { done: 0, channels: 0, skipped: 0, errors: [msg], fatal: msg }
  }
  console.log(`[VIDEO] API key present (length ${apiKey.length}), processing ${CHANNELS.length} channels`)

  let totalNew    = 0
  let totalSkipped= 0
  let channelsDone= 0
  const errors    = []
  const channelLog= []

  for (const channel of CHANNELS) {
    const channelResult = { name: channel.name, id: channel.id, status: 'pending', new: 0, skipped: 0, error: null }

    try {
      await sleep(1200) // protect quota

      const videos = await fetchChannelVideos(channel.id, channel.name)

      if (videos.length === 0) {
        channelResult.status = 'no_videos'
        console.log(`[VIDEO] ${channel.name}: 0 videos returned from YouTube`)
        channelLog.push(channelResult)
        channelsDone++
        continue
      }

      let newCount     = 0
      let skippedCount = 0

      for (const video of videos) {
        try {
          const exists = await checkExists(video.youtubeId)
          if (exists) {
            skippedCount++
            console.log(`[VIDEO]   ↷ ${channel.name} — "${video.title.slice(0,50)}" already exists, skipping`)
            continue
          }
          await publishToSanity(video)
          newCount++
          console.log(`[VIDEO]   ✓ ${channel.name} — NEW: "${video.title.slice(0,60)}"`)
        } catch (vidErr) {
          const errMsg = `${channel.name} / ${video.youtubeId}: ${vidErr.message}`
          errors.push(errMsg)
          console.error('[VIDEO]   ✗', errMsg)
        }
      }

      channelResult.status  = 'ok'
      channelResult.new     = newCount
      channelResult.skipped = skippedCount
      totalNew     += newCount
      totalSkipped += skippedCount
      channelsDone++
      console.log(`[VIDEO] ✓ ${channel.name}: ${newCount} new, ${skippedCount} already existed`)

    } catch (channelErr) {
      channelResult.status = 'error'
      channelResult.error  = channelErr.message
      errors.push(channelErr.message)
      console.error(`[VIDEO] ✗ ${channel.name}:`, channelErr.message)
      // Quota error is fatal — abort remaining channels to preserve quota
      if (channelErr.message.includes('quota')) {
        console.error('[VIDEO] QUOTA EXHAUSTED — stopping early to avoid wasting API calls')
        channelLog.push(channelResult)
        break
      }
    }

    channelLog.push(channelResult)
  }

  const summary = `${totalNew} new videos | ${totalSkipped} already existed | ${channelsDone}/${CHANNELS.length} channels | ${errors.length} errors`
  console.log(`[VIDEO] ===== DONE: ${summary} =====`)
  if (errors.length) console.error('[VIDEO] ERRORS:\n' + errors.map(e => '  · ' + e).join('\n'))

  return {
    done:        totalNew,
    skipped:     totalSkipped,
    channels:    channelsDone,
    totalChannels: CHANNELS.length,
    errors,
    channelLog,
    summary,
  }
}

export { runVideoFeed }
