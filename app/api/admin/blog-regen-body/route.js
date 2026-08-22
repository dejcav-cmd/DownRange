export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { stripMarkdownFences } from '@/lib/aiClient.js'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const ANTHROPIC = process.env.ANTHROPIC_API_KEY
const GLM_KEY   = process.env.GLM_API_KEY

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

const SYSTEM = `You are DJ Cavalcanti, founder of DownRange — a firearms media portal.
You carry daily. Direct, opinionated voice. Real product names and specifics.
No AI filler phrases. Write like a 2A columnist, not a content farm.
Output HTML only: <h2> for sections, <p> for paragraphs, <ul><li> for lists, <strong> for key terms.
900-1100 words total. 5 sections. End with a DownRange Bottom Line paragraph.`

async function generateBody(title, category, tags) {
  const prompt = `Write a complete firearms article about: "${title}"
Category: ${category || 'general'}. Tags: ${(tags||[]).join(', ')}.
Voice: first-person, specific, opinionated. Real product names. No fluff.
Format: HTML with h2 headers and p tags. 900-1100 words. No title tag — start with first h2.`

  if (ANTHROPIC) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2500, system: SYSTEM, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(45000),
    })
    const d = await res.json()
    return stripMarkdownFences(d.content?.[0]?.text) || null
  }
  if (GLM_KEY) {
    const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + GLM_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'glm-4-air', max_tokens: 2000, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(30000),
    })
    const d = await res.json()
    return stripMarkdownFences(d.choices?.[0]?.message?.content) || null
  }
  return null
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slugs, all } = await req.json().catch(() => ({}))
  const t0 = Date.now()

  // Get posts: specific slugs OR all with empty body
  let posts
  if (all) {
    posts = await sanity.fetch(
      '*[_type == "blogPost" && (body == null || body == "")] { _id, title, "slug": slug.current, category, tags }'
    ).catch(() => [])
  } else {
    const filter = slugs?.map(s => `slug.current == "${s}"`).join(' || ')
    posts = await sanity.fetch(
      '*[_type == "blogPost" && (' + filter + ')] { _id, title, "slug": slug.current, category, tags, body }'
    ).catch(() => [])
  }

  const results = []
  for (const post of (posts || [])) {
    if (post.body && post.body.trim().length > 100 && !all) {
      results.push({ slug: post.slug, skipped: true, reason: 'already has body' })
      continue
    }
    const body = await generateBody(post.title, post.category, post.tags)
    if (body) {
      await sanity.patch(post._id).set({ body }).commit()
      results.push({ slug: post.slug, ok: true, chars: body.length })
    } else {
      results.push({ slug: post.slug, ok: false, error: 'AI generation failed' })
    }
    // Small delay between articles
    await new Promise(r => setTimeout(r, 1500))
  }

  return NextResponse.json({ ok: true, ms: Date.now() - t0, count: results.length, results })
}

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const posts = await sanity.fetch(
    '*[_type == "blogPost"] { _id, title, "slug": slug.current, "bodyLen": length(body), "hasBody": body != null && length(body) > 100 } | order(_createdAt desc)'
  ).catch(() => [])

  return NextResponse.json({
    ok: true,
    total: posts.length,
    missingBody: posts.filter(p => !p.hasBody).length,
    posts: posts.map(p => ({ slug: p.slug, title: (p.title||'').slice(0,50), hasBody: p.hasBody, bodyLen: p.bodyLen || 0 }))
  })
}
