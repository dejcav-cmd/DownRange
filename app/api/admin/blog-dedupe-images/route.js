export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { fetchAndUploadImage } from '@/lib/imageUpload'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const hashOf = u => (String(u || '').match(/\/([0-9a-f]{40})-/) || [])[1] || null

/**
 * POST /api/admin/blog-dedupe-images   (x-admin-key)
 * body: { slugs?: string[], dryRun?: boolean }
 * Blog posts that share the same hero image (same file) keep it on the oldest post; the others get
 * a new, vision-checked stock photo that no other blog post uses. `slugs` forces those posts to be replaced.
 */
export async function POST(req) {
  const k = req.headers.get('x-admin-key')
  const adm = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
  if (!adm || k !== adm) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const force = new Set(body.slugs || [])
  const t0 = Date.now()
  const posts = await sanity.fetch(`*[_type=="blogPost" && status=="published" && defined(imageUrl)]|order(coalesce(publishedAt,_createdAt) asc){_id,title,category,tags,sourceRefs,"slug":slug.current,imageUrl}`)
  const used = new Set(posts.map(p => hashOf(p.imageUrl)).filter(Boolean))
  const seen = new Set(), todo = []
  for (const p of posts) {
    const h = hashOf(p.imageUrl)
    const real = (p.sourceRefs || []).some(r => String(r).startsWith('release:'))
    if (force.has(p.slug) || (h && seen.has(h) && !real)) todo.push(p)
    else if (h) seen.add(h)
  }
  const report = []
  for (const p of todo) {
    const tags = (p.tags || []).filter(t => t !== 'New Releases').slice(0, 2).join(' ')
    const queries = [
      `${p.title.replace(/\b(20\d\d|guide|best|vs|reality|check)\b/gi, '').split(/\s+/).slice(0, 4).join(' ')} firearm`,
      `${tags || p.category || 'handgun'} firearm`,
      'concealed carry handgun holster', 'rifle shooting range', 'firearm safety gear',
    ]
    let url = null
    for (const q of queries) {
      url = await fetchAndUploadImage(q, p.slug, p.title, { excludeHashes: used }).catch(() => null)
      if (url) break
    }
    const row = { slug: p.slug, before: p.imageUrl, after: url }
    if (url) {
      used.add(hashOf(url))
      if (!body.dryRun) await sanity.patch(p._id).set({ imageUrl: url }).commit()
      row.status = body.dryRun ? 'would-replace' : 'replaced'
    } else row.status = 'no-replacement'
    report.push(row)
  }
  const summary = `${todo.length} duplicate/forced, ${report.filter(r => r.status === 'replaced').length} replaced`
  if (!body.dryRun) await reportCronRun('blog-dedupe-images', { status: report.some(r => r.status === 'no-replacement') ? 'warning' : 'success', ms: Date.now() - t0, details: summary }).catch(() => {})
  return Response.json({ ok: true, summary, report })
}
