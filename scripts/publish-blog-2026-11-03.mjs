// Publishes the 2026-11-03 blog articles to Sanity with REAL source images only (rule 27).
// No real image = no article. Run in GitHub Actions (Sanity egress). Writes result JSON to stdout.
import fs from 'fs'
import { createClient } from '@sanity/client'

fs.copyFileSync('lib/pressImages.js', 'scripts/.pressImages.mjs')
const { collectImages, weaveImages, extractImageCandidates } = await import('./.pressImages.mjs')
const { ARTICLES } = await import('./blog-2026-11-03-articles.mjs')

const token = String(process.env.SANITY_API_TOKEN || '').replace(/^ST=/, '').trim()
process.env.SANITY_API_TOKEN = token
const DRY = process.env.DRY_RUN === 'true'
const sanity = createClient({ projectId: 'vbnsqnkg', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token })
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const out = []
for (const a of ARTICLES) {
  const r = { slug: a.slug, status: 'pending', tried: [] }
  try {
    let got = null
    for (const page of a.imagePages) {
      try {
        const res = await fetch(page, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, redirect: 'follow' })
        const html = await res.text()
        r.tried.push({ page, http: res.status, bytes: html.length })
        if (!res.ok) continue
        if (DRY) { got = { hero: { url: 'dry-run' }, body: [] }; break }
        const pg = { body: html, finalUrl: res.url || page, mode: 'html' }
        r.tried[r.tried.length - 1].candidates = extractImageCandidates(pg, page).length
        const img = await collectImages(sanity, pg, page, { brand: a.brand, label: a.slug, max: 3, selfId: 'blog-' + a.slug })
        r.tried[r.tried.length - 1].rejected = (img.rejected || []).slice(0, 6)
        if (img.hero) { got = img; r.imageSource = page; break }
      } catch (e) { r.tried.push({ page, error: String(e.message || e).slice(0, 120) }) }
    }
    if (!got) { r.status = 'skipped: no real image'; out.push(r); continue }

    // Body images from third-party pages proved unreliable (related-post promos, repeats): hero only.
    const body = DRY ? a.body : weaveImages(a.body, [], a.brand)
    const doc = {
      _id: 'blog-' + a.slug,
      _type: 'blogPost',
      title: a.title,
      slug: { _type: 'slug', current: a.slug },
      author: 'DJ Cavalcanti',
      category: a.category,
      excerpt: a.excerpt,
      body,
      imageUrl: got.hero.url,
      readTime: a.readTime,
      status: 'published',
      featured: false,
      publishedAt: new Date().toISOString(),
      tags: a.tags,
      editorLocked: true,
      qualityReviewed: true,
    }
    r.hero = got.hero.url
    r.bodyImages = (got.body || []).length
    if (!DRY) await sanity.createOrReplace(doc)
    r.status = DRY ? 'dry-run ok' : 'published'
    r.url = 'https://www.downrangeco.com/blog/' + a.slug
  } catch (e) {
    r.status = 'failed: ' + String(e.message || e).slice(0, 200)
  }
  out.push(r)
  await new Promise(res => setTimeout(res, 1500)) // keep publishedAt ordering: election last = newest
}
console.log(JSON.stringify(out, null, 2))
