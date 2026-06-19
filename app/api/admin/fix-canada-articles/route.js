export const dynamic   = 'force-dynamic'
export const maxDuration = 300

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
      max_tokens: 1200,
      messages: [{ role: 'user', content:
        `Write a 600-800 word article for DownRange Canada (firearms intelligence portal). Direct, data-driven voice for experienced Canadian gun owners.

Title: ${title}
${sourceUrl ? `Source: ${sourceUrl}` : ''}

Return HTML only — no markdown, no code fences:
<h2>Section Title</h2>
<p style="text-align:justify">Paragraph text...</p>
<ul><li>Point</li></ul>

Cover key facts, numbers, dates, and practical impact for Canadian gun owners.`
      }]
    }),
    signal: AbortSignal.timeout(25000),
  })
  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  return text.replace(/^```html\s*/i,'').replace(/\s*```\s*$/i,'').trim()
}

export async function GET(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  // Always process exactly 1 article per call — simple, reliable, no timeout
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit  = 1

  const all = await sanity.fetch(
    `*[_type=="canadaContent" && type=="article" && (!defined(body) || body == "" || body == null)] | order(_createdAt asc) {
      _id, title, slug, sourceUrl
    }`
  ).catch(() => [])

  if (all.length === 0) {
    return Response.json({
      ok: true, fixed: 0, total: 0, processed: 0, results: [],
      message: 'All Canada articles already have body content.',
      pagination: { offset: 0, hasMore: false, nextOffset: null, remaining: 0 },
    })
  }

  const article = all[offset]
  if (!article) {
    return Response.json({
      ok: true, fixed: 0, total: all.length, processed: 0, results: [],
      pagination: { offset, hasMore: false, nextOffset: null, remaining: 0 },
    })
  }

  console.log(`[FIX-CANADA] ${offset+1}/${all.length}: ${article.title}`)
  let result = { slug: article.slug?.current, title: article.title, status: 'error' }

  try {
    const body = await writeBody(article.title, article.sourceUrl || '')
    if (body && body.length >= 150) {
      const summary = body.replace(/<[^>]+>/g, '').slice(0, 220).trim() + '...'
      await sanity.patch(article._id).set({ body, summary }).commit()
      result = { slug: article.slug?.current, title: article.title, status: 'fixed', chars: body.length }
      console.log(`[FIX-CANADA] ✓ ${article.title} (${body.length} chars)`)
    } else {
      result.status = 'ai_empty'
    }
  } catch(e) {
    result.error = e.message
    console.error(`[FIX-CANADA] ✗ ${e.message}`)
  }

  const nextOffset = offset + 1
  return Response.json({
    ok: true,
    fixed: result.status === 'fixed' ? 1 : 0,
    total: all.length,
    processed: 1,
    results: [result],
    // Use 'verified' key so the generic batch runner counts it correctly
    verified: result.status === 'fixed' ? 1 : 0,
    pagination: {
      offset,
      hasMore: nextOffset < all.length,
      nextOffset: nextOffset < all.length ? nextOffset : null,
      remaining: Math.max(0, all.length - nextOffset),
    },
  })
}
