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
