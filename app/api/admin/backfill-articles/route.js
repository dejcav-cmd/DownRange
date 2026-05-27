export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

async function rewriteArticle(article) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set')

  const inputContent = [
    article.body && article.body.length > 50
      ? 'Existing draft: ' + article.body.replace(/<[^>]+>/g, '').slice(0, 1000)
      : '',
    article.summary ? 'Summary: ' + article.summary : '',
    article.excerpt ? 'Excerpt: ' + article.excerpt : '',
  ].filter(Boolean).join('\n\n').slice(0, 3000)

  const prompt = 'Write a DownRange article. DownRange is a firearms and Second Amendment portal run by DJ Cavalcanti, a gun owner based in Washington State.\n\n'
    + 'WRITING RULES — violating these ruins the article:\n'
    + '- Write like a person, not a content generator. Direct sentences. Active voice. Specific facts.\n'
    + '- BANNED WORDS: comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, shed light on, it remains to be seen, stakeholders, holistic, takeaway, unpack, explore\n'
    + '- NO padded openings. Start with the hardest fact. First sentence names who did what.\n'
    + '- NO hedging. State facts as facts.\n'
    + '- Short sentences. Named people, numbered laws, dollar amounts, calibers.\n\n'
    + 'GOOD OPENING: "The ATF reversed course on pistol braces Thursday, rescinding the rule that reclassified millions of pistols as short-barreled rifles."\n'
    + 'BAD OPENING: "In a significant development with far-reaching implications for the firearms community..."\n\n'
    + 'Return ONLY a valid JSON object with fields: summary, body, category, urgencyScore, tags, relatedStates, isBreaking\n\n'
    + '"summary": 2-3 sentences. Key facts, max 350 characters.\n\n'
    + '"body": Complete article as HTML with this structure:\n'
    + '<h2>' + article.title + '</h2>\n'
    + '<p>[Opening: hard news, 120-150 words]</p>\n'
    + '<h2>Background and Context</h2>\n'
    + '<p>[130-160 words]</p>\n'
    + '<h2>What This Means for Gun Owners</h2>\n'
    + '<p>[130-160 words]</p>\n'
    + '<h2>Industry Impact</h2>\n'
    + '<p>[110-140 words]</p>\n'
    + '<h2>What to Watch Next</h2>\n'
    + '<p>[110-140 words]</p>\n'
    + '<p><strong>DownRange Bottom Line:</strong> [2-3 sentences, direct opinion]</p>\n\n'
    + 'Minimum 750 words. HTML only: h2, p, strong, em, ul, li.\n\n'
    + 'SOURCE MATERIAL:\n'
    + 'Title: ' + article.title + '\n'
    + 'Source: ' + (article.source || 'Unknown') + '\n'
    + 'Category: ' + (article.category || 'news') + '\n'
    + 'Published: ' + (article.publishedAt || 'Recent') + '\n'
    + 'Tags: ' + ((article.tags || []).join(', ') || 'none') + '\n\n'
    + inputContent + '\n\n'
    + 'CRITICAL: Return ONLY a valid JSON object. Start with { end with }. No markdown fences.'

  const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })

  if (!apiRes.ok) {
    const errText = await apiRes.text()
    throw new Error('Anthropic API error ' + apiRes.status + ': ' + errText.slice(0, 200))
  }

  const apiData = await apiRes.json()
  const raw = apiData.content?.[0]?.text || ''
  const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    const match = clean.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
    else throw new Error('JSON parse failed: ' + e.message + ' | raw: ' + clean.slice(0, 200))
  }

  if (typeof parsed.body !== 'string') throw new Error('body field is not a string')
  if (parsed.body.length < 400) throw new Error('Body too short: ' + parsed.body.length + ' chars')

  return parsed
}

export async function POST(req) {
  try {
    const adminKey = process.env.ADMIN_KEY
    const xKey     = req.headers.get('x-admin-key')
    const bearer   = req.headers.get('authorization')
    const authed   = !adminKey || xKey === adminKey || bearer === ('Bearer ' + adminKey)
    if (!authed) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const batchSize = Math.min(20, Math.max(1, parseInt(searchParams.get('batch') || '10')))
    const force     = searchParams.get('force') === 'true'
    const t         = Date.now()

    const filter = force
      ? '_type == "newsArticle" && approved == true'
      : '_type == "newsArticle" && approved == true && (!defined(body) || body == "" || length(body) < 500)'

    let articles, remaining
    try {
      const results = await Promise.all([
        sanity.fetch('*[' + filter + '] | order(publishedAt desc) [0...' + batchSize + '] { _id, title, summary, excerpt, body, source, category, publishedAt, externalUrl, tags }'),
        sanity.fetch('count(*[' + filter + '])'),
      ])
      articles  = results[0]
      remaining = results[1]
    } catch (sanityErr) {
      return Response.json({ error: 'Sanity query failed: ' + sanityErr.message }, { status: 500 })
    }

    if (!articles.length) {
      return Response.json({
        done: 0, failed: 0, remaining: 0,
        message: force ? 'All articles processed.' : 'All articles already have full bodies.',
      })
    }

    const results = []

    for (const article of articles) {
      const start = Date.now()
      try {
        const ai = await rewriteArticle(article)
        const patch = {
          body:    ai.body,
          summary: ai.summary || article.summary || article.title,
        }
        if (ai.tags?.length > 0 && (!article.tags || article.tags.length === 0)) {
          patch.tags = ai.tags
        }
        await sanity.patch(article._id).set(patch).commit()
        const wordCount = ai.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
        results.push({ id: article._id, title: article.title?.slice(0, 65), status: 'done', words: wordCount, ms: Date.now() - start })
      } catch (err) {
        results.push({ id: article._id, title: article.title?.slice(0, 65), status: 'failed', error: err.message, ms: Date.now() - start })
      }
      if (articles.indexOf(article) < articles.length - 1) {
        await new Promise(r => setTimeout(r, 300))
      }
    }

    const done   = results.filter(r => r.status === 'done').length
    const failed = results.filter(r => r.status === 'failed').length
    const newRemaining = Math.max(0, remaining - done)
    const avgWords = done > 0
      ? Math.round(results.filter(r => r.words).reduce((s, r) => s + (r.words || 0), 0) / done)
      : 0

    const msg = newRemaining > 0
      ? done + ' rewritten (avg ' + avgWords + ' words). ' + (failed > 0 ? failed + ' failed. ' : '') + newRemaining + ' remaining.'
      : 'Backfill complete! ' + done + ' articles rewritten (avg ' + avgWords + ' words).'

    return Response.json({ done, failed, total: remaining, remaining: newRemaining, avgWords, ms: Date.now() - t, results, message: msg })

  } catch (topErr) {
    console.error('[BACKFILL] Unhandled error:', topErr.message)
    return Response.json({ error: 'Backfill crashed: ' + topErr.message }, { status: 500 })
  }
}

export async function GET(req) { return POST(req) }
