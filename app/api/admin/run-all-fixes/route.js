export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const ANTHROPIC  = process.env.ANTHROPIC_API_KEY
const GLM_KEY    = process.env.GLM_API_KEY

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

const SYSTEM = `You are DJ Cavalcanti, founder of DownRange — a firearms media portal in Washington State.
You carry daily. Direct, specific, opinionated voice. Real product names. No filler phrases like "comprehensive" or "dive into".
Write like a 2A columnist, not a content farm. Minimum 900 words. Output HTML only: use <h2> for sections, <p> for paragraphs, <ul><li> for lists. No title — start with first <h2>. End with a "DownRange Bottom Line" section.`

async function genBody(title, category, tags) {
  const prompt = 'Write a full firearms article about: "' + title + '". Tags: ' + (tags||[]).join(', ') + '. First-person, specific, opinionated. Real product names. 900-1100 words HTML.'
  if (ANTHROPIC) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', signal:AbortSignal.timeout(50000),
      headers:{'x-api-key':ANTHROPIC,'anthropic-version':'2023-06-01','Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:2500,system:SYSTEM,messages:[{role:'user',content:prompt}]})
    })
    const d = await r.json()
    return d.content?.[0]?.text || null
  }
  if (GLM_KEY) {
    const r = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method:'POST', signal:AbortSignal.timeout(30000),
      headers:{'Authorization':'Bearer '+GLM_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({model:'glm-4-air',max_tokens:2000,messages:[{role:'system',content:SYSTEM},{role:'user',content:prompt}]})
    })
    const d = await r.json()
    return d.choices?.[0]?.message?.content || null
  }
  return null
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results = { bodies: [], ammoland: 0, gundeals: 0, errors: [] }
  const t0 = Date.now()

  // 1. Generate missing blog bodies
  try {
    const emptyPosts = await sanity.fetch(
      '*[_type == "blogPost" && (body == null || body == "" || length(body) < 100)] { _id, title, "slug": slug.current, category, tags }'
    )
    for (const post of (emptyPosts || [])) {
      try {
        const body = await genBody(post.title, post.category, post.tags)
        if (body) {
          await sanity.patch(post._id).set({ body }).commit()
          results.bodies.push({ slug: post.slug, ok: true })
        } else {
          results.bodies.push({ slug: post.slug, ok: false, error: 'AI returned null' })
        }
        await new Promise(r => setTimeout(r, 1000))
      } catch(e) { results.errors.push('body:' + post.slug + ':' + e.message) }
    }
  } catch(e) { results.errors.push('bodies_query:' + e.message) }

  // 2. Remove AmmoLand articles
  try {
    const al = await sanity.fetch(
      '*[_type == "newsArticle" && (source == "AmmoLand" || string::startsWith(coalesce(externalUrl,""), "https://ammoland") || string::startsWith(coalesce(externalUrl,""), "https://www.ammoland"))] { _id }'
    )
    if (al && al.length > 0) {
      for (let i = 0; i < al.length; i += 50) {
        const batch = al.slice(i, i+50)
        await sanity.mutate(batch.map(a => ({ delete: { id: a._id } })))
        results.ammoland += batch.length
      }
    }
  } catch(e) { results.errors.push('ammoland:' + e.message) }

  // 3. Import gun.deals
  try {
    const res = await fetch('https://gun.deals/feed/syndication/rss', {
      headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
      signal: AbortSignal.timeout(12000),
    })
    if (res.ok) {
      const xml = await res.text()
      const existing = await sanity.fetch('*[_type=="newsArticle" && source=="gun.deals"]{externalUrl}').catch(()=>[])
      const existingUrls = new Set((existing||[]).map(d => d.externalUrl))
      const mutations = []
      const rows = xml.match(/<item>([\s\S]*?)<\/item>/gi) || []
      for (const row of rows.slice(0, 30)) {
        const getTag = tag => { const m = row.match(new RegExp('<' + tag + '[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/' + tag + '>')); return m ? m[1].trim() : '' }
        const title = getTag('title'), link = getTag('link') || getTag('guid')
        if (!title || !link || existingUrls.has(link)) continue
        const cat = title.toLowerCase().includes('ammo') || title.toLowerCase().includes('9mm') ? 'ammo'
          : title.toLowerCase().includes('pistol') || title.toLowerCase().includes('glock') ? 'pistol'
          : title.toLowerCase().includes('rifle') || title.toLowerCase().includes('ar-15') ? 'rifle' : 'deal'
        mutations.push({ create: { _type:'newsArticle', title, externalUrl:link, source:'gun.deals', category:cat,
          approved:true, published:true, publishedAt:new Date().toISOString(),
          imageUrl:'/img/photos/blog-ammo-market.jpg',
          tags:['deals','gun.deals',cat] }})
        results.gundeals++
      }
      if (mutations.length) await sanity.mutate(mutations)
    }
  } catch(e) { results.errors.push('gundeals:' + e.message) }

  return NextResponse.json({ ok:true, ms:Date.now()-t0, ...results })
}
