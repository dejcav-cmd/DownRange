export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { postCustom } from '../../../../agent/social/socialAgent.js'

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// POST { posts: [{ platform, content }], imageUrl, title }
// Publishes hand-written copy (with tags/links already in the text) to each platform.
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))

  // Edit an existing Facebook post to add a real page tag; revert if the tag doesn't register
  if (body.facebookEdit) {
    const { postId, message, original } = body.facebookEdit
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    const set = async (m) => fetch(`https://graph.facebook.com/v20.0/${postId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ message: m, name: m, access_token: token }),
    }).then(r => r.json())
    const upd = await set(message)
    const chk = await fetch(`https://graph.facebook.com/v20.0/${postId}?fields=message,name,message_tags&access_token=${token}`).then(r => r.json())
    const tagged = !!(chk.message_tags && Object.keys(chk.message_tags).length)
    let reverted = null
    if (!tagged && original) reverted = await set(original)
    return Response.json({ ok: true, update: upd, check: chk, tagged, reverted })
  }
  const posts = Array.isArray(body.posts) ? body.posts : []
  const results = []
  for (const p of posts) {
    try {
      const r = await postCustom(p.platform, p.content, body.imageUrl || null, { title: body.title || '' })
      results.push({ platform: p.platform, ...r })
    } catch (e) {
      results.push({ platform: p.platform, ok: false, error: e.message })
    }
  }
  return Response.json({ ok: true, results })
}
