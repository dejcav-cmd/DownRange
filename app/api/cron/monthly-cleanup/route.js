export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { createClient } from '@sanity/client'
import { revalidatePath } from 'next/cache'
import { reportCronRun } from '@/lib/cronReporter'

// Monthly cleanup (1st of each month, 09:20 UTC):
//   - deals older than dealsDays (default 60): deleted, no backup (deals have no pages of
//     their own, so there is no SEO impact)
//   - news older than newsDays (default 180): full JSON backup to DownRange-Backups, then
//     deleted. News articles linked from published blog posts are KEPT so blog posts
//     never contain broken internal links. Editor-locked items are kept.
// After deleting: revalidate the deleted /news paths (fast 404), /news and sitemaps so
// Google stops seeing removed URLs. 240s budget per invocation; if work remains the job
// hands off to itself (max 5 continuations) instead of waiting a month.
// Settings: Sanity doc cleanupSettings (Admin > Content > Cleanup).

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})
const BUDGET = 240_000

async function backupNews(docs, days) {
  const token = process.env.GITHUB_BACKUP_TOKEN || process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_BACKUP_REPO || 'dejcav-cmd/DownRange-Backups'
  if (!token) throw new Error('No GitHub token for backups')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const path = `cleanup/monthly-news-older-than-${days}d-${stamp}.json`
  const content = Buffer.from(JSON.stringify({ exportedAt: new Date().toISOString(), days, count: docs.length, documents: docs })).toString('base64')
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `monthly cleanup backup: ${docs.length} news articles older than ${days} days`, content }),
  })
  if (!res.ok) throw new Error(`News backup failed (GitHub ${res.status}) — news not deleted`)
  return `${repo}/${path}`
}

async function deleteIds(ids, t0) {
  let n = 0
  for (let i = 0; i < ids.length; i += 100) {
    if (Date.now() - t0 > BUDGET) break
    const tx = sanity.transaction()
    ids.slice(i, i + 100).forEach(id => tx.delete(id))
    await tx.commit({ visibility: 'async' })
    n += Math.min(100, ids.length - i)
  }
  return n
}

// News slugs that published blog posts link to (sourceRefs + /news/ links in the body)
async function protectedNewsSlugs() {
  const posts = await sanity.fetch(
    `*[_type=="blogPost" && (status=="published" || published==true)]{ sourceRefs, "b": pt::text(body), "h": body }`
  ).catch(() => [])
  const set = new Set()
  for (const p of posts || []) {
    for (const r of p.sourceRefs || []) if (String(r).startsWith('news:')) set.add(String(r).slice(5))
    const text = typeof p.h === 'string' ? p.h : (p.b || '')
    for (const m of text.matchAll(/\/news\/([a-z0-9][a-z0-9-]+)/g)) set.add(m[1])
  }
  return [...set]
}

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const isCron = !!cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`
  const key = req.headers.get('x-admin-key')
  const isAdmin = !!key && key === (process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY)
  if (!isCron && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const url = new URL(req.url)
  const hop = parseInt(url.searchParams.get('continue') || '0', 10)
  try {
    const cfg = (await sanity.fetch('*[_id=="cleanupSettings"][0]')) || {}
    if (cfg.monthlyEnabled === false) {
      await reportCronRun('monthly-cleanup', { status: 'success', ms: Date.now() - t0, details: 'Monthly cleanup is off (Admin > Content > Cleanup)' })
      return Response.json({ ok: true, skipped: 'disabled' })
    }
    const dealsDays = Math.max(7, parseInt(cfg.dealsDays, 10) || 60)
    const newsDays  = Math.max(7, parseInt(cfg.newsDays, 10) || 180)
    const ago = d => new Date(Date.now() - d * 86400000).toISOString()

    // ── Deals ────────────────────────────────────────────────────────────────
    const dealIds = await sanity.fetch(
      `*[_type=="gunDeal" && !(_id in path("drafts.**")) && defined(publishedAt) && publishedAt < $c && editorLocked != true]._id`,
      { c: ago(dealsDays) })
    const dealsDeleted = await deleteIds(dealIds, t0)

    // ── News ─────────────────────────────────────────────────────────────────
    let newsDeleted = 0, newsCandidates = 0, newsKept = 0, backup = null
    if (Date.now() - t0 < BUDGET - 30_000) {
      const keep = await protectedNewsSlugs()
      const filter = `_type=="newsArticle" && !(_id in path("drafts.**")) && defined(publishedAt) && publishedAt < $c && editorLocked != true`
      newsKept = await sanity.fetch(`count(*[${filter} && slug.current in $keep])`, { c: ago(newsDays), keep })
      const docs = await sanity.fetch(`*[${filter} && !(slug.current in $keep)] | order(publishedAt asc)[0...1500]`, { c: ago(newsDays), keep })
      newsCandidates = docs.length
      if (docs.length) {
        backup = await backupNews(docs, newsDays)
        newsDeleted = await deleteIds(docs.map(d => d._id), t0)
        // SEO: make deleted URLs 404 immediately and drop them from sitemaps
        for (const d of docs.slice(0, newsDeleted)) if (d.slug?.current) revalidatePath(`/news/${d.slug.current}`)
      }
    }
    if (dealsDeleted || newsDeleted) {
      ;['/news', '/deals', '/sitemap.xml', '/news-sitemap.xml', '/'].forEach(p => { try { revalidatePath(p) } catch {} })
    }

    const leftDeals = dealIds.length - dealsDeleted
    const leftNews  = Math.max(0, newsCandidates - newsDeleted)
    let continued = false
    if ((leftDeals > 0 || leftNews > 0 || newsCandidates === 1500) && hop < 5 && cronSecret) {
      // Hand the remainder to a fresh invocation rather than waiting a month
      await fetch(`${url.origin}/api/cron/monthly-cleanup?continue=${hop + 1}`, {
        headers: { authorization: `Bearer ${cronSecret}` }, signal: AbortSignal.timeout(3000),
      }).catch(() => {})
      continued = true
    }

    const lastRun = { at: new Date().toISOString(), hop, dealsDays, newsDays, dealsDeleted, newsDeleted, newsKeptForBlogLinks: newsKept, backup, continued }
    await sanity.createIfNotExists({ _id: 'cleanupSettings', _type: 'cleanupSettings' })
    await sanity.patch('cleanupSettings').set({ monthlyLastRun: lastRun }).commit().catch(() => {})
    await reportCronRun('monthly-cleanup', {
      status: 'success', ms: Date.now() - t0,
      details: `Deals >${dealsDays}d: ${dealsDeleted} deleted · News >${newsDays}d: ${newsDeleted} deleted, ${newsKept} kept (linked from blog)${continued ? ' · continuing' : ''}`,
    })
    return Response.json({ ok: true, ...lastRun })
  } catch (e) {
    await reportCronRun('monthly-cleanup', { status: 'failed', ms: Date.now() - t0, error: e.message }).catch(() => {})
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
