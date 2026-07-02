/**
 * /api/cron/sitemap-health — Weekly sitemap & indexing audit
 *
 * Runs every Monday at 8am UTC.
 * - Fetches live sitemap.xml
 * - HEAD-checks all static/state URLs (skips article slugs — too many)
 * - Detects: 404s, redirect chains, non-www leakage, slow responses
 * - Uses ai.nano (GLM-4.5 Air, ~$0.14/M) for issue analysis
 * - Auto-revalidates sitemap on any finding
 * - Reports to Mission Control via reportCronRun
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { NextResponse }   from 'next/server'
import { revalidatePath } from 'next/cache'
import { reportCronRun }  from '@/lib/cronReporter'
import { ai }             from '@/lib/aiRouter'

const SITEMAP_URL = 'https://www.downrangeco.com/sitemap.xml'
const BASE        = 'https://www.downrangeco.com'
const CONCURRENCY = 10
const TIMEOUT_MS  = 12000

// ── Auth ──────────────────────────────────────────────────────────────────────
function authorized(req) {
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  const isAuth   = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = req.headers.get('x-admin-key') === (process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY)
  return isVercel || isAuth || isAdmin
}

// ── Sitemap parser ────────────────────────────────────────────────────────────
async function parseSitemap(url) {
  const res = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
    headers: { 'User-Agent': 'DownRange-SitemapBot/1.0' },
  })
  if (!res.ok) throw new Error(`Sitemap ${res.status} at ${url}`)
  const xml = await res.text()

  // Detect www leakage (non-www URLs that shouldn't be in the sitemap)
  const nonWww = [...xml.matchAll(/<loc>(https:\/\/downrangeco\.com[^<]*)<\/loc>/g)].map(m => m[1])
  const allLocs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim())

  return { allLocs, nonWww, totalCount: allLocs.length }
}

// ── URL health check ──────────────────────────────────────────────────────────
async function checkUrl(url) {
  const t = Date.now()
  try {
    const res = await fetch(url, {
      method:  'HEAD',
      redirect: 'manual',
      signal:  AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'DownRange-SitemapBot/1.0' },
    })
    const ms  = Date.now() - t
    const loc = res.headers.get('location')
    return {
      url, status: res.status, ms, error: null,
      ok:       res.status >= 200 && res.status < 300,
      redirect: res.status >= 300 && res.status < 400 ? (loc || '(no location header)') : null,
      slow:     ms > 3000,
    }
  } catch (e) {
    return { url, status: 0, ms: Date.now() - t, error: e.message, ok: false, redirect: null, slow: false }
  }
}

async function checkBatch(urls) {
  const results = []
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const slice = urls.slice(i, i + CONCURRENCY)
    results.push(...await Promise.all(slice.map(checkUrl)))
    if (i + CONCURRENCY < urls.length) await new Promise(r => setTimeout(r, 150))
  }
  return results
}

// ── Filter: only check static & state URLs, not thousands of article slugs ───
function isStaticOrState(url) {
  const path  = url.replace(BASE, '').split('?')[0]
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return true                              // /
  if (parts.length === 1) return true                              // /news /laws etc.
  if (parts[0] === 'laws'  && parts.length === 2) return true     // /laws/AL /laws/federal
  if (parts[0] === 'learn' && parts.length === 2) return true     // /learn/[slug]
  return false
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0     = Date.now()
  const issues = []
  const fixes  = []

  try {
    // 1. Fetch & parse live sitemap
    const { allLocs, nonWww, totalCount } = await parseSitemap(SITEMAP_URL)

    // 2. Flag non-www leakage immediately
    if (nonWww.length > 0) {
      issues.push({
        type:  'non-www-leakage',
        count: nonWww.length,
        desc:  'Sitemap contains non-www URLs. Site serves from www.downrangeco.com — canonicals will mismatch.',
        sample: nonWww.slice(0, 5),
      })
    }

    // 3. HEAD-check static + state URLs only
    const checkable = allLocs.filter(isStaticOrState)
    const results   = await checkBatch(checkable)

    const redirected = results.filter(r => r.redirect)
    const notFound   = results.filter(r => r.status === 404)
    const errored    = results.filter(r => !r.ok && !r.redirect && r.status !== 404)
    const slow       = results.filter(r => r.slow && r.ok)
    const okCount    = results.filter(r => r.ok).length

    if (redirected.length > 0) {
      issues.push({
        type:  'redirect-in-sitemap',
        count: redirected.length,
        desc:  'Sitemap lists URLs that redirect. Google treats these as "Page with redirect" — remove from sitemap.',
        urls:  redirected.map(r => ({ from: r.url, to: r.redirect })),
      })
    }
    if (notFound.length > 0) {
      issues.push({
        type:  '404',
        count: notFound.length,
        desc:  '404 responses. Google drops these from index. Remove from sitemap or restore the page.',
        urls:  notFound.map(r => r.url),
      })
    }
    if (errored.length > 0) {
      issues.push({
        type:  'error',
        count: errored.length,
        desc:  'Non-200 non-redirect responses.',
        urls:  errored.map(r => ({ url: r.url, status: r.status, error: r.error })),
      })
    }
    if (slow.length > 0) {
      issues.push({
        type:  'slow-response',
        count: slow.length,
        desc:  'Pages responding in >3s. Core Web Vitals risk.',
        urls:  slow.map(r => ({ url: r.url, ms: r.ms })),
      })
    }

    // 4. Auto-fix: revalidate sitemap whenever any issue is detected
    if (issues.length > 0) {
      revalidatePath('/sitemap.xml')
      revalidatePath('/news-sitemap.xml')
      fixes.push('Revalidated /sitemap.xml and /news-sitemap.xml')
    }

    // 5. AI nano analysis
    let aiAnalysis = null
    if (issues.length > 0) {
      try {
        aiAnalysis = await ai.nano(
          `You are an SEO auditor for downrangeco.com, a firearms intelligence portal.

Weekly sitemap health check — ${new Date().toISOString().slice(0, 10)}:
- Sitemap total URLs: ${totalCount}
- Static/state URLs checked: ${checkable.length}
- Passed: ${okCount}
- Issues: ${issues.length} categories

Issue details:
${JSON.stringify(issues, null, 2)}

Write a concise 4-6 sentence SEO brief covering:
1. Most critical issue and why it hurts Google indexing
2. Likely root cause
3. Recommended fix (specific file or config to change)
4. Estimated indexing impact if left unfixed

Be direct. No fluff. Technical audience.`
        )
      } catch (e) {
        aiAnalysis = `AI analysis unavailable: ${e.message}`
      }
    }

    const ms     = Date.now() - t0
    const status = issues.length === 0 ? 'success' : 'warning'

    const summary = issues.length === 0
      ? `All ${okCount} static URLs healthy. No issues found.`
      : `${issues.length} issue categories detected across ${checkable.length} checked URLs. ${fixes.length} auto-fix(es) applied.`

    await reportCronRun('sitemap-health', { status, ms, details: summary }).catch(() => {})

    return NextResponse.json({
      ok: true,
      timestamp:       new Date().toISOString(),
      sitemapTotal:    totalCount,
      checkedCount:    checkable.length,
      okCount,
      issueCount:      issues.length,
      issues,
      fixes,
      aiAnalysis,
      ms,
    })

  } catch (err) {
    await reportCronRun('sitemap-health', {
      status: 'failed', ms: Date.now() - t0, error: err.message,
    }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
