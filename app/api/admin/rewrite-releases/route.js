/**
 * /api/admin/rewrite-releases
 * One-shot: re-fetches and rewrites all existing firearmRelease articles
 * using the new two-stage Haiku-validate + Sonnet-write pipeline.
 * Auth: x-admin-key header.
 * Processes up to BATCH_SIZE docs per call to stay under 300s.
 */
export const dynamic    = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { validateAndWrite } from '@/agent/feeds/releases.js'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

const BATCH_SIZE    = 4   // articles per call (each takes ~30s with Sonnet)
const WALL_SAFE_MS  = 250_000
const MIN_BODY_CHARS = 1200  // skip if existing body already substantial

function isAuth(req) {
  const admin  = req.headers.get('x-admin-key')
  const bearer = req.headers.get('authorization')
  return (
    admin === process.env.ADMIN_KEY ||
    bearer === `Bearer ${process.env.CRON_SECRET}`
  )
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept':     'text/html,application/xhtml+xml',
    },
    signal:   AbortSignal.timeout(14000),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 5000)
}

export async function GET(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const forceAll = req.nextUrl?.searchParams?.get('force') === '1'

  // Fetch all releases, ordered oldest first (rewrite oldest first)
  const docs = await sanity.fetch(
    `*[_type == "firearmRelease" && defined(sourceUrl)
      ${forceAll ? '' : '&& (!defined(body) || length(body) < 1500)'}
    ] | order(publishedAt asc) [0...${BATCH_SIZE}] {
      _id, brand, model, title, sourceUrl, body
    }`
  )

  const results = { rewritten: [], skipped: [], failed: [], ms: 0 }

  for (const doc of docs) {
    if (Date.now() - t0 > WALL_SAFE_MS) {
      results.skipped.push(`${doc.brand} ${doc.model} [wall-clock]`)
      continue
    }

    // Skip if body is already substantial (unless force=1)
    if (!forceAll && (doc.body || '').length >= MIN_BODY_CHARS) {
      results.skipped.push(`${doc.brand} ${doc.model} [adequate]`)
      continue
    }

    try {
      // Fetch source page
      const html = await fetchHtml(doc.sourceUrl)
      const text = htmlToText(html)

      // Run new pipeline
      const extracted = await validateAndWrite(doc.title, text, doc.sourceUrl, doc.brand)
      if (!extracted || extracted.skip) {
        results.skipped.push(`${doc.brand} ${doc.model} [AI skip]`)
        continue
      }

      // Patch the existing doc — update body, summary, specs, action
      await sanity.patch(doc._id).set({
        title:   extracted.title   || doc.title,
        summary: extracted.summary || '',
        body:    extracted.body    || '',
        action:  extracted.action  || null,
        specs:   (extracted.specs  || []).map(s => ({
          _type: 'object',
          _key:  s.label.toLowerCase().replace(/\s+/g, '-'),
          label: s.label,
          value: s.value,
        })),
        ...(extracted.msrp ? { msrp: extracted.msrp } : {}),
      }).commit()

      results.rewritten.push(`${doc.brand} ${doc.model}`)
      console.log(`[REWRITE] ✓ ${doc.brand} ${doc.model}`)

    } catch (e) {
      results.failed.push(`${doc.brand} ${doc.model}: ${e.message.slice(0,80)}`)
      console.error(`[REWRITE] ✗ ${doc.brand} ${doc.model}: ${e.message}`)
    }

    await new Promise(r => setTimeout(r, 1000))
  }

  results.ms = Date.now() - t0
  return Response.json({ ok: true, ...results })
}
