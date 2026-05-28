import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function stripAttribution(body) {
  if (!body || typeof body !== 'string') return body
  return body
    .replace(/<div[^>]+class=["'`]dr-source-attribution["'`][\s\S]*?<\/div>\s*/gi, '')
    .trim()
}

// This route runs the full cleanup + article-specific fixes
// Called via Vercel cron or manually — CRON_SECRET or ADMIN_KEY auth
export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  const adminKey   = req.headers.get('x-admin-key')
  const secret     = process.env.CRON_SECRET
  const aKey       = process.env.ADMIN_KEY
  
  const ok = (secret && authHeader === 'Bearer ' + secret) ||
             (aKey && adminKey === aKey) ||
             req.headers.get('x-vercel-cron') === '1'
  
  if (!ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = { cleaned: 0, skipped: 0, articleFixes: [] }

  try {
    // 1. Fix the specific genomics article (off-topic, needs proper image)
    const genomicsSlug = 'whole-genome-variant-detection-in-long-read-sequencing-data-from-ultra-low-input-patient-samples'
    const genomicsArticle = await sanity.fetch(
      '*[_type == "newsArticle" && slug.current == $slug][0]{ _id, title, imageUrl, body }',
      { slug: genomicsSlug }
    )
    if (genomicsArticle?._id) {
      const patch = { imageUrl: '/img/photos/news.jpg' }
      if (genomicsArticle.body) {
        const stripped = stripAttribution(genomicsArticle.body)
        if (stripped !== genomicsArticle.body) patch.body = stripped
      }
      await sanity.patch(genomicsArticle._id).set(patch).commit()
      results.articleFixes.push({ slug: genomicsSlug, patched: Object.keys(patch) })
    }

    // 2. Bulk strip attribution from all newsArticle + blogPost bodies
    for (const type of ['newsArticle', 'blogPost']) {
      const docs = await sanity.fetch(
        `*[_type == $type && defined(body)] | order(_createdAt desc) [0...1000] { _id, body }`,
        { type }
      )
      for (const doc of docs) {
        if (!doc.body?.includes('dr-source-attribution')) { results.skipped++; continue }
        const stripped = stripAttribution(doc.body)
        if (stripped !== doc.body) {
          try {
            await sanity.patch(doc._id).set({ body: stripped }).commit()
            results.cleaned++
          } catch { results.skipped++ }
        } else {
          results.skipped++
        }
      }
    }

    console.log('[ONE-TIME-CLEANUP] Done:', results)
    return Response.json({ ok: true, ...results })
  } catch (e) {
    console.error('[ONE-TIME-CLEANUP] Error:', e.message)
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
