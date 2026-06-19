export const dynamic   = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function isAuth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

async function writeBody(title, sourceUrl) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content:
        `You are writing for DownRange Canada — a firearms intelligence portal for Canadian gun owners. Voice: direct, data-driven, no fluff. Speak to experienced gun owners.

Write a 900-1100 word article:
Title: ${title}
${sourceUrl ? `Source reference: ${sourceUrl}` : ''}

Format: HTML only. <h2> for sections, <p style="text-align:justify"> for paragraphs, <ul><li> for lists, <strong> for key terms. No h1. No markdown. No code fences.

Cover key facts, specific numbers/dates, what it means for Canadian gun owners.`
      }]
    }),
    signal: AbortSignal.timeout(45000),
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  return text.replace(/^```html\s*/i,'').replace(/\s*```\s*$/i,'').trim()
}

export async function GET(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const articles = await sanity.fetch(
    `*[_type=="canadaContent" && type=="article" && (!defined(body) || body == "" || body == null)] {
      _id, title, slug, sourceUrl
    }`
  ).catch(() => [])

  console.log(`[FIX-CANADA] ${articles.length} articles need body text`)
  const results = []

  for (const article of articles) {
    try {
      const body = await writeBody(article.title, article.sourceUrl || '')
      if (!body || body.length < 200) {
        results.push({ slug: article.slug?.current, status: 'ai_empty' }); continue
      }
      const summary = body.replace(/<[^>]+>/g,'').slice(0,220).trim()+'...'
      await sanity.patch(article._id).set({ body, summary }).commit()
      results.push({ slug: article.slug?.current, title: article.title, status: 'fixed', chars: body.length })
      console.log(`[FIX-CANADA] ✓ ${article.title}`)
    } catch(e) {
      results.push({ slug: article.slug?.current, status: 'error', error: e.message })
    }
    await new Promise(r => setTimeout(r, 1000))
  }

  return Response.json({
    ok: true,
    fixed: results.filter(r => r.status==='fixed').length,
    total: articles.length,
    results,
  })
}
