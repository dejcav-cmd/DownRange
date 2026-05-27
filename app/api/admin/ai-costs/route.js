export const dynamic = 'force-dynamic'
import { getCosts } from '@/lib/aiRouter'
import { createClient } from '@sanity/client'

// Persistent cost log in Redis
let redis = null
async function getRedis() {
  if (redis) return redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis')
    redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  }
  return redis
}

const COST_KEY = 'dr:ai-costs-v1'

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const live = getCosts()
  
  // Try to get historical from Redis
  let historical = []
  try {
    const r = await getRedis()
    if (r) {
      const raw = await r.get(COST_KEY)
      historical = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : []
    }
  } catch {}

  // Calculate totals
  const todayTotal = Object.values(live.today || {}).reduce((s, v) => s + (v.usd || 0), 0)
  const todayCalls = Object.values(live.today || {}).reduce((s, v) => s + (v.calls || 0), 0)

  return Response.json({
    ok: true,
    live: {
      today:      live.today || {},
      todayUsd:   todayTotal,
      todayCalls,
      lastReset:  live.lastReset,
    },
    historical,
    projections: {
      daily:   todayTotal,
      monthly: todayTotal * 30,
      savedVsSonnet: Math.max(0, (todayCalls * 0.005) - todayTotal), // vs all-Sonnet estimate
    },
    tiers: {
      nano:  { model: 'GLM-4.5 Air',        costPer1k: '$0.000014' },
      cheap: { model: 'GLM-4.7',             costPer1k: '$0.000028' },
      mid:   { model: 'Claude Haiku 4.5',    costPer1k: '$0.00048'  },
      smart: { model: 'Claude Sonnet 4.6',   costPer1k: '$0.009'    },
    }
  })
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, entry } = await req.json().catch(() => ({}))

  if (action === 'log') {
    // Called by cron jobs to log their cost
    try {
      const r = await getRedis()
      if (r) {
        const raw = await r.get(COST_KEY)
        const log = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : []
        log.unshift({ ...entry, at: new Date().toISOString() })
        await r.set(COST_KEY, JSON.stringify(log.slice(0, 500)))
      }
    } catch {}
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
