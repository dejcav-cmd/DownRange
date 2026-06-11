export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { reportCronRun } from '@/lib/cronReporter'
import { createClient }  from '@sanity/client'
import { callAIText }    from '@/lib/aiClient.js'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

const AI_PHRASES = [
  'comprehensive','dive into','cutting-edge','robust','seamlessly','leverage',
  'empower','game-changer','landscape','navigate','delve','utilize','innovative',
  'unprecedented','paradigm','synergy','moving forward','shed light on',
  'it remains to be seen','stakeholders','holistic','takeaway','unpack',
  'groundbreaking','pivotal','significant development','notably',
  "it's worth noting",'furthermore','in conclusion','in summary',
  'at the end of the day','a wide range of','it is important to note',
  'in the realm of','when it comes to',
]

function scoreBody(body) {
  if (!body || body.length < 100) return { score: 0, issues: ['missing body'] }
  const text  = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const issues = []
  if (words.length < 400) issues.push(`too short (${words.length} words, need 400+)`)
  const found = AI_PHRASES.filter(p => text.includes(p.toLowerCase()))
  if (found.length > 0) issues.push(`AI phrases: "${found.slice(0,3).join('", "')}"+${found.length}`)
  const firstSentence = text.slice(0, 200)
  if (/in recent (months|years|weeks)|there has been|as (we|the country|gun owners)|it (is|has) (important|worth|become)/i.test(firstSentence))
    issues.push('padded opener detected')
  const h2count = (body.match(/<h2/gi) || []).length
  if (h2count < 2 && words.length > 100) issues.push(`weak structure (${h2count} h2 sections)`)
  const score = Math.max(0, 100 - (issues.length * 25) - (found.length * 5))
  return { score, issues, words: words.length }
}

function needsRewrite(body) {
  const { score, issues } = scoreBody(body)
  if (score < 70) return { needs: true, reason: issues[0] || 'low score', score }
  return { needs: false, score }
}

const VOICE = `You write for DownRange — a firearms news site by a gun owner who carries daily.

TITLE RULES:
- NEVER use the source title. Write a completely original DownRange headline.
- Max 12 words. Active voice. Present tense when possible.
- Lead with the most specific fact: court name, state, ATF rule number, gun model, dollar amount.
- NEVER use: "Everything You Need to Know", "Here's Why", "Game-Changer", vague openers.
- Formats: "ATF Just Lost Its Fight Over [Specific Rule]" / "[State] Strikes Down [Law]" / "SIG P365 Variant Drops at $599"

COPYRIGHT: Create a NEW article from FACTS only. Do NOT mirror original structure. Do NOT paraphrase sentence-by-sentence.

BANNED WORDS — do NOT use any of these (article will fail quality check):
comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, it remains to be seen, stakeholders, holistic, takeaway, unpack, groundbreaking, pivotal, significant development, notably, it's worth noting, furthermore, in conclusion, in summary, at the end of the day, a wide range of, it is important to note, in the realm of, when it comes to

REQUIRED STRUCTURE (must have at least 3 <h2> tags):
<h2>[Opening section — hard facts]</h2>
2-3 paragraphs of specific facts
<h2>Why It Matters for Gun Owners</h2>
Direct impact on carriers, buyers, legal exposure
<h2>Background</h2>
Prior context, history, related rulings
<h2>DownRange Bottom Line</h2>
1 paragraph blunt take for the daily carrier

STYLE: Lead with hardest fact. Avg sentence under 15 words. Active voice. Specific names/calibers/dates/prices. No padding. No filler closing.
WORD COUNT: 500-700 words minimum in body HTML.`

async function rewriteItem(item) {
  const src = (item.body || item.summary || item.description || '').replace(/<[^>]+>/g, '').slice(0, 2000)
  const typeLabel = { newsArticle:'news article', blogPost:'blog post', firearmRelease:'gun release article', canadaContent:'Canada firearms article' }[item._stype] || 'article'

  const prompt = `${VOICE}

Rewrite this ${typeLabel} for DownRange. Must be 500-700 words. Must have 3-4 <h2> sections. Must NOT use any banned words.

Title: ${item.title || ''}
Source: ${item.externalUrl || item.sourceUrl || ''}
Content: ${src}

Respond ONLY with valid JSON, no markdown, no preamble:
{"title":"original headline max 12 words","body":"<full HTML with h2 tags 500-700 words>","summary":"2-3 sentence plain text under 300 chars"}`

  const raw    = await callAIText({ prompt, useCase: 'backfill', maxTokens: 3500 })
  const clean  = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const m      = clean.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`No JSON in response: ${clean.slice(0, 200)}`)
  const parsed = JSON.parse(m[0])

  const { score, issues } = scoreBody(parsed.body || '')
  if (score < 70) throw new Error(`Output still fails quality (score=${score}): ${issues.join(', ')}`)
  const wordCount = (parsed.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  if (wordCount < 300) throw new Error(`Too short: ${wordCount} words`)
  return parsed
}

export async function GET(req)  { return handler(req) }
export async function POST(req) { return handler(req) }

async function handler(req) {
  const t0   = Date.now()
  const auth = req.headers.get('authorization') || ''
  const xkey = req.headers.get('x-admin-key')   || ''
  const isCron   = process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = process.env.ADMIN_KEY   && xkey === process.env.ADMIN_KEY
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && !isAdmin && !isVercel) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const BATCH = 15
  const stats = { scanned: 0, rewrote: 0, skipped: 0, failed: 0, types: {} }

  try {
    const [articles, blogs, releases, canada] = await Promise.all([
      sanity.fetch(`*[_type=="newsArticle" && defined(title) && editorLocked != true] | order(publishedAt desc) [0...${BATCH * 3}] { _id, title, body, summary, description, source, externalUrl, qualityReviewed }`),
      sanity.fetch(`*[_type=="blogPost"       && defined(title) && editorLocked != true] | order(publishedAt desc) [0...20] { _id, title, body, excerpt, qualityReviewed }`),
      sanity.fetch(`*[_type=="firearmRelease" && defined(brand) && editorLocked != true] | order(_createdAt desc)  [0...10] { _id, "title": brand+" "+model, body, summary, brand, model, caliber, msrp, category, qualityReviewed }`),
      sanity.fetch(`*[_type=="canadaContent"  && defined(title) && editorLocked != true] | order(_createdAt desc)  [0...10] { _id, title, body, summary, type, status, qualityReviewed }`),
    ])

    const allDocs = [
      ...articles.map(d => ({ ...d, _stype: 'newsArticle' })),
      ...blogs.map(d    => ({ ...d, _stype: 'blogPost' })),
      ...releases.map(d => ({ ...d, _stype: 'firearmRelease' })),
      ...canada.map(d   => ({ ...d, _stype: 'canadaContent' })),
    ]

    const needsWork  = allDocs.filter(item => needsRewrite(item.body).needs)
    const alreadyGood = allDocs.filter(item => !needsRewrite(item.body).needs)
    const batch = needsWork.slice(0, BATCH)

    stats.scanned = allDocs.length
    stats.skipped = alreadyGood.length

    // Mark already-good articles as reviewed so they don't appear in needsRewrite queue
    const unreviewed = alreadyGood.filter(item => !item.qualityReviewed)
    for (const item of unreviewed) {
      await sanity.patch(item._id).set({ qualityReviewed: true }).commit()
    }

    for (const item of batch) {
      try {
        const ai = await rewriteItem(item)
        await sanity.patch(item._id).set({
          body:            ai.body,
          ...(ai.title   ? { title:   ai.title   } : {}),
          ...(ai.summary ? { summary: ai.summary } : {}),
          qualityReviewed: true,
        }).commit()
        stats.rewrote++
        stats.types[item._stype] = (stats.types[item._stype] || 0) + 1
        console.log(`[QUALITY-REWRITE] OK ${item._stype} "${(item.title||'').slice(0,50)}"`)
      } catch (e) {
        console.error('[QUALITY-REWRITE] FAIL', item._id, e.message)
        stats.failed++
      }
      await new Promise(r => setTimeout(r, 800))
    }

    const remaining = Math.max(0, needsWork.length - batch.length)
    const ms  = Date.now() - t0
    const msg = `Scanned ${stats.scanned} · needs-rewrite ${needsWork.length} · rewrote ${stats.rewrote} · skipped ${stats.skipped} · failed ${stats.failed} · remaining ${remaining}`
    await reportCronRun('quality-rewrite', { status: stats.failed > stats.rewrote ? 'warning' : 'success', ms, details: msg })
    return Response.json({ ok: true, ...stats, remaining, ms, message: msg })

  } catch (e) {
    const ms = Date.now() - t0
    await reportCronRun('quality-rewrite', { status: 'failed', ms, error: e.message })
    return Response.json({ ok: false, error: e.message, ms }, { status: 500 })
  }
}
