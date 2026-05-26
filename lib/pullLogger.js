/**
 * DownRange Pull Logger
 * Utility for recording API/RSS feed pull events with full metadata.
 * Used by: agent/feeds/news.js, agent/feeds/deals.js, agent/feeds/ammo.js, and any future data agents.
 *
 * Log file lives at: /tmp/dr-pull-log.json (dev) or process.env.PULL_LOG_PATH (prod/Vercel KV)
 * For production, swap the file-based store with Vercel KV or Upstash Redis.
 */

import fs from 'fs'
import path from 'path'

const LOG_PATH = process.env.PULL_LOG_PATH || '/tmp/dr-pull-log.json'
const MAX_ENTRIES = 500 // Rolling window — prune oldest when exceeded

// ─── Source registry ──────────────────────────────────────────────────────────
export const PULL_SOURCES = {
  // RSS feeds
  AMMOLAND_NEWS:   { id: 'ammoland_news',   label: 'AmmoLand News',       type: 'rss',  category: 'news'  },
  AMMOLAND_DEALS:  { id: 'ammoland_deals',  label: 'AmmoLand Deals',      type: 'rss',  category: 'deals' },
  THETRUTHABOUTGUNS: { id: 'ttag',          label: 'The Truth About Guns', type: 'rss',  category: 'news'  },
  GUNS_AMERICA:    { id: 'guns_america',    label: 'Guns America',         type: 'rss',  category: 'news'  },
  OUTDOOR_WIRE:    { id: 'outdoor_wire',    label: 'Outdoor Wire',         type: 'rss',  category: 'news'  },
  HUNTING_WIRE:    { id: 'hunting_wire',    label: 'Hunting Wire',         type: 'rss',  category: 'hunting'},
  NRA_ILA:         { id: 'nra_ila',         label: 'NRA-ILA',             type: 'rss',  category: 'legal' },
  GUNSANDAMMO:     { id: 'guns_and_ammo',   label: 'Guns & Ammo',         type: 'rss',  category: 'news'  },

  // APIs
  YOUTUBE_FEED:    { id: 'youtube',         label: 'YouTube API',          type: 'api',  category: 'video' },
  GOOGLE_PLACES:   { id: 'google_places',   label: 'Google Places API',    type: 'api',  category: 'ranges'},
  ALGOLIA_SYNC:    { id: 'algolia',         label: 'Algolia Index Sync',   type: 'api',  category: 'search'},
  AMMO_SEEK:       { id: 'ammo_seek',       label: 'AmmoSeek API',         type: 'api',  category: 'deals' },
  GUN_BROKER:      { id: 'gun_broker',      label: 'GunBroker API',        type: 'api',  category: 'deals' },
  SANITY_WRITE:    { id: 'sanity',          label: 'Sanity CMS Write',     type: 'api',  category: 'cms'   },
  OPEN_CROW:       { id: 'openclaw',        label: 'OpenClaw (Local AI)',   type: 'api',  category: 'ai'    },
}

export const STATUS = {
  SUCCESS:  'success',
  PARTIAL:  'partial',
  FAILED:   'failed',
  SKIPPED:  'skipped',
  PENDING:  'pending',
}

// ─── Core logger ──────────────────────────────────────────────────────────────

function readLog() {
  try {
    if (!fs.existsSync(LOG_PATH)) return []
    const raw = fs.readFileSync(LOG_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function writeLog(entries) {
  try {
    fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2), 'utf8')
  } catch (err) {
    console.error('[PullLogger] Write failed:', err.message)
  }
}

/**
 * logPull — record a feed/API pull event
 *
 * @param {object} opts
 * @param {string} opts.sourceId      — key from PULL_SOURCES (e.g. 'ammoland_news')
 * @param {string} opts.status        — STATUS constant
 * @param {number} [opts.itemCount]   — number of items fetched
 * @param {number} [opts.newItems]    — net new items (not duplicates)
 * @param {number} [opts.duration]    — pull duration in ms
 * @param {string} [opts.error]       — error message if failed
 * @param {object} [opts.meta]        — any extra metadata (url, headers, etc.)
 * @param {string[]} [opts.headlines] — sample headlines (up to 5)
 */
export function logPull({
  sourceId,
  status,
  itemCount = 0,
  newItems = 0,
  duration = 0,
  error = null,
  meta = {},
  headlines = [],
}) {
  const source = Object.values(PULL_SOURCES).find(s => s.id === sourceId)
    || { id: sourceId, label: sourceId, type: 'unknown', category: 'unknown' }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    source: source.id,
    sourceLabel: source.label,
    type: source.type,
    category: source.category,
    status,
    itemCount,
    newItems,
    duplicates: Math.max(0, itemCount - newItems),
    duration,
    error,
    headlines: headlines.slice(0, 5),
    meta,
  }

  const log = readLog()
  log.unshift(entry)

  // Rolling prune
  if (log.length > MAX_ENTRIES) log.splice(MAX_ENTRIES)

  writeLog(log)
  return entry
}

/**
 * getPullLog — fetch log entries with optional filters
 */
export function getPullLog({ limit = 100, source = null, status = null, category = null } = {}) {
  let entries = readLog()

  if (source)   entries = entries.filter(e => e.source === source)
  if (status)   entries = entries.filter(e => e.status === status)
  if (category) entries = entries.filter(e => e.category === category)

  return entries.slice(0, limit)
}

/**
 * getPullStats — aggregate stats for the dashboard
 */
export function getPullStats() {
  const entries = readLog()
  const now = Date.now()
  const last24h = entries.filter(e => now - new Date(e.timestamp).getTime() < 86400000)
  const last7d  = entries.filter(e => now - new Date(e.timestamp).getTime() < 604800000)

  const bySource = {}
  entries.forEach(e => {
    if (!bySource[e.source]) bySource[e.source] = { success: 0, failed: 0, partial: 0, total: 0, items: 0 }
    bySource[e.source][e.status] = (bySource[e.source][e.status] || 0) + 1
    bySource[e.source].total++
    bySource[e.source].items += e.itemCount
  })

  return {
    total: entries.length,
    last24h: last24h.length,
    last7d: last7d.length,
    successRate: entries.length
      ? Math.round((entries.filter(e => e.status === 'success').length / entries.length) * 100)
      : 0,
    totalItems: entries.reduce((sum, e) => sum + e.itemCount, 0),
    totalNew:   entries.reduce((sum, e) => sum + e.newItems, 0),
    avgDuration: entries.length
      ? Math.round(entries.reduce((sum, e) => sum + e.duration, 0) / entries.length)
      : 0,
    bySource,
    recentErrors: entries.filter(e => e.status === 'failed').slice(0, 5),
  }
}
