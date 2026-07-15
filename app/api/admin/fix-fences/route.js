/**
 * /api/admin/fix-fences
 * One-shot cleanup: strip markdown code fences (```html … ```) from article bodies
 * that were saved before the aiClient.js stripMarkdownFences fix was deployed.
 *
 * Covers: brazilContent, canadaContent, newsArticle
 * Trigger once from /admin or via:
 *   curl -X POST /api/admin/fix-fences -H "x-admin-key: $ADMIN_KEY"
 */
export const dynamic    = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

function stripFences(text) {
  if (!text) return text
  return text
    .replace(/^```[a-z]*\r?\n?/im, '')   // opening fence e.g. ```html
    .replace(/\r?\n?```\s*$/im, '')        // closing fence
    .trim()
}

async function fixType(type, limit = 500) {
  const docs = await sanity.fetch(
    `*[_type == $type && defined(body)] | order(_createdAt desc) [0...$limit] { _id, body }`,
    { type, limit }
  )
  const fixed = []
  for (const doc of docs) {
    if (!doc.body || !doc.body.trimStart().startsWith('`')) continue
    const cleaned = stripFences(doc.body)
    if (cleaned !== doc.body) {
      await sanity.patch(doc._id).set({ body: cleaned }).commit()
      fixed.push(doc._id)
    }
  }
  return { type, scanned: docs.length, fixed: fixed.length, ids: fixed }
}

export async function POST(req) {
  const key   = req.headers.get('x-admin-key') || ''
  const valid = !process.env.ADMIN_KEY || key === process.env.ADMIN_KEY
  if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = await Promise.all([
    fixType('brazilContent'),
    fixType('canadaContent'),
    fixType('newsArticle'),
  ])

  const totalFixed = results.reduce((sum, r) => sum + r.fixed, 0)
  return Response.json({ ok: true, totalFixed, results })
}

export async function GET(req) {
  // Allow GET with admin key for easy browser triggering
  const url = new URL(req.url)
  const key = url.searchParams.get('key') || req.headers.get('x-admin-key') || ''
  const valid = !process.env.ADMIN_KEY || key === process.env.ADMIN_KEY
  if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = await Promise.all([
    fixType('brazilContent'),
    fixType('canadaContent'),
    fixType('newsArticle'),
  ])

  const totalFixed = results.reduce((sum, r) => sum + r.fixed, 0)
  return Response.json({ ok: true, totalFixed, results })
}
