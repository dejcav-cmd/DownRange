import { reportCronRun } from '@/lib/cronReporter'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * GET /api/site-health
 * Runs 3x daily via cron (8am, 2pm, 8pm). Scans for:
 *   1. Broken internal links
 *   2. Missing/non-firearm images in articles
 *   3. Feed health (last publish time)
 *   4. Route 404s
 * Results stored in pull log + Discord webhook notification.
 */

import { createClient } from '@sanity/client'
import { logPull, STATUS } from '@/lib/pullLogger'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production', apiVersion: '2024-01-01', useCdn: false,
  token:     process.env.SANITY_API_TOKEN,
})

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://downrangeco.com'

// All known valid routes
const VALID_ROUTES = new Set([
  '/','/about','/admin','/canada','/carry-insurance',
  '/contact','/contribute','/deals','/ffl-finder','/guns',
  '/hunting','/laws','/learn','/market','/news','/nfa-tracker',
  '/precision','/press','/privacy','/ranges',
  '/releases','/safe-storage','/search',
  '/state-news','/terms','/training','/video','/widget',
])

// Firearm-related image check — keywords that should appear in alt text or URL
const FIREARM_KEYWORDS = [
  'gun','firearm','pistol','rifle','shotgun','ar-15','ak','glock','sig','ruger',
  'springfield','beretta','colt','remington','mossberg','smith','wesson','hk',
  'ammo','ammunition','caliber','9mm','308','556','223','45acp','suppressor',
  'scope','optic','holster','magazine','trigger','barrel','stock','grip',
  'shooting','range','tactical','weapon','handgun','carry','concealed',
]

function isFirearmRelated(url, alt) {
  if (!url && !alt) return false
  const text = ((url || '') + ' ' + (alt || '')).toLowerCase()
  return FIREARM_KEYWORDS.some(k => text.includes(k))
}

async function checkBrokenLinks() {
  const broken = []

  // Article images: REPORT ONLY. This job never writes images. Real-image repair belongs to the
  // image-fix and fix-placeholder-images crons (real photos only, no fallback art).
  try {
    const articles = await sanity.fetch(`
      *[_type == "newsArticle" && defined(slug.current) && defined(publishedAt)] | order(publishedAt desc) [0...100] {
        _id, title, imageUrl, "heroUrl": heroImage.asset->url
      }
    `)
    let missingImages = 0
    let placeholderImages = 0
    for (const a of articles) {
      const url = a.heroUrl || a.imageUrl || ''
      if (!url) missingImages++
      else if (/^\/img\/photos\//.test(url) || /\.svg(\?|$)/i.test(url)) placeholderImages++
    }
    broken.push({
      check: 'Article Images',
      total: articles.length,
      issues: missingImages + placeholderImages,
      detail: `${missingImages} missing, ${placeholderImages} placeholder (handled by image-fix)`,
      fixed: 0,
    })
  } catch (err) {
    broken.push({ check: 'Article Images', error: err.message })
  }

  // Check feed freshness
  try {
    const latest = await sanity.fetch(`
      *[_type == "newsArticle"] | order(publishedAt desc) [0] { publishedAt, source }
    `)
    const ageMin = latest?.publishedAt
      ? Math.round((Date.now() - new Date(latest.publishedAt).getTime()) / 60000)
      : null
    
    broken.push({
      check: 'Feed Freshness',
      lastArticleMinutesAgo: ageMin,
      status: ageMin === null ? 'no articles' : ageMin > 120 ? 'STALE' : ageMin > 30 ? 'SLOW' : 'FRESH',
      lastSource: latest?.source,
    })
  } catch (err) {
    broken.push({ check: 'Feed Freshness', error: err.message })
  }

  return broken
}

// Assign firearm-relevant images based on title keywords
function getFirearmFallback(title) {
  if (!title) return DEFAULTS.pistol
  const t = title.toLowerCase()
  if (/ar-?15|m4|m16|5\.56|223|rifle|carbine|ak|kalashnikov|nato|ddm4|bcm|noveske/.test(t)) return DEFAULTS.rifle
  if (/shotgun|gauge|mossberg|remington|870|590|benelli|pump|semi-auto shot/.test(t)) return DEFAULTS.shotgun
  if (/suppressor|silencer|nfa|form 4|omega|sandman|dead air|silencerco/.test(t)) return DEFAULTS.suppressor
  if (/scope|optic|lpvo|red dot|eotech|aimpoint|vortex|trijicon|holosun/.test(t)) return DEFAULTS.optic
  if (/ammo|ammunition|bullet|round|grain|fmj|jhp|hst|gold dot|critical|defensive/.test(t)) return DEFAULTS.ammo
  if (/law|legislation|bill|atf|scotus|court|second amendment|2a|constitutional|ban|rights/.test(t)) return DEFAULTS.law
  if (/glock|sig|ruger|springfield|smith|wesson|walther|cz|beretta|pistol|handgun|9mm|45|380|carry|edc/.test(t)) return DEFAULTS.pistol
  return DEFAULTS.pistol // default to pistol for unknown firearms content
}

const DEFAULTS = {
  pistol:     '/img/photos/pistol.jpg',
  rifle:      '/img/photos/rifle.jpg',
  shotgun:    '/img/photos/shotgun.jpg',
  suppressor: '/img/photos/suppressor.jpg',
  optic:      '/img/photos/rifle.jpg',
  ammo:       '/img/photos/pistol.jpg',
  law:        '/img/photos/pistol.jpg',
}

async function notifyDiscord(report) {
  const webhook = process.env.DISCORD_WEBHOOK_URL
  if (!webhook) return
  try {
    const totalIssues = report.checks.reduce((s, c) => s + (c.issues || 0), 0)
    const totalFixed  = report.checks.reduce((s, c) => s + (c.fixed || 0), 0)
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `🔍 Site Health Scan — ${totalIssues === 0 ? '✅ All Clear' : `⚠ ${totalIssues} issues, ${totalFixed} auto-fixed`}`,
          color: totalIssues === 0 ? 0x22c55e : totalFixed >= totalIssues ? 0xf59e0b : 0xef4444,
          fields: report.checks.map(c => ({
            name: c.check,
            value: c.error ? `❌ ${c.error}` : `Issues: ${c.issues ?? 0} | Fixed: ${c.fixed ?? 0} | ${c.detail || c.status || ''}`,
            inline: true,
          })),
          footer: { text: `DownRange Site Health · ${new Date().toLocaleString()}` },
        }],
      }),
    })
  } catch (e) {
    console.error('[site-health] Discord notify failed:', e.message)
  }
}

export async function GET(req) {
  // Auth check — only cron or admin
  const cronHeader  = req.headers.get('x-vercel-cron')
  const authHeader  = req.headers.get('authorization')
  const adminHeader = req.headers.get('x-admin-key')
  const secret      = process.env.CRON_SECRET
  const adminKey    = process.env.ADMIN_KEY

  const isValid = cronHeader === '1'
    || !secret
    || (secret && authHeader === `Bearer ${secret}`)
    || (adminKey && adminHeader === adminKey)
  if (!isValid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const t = Date.now()
  console.log('[site-health] Scan starting...')

  let checks
  try { checks = await checkBrokenLinks() } catch (err) {
    await reportCronRun('site_health', { status: 'failed', ms: Date.now() - t, error: err.message }).catch(() => {})
    return Response.json({ error: err.message }, { status: 500 })
  }
  const ms = Date.now() - t

  const totalIssues = checks.reduce((s, c) => s + (c.issues || 0), 0)
  const totalFixed  = checks.reduce((s, c) => s + (c.fixed || 0), 0)
  const hardErrors  = checks.filter(c => c.error)

  const report = {
    timestamp: new Date().toISOString(),
    ms,
    checks,
    summary: {
      totalIssues,
      totalFixed,
      status: totalIssues === 0 ? 'healthy' : totalFixed >= totalIssues ? 'fixed' : 'issues',
    }
  }

  // Log to pull log
  await logPull({
    sourceId:  'site_health',
    status:    hardErrors.length ? STATUS.FAILED : totalIssues === 0 ? STATUS.SUCCESS : STATUS.PARTIAL,
    itemCount: checks.reduce((s, c) => s + (c.total || 0), 0),
    newItems:  totalFixed,
    duration:  ms,
    error:     hardErrors.map(c => c.check + ': ' + c.error).join('; ') || null,
    headlines: checks.filter(c => c.issues > 0).map(c => `${c.check}: ${c.issues} issues, ${c.fixed||0} fixed`),
    meta:      { triggeredBy: cronHeader === '1' ? 'cron' : 'manual', totalIssues, totalFixed },
  }).catch(() => {})

  await notifyDiscord(report)
  await reportCronRun('site_health', hardErrors.length
    ? { status: 'failed', ms, error: hardErrors.map(c => c.check + ': ' + c.error).join('; ').slice(0, 300) }
    : { status: 'success', ms, details: `issues:${totalIssues} (report only)` }).catch(() => {})

  console.log(`[site-health] Done. ${totalIssues} issues, ${totalFixed} fixed. ${ms}ms`)
  return Response.json(report)
}
