/**
 * lib/cronReporter.js
 * Records every cron run to Redis and emails DJ on failures.
 * Never throws — cron jobs must not fail due to reporting.
 */

const REDIS_KEY   = 'dr:cron-runs-v2'
const ALERT_KEY   = 'dr:cron-fail-alerts'   // tracks last alert per jobId
const TTL         = 60 * 60 * 24 * 7        // 7 days
const ALERT_TTL   = 60 * 60 * 2             // suppress repeat alerts for 2h
const ALERT_EMAIL = 'dejcav@gmail.com'

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

async function sendFailureEmail(jobId, error, ms) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'DownRange Cron Monitor <dj@downrangeco.com>',
      to:   [ALERT_EMAIL],
      subject: '[DownRange] Cron FAILED: ' + jobId,
      html: [
        '<div style="font-family:monospace;background:#09090B;color:#F0EDE6;padding:32px;max-width:600px">',
        '<div style="font-size:20px;font-weight:900;color:#ef4444;letter-spacing:3px;margin-bottom:16px">CRON JOB FAILED</div>',
        '<table style="width:100%;border-collapse:collapse;font-size:13px">',
        '<tr><td style="color:#64748b;padding:6px 0;width:100px">Job</td><td style="color:#f87171;font-weight:700">' + jobId + '</td></tr>',
        '<tr><td style="color:#64748b;padding:6px 0">Time</td><td>' + new Date().toUTCString() + '</td></tr>',
        '<tr><td style="color:#64748b;padding:6px 0">Duration</td><td>' + ms + 'ms</td></tr>',
        '<tr><td style="color:#64748b;padding:6px 0;vertical-align:top">Error</td><td style="color:#fca5a5">' + (error || 'Unknown error') + '</td></tr>',
        '</table>',
        '<div style="margin-top:20px;padding:12px 16px;background:#111;border-left:3px solid #C8922A;font-size:11px;color:#94a3b8">',
        'Check Mission Control: <a href="https://downrangeco.com/admin" style="color:#C8922A">downrangeco.com/admin</a> → Cron Jobs tab',
        '</div></div>',
      ].join(''),
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
        sendFailureEmail(jobId, error, ms).catch(() => {})
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
