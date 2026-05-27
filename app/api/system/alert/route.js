export const dynamic = 'force-dynamic'

/**
 * POST /api/system/alert
 * Called internally when a data pull fails or recovers.
 * Sends email via Resend to dejcav@gmail.com.
 * Tracks alert state to avoid flooding — only alerts on:
 *   - First failure after success
 *   - Failure count hits threshold (3)
 *   - Recovery after failure
 *
 * GET /api/system/alert
 * Returns current alert state — used by admin Mission Control.
 */

import { Resend } from 'resend'
import { Redis } from '@upstash/redis'

const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")

const ALERT_EMAIL  = 'dejcav@gmail.com'
const ALERT_KEY    = 'dr:system-alerts'
const STATE_KEY    = 'dr:alert-state'
const MAX_ALERTS   = 200
const FAIL_THRESHOLD = 3   // alert after 3 consecutive failures

let _redis = null
function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  const { Redis: R } = require('@upstash/redis')
  _redis = new R({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  return _redis
}

// In-memory fallback
let _memAlerts = []
let _memState  = {}

async function readAlerts() {
  const redis = getRedis()
  if (redis) {
    try {
      const data = await redis.get(ALERT_KEY)
      return Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data) : [])
    } catch { return _memAlerts }
  }
  return _memAlerts
}

async function writeAlerts(alerts) {
  _memAlerts = alerts
  const redis = getRedis()
  if (redis) {
    try { await redis.set(ALERT_KEY, JSON.stringify(alerts), { ex: 30 * 86400 }) } catch {}
  }
}

async function readState() {
  const redis = getRedis()
  if (redis) {
    try {
      const data = await redis.get(STATE_KEY)
      return (typeof data === 'object' && data !== null) ? data
           : (typeof data === 'string') ? JSON.parse(data)
           : {}
    } catch { return _memState }
  }
  return _memState
}

async function writeState(state) {
  _memState = state
  const redis = getRedis()
  if (redis) {
    try { await redis.set(STATE_KEY, JSON.stringify(state), { ex: 30 * 86400 }) } catch {}
  }
}

// ── Send email alert ──────────────────────────────────────────────────────────
async function sendAlertEmail({ type, source, error, consecutiveFails, recoveredFrom }) {
  if (!process.env.RESEND_API_KEY) return { skipped: true, reason: 'no RESEND_API_KEY' }

  const isRecovery = type === 'recovery'
  const subject = isRecovery
    ? `✅ [DownRange] Feed Recovered: ${source}`
    : `🚨 [DownRange] Feed Failure: ${source}`

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family:sans-serif;background:#09090B;color:#e5e7eb;padding:32px;margin:0;">
        <div style="max-width:560px;margin:0 auto;background:#111316;border:1px solid #1f2428;border-top:3px solid ${isRecovery ? '#22c55e' : '#ef4444'};padding:32px;border-radius:4px;">
          <div style="font-family:'Bebas Neue',cursive;font-size:22px;letter-spacing:0.08em;color:${isRecovery ? '#22c55e' : '#ef4444'};margin-bottom:4px;">
            ${isRecovery ? '✅ FEED RECOVERED' : '🚨 FEED FAILURE ALERT'}
          </div>
          <div style="font-family:monospace;font-size:11px;color:#6b7280;margin-bottom:24px;">
            downrangeco.com · ${new Date().toUTCString()}
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="padding:8px 0;color:#9ca3af;width:140px;font-size:13px;">Feed Source</td>
              <td style="padding:8px 0;color:#e5e7eb;font-size:13px;font-weight:700;">${source}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#9ca3af;font-size:13px;">Status</td>
              <td style="padding:8px 0;font-size:13px;">
                <span style="background:${isRecovery ? '#14532d' : '#7f1d1d'};color:${isRecovery ? '#4ade80' : '#f87171'};padding:2px 10px;border-radius:3px;font-weight:700;">
                  ${isRecovery ? 'RECOVERED' : `FAILED (×${consecutiveFails})`}
                </span>
              </td>
            </tr>
            ${error ? `
            <tr>
              <td style="padding:8px 0;color:#9ca3af;font-size:13px;">Error</td>
              <td style="padding:8px 0;color:#f87171;font-size:13px;font-family:monospace;">${error}</td>
            </tr>` : ''}
            ${recoveredFrom ? `
            <tr>
              <td style="padding:8px 0;color:#9ca3af;font-size:13px;">Was failing for</td>
              <td style="padding:8px 0;color:#fbbf24;font-size:13px;">${recoveredFrom} consecutive failures</td>
            </tr>` : ''}
          </table>

          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #1f2428;">
            <a href="https://www.downrangeco.com/admin" style="background:#C8922A;color:#000;padding:10px 20px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.05em;display:inline-block;">
              VIEW MISSION CONTROL →
            </a>
          </div>

          <div style="margin-top:20px;font-size:11px;color:#4b5563;">
            DownRange Alert System · downrangeco.com
          </div>
        </div>
      </body>
    </html>
  `

  try {
    await getResend().emails.send({
      from: 'DownRange System <alerts@downrangeco.com>',
      to: [ALERT_EMAIL],
      subject,
      html,
    })
    return { sent: true }
  } catch (err) {
    console.error('[system/alert] email send failed:', err.message)
    return { sent: false, error: err.message }
  }
}

// ── POST — record a pull result and trigger alert if needed ───────────────────
export async function POST(request) {
  // Internal-only: require ADMIN_KEY
  const key = request.headers.get('x-admin-key')
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { source, sourceLabel, status, error } = await request.json()
    if (!source) return Response.json({ error: 'source required' }, { status: 400 })

    const isFailed  = status === 'failed'
    const isSuccess = status === 'success' || status === 'partial'

    // Read current alert state
    const state = await readState()
    const sourceState = state[source] || { consecutiveFails: 0, alertSent: false, lastAlert: null }

    let emailResult = null
    let alertType   = null

    if (isFailed) {
      sourceState.consecutiveFails = (sourceState.consecutiveFails || 0) + 1

      // Alert on threshold
      if (sourceState.consecutiveFails === FAIL_THRESHOLD) {
        alertType = 'failure'
        emailResult = await sendAlertEmail({
          type: 'failure',
          source: sourceLabel || source,
          error,
          consecutiveFails: sourceState.consecutiveFails,
        })
        sourceState.alertSent  = true
        sourceState.lastAlert  = new Date().toISOString()
      }
      // Alert on every 10 after threshold
      else if (sourceState.consecutiveFails > FAIL_THRESHOLD && sourceState.consecutiveFails % 10 === 0) {
        alertType = 'failure-repeat'
        emailResult = await sendAlertEmail({
          type: 'failure',
          source: sourceLabel || source,
          error,
          consecutiveFails: sourceState.consecutiveFails,
        })
        sourceState.lastAlert = new Date().toISOString()
      }
    } else if (isSuccess && sourceState.consecutiveFails >= FAIL_THRESHOLD) {
      // Recovery alert
      alertType = 'recovery'
      emailResult = await sendAlertEmail({
        type: 'recovery',
        source: sourceLabel || source,
        recoveredFrom: sourceState.consecutiveFails,
      })
      sourceState.consecutiveFails = 0
      sourceState.alertSent  = false
      sourceState.lastAlert  = new Date().toISOString()
    } else if (isSuccess) {
      sourceState.consecutiveFails = 0
      sourceState.alertSent = false
    }

    // Persist updated state
    state[source] = sourceState
    await writeState(state)

    // Log the alert event if one was sent
    if (alertType) {
      const alerts = await readAlerts()
      alerts.unshift({
        id: `alert-${Date.now()}-${source}`,
        timestamp: new Date().toISOString(),
        type: alertType,
        source,
        sourceLabel: sourceLabel || source,
        error: error || null,
        consecutiveFails: sourceState.consecutiveFails,
        emailSent: emailResult?.sent || false,
      })
      await writeAlerts(alerts.slice(0, MAX_ALERTS))
    }

    return Response.json({
      ok: true,
      source,
      consecutiveFails: sourceState.consecutiveFails,
      alertType,
      emailResult,
    })
  } catch (err) {
    console.error('[system/alert POST]', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// ── GET — return alert history + current state ────────────────────────────────
export async function GET() {
  try {
    const [alerts, state] = await Promise.all([readAlerts(), readState()])

    // Enrich state with labels
    const sourceStatus = Object.entries(state).map(([id, s]) => ({
      id,
      ...s,
      status: s.consecutiveFails >= FAIL_THRESHOLD ? 'failing'
            : s.consecutiveFails > 0 ? 'degraded'
            : 'healthy',
    }))

    return Response.json({ ok: true, alerts, sourceStatus, threshold: FAIL_THRESHOLD })
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
