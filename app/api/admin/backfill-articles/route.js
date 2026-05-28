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
You are a gun owner who carries daily, reads 2A case law, and has worked a gun counter.
Write exactly like that person. Real. Direct. Specific.

BANNED WORDS/PHRASES (instant failure if used):
comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower,
game-changer, landscape, navigate, delve, utilize, innovative, unprecedented,
paradigm, synergy, moving forward, shed light on, it remains to be seen,
stakeholders, holistic, takeaway, unpack, explore, groundbreaking, crucial,
pivotal, significant development, notably, it's worth noting, furthermore,
in conclusion, in summary, in the realm of, at the end of the day,
when it comes to, a wide range of, it is important to note.

RULES:
- Start with the hardest fact. Not background. Not context. The news.
- Short sentences. 15 words max per sentence on average.
- Named people with full names first mention. Then last name only.
- Dollar amounts, calibers, round counts, dates — always specific.
- If you don't know a spec, leave it out. Never approximate.
- Opinions are allowed and expected. State them plainly.
- Active voice only. "ATF denied the permit." Not "The permit was denied."
- No padded intro paragraph. No "In recent months..." or "There has been..."
- No closing "stay tuned" or "time will tell" filler.
`

// ── CONTENT TYPE CONFIGS ──────────────────────────────────────────────────
const TYPES = {
  newsArticle: {
    label: 'News Article',
    query: (force, limit) => {
      const f = force
        ? '_type == "newsArticle" && defined(title)'
        : '_type == "newsArticle" && defined(title) && (!defined(body) || length(body) < 600)'
      return `*[${f}] | order(publishedAt desc) [0...${limit}] { _id, title, summary, excerpt, body, source, category, publishedAt, tags }`
    },
    countQuery: (force) => {
      const f = force
        ? '_type == "newsArticle" && defined(title)'
        : '_type == "newsArticle" && defined(title) && (!defined(body) || length(body) < 600)'
      return `count(*[${f}])`
    },
    buildPrompt: (item) => `
You are writing a news article for DownRange, a firearms and Second Amendment news site.
${VOICE}

ARTICLE STRUCTURE (HTML, min 800 words):
<h2>[Restate the headline as a declarative fact — not a question]</h2>
<p>[Opening: 120-150 words. Lead with the single hardest fact. Who did what, where, when, what it means.]</p>
<h2>Background and Context</h2>
<p>[130-160 words. What led to this. Prior rulings, bills, incidents. Specific names and dates.]</p>
<h2>What This Means for Gun Owners</h2>
<p>[130-160 words. Practical impact on carry, purchase, ownership. Which states. Which guns. Be specific.]</p>
<h2>Industry Impact</h2>
<p>[110-140 words. Manufacturers, dealers, distributors affected. Any companies named in the news.]</p>
<h2>What to Watch Next</h2>
<p>[110-140 words. Upcoming court dates, votes, deadlines. Specific dates if known.]</p>
<p><strong>DownRange Bottom Line:</strong> [2-3 sentences. Plain opinion. What gun owners should do or think about this.]</p>

SOURCE MATERIAL:
Title: ${item.title}
Source: ${item.source || 'Unknown'}
Category: ${item.category || 'news'}
Summary: ${item.summary || 'N/A'}
Existing body (may need full rewrite): ${(item.body || '').replace(/<[^>]+>/g, '').slice(0, 800)}

Return ONLY valid JSON: { "summary": "2-3 sentence plain summary under 350 chars", "body": "<full HTML article>" }
`,
    patch: (ai) => ({ body: ai.body, summary: ai.summary }),
  },

  blogPost: {
    label: 'Blog Post',
    query: (force, limit) => {
      const f = force
        ? '_type == "blogPost" && defined(title)'
        : '_type == "blogPost" && defined(title) && (!defined(body) || length(body) < 600)'
      return `*[${f}] | order(publishedAt desc) [0...${limit}] { _id, title, excerpt, body, category, tags }`
    },
    countQuery: (force) => {
      const f = force
        ? '_type == "blogPost" && defined(title)'
        : '_type == "blogPost" && defined(title) && (!defined(body) || length(body) < 600)'
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
Existing body: ${(item.body || '').replace(/<[^>]+>/g, '').slice(0, 600)}

Return ONLY valid JSON: { "body": "<full HTML blog post>", "excerpt": "1 sentence hook under 200 chars" }
`,
    patch: (ai) => ({ body: ai.body, excerpt: ai.excerpt }),
  },

  firearmRelease: {
    label: 'Gun Release',
    query: (force, limit) => {
      const f = force
        ? '_type == "firearmRelease" && defined(brand)'
        : '_type == "firearmRelease" && defined(brand) && (!defined(body) || length(body) < 600)'
      return `*[${f}] | order(_createdAt desc) [0...${limit}] { _id, brand, model, caliber, action, msrp, category, summary, body, description, pressReleaseExcerpt, specUrl }`
    },
    countQuery: (force) => {
      const f = force
        ? '_type == "firearmRelease" && defined(brand)'
        : '_type == "firearmRelease" && defined(brand) && (!defined(body) || length(body) < 600)'
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
        ? '_type == "canadaContent" && defined(title)'
        : '_type == "canadaContent" && defined(title) && (!defined(body) || length(body) < 400)'
      return `*[${f}] | order(_createdAt desc) [0...${limit}] { _id, title, type, summary, detail, body, status, impact, effectiveDate }`
    },
    countQuery: (force) => {
      const f = force
        ? '_type == "canadaContent" && defined(title)'
        : '_type == "canadaContent" && defined(title) && (!defined(body) || length(body) < 400)'
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
  const raw = await callAIText({ prompt, useCase: 'backfill', maxTokens: 4000 })
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
  // Append attribution block
  parsed.body += `\n<div class="dr-source-attribution" style="margin:2.5rem 0 0;padding:1.25rem 1.5rem;background:rgba(200,146,42,0.06);border:1px solid rgba(200,146,42,0.25);border-left:4px solid #C8922A"><div style="font-family:monospace;font-size:0.65rem;color:#C8922A;letter-spacing:0.15em;font-weight:700;margin-bottom:6px">ORIGINAL SOURCE</div><p style="font-family:monospace;font-size:0.8rem;color:#6B7280;line-height:1.6;margin:0">This editorial was written by DownRange based on the original article. Read the primary source for additional detail.</p></div>`
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
    // Which content types to process — default all
    const types  = (url.searchParams.get('types') || 'newsArticle,blogPost,firearmRelease,canadaContent').split(',')

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
