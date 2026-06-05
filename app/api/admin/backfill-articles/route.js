import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { reportCronRun } from '@/lib/cronReporter'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// ── VOICE RULES injected into every prompt ────────────────────────────────
const VOICE = `
VOICE & STYLE — NON-NEGOTIABLE:
Write like a gun owner who carries daily, reads 2A case law, and worked a gun counter.
Real. Direct. Specific. Active voice only.

COPYRIGHT RULES — MANDATORY:
- Create a NEW article using only FACTS from the source — not the source's words or structure.
- Do NOT do a paragraph-by-paragraph rewrite of any single source.
- Do NOT mirror the original article's structure, flow, or narrative sequence.
- Keep the original article useful — don't replace it, summarize it and add DownRange analysis.
- Source input is limited to key facts only. Build your own narrative around them.

BANNED WORDS (instant failure):
comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower,
game-changer, landscape, navigate, delve, utilize, innovative, unprecedented,
paradigm, synergy, moving forward, shed light on, it remains to be seen,
stakeholders, holistic, takeaway, unpack, explore, groundbreaking, crucial,
pivotal, significant development, notably, it worth noting, furthermore,
in conclusion, in summary, at the end of the day, a wide range of.

STYLE RULES:
- Start with the hardest fact. Short sentences. Max 15 words avg.
- Named people with full names first mention. Then last name only.
- Dollar amounts, calibers, dates — always specific. Never approximate.
- Opinions expected in the analysis section. State them plainly.
- No padded intros. No "In recent months..." or "There has been..."
`

// ── CONTENT TYPE CONFIGS ──────────────────────────────────────────────────
const TYPES = {
  newsArticle: {
    label: 'News Article',
    query: (force, limit) => {
      const f = force
        ? '_type == "newsArticle" && defined(title) && editorLocked != true'
        : '_type == "newsArticle" && defined(title) && (!defined(body) || length(body) < 100) && editorLocked != true'
      return `*[${f}] | order(_createdAt desc) [0...${limit}] { _id, title, summary, excerpt, body, source, category, publishedAt, externalUrl, tags }`
    },
    countQuery: (force) => {
      const f = force
        ? '_type == "newsArticle" && defined(title) && editorLocked != true'
        : '_type == "newsArticle" && defined(title) && (!defined(body) || length(body) < 100) && editorLocked != true'
      return `count(*[${f}])`
    },
    buildPrompt: (item) => `
You are writing a news article for DownRange, a firearms and Second Amendment news site.
${VOICE}

MANDATORY ARTICLE STRUCTURE (HTML, 500-750 words):
Build in DownRange's own structure — not based on the source article's structure:

<h2>[Original headline — key fact in DownRange's own words, not a copy of source title]</h2>
<p>[Lead: 80-100 words. Essential facts: who, what, when, where. Original phrasing only.]</p>
<h2>Key Details</h2>
<p>[80-120 words. 3-4 specific facts or developments. Numbers, names, dates, outcomes. Use ul/li if listing.]</p>
<h2>Why It Matters for Gun Owners</h2>
<p>[100-130 words. Practical impact on carry, purchase, ownership, rights. Which states. What to do. ORIGINAL — not from source.]</p>
<h2>DownRange Analysis</h2>
<p>[80-110 words. Original DownRange perspective. Bruen/Heller implications, market impact, what a serious gun owner should do right now. Pure original commentary.]</p>
SOURCE MATERIAL:
Title: ${item.title}
Source: ${item.source || 'Unknown'}
Category: ${item.category || 'news'}
Summary: ${item.summary || 'N/A'}
Key facts from existing content (use only as fact source, not writing template): ${(item.body || item.summary || '').replace(/<[^>]+>/g, '').slice(0, 400)}

Return ONLY valid JSON: { "title": "Rewritten headline — DownRange phrasing, max 12 words, NOT the source title", "summary": "2-3 sentence plain summary under 350 chars", "body": "<full HTML article>" }
`,
    patch: (ai) => ({ ...(ai.title ? { title: ai.title } : {}), body: ai.body, summary: ai.summary }),
  },

  blogPost: {
    label: 'Blog Post',
    query: (force, limit) => {
      const f = force
        ? '_type == "blogPost" && defined(title) && editorLocked != true'
        : '_type == "blogPost" && defined(title) && (!defined(body) || length(body) < 100) && editorLocked != true'
      return `*[${f}] | order(publishedAt desc) [0...${limit}] { _id, title, excerpt, body, category, tags }`
    },
    countQuery: (force) => {
      const f = force
        ? '_type == "blogPost" && defined(title) && editorLocked != true'
        : '_type == "blogPost" && defined(title) && (!defined(body) || length(body) < 100) && editorLocked != true'
      return `count(*[${f}])`
    },
    buildPrompt: (item) => `
You are writing an opinion/analysis blog post for DownRange, a firearms and Second Amendment site.
${VOICE}

BLOG POST STRUCTURE (HTML, 600-900 words):
<h2>[Post title restated as a clear statement]</h2>
<p>[Opening: 80-100 words. Personal take. Why this matters to a gun owner right now.]</p>
<h2>[Second section heading — topic specific]</h2>
<p>[150-200 words. Argument or analysis with specifics.]</p>
<h2>[Third section heading]</h2>
<p>[150-200 words. Counter-argument or deeper detail.]</p>
<h2>Bottom Line</h2>
<p>[80-100 words. What to do or think. Actionable if possible.]</p>

The tone is: a knowledgeable gun owner talking to other gun owners. Not a journalist. Not a politician. Someone who has carried for 10 years and is annoyed by bad policy.

SOURCE MATERIAL:
Title: ${item.title}
Category: ${item.category || 'general'}
Excerpt: ${item.excerpt || 'N/A'}
Existing body: ${(item.body || '').replace(/<[^>]+>/g, '').slice(0, 400)}

Return ONLY valid JSON: { "body": "<full HTML blog post>", "excerpt": "1 sentence hook under 200 chars" }
`,
    patch: (ai) => ({ body: ai.body, excerpt: ai.excerpt }),
  },

  firearmRelease: {
    label: 'Gun Release',
    query: (force, limit) => {
      const f = force
        ? '_type == "firearmRelease" && defined(brand) && editorLocked != true'
        : '_type == "firearmRelease" && defined(brand) && (!defined(body) || length(body) < 100) && editorLocked != true'
      return `*[${f}] | order(_createdAt desc) [0...${limit}] { _id, brand, model, caliber, action, msrp, category, summary, body, description, pressReleaseExcerpt, specUrl }`
    },
    countQuery: (force) => {
      const f = force
        ? '_type == "firearmRelease" && defined(brand) && editorLocked != true'
        : '_type == "firearmRelease" && defined(brand) && (!defined(body) || length(body) < 100) && editorLocked != true'
      return `count(*[${f}])`
    },
    buildPrompt: (item) => `
You are writing a gun product article for DownRange, a firearms news site.
${VOICE}

Write a product article for the ${item.brand} ${item.model}. This is not marketing copy — it's an honest assessment for gun owners deciding whether to buy it.

STRUCTURE (HTML, 500-700 words):
<h2>${item.brand} ${item.model}: [One-line honest verdict]</h2>
<p>[Opening: 80-100 words. What this gun is, who it's for, what makes it worth talking about — or not.]</p>
<h2>Specs That Matter</h2>
<p>[80-100 words. Caliber, capacity, weight, barrel length, MSRP. Only real numbers. Skip any you don't know.]</p>
<h2>In the Field</h2>
<p>[120-150 words. Who would actually carry or use this. Comparable guns. Where it fits in the market.]</p>
<h2>DownRange Take</h2>
<p>[80-100 words. Honest opinion. Is it worth $${item.msrp || '?'}? Who should buy it? Who shouldn't?]</p>

PRODUCT DATA:
Brand: ${item.brand}
Model: ${item.model}
Caliber: ${item.caliber || 'Unknown'}
Action: ${item.action || 'Unknown'}
MSRP: $${item.msrp || 'Unknown'}
Category: ${item.category || 'Pistol'}
Summary: ${item.summary || item.description || 'N/A'}
Press excerpt: ${item.pressReleaseExcerpt || 'N/A'}

Return ONLY valid JSON: { "body": "<full HTML article>", "summary": "1-2 sentence plain description under 300 chars" }
`,
    patch: (ai) => ({ body: ai.body, summary: ai.summary }),
  },

  canadaContent: {
    label: 'Canada Article',
    query: (force, limit) => {
      const f = force
        ? '_type == "canadaContent" && defined(title) && editorLocked != true'
        : '_type == "canadaContent" && defined(title) && (!defined(body) || length(body) < 400) && editorLocked != true'
      return `*[${f}] | order(_createdAt desc) [0...${limit}] { _id, title, type, summary, detail, body, status, impact, effectiveDate }`
    },
    countQuery: (force) => {
      const f = force
        ? '_type == "canadaContent" && defined(title) && editorLocked != true'
        : '_type == "canadaContent" && defined(title) && (!defined(body) || length(body) < 400) && editorLocked != true'
      return `count(*[${f}])`
    },
    buildPrompt: (item) => `
You are writing a Canadian firearms law analysis for DownRange.
${VOICE}

Canadian gun owners deal with C-21, PAL licensing, prohibited/restricted/non-restricted classifications, and provincial variations. Write for someone who has a PAL and is frustrated with how Canada treats firearms ownership.

STRUCTURE (HTML, 400-600 words):
<h2>${item.title}</h2>
<p>[Opening: 60-80 words. What this law/policy/event is. Who it affects. Status.]</p>
<h2>What It Does</h2>
<p>[100-130 words. Specific provisions. Who gets affected. Timelines.]</p>
<h2>PAL Holder Impact</h2>
<p>[100-130 words. Practical effect on ownership, transport, purchase, storage.]</p>
<h2>DownRange Take</h2>
<p>[60-80 words. Honest read on whether this is constitutional overreach or legitimate policy.]</p>

SOURCE MATERIAL:
Title: ${item.title}
Type: ${item.type || 'legislation'}
Status: ${item.status || 'N/A'}
Impact: ${item.impact || 'N/A'}
Summary: ${item.summary || 'N/A'}
Detail: ${item.detail || 'N/A'}
Existing body: ${(item.body || '').replace(/<[^>]+>/g, '').slice(0, 400)}

Return ONLY valid JSON: { "body": "<full HTML article>", "summary": "2 sentence plain summary under 300 chars" }
`,
    patch: (ai) => ({ body: ai.body, summary: ai.summary }),
  },
}

async function rewriteItem(item, typeConfig) {
  const prompt = typeConfig.buildPrompt(item)
  const raw = await callAIText({ prompt, useCase: 'backfill', maxTokens: 2000 })
  const clean = raw.split('```json').join('').split('```').join('').trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch {
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) parsed = JSON.parse(m[0])
    else throw new Error('JSON parse failed')
  }

  if (!parsed.body || typeof parsed.body !== 'string') throw new Error('No body in response')
  if (parsed.body.length < 300) throw new Error('Body too short: ' + parsed.body.length)
  return parsed
}

export async function POST(req) {
  const t0 = Date.now()
  try {
    const adminKey   = process.env.ADMIN_KEY
    const cronSecret = process.env.CRON_SECRET
    const xKey       = req.headers.get('x-admin-key') || ''
    const bearer     = req.headers.get('authorization') || ''
    const validAdmin = adminKey && (xKey === adminKey || bearer === 'Bearer ' + adminKey)
    const validCron  = cronSecret && bearer === 'Bearer ' + cronSecret
    const isCronCall = req.headers.get('x-vercel-cron') === '1'
    if (adminKey && !validAdmin && !validCron && !isCronCall) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url    = new URL(req.url)
    const limit  = Math.min(25, Math.max(1, parseInt(url.searchParams.get('limit') || '5')))
    const force  = url.searchParams.get('force') === 'true'
    const singleId = url.searchParams.get('id') || null
    // Which content types to process — default all
    const types  = (url.searchParams.get('types') || 'newsArticle,blogPost,firearmRelease,canadaContent').split(',')

    // Single article rewrite mode
    if (singleId) {
      const item = await sanity.fetch(`*[_id == $id][0]{ _id, _type, title, summary, excerpt, body, source, category, publishedAt, tags, brand, model, caliber, action, msrp, description, pressReleaseExcerpt }`, { id: singleId })
      if (!item) return Response.json({ ok: false, error: 'Article not found' }, { status: 404 })
      const tc = TYPES[item._type]
      if (!tc) return Response.json({ ok: false, error: `No rewrite config for type: ${item._type}` })
      try {
        const prompt = tc.buildPrompt(item)
        const raw    = await callAIText({ prompt, useCase: 'backfill', maxTokens: 2500 })
        const clean  = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
        const ai     = JSON.parse(clean)
        const patch  = tc.patch(ai)
        await sanity.patch(singleId).set({ ...patch, qualityReviewed: false, autoGenerated: true }).commit()
        return Response.json({ ok: true, done: 1, id: singleId, type: item._type })
      } catch(e) {
        return Response.json({ ok: false, error: e.message }, { status: 500 })
      }
    }

    // Gather items from all requested types
    const allItems = []
    const counts   = {}

    for (const typeName of types) {
      const tc = TYPES[typeName]
      if (!tc) continue
      try {
        const q  = tc.query(force, limit)
        const cq = tc.countQuery(force)
        const [items, total] = await Promise.all([sanity.fetch(q), sanity.fetch(cq)])
        counts[typeName] = total
        for (const item of items) allItems.push({ item, typeName, tc })
      } catch (e) {
        console.error('[BACKFILL] query failed for', typeName, e.message)
      }
    }

    if (!allItems.length) {
      return Response.json({ done: 0, failed: 0, remaining: 0, counts, message: 'All content already meets standards.' })
    }

    const results = []
    for (const { item, typeName, tc } of allItems) {
      const ts = Date.now()
      const label = item.title || `${item.brand || ''} ${item.model || ''}`.trim() || item._id
      try {
        const ai    = await rewriteItem(item, tc)
        const patch = { ...tc.patch(ai), qualityReviewed: true }
        await sanity.patch(item._id).set(patch).commit()
        const words = ai.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
        results.push({ id: item._id, type: typeName, title: label.slice(0, 60), status: 'done', words, ms: Date.now() - ts })
      } catch (e) {
        console.error('[BACKFILL] failed:', label, e.message)
        results.push({ id: item._id, type: typeName, title: label.slice(0, 60), status: 'failed', error: e.message, ms: Date.now() - ts })
      }
      // Rate limit — don't hammer the AI
      if (allItems.indexOf(allItems.find(x => x.item._id === item._id)) < allItems.length - 1) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    const done   = results.filter(r => r.status === 'done').length
    const failed = results.filter(r => r.status === 'failed').length
    const byType = {}
    for (const r of results) {
      if (!byType[r.type]) byType[r.type] = { done:0, failed:0 }
      byType[r.type][r.status === 'done' ? 'done' : 'failed']++
    }
    const avgWords = done > 0
      ? Math.round(results.filter(r => r.words).reduce((s, r) => s + r.words, 0) / done)
      : 0
    const totalRemaining = Object.values(counts).reduce((a, b) => a + b, 0) - done

    const msg = `${done} rewritten (avg ${avgWords} words). ${failed > 0 ? failed + ' failed. ' : ''}${totalRemaining > done ? (totalRemaining - done) + ' still remaining.' : 'Batch complete.'}`

    await reportCronRun('backfill', { status: 'success', ms: Date.now() - t0, details: msg }).catch(() => {})
    return Response.json({ done, failed, total: allItems.length, remaining: Math.max(0, totalRemaining - done), avgWords, counts, byType, ms: Date.now() - t0, results, message: msg })

  } catch (e) {
    console.error('[BACKFILL] crash:', e.message)
    await reportCronRun('backfill', { status: 'failed', ms: Date.now() - t0, error: e.message }).catch(() => {})
    return Response.json({ error: 'Crashed: ' + e.message }, { status: 500 })
  }
}

export async function GET(req) { return POST(req) }
