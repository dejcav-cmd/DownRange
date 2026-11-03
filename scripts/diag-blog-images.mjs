// Diagnose why collectImages found no hero: token presence, candidate extraction, downloads, upload.
import fs from 'fs'
import { createClient } from '@sanity/client'
fs.copyFileSync('lib/pressImages.js', 'scripts/.pressImages.mjs')
const pi = await import('./.pressImages.mjs')
const { ARTICLES } = await import('./blog-2026-11-03-articles.mjs')
const token = String(process.env.SANITY_API_TOKEN || '').replace(/^ST=/, '').trim()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const out = { tokenLength: token.length, articles: [] }
const sanity = createClient({ projectId: 'vbnsqnkg', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token })
try { out.canQuery = await sanity.fetch('count(*[_type=="blogPost"])') } catch (e) { out.canQueryError = String(e.message).slice(0, 160) }
for (const a of ARTICLES) {
  const page = a.imagePages[0]
  const r = { slug: a.slug, page }
  try {
    const res = await fetch(page, { headers: { 'User-Agent': UA } })
    const html = await res.text()
    r.http = res.status; r.bytes = html.length
    const cands = pi.extractImageCandidates(html, page)
    r.candidateCount = cands.length
    r.candidates = []
    for (const c of cands.slice(0, 5)) {
      const e = { url: c.url, rank: c.rank }
      try {
        const d = await fetch(c.url, { headers: { 'User-Agent': UA, Referer: page, Accept: 'image/*,*/*' } })
        const buf = Buffer.from(await d.arrayBuffer())
        e.http = d.status; e.type = d.headers.get('content-type'); e.bytes = buf.length
        e.magic = buf.subarray(0, 4).toString('hex')
        if (!r.upload && d.ok && buf.length > 15000 && /image\/(jpeg|png|webp)/.test(e.type || '')) {
          try { const as = await sanity.assets.upload('image', buf, { filename: 'diag-test.jpg' }); r.upload = 'ok ' + as._id } catch (err) { r.upload = 'ERR ' + String(err.message || err).slice(0, 200) }
        }
      } catch (err) { e.error = String(err.message || err).slice(0, 100) }
      r.candidates.push(e)
    }
  } catch (e) { r.error = String(e.message || e).slice(0, 160) }
  out.articles.push(r)
}
console.log(JSON.stringify(out, null, 2))
