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

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-5',
      max_tokens: 4000,
      messages:   [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error('Anthropic ' + res.status + ': ' + t.slice(0, 200))
  }
  const d = await res.json()
  return d.content[0].text
}

async function rewriteArticle(article) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set')

  const input = [
    article.body && article.body.length > 50 ? 'Existing draft: ' + article.body.replace(/<[^>]+>/g, '').slice(0, 1000) : '',
    article.summary ? 'Summary: ' + article.summary : '',
    article.excerpt ? 'Excerpt: ' + article.excerpt : '',
  ].filter(Boolean).join('\n\n').slice(0, 3000)

  const lines = [
    'Write a DownRange article. DownRange is a firearms and Second Amendment news site run by DJ Cavalcanti, a gun owner in Washington State.',
    '',
    'WRITING RULES:',
    '- Write like a person. Direct. Active voice. Specific facts.',
    '- BANNED: comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, shed light on, it remains to be seen, stakeholders, holistic, takeaway, unpack, explore',
    '- Start with the hardest fact. No padded openings.',
    '- No hedging. State facts as facts.',
    '- Short sentences. Named people, laws, dollar amounts, calibers.',
    '',
    'Return ONLY valid JSON with: summary, body, category, urgencyScore, tags, relatedStates, isBreaking',
    '',
    '"summary": 2-3 sentences. Key facts. Max 350 chars.',
    '"body": Full article HTML:',
    '<h2>' + article.title + '</h2>',
    '<p>[Opening: hard news, 120-150 words]</p>',
    '<h2>Background and Context</h2>',
    '<p>[130-160 words]</p>',
    '<h2>What This Means for Gun Owners</h2>',
    '<p>[130-160 words]</p>',
    '<h2>Industry Impact</h2>',
    '<p>[110-140 words]</p>',
    '<h2>What to Watch Next</h2>',
    '<p>[110-140 words]</p>',
    '<p><strong>DownRange Bottom Line:</strong> [2-3 sentences, direct opinion]</p>',
    '',
    'Min 750 words. HTML only: h2, p, strong, em, ul, li.',
    '',
    'SOURCE:',
    'Title: ' + article.title,
    'Source: ' + (article.source || 'Unknown'),
    'Category: ' + (article.category || 'news'),
    '',
    input,
    '',
    'CRITICAL: Return ONLY a valid JSON object. Start with { end with }. No markdown.',
  ]

  const raw   = await callClaude(lines.join('\n'))
  const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

  let parsed
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    const m = clean.match(/\{[\s\S]*\}/)
    if (m) parsed = JSON.parse(m[0])
    else throw new Error('JSON parse failed: ' + e.message)
  }

  if (typeof parsed.body !== 'string') throw new Error('body is not a string')
  if (parsed.body.length < 400) throw new Error('body too short: ' + parsed.body.length)
  return parsed
}

export async function POST(req) {
  try {
    const adminKey = process.env.ADMIN_KEY
    const xKey     = req.headers.get('x-admin-key') || ''
    const bearer   = req.headers.get('authorization') || ''
    if (adminKey && xKey !== adminKey && bearer !== ('Bearer ' + adminKey)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url       = new URL(req.url)
    const batchSize = Math.min(3, Math.max(1, parseInt(url.searchParams.get('batch') || '1')))
    const force     = url.searchParams.get('force') === 'true'
    const t0        = Date.now()

    const filter = force
      ? '_type == "newsArticle" && approved == true'
      : '_type == "newsArticle" && approved == true && (!defined(body) || body == "" || length(body) < 500)'

    const q  = '*[' + filter + '] | order(publishedAt desc) [0...' + batchSize + '] { _id, title, summary, excerpt, body, source, category, publishedAt, tags }'
    const cq = 'count(*[' + filter + '])'

    let articles, remaining
    try {
      const r = await Promise.all([sanity.fetch(q), sanity.fetch(cq)])
      articles  = r[0]
      remaining = r[1]
    } catch (e) {
      return Response.json({ error: 'Sanity query failed: ' + e.message }, { status: 500 })
    }

    if (!articles.length) {
      return Response.json({ done: 0, failed: 0, remaining: 0, message: 'All articles already have bodies.' })
    }

    const results = []
    for (const article of articles) {
      const ts = Date.now()
      try {
        const ai    = await rewriteArticle(article)
        const patch = { body: ai.body, summary: ai.summary || article.summary || article.title }
        if (ai.tags && ai.tags.length > 0 && (!article.tags || !article.tags.length)) patch.tags = ai.tags
        await sanity.patch(article._id).set(patch).commit()
        const words = ai.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
        results.push({ id: article._id, title: (article.title || '').slice(0, 65), status: 'done', words, ms: Date.now() - ts })
      } catch (e) {
        results.push({ id: article._id, title: (article.title || '').slice(0, 65), status: 'failed', error: e.message, ms: Date.now() - ts })
      }
      if (articles.indexOf(article) < articles.length - 1) await new Promise(r => setTimeout(r, 400))
    }

    const done     = results.filter(r => r.status === 'done').length
    const failed   = results.filter(r => r.status === 'failed').length
    const left     = Math.max(0, remaining - done)
    const avgWords = done > 0 ? Math.round(results.filter(r => r.words).reduce((s, r) => s + r.words, 0) / done) : 0
    const msg      = left > 0
      ? done + ' rewritten (' + avgWords + ' avg words). ' + (failed > 0 ? failed + ' failed. ' : '') + left + ' remaining.'
      : 'Backfill complete! ' + done + ' rewritten (' + avgWords + ' avg words).'

    return Response.json({ done, failed, total: remaining, remaining: left, avgWords, ms: Date.now() - t0, results, message: msg })

  } catch (e) {
    console.error('[BACKFILL] crash:', e.message)
    return Response.json({ error: 'Crashed: ' + e.message }, { status: 500 })
  }
}

export async function GET(req) { return POST(req) }
