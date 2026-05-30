import { createClient } from '@sanity/client'
import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

const auth = req => req.headers.get('x-admin-key') === process.env.ADMIN_KEY

const VOICE = `You write for DownRange — a firearms news site by a gun owner who carries daily.
COPYRIGHT: Use only FACTS from source. Do NOT mirror structure. Do NOT append any Source footer or attribution line.
BANNED: comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer.
STYLE: Start with hardest fact. Short sentences. Active voice. Specific names, calibers, dates. No padded intros.`

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, type } = await req.json().catch(() => ({}))
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const doc = await sanity.fetch('*[_id == $id][0]{ _id, title, body, summary, source, externalUrl, category }', { id })
  if (!doc) return Response.json({ error: 'Not found' }, { status: 404 })

  const src = (doc.body || doc.summary || '').replace(/<[^>]+>/g, '').slice(0, 600)
  const prompt = `${VOICE}

Rewrite for DownRange. 500-750 words. Structure: Lead → Key Details → Why It Matters for Gun Owners → DownRange Analysis.
No source footer. No attribution at end.

Title: ${doc.title || ''}
Source facts only: ${src}

Respond ONLY valid JSON (no markdown):
{"body":"<HTML with h2 tags>","summary":"2-3 sentence plain text"}`

  const raw = await callAIText({ prompt, useCase: 'article', maxTokens: 2000 })
  let parsed
  try {
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    // Try extracting first { ... } block
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return Response.json({ error: 'AI returned unparseable response', raw: raw.slice(0,300) }, { status: 500 })
    try { parsed = JSON.parse(match[0]) }
    catch { return Response.json({ error: 'AI parse error', raw: raw.slice(0,300) }, { status: 500 }) }
  }

  await sanity.patch(id).set({ body: parsed.body, summary: parsed.summary }).commit()
  return Response.json({ ok: true, id })
}
