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
 *
 * sendCronAlert(message, options)
 *   options.context = {
 *     error   : string   — error message (for display separate from alert body)
 *     stack   : string   — full stack trace
 *     meta    : object   — arbitrary key-value debug pairs { feed, articlesFound, … }
 *   }
 */

import { Redis } from '@upstash/redis'

const COOLDOWN_KEY_PREFIX = 'dr:cronalert:cooldown:'
const ALERT_LOG_KEY       = 'dr:cronalert:log'
const MAX_LOG             = 200

const ALERT_EMAIL  = process.env.CRON_ALERT_EMAIL || 'dejcav@gmail.com'
const FROM_ADDRESS = 'DownRange System <alerts@downrangeco.com>'

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

// ── Sanity: fetch recent job runs for debug context ───────────────────────────
async function fetchRecentJobRuns(jobId, n = 6) {
  try {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 2500))
    const query = async () => {
      const { createClient } = await import('@sanity/client')
      const sanity = createClient({
        projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
        dataset:    'production',
        apiVersion: '2024-01-01',
        useCdn:     false,
        token:      process.env.SANITY_API_TOKEN,
      })
      return sanity.fetch(
        `*[_type == "cronRun" && jobId == $jobId] | order(_createdAt desc) [0...${n}]
         { status, ms, _createdAt, error }`,
        { jobId }
      )
    }
    return await Promise.race([query(), timeout])
  } catch { return [] }
}

// ── HTML helpers ──────────────────────────────────────────────────────────────
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function fmtAgo(iso) {
  try {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60)   return `${diff}s ago`
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`
    return `${Math.round(diff / 3600)}h ago`
  } catch { return iso }
}

function buildSectionHeader(label) {
  return `
  <div style="padding:4px 32px 0;">
    <div style="font-size:9px;letter-spacing:.14em;color:#6b7280;font-weight:700;padding-top:20px;
      border-top:1px solid #1f2428;">${label}</div>
  </div>`
}

// ── Build alert email HTML ────────────────────────────────────────────────────
function buildAlertHtml(message, jobId, context = {}) {
  const { error, stack, meta, recentRuns } = context
  const ts = new Date().toUTCString()

  // ── Stack trace section
  const stackSection = stack ? `
  ${buildSectionHeader('STACK TRACE')}
  <div style="padding:12px 32px;">
    <div style="background:#0a0505;border:1px solid #3b0000;border-left:3px solid #7f1d1d;padding:14px 16px;overflow-x:auto;">
      <pre style="margin:0;font-family:'IBM Plex Mono',Courier,monospace;font-size:10px;color:#fca5a5;
        line-height:1.6;word-break:break-all;white-space:pre-wrap;">${escHtml(stack.slice(0, 1200))}${stack.length > 1200 ? '\n… (truncated)' : ''}</pre>
    </div>
  </div>` : ''

  // ── Recent job history section
  const historySection = recentRuns && recentRuns.length > 0 ? `
  ${buildSectionHeader('RECENT JOB HISTORY')}
  <div style="padding:12px 32px;">
    <table style="width:100%;border-collapse:collapse;font-size:11px;font-family:'IBM Plex Mono',Courier,monospace;">
      <thead>
        <tr style="border-bottom:1px solid #1f2428;">
          <th style="text-align:left;color:#6b7280;font-weight:600;font-size:9px;letter-spacing:.1em;padding:4px 8px 4px 0;">STATUS</th>
          <th style="text-align:left;color:#6b7280;font-weight:600;font-size:9px;letter-spacing:.1em;padding:4px 8px;">WHEN</th>
          <th style="text-align:right;color:#6b7280;font-weight:600;font-size:9px;letter-spacing:.1em;padding:4px 0 4px 8px;">DURATION</th>
        </tr>
      </thead>
      <tbody>
        ${recentRuns.map((run, i) => {
          const isOk = run.status === 'success'
          const dot  = isOk ? '✓' : '✕'
          const clr  = isOk ? '#4ade80' : '#ef4444'
          const bg   = i % 2 === 0 ? '#0d0e10' : 'transparent'
          const err  = run.error ? `<div style="font-size:9px;color:#9ca3af;margin-top:2px;">${escHtml(run.error.slice(0, 80))}</div>` : ''
          return `<tr style="background:${bg};">
            <td style="padding:6px 8px 6px 0;color:${clr};">${dot} ${escHtml(run.status)}</td>
            <td style="padding:6px 8px;color:#9ca3af;">${fmtAgo(run._createdAt)}${err}</td>
            <td style="padding:6px 0 6px 8px;color:#6b7280;text-align:right;">${run.ms ? run.ms + 'ms' : '—'}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>` : ''

  // ── Meta / debug pairs section
  const metaEntries = meta ? Object.entries(meta).filter(([, v]) => v !== undefined && v !== null) : []
  const metaSection = metaEntries.length > 0 ? `
  ${buildSectionHeader('DEBUG METADATA')}
  <div style="padding:12px 32px;">
    <table style="width:100%;border-collapse:collapse;font-family:'IBM Plex Mono',Courier,monospace;font-size:11px;">
      ${metaEntries.map(([k, v], i) => `
      <tr style="background:${i % 2 === 0 ? '#0d0e10' : 'transparent'};">
        <td style="padding:5px 12px 5px 0;color:#6b7280;white-space:nowrap;vertical-align:top;font-size:9px;letter-spacing:.1em;font-weight:600;">${escHtml(k)}</td>
        <td style="padding:5px 0;color:#d1d5db;word-break:break-all;">${escHtml(String(v))}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;color:#e5e7eb;">
<div style="max-width:640px;margin:0 auto;background:#09090B;">

  <!-- Header -->
  <div style="background:#0A0B0C;border-bottom:3px solid #ef4444;padding:24px 32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#C8922A;letter-spacing:0.1em;">DOWNRANGE</div>
    <div style="font-size:9px;color:#4b5563;letter-spacing:0.2em;margin-top:2px;">SYSTEM ALERT · ${ts}</div>
  </div>

  <!-- Job + alert message -->
  <div style="padding:20px 32px 0;">
    <div style="font-size:9px;color:#6b7280;letter-spacing:.14em;font-weight:700;margin-bottom:6px;">JOB</div>
    <div style="font-size:18px;font-weight:700;color:#f9fafb;font-family:'IBM Plex Mono',Courier,monospace;">${escHtml(jobId)}</div>
  </div>

  <div style="padding:16px 32px 0;">
    <div style="padding:14px 16px;background:#1a0505;border:1px solid #450a0a;border-left:3px solid #ef4444;">
      <div style="font-size:9px;color:#ef4444;font-weight:700;letter-spacing:.1em;margin-bottom:6px;">ALERT</div>
      <div style="font-size:12px;color:#fca5a5;font-family:'IBM Plex Mono',Courier,monospace;line-height:1.7;word-break:break-all;">${escHtml(message)}</div>
    </div>
  </div>

  ${error && error !== message ? `
  <div style="padding:12px 32px 0;">
    <div style="padding:10px 14px;background:#0d0505;border:1px solid #2d0000;">
      <div style="font-size:9px;color:#9ca3af;font-weight:700;letter-spacing:.1em;margin-bottom:4px;">ERROR</div>
      <div style="font-size:11px;color:#fca5a5;font-family:'IBM Plex Mono',Courier,monospace;word-break:break-all;">${escHtml(error)}</div>
    </div>
  </div>` : ''}

  ${stackSection}
  ${historySection}
  ${metaSection}

  <!-- CTA -->
  <div style="padding:24px 32px 16px;">
    <a href="https://downrangeco.com/admin" style="display:inline-block;background:#C8922A;color:#000;padding:10px 20px;
      text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.06em;">MISSION CONTROL →</a>
    <a href="https://downrangeco.com/api/admin/test-sms" style="display:inline-block;margin-left:12px;
      border:1px solid #374151;color:#9ca3af;padding:10px 20px;text-decoration:none;font-size:12px;letter-spacing:.06em;">ALERT LOG</a>
  </div>

  <!-- Footer -->
  <div style="padding:12px 32px 24px;font-size:10px;color:#374151;border-top:1px solid #111;">
    DownRange Alert System · downrangeco.com · Powered by Resend + Upstash Redis
  </div>
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
 *   @param {string}  options.jobId           — for cooldown deduplication
 *   @param {boolean} options.bypassCooldown  — force send regardless of cooldown
 *   @param {object}  options.context         — debug context:
 *     { error, stack, meta: { key: value, … } }
 * @returns {{ sent, skipped, reason, error, resendId }}
 */
export async function sendCronAlert(message, options = {}) {
  const { jobId = 'default', bypassCooldown = false, context = {} } = options
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
    // Enrich with recent Sanity job history (2.5s timeout — never blocks the email)
    const recentRuns = jobId !== 'alert-test'
      ? await fetchRecentJobRuns(jobId, 6).catch(() => [])
      : []

    const enrichedContext = { ...context, recentRuns }
    const subject = `🚨 [DownRange] ${jobId} alert`
    const res = await getResend().emails.send({
      from:    FROM_ADDRESS,
      to:      [ALERT_EMAIL],
      subject,
      html:    buildAlertHtml(message, jobId, enrichedContext),
    })

    // Set cooldown
    const redis = getRedis()
    if (redis && !bypassCooldown) {
      try { await redis.setex(`${COOLDOWN_KEY_PREFIX}${jobId}`, cfg.cooldown, '1') } catch {}
    }

    const resendId = res?.data?.id ?? res?.id ?? undefined
    await logAlertEvent({ jobId, message: message.slice(0, 80), sent: true, resendId })
    return { sent: true, resendId }
  } catch (err) {
    await logAlertEvent({ jobId, message: message.slice(0, 80), sent: false, reason: err.message })
    return { sent: false, error: err.message }
  }
}

// ── Job wrapper ───────────────────────────────────────────────────────────────
/**
 * withCronAlert(jobId, fn, options)
 * Wraps a cron job. On failure, sends an email alert with full stack trace
 * and recent job history, then re-throws.
 */
export async function withCronAlert(jobId, fn, options = {}) {
  try {
    return await fn()
  } catch (e) {
    const msg = e?.message ?? String(e)
    const body = `DownRange — ${jobId} FAILED\n${msg.slice(0, 200)}\n${new Date().toUTCString()}`
    await sendCronAlert(body, {
      jobId,
      ...options,
      context: {
        ...(options.context ?? {}),
        error: msg,
        stack: e?.stack ?? undefined,
      },
    }).catch(() => {})
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
    configured:   !!cfg.apiKey,
    enabled:      cfg.enabled,
    alertEmail:   ALERT_EMAIL,
    cooldownSecs: cfg.cooldown,
    provider:     'Resend',
  }
}
