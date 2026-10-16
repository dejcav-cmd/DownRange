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
      if (!res.success) {
        // Facebook will not let the API edit this post: pin the working link as a comment instead
        const c = await fetch(`${GRAPH}/${b.postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ message: 'Full story: ' + b.newUrl.split('?')[0], access_token: token }) }).then(x => x.json()).catch(e => ({ error: { message: e.message } }))
        r.comment = c.id ? 'comment added' : (c.error?.message || 'comment failed')
      }
      await fetch(`${GRAPH}/`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ id: b.newUrl.split('?')[0], scrape: 'true', access_token: token }) }).catch(() => {})
      if (res.success) await sanity.patch(b.docId).set({ content: newContent }).commit().catch(() => {})
    } else {
      r.facebook = 'not editable (platform does not allow editing posts); the link now redirects'
    }
    results.push(r)
  }
  return Response.json({ ok: true, count: broken.length, results })
}

// PUT: for Facebook posts with a stale link: delete the old post (if still there) and repost with the working link.
export async function PUT(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN, pageId = process.env.FACEBOOK_PAGE_ID
  if (!token || !pageId) return Response.json({ error: 'Facebook env missing' }, { status: 400 })
  const form = (o) => ({ method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...o, access_token: token }) })
  const broken = (await scan()).filter(b => b.platform === 'facebook' && b.newUrl)
  const results = []
  for (const b of broken) {
    const r = { docId: b.docId, oldPostId: b.postId }
    const doc = await sanity.fetch(`*[_id==$id][0]{ mediaUrl }`, { id: b.docId })
    const still = await fetch(`${GRAPH}/${b.postId}?fields=id&access_token=${token}`).then(x => x.json()).catch(() => ({}))
    if (still.id) {
      const del = await fetch(`${GRAPH}/${b.postId}?access_token=${token}`, { method: 'DELETE' }).then(x => x.json()).catch(e => ({ error: { message: e.message } }))
      if (!del.success) { r.status = 'old post could not be deleted: ' + (del.error?.message || 'unknown') + ' (not reposted, to avoid a duplicate)'; results.push(r); continue }
      r.deleted = true
    } else r.deleted = 'already gone'
    const text = b.content.replace(b.oldUrl, b.newUrl)
    let res = doc?.mediaUrl ? await fetch(`${GRAPH}/${pageId}/photos`, form({ url: doc.mediaUrl, caption: text })).then(x => x.json()).catch(e => ({ error: { message: e.message } })) : {}
    if (!res.id) res = await fetch(`${GRAPH}/${pageId}/feed`, form({ message: text })).then(x => x.json()).catch(e => ({ error: { message: e.message } }))
    if (res.id) {
      await sanity.patch(b.docId).set({ content: text, postId: res.id, postedAt: new Date().toISOString() }).commit().catch(() => {})
      await fetch(`${GRAPH}/`, form({ id: b.newUrl.split('?')[0], scrape: 'true' })).catch(() => {})
      r.status = 'reposted'; r.newPostId = res.id
    } else r.status = 'repost failed: ' + (res.error?.message || 'unknown')
    results.push(r)
  }
  return Response.json({ ok: true, count: broken.length, results })
}
