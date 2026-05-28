/**
 * lib/cronReporter.js
 * Writes one Sanity document per cron run — never a blob, never lost on cold start.
 * Falls back to Redis for speed when available.
 */

import { createClient } from '@sanity/client'
import { Resend }       from 'resend'

const DEFAULT_EMAIL   = 'dejcav@gmail.com'
const RUN_TYPE        = 'cronRun'
const MAX_RUNS_KEPT   = 100   // per job in Sanity

let _sanity = null
let _redis  = null

function getSanity() {
  if (_sanity) return _sanity
  if (!process.env.SANITY_API_TOKEN) return null
  _sanity = createClient({
    projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
    dataset:    'production',
    apiVersion: '2024-01-01',
    useCdn:     false,
    token:      process.env.SANITY_API_TOKEN,
  })
  return _sanity
}

function getRedis() {
  if (_redis) return _redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  try {
    const { Redis } = require('@upstash/redis')
    _redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    return _redis
  } catch { return null }
}

// ── Write a single run to Sanity ─────────────────────────────────────────────
async function writeRunToSanity(jobId, run) {
  const sanity = getSanity()
  if (!sanity) return
  const _id = `cron-run-${jobId}-${Date.now()}`
  await sanity.create({
    _id,
    _type:   RUN_TYPE,
    jobId,
    status:  run.status,
    ms:      run.ms || 0,
    at:      run.at,
    trigger: run.trigger || 'cron',
    details: run.details || null,
    error:   run.error   || null,
  })
  // Prune old runs — keep only MAX_RUNS_KEPT per job
  try {
    const old = await sanity.fetch(
      `*[_type == "${RUN_TYPE}" && jobId == $jobId] | order(at asc) [0...999] { _id }`,
      { jobId }
    )
    if (old.length > MAX_RUNS_KEPT) {
      const toDelete = old.slice(0, old.length - MAX_RUNS_KEPT)
      for (const d of toDelete) await sanity.delete(d._id).catch(() => {})
    }
  } catch {}
}

// ── Also cache in Redis for fast dashboard reads ──────────────────────────────
async function writeRunToRedis(jobId, run) {
  const redis = getRedis()
  if (!redis) return
  try {
    const key  = `dr:cron:job:${jobId}`
    const raw  = await redis.get(key)
    const runs = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : []
    runs.unshift(run)
    const trimmed = runs.slice(0, 50)
    await redis.set(key, JSON.stringify(trimmed), { ex: 60 * 60 * 24 * 30 })
  } catch {}
}

// ── Read runs for one job ─────────────────────────────────────────────────────
export async function getRunsForJob(jobId, limit = 20) {
  // Try Redis first (fast)
  const redis = getRedis()
  if (redis) {
    try {
      const raw = await redis.get(`dr:cron:job:${jobId}`)
      if (raw) {
        const runs = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (runs?.length) return runs.slice(0, limit)
      }
    } catch {}
  }
  // Fall back to Sanity
  const sanity = getSanity()
  if (!sanity) return []
  try {
    return await sanity.fetch(
      `*[_type == "${RUN_TYPE}" && jobId == $jobId] | order(at desc) [0...${limit}] {
        _id, jobId, status, ms, at, trigger, details, error
      }`,
      { jobId }
    )
  } catch { return [] }
}

// ── Read runs for ALL jobs at once ────────────────────────────────────────────
export async function getAllRuns(limit = 20) {
  const sanity = getSanity()
  if (!sanity) return {}

  try {
    const all = await sanity.fetch(
      `*[_type == "${RUN_TYPE}"] | order(at desc) [0...2000] {
        _id, jobId, status, ms, at, trigger, details, error
      }`
    )
    const grouped = {}
    for (const run of all) {
      if (!grouped[run.jobId]) grouped[run.jobId] = []
      if (grouped[run.jobId].length < limit) grouped[run.jobId].push(run)
    }
    return grouped
  } catch { return {} }
}

// ── Alert config (stored in Sanity) ──────────────────────────────────────────
export async function getAlertConfig() {
  const sanity = getSanity()
  if (!sanity) return {}
  try {
    const doc = await sanity.fetch(`*[_type == "cronRunStore" && _id == "cron-alert-config"][0]{ data }`)
    if (doc?.data) return typeof doc.data === 'string' ? JSON.parse(doc.data) : doc.data
  } catch {}
  return {}
}

export async function setAlertConfig(config) {
  const sanity = getSanity()
  if (!sanity) return
  await sanity.createOrReplace({
    _id: 'cron-alert-config', _type: 'cronRunStore',
    data: JSON.stringify(config),
  })
}

// ── Failure email ─────────────────────────────────────────────────────────────
const JOB_CONTEXT = {
  news:              { what:'News feed pull',                   likelyCause:'NewsAPI key expired or all RSS feeds down.' },
  laws:              { what:'Laws + legislation feed',          likelyCause:'Congress.gov API key expired or LegiScan down.' },
  releases:          { what:'Gun releases feed',                likelyCause:'PRNewswire scrape blocked or manufacturer RSS down.' },
  market:            { what:'Market + ammo price feed',         likelyCause:'AmmoSeek API or GunBroker API issue.' },
  video:             { what:'YouTube video feed',               likelyCause:'YouTube API key quota exceeded.' },
  intelligence:      { what:'Daily intelligence briefing',      likelyCause:'Claude API timeout or Resend email failure.' },
  newsletter:        { what:'Daily newsletter email',           likelyCause:'Resend API key invalid or domain not verified.' },
  'quality-rewrite': { what:'Content quality scanner + AI rewrite', likelyCause:'Check ANTHROPIC_API_KEY. Claude API timeout or rate limit.' },
  'image-fix':       { what:'Article image fixer',             likelyCause:'Sanity write token expired or source URLs timing out.' },
  site_health:       { what:'Site health check',                likelyCause:'Something is very wrong with the deployment.' },
  'nfa-wait-times':  { what:'NFA wait time scraper',            likelyCause:'ATF.gov or SilencerShop blocked or changed HTML structure.' },
  backfill:          { what:'Article backfill (legacy)',         likelyCause:'Claude API issue.' },
  'fix-images':      { what:'Image patcher (legacy)',            likelyCause:'Sanity write error.' },
}

async function sendFailureEmail(jobId, error, ms, details, history) {
  if (!process.env.RESEND_API_KEY) return
  try {
    const resend  = new Resend(process.env.RESEND_API_KEY)
    const ctx     = JOB_CONTEXT[jobId] || { what: jobId, likelyCause: 'Check Vercel function logs.' }
    const histRows = history.slice(0, 6).map(r =>
      `<tr style="color:${r.status==='success'?'#22c55e':'#ef4444'}">
        <td style="padding:4px 8px;font-family:monospace">${r.status.toUpperCase()}</td>
        <td style="padding:4px 8px;font-family:monospace">${new Date(r.at).toLocaleString()}</td>
        <td style="padding:4px 8px;font-family:monospace">${r.ms}ms</td>
        <td style="padding:4px 8px;font-family:monospace">${(r.error||r.details||'').slice(0,80)}</td>
      </tr>`
    ).join('')

    await resend.emails.send({
      from:    'DownRange Alerts <alerts@downrangeco.com>',
      to:      DEFAULT_EMAIL,
      subject: `🚨 [DownRange] Cron FAILED: ${jobId}`,
      html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e5e7eb;padding:24px;border:1px solid #ef4444">
  <h2 style="color:#ef4444;font-family:'Courier New',monospace;margin:0 0 16px">🚨 CRON JOB FAILED</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <tr><td style="color:#6b7280;padding:4px 0;width:120px">Job</td><td style="font-family:monospace;color:#fff"><b>${jobId}</b></td></tr>
    <tr><td style="color:#6b7280;padding:4px 0">What it does</td><td style="font-family:monospace;color:#fff">${ctx.what}</td></tr>
    <tr><td style="color:#6b7280;padding:4px 0">Error</td><td style="font-family:monospace;color:#ef4444">${(error||'').slice(0,200)}</td></tr>
    <tr><td style="color:#6b7280;padding:4px 0">Duration</td><td style="font-family:monospace;color:#fff">${ms}ms</td></tr>
    <tr><td style="color:#6b7280;padding:4px 0">Details</td><td style="font-family:monospace;color:#9ca3af">${(details||'none').slice(0,300)}</td></tr>
    <tr><td style="color:#6b7280;padding:4px 0">Time</td><td style="font-family:monospace;color:#fff">${new Date().toUTCString()}</td></tr>
  </table>
  <div style="background:#1f2937;padding:12px;margin-bottom:16px;border-left:3px solid #f59e0b">
    <b style="color:#f59e0b">Likely cause:</b><br>
    <span style="font-family:monospace;color:#d1d5db">${ctx.likelyCause}</span>
  </div>
  <h3 style="color:#6b7280;font-family:monospace;font-size:12px">RECENT HISTORY</h3>
  <table style="width:100%;border-collapse:collapse;font-size:12px">${histRows}</table>
  <div style="margin-top:20px;text-align:center">
    <a href="https://downrangeco.com/admin?panel=crons" style="background:#C8922A;color:#000;padding:10px 24px;text-decoration:none;font-weight:bold;font-family:monospace">
      VIEW CRON DASHBOARD →
    </a>
  </div>
</div>`,
    })
  } catch (e) {
    console.error('[cronReporter] Email send failed:', e.message)
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function reportCronRun(jobId, { status = 'success', ms = 0, error = null, details = null, trigger = 'cron' } = {}) {
  const run = { at: new Date().toISOString(), status, ms: ms || 0, error, details, trigger }

  // Write to both stores — don't let either crash the cron job
  await Promise.allSettled([
    writeRunToSanity(jobId, run),
    writeRunToRedis(jobId, run),
  ])

  // Failure email — fire and forget
  if (status === 'failed' && error) {
    const history = await getRunsForJob(jobId, 6).catch(() => [])
    sendFailureEmail(jobId, error, ms, details, history).catch(() => {})
  }
}
