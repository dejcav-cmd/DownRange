/**
 * lib/cronAlert.js
 * DownRange Portal — cron failure alerting via Resend email
 *
 * Drop-in replacement for lib/smsAlert.js. Sends to DJ's email instead of
 * Twilio SMS — no carrier registration, no monthly fees, same cooldown logic.
 *
 * Env vars required:
 *   RESEND_API_KEY      — re_xxxxxxxx
 *
 * Optional:
 *   CRON_ALERT_EMAIL    — override recipient (default: dejcav@gmail.com)
 *   CRON_ALERT_ENABLED  — "false" to disable without removing creds
 *   CRON_COOLDOWN_SECS  — seconds between repeat alerts (default 900)
 */

import { Redis } from '@upstash/redis'

const COOLDOWN_KEY_PREFIX = 'dr:cronalert:cooldown:'
const ALERT_LOG_KEY       = 'dr:cronalert:log'
const MAX_LOG             = 200

const ALERT_EMAIL   = process.env.CRON_ALERT_EMAIL || 'dejcav@gmail.com'
const FROM_ADDRESS  = 'DownRange System <alerts@downrangeco.com>'

// ── Lazy inits ────────────────────────────────────────────────────────────────
let _redis  = null
let _resend = null

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

function getResend() {
  if (_resend) return _resend
  const { Resend } = require('resend')
  _resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder')
  return _resend
}

function getConfig() {
  return {
    enabled:  process.env.CRON_ALERT_ENABLED !== 'false',
    cooldown: parseInt(process.env.CRON_COOLDOWN_SECS ?? '900', 10),
    apiKey:   process.env.RESEND_API_KEY,
  }
}

// ── Log helpers ───────────────────────────────────────────────────────────────
async function logAlertEvent(entry) {
  const redis = getRedis()
  if (!redis) return
  try {
    const record = JSON.stringify({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      ts: new Date().toISOString(),
      ...entry,
    })
    await redis.lpush(ALERT_LOG_KEY, record)
    await redis.ltrim(ALERT_LOG_KEY, 0, MAX_LOG - 1)
  } catch {}
}

export async function readAlertLog(count = 50) {
  const redis = getRedis()
  if (!redis) return []
  try {
    const rows = await redis.lrange(ALERT_LOG_KEY, 0, Math.min(count, MAX_LOG) - 1)
    return rows
      .map(r => { try { return typeof r === 'string' ? JSON.parse(r) : r } catch { return null } })
      .filter(Boolean)
  } catch { return [] }
}

export async function clearAlertLog() {
  const redis = getRedis()
  if (!redis) return
  try { await redis.del(ALERT_LOG_KEY) } catch {}
}

// ── Build alert email HTML ────────────────────────────────────────────────────
function buildAlertHtml(message, jobId) {
  const ts = new Date().toUTCString()
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;color:#e5e7eb;">
<div style="max-width:600px;margin:0 auto;background:#09090B;">
  <div style="background:#0A0B0C;border-bottom:3px solid #ef4444;padding:24px 32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#C8922A;letter-spacing:0.1em;">DOWNRANGE</div>
    <div style="font-size:9px;color:#4b5563;letter-spacing:0.2em;margin-top:2px;">SYSTEM ALERT · ${ts}</div>
  </div>
  <div style="padding:24px 32px;background:#0d0e10;border-bottom:1px solid #1f2428;">
    <div style="font-size:9px;color:#6b7280;letter-spacing:.16em;margin-bottom:8px;">JOB</div>
    <div style="font-size:16px;font-weight:700;color:#f9fafb;">${jobId}</div>
  </div>
  <div style="padding:24px 32px;">
    <div style="padding:14px 16px;background:#1a0505;border:1px solid #450a0a;border-left:3px solid #ef4444;">
      <div style="font-size:9px;color:#ef4444;font-weight:700;letter-spacing:.1em;margin-bottom:6px;">ALERT</div>
      <div style="font-size:12px;color:#fca5a5;font-family:monospace;line-height:1.7;word-break:break-all;">${message}</div>
    </div>
  </div>
  <div style="padding:16px 32px;background:#0d0e10;">
    <a href="https://downrangeco.com/admin" style="background:#C8922A;color:#000;padding:10px 20px;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.06em;">MISSION CONTROL →</a>
  </div>
  <div style="padding:12px 32px;font-size:10px;color:#374151;">DownRange Alert System · downrangeco.com</div>
</div>
</body></html>`
}

// ── Core send function ────────────────────────────────────────────────────────
/**
 * sendCronAlert(message, options)
 * Drop-in replacement for sendSMSAlert() — sends email via Resend instead.
 *
 * @param {string} message
 * @param {object} options
 *   @param {string}  options.jobId          — for cooldown deduplication
 *   @param {boolean} options.bypassCooldown — force send regardless of cooldown
 * @returns {{ sent, skipped, reason, error }}
 */
export async function sendCronAlert(message, options = {}) {
  const { jobId = 'default', bypassCooldown = false } = options
  const cfg = getConfig()

  if (!cfg.enabled) {
    await logAlertEvent({ jobId, message: message.slice(0, 80), sent: false, reason: 'disabled' })
    return { sent: false, skipped: true, reason: 'Cron alerts disabled' }
  }

  if (!cfg.apiKey) {
    await logAlertEvent({ jobId, message: message.slice(0, 80), sent: false, reason: 'Missing RESEND_API_KEY' })
    return { sent: false, skipped: true, reason: 'Missing RESEND_API_KEY' }
  }

  // Cooldown check
  if (!bypassCooldown) {
    const redis = getRedis()
    if (redis) {
      try {
        const existing = await redis.get(`${COOLDOWN_KEY_PREFIX}${jobId}`)
        if (existing) {
          const reason = `Cooldown active for "${jobId}" (${cfg.cooldown}s window)`
          await logAlertEvent({ jobId, message: message.slice(0, 80), sent: false, reason })
          return { sent: false, skipped: true, reason }
        }
      } catch {}
    }
  }

  try {
    const subject = `🚨 [DownRange] ${jobId} alert`
    await getResend().emails.send({
      from:    FROM_ADDRESS,
      to:      [ALERT_EMAIL],
      subject,
      html:    buildAlertHtml(message, jobId),
    })

    // Set cooldown
    const redis = getRedis()
    if (redis && !bypassCooldown) {
      try { await redis.setex(`${COOLDOWN_KEY_PREFIX}${jobId}`, cfg.cooldown, '1') } catch {}
    }

    await logAlertEvent({ jobId, message: message.slice(0, 80), sent: true })
    return { sent: true }
  } catch (err) {
    await logAlertEvent({ jobId, message: message.slice(0, 80), sent: false, reason: err.message })
    return { sent: false, error: err.message }
  }
}

// ── Job wrapper ───────────────────────────────────────────────────────────────
/**
 * withCronAlert(jobId, fn, options)
 * Wraps a cron job. On failure, sends an email alert and re-throws.
 */
export async function withCronAlert(jobId, fn, options = {}) {
  try {
    return await fn()
  } catch (e) {
    const msg = e?.message ?? String(e)
    const body = `DownRange — ${jobId} FAILED\n${msg.slice(0, 200)}\n${new Date().toUTCString()}`
    await sendCronAlert(body, { jobId, ...options }).catch(() => {})
    throw e
  }
}

// ── Consecutive failure check (unchanged from smsAlert.js) ───────────────────
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

// ── Config status (for admin panel) ──────────────────────────────────────────
export function getCronAlertStatus() {
  const cfg = getConfig()
  return {
    configured: !!cfg.apiKey,
    enabled:    cfg.enabled,
    alertEmail: ALERT_EMAIL,
    cooldownSecs: cfg.cooldown,
    provider: 'Resend',
  }
}
