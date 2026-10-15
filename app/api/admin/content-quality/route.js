export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return !!process.env.ADMIN_KEY && req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// Live articles only: slug + publishedAt, same rule the public site uses.
const LIVE = '_type == "newsArticle" && defined(slug.current) && defined(publishedAt)'
const THIN = '(!defined(body) || length(body) < 2500)'
const BAD_IMG = '(!defined(imageUrl) || imageUrl == "" || string::startsWith(imageUrl, "/img/") || imageUrl match "*.svg*")'

const JOBS = [
  { id: 'quality-rewrite',        label: 'Quality Rewrite',         desc: 'Rewrites thin and unreviewed articles from the full source page, every 2 hours' },
  { id: 'fix-placeholder-images', label: 'Image Repair',            desc: 'Finds articles with missing or placeholder images, every 4 hours' },
]

// GET: counts, weakest articles, last runs of the two jobs that keep quality up
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const [counts, weakest, runs] = await Promise.all([
      sanity.fetch(`{
        "live":       count(*[${LIVE}]),
        "thin":       count(*[${LIVE} && ${THIN}]),
        "unreviewed": count(*[${LIVE} && qualityReviewed != true]),
        "badImage":   count(*[${LIVE} && ${BAD_IMG}])
      }`),
      sanity.fetch(`*[${LIVE} && ${THIN}] | order(publishedAt desc) [0...40] {
        _id, title, "slug": slug.current, publishedAt, source, qrAttempts, editorLocked,
        "chars": coalesce(length(body), 0), imageUrl
      }`),
      Promise.all(JOBS.map(j => sanity.fetch(
        `*[_type == "cronRun" && jobId == $id] | order(at desc) [0] { at, status, details, error }`, { id: j.id }
      ).catch(() => null))),
    ])
    return Response.json({
      ok: true,
      counts,
      weakest: weakest.map(a => ({ ...a, words: Math.round(a.chars / 6) })),
      jobs: JOBS.map((j, i) => ({ ...j, last: runs[i] || null })),
    })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// POST { action: 'mark-reviewed', id } | { action: 'unlock', id }
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!body.id) return Response.json({ error: 'id required' }, { status: 400 })
  if (body.action === 'mark-reviewed') {
    await sanity.patch(body.id).set({ qualityReviewed: true }).commit()
    return Response.json({ ok: true })
  }
  return Response.json({ error: 'Unknown action: ' + body.action }, { status: 400 })
}
