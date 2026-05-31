export const dynamic = 'force-dynamic'

/**
 * POST /api/system/alert  — record a feed result, trigger alert email if threshold hit
 * GET  /api/system/alert  — return alert history + current feed states
 */

import { Resend } from 'resend'
import { Redis  } from '@upstash/redis'

const getResend   = () => new Resend(process.env.RESEND_API_KEY || 're_placeholder')
const ALERT_EMAIL = 'dejcav@gmail.com'
const ALERT_KEY   = 'dr:system-alerts'
const STATE_KEY   = 'dr:alert-state'
const MAX_ALERTS  = 200
const FAIL_THRESHOLD = 3

// ── Feed metadata — context, cadence, impact, and fix guidance ────────────────
const FEED_META = {
  news:        { label: 'News Feed',          cadence: 15,  unit: 'min', content: 'firearms news articles', impact: '~4 articles/hour missed', fixes: { ECONNREFUSED: 'RSS source may be down — check feed URLs in agent config', '401': 'NewsAPI or GNews API key invalid — verify in Vercel env vars', timeout: 'Source is rate-limiting — consider increasing cron interval', '429': 'API rate limit hit — check NEWSAPI_KEY quota usage' } },
  laws:        { label: 'Laws & Legislation', cadence: 2,   unit: 'hr',  content: 'Congressional bills and state legislation', impact: '~1-2 bills/cycle missed', fixes: { ECONNREFUSED: 'Congress.gov or LegiScan may be down — check status pages', '401': 'LEGISCAN_KEY invalid or expired — verify in Vercel env vars', timeout: 'LegiScan is slow — may self-resolve' } },
  releases:    { label: 'Product Releases',   cadence: 1,   unit: 'hr',  content: 'manufacturer new product announcements', impact: 'New product launches delayed from site', fixes: { ECONNREFUSED: 'Manufacturer RSS feeds may be down', timeout: 'Feed parsing timeout — check source URLs' } },
  market:      { label: 'Market Data',        cadence: 30,  unit: 'min', content: 'ammo prices and market index', impact: '~2 price updates/hour missed', fixes: { ECONNREFUSED: 'AmmoSeek or Reddit API may be down', '429': 'Reddit API rate limit — check API credentials' } },
  video:       { label: 'Video Feed',         cadence: 4,   unit: 'hr',  content: 'YouTube firearms videos', impact: 'Video feed stale for 4+ hours', fixes: { '401': 'YOUTUBE_API_KEY invalid — verify in Vercel env vars', '403': 'YouTube API quota exceeded — check Google Cloud Console' } },
  state:       { label: 'State Laws',         cadence: 168, unit: 'hr',  content: 'state-level legislation updates', impact: 'State law pages may go stale (weekly cycle)', fixes: { ECONNREFUSED: 'LegiScan may be down', '401': 'LEGISCAN_KEY invalid' } },
  intelligence:{ label: 'Intelligence Brief', cadence: 24,  unit: 'hr',  content: 'daily competitive analysis email', impact: 'No intelligence briefing today', fixes: { timeout: 'Anthropic API or web search timeout — check API key quota', '401': 'ANTHROPIC_API_KEY invalid or over quota' } },
  newsletter:  { label: 'Newsletter',         cadence: 24,  unit: 'hr',  content: 'subscriber digest email', impact: 'Subscribers miss daily digest', fixes: { '401': 'RESEND_API_KEY invalid', timeout: 'Resend API timeout — check status.resend.com' } },
  'gun-deals': { label: 'Gun Deals',          cadence: 4,   unit: 'hr',  content: 'gun.deals and r/gundeals listings', impact: 'Deals page goes stale', fixes: { ECONNREFUSED: 'gun.deals RSS may be down', '429': 'Reddit rate limit hit' } },
  default:     { label: 'Feed',               cadence: 60,  unit: 'min', content: 'site data',               impact: 'Data may be stale',            fixes: {} },
}

function getFeedMeta(source) {
  return FEED_META[source] || { ...FEED_META.default, label: source }
}

function diagnoseFix(source, errorMessage) {
  const meta  = getFeedMeta(source)
  const fixes = meta.fixes || {}
  for (const [pattern, fix] of Object.entries(fixes)) {
    if ((errorMessage || '').includes(pattern)) return fix
  }
  return `Check the ${meta.label} feed config and verify all required env vars are set in Vercel.`
}

function estimateMissedItems(source, failDurationMs) {
  const meta  = getFeedMeta(source)
  const hours = failDurationMs / 3600000
  const cyclesPerHour = meta.unit === 'min' ? 60 / meta.cadence : 1 / meta.cadence
  const missedCycles  = Math.round(hours * cyclesPerHour)
  return { missedCycles, content: meta.content, cadenceLabel: `every ${meta.cadence} ${meta.unit}` }
}

// ── Redis helpers ─────────────────────────────────────────────────────────────
let _redis = null
function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  _redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  return _redis
}

let _memAlerts = []
let _memState  = {}

async function readAlerts() {
  const r = getRedis()
  if (r) { try { const d = await r.get(ALERT_KEY); return Array.isArray(d) ? d : (typeof d === 'string' ? JSON.parse(d) : []) } catch { return _memAlerts } }
  return _memAlerts
}
async function writeAlerts(a) {
  _memAlerts = a
  const r = getRedis()
  if (r) { try { await r.set(ALERT_KEY, JSON.stringify(a), { ex: 30 * 86400 }) } catch {} }
}
async function readState() {
  const r = getRedis()
  if (r) { try { const d = await r.get(STATE_KEY); return (typeof d === 'object' && d) ? d : (typeof d === 'string' ? JSON.parse(d) : {}) } catch { return _memState } }
  return _memState
}
async function writeState(s) {
  _memState = s
  const r = getRedis()
  if (r) { try { await r.set(STATE_KEY, JSON.stringify(s), { ex: 30 * 86400 }) } catch {} }
}

// ── Build enterprise alert email ──────────────────────────────────────────────
async function sendAlertEmail({ type, source, error, consecutiveFails, recoveredFrom, failStartedAt }) {
  if (!process.env.RESEND_API_KEY) return { skipped: true }

  const isRecovery = type === 'recovery'
  const meta       = getFeedMeta(source)
  const fixAdvice  = diagnoseFix(source, error)
  const now        = Date.now()
  const failDurMs  = failStartedAt ? now - new Date(failStartedAt).getTime() : 0
  const failDurStr = failDurMs > 0
    ? failDurMs > 3600000 ? `${Math.round(failDurMs / 3600000)}h ${Math.round((failDurMs % 3600000) / 60000)}m`
    : `${Math.round(failDurMs / 60000)} minutes`
    : 'unknown duration'

  const missed = isRecovery && failStartedAt ? estimateMissedItems(source, failDurMs) : null

  const accentColor = isRecovery ? '#22c55e' : '#ef4444'
  const bgColor     = isRecovery ? '#14532d' : '#450a0a'
  const subject     = isRecovery
    ? `✅ [DownRange] Recovered: ${meta.label} — ${failDurStr} downtime`
    : `🚨 [DownRange] ALERT: ${meta.label} failing × ${consecutiveFails}`

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;color:#e5e7eb;">
<div style="max-width:640px;margin:0 auto;background:#09090B;">

  <!-- Header -->
  <div style="background:#0A0B0C;border-bottom:3px solid ${accentColor};padding:24px 32px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#C8922A;letter-spacing:0.1em;">DOWNRANGE</div>
        <div style="font-size:9px;color:#4b5563;letter-spacing:0.2em;margin-top:2px;">SYSTEM ALERT · ${new Date().toUTCString()}</div>
      </div>
      <div style="background:${bgColor};border:2px solid ${accentColor};padding:8px 14px;text-align:center;">
        <div style="font-size:14px;font-weight:900;color:${accentColor};letter-spacing:.06em;">${isRecovery ? 'RECOVERED' : 'FAILURE'}</div>
      </div>
    </div>
  </div>

  <!-- Feed Identity -->
  <div style="background:#0d0e10;border-bottom:1px solid #1f2428;padding:20px 32px;">
    <div style="font-size:9px;color:#6b7280;letter-spacing:.16em;margin-bottom:8px;">AFFECTED SYSTEM</div>
    <div style="font-size:18px;font-weight:700;color:#f9fafb;margin-bottom:4px;">${meta.label}</div>
    <div style="font-size:12px;color:#9ca3af;">Pulls <strong style="color:#e5e7eb;">${meta.content}</strong> — runs <strong style="color:#e5e7eb;">${meta.cadenceLabel}</strong></div>
  </div>

  <!-- Status Grid -->
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 32px;">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:${error ? '16px' : '0'};">
      <div style="padding:12px;background:#0d0e10;border:1px solid #1f2428;">
        <div style="font-size:9px;color:#6b7280;letter-spacing:.1em;margin-bottom:4px;">STATUS</div>
        <div style="font-size:13px;font-weight:700;color:${accentColor};">${isRecovery ? 'RECOVERED' : `FAILED × ${consecutiveFails}`}</div>
      </div>
      <div style="padding:12px;background:#0d0e10;border:1px solid #1f2428;">
        <div style="font-size:9px;color:#6b7280;letter-spacing:.1em;margin-bottom:4px;">${isRecovery ? 'TOTAL DOWNTIME' : 'FAILING SINCE'}</div>
        <div style="font-size:13px;font-weight:700;color:#e5e7eb;">${isRecovery ? failDurStr : (failStartedAt ? new Date(failStartedAt).toLocaleTimeString() : 'unknown')}</div>
      </div>
      ${!isRecovery && failDurMs > 0 ? `
      <div style="padding:12px;background:#0d0e10;border:1px solid #1f2428;">
        <div style="font-size:9px;color:#6b7280;letter-spacing:.1em;margin-bottom:4px;">DOWNTIME SO FAR</div>
        <div style="font-size:13px;font-weight:700;color:#f59e0b;">${failDurStr}</div>
      </div>` : ''}
      <div style="padding:12px;background:#0d0e10;border:1px solid #1f2428;">
        <div style="font-size:9px;color:#6b7280;letter-spacing:.1em;margin-bottom:4px;">IMPACT</div>
        <div style="font-size:12px;color:#e5e7eb;">${meta.impact}</div>
      </div>
    </div>

    ${error ? `
    <div style="padding:12px 14px;background:#1a0505;border:1px solid #450a0a;border-left:3px solid #ef4444;">
      <div style="font-size:9px;color:#ef4444;font-weight:700;letter-spacing:.1em;margin-bottom:4px;">ERROR MESSAGE</div>
      <div style="font-size:11px;color:#fca5a5;font-family:monospace;line-height:1.6;word-break:break-all;">${error}</div>
    </div>` : ''}
  </div>

  <!-- Missed Data (recovery only) -->
  ${missed ? `
  <div style="background:#0d0e10;border-bottom:1px solid #1f2428;padding:20px 32px;">
    <div style="font-size:9px;color:#f59e0b;font-weight:700;letter-spacing:.16em;margin-bottom:10px;">📦 DATA GAP ESTIMATE</div>
    <div style="padding:12px 14px;background:#0A0B0C;border:1px solid #1f2428;">
      <div style="font-size:13px;color:#e5e7eb;margin-bottom:6px;">
        During the <strong>${failDurStr}</strong> outage, approximately <strong style="color:#f59e0b;">${missed.missedCycles} fetch cycles</strong> were missed.
      </div>
      <div style="font-size:12px;color:#9ca3af;margin-bottom:10px;">
        Content affected: <strong style="color:#e5e7eb;">${missed.content}</strong>
      </div>
      <div style="font-size:11px;color:#6b7280;">
        → Consider running a manual backfill from the Admin panel to fill the gap.
      </div>
    </div>
  </div>` : ''}

  <!-- Fix Guidance -->
  ${!isRecovery ? `
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 32px;">
    <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.16em;margin-bottom:10px;">🔧 RECOMMENDED ACTION</div>
    <div style="padding:12px 14px;background:#0d0e10;border-left:3px solid #C8922A;">
      <div style="font-size:12px;color:#e5e7eb;line-height:1.7;">${fixAdvice}</div>
    </div>
    <div style="margin-top:10px;font-size:11px;color:#6b7280;line-height:1.6;">
      This alert triggers after <strong style="color:#e5e7eb;">${FAIL_THRESHOLD} consecutive failures</strong>. 
      You will receive follow-up alerts every 10 failures. 
      A recovery email is sent automatically when the feed resumes.
    </div>
  </div>` : `
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 32px;">
    <div style="font-size:9px;color:#22c55e;font-weight:700;letter-spacing:.16em;margin-bottom:10px;">✅ FEED RESUMED</div>
    <div style="padding:12px 14px;background:#0d0e10;border-left:3px solid #22c55e;font-size:12px;color:#9ca3af;line-height:1.6;">
      The ${meta.label} is now running normally after ${recoveredFrom} consecutive failures. 
      No further action needed unless you want to run a backfill.
    </div>
  </div>`}

  <!-- CTA -->
  <div style="padding:20px 32px;background:#0d0e10;display:flex;gap:12px;align-items:center;">
    <a href="https://downrangeco.com/admin" style="background:#C8922A;color:#000;padding:10px 20px;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.06em;">MISSION CONTROL →</a>
    <span style="font-size:10px;color:#4b5563;">Check cron status, run manual backfill, or inspect logs.</span>
  </div>

  <div style="padding:12px 32px;font-size:10px;color:#374151;">DownRange Alert System · downrangeco.com</div>
</div>
</body></html>`

  try {
    await getResend().emails.send({ from: 'DownRange System <alerts@downrangeco.com>', to: [ALERT_EMAIL], subject, html })
    return { sent: true }
  } catch (err) {
    console.error('[system/alert] email send failed:', err.message)
    return { sent: false, error: err.message }
  }
}

// ── POST — record pull result ─────────────────────────────────────────────────
export async function POST(request) {
  const key = request.headers.get('x-admin-key')
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { source, sourceLabel, status, error } = await request.json()
    if (!source) return Response.json({ error: 'source required' }, { status: 400 })

    const isFailed  = status === 'failed'
    const isSuccess = status === 'success' || status === 'partial'

    const state       = await readState()
    const sourceState = state[source] || { consecutiveFails: 0, alertSent: false, lastAlert: null, failStartedAt: null }

    let emailResult = null
    let alertType   = null

    if (isFailed) {
      if (sourceState.consecutiveFails === 0) sourceState.failStartedAt = new Date().toISOString()
      sourceState.consecutiveFails = (sourceState.consecutiveFails || 0) + 1

      if (sourceState.consecutiveFails === FAIL_THRESHOLD) {
        alertType   = 'failure'
        emailResult = await sendAlertEmail({ type: 'failure', source, error, consecutiveFails: sourceState.consecutiveFails, failStartedAt: sourceState.failStartedAt })
        sourceState.alertSent = true
        sourceState.lastAlert = new Date().toISOString()
      } else if (sourceState.consecutiveFails > FAIL_THRESHOLD && sourceState.consecutiveFails % 10 === 0) {
        alertType   = 'failure-repeat'
        emailResult = await sendAlertEmail({ type: 'failure', source, error, consecutiveFails: sourceState.consecutiveFails, failStartedAt: sourceState.failStartedAt })
        sourceState.lastAlert = new Date().toISOString()
      }
    } else if (isSuccess && sourceState.consecutiveFails >= FAIL_THRESHOLD) {
      alertType   = 'recovery'
      emailResult = await sendAlertEmail({ type: 'recovery', source, recoveredFrom: sourceState.consecutiveFails, failStartedAt: sourceState.failStartedAt })
      sourceState.consecutiveFails = 0
      sourceState.alertSent        = false
      sourceState.failStartedAt    = null
      sourceState.lastAlert        = new Date().toISOString()
    } else if (isSuccess) {
      sourceState.consecutiveFails = 0
      sourceState.alertSent        = false
      sourceState.failStartedAt    = null
    }

    state[source] = sourceState
    await writeState(state)

    if (alertType) {
      const alerts = await readAlerts()
      alerts.unshift({
        id: `alert-${Date.now()}-${source}`, timestamp: new Date().toISOString(),
        type: alertType, source, sourceLabel: sourceLabel || source,
        error: error || null, consecutiveFails: sourceState.consecutiveFails,
        emailSent: emailResult?.sent || false,
      })
      await writeAlerts(alerts.slice(0, MAX_ALERTS))
    }

    return Response.json({ ok: true, source, consecutiveFails: sourceState.consecutiveFails, alertType, emailResult })
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// ── GET — alert history + source state ───────────────────────────────────────
export async function GET() {
  try {
    const [alerts, state] = await Promise.all([readAlerts(), readState()])
    const sourceStatus = Object.entries(state).map(([id, s]) => ({
      id, ...s,
      meta: getFeedMeta(id),
      status: s.consecutiveFails >= FAIL_THRESHOLD ? 'failing' : s.consecutiveFails > 0 ? 'degraded' : 'healthy',
    }))
    return Response.json({ ok: true, alerts, sourceStatus, threshold: FAIL_THRESHOLD })
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
