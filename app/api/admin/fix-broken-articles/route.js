export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'
import { revalidatePath } from 'next/cache'

// Finds articles whose public page 404s because they have no URL slug, then:
//   - too thin to publish (under 250 words) and older than 7 days  -> deleted (JSON backup first)
//   - otherwise                                                      -> given a proper slug (and a publish date)
// GET previews the plan. POST { confirm: true } applies it. Editor-locked items are never touched.

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

const authed = req => !!process.env.ADMIN_KEY && req.headers.get('x-admin-key') === process.env.ADMIN_KEY
const MIN_WORDS = 250
const OLD_DAYS = 7

const wordCount = html => String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length

function slugify(title, id) {
  const base = String(title || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  const suffix = String(id || '').replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase() || 'fixed'
  return base ? `${base}-${suffix}` : `article-${suffix}`
}

async function plan() {
  const docs = await sanity.fetch(
    `*[_type in ["newsArticle","blogPost"] && !(_id in path("drafts.**")) && !defined(slug.current)]
      | order(_createdAt desc) [0...500] {
      _id, _type, title, sourceTitle, body, approved, status, publishedAt, _createdAt, editorLocked
    }`
  )
  const now = Date.now()
  return docs.map(d => {
    const words = wordCount(d.body)
    const ageDays = Math.floor((now - new Date(d._createdAt).getTime()) / 86400000)
    const title = d.title || d.sourceTitle || ''
    let action = 'repair'
    let why = 'no URL slug, so the page 404s'
    if (d.editorLocked) { action = 'skip'; why = 'editor-locked' }
    else if (!title) { action = ageDays > OLD_DAYS ? 'delete' : 'skip'; why = 'no title' }
    else if (words < MIN_WORDS && ageDays > OLD_DAYS) { action = 'delete'; why = `no slug, thin body (${words} words), ${ageDays} days old` }
    return { _id: d._id, type: d._type, title: title.slice(0, 110), words, ageDays, approved: d.approved === true, action, why }
  })
}

export async function GET(req) {
  if (!authed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const items = await plan()
    const count = a => items.filter(i => i.action === a).length
    return Response.json({ ok: true, total: items.length, repair: count('repair'), delete: count('delete'), skip: count('skip'), items: items.slice(0, 200) })
  } catch (e) { return Response.json({ ok: false, error: e.message }, { status: 500 }) }
}

async function backup(docs) {
  const token = process.env.GITHUB_BACKUP_TOKEN || process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_BACKUP_REPO || 'dejcav-cmd/DownRange-Backups'
  if (!token) throw new Error('No GitHub token configured for backups, so nothing was deleted')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const path = `cleanup/broken-404-articles-${stamp}.json`
  const content = Buffer.from(JSON.stringify({ exportedAt: new Date().toISOString(), count: docs.length, documents: docs })).toString('base64')
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: `backup before deleting ${docs.length} broken (404) articles`, content }),
  })
  if (!res.ok) throw new Error(`Backup failed (GitHub ${res.status}), so nothing was deleted`)
  return `${repo}/${path}`
}

export async function POST(req) {
  if (!authed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (body.confirm !== true) return Response.json({ error: 'confirm:true required' }, { status: 400 })
  try {
    const items = await plan()
    const toDelete = items.filter(i => i.action === 'delete')
    const toRepair = items.filter(i => i.action === 'repair')

    let backupPath = null
    if (toDelete.length) {
      const full = await sanity.fetch('*[_id in $ids]', { ids: toDelete.map(i => i._id) })
      backupPath = await backup(full)
      for (let i = 0; i < toDelete.length; i += 100) {
        const tx = sanity.transaction()
        toDelete.slice(i, i + 100).forEach(d => tx.delete(d._id))
        await tx.commit({ visibility: 'async' })
      }
    }

    let repaired = 0
    const fixes = await sanity.fetch('*[_id in $ids]{ _id, _type, _createdAt, approved, status, publishedAt, title, sourceTitle }', { ids: toRepair.map(i => i._id) })
    for (const d of fixes) {
      const slug = slugify(d.title || d.sourceTitle, d._id)
      const set = { slug: { _type: 'slug', current: slug } }
      if (!d.publishedAt) set.publishedAt = d._createdAt
      try { await sanity.patch(d._id).set(set).commit(); repaired++ } catch {}
    }
    ;['/news', '/blog', '/sitemap.xml', '/news-sitemap.xml'].forEach(x => { try { revalidatePath(x) } catch {} })
    return Response.json({ ok: true, deleted: toDelete.length, repaired, backup: backupPath })
  } catch (e) { return Response.json({ ok: false, error: e.message }, { status: 500 }) }
}
