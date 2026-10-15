export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { createClient } from '@sanity/client'
import { THIN_CHARS } from '@/lib/articleQuality.js'

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
const THIN = `(!defined(body) || length(body) < ${THIN_CHARS})`
const BAD_IMG = '(!defined(imageUrl) || imageUrl == "" || string::startsWith(imageUrl, "/img/") || imageUrl match "*.svg*")'

const JOBS = [
  { id: 'quality-rewrite',        label: 'Quality Rewrite',         desc: 'Rewrites thin and unreviewed articles from the full source page, every 2 hours' },
  { id: 'fix-placeholder-images', label: 'Image Repair',            desc: 'Finds articles with missing or placeholder images, every 4 hours' },
]

// GET: counts, weakest articles, last runs of the two jobs that keep quality up
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const sort  = new URL(req.url).searchParams.get('sort')
  const order = sort === 'oldest' ? 'publishedAt asc' : sort === 'shortest' ? 'coalesce(length(body), 0) asc' : 'publishedAt desc'
  try {
    const [counts, weakest, hidden, runs] = await Promise.all([
      sanity.fetch(`{
        "live":       count(*[${LIVE}]),
        "thin":       count(*[${LIVE} && ${THIN}]),
        "unreviewed": count(*[${LIVE} && qualityReviewed != true]),
        "badImage":   count(*[${LIVE} && ${BAD_IMG}])
      }`),
      sanity.fetch(`*[${LIVE} && ${THIN}] | order(${order}) [0...100] {
        _id, title, "slug": slug.current, publishedAt, source, qrAttempts, editorLocked,
        "chars": coalesce(length(body), 0), imageUrl
      }`),
      sanity.fetch(`*[_type == "newsArticle" && qrHidden == true] | order(_updatedAt desc) [0...50] {
        _id, title, "slug": slug.current, source, qrHiddenReason, prevPublishedAt, "chars": coalesce(length(body), 0)
      }`),
      Promise.all(JOBS.map(j => sanity.fetch(
        `*[_type == "cronRun" && jobId == $id] | order(at desc) [0] { at, status, details, error }`, { id: j.id }
      ).catch(() => null))),
    ])
    return Response.json({
      ok: true,
      counts,
      weakest: weakest.map(a => ({ ...a, words: Math.round(a.chars / 6) })),
      hidden,
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
  if (body.action === 'hide') {
    // Takes the article off the site (no publishedAt) but keeps everything so it can be restored.
    const cur = await sanity.fetch('*[_id == $id][0]{ publishedAt }', { id: body.id })
    await sanity.patch(body.id)
      .set({ approved: false, qrHidden: true, qrHiddenReason: String(body.reason || 'Hidden from the admin panel').slice(0, 300), ...(cur?.publishedAt ? { prevPublishedAt: cur.publishedAt } : {}) })
      .unset(['publishedAt']).commit()
    return Response.json({ ok: true })
  }
  if (body.action === 'restore') {
    const cur = await sanity.fetch('*[_id == $id][0]{ prevPublishedAt }', { id: body.id })
    await sanity.patch(body.id)
      .set({ approved: true, publishedAt: cur?.prevPublishedAt || new Date().toISOString() })
      .unset(['qrHidden', 'qrHiddenReason', 'prevPublishedAt']).commit()
    return Response.json({ ok: true })
  }
  if (body.action === 'mark-reviewed') {
    await sanity.patch(body.id).set({ qualityReviewed: true }).commit()
    return Response.json({ ok: true })
  }
  return Response.json({ error: 'Unknown action: ' + body.action }, { status: 400 })
}
