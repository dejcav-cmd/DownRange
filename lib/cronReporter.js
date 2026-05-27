/**
 * lib/cronReporter.js
 * Records every cron run to Redis and emails DJ on failures.
 * Never throws — cron jobs must not fail due to reporting.
 */

const REDIS_KEY   = 'dr:cron-runs-v2'
const ALERT_KEY   = 'dr:cron-fail-alerts'
const ALERT_CFG   = 'dr:cron-alert-config'   // per-job alert settings
const TTL         = 60 * 60 * 24 * 7
const ALERT_TTL   = 60 * 60 * 2
const DEFAULT_EMAIL = 'dejcav@gmail.com'

let _mem   = {}
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

async function readRuns(redis) {
  if (redis) {
    try {
      const d = await redis.get(REDIS_KEY)
      if (d) return typeof d === 'string' ? JSON.parse(d) : d
    } catch {}
  }
  return { ..._mem }
}

async function writeRuns(redis, runs) {
  _mem = runs
  if (redis) {
    try { await redis.set(REDIS_KEY, JSON.stringify(runs), { ex: TTL }) } catch {}
  }
}

// ── Alert config helpers ──────────────────────────────────────────────────────
export async function getAlertConfig() {
  const redis = getRedis()
  if (redis) {
    try {
      const d = await redis.get(ALERT_CFG)
      if (d) return typeof d === 'string' ? JSON.parse(d) : d
    } catch {}
  }
  return {}
}

export async function setAlertConfig(config) {
  const redis = getRedis()
  if (redis) {
    try { await redis.set(ALERT_CFG, JSON.stringify(config), { ex: TTL * 52 }) } catch {}
  }
}

// Get the alert email for a job (falls back to default)
async function getAlertEmail(jobId) {
  try {
    const cfg = await getAlertConfig()
    const job = cfg[jobId]
    if (job && job.alertEnabled === false) return null  // alerts disabled for this job
    if (job && job.alertEmail) return job.alertEmail
    // Check global override
    if (cfg._global && cfg._global.alertEmail) return cfg._global.alertEmail
  } catch {}
  return DEFAULT_EMAIL
}

// ── Troubleshooting context per job ──────────────────────────────────────────
function getTroubleshootingGuide(jobId, error) {
  const guides = {
    news:        { what: 'RSS/NewsAPI/GNews → Sanity news articles', checks: ['ANTHROPIC_API_KEY set?', 'SANITY_API_TOKEN set?', 'NEWSAPI_KEY or GNEWS_KEY set?', 'RSS feed URLs reachable?'], likelyCause: 'Usually a Sanity write failure or API key missing.' },
    laws:        { what: 'Congress.gov + LegiScan → legislation feed', checks: ['LEGISCAN_KEY set?', 'SANITY_API_TOKEN set?', 'Congress.gov not rate-limiting?'], likelyCause: 'LegiScan API key expired or rate-limited.' },
    releases:    { what: 'Manufacturer RSS → new product releases', checks: ['SANITY_API_TOKEN set?', 'Manufacturer RSS feeds online?'], likelyCause: 'Sanity write error or RSS feed down.' },
    market:      { what: 'AmmoSeek + Reddit → ammo price index', checks: ['SANITY_API_TOKEN set?', 'AmmoSeek scrape not blocked?'], likelyCause: 'Scrape blocked or Sanity write failed.' },
    video:       { what: 'YouTube API → video index', checks: ['YOUTUBE_API_KEY set?', 'YouTube quota not exceeded?'], likelyCause: 'YouTube API quota exceeded (10k units/day limit).' },
    state:       { what: 'LegiScan → per-state bill updates', checks: ['LEGISCAN_KEY set?', 'SANITY_API_TOKEN set?'], likelyCause: 'LegiScan key issue or state feed change.' },
    goa:         { what: 'Gun Owners of America WP JSON + RSS', checks: ['GOA site reachable?', 'SANITY_API_TOKEN set?'], likelyCause: 'GOA site structure changed or down.' },
    intelligence:{ what: 'Competitor research + Claude analysis → dailyBriefing', checks: ['ANTHROPIC_API_KEY set?', 'RESEND_API_KEY set?', 'SANITY_API_TOKEN set?', 'claude-sonnet-4-5 model available?'], likelyCause: 'Claude API timeout (maxDuration 300s) or Sanity write failed. Web search can slow this job significantly.' },
    newsletter:  { what: 'Daily digest email via Resend', checks: ['RESEND_API_KEY set?', 'Resend domain verified?', 'Email template valid?'], likelyCause: 'Resend API key invalid or domain not verified.' },
    nics:        { what: 'FBI NICS background check data scrape', checks: ['FBI NICS page structure changed?', 'SANITY_API_TOKEN set?'], likelyCause: 'FBI page HTML structure changed — scraper needs update.' },
    'site_health':{ what: 'Site health checks — broken links, missing images', checks: ['SANITY_API_TOKEN set?', 'Site reachable?'], likelyCause: 'Sanity connection issue.' },
    'fix-images':{ what: 'Patch missing article images', checks: ['SANITY_API_TOKEN set?', 'Image CDN reachable?'], likelyCause: 'Sanity write error or image CDN timeout.' },
    backfill:    { what: 'Backfill missing article bodies via Claude', checks: ['ANTHROPIC_API_KEY set?', 'SANITY_API_TOKEN set?', 'maxDuration 60s — timing out?'], likelyCause: 'Claude API timeout or too many articles in batch.' },
    'fetch-images': { what: 'Fetch og:image from source URLs → Sanity CDN', checks: ['Source URLs reachable?', 'SANITY_API_TOKEN set?', 'Sanity CDN asset upload working?'], likelyCause: 'Source site blocking image fetch or Sanity CDN upload failed.' },
    'queue_digest': { what: 'Outreach queue approval digest email', checks: ['RESEND_API_KEY set?', 'Outreach queue API working?'], likelyCause: 'Resend key issue or queue API returned error.' },
    'prn_releases': { what: 'PRNewswire manufacturer press releases scraper', checks: ['PRNewswire page reachable?', 'ANTHROPIC_API_KEY set?', 'SANITY_API_TOKEN set?'], likelyCause: 'PRNewswire blocked the scraper or Claude parse failed.' },
    'cron-health': { what: 'System health check + email alerts', checks: ['RESEND_API_KEY set?', 'SANITY_API_TOKEN set?'], likelyCause: 'Rare — this job failing means something is very wrong.' },
  }
  return guides[jobId] || { what: `Cron job: ${jobId}`, checks: ['Check Vercel function logs', 'Check env vars in Vercel dashboard'], likelyCause: 'Unknown — check Vercel logs for this function.' }
}

// ── Rich failure email ────────────────────────────────────────────────────────
async function sendFailureEmail(jobId, error, ms, details, recentHistory, alertEmail) {
  if (!process.env.RESEND_API_KEY) return
  const to = alertEmail || DEFAULT_EMAIL
  const guide = getTroubleshootingGuide(jobId, error)
  const now = new Date().toUTCString()

  // Recent run summary for context
  const runRows = (recentHistory || []).slice(0, 5).map(r => {
    const c = r.status === 'success' ? '#22c55e' : r.status === 'warning' ? '#f59e0b' : '#ef4444'
    const icon = r.status === 'success' ? '✓' : r.status === 'warning' ? '⚠' : '✕'
    const ago = (() => {
      const diff = Date.now() - new Date(r.at).getTime()
      if (diff < 3600000) return `${Math.round(diff/60000)}m ago`
      if (diff < 86400000) return `${Math.round(diff/3600000)}h ago`
      return `${Math.round(diff/86400000)}d ago`
    })()
    return `<tr style="border-bottom:1px solid #1a1f2a">
      <td style="padding:4px 8px;color:${c};font-family:monospace;font-size:11px">${icon} ${r.status.toUpperCase()}</td>
      <td style="padding:4px 8px;color:#6b7280;font-family:monospace;font-size:11px">${ago}</td>
      <td style="padding:4px 8px;color:#4b5563;font-family:monospace;font-size:11px">${r.ms > 0 ? (r.ms < 1000 ? r.ms+'ms' : (r.ms/1000).toFixed(1)+'s') : '—'}</td>
      <td style="padding:4px 8px;font-family:monospace;font-size:10px;color:${r.error ? '#f87171' : '#374151'}">${r.error || r.details || ''}</td>
    </tr>`
  }).join('')

  const checksHtml = guide.checks.map(c =>
    `<li style="margin-bottom:4px;color:#9ca3af;font-family:monospace;font-size:11px">${c}</li>`
  ).join('')

  // Paste-to-Claude block
  const debugBlock = [
    `Job: ${jobId}`,
    `What it does: ${guide.what}`,
    `Failed at: ${now}`,
    `Duration: ${ms || 0}ms`,
    `Error: ${error || 'Unknown'}`,
    details ? `Details: ${details}` : null,
    `Recent runs: ${(recentHistory||[]).slice(0,3).map(r => `${r.status}(${r.error||r.details||'ok'})`).join(', ')}`,
    `Likely cause: ${guide.likelyCause}`,
  ].filter(Boolean).join('\n')

  try {
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'DownRange Cron Monitor <dj@downrangeco.com>',
      to:   [to],
      subject: `🚨 [DownRange] Cron FAILED: ${jobId} — ${error ? error.slice(0, 60) : 'Unknown error'}`,
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#09090B;font-family:monospace;color:#e5e7eb">
<div style="max-width:640px;margin:0 auto;background:#0A0B0C;border:1px solid #1f2428;border-top:3px solid #ef4444">

  <!-- Header -->
  <div style="padding:24px 28px;border-bottom:1px solid #1f2428">
    <div style="font-size:11px;color:#ef4444;font-weight:700;letter-spacing:.15em;text-transform:uppercase;margin-bottom:6px">🚨 Cron Job Failed</div>
    <div style="font-size:22px;font-weight:900;color:#f87171;letter-spacing:.02em;margin-bottom:4px">${jobId}</div>
    <div style="font-size:11px;color:#6b7280">${now}</div>
  </div>

  <!-- Error -->
  <div style="padding:20px 28px;border-bottom:1px solid #1f2428;background:rgba(239,68,68,.04)">
    <div style="font-size:9px;color:#64748b;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">Error Message</div>
    <div style="font-family:monospace;font-size:12px;color:#fca5a5;background:#0d1117;border:1px solid rgba(239,68,68,.25);padding:12px 14px;line-height:1.6;word-break:break-all">${error || 'Unknown error'}</div>
    <div style="display:flex;gap:20px;margin-top:10px">
      <div><span style="font-size:9px;color:#4b5563">DURATION</span><br><span style="color:#e5e7eb;font-size:13px;font-weight:700">${ms || 0}ms</span></div>
      ${details ? `<div><span style="font-size:9px;color:#4b5563">DETAILS</span><br><span style="color:#9ca3af;font-size:11px">${details.slice(0,120)}</span></div>` : ''}
    </div>
  </div>

  <!-- What this job does -->
  <div style="padding:16px 28px;border-bottom:1px solid #1f2428">
    <div style="font-size:9px;color:#64748b;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px">What This Job Does</div>
    <div style="font-size:12px;color:#9ca3af;line-height:1.6">${guide.what}</div>
  </div>

  <!-- Recent run history -->
  ${runRows ? `<div style="padding:16px 28px;border-bottom:1px solid #1f2428">
    <div style="font-size:9px;color:#64748b;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">Recent Run History</div>
    <table style="width:100%;border-collapse:collapse;background:#0d1117;border:1px solid #1a1f2a">
      <thead><tr style="border-bottom:1px solid #1a1f2a">
        <th style="padding:4px 8px;text-align:left;font-size:9px;color:#374151">Status</th>
        <th style="padding:4px 8px;text-align:left;font-size:9px;color:#374151">When</th>
        <th style="padding:4px 8px;text-align:left;font-size:9px;color:#374151">Duration</th>
        <th style="padding:4px 8px;text-align:left;font-size:9px;color:#374151">Details / Error</th>
      </tr></thead>
      <tbody>${runRows}</tbody>
    </table>
  </div>` : ''}

  <!-- Troubleshooting -->
  <div style="padding:16px 28px;border-bottom:1px solid #1f2428">
    <div style="font-size:9px;color:#f59e0b;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">⚡ Likely Cause</div>
    <div style="font-size:12px;color:#fbbf24;line-height:1.6;margin-bottom:12px">${guide.likelyCause}</div>
    <div style="font-size:9px;color:#64748b;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px">Checklist</div>
    <ul style="margin:0;padding-left:18px">${checksHtml}</ul>
  </div>

  <!-- Paste to Claude block -->
  <div style="padding:16px 28px;border-bottom:1px solid #1f2428;background:rgba(200,146,42,.03)">
    <div style="font-size:9px;color:#C8922A;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">📋 Paste This to Claude for Help</div>
    <pre style="margin:0;padding:12px 14px;background:#0d1117;border:1px solid rgba(200,146,42,.25);font-family:monospace;font-size:11px;color:#9ca3af;line-height:1.7;white-space:pre-wrap;word-break:break-all">${debugBlock}</pre>
  </div>

  <!-- CTA -->
  <div style="padding:20px 28px;display:flex;align-items:center;gap:16px">
    <a href="https://www.downrangeco.com/admin" style="background:#C8922A;color:#000;padding:10px 20px;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.06em;display:inline-block">
      VIEW MISSION CONTROL →
    </a>
    <span style="font-size:10px;color:#374151">System → Cron Jobs tab</span>
  </div>

  <div style="padding:12px 28px;font-size:10px;color:#1f2937;border-top:1px solid #111">
    DownRange Cron Monitor · Alert suppressed for 2h after first failure
  </div>

</div>
</body>
</html>`,
    })
  } catch {} // never throw
}

export async function reportCronRun(jobId, { status = 'success', ms = 0, error = null, details = null } = {}) {
  try {
    const redis = getRedis()
    const runs  = await readRuns(redis)

    // Append run
    if (!runs[jobId]) runs[jobId] = []
    runs[jobId].unshift({
      at:      new Date().toISOString(),
      status,
      ms:      ms || 0,
      error:   error || null,
      details: details || null,
    })
    runs[jobId] = runs[jobId].slice(0, 50)  // keep last 50

    await writeRuns(redis, runs)

    // Email on failure — rate-limited per job (2h suppress)
    if (status === 'failed' && error) {
      let shouldAlert = true
      if (redis) {
        try {
          const lastAlert = await redis.get(ALERT_KEY + ':' + jobId)
          if (lastAlert) shouldAlert = false
          else await redis.setex(ALERT_KEY + ':' + jobId, ALERT_TTL, '1')
        } catch {}
      }
      if (shouldAlert) {
        const alertEmail = await getAlertEmail(jobId)
        if (alertEmail) {
          const recentHistory = (runs[jobId] || []).slice(0, 6)  // include current + last 5
          sendFailureEmail(jobId, error, ms, details, recentHistory, alertEmail).catch(() => {})
        }
      }
    }

    // If job recovers after failure, reset the alert suppress so next failure emails again
    if (status === 'success' && redis) {
      try { await redis.del(ALERT_KEY + ':' + jobId) } catch {}
    }

  } catch {
    // Silently ignore — never crash a cron job
  }
}
