export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/admin/backfill-articles
 * Rewrites all existing Sanity articles that have no body.
 * Processes up to 10 per call. Call repeatedly until remaining = 0.
 */

import { createClient } from '@sanity/client'
import axios from 'axios'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

async function rewriteArticle(article) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set')
  const inputContent = (article.summary || article.excerpt || '').slice(0, 2000)

  const prompt = [
    `You are the senior editorial AI for DownRange — America's definitive firearms, Second Amendment, and tactical intelligence publication.`,
    `Your audience: gun owners, dealers, hunters, competitive shooters, and 2A advocates who demand substance and specifics.`,
    ``,
    `Write a COMPLETE, FULLY WRITTEN DownRange editorial article. This is NOT a summary — it is a full published article.`,
    ``,
    `Return a JSON object with exactly these fields:`,
    ``,
    `"body": Full article as a single HTML string. MANDATORY STRUCTURE AND MINIMUM 750 WORDS:`,
    `<h2>[Specific title of what happened]</h2>`,
    `<p>[Opening 120-150 words: Hard news. Who, what, when, where. Names, agencies, bill numbers, case citations, calibers, models.]</p>`,
    `<h2>Background and Context</h2>`,
    `<p>[130-160 words: 2A landscape context. Reference Heller, Bruen, prior laws, agency history, industry trends as relevant.]</p>`,
    `<h2>What This Means for Gun Owners</h2>`,
    `<p>[130-160 words: Specific reader impact. Which states, platforms, calibers, dollar amounts. Concrete and actionable.]</p>`,
    `<h2>Industry and Market Impact</h2>`,
    `<p>[110-140 words: Manufacturer, retailer, dealer effects. Or advocacy org responses if legal/political.]</p>`,
    `<h2>What to Watch Next</h2>`,
    `<p>[110-140 words: Court dates, hearing schedules, legislative timelines. Exactly what to monitor and when.]</p>`,
    `<p><strong>DownRange Bottom Line:</strong> [2-3 sentences: Direct editorial verdict. What should a gun owner DO with this? Be opinionated.]</p>`,
    ``,
    `HTML TAGS: h2, p, strong, em, ul, li ONLY. No other tags.`,
    ``,
    `"summary": 2-3 sentence sharp lede, max 350 characters.`,
    ``,
    `SOURCE:`,
    `Title: ${article.title}`,
    `Source: ${article.source || 'Unknown'}`,
    `Category: ${article.category || 'news'}`,
    `Content: ${inputContent}`,
    ``,
    `Return ONLY valid JSON. No markdown fences. Start with { end with }.`,
  ].join('\n')

  const res = await axios.post('https://api.anthropic.com/v1/messages', {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  }, {
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    timeout: 90000,
  })

  const text  = res.data.content?.[0]?.text || ''
  const clean = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
  const parsed = JSON.parse(clean)
  if (typeof parsed.body !== 'string' || parsed.body.length < 200) {
    throw new Error(`Body too short (${parsed.body?.length || 0} chars)`)
  }
  return parsed
}

export async function POST(req) {
  const authHeader = req.headers.get('authorization')
  const secret     = process.env.CRON_SECRET || process.env.ADMIN_KEY
  const cronHeader = req.headers.get('x-vercel-cron')
  if (secret && authHeader !== `Bearer ${secret}` && cronHeader !== '1') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const batchSize = Math.min(20, parseInt(searchParams.get('batch') || '10'))
  const t = Date.now()

  const [articles, total] = await Promise.all([
    sanity.fetch(`
      *[_type == "newsArticle" && approved == true && (!defined(body) || body == "" || length(body) < 200)]
      | order(publishedAt desc) [0...${batchSize}] {
        _id, title, summary, excerpt, source, category, publishedAt, externalUrl
      }
    `),
    sanity.fetch(`count(*[_type == "newsArticle" && approved == true && (!defined(body) || body == "" || length(body) < 200)])`),
  ])

  if (!articles.length) {
    return Response.json({ done: 0, remaining: 0, total, message: 'All articles already have full body content.' })
  }

  const results = []
  for (const article of articles) {
    try {
      const ai = await rewriteArticle(article)
      await sanity.patch(article._id)
        .set({ body: ai.body, summary: ai.summary || article.summary })
        .commit()
      results.push({ id: article._id, title: article.title.slice(0, 60), status: 'done', bodyLen: ai.body.length })
      console.log(`[BACKFILL] ✓ "${article.title.slice(0, 55)}" — ${ai.body.length} chars`)
    } catch (err) {
      results.push({ id: article._id, title: article.title?.slice(0, 60), status: 'failed', error: err.message })
      console.error(`[BACKFILL] ✗ "${article.title?.slice(0, 55)}": ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 400))
  }

  const done      = results.filter(r => r.status === 'done').length
  const failed    = results.filter(r => r.status === 'failed').length
  const remaining = Math.max(0, total - done)

  return Response.json({
    done, failed, total, remaining, ms: Date.now() - t, results,
    message: remaining > 0
      ? `${done}/${batchSize} written this batch. ${remaining} remaining. POST again to continue.`
      : `Backfill complete. ${done} articles rewritten.`,
  })
}

export async function GET(req) { return POST(req) }
