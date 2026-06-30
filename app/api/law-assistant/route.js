export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'
import { callAIText }   from '@/lib/aiClient.js'
import { Redis }        from '@upstash/redis'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

// ── Rate limiter — lazy Upstash Redis ────────────────────────────────────────
// Caps LawAssistant at 10 queries per IP per day to prevent unbounded spend.
// Falls back gracefully if Redis is not configured.
let _redis = null
function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  _redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  return _redis
}

const RATE_LIMIT = 10  // queries per IP per calendar day
const WARN_AT    = 8   // warn user at this threshold

async function checkRateLimit(ip) {
  const redis = getRedis()
  if (!redis) return { allowed: true, remaining: RATE_LIMIT, warned: false }
  const key = `dr:law-rl:${ip}:${new Date().toDateString()}`
  try {
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 86400) // expire at end of day
    return {
      allowed:   count <= RATE_LIMIT,
      remaining: Math.max(0, RATE_LIMIT - count),
      warned:    count >= WARN_AT && count <= RATE_LIMIT,
      count,
    }
  } catch {
    return { allowed: true, remaining: RATE_LIMIT, warned: false }
  }
}

export async function POST(req) {
  try {
    const { question } = await req.json()
    if (!question) return Response.json({ error: 'No question' }, { status: 400 })

    // ── Rate limit check ──────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await checkRateLimit(ip)
    if (!rl.allowed) {
      return Response.json({
        answer: `You've reached the daily limit of ${RATE_LIMIT} law questions. Come back tomorrow, or consult an attorney for urgent matters. ⚠ Always verify current laws before carrying.`,
        rateLimited: true,
      }, { status: 429 })
    }
    const rateWarning = rl.warned ? `\n\n_You have ${rl.remaining} free question${rl.remaining !== 1 ? 's' : ''} remaining today._` : ''

    if (!process.env.ANTHROPIC_API_KEY && !process.env.GLM_API_KEY) {
      return Response.json({
        answer: "The AI law assistant requires an API key. Please add ANTHROPIC_API_KEY or GLM_API_KEY to your Vercel environment variables."
      })
    }

    // Fetch all state profiles for context
    const states = await sanity.fetch(`
      *[_type=="stateProfile"] {
        name, abbr, constitutionalCarry, ccwPermit, redFlagLaw,
        magLimit, waitPeriod, awbStatus, suppressors, openCarry,
        bgcPrivate, reciprocityStates[], rating
      }
    `).catch(() => [])

    const stateContext = states.length > 0
      ? `Current state law database (${states.length} states):\n${states.map(s =>
          `${s.name} (${s.abbr}): Constitutional carry: ${s.constitutionalCarry}, CCW: ${s.ccwPermit}, Red flag: ${s.redFlagLaw}, Mag limit: ${s.magLimit||'none'}, AWB: ${s.awbStatus||'no'}, Suppressors: ${s.suppressors||'check state'}, Open carry: ${s.openCarry||'check'}, Private sale BGC: ${s.bgcPrivate||'no'}, Reciprocity with: ${(s.reciprocityStates||[]).join(', ')||'check state'}`
        ).join('\n')}`
      : 'State database currently loading.'

    const prompt = `You are the DownRange Law Assistant — a firearms law expert for the United States. You answer questions about federal and state gun laws clearly, accurately, and directly.

${stateContext}

Rules:
- Answer factually based on the state data above when available
- Always remind users this is general information, not legal advice
- Be direct and specific — name the state, name the law
- If reciprocity is asked about, check the reciprocityStates array
- For constitutional carry states, say so explicitly
- Keep answers under 200 words
- Use plain language, not legalese

User question: ${question}

Provide a clear, helpful answer. End with: "⚠ Always verify current laws before carrying — laws change frequently."`

    const answer = await callAIText({ prompt, useCase: 'law-assistant', maxTokens: 400 })
    return Response.json({ answer: (answer || 'Unable to answer right now.') + rateWarning })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
