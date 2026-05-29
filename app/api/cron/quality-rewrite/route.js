export const dynamic  = 'force-dynamic'
export const maxDuration = 300

import { reportCronRun } from '@/lib/cronReporter'
import { createClient }  from '@sanity/client'
import { callAIText }    from '@/lib/aiClient.js'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

const AI_PHRASES = [
  'comprehensive','dive into','cutting-edge','robust','seamlessly','leverage',
  'empower','game-changer','landscape','navigate','delve','utilize','innovative',
  'unprecedented','paradigm','synergy','moving forward','shed light on',
  'it remains to be seen','stakeholders','holistic','takeaway','unpack',
  'groundbreaking','pivotal',"it's worth noting",'furthermore','in conclusion',
  'in summary','at the end of the day','a wide range of',
]

function needsRewrite(body) {
  if (!body || body.length < 100) return { needs: true, reason: 'missing body' }
  const text  = body.replace(/<[^>]+>/g, ' ').toLowerCase()
  const words = text.split(/\s+/).filter(Boolean).length
  if (words < 400) return { needs: true, reason: `too short (${words} words)` }
  const found = AI_PHRASES.filter(p => text.includes(p))
  if (found.length >= 2) return { needs: true, reason: `AI phrases: ${found.slice(0,3).join(', ')}` }
  if (/in recent (months|years|weeks)|there has been|as the country/i.test(text.slice(0, 200)))
    return { needs: true, reason: 'padded opener' }
  return { needs: false }
}

const VOICE = `You write for DownRange — a firearms news site by a gun owner who carries daily.
BANNED WORDS: comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, it remains to be seen, stakeholders, holistic, takeaway, unpack, groundbreaking, pivotal, furthermore, in conclusion, in summary, at the end of the day.
RULES: Start with the hardest fact. Short sentences max 15 words avg. Active voice only. Specific names, calibers, dollar amounts, dates. No padded intros. No closing filler.`

async function rewriteItem(item) {
  const src = (item.body || item.summary || item.description || '').replace(/<[^>]+>/g, '').slice(0, 2000)
  const prompt = `${VOICE}

Rewrite this ${item._stype === 'newsArticle' ? 'news article' : item._stype === 'blogPost' ? 'blog post' : item._stype === 'firearmRelease' ? 'gun release article' : 'Canada firearms article'} for DownRange. 
${item._stype === 'newsArticle' ? '800-1100 words. 5 h2 sections: opener, Background and Context, What This Means for Gun Owners, Industry Impact, What to Watch Next + DownRange Bottom Line.' : '600-900 words. 4 h2 sections matching the content type.'}

Title: ${item.title || ''}
Source content: ${src}

Respond ONLY with valid JSON — no markdown fences, no extra text:
{"body":"<full HTML with h2 tags>","summary":"2-3 sentence plain text under 300 chars"}`

  const raw    = await callAIText({ prompt, useCase: 'backfill', maxTokens: 4000 })
  const clean  = raw.split('```json').join('').split('```').join('').trim()
  const m      = clean.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(m ? m[0] : clean)
  const wordCount = (parsed.body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  if (wordCount < 350) throw new Error(`Rewrite too short: ${wordCount} words`)  return parsed
}

export async function GET(req)  { return handler(req) }
export async function POST(req) { return handler(req) }

async function handler(req) {
  const t0     = Date.now()
  const auth   = req.headers.get('authorization') || ''
  const xkey   = req.headers.get('x-admin-key')   || ''
  const isCron   = process.env.CRON_SECRET && auth  === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = process.env.ADMIN_KEY   && xkey  === process.env.ADMIN_KEY
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && !isAdmin && !isVercel) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const BATCH = 8
  const stats = { scanned: 0, rewrote: 0, skipped: 0, failed: 0, types: {} }

  try {
    const [articles, blogs, releases, canada] = await Promise.all([
      sanity.fetch(`*[_type=="newsArticle"    && !qualityReviewed && defined(title) && editorLocked != true]      | order(publishedAt desc)  [0...${BATCH}] { _id, title, body, summary, description, source }`),
      sanity.fetch(`*[_type=="blogPost"       && !qualityReviewed && defined(title) && editorLocked != true]      | order(publishedAt desc)  [0...2]        { _id, title, body, excerpt }`),
      sanity.fetch(`*[_type=="firearmRelease" && !qualityReviewed && defined(brand) && editorLocked != true]      | order(_createdAt desc)   [0...2]        { _id, "title": brand+" "+model, body, summary, brand, model, caliber, msrp, category }`),
      sanity.fetch(`*[_type=="canadaContent"  && !qualityReviewed && defined(title) && editorLocked != true]      | order(_createdAt desc)   [0...2]        { _id, title, body, summary, type, status }`),
    ])

    const queue = [
      ...articles.map(d => ({ ...d, _stype: 'newsArticle' })),
      ...blogs.map(d    => ({ ...d, _stype: 'blogPost' })),
      ...releases.map(d => ({ ...d, _stype: 'firearmRelease' })),
      ...canada.map(d   => ({ ...d, _stype: 'canadaContent' })),
    ]
    stats.scanned = queue.length

    for (const item of queue) {
      const { needs, reason } = needsRewrite(item.body)
      if (!needs) {
        await sanity.patch(item._id).set({ qualityReviewed: true }).commit()
        stats.skipped++
        continue
      }

      try {
        const ai = await rewriteItem(item)
        await sanity.patch(item._id).set({
          body:            ai.body,
          ...(ai.summary ? { summary: ai.summary } : {}),
          qualityReviewed: true,
        }).commit()
        stats.rewrote++
        stats.types[item._stype] = (stats.types[item._stype] || 0) + 1
      } catch (e) {
        console.error('[QUALITY-REWRITE]', item._id, e.message)
        stats.failed++
      }

      await new Promise(r => setTimeout(r, 600))
    }

    const ms  = Date.now() - t0
    const msg = `Scanned ${stats.scanned} · rewrote ${stats.rewrote} · skipped ${stats.skipped} (already ok) · failed ${stats.failed}`
    await reportCronRun('quality-rewrite', { status: stats.failed > stats.rewrote + stats.skipped ? 'failed' : 'success', ms, details: msg })
    return Response.json({ ok: true, ...stats, ms, message: msg })

  } catch (e) {
    const ms = Date.now() - t0
    await reportCronRun('quality-rewrite', { status: 'failed', ms, error: e.message })
    return Response.json({ ok: false, error: e.message, ms }, { status: 500 })
  }
}
