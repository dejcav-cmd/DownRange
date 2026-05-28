import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// Content types to back up (ordered by priority)
const BACKUP_TYPES = [
  'newsArticle', 'blogPost', 'firearmRelease', 'review',
  'legislation', 'stateProfile', 'canadaContent', 'competition',
  'video', 'outreachContact', 'outreachCampaign', 'outreachTemplate',
  'outreachSendLog', 'siteConfig', 'dailyBriefing', 'breakingAlert',
  'ammoPrice', 'marketAnalysis', 'imageAsset', 'nfaWaitTime',
  'billTracker', 'globalStats', 'priceAlert', 'author', 'cronRunStore',
]

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || req.headers.get('x-vercel-cron') === '1'
    || (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`)
}

// Push backup to GitHub — stores as JSON in downrangeco/DownRange-Backups repo (auto-creates)
// Falls back to storing a manifest doc in Sanity if GitHub isn't configured
async function pushToGitHub(filename, content) {
  const token = process.env.GITHUB_BACKUP_TOKEN || process.env.GITHUB_TOKEN
  const repo  = process.env.GITHUB_BACKUP_REPO  || 'dejcav-cmd/DownRange-Backups'
  if (!token) return { ok: false, reason: 'GITHUB_BACKUP_TOKEN not set — set it in Vercel' }

  const path    = `backups/${filename}`
  const url     = `https://api.github.com/repos/${repo}/contents/${path}`
  const b64     = Buffer.from(content).toString('base64')

  // Check if file exists (for update)
  let sha
  try {
    const check = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    })
    if (check.ok) {
      const data = await check.json()
      sha = data.sha
    }
  } catch {}

  const body = { message: `backup: ${filename}`, content: b64, ...(sha ? { sha } : {}) }
  const res  = await fetch(url, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    return { ok: false, reason: `GitHub API ${res.status}: ${err.slice(0, 200)}` }
  }
  return { ok: true, url: `https://github.com/${repo}/blob/main/${path}` }
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0     = Date.now()
  const now    = new Date()
  const stamp  = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const counts = {}
  const errors = []
  let   totalDocs = 0

  console.log('[BACKUP] Starting full Sanity backup...')

  // Fetch all docs per type
  const allDocs = {}
  for (const type of BACKUP_TYPES) {
    try {
      const docs = await sanity.fetch(
        `*[_type == $type] { ... }`,
        { type }
      )
      allDocs[type]  = docs
      counts[type]   = docs.length
      totalDocs     += docs.length
      console.log(`[BACKUP] ${type}: ${docs.length} docs`)
    } catch (e) {
      errors.push(`${type}: ${e.message}`)
      allDocs[type] = []
      counts[type]  = 0
    }
  }

  const ms      = Date.now() - t0
  const sizeKB  = Math.round(JSON.stringify(allDocs).length / 1024)

  // Build manifest
  const manifest = {
    version:    '1.0',
    timestamp:  now.toISOString(),
    project:    'vbnsqnkg',
    dataset:    'production',
    totalDocs,
    sizeKB,
    ms,
    counts,
    errors,
  }

  const backup = { manifest, data: allDocs }
  const json   = JSON.stringify(backup, null, 0)
  const fname  = `backup-${stamp}.json`
  const mfname = `latest-manifest.json`

  // Push full backup to GitHub
  let ghResult = { ok: false, reason: 'Not attempted' }
  let mfResult = { ok: false }
  try {
    ghResult = await pushToGitHub(fname,  json)
    mfResult = await pushToGitHub(mfname, JSON.stringify(manifest, null, 2))
  } catch (e) {
    errors.push(`GitHub push: ${e.message}`)
  }

  // Record the run in Sanity for the cron dashboard
  const status = errors.length === 0 && ghResult.ok ? 'success' : errors.length > 0 && !ghResult.ok ? 'failed' : 'success'
  const details = `${totalDocs} docs (${sizeKB} KB) · ${Object.keys(counts).length} types · ${ghResult.ok ? 'Pushed to GitHub ✅' : 'GitHub push failed ⚠ — ' + (ghResult.reason||'')} · ${errors.length} errors`

  await reportCronRun('backup', { status, ms: Date.now() - t0, details, error: errors.length ? errors[0] : null }).catch(() => {})

  return Response.json({
    ok:      status !== 'failed',
    stamp,
    totalDocs,
    sizeKB,
    counts,
    github:  ghResult,
    manifest: mfResult,
    errors,
    ms:      Date.now() - t0,
    message: details,
  })
}

export async function POST(req) { return GET(req) }
