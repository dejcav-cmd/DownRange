/**
 * Video Feed Agent — DownRange
 * Uses YouTube RSS feeds — no API key needed, no quota limits
 * Falls back to Sanity-stored channel list if available
 * Runs every 4 hours via cron
 */
import { publishToSanity, notifyError, sleep } from '../utils.js'

const CHANNELS = [
  { id: 'UC0RBTQIYLEQbcahZWkmzeTQ', name: 'Garand Thumb',          tags: ['review','tactical','military'] },
  { id: 'UCIRgR4iANHI2taJdz8hjwLw', name: 'Paul Harrell',           tags: ['review','demonstration','training'] },
  { id: 'UCwIHnIpEIbyzmL9cB2l5Elw', name: 'Military Arms Channel',  tags: ['review','industry','ar15'] },
  { id: 'UCa2OJa5n9oeQ_NRohmI8kVA', name: 'Iraqveteran8888',        tags: ['review','demonstration','historical'] },
  { id: 'UCVp_8H_KAQL7dJT6fGfSLKQ', name: 'InRange TV',             tags: ['review','historical','competition'] },
  { id: 'UCrfKGpvbEQXcbe68dzXgJuA', name: 'Forgotten Weapons',      tags: ['historical','collector','review'] },
  { id: 'UCkKnVVYHmFYMgWJjJPzwHdw', name: 'Active Self Protection',  tags: ['training','self-defense','ccw'] },
  { id: 'UCpAQxclFD9eGCqRoIDNIGsA', name: 'Lucky Gunner',            tags: ['ammo','testing','review'] },
  { id: 'UCVdMoKcLQ7-4lxjhJXx_E8A', name: 'Hickok45',               tags: ['demonstration','review','entertainment'] },
  { id: 'UCpUJCA4YcMVMdSolcaWOQOw', name: 'Mr. Guns N Gear',         tags: ['review','edc','carry'] },
  { id: 'UCftEYpFBf_m8gJEWMXXfqVg', name: 'Brownells',              tags: ['industry','parts','build'] },
  // ── DJ Added — May 2026 ───────────────────────────────────────────────────
  { id: 'UCR6jQ7mXz6zZx3DtCMzKWxQ', name: 'IMPACT SHOOTING',         tags: ['hunting','long-range','precision'] },
  { id: 'UC-y0QNNNujtB2PLjrHDwnPg', name: 'Daniel Defense',           tags: ['manufacturer','ar15','industry'] },
  { id: 'UC9ZKDGCc5R67fVvLFSv-OLA', name: 'Firearms Channel',         tags: ['review','2a','firearms'] },
  { id: 'UCFJ2K2gUJJ1ecBU6Sxc3bCA', name: 'Gun Owners of America',    tags: ['2a','advocacy','law'] },
  { id: 'UC3CfC922pS8htNjW8yTPGRg', name: 'Washington Gun Law',       tags: ['law','2a','legal','ccw'] },
  { id: 'UCHWRbypJau9R8lDCXqlWgUA', name: 'Backfire',                 tags: ['hunting','review','long-range'] },
  { id: 'UC0VQT2e75ejR-mUCuerugvA', name: 'Tactical Cowboy',          tags: ['training','tactics','self-defense'] },
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

// Parse YouTube RSS XML — no library needed, simple regex
function parseYouTubeRSS(xml, channelId, channelName) {
  const videos = []
  // Match all <entry> blocks
  const entryRx = /<entry>([\s\S]*?)<\/entry>/g
  let match
  while ((match = entryRx.exec(xml)) !== null) {
    const entry = match[1]
    const videoId    = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)    || [])[1]
    const title      = (entry.match(/<title>(.*?)<\/title>/)               || [])[1]
    const published  = (entry.match(/<published>(.*?)<\/published>/)       || [])[1]
    const desc       = (entry.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || ''
    const thumbnail  = (entry.match(/url="(https:\/\/i\.ytimg\.com[^"]+)"/)  || [])[1] || ''

    if (!videoId || !title) continue

    videos.push({
      _type:       'video',
      title:       title.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"'),
      videoId,
      youtubeId:   videoId,
      channelName,
      channelId,
      thumbnail:   thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description: desc.replace(/<[^>]+>/g,'').trim().slice(0, 400),
      category:    inferCategory(title),
      publishedAt: published || new Date().toISOString(),
      addedAt:     new Date().toISOString(),
      featured:    false,
      active:      true,
    })
  }
  return videos
}

async function fetchChannelRSS(channelId, channelName) {
  // Some channels use legacy UCxxxx IDs that are now 404; try channel_id first, then c/user
  let url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  // Handle @handle-style channel IDs (start with @)
  if (channelId.startsWith('@')) {
    url = `https://www.youtube.com/feeds/videos.xml?user=${channelId.slice(1)}`
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) {
    throw new Error(`YouTube RSS HTTP ${res.status} for channel ${channelName} (${channelId})`)
  }
  const xml = await res.text()
  if (!xml.includes('<feed') && !xml.includes('<entry>')) {
    throw new Error(`YouTube RSS returned invalid XML for ${channelName} — length ${xml.length}`)
  }
  const videos = parseYouTubeRSS(xml, channelId, channelName)
  console.log(`[VIDEO] ${channelName}: RSS returned ${videos.length} videos`)
  return videos.slice(0, 5) // latest 5 only
}

async function checkExists(videoId) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
  const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET   || 'production'
  const token     = process.env.SANITY_API_TOKEN
  if (!token) throw new Error('SANITY_API_TOKEN not set')
  const query = `count(*[_type=="video" && youtubeId=="${videoId}"])`
  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Sanity dedup check failed ${res.status}`)
  const data = await res.json()
  return (data.result || 0) > 0
}

// Try to load channels from Sanity (VideoManager persists them there)
async function loadChannelsFromSanity() {
  try {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
    const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET   || 'production'
    const token     = process.env.SANITY_API_TOKEN
    if (!token) return null
    const query = `*[_type=="siteConfig" && _id=="youtube-channel-config"][0]{channels}`
    const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (data.result?.channels?.length) {
      console.log(`[VIDEO] Loaded ${data.result.channels.length} channels from Sanity VideoManager`)
      return data.result.channels.map(c => ({ id: c.channelId || c.id, name: c.name, tags: ['review'] }))
    }
  } catch {}
  return null
}

async function runVideoFeed() {
  console.log('[VIDEO] ===== Video feed starting (RSS mode — no API key needed) =====')

  // Use Sanity-stored channels if available, else hardcoded list
  const sanityChannels = await loadChannelsFromSanity()
  const channelList    = sanityChannels || CHANNELS
  console.log(`[VIDEO] Processing ${channelList.length} channels via YouTube RSS`)

  let totalNew    = 0
  let totalSkipped= 0
  let channelsDone= 0
  const errors    = []
  const channelLog= []

  for (const channel of channelList) {
    const result = { name: channel.name, id: channel.id, status: 'pending', new: 0, skipped: 0, error: null }

    try {
      await sleep(500) // small delay between channels

      const videos = await fetchChannelRSS(channel.id, channel.name)

      if (!videos.length) {
        result.status = 'empty'
        console.log(`[VIDEO] ${channel.name}: 0 videos in RSS feed`)
        channelLog.push(result)
        channelsDone++
        continue
      }

      for (const video of videos) {
        try {
          const exists = await checkExists(video.youtubeId)
          if (exists) {
            result.skipped++
            totalSkipped++
            continue
          }
          await publishToSanity(video)
          result.new++
          totalNew++
          console.log(`[VIDEO]   ✓ NEW: "${video.title.slice(0,60)}" — ${channel.name}`)
        } catch (err) {
          const msg = `${channel.name}/${video.youtubeId}: ${err.message}`
          errors.push(msg)
          console.error('[VIDEO]   ✗', msg)
        }
      }

      result.status  = 'ok'
      channelsDone++
      console.log(`[VIDEO] ✓ ${channel.name}: ${result.new} new, ${result.skipped} already existed`)
    } catch (err) {
      result.status = 'error'
      result.error  = err.message
      errors.push(`${channel.name}: ${err.message}`)
      console.error(`[VIDEO] ✗ ${channel.name}: ${err.message}`)
    }

    channelLog.push(result)
  }

  const summary = `${totalNew} new videos | ${totalSkipped} already existed | ${channelsDone}/${channelList.length} channels | ${errors.length} errors`
  console.log(`[VIDEO] ===== DONE: ${summary} =====`)
  if (errors.length) {
    console.error('[VIDEO] ERRORS:\n' + errors.map(e => '  · ' + e).join('\n'))
  }

  return {
    done:         totalNew,
    skipped:      totalSkipped,
    channels:     channelsDone,
    totalChannels: channelList.length,
    errors,
    channelLog,
    summary,
  }
}

export { runVideoFeed }
