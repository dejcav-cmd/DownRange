/**
 * lib/cronReporter.js
 * Records cron run results directly to Redis (no HTTP self-call).
 * Falls back to in-memory if Redis not configured.
 */

const REDIS_KEY = 'dr:cron-runs-v2'
const TTL = 60 * 60 * 24 * 7  // 7 days

let _mem = {}
let _redis = null

function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  try {
    const { Redis } = require('@upstash/redis')
    _redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    return _redis
  } catch { return null }
}

export async function reportCronRun(jobId, { status = 'success', ms = 0, error = null, details = null } = {}) {
  try {
    const redis = getRedis()
    let runs = _mem

    // Read current state
    if (redis) {
      try {
        const d = await redis.get(REDIS_KEY)
        if (d) runs = typeof d === 'string' ? JSON.parse(d) : d
      } catch {}
    }

    // Append run
    if (!runs[jobId]) runs[jobId] = []
    runs[jobId].unshift({
      at:      new Date().toISOString(),
      status,
      ms,
      error:   error || null,
      details: details || null,
    })
    // Keep last 20 runs per job
    runs[jobId] = runs[jobId].slice(0, 20)

    _mem = runs

    // Persist to Redis
    if (redis) {
      try { await redis.set(REDIS_KEY, JSON.stringify(runs), { ex: TTL }) } catch {}
    }
  } catch {
    // Never let reporting crash a cron job
  }
}
