export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/admin/backfill-articles?batch=10&force=false
 *
 * Rewrites ALL articles that:
 *   - Have no body, OR
 *   - Have body shorter than 500 chars (truncated/summary-only), OR
 *   - Have body that doesn't contain an <h2> (not a full editorial)
 *
 * force=true  → rewrites ALL articles regardless of body length
 * batch=N     → articles per call (default 10, max 20)
 *
 * Returns { done, failed, remaining, total, results, message }
 * Call repeatedly until remaining === 0.
 */

import { createClient } from '@sanity/client'
import axios from 'axios'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// ── Full article rewriter ─────────────────────────────────────────────────────

async function rewriteArticle(article) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set in Vercel env vars')

  const inputContent = [
    article.body && article.body.length > 50 ? `Existing draft: ${article.body.replace(/<[^>]+>/g,'').slice(0,1000)}` : '',
    article.summary ? `Summary: ${article.summary}` : '',
    article.excerpt ? `Excerpt: ${article.excerpt}` : '',
  ].filter(Boolean).join('\n\n').slice(0, 3000)

  const prompt = `Write a DownRange article. DownRange is a firearms and Second Amendment portal run by DJ Cavalcanti, a gun owner based in Washington State.

WRITING RULES — violating these ruins the article:
- Write like a person, not a content generator. Direct sentences. Active voice. Specific facts.
- BANNED WORDS: comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, shed light on, it remains to be seen, stakeholders, holistic, takeaway, unpack, explore
- NO padded openings. Start with the hardest fact. First sentence names who did what.
- NO hedging: may potentially, could possibly, appears to suggest. State facts as facts.
- NO passive when active works. The governor signed the bill — not the bill was signed.
- NO empty transitions: Furthermore, Additionally, Moreover, In light of this.
- Short sentences that land. Named people, numbered laws, dollar amounts, calibers.
- Opinions go in Bottom Line only. State them plainly.

GOOD OPENING: "The ATF reversed course on pistol braces Thursday, rescinding the rule that reclassified millions of pistols as short-barreled rifles."
BAD OPENING: "In a significant development with far-reaching implications for the firearms community..."

Return ONLY a valid JSON object:

"summary": 2-3 sentences. Key facts and why it matters to gun owners. Max 350 characters. No AI phrases.

"body": Complete article as HTML. MANDATORY STRUCTURE:

<h2>${article.title}</h2>
<p>[Opening: hard news. Names, agencies, bill numbers, calibers, dollar amounts. First sentence is the full story. 120-150 words.]</p>

<h2>Background and Context</h2>
<p>[Why this matters in the broader 2A landscape. Reference Heller, Bruen, McDonald, prior laws, agency history as relevant. 130-160 words.]</p>

<h2>What This Means for Gun Owners</h2>
<p>[Direct, specific impact. Which states, which products, what dollar amounts, what they can do. 130-160 words.]</p>

<h2>Industry Impact</h2>
<p>[Manufacturer, dealer, retailer effects. Or advocacy group positions from NRA, GOA, SAF, FPC — their actual stated positions. 110-140 words.]</p>

<h2>What to Watch Next</h2>
<p>[Forward-looking specifics: court dates, hearing dates, comment periods, bill markups. Name the judges, circuits, committees. 110-140 words.]</p>

<p><strong>DownRange Bottom Line:</strong> [2-3 sentences. Direct editorial verdict. What should a serious gun owner do right now? State an opinion plainly.]</p>

REQUIREMENTS:
- Minimum 750 words. Target 900-1100 words.
- HTML ONLY: h2, p, strong, em, ul, li. No div, span, br.

SOURCE MATERIAL:
Title: ${article.title}
Source Publication: ${article.source || "Unknown"}
Category: ${article.category || "news"}
Published: ${article.publishedAt || "Recent"}
Tags: ${(article.tags || []).join(", ") || "none"}

${inputContent}

CRITICAL: Return ONLY a valid JSON object with fields: summary, body, category, urgencyScore (1-10), tags (array), relatedStates (array), isBreaking (bool). Start with { end with }. No markdown fences. Escape all quotes in the HTML body string.
`

  const res = await axios.post('https://api.anthropic.com/v1/messages', {
    model:      'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages:   [{ role: 'user', content: prompt }],
  }, {
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    timeout: 90000,
  })

  const raw   = res.data.content?.[0]?.text || ''
  const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    // Try to extract JSON if there's surrounding text
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
    else throw new Error(`JSON parse failed: ${e.message} | raw: ${clean.slice(0, 200)}`)
  }

  if (typeof parsed.body !== 'string') throw new Error('body field is not a string')
  if (parsed.body.length < 400)        throw new Error(`Body too short: ${parsed.body.length} chars`)
  if (!parsed.body.includes('<h2>'))   throw new Error(`Body missing h2 sections: ${parsed.body.slice(0, 100)}`)

  return parsed
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req) {
  // Auth
  // Accept both x-admin-key header and Bearer token for backwards compat
  const adminKey = process.env.ADMIN_KEY
  const xKey     = req.headers.get('x-admin-key')
  const bearer   = req.headers.get('authorization')
  const authed   = !adminKey || xKey === adminKey || bearer === `Bearer ${adminKey}`
  if (!authed) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const batchSize = Math.min(20, Math.max(1, parseInt(searchParams.get('batch') || '10')))
  const force     = searchParams.get('force') === 'true'
  const t         = Date.now()

  // GROQ filter: articles missing full body
  const filter = force
    ? `_type == "newsArticle" && approved == true`
    : `_type == "newsArticle" && approved == true && (
        !defined(body) ||
        body == null ||
        body == "" ||
        length(body) < 500 ||
        !defined(body) ||
        !contains(body, "<h2>")
      )`

  const [articles, remaining] = await Promise.all([
    sanity.fetch(`*[${filter}] | order(publishedAt desc) [0...${batchSize}] {
      _id, title, summary, excerpt, body, source, category, publishedAt, externalUrl, tags
    }`),
    sanity.fetch(`count(*[${filter}])`),
  ])

  if (!articles.length) {
    return Response.json({
      done: 0, failed: 0, remaining: 0,
      message: force
        ? 'All articles processed (force mode).'
        : 'All articles already have full editorial bodies. ✓',
    })
  }

  console.log(`[BACKFILL] Processing ${articles.length} articles. ${remaining} total need rewriting.`)

  const results = []

  for (const article of articles) {
    const start = Date.now()
    try {
      console.log(`[BACKFILL] → "${article.title?.slice(0, 55)}"`)
      const ai = await rewriteArticle(article)

      const patch = {
        body:    ai.body,
        summary: ai.summary || article.summary || article.excerpt || article.title,
      }
      if (ai.tags?.length > 0 && (!article.tags || article.tags.length === 0)) {
        patch.tags = ai.tags
      }

      await sanity.patch(article._id).set(patch).commit()

      const wordCount = ai.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
      results.push({
        id:        article._id,
        title:     article.title?.slice(0, 65),
        status:    'done',
        words:     wordCount,
        bodyChars: ai.body.length,
        ms:        Date.now() - start,
      })
      console.log(`[BACKFILL] ✓ ${wordCount} words | "${article.title?.slice(0, 50)}"`)
    } catch (err) {
      results.push({
        id:    article._id,
        title: article.title?.slice(0, 65),
        status:'failed',
        error: err.message,
        ms:    Date.now() - start,
      })
      console.error(`[BACKFILL] ✗ "${article.title?.slice(0, 50)}": ${err.message}`)
    }

    // 300ms pause between Claude calls (avoid rate limit)
    if (articles.indexOf(article) < articles.length - 1) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  const done       = results.filter(r => r.status === 'done').length
  const failed     = results.filter(r => r.status === 'failed').length
  const newRemaining = Math.max(0, remaining - done)
  const avgWords   = done > 0
    ? Math.round(results.filter(r => r.words).reduce((s, r) => s + (r.words || 0), 0) / done)
    : 0

  return Response.json({
    done,
    failed,
    total:     remaining,
    remaining: newRemaining,
    avgWords,
    ms:        Date.now() - t,
    results,
    message: newRemaining > 0
      ? `✓ ${done} rewritten (avg ${avgWords} words). ${failed > 0 ? `${failed} failed. ` : ''}${newRemaining} remaining — POST again to continue.`
      : `✓ Backfill complete! ${done} articles rewritten (avg ${avgWords} words).`,
  })
}

export async function GET(req) { return POST(req) }
