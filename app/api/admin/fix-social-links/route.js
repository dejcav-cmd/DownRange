export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})
const auth = (req) => { const k = req.headers.get('x-admin-key'); return k && k === process.env.ADMIN_KEY }
const GRAPH = 'https://graph.facebook.com/v20.0'

// Finds posted social posts whose link points at a news slug that no longer exists, and (on POST)
// rewrites the Facebook post text to the article's current URL and refreshes Facebook's cached preview.
async function scan() {
  const posts = await sanity.fetch(`*[_type=="socialPost" && status=="posted" && defined(postId)] | order(_createdAt desc)[0...300]{_id, platform, postId, content}`)
  const out = []
  for (const p of posts) {
    const m = /https?:\/\/(?:www\.)?downrangeco\.com\/news\/([a-z0-9-]+)(\?[^\s]*)?/i.exec(p.content || '')
    if (!m) continue
    const slug = m[1]
    const exists = await sanity.fetch(`count(*[_type=="newsArticle" && slug.current==$s])`, { s: slug })
    if (exists) continue
    const sx = /-([a-f0-9]{6})$/.exec(slug)
    const cur = sx ? await sanity.fetch(`*[_type=="newsArticle" && _id match $p && defined(slug.current)][0]{ "slug": slug.current }`, { p: 'news-' + sx[1] + '*' }) : null
    out.push({ docId: p._id, platform: p.platform, postId: p.postId, oldSlug: slug, newSlug: cur?.slug || null, oldUrl: m[0], newUrl: cur?.slug ? `https://www.downrangeco.com/news/${cur.slug}${m[2] || ''}` : null, content: p.content })
  }
  return out
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const broken = await scan()
  return Response.json({ ok: true, count: broken.length, broken: broken.map(({ content, ...r }) => r) })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  const broken = await scan()
  const results = []
  for (const b of broken) {
    if (!b.newUrl) { results.push({ ...b, content: undefined, status: 'no current article' }); continue }
    const newContent = b.content.replace(b.oldUrl, b.newUrl)
    const r = { docId: b.docId, platform: b.platform, postId: b.postId, newUrl: b.newUrl }
    if (b.platform === 'facebook' && token) {
      // feed posts take "message", photo posts take "name"; try both
      let res = await fetch(`${GRAPH}/${b.postId}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ message: newContent, access_token: token }) }).then(x => x.json()).catch(e => ({ error: { message: e.message } }))
      if (!res.success) res = await fetch(`${GRAPH}/${b.postId}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ name: newContent, access_token: token }) }).then(x => x.json()).catch(e => ({ error: { message: e.message } }))
      r.facebook = res.success ? 'edited' : (res.error?.message || 'edit failed')
      await fetch(`${GRAPH}/`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ id: b.newUrl.split('?')[0], scrape: 'true', access_token: token }) }).catch(() => {})
      if (res.success) await sanity.patch(b.docId).set({ content: newContent }).commit().catch(() => {})
    } else {
      r.facebook = 'not editable (platform does not allow editing posts); the link now redirects'
    }
    results.push(r)
  }
  return Response.json({ ok: true, count: broken.length, results })
}
