/**
 * Video Feed Agent — DownRange
 * Uses YouTube RSS feeds — no API key needed, no quota limits
 * Falls back to Sanity-stored channel list if available
 * Runs every 4 hours via cron
 */
import { publishToSanity, notifyError, sleep } from '../utils.js'

const CHANNELS = [
  { id: 'UC0RBTQIYLEQbcahZWkmzeTQ', name: 'Garand Thumb',          tags: ['review','tactical','military'] , handle:'@GarandThumb'},
  { id: 'UCIRgR4iANHI2taJdz8hjwLw', name: 'Paul Harrell',           tags: ['review','demonstration','training'] , handle:'@PaulHarrellGuns'},
  { id: 'UCwIHnIpEIbyzmL9cB2l5Elw', name: 'Military Arms Channel',  tags: ['review','industry','ar15'] , handle:'@MACsuperstore'},
  { id: 'UCa2OJa5n9oeQ_NRohmI8kVA', name: 'Iraqveteran8888',        tags: ['review','demonstration','historical'] , handle:'@Iraqveteran8888'},
  { id: 'UCVp_8H_KAQL7dJT6fGfSLKQ', name: 'InRange TV',             tags: ['review','historical','competition'] , handle:'@InRangeTV'},
  { id: 'UCrfKGpvbEQXcbe68dzXgJuA', name: 'Forgotten Weapons',      tags: ['historical','collector','review'] , handle:'@ForgottenWeapons'},
  { id: 'UCkKnVVYHmFYMgWJjJPzwHdw', name: 'Active Self Protection',  tags: ['training','self-defense','ccw'] , handle:'@ActiveSelfProtection'},
  { id: 'UCpAQxclFD9eGCqRoIDNIGsA', name: 'Lucky Gunner',            tags: ['ammo','testing','review'] , handle:'@LuckyGunner'},
  { id: 'UCVdMoKcLQ7-4lxjhJXx_E8A', name: 'Hickok45',               tags: ['demonstration','review','entertainment'] , handle:'@hickok45'},
  { id: 'UCpUJCA4YcMVMdSolcaWOQOw', name: 'Mr. Guns N Gear',         tags: ['review','edc','carry'] , handle:'@MrGunsNGear'},
  { id: 'UCftEYpFBf_m8gJEWMXXfqVg', name: 'Brownells',              tags: ['industry','parts','build'] , handle:'@Brownells'},
  // ── DJ Added — May 2026 ───────────────────────────────────────────────────
  { id: 'UCR6jQ7mXz6zZx3DtCMzKWxQ', name: 'IMPACT SHOOTING',         tags: ['hunting','long-range','precision'] },
  { id: 'UC-y0QNNNujtB2PLjrHDwnPg', name: 'Daniel Defense',           tags: ['manufacturer','ar15','industry'] , handle:'@DanielDefense'},
  { id: 'UC9ZKDGCc5R67fVvLFSv-OLA', name: 'Warrior Poet Society',     tags: ['training','2a','self-defense','tactical'] },
  { id: 'UCFJ2K2gUJJ1ecBU6Sxc3bCA', name: 'Gun Owners of America',    tags: ['2a','advocacy','law'] },
  { id: 'UC3CfC922pS8htNjW8yTPGRg', name: 'Washington Gun Law',       tags: ['law','2a','legal','ccw'] , handle:'@WashingtonGunLaw'},
  { id: 'UCHWRbypJau9R8lDCXqlWgUA', name: 'Backfire',                 tags: ['hunting','review','long-range'] , handle:'@Backfire'},
  { id: 'UC0VQT2e75ejR-mUCuerugvA', name: 'Tactical Cowboy',          tags: ['training','tactics','self-defense'] },
  // ── DJ Added Batch 2 — May 2026 ──────────────────────────────────────────
  { id: 'UCG1_A0jPBGZUpRW7XkaaBkg', name: 'Honest Outlaw',           tags: ['review','edc','budget','honest'] , handle:'@HonestOutlawReviews'},
  { id: 'UC7X2IY5-ZHKU83nyb6KejgQ', name: 'Dirty Civilian',          tags: ['training','family','self-defense','fitness'] , handle:'@dirty-civilian'},
  { id: 'UCmBmZD1xOLIAmLe7wVKfUmA', name: 'Classic Firearms',        tags: ['industry','2a','review','historical'] , handle:'@ClassicFirearms'},
  { id: 'UC193r5YXcpQJV34N99ZbhzQ', name: 'Colion Noir',             tags: ['2a','law','advocacy','review'] , handle:'@ColionNoir'},
  { id: 'UCA_R_X4kk4P-ZUSrt2CXmng', name: 'Argali',                  tags: ['hunting','backcountry','gear','western'] , handle:'@Argali'},
  { id: 'UC816lSSFUowW4NrA5WfSpNw', name: 'PNWild',                  tags: ['hunting','pnw','outdoor','washington'] , handle:'@PNWild'},
  { id: '@gohunt',                   name: 'GoHUNT',                  tags: ['hunting','western','scouting','technology'] },
  { id: '@montanawild',              name: 'Montana Wild',            tags: ['hunting','montana','outdoor','film'] },
  { id: '@MountainsMulletsMerica',   name: 'Mountains Mullets Merica',tags: ['precision','long-range','review','prs'] },
  // ── DJ Added Batch 3 — May 2026 ──────────────────────────────────────────
  { id: 'UCLDHTNcCXHlu2Z9XNBZ2gZg', name: 'xring',                   tags: ['competition','precision','pistol','training'] , handle:'@xring'},
  { id: 'UCCgbrWR2dh0jDSCToEymeaw', name: 'Clint Morgan (Magdump)',   tags: ['2a','training','marine','advocacy'] , handle:'@ClintMagdumpMorgan'},
  { id: 'UCJxCLIuutemQ2D71hD3c5ug', name: 'GBRS Group',              tags: ['training','tactics','tier1','special-ops'] },
  { id: 'UCdqO3qjABeMfqdhErk-A7zg', name: 'Haley Strategic Partners',tags: ['training','tactics','mindset','travis-haley'] , handle:'@haleystrategicpartners'},
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

async function fetchChannelRSS(channelId, channelName, handle) {
  const apiKey = process.env.YOUTUBE_API_KEY

  // ── Primary: YouTube Data API v3 (no IP blocking, full quota) ──────────────
  if (apiKey && !channelId.startsWith('@')) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search')
      url.searchParams.set('part', 'snippet')
      url.searchParams.set('channelId', channelId)
      url.searchParams.set('order', 'date')
      url.searchParams.set('maxResults', '5')
      url.searchParams.set('type', 'video')
      url.searchParams.set('key', apiKey)
      const res  = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) })
      const data = await res.json()
      if (data.error) {
        const code = data.error.code
        const msg  = data.error.message || data.error.errors?.[0]?.reason || 'unknown'
        if (msg.includes('quota') || msg.includes('quotaExceeded')) {
          throw new Error(`YouTube API quota exhausted — resets midnight Pacific`)
        }
        if (code === 403 && msg.includes('blocked')) {
          throw new Error(`YouTube API key blocked for search.list — check API restrictions in Google Cloud Console`)
        }
        throw new Error(`YouTube API error ${code}: ${msg}`)
      }
      if (!data.items?.length) {
        console.log(`[VIDEO] ${channelName}: API returned 0 items`)
        return []
      }
      const videos = data.items
        .filter(item => item.id?.videoId && item.snippet)
        .map(item => ({
          _type: 'video',
          title: item.snippet.title,
          videoId: item.id.videoId,
          youtubeId: item.id.videoId,
          channelName,
          channelId,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
          description: (item.snippet.description || '').slice(0, 400),
          category: inferCategory(item.snippet.title),
          publishedAt: item.snippet.publishedAt,
          addedAt: new Date().toISOString(),
          featured: false,
          active: true,
        }))
      console.log(`[VIDEO] ${channelName}: API returned ${videos.length} videos`)
      return videos
    } catch (apiErr) {
      console.warn(`[VIDEO] ${channelName}: API failed (${apiErr.message}) — falling back to RSS`)
      // Fall through to RSS below
    }
  }

  // ── Fallback: YouTube RSS feed ──────────────────────────────────────────────
  const rssId = channelId.startsWith('@') ? channelId : channelId
  const url1  = `https://www.youtube.com/feeds/videos.xml?channel_id=${rssId}`
  let res = await fetch(url1, {
    headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
    signal: AbortSignal.timeout(10000),
  })

  // If UC ID fails, try @handle
  if (!res.ok && (res.status === 404 || res.status === 403) && handle && !channelId.startsWith('@')) {
    console.log(`[VIDEO] ${channelName}: UCid ${res.status} → trying handle ${handle}`)
    const url2 = `https://www.youtube.com/feeds/videos.xml?channel_id=${handle}`
    res = await fetch(url2, {
      headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`YouTube RSS HTTP ${res.status} for ${channelName} (${channelId} + handle ${handle})`)
  } else if (!res.ok) {
    throw new Error(`YouTube RSS HTTP ${res.status} for channel ${channelName} (${channelId})`)
  }

  const xml = await res.text()
  if (!xml.includes('<feed') && !xml.includes('<entry>')) {
    throw new Error(`YouTube RSS returned invalid XML for ${channelName}`)
  }
  const videos = parseYouTubeRSS(xml, channelId, channelName)
  console.log(`[VIDEO] ${channelName}: RSS returned ${videos.length} videos`)
  return videos.slice(0, 5)
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
      return data.result.channels.map(c => ({ id: c.channelId || c.id, name: c.name, handle: c.handle || null, tags: ['review'] }))
    }
  } catch {}
  return null
}

async function runVideoFeed() {
  console.log('[VIDEO] ===== Video feed starting — mode:', process.env.YOUTUBE_API_KEY ? 'YouTube Data API v3' : 'RSS fallback', '| channels:', channelList.length, '=====')

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

      const videos = await fetchChannelRSS(channel.id, channel.name, channel.handle)

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
