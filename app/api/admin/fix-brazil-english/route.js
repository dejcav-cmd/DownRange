export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// The 16 brazilContent docs confirmed (via language-heuristic scan) to be in
// English despite belonging to the Portuguese-only /brazil section. Root cause
// was a backwards instruction in agent/feeds/news.js (fixed 2026-08-22) that
// told the AI rewriter to "write in English" for Brazil-region content.
const AFFECTED_IDS = [
  'br-61419973ce79ee9ff3aa4fd21651d123',
  'br-74fbe9904df352a19dbe5d47b1e4f0c3',
  'br-0ee0168e49092c7a6a1263d8ad7c78f8',
  'br-1b544725b9663d91d06be6db01758285',
  'br-10c30d4ddfd258051a133ccd9a0f5389',
  'br-368ff02773bb7fd13b4b121fa2fd0ec8',
  'br-a675277d99b064083a0db82a4d59face',
  'br-0bc569e11ffb86b256be3e6a4103dead',
  'br-0becaa232c608e25a8a18654a67c4f62',
  'br-6b544d2c42518fb109add4de576b2770',
  'br-8ffd51b30789862a8efa68fab77c2882',
  'br-1860f41dcc90c11b2a872e839f97a622',
  'br-e7df9087180437d0f8186de26e17c638',
  'br-8fcf0c017f9901c0a0bcb30806ff24c2',
  'br-b8876b008236e703f54f707faff8fc85',
  'br-ecc65a436f8d4a1c4d7bf605686631dd',
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  const valid = !process.env.ADMIN_KEY || key === process.env.ADMIN_KEY
  if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { rewriteWithClaude } = await import('../../../../agent/utils.js')

  const { ids } = await req.json().catch(() => ({}))
  const targets = Array.isArray(ids) && ids.length ? ids : AFFECTED_IDS

  const results = []
  for (const id of targets) {
    try {
      const doc = await sanity.fetch(
        '*[_id == $id][0]{_id, title, body, excerpt, sourceUrl, source, publishedAt}',
        { id }
      )
      if (!doc) { results.push({ id, status: 'not_found' }); continue }

      // Feed the existing (English) title + body back in as "source facts" —
      // the PT-BR rewriter extracts facts only and produces original Portuguese
      // prose, so this works without needing to re-scrape the original page.
      const factsInput = `${doc.title}\n\n${(doc.body || '').replace(/<[^>]+>/g, ' ')}`.slice(0, 1200)

      const ai = await rewriteWithClaude({
        title: doc.title,
        description: factsInput,
        source: doc.source || 'DownRange Brasil',
        publishedAt: doc.publishedAt,
        url: doc.sourceUrl,
      }, { lang: 'pt-BR' })

      if (!ai?.body || ai.body.length < 300) {
        results.push({ id, status: 'ai_empty' })
        continue
      }

      await sanity.patch(id).set({
        title:   ai.title || doc.title,
        body:    ai.body,
        excerpt: ai.summary || doc.excerpt,
      }).commit()

      results.push({ id, status: 'fixed', newTitle: ai.title })
      await new Promise(r => setTimeout(r, 800))
    } catch (e) {
      results.push({ id, status: 'error', error: e.message })
    }
  }

  const fixed = results.filter(r => r.status === 'fixed').length
  return Response.json({ ok: true, fixed, total: targets.length, results })
}
