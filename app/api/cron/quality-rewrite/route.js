export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { reportCronRun } from '@/lib/cronReporter'
import { createClient }  from '@sanity/client'
import { callAIText }    from '@/lib/aiClient.js'
import { fetchSourceFacts } from '@/lib/sourceFacts.js'
import { THIN_CHARS, MIN_ACCEPT_WORDS, TARGET_WORDS, wordsOf } from '@/lib/articleQuality.js'

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
  // A teaser is never "good": under 250 words always needs a full rewrite (it used to score 75 and only get a new title).
  if (words.length < 250) return { score: 30, issues: [`teaser body (${words.length} words)`], words: words.length }
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
const VOICE = `DownRange firearms news. Gun owner voice. Daily carrier.

TITLE: Original headline only — never source title. Max 12 words. Active voice. Lead with hardest fact (court, state, model, price, date). No "Game-Changer"/"Landmark"/vague openers.

BANNED WORDS (fail if any appear): comprehensive, dive into, robust, seamlessly, leverage, empower, game-changer, landscape, delve, utilize, unprecedented, synergy, moving forward, it remains to be seen, stakeholders, holistic, groundbreaking, pivotal, notably, furthermore, in conclusion, in summary, a wide range of, in the realm of, when it comes to

STRUCTURE — 5 <h2> sections, each 2-3 solid paragraphs:
<h2>[Lead — hardest fact: who, what, when, where, numbers]</h2>
<h2>Key Details</h2>
<h2>Background</h2>
<h2>Why It Matters for Gun Owners</h2>
<h2>DownRange Bottom Line</h2>

STYLE: First sentence = hardest fact. Sentences avg under 15 words. Active voice. Specific names/calibers/prices. No padding.
LENGTH: ${TARGET_WORDS} words. Never under 450.`

// An article that cannot be rewritten after repeated tries and is still a teaser must not stay live.
// It is taken off the site (kept in Sanity, restorable from the admin Content Quality tab).
async function hideTeaser(item, reason) {
  const cur = await sanity.fetch('*[_id == $id][0]{ publishedAt }', { id: item._id }).catch(() => null)
  await sanity.patch(item._id)
    .set({ approved: false, qrHidden: true, qrHiddenReason: String(reason).slice(0, 300), ...(cur?.publishedAt ? { prevPublishedAt: cur.publishedAt } : {}) })
    .unset(['publishedAt']).commit()
}

// Full rewrite — body + title
async function rewriteFull(item) {
  // Work from the real source article when we have its URL. Rewriting a one-paragraph excerpt
  // cannot produce a 500-word article, which is how thin articles stayed thin.
  const own = (item.body || item.summary || item.description || '').replace(/<[^>]+>/g, '').slice(0, 2000)
  const facts = await fetchSourceFacts(item.externalUrl || item.sourceUrl, { maxChars: 4000 })
  const src = facts || own
  if (src.length < 600 && (item._stype === 'newsArticle' || item._stype === 'canadaContent'))
    throw new Error('not enough source material to write a full article (source page unreadable)')
  const typeLabel = { newsArticle:'news article', blogPost:'blog post', firearmRelease:'gun release article', canadaContent:'Canada firearms article' }[item._stype] || 'article'

  const prompt = `${VOICE}

Rewrite this ${typeLabel} for DownRange as original reporting and analysis built on the facts below (names, numbers, dates, places). Do not copy sentences or the source structure. Must be ${TARGET_WORDS} words. Must have 5 <h2> sections (lead, Key Details, Background, Why It Matters for Gun Owners, DownRange Bottom Line). If the source facts are thin, spend the words on background and analysis you are sure of; never invent facts, quotes or numbers. Must NOT use any banned words.

Source title (do NOT use this as your headline): ${item.sourceTitle || item.title || ''}
Source URL: ${item.externalUrl || item.sourceUrl || ''}
Content: ${src}

Respond ONLY with valid JSON, no markdown fences, no preamble:
{"title":"original DownRange headline max 12 words","body":"<full HTML with 5 h2 sections, ${TARGET_WORDS} words>","summary":"2-3 sentence plain text under 300 chars"}`

  const ask = async (extra = '') => {
    const raw   = await callAIText({ prompt: prompt + extra, useCase: 'backfill', maxTokens: 6000 })
    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const m     = clean.match(/\{[\s\S]*\}/)
    if (!m) throw new Error(`The AI did not return an article. It said: ${clean.slice(0, 1200)}`)
    try { return JSON.parse(m[0]) } catch (e) { throw new Error(`The AI returned malformed JSON (${e.message}). Start of reply: ${clean.slice(0, 400)}`) }
  }
  let parsed = await ask()
  // One expansion pass when the draft comes back short.
  const firstWords = wordsOf(parsed.body)
  if (firstWords < MIN_ACCEPT_WORDS) {
    try {
      const again = await ask(`\n\nYOUR PREVIOUS DRAFT WAS ONLY ${firstWords} WORDS. Write it again at ${TARGET_WORDS} words with all 5 sections, expanding Key Details, Background and the analysis with facts you are sure of. Same JSON shape.`)
      if (wordsOf(again.body) > firstWords) parsed = again
    } catch { /* keep the first draft; the length check below decides */ }
  }

  const { score, issues } = scoreBody(parsed.body || '')
  const wordCount = (parsed.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  if (wordCount < MIN_ACCEPT_WORDS) throw new Error(`The AI could only write ${wordCount} words from this source (${src.length} characters of source text were readable, ${MIN_ACCEPT_WORDS}+ words needed). The page is probably paywalled, too short or not really a firearms story. Hide it from the site or edit it by hand.`)
  if (score < 70) throw new Error(`Output still fails quality (score=${score}): ${issues.join(', ')}`)
  if (wordCount < MIN_ACCEPT_WORDS) throw new Error(`Too short: ${wordCount} words (need ${MIN_ACCEPT_WORDS}+)`)
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

  const BATCH = 30
  // Targeted rewrite: ?slug=<slug> (or ?id=<_id>) rewrites that one article now, regardless of review state.
  const qs = new URL(req.url).searchParams
  if (qs.get('slug') || qs.get('id')) {
    const doc = await sanity.fetch(`*[_type=="newsArticle" && (slug.current==$slug || _id==$id)][0]{ _id, title, sourceTitle, body, summary, description, source, externalUrl, qrHidden, prevPublishedAt }`, { slug: qs.get('slug') || '', id: qs.get('id') || '' })
    if (!doc) return Response.json({ ok: false, error: 'article not found' }, { status: 404 })
    try {
      const ai = await rewriteFull({ ...doc, _stype: 'newsArticle' })
      let patch = sanity.patch(doc._id).set({ body: ai.body, title: ai.title, ...(ai.summary ? { summary: ai.summary, excerpt: ai.summary } : {}), qualityReviewed: true, qrAttempts: 0 })
      // A hidden article that now has a real body goes back on the site.
      if (doc.qrHidden) patch = patch.set({ approved: true, publishedAt: doc.prevPublishedAt || new Date().toISOString() }).unset(['qrHidden', 'qrHiddenReason', 'prevPublishedAt'])
      await patch.commit()
      return Response.json({ ok: true, id: doc._id, title: ai.title, words: ai.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length })
    } catch (e) { return Response.json({ ok: false, error: e.message }, { status: 502 }) }
  }
  const stats = { scanned: 0, fullRewrite: 0, titleOnly: 0, skipped: 0, failed: 0 }

  try {
    const [articles, blogs, releases, canada, staleBacklog] = await Promise.all([
      sanity.fetch(`*[_type=="newsArticle" && defined(title) && editorLocked != true && qrHidden != true] | order(publishedAt desc) [0...${BATCH * 2}] { _id, title, sourceTitle, body, summary, description, source, externalUrl, qualityReviewed, qrAttempts, qrLastTryAt }`),
      sanity.fetch(`*[_type=="blogPost"       && defined(title) && editorLocked != true] | order(publishedAt desc) [0...10] { _id, title, sourceTitle, body, excerpt, qualityReviewed }`),
      Promise.resolve([]),
      sanity.fetch(`*[_type=="canadaContent"  && defined(title) && editorLocked != true] | order(_createdAt desc)  [0...5]  { _id, title, sourceTitle, body, summary, type, status, qualityReviewed }`),
      // ── BACKLOG DRAIN ──────────────────────────────────────────────────────
      // The freshness query above orders by publishedAt desc, which is the
      // RSS source's original publish date, not ingestion time. An article
      // with an older publishedAt gets permanently pushed out of that top-N
      // window by newer articles and NEVER gets picked up, no matter how
      // often this cron runs. This explicit query targets missing bodies
      // directly, with no recency assumption, oldest first (FIFO), so the
      // backlog actually drains instead of accumulating forever.
      sanity.fetch(`*[_type=="newsArticle" && defined(title) && editorLocked != true && qrHidden != true && (!defined(body) || length(body) < ${THIN_CHARS})] | order(_createdAt desc) [0...${BATCH}] { _id, title, sourceTitle, body, summary, description, source, externalUrl, qualityReviewed, qrAttempts, qrLastTryAt }`),
    ])

    const seen = new Set()
    const allDocs = []
    for (const d of [
      ...articles.map(d => ({ ...d, _stype: 'newsArticle' })),
      ...blogs.map(d    => ({ ...d, _stype: 'blogPost' })),
      ...releases.map(d => ({ ...d, _stype: 'firearmRelease' })),
      ...canada.map(d   => ({ ...d, _stype: 'canadaContent' })),
      ...staleBacklog.map(d => ({ ...d, _stype: 'newsArticle' })),
    ]) {
      if (seen.has(d._id)) continue
      seen.add(d._id)
      allDocs.push(d)
    }

    // Cool-off: an article that failed 3 times (unreadable source, AI error) is parked for 24h so it
    // cannot block the queue, then retried. Everything else keeps flowing.
    const cooling = d => (d.qrAttempts || 0) >= 3 && d.qrLastTryAt && Date.now() - new Date(d.qrLastTryAt).getTime() < 24 * 3600 * 1000
    if (qs.get('force') !== '1') for (let i = allDocs.length - 1; i >= 0; i--) if (cooling(allDocs[i])) allDocs.splice(i, 1)
    stats.scanned = allDocs.length

    // ── EARLY EXIT: skip AI entirely if nothing needs work ────────────────────
    // Prevents ghost invocations — tokens burned re-evaluating already-good articles.
    // Returns immediately when qualityReviewed is already set on all fetched docs.
    const unreviewed = allDocs.filter(d => !d.qualityReviewed || scoreBody(d.body).score < 70)
    if (unreviewed.length === 0) {
      const ms = Date.now() - t0
      console.log(`[QR] Early exit — all ${allDocs.length} docs already reviewed`)
      await reportCronRun('quality-rewrite', { status: 'success', ms, details: `skipped — queue empty (${allDocs.length} docs already reviewed)` })
      return Response.json({ ok: true, skipped: allDocs.length, fullRewrite: 0, titleOnly: 0, failed: 0, ms, message: 'queue empty — nothing to rewrite' })
    }


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
    const DEADLINE = t0 + 230000 // stay well inside maxDuration so the run is always reported
    stats.errors = []
    const doFull = async (item) => {
      if (Date.now() > DEADLINE) return
      try {
        const ai = await rewriteFull(item)
        await sanity.patch(item._id).set({
          body:            ai.body,
          title:           ai.title,
          ...(ai.summary ? { summary: ai.summary } : {}),
          qualityReviewed: true,
          qrAttempts: 0,
        }).commit()
        stats.fullRewrite++
        console.log(`[QR] FULL "${ai.title.slice(0,60)}"`)
      } catch (e) {
        console.error('[QR] FULL FAIL', item._id, e.message)
        // Never save the raw RSS excerpt as the body: that is what produced one-paragraph articles.
        // The article stays queued and is retried on the next run.
        await sanity.patch(item._id).set({ qrAttempts: (item.qrAttempts || 0) + 1, qrLastTryAt: new Date().toISOString() }).commit().catch(() => {})
        stats.failed++
        if (item._stype === 'newsArticle' && (item.qrAttempts || 0) + 1 >= 3 && wordsOf(item.body) < 250) {
          await hideTeaser(item, `Could not be rewritten after 3 tries: ${String(e.message).slice(0, 200)}`).catch(() => {})
          stats.hidden = (stats.hidden || 0) + 1
        }
        if (stats.errors.length < 10) stats.errors.push(`${(item.title || item._id).slice(0, 50)}: ${String(e.message).slice(0, 90)}`)
      }
    }
    // Three at a time: each rewrite spends most of its time waiting on the source page and the model.
    const queue = [...fullBatch]
    await Promise.all([0, 1, 2].map(async () => { while (queue.length && Date.now() < DEADLINE) await doFull(queue.shift()) }))

    // ── Title-only rewrites ──────────────────────────────────────────────────
    for (const item of titleBatch) {
      if (Date.now() > DEADLINE) break
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

    await reportCronRun('quality-rewrite', { status: stats.failed > 0 && stats.fullRewrite + stats.titleOnly === 0 ? 'failed' : stats.failed > stats.fullRewrite + stats.titleOnly ? 'warning' : 'success', ms, details: msg, error: stats.failed > 0 && stats.fullRewrite + stats.titleOnly === 0 ? msg : null })
    return Response.json({ ok: true, ...stats, remainingFull, remainingTitle, ms, message: msg })

  } catch (e) {
    const ms = Date.now() - t0
    await reportCronRun('quality-rewrite', { status: 'failed', ms, error: e.message })
    return Response.json({ ok: false, error: e.message, ms }, { status: 500 })
  }
}
