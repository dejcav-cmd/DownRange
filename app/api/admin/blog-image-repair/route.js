export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { isOnTopicImage, downloadForCheck } from '@/lib/imageVerify'
import { fetchAndUploadImage } from '@/lib/imageUpload'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

/**
 * POST /api/admin/blog-image-repair   (x-admin-key)
 * body: { slug?: string, days?: number, dryRun?: boolean }
 * Checks each recent blog post hero with a vision model. A hero that is not
 * firearm-related is replaced with a real release image from the post's own
 * sources, else a stock photo that passes the same check.
 */
export async function POST(req) {
  const k = req.headers.get('x-admin-key')
  if (!k || k !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const days = Math.min(Number(body.days) || 60, 365)
  const dryRun = !!body.dryRun

  const posts = await sanity.fetch(
    body.slug
      ? `*[_type=="blogPost" && slug.current==$slug]{_id,title,"slug":slug.current,imageUrl,category,tags,sourceRefs}`
      : `*[_type=="blogPost" && status=="published" && _createdAt > $since]|order(_createdAt desc)[0...40]{_id,title,"slug":slug.current,imageUrl,category,tags,sourceRefs}`,
    { slug: body.slug, since: new Date(Date.now() - days * 86400000).toISOString() }
  )

  const report = []
  for (const p of posts) {
    const row = { slug: p.slug, before: p.imageUrl, status: 'ok' }
    const dl = p.imageUrl ? await downloadForCheck(p.imageUrl.startsWith('/') ? 'https://www.downrangeco.com' + p.imageUrl : p.imageUrl) : null
    const topic = p.title
    const good = dl ? await isOnTopicImage(dl.buf, dl.contentType, topic) : false
    if (good) { report.push(row); continue }

    row.status = 'off-topic'
    let replacement = null

    // 1. Real release/product images from the post's own sources
    const slugs = (p.sourceRefs || []).filter(r => String(r).startsWith('release:')).map(r => r.slice(8))
    if (slugs.length) {
      const imgs = await sanity.fetch(`*[_type=="firearmRelease" && slug.current in $s].heroImage.asset->url`, { s: slugs }).catch(() => [])
      for (const u of imgs || []) {
        if (!u) continue
        const d = await downloadForCheck(u)
        if (d && await isOnTopicImage(d.buf, d.contentType, topic)) { replacement = u; row.source = 'release'; break }
      }
    }
    // 2. Validated stock search
    if (!replacement) {
      const q = ((p.tags || []).filter(t => t !== 'New Releases').slice(0, 2).join(' ') || p.category || 'rifle') + ' firearm'
      replacement = await fetchAndUploadImage(q, p.slug, topic).catch(() => null)
      if (replacement) row.source = 'stock-validated'
    }

    if (!replacement) { row.status = 'off-topic-no-replacement'; report.push(row); continue }
    row.after = replacement
    if (!dryRun) {
      await sanity.patch(p._id).set({ imageUrl: replacement }).commit()
      row.status = 'replaced'
    } else row.status = 'would-replace'
    report.push(row)
  }
  return Response.json({ ok: true, dryRun, checked: posts.length, report })
}
