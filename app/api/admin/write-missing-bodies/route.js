export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const ANTHROPIC  = process.env.ANTHROPIC_API_KEY
const GLM_KEY    = process.env.GLM_API_KEY

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

const SYSTEM = `You are DJ Cavalcanti, founder of DownRange — a firearms media site in Washington State.
You carry daily. You've been shooting for 15 years. Direct, opinionated, specific. Real product names.
Zero AI filler phrases. Write like someone who actually knows guns, not a content farm.
Output HTML: <h2> headers, <p> paragraphs, <ul><li> lists, <strong> for key terms.
900-1100 words total. 5 h2 sections. Last section = "DownRange Bottom Line" with your take.
Never start with "In today's landscape" or "In this comprehensive guide". Start strong.`

async function writeArticle(title, category, tags) {
  const prompt = 'Write a complete firearms article titled: "' + title + '". ' +
    'Category: ' + (category||'general') + '. Tags: ' + (tags||[]).join(', ') + '.' +
    ' First-person. Specific product names. Opinionated. Real-world experience. HTML output only. No title tag — start with first <h2>.'

  if (ANTHROPIC) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', signal:AbortSignal.timeout(55000),
      headers:{'x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01','Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:2500,system:SYSTEM,messages:[{role:'user',content:prompt}]})
    })
    const d = await r.json()
    const txt = d.content?.[0]?.text || ''
    if (txt.length > 200) return txt
  }
  if (GLM_KEY) {
    const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method:'POST', signal:AbortSignal.timeout(30000),
      headers:{'Authorization':'Bearer '+GLM_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({model:'glm-4-air',max_tokens:2000,messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}]})
    })
    const d = await r.json()
    const txt = d.choices?.[0]?.message?.content || ''
    if (txt.length > 200) return txt
  }
  return null
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const results = []

  // Get ALL blog posts with empty or very short body
  const posts = await sanity.fetch(
    '*[_type == "blogPost" && (body == null || body == "" || length(body) < 200)] { _id, title, "slug": slug.current, category, tags }'
  ).catch(() => [])

  console.log('[write-missing-bodies] Found', (posts||[]).length, 'posts needing body')

  for (const post of (posts || [])) {
    console.log('[write-missing-bodies] Writing:', post.slug)
    try {
      const body = await writeArticle(post.title, post.category, post.tags)
      if (body && body.length > 200) {
        await sanity.patch(post._id).set({ body }).commit()
        results.push({ slug: post.slug, ok: true, chars: body.length })
        console.log('[write-missing-bodies] Done:', post.slug, body.length, 'chars')
      } else {
        results.push({ slug: post.slug, ok: false, error: 'AI returned too-short body' })
        console.error('[write-missing-bodies] Failed:', post.slug)
      }
      // Delay between articles to avoid rate limits
      await new Promise(r => setTimeout(r, 1500))
    } catch(e) {
      results.push({ slug: post.slug, ok: false, error: e.message })
      console.error('[write-missing-bodies]', post.slug, e.message)
    }
  }

  return NextResponse.json({
    ok: true,
    ms: Date.now() - t0,
    total: posts.length,
    succeeded: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
  })
}

// GET: check which posts need bodies
export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const posts = await sanity.fetch(
    '*[_type == "blogPost"] { _id, title, "slug": slug.current, "bodyLen": length(body), published } | order(_createdAt desc)'
  ).catch(() => [])

  return NextResponse.json({
    ok: true,
    total: (posts||[]).length,
    needBody: (posts||[]).filter(p => !p.bodyLen || p.bodyLen < 200).length,
    posts: (posts||[]).map(p => ({
      slug: p.slug, title: (p.title||'??').slice(0,50),
      bodyLen: p.bodyLen || 0,
      ok: (p.bodyLen||0) >= 200
    }))
  })
}
