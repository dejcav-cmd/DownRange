export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { createClient } from '@sanity/client'
import { revalidatePath } from 'next/cache'

// Admin "Cleanup": delete news articles or deals older than N days.
//   GET  ?type=news|deals&days=N  -> preview (count, date range, sample titles)
//   POST { type, days, confirmCount } -> backup to GitHub, then delete
// confirmCount must equal the current match count, so a purge can never remove
// more than the admin previewed. Editor-locked items are never deleted.
// News is backed up to GitHub before deleting; deals are not (DJ, Sep 2026).
//   GET  ?settings=1            -> monthly cleanup settings + last run
//   PUT  { monthlyEnabled, dealsDays, newsDays } -> save settings (cron: /api/cron/monthly-cleanup)

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

const TYPES = {
  news:  { _type: 'newsArticle', label: 'News articles' },
  deals: { _type: 'gunDeal',     label: 'Deals' },
}
const MIN_DAYS = 7

function authed(req) {
  const k = req.headers.get('x-admin-key')
  return !!k && k === (process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY)
}

async function protectedNewsSlugs() {
  const posts = await sanity.fetch(
    `*[_type=="blogPost" && (status=="published" || published==true)]{ sourceRefs, "h": body }`
  ).catch(() => [])
  const set = new Set()
  for (const p of posts || []) {
    for (const r of p.sourceRefs || []) if (String(r).startsWith('news:')) set.add(String(r).slice(5))
    if (typeof p.h === 'string') for (const m of p.h.matchAll(/\/news\/([a-z0-9][a-z0-9-]+)/g)) set.add(m[1])
  }
  return [...set]
}

function parse(type, days) {
  const t = TYPES[type]
  const d = parseInt(days, 10)
  if (!t) return { error: 'type must be news or deals' }
  if (!Number.isFinite(d) || d < MIN_DAYS) return { error: `days must be at least ${MIN_DAYS}` }
  const cutoff = new Date(Date.now() - d * 86400000).toISOString()
  // News linked from published blog posts is kept (no broken links in blog posts)
  const filter = `_type == "${t._type}" && !(_id in path("drafts.**")) && defined(publishedAt) && publishedAt < $cutoff && editorLocked != true`
    + (type === 'news' ? ' && !(slug.current in $keep)' : '')
  return { t, d, cutoff, filter }
}

const SETTINGS_ID = 'cleanupSettings'

export async function GET(req) {
  if (!authed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const sp = new URL(req.url).searchParams
  if (sp.get('settings')) {
    const cfg = await sanity.fetch('*[_id==$id][0]', { id: SETTINGS_ID }).catch(() => null)
    return Response.json({ ok: true, monthlyEnabled: cfg?.monthlyEnabled !== false, dealsDays: cfg?.dealsDays || 60, newsDays: cfg?.newsDays || 180, lastRun: cfg?.monthlyLastRun || null })
  }
  const p = parse(sp.get('type'), sp.get('days'))
  if (p.error) return Response.json({ error: p.error }, { status: 400 })
  const r = await sanity.fetch(`{
    "count":  count(*[${p.filter}]),
    "total":  count(*[_type == $tt && !(_id in path("drafts.**"))]),
    "oldest": *[${p.filter}] | order(publishedAt asc)[0].publishedAt,
    "newest": *[${p.filter}] | order(publishedAt desc)[0].publishedAt,
    "sample": *[${p.filter}] | order(publishedAt desc)[0...5]{ title, publishedAt }
  }`, { cutoff: p.cutoff, tt: p.t._type, keep: sp.get('type') === 'news' ? await protectedNewsSlugs() : [] })
  return Response.json({ ok: true, type: p.t.label, days: p.d, cutoff: p.cutoff, ...r, remaining: r.total - r.count })
}

async function backupToGitHub(docs, type, days) {
  const token = process.env.GITHUB_BACKUP_TOKEN || process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_BACKUP_REPO || 'dejcav-cmd/DownRange-Backups'
  if (!token) throw new Error('No GitHub token configured for backups')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const path = `cleanup/${type}-older-than-${days}d-${stamp}.json`
  const content = Buffer.from(JSON.stringify({ exportedAt: new Date().toISOString(), type, days, count: docs.length, documents: docs })).toString('base64')
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `backup before cleanup: ${docs.length} ${type} older than ${days} days`, content }),
  })
  if (!res.ok) throw new Error(`Backup failed (GitHub ${res.status}) — nothing was deleted`)
  return `${repo}/${path}`
}

export async function POST(req) {
  if (!authed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { type, days, confirmCount } = await req.json().catch(() => ({}))
  const p = parse(type, days)
  if (p.error) return Response.json({ error: p.error }, { status: 400 })

  const keep = type === 'news' ? await protectedNewsSlugs() : []
  const docs = await sanity.fetch(type === 'news' ? `*[${p.filter}]` : `*[${p.filter}]{_id}`, { cutoff: p.cutoff, keep })
  if (!docs.length) return Response.json({ ok: true, deleted: 0 })
  if (Number(confirmCount) !== docs.length) {
    return Response.json({ error: `Count changed since preview (${confirmCount} → ${docs.length}). Preview again.` }, { status: 409 })
  }

  let backup = null
  if (type === 'news') {
    backup = await backupToGitHub(docs, type, p.d).catch(e => ({ error: e.message }))
    if (backup?.error) return Response.json({ error: backup.error }, { status: 502 })
  }

  let deleted = 0
  const ids = docs.map(d => d._id)
  for (let i = 0; i < ids.length; i += 100) {
    const tx = sanity.transaction()
    ids.slice(i, i + 100).forEach(id => tx.delete(id))
    await tx.commit({ visibility: 'async' })
    deleted += Math.min(100, ids.length - i)
  }
  // SEO: deleted news URLs 404 right away; sitemaps drop them
  if (type === 'news') for (const d of docs) if (d.slug?.current) { try { revalidatePath(`/news/${d.slug.current}`) } catch {} }
  ;['/news', '/deals', '/sitemap.xml', '/news-sitemap.xml', '/'].forEach(x => { try { revalidatePath(x) } catch {} })
  return Response.json({ ok: true, deleted, backup, type: p.t.label, days: p.d })
}

export async function PUT(req) {
  if (!authed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { monthlyEnabled, dealsDays, newsDays } = await req.json().catch(() => ({}))
  const dd = parseInt(dealsDays, 10), nd = parseInt(newsDays, 10)
  if (![dd, nd].every(x => Number.isFinite(x) && x >= MIN_DAYS)) return Response.json({ error: `days must be at least ${MIN_DAYS}` }, { status: 400 })
  await sanity.createIfNotExists({ _id: SETTINGS_ID, _type: 'cleanupSettings' })
  await sanity.patch(SETTINGS_ID).set({ monthlyEnabled: monthlyEnabled !== false, dealsDays: dd, newsDays: nd, updatedAt: new Date().toISOString() })
    .unset(['dealsAutoEnabled', 'dealsAutoDays', 'lastRun']).commit()
  return Response.json({ ok: true, monthlyEnabled: monthlyEnabled !== false, dealsDays: dd, newsDays: nd })
}
