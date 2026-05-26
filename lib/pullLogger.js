/**
 * DownRange Pull Logger — Upstash Redis backend
 * Persistent across all Vercel serverless invocations.
 * Requires: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (auto-injected by Vercel)
 */

import { Redis } from '@upstash/redis'

const MAX_ENTRIES = 500
const REDIS_KEY   = 'dr:pull-log'
const TTL_SECONDS = 30 * 86400  // 30 days

// Lazy Redis client — only instantiates when env vars are present
let _redis = null
function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  _redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return _redis
}

// In-memory fallback for dev / missing env vars
let _memCache = []

// ── Source registry ───────────────────────────────────────────────────────────
export const PULL_SOURCES = {
  AMMOLAND_NEWS:   { id:'ammoland_news',    label:'AmmoLand News',        type:'rss', category:'news'    },
  AMMOLAND_DEALS:  { id:'ammoland_deals',   label:'AmmoLand Deals',       type:'rss', category:'deals'   },
  TTAG:            { id:'ttag',             label:'The Truth About Guns',  type:'rss', category:'news'    },
  TFB:             { id:'tfb',              label:'The Firearm Blog',      type:'rss', category:'news'    },
  CONCEALEDNATION: { id:'concealed_nation', label:'Concealed Nation',      type:'rss', category:'news'    },
  NRA_ILA:         { id:'nra_ila',          label:'NRA-ILA',               type:'rss', category:'legal'   },
  GUNSANDAMMO:     { id:'guns_and_ammo',    label:'Guns & Ammo',           type:'rss', category:'news'    },
  HUNTING_WIRE:    { id:'hunting_wire',     label:'Hunting Wire',          type:'rss', category:'hunting' },
  YOUTUBE_FEED:    { id:'youtube',          label:'YouTube API',           type:'api', category:'video'   },
  GOOGLE_PLACES:   { id:'google_places',    label:'Google Places API',     type:'api', category:'ranges'  },
  ALGOLIA_SYNC:    { id:'algolia',          label:'Algolia Index Sync',    type:'api', category:'search'  },
  AMMO_SEEK:       { id:'ammo_seek',        label:'AmmoSeek API',          type:'api', category:'deals'   },
  GUN_BROKER:      { id:'gun_broker',       label:'GunBroker API',         type:'api', category:'deals'   },
  SANITY_WRITE:    { id:'sanity',           label:'Sanity CMS Write',      type:'api', category:'cms'     },
  OPEN_CLAW:       { id:'openclaw',         label:'OpenClaw (Local AI)',   type:'api', category:'ai'      },
  NEWSAPI:         { id:'newsapi',          label:'NewsAPI.org',           type:'api', category:'news'    },
  GNEWS:           { id:'gnews',            label:'GNews API',             type:'api', category:'news'    },
  CONGRESS:        { id:'congress',         label:'Congress.gov',          type:'api', category:'law'     },
  SITE_HEALTH:     { id:'site_health',      label:'Site Health Scanner',   type:'api', category:'system'  },
}

export const STATUS = {
  SUCCESS: 'success', PARTIAL: 'partial',
  FAILED:  'failed',  SKIPPED: 'skipped', PENDING: 'pending',
}

// ── Storage ───────────────────────────────────────────────────────────────────

async function readLog() {
  const redis = getRedis()
  if (redis) {
    try {
      const data = await redis.get(REDIS_KEY)
      if (Array.isArray(data)) return data
      // Upstash may auto-parse JSON
      if (typeof data === 'string') return JSON.parse(data)
    } catch (err) {
      console.warn('[pullLogger] Redis read failed, using memory:', err.message)
    }
  }
  return _memCache
}

async function writeLog(entries) {
  _memCache = entries  // always keep memory in sync
  const redis = getRedis()
  if (redis) {
    try {
      await redis.set(REDIS_KEY, JSON.stringify(entries), { ex: TTL_SECONDS })
    } catch (err) {
      console.warn('[pullLogger] Redis write failed:', err.message)
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function logPull({
  sourceId, status, itemCount = 0, newItems = 0,
  duration = 0, error = null, meta = {}, headlines = [],
}) {
  const source = Object.values(PULL_SOURCES).find(s => s.id === sourceId)
    || { id: sourceId, label: sourceId, type: 'unknown', category: 'unknown' }

  const entry = {
    id:          `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp:   new Date().toISOString(),
    source:      source.id,
    sourceLabel: source.label,
    type:        source.type,
    category:    source.category,
    status,
    itemCount,
    newItems,
    duplicates:  Math.max(0, itemCount - newItems),
    duration,
    error,
    headlines:   headlines.slice(0, 5),
    meta,
  }

  const log = await readLog()
  log.unshift(entry)
  if (log.length > MAX_ENTRIES) log.splice(MAX_ENTRIES)
  await writeLog(log)
  return entry
}

export async function getPullLog({ limit = 200, source = null, status = null, category = null } = {}) {
  let entries = await readLog()
  if (source)   entries = entries.filter(e => e.source   === source)
  if (status)   entries = entries.filter(e => e.status   === status)
  if (category) entries = entries.filter(e => e.category === category)
  return entries.slice(0, limit)
}

export async function getPullStats() {
  const entries = await readLog()
  const now     = Date.now()
  const last24h = entries.filter(e => now - new Date(e.timestamp).getTime() < 86400000)
  const last7d  = entries.filter(e => now - new Date(e.timestamp).getTime() < 604800000)

  const bySource = {}
  for (const e of entries) {
    if (!bySource[e.source]) bySource[e.source] = { success:0, failed:0, partial:0, total:0, items:0, label:e.sourceLabel }
    bySource[e.source][e.status] = (bySource[e.source][e.status] || 0) + 1
    bySource[e.source].total++
    bySource[e.source].items += (e.itemCount || 0)
  }

  return {
    total:        entries.length,
    last24h:      last24h.length,
    last7d:       last7d.length,
    successRate:  entries.length
      ? Math.round(entries.filter(e => e.status === 'success').length / entries.length * 100)
      : 0,
    totalItems:   entries.reduce((s, e) => s + (e.itemCount || 0), 0),
    totalNew:     entries.reduce((s, e) => s + (e.newItems  || 0), 0),
    avgDuration:  entries.length
      ? Math.round(entries.reduce((s, e) => s + (e.duration || 0), 0) / entries.length)
      : 0,
    bySource,
    recentErrors: entries.filter(e => e.status === 'failed').slice(0, 5),
    backend:      getRedis() ? 'upstash-redis' : 'memory',
  }
}
