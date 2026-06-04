export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const url    = new URL(req.url)
  const limit  = parseInt(url.searchParams.get('limit') || '100')
  const status = url.searchParams.get('status')
  const platform = url.searchParams.get('platform')

  let filter = `_type == "socialPost"`
  if (status)   filter += ` && status == "${status}"`
  if (platform) filter += ` && platform == "${platform}"`

  const posts = await sanity.fetch(
    `*[${filter}] | order(scheduledAt desc) [0...${limit}] {
      _id, platform, status, content, articleSlug, articleTitle,
      postUrl, postId, scheduledAt, postedAt, error, urgencyScore, category, metrics
    }`
  )

  const stats = await sanity.fetch(`{
    "total":    count(*[_type == "socialPost"]),
    "posted":   count(*[_type == "socialPost" && status == "posted"]),
    "failed":   count(*[_type == "socialPost" && status == "failed"]),
    "drafts":   count(*[_type == "socialPost" && status == "draft"]),
    "today":    count(*[_type == "socialPost" && postedAt > $today]),
    "thisWeek": count(*[_type == "socialPost" && postedAt > $week])
  }`, {
    today: new Date(new Date().setHours(0,0,0,0)).toISOString(),
    week:  new Date(Date.now() - 7*24*60*60*1000).toISOString(),
  })

  return Response.json({ ok: true, posts, stats })
}

export async function DELETE(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await req.json()
  await sanity.delete(id)
  return Response.json({ ok: true })
}
