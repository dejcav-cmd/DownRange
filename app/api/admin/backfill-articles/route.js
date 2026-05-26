export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

  const prompt = `You are the senior editorial AI for DownRange — America's definitive firearms, Second Amendment, and tactical intelligence publication. Your readers are gun owners, dealers, hunters, competitive shooters, and 2A advocates who demand specifics and expertise.

Write a COMPLETE, FULLY WRITTEN DownRange editorial article — not a summary, not a brief. A real published piece.

Return ONLY a valid JSON object with these fields:

"summary": Sharp 2-3 sentence lede. Hard-hitting, specific, states the key fact and why it matters to gun owners. Max 350 characters.

"body": The complete article as a single HTML string. Follow this EXACT structure:

<h2>${article.title}</h2>
<p>[Opening paragraph: 120-150 words. The hard news. Names, agencies, bill numbers, case citations, calibers, models, dollar amounts. Be specific — no vague references.]</p>

<h2>Background and Context</h2>
<p>[130-160 words. Why this matters in the broader 2A and firearms landscape. Reference Heller, Bruen, McDonald, prior laws, agency history, or market trends as appropriate. Give readers the framework to understand the significance.]</p>

<h2>What This Means for Gun Owners</h2>
<p>[130-160 words. Direct, specific reader impact. Which states are affected, which platforms, which calibers, which dealers, what dollar amounts. What can they do, buy, or avoid. Concrete and actionable.]</p>

<h2>Industry and Market Impact</h2>
<p>[110-140 words. Manufacturer, retailer, importer, dealer impact. Price effects, supply chain, stock changes, market position. If purely legal/political, cover advocacy group responses from NRA, GOA, SAF, FPC — be specific about their positions.]</p>

<h2>What to Watch Next</h2>
<p>[110-140 words. Specific forward-looking intelligence: court dates, committee hearing schedules, bill markup dates, regulatory comment periods, expected ruling timelines. Name the judges, the circuits, the committees. Give readers exactly what to monitor and when.]</p>

<p><strong>DownRange Bottom Line:</strong> [2-3 sentences. Direct editorial verdict. What should a serious gun owner do with this information right now? Be direct and opinionated — that is the DownRange voice.]</p>

REQUIREMENTS:
- Minimum 750 words in the body. Target 900-1100 words. This is non-negotiable.
- Use ONLY these HTML tags: h2, p, strong, em, ul, li
- No div, span, br, or any other tags
- strong = important facts/names. em = key terms in gold (used sparingly)
- Do NOT include source attribution in the body — that is handled separately by the page
- Write with authority. No hedging, no "it remains to be seen"

SOURCE MATERIAL:
Title: ${article.title}
Source Publication: ${article.source || 'Unknown'}
Category: ${article.category || 'news'}
Published: ${article.publishedAt || 'Recent'}
External URL: ${article.externalUrl || 'N/A'}
Tags: ${(article.tags || []).join(', ') || 'none'}

${inputContent}

CRITICAL: Return ONLY the JSON object. Start with { and end with }. No markdown fences. No text before or after. Properly escape all double quotes within the HTML body string.`

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
  // Uses ADMIN_KEY only — CRON_SECRET is for cron jobs, not admin UI calls
  const adminKey   = process.env.ADMIN_KEY
  const authHeader = req.headers.get('authorization')
  if (adminKey && authHeader !== `Bearer ${adminKey}`) {
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
