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

// ── Scoring — mirrors content-scan/route.js exactly ──────────────────────────
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
  if (found.length > 0) issues.push(`AI phrases: "${found.slice(0,3).join('", "')}" +${found.length}`)
  const h2count = (body.match(/<h2/gi) || []).length
  if (h2count < 2 && words.length > 100) issues.push(`weak structure (${h2count} h2 sections)`)
  if (/in recent (months|years|weeks)|there has been|as (we|the country|gun owners)|it (is|has) (important|worth|become)/i.test(text.slice(0, 200)))
    issues.push('padded opener')
  const score = Math.max(0, 100 - (issues.length * 25) - (found.length * 5))
  return { score, issues, words: words.length }
}

// Title needs rewrite if it matches the original source title (never been DownRange-ified)
// or if it contains obvious RSS/SEO patterns
function titleNeedsRewrite(title, sourceTitle) {
  if (!title) return true
  // Still matches original RSS title
  if (sourceTitle && title.trim().toLowerCase() === sourceTitle.trim().toLowerCase()) return true
  // Ends with " - Source Name" pattern (RSS artifact)
  if (/\s[-–|]\s+\w/.test(title) && title.length > 60) return true
  // Starts with a date or "BREAKING:" etc — raw feed artifact
  if (/^(breaking|updated|watch|listen|read)[\s:]/i.test(title)) return true
  return false
}

// ── Voice / prompt ────────────────────────────────────────────────────────────
const VOICE = `You write for DownRange — a firearms news site by a gun owner who carries daily.

TITLE RULES (mandatory):
- Write a completely ORIGINAL DownRange headline. Never reuse the source title.
- Max 12 words. Active voice. Present tense when possible.
- Lead with the hardest fact: court name, state, ATF rule number, gun model, dollar amount.
- Good formats: "ATF Loses Fight Over Pistol Brace Rule" / "New Jersey Can Now Seize Your Guns Without Charges" / "SIG P365 Variant Drops at $599"
- Never use: "Everything You Need to Know", "Here's Why", "Game-Changer", "Landmark", vague openers.

COPYRIGHT: Write from FACTS only. Do NOT mirror original article structure. No sentence-level paraphrasing.

BANNED WORDS (article fails quality check if any appear):
comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer,
landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward,
it remains to be seen, stakeholders, holistic, takeaway, unpack, groundbreaking, pivotal,
significant development, notably, it's worth noting, furthermore, in conclusion, in summary,
at the end of the day, a wide range of, it is important to note, in the realm of, when it comes to

REQUIRED STRUCTURE (must have 3-4 <h2> sections):
<h2>[Lead section — hardest facts up front]</h2>
<h2>Why It Matters for Gun Owners</h2>
<h2>Background</h2>
<h2>DownRange Bottom Line</h2>

STYLE: Lead with the hardest fact. Avg sentence under 15 words. Active voice. Specific names/calibers/dates/prices. No padding. No filler.
WORD COUNT: 500-700 words minimum.`

// Full rewrite — body + title
async function rewriteFull(item) {
  const src = (item.body || item.summary || item.description || '').replace(/<[^>]+>/g, '').slice(0, 2000)
  const typeLabel = { newsArticle:'news article', blogPost:'blog post', firearmRelease:'gun release article', canadaContent:'Canada firearms article' }[item._stype] || 'article'

  const prompt = `${VOICE}

Rewrite this ${typeLabel} for DownRange. Must be 500-700 words. Must have 3-4 <h2> sections. Must NOT use any banned words.

Source title (do NOT use this as your headline): ${item.sourceTitle || item.title || ''}
Source URL: ${item.externalUrl || item.sourceUrl || ''}
Content: ${src}

Respond ONLY with valid JSON, no markdown fences, no preamble:
{"title":"original DownRange headline max 12 words","body":"<full HTML with h2 tags 500-700 words>","summary":"2-3 sentence plain text under 300 chars"}`

  const raw    = await callAIText({ prompt, useCase: 'backfill', maxTokens: 3500 })
  const clean  = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const m      = clean.match(/\{[\s\S]*\}/)
  if (!m) throw new Error(`No JSON in response: ${clean.slice(0, 200)}`)
  const parsed = JSON.parse(m[0])

  const { score, issues } = scoreBody(parsed.body || '')
  if (score < 70) throw new Error(`Output still fails quality (score=${score}): ${issues.join(', ')}`)
  const wordCount = (parsed.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  if (wordCount < 300) throw new Error(`Too short: ${wordCount} words`)
  if (!parsed.title || parsed.title.trim() === (item.sourceTitle || '').trim())
    throw new Error('AI returned source title unchanged')
  return parsed
}

// Title-only rewrite — for articles with good body but raw source title
async function rewriteTitleOnly(item) {
  const bodyText = (item.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 600)

  const prompt = `You write headlines for DownRange — a firearms news portal.

Write a single original DownRange headline for this article. Rules:
- Max 12 words. Active voice. Present tense when possible.
- Lead with the hardest fact: specific court, state, ATF rule, gun model, dollar amount, date.
- Good formats: "ATF Loses Fight Over Pistol Brace Rule" / "[State] Strikes Down Magazine Ban" / "Smith & Wesson Drops New .357 Revolver at $599"
- Never reuse the source title. Never use: "Game-Changer", "Landmark", "Here's Why", "Everything You Need to Know".
- Return ONLY the headline text, no quotes, no JSON, no explanation.

Source title (do NOT use): ${item.sourceTitle || item.title}
Article text: ${bodyText}`

  const raw = await callAIText({ prompt, useCase: 'fast', maxTokens: 80 })
  const title = raw.replace(/^["']|["']$/g, '').replace(/\n.*/s, '').trim()
  if (!title || title.length < 10) throw new Error(`Bad title output: "${raw.slice(0,100)}"`)
  if (title.trim().toLowerCase() === (item.sourceTitle || '').trim().toLowerCase())
    throw new Error('AI returned source title unchanged for title-only rewrite')
  return title
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
  const stats = { scanned: 0, fullRewrite: 0, titleOnly: 0, skipped: 0, failed: 0 }

  try {
    const [articles, blogs, releases, canada] = await Promise.all([
      sanity.fetch(`*[_type=="newsArticle" && defined(title) && editorLocked != true] | order(publishedAt desc) [0...${BATCH * 3}] { _id, title, sourceTitle, body, summary, description, source, externalUrl, qualityReviewed }`),
      sanity.fetch(`*[_type=="blogPost"       && defined(title) && editorLocked != true] | order(publishedAt desc) [0...20] { _id, title, sourceTitle, body, excerpt, qualityReviewed }`),
      sanity.fetch(`*[_type=="firearmRelease" && defined(brand) && editorLocked != true] | order(_createdAt desc)  [0...10] { _id, "title": brand+" "+model, body, summary, brand, model, caliber, msrp, category, qualityReviewed }`),
      sanity.fetch(`*[_type=="canadaContent"  && defined(title) && editorLocked != true] | order(_createdAt desc)  [0...10] { _id, title, sourceTitle, body, summary, type, status, qualityReviewed }`),
    ])

    const allDocs = [
      ...articles.map(d => ({ ...d, _stype: 'newsArticle' })),
      ...blogs.map(d    => ({ ...d, _stype: 'blogPost' })),
      ...releases.map(d => ({ ...d, _stype: 'firearmRelease' })),
      ...canada.map(d   => ({ ...d, _stype: 'canadaContent' })),
    ]

    stats.scanned = allDocs.length

    // Classify every doc
    const needsFullRewrite  = allDocs.filter(item => scoreBody(item.body).score < 70)
    const needsTitleRewrite = allDocs.filter(item =>
      scoreBody(item.body).score >= 70 &&           // body is fine
      titleNeedsRewrite(item.title, item.sourceTitle) // but title is raw
    )
    const fullyGood = allDocs.filter(item =>
      scoreBody(item.body).score >= 70 &&
      !titleNeedsRewrite(item.title, item.sourceTitle)
    )

    stats.skipped = fullyGood.length

    // Mark fully-good articles as reviewed
    for (const item of fullyGood.filter(i => !i.qualityReviewed)) {
      await sanity.patch(item._id).set({ qualityReviewed: true }).commit()
    }

    // Process full rewrites first (body + title), then title-only, up to BATCH total
    const fullBatch  = needsFullRewrite.slice(0, BATCH)
    const titleBatch = needsTitleRewrite.slice(0, Math.max(0, BATCH - fullBatch.length))

    // ── Full rewrites ────────────────────────────────────────────────────────
    for (const item of fullBatch) {
      try {
        const ai = await rewriteFull(item)
        await sanity.patch(item._id).set({
          body:            ai.body,
          title:           ai.title,
          ...(ai.summary ? { summary: ai.summary } : {}),
          qualityReviewed: true,
        }).commit()
        stats.fullRewrite++
        console.log(`[QR] FULL "${ai.title.slice(0,60)}"`)
      } catch (e) {
        console.error('[QR] FULL FAIL', item._id, e.message)
        stats.failed++
      }
      await new Promise(r => setTimeout(r, 800))
    }

    // ── Title-only rewrites ──────────────────────────────────────────────────
    for (const item of titleBatch) {
      try {
        const newTitle = await rewriteTitleOnly(item)
        await sanity.patch(item._id).set({
          title:           newTitle,
          qualityReviewed: true,
        }).commit()
        stats.titleOnly++
        console.log(`[QR] TITLE "${newTitle.slice(0,60)}"`)
      } catch (e) {
        console.error('[QR] TITLE FAIL', item._id, e.message)
        stats.failed++
      }
      await new Promise(r => setTimeout(r, 400))
    }

    const remainingFull  = Math.max(0, needsFullRewrite.length  - fullBatch.length)
    const remainingTitle = Math.max(0, needsTitleRewrite.length - titleBatch.length)
    const ms  = Date.now() - t0
    const msg = `Scanned ${stats.scanned} · full-rewrite ${stats.fullRewrite}/${needsFullRewrite.length} · title-only ${stats.titleOnly}/${needsTitleRewrite.length} · skipped ${stats.skipped} · failed ${stats.failed} · remaining ${remainingFull + remainingTitle}`

    await reportCronRun('quality-rewrite', { status: stats.failed > stats.fullRewrite + stats.titleOnly ? 'warning' : 'success', ms, details: msg })
    return Response.json({ ok: true, ...stats, remainingFull, remainingTitle, ms, message: msg })

  } catch (e) {
    const ms = Date.now() - t0
    await reportCronRun('quality-rewrite', { status: 'failed', ms, error: e.message })
    return Response.json({ ok: false, error: e.message, ms }, { status: 500 })
  }
}
