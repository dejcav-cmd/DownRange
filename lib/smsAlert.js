/**
 * lib/smsAlert.js
 * DownRange Portal — SMS alert infrastructure via Twilio
 * 
 * Env vars required:
 *   TWILIO_ACCOUNT_SID   — ACxxxxxxxx
 *   TWILIO_AUTH_TOKEN    — auth token
 *   TWILIO_FROM_NUMBER   — +12062036281
 *   ALERT_PHONE_NUMBER   — +1XXXXXXXXXX  (DJ's cell)
 * 
 * Optional:
 *   SMS_ALERTS_ENABLED   — "false" to disable without removing creds
 *   SMS_COOLDOWN_SECS    — seconds between repeat alerts (default 900)
 *   SMS_QUIET_START_UTC  — hour 0-23 to begin quiet window (default 23)
 *   SMS_QUIET_END_UTC    — hour 0-23 to end quiet window (default 7)
 *   SMS_CRITICAL_JOBS    — comma-separated job IDs that bypass quiet hours
 */

import { Redis } from '@upstash/redis'

const COOLDOWN_KEY_PREFIX = 'dr:sms:cooldown:'
const SMS_LOG_KEY         = 'dr:sms:log'
const SMS_CONFIG_KEY      = 'dr:sms:config'
const MAX_SMS_LOG         = 200

// ── Redis (shared with pullLogger) ────────────────────────────────────────────
let _redis = null
function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  try {
    _redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    return _redis
  } catch { return null }
}

// ── Config helpers ─────────────────────────────────────────────────────────────
function getSMSConfig() {
  return {
    sid:        process.env.TWILIO_ACCOUNT_SID,
    token:      process.env.TWILIO_AUTH_TOKEN,
    from:       process.env.TWILIO_FROM_NUMBER   || '+12062036281',  // DownRange Twilio number
    to:         process.env.ALERT_PHONE_NUMBER   || '+12066016076',  // DJ Cavalcanti
    enabled:    process.env.SMS_ALERTS_ENABLED !== 'false',
    cooldown:   parseInt(process.env.SMS_COOLDOWN_SECS ?? '900', 10),
    quietStart: parseInt(process.env.SMS_QUIET_START_UTC ?? '23', 10),
    quietEnd:   parseInt(process.env.SMS_QUIET_END_UTC ?? '7', 10),
    criticalJobs: (process.env.SMS_CRITICAL_JOBS ?? 'news,sanity,cron-health,gun-deals')
                    .split(',').map(s => s.trim()).filter(Boolean),
  }
}

function isQuietHour(cfg) {
  const hour = new Date().getUTCHours()
  if (cfg.quietStart < cfg.quietEnd) {
    return hour >= cfg.quietStart && hour < cfg.quietEnd
  }
  // wraps midnight
  return hour >= cfg.quietStart || hour < cfg.quietEnd
}

// ── Log to Redis ───────────────────────────────────────────────────────────────
async function logSMSEvent(entry) {
  const redis = getRedis()
  if (!redis) return
  try {
    const record = JSON.stringify({ id: `${Date.now()}-${Math.random().toString(36).slice(2,5)}`, ts: new Date().toISOString(), ...entry })
    await redis.lpush(SMS_LOG_KEY, record)
    await redis.ltrim(SMS_LOG_KEY, 0, MAX_SMS_LOG - 1)
  } catch {}
}

export async function readSMSLog(count = 50) {
  const redis = getRedis()
  if (!redis) return []
  try {
    const rows = await redis.lrange(SMS_LOG_KEY, 0, Math.min(count, MAX_SMS_LOG) - 1)
    return rows.map(r => { try { return typeof r === 'string' ? JSON.parse(r) : r } catch { return null } }).filter(Boolean)
  } catch { return [] }
}

export async function clearSMSLog() {
  const redis = getRedis()
  if (!redis) return
  try { await redis.del(SMS_LOG_KEY) } catch {}
}

// ── Dynamic config (admin-editable via Sanity/Redis) ──────────────────────────
export async function getSMSOverrideConfig() {
  const redis = getRedis()
  if (!redis) return null
  try {
    const val = await redis.get(SMS_CONFIG_KEY)
    return val ? (typeof val === 'string' ? JSON.parse(val) : val) : null
  } catch { return null }
}

export async function setSMSOverrideConfig(cfg) {
  const redis = getRedis()
  if (!redis) return false
  try {
    await redis.set(SMS_CONFIG_KEY, JSON.stringify({ ...cfg, updatedAt: new Date().toISOString() }))
    return true
  } catch { return false }
}

// ── Core send function ─────────────────────────────────────────────────────────
/**
 * sendSMSAlert(message, options)
 * @param {string} message  - SMS body (max 160 chars recommended)
 * @param {object} options
 *   @param {string}  options.jobId        - job name for cooldown deduplication
 *   @param {boolean} options.critical      - if true, bypasses quiet hours
 *   @param {boolean} options.bypassCooldown - force send regardless of cooldown
 * @returns {{ sent, skipped, reason, sid, status, error, httpStatus }}
 */
export async function sendSMSAlert(message, options = {}) {
  const { jobId = 'default', critical = false, bypassCooldown = false } = options
  const cfg = getSMSConfig()

  // ── Check dynamic override from admin panel ───────────────────────────
  const override = await getSMSOverrideConfig().catch(() => null)
  const effectiveCfg = override ? { ...cfg, ...override } : cfg

  // ── Guard: disabled ───────────────────────────────────────────────────
  if (!effectiveCfg.enabled) {
    await logSMSEvent({ jobId, message: message.slice(0, 80), sent: false, reason: 'disabled' })
    return { sent: false, skipped: true, reason: 'SMS alerts disabled' }
  }

  // ── Guard: missing config ─────────────────────────────────────────────
  const missing = ['sid','token','from','to'].filter(k => !effectiveCfg[k])
  if (missing.length) {
    const missingNames = { sid:'TWILIO_ACCOUNT_SID', token:'TWILIO_AUTH_TOKEN', from:'TWILIO_FROM_NUMBER', to:'ALERT_PHONE_NUMBER' }
    const reason = `Missing Vercel env: ${missing.map(k => missingNames[k] || k.toUpperCase()).join(', ')}`
    await logSMSEvent({ jobId, message: message.slice(0, 80), sent: false, reason })
    return { sent: false, skipped: true, reason }
  }

  // ── Guard: quiet hours (bypass if critical job or forced critical flag) ──
  const isCriticalJob = critical || effectiveCfg.criticalJobs.includes(jobId)
  if (!isCriticalJob && isQuietHour(effectiveCfg)) {
    const hour = new Date().getUTCHours()
    const reason = `Quiet hours active (${effectiveCfg.quietStart}:00–${effectiveCfg.quietEnd}:00 UTC, now ${hour}:xx)`
    await logSMSEvent({ jobId, message: message.slice(0, 80), sent: false, reason })
    return { sent: false, skipped: true, reason }
  }

  // ── Guard: cooldown ───────────────────────────────────────────────────
  if (!bypassCooldown) {
    const redis = getRedis()
    if (redis) {
      try {
        const cooldownKey = `${COOLDOWN_KEY_PREFIX}${jobId}`
        const existing = await redis.get(cooldownKey)
        if (existing) {
          const reason = `Cooldown active for "${jobId}" (${effectiveCfg.cooldown}s window)`
          await logSMSEvent({ jobId, message: message.slice(0, 80), sent: false, reason })
          return { sent: false, skipped: true, reason }
        }
      } catch {}
    }
  }

  // ── Send ──────────────────────────────────────────────────────────────
  const start = Date.now()
  let httpStatus = 0
  let twilioData = {}

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${effectiveCfg.sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${effectiveCfg.sid}:${effectiveCfg.token}`).toString('base64')}`,
          'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: effectiveCfg.to, From: effectiveCfg.from, Body: message }).toString(),
      }
    )
    httpStatus  = res.status
    twilioData  = await res.json().catch(() => ({}))
    const ok    = res.ok && !!twilioData.sid
    const ms    = Date.now() - start

    if (ok) {
      // Set cooldown
      const redis = getRedis()
      if (redis && !bypassCooldown) {
        try { await redis.setex(`${COOLDOWN_KEY_PREFIX}${jobId}`, effectiveCfg.cooldown, '1') } catch {}
      }
      await logSMSEvent({
        jobId, message: message.slice(0, 80), sent: true,
        twilioSid: twilioData.sid, twilioStatus: twilioData.status, ms, httpStatus,
      })
      return { sent: true, sid: twilioData.sid, status: twilioData.status, httpStatus, ms }
    } else {
      const errMsg  = twilioData.message ?? twilioData.error_message ?? 'Unknown Twilio error'
      const errCode = twilioData.code    ?? twilioData.error_code    ?? null
      await logSMSEvent({ jobId, message: message.slice(0, 80), sent: false, reason: `HTTP ${httpStatus} · ${errMsg}`, errCode, httpStatus, ms })
      return { sent: false, error: errMsg, errCode, httpStatus }
    }
  } catch (e) {
    const ms = Date.now() - start
    await logSMSEvent({ jobId, message: message.slice(0, 80), sent: false, reason: e.message, httpStatus, ms })
    return { sent: false, error: e.message, httpStatus }
  }
}

// ── Job wrapper — drop-in replacement for manual try/catch in cron routes ─────
/**
 * withSMSAlert(jobId, fn, options)
 * Wraps a cron job function. On failure, sends an SMS alert.
 * Automatically prepends "🚨 DownRange-News — " to the message.
 */
export async function withSMSAlert(jobId, fn, options = {}) {
  const start = Date.now()
  try {
    const result = await fn()
    return result
  } catch (e) {
    const msg = e?.message ?? String(e)
    const smsBody = `🚨 DownRange-News — ${jobId} FAILED\n${msg.slice(0, 130)}\n${new Date().toUTCString().slice(0, 25)}`
    await sendSMSAlert(smsBody, { jobId, ...options }).catch(() => {})
    throw e  // re-throw so the cron route can still return its own error response
  }
}

// ── Consecutive failure check ──────────────────────────────────────────────────
/**
 * shouldAlertConsecutive(jobId, threshold)
 * Returns true if the last `threshold` cron runs for a job all failed.
 * Reads from Sanity's cronRun documents.
 */
export async function shouldAlertConsecutive(jobId, threshold = 3) {
  try {
    const { createClient } = await import('@sanity/client')
    const sanity = createClient({
      projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
      dataset:    'production',
      apiVersion: '2024-01-01',
      useCdn:     false,
      token:      process.env.SANITY_API_TOKEN,
    })
    const runs = await sanity.fetch(
      `*[_type == "cronRun" && jobId == $jobId] | order(_createdAt desc) [0...${threshold}] { status }`,
      { jobId }
    )
    if (runs.length < threshold) return false
    return runs.every(r => r.status === 'failed')
  } catch { return false }
}

// ── Config introspection (for admin panel) ─────────────────────────────────────
export function getSMSConfigStatus() {
  const cfg = getSMSConfig()
  return {
    configured: !!(cfg.sid && cfg.token && cfg.from && cfg.to),
    enabled:    cfg.enabled,
    from:       cfg.from || null,  // show full number for admin diagnostic
    to:         cfg.to || null,   // show full number for admin diagnostic
    sidSet:     !!cfg.sid,
    tokenSet:   !!cfg.token,
    cooldownSecs: cfg.cooldown,
    quietStart:   cfg.quietStart,
    quietEnd:     cfg.quietEnd,
    criticalJobs: cfg.criticalJobs,
  }
}
