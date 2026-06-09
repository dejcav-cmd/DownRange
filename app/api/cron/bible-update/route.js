export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * GET /api/cron/bible-update
 * Runs every Sunday at 7am UTC.
 * 
 * Triggers a GitHub Actions workflow that:
 * 1. Collects live Sanity stats (article counts, schema counts, etc.)
 * 2. Commits a bible-stats.json to the repo so the next manual Bible doc rebuild
 *    picks up fresh numbers.
 * 
 * The actual docx is rebuilt by Claude when needed — this cron collects the
 * live data snapshot so the stats stay current.
 * 
 * Also posts a Sunday morning summary to Discord #agent-status.
 */

import { reportCronRun } from '@/lib/cronReporter'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-vercel-cron') === '1'
    || req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`)
}

async function getPortalStats() {
  const [
    newsCount, blogCount, lawsCount, releasesCount,
    videoCount, reviewCount, canadaCount, brazilCount,
    cronRunCount, outreachCount, socialPostCount, briefingCount,
    latestNews, latestBriefing
  ] = await Promise.allSettled([
    sanity.fetch('count(*[_type == "newsArticle" && defined(publishedAt)])'),
    sanity.fetch('count(*[_type == "blogPost"])'),
    sanity.fetch('count(*[_type == "legislation"])'),
    sanity.fetch('count(*[_type == "firearmRelease"])'),
    sanity.fetch('count(*[_type == "video"])'),
    sanity.fetch('count(*[_type == "review"])'),
    sanity.fetch('count(*[_type == "canadaContent"])'),
    sanity.fetch('count(*[_type == "brazilContent"])'),
    sanity.fetch('count(*[_type == "cronRun"])'),
    sanity.fetch('count(*[_type == "outreachContact"])'),
    sanity.fetch('count(*[_type == "socialPost"])'),
    sanity.fetch('count(*[_type == "dailyBriefing"])'),
    sanity.fetch('*[_type == "newsArticle"] | order(publishedAt desc)[0]{title, publishedAt}'),
    sanity.fetch('*[_type == "dailyBriefing"] | order(date desc)[0]{date, score, headline}'),
  ])

  const get = (r) => r.status === 'fulfilled' ? r.value : 0

  return {
    generatedAt:   new Date().toISOString(),
    content: {
      newsArticles:    get(newsCount),
      blogPosts:       get(blogCount),
      legislation:     get(lawsCount),
      firearmReleases: get(releasesCount),
      videos:          get(videoCount),
      reviews:         get(reviewCount),
      canadaArticles:  get(canadaCount),
      brazilArticles:  get(brazilCount),
    },
    operations: {
      cronRuns:       get(cronRunCount),
      outreachContacts: get(outreachCount),
      socialPosts:    get(socialPostCount),
      briefings:      get(briefingCount),
    },
    latest: {
      newsTitle:       get(latestNews)?.title || 'n/a',
      newsDate:        get(latestNews)?.publishedAt || 'n/a',
      briefingDate:    get(latestBriefing)?.date || 'n/a',
      briefingScore:   get(latestBriefing)?.score || 0,
      briefingHeadline:get(latestBriefing)?.headline || 'n/a',
    },
    totalContentDocs: get(newsCount) + get(blogCount) + get(lawsCount) +
                      get(releasesCount) + get(videoCount) + get(reviewCount) +
                      get(canadaCount) + get(brazilCount),
  }
}

async function pushStatsToGitHub(stats) {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_BACKUP_TOKEN || process.env.GH_PAT
  if (!token) return { ok: false, reason: 'GITHUB_TOKEN not set' }

  const repo    = 'dejcav-cmd/DownRange'
  const path    = 'scripts/bible-stats.json'
  const url     = `https://api.github.com/repos/${repo}/contents/${path}`
  const content = Buffer.from(JSON.stringify(stats, null, 2)).toString('base64')

  // Get current SHA if exists
  let sha
  try {
    const check = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      signal:  AbortSignal.timeout(10000),
    })
    if (check.ok) sha = (await check.json()).sha
  } catch {}

  const body = { message: `chore: bible stats update ${new Date().toISOString().slice(0,10)}`, content }
  if (sha) body.sha = sha

  const res = await fetch(url, {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const err = await res.text()
    return { ok: false, reason: `GitHub API ${res.status}: ${err.slice(0,200)}` }
  }
  return { ok: true }
}

async function postDiscordSummary(stats) {
  const webhook = process.env.DISCORD_WEBHOOK_URL
  if (!webhook) return

  const total = stats.totalContentDocs.toLocaleString()
  const msg = [
    `📖 **DOWNRANGE BIBLE UPDATE — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📰 News articles:     ${stats.content.newsArticles.toLocaleString()}`,
    `⚖️  Legislation:       ${stats.content.legislation.toLocaleString()}`,
    `🔫 Firearm releases:  ${stats.content.firearmReleases.toLocaleString()}`,
    `🎥 Videos:            ${stats.content.videos.toLocaleString()}`,
    `🇨🇦 Canada articles:  ${stats.content.canadaArticles.toLocaleString()}`,
    `🇧🇷 Brazil articles:  ${stats.content.brazilArticles.toLocaleString()}`,
    `📊 Total content docs: **${total}**`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🧠 Last briefing: ${stats.latest.briefingDate} — Score: ${stats.latest.briefingScore}/100`,
    `📝 Latest article: "${stats.latest.newsTitle.slice(0,80)}"`,
    `📬 Outreach contacts: ${stats.operations.outreachContacts}`,
    `📲 Social posts published: ${stats.operations.socialPosts}`,
    `✅ bible-stats.json pushed to GitHub`,
  ].join('\n')

  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: msg, username: 'Luke / DownRange Ops' }),
    signal: AbortSignal.timeout(10000),
  }).catch(() => {})
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const errors = []

  // Collect live stats from Sanity
  let stats
  try {
    stats = await getPortalStats()
  } catch (e) {
    errors.push(`Sanity stats: ${e.message}`)
    stats = { generatedAt: new Date().toISOString(), error: e.message }
  }

  // Push stats JSON to GitHub repo
  let ghResult = { ok: false }
  try {
    ghResult = await pushStatsToGitHub(stats)
  } catch (e) {
    errors.push(`GitHub push: ${e.message}`)
  }

  // Post Discord Sunday summary
  try {
    if (stats && !stats.error) await postDiscordSummary(stats)
  } catch (e) {
    errors.push(`Discord: ${e.message}`)
  }

  const ms     = Date.now() - t0
  const status = errors.length === 0 ? 'success' : 'warning'
  const details = `totalDocs:${stats?.totalContentDocs||0} github:${ghResult.ok?'ok':ghResult.reason||'fail'} errors:${errors.length}`

  await reportCronRun('bible-update', { status, ms, details, error: errors[0] || null }).catch(() => {})

  return Response.json({
    ok:     errors.length === 0,
    stats,
    github: ghResult,
    errors,
    ms,
  })
}

export async function POST(req) { return GET(req) }
