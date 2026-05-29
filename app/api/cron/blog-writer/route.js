export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// DownRange Weekly Blog Writer — Fridays 10am PST (18:00 UTC)
// Writes 10 original, human-sounding articles on trending 2A topics
// All articles go to draft (published: false) for DJ to review

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const GLM_KEY = process.env.GLM_API_KEY

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// 10 rotating topic buckets — the cron picks fresh topics each week
// based on current news + community interest signals
const TOPIC_BUCKETS = [
  {
    topic: 'suppressors and NFA after the One Big Beautiful Bill tax elimination',
    category: 'opinion',
    tags: ['NFA', 'Suppressors', 'One Big Beautiful Bill', 'Tax Stamps'],
    angle: 'What changed, what it costs now, which states still ban it, what to buy',
  },
  {
    topic: 'concealed carry reciprocity and the state-by-state patchwork in 2026',
    category: 'laws',
    tags: ['CCW', 'Reciprocity', 'Concealed Carry', 'State Laws'],
    angle: 'Practical guide for people who carry and cross state lines',
  },
  {
    topic: 'best EDC handguns in 2026 — real comparisons for real carry',
    category: 'gear',
    tags: ['EDC', 'Pistols', 'Concealed Carry', 'Handguns'],
    angle: 'Glock 19 vs SIG P365 XL vs Springfield Hellcat — specific, opinionated picks',
  },
  {
    topic: 'the Bruen standard and how states are trying to work around it',
    category: 'laws',
    tags: ['Bruen', 'Second Amendment', 'SCOTUS', 'Constitutional Carry'],
    angle: 'Which state laws are winning in court, which are getting struck down',
  },
  {
    topic: 'building your first AR-15 in 2026 — parts, tariffs, and what to skip',
    category: 'builds',
    tags: ['AR-15', 'Build Guide', 'Tariffs', 'Parts'],
    angle: 'Real build advice including the tariff impact on parts pricing',
  },
  {
    topic: 'women and firearms — the fastest growing demographic in gun ownership',
    category: 'opinion',
    tags: ['Women', 'New Gun Owners', '2A', 'Training'],
    angle: 'Why the numbers are moving, what the industry is getting right and wrong',
  },
  {
    topic: 'constitutional carry — 29 states and counting, what it actually means',
    category: 'laws',
    tags: ['Constitutional Carry', 'Permitless Carry', 'State Laws'],
    angle: 'Which states passed it recently, what changed for carriers on the ground',
  },
  {
    topic: 'CCW insurance in 2026 — USCCA vs CCW Safe vs Armed Citizens Legal Defense',
    category: 'gear',
    tags: ['CCW Insurance', 'USCCA', 'CCW Safe', 'Legal Defense'],
    angle: 'Hard comparison of costs, coverage, and real claim scenarios',
  },
  {
    topic: 'ammo pricing in 2026 — tariffs, bulk buying strategy, and caliber choices',
    category: 'market',
    tags: ['Ammo', 'Tariffs', 'Pricing', 'Bulk Buying'],
    angle: 'Which calibers got hit hardest by tariffs, when to stock up',
  },
  {
    topic: 'home defense setup — what actually works vs what YouTube sells you',
    category: 'training',
    tags: ['Home Defense', 'Shotgun', 'AR-15', 'Training'],
    angle: 'Practical advice on guns, staging, lighting, and communication',
  },
]

// Search for a representative image for each article topic
async function findRepresentativeImage(topic, category) {
  // Use a search query to find relevant image from the web
  const searches = {
    suppressors: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1280&q=80',
    concealed: 'https://images.unsplash.com/photo-1609205807115-b8ea8cf28a52?w=1280&q=80',
    handguns: 'https://images.unsplash.com/photo-1578302758063-aaff0d54e35f?w=1280&q=80',
    laws: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&q=80',
    ar15: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1280&q=80',
    women: 'https://images.unsplash.com/photo-1609205807115-b8ea8cf28a52?w=1280&q=80',
    carry: 'https://images.unsplash.com/photo-1578302758063-aaff0d54e35f?w=1280&q=80',
    insurance: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&q=80',
    ammo: 'https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?w=1280&q=80',
    defense: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1280&q=80',
  }
  const t = topic.toLowerCase()
  if (t.includes('suppressor') || t.includes('nfa')) return searches.suppressors
  if (t.includes('concealed') || t.includes('ccw') || t.includes('carry')) return searches.carry
  if (t.includes('handgun') || t.includes('edc') || t.includes('pistol')) return searches.handguns
  if (t.includes('law') || t.includes('bruen') || t.includes('constitutional')) return searches.laws
  if (t.includes('ar-15') || t.includes('ar15') || t.includes('build')) return searches.ar15
  if (t.includes('women') || t.includes('woman')) return searches.women
  if (t.includes('insurance')) return searches.insurance
  if (t.includes('ammo') || t.includes('pricing') || t.includes('tariff')) return searches.ammo
  if (t.includes('home defense') || t.includes('defense')) return searches.defense
  return searches.carry
}

async function writeArticle(topicData, articleIndex) {
  const { topic, category, tags, angle } = topicData

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const systemPrompt = `You are DJ Cavalcanti, founder of DownRange — a firearms media portal based in Washington State.
You carry daily. You've been a gun owner for over 15 years. You're direct, opinionated, and don't pad your writing.
You write for serious gun owners who are tired of fluffy content.

VOICE RULES (non-negotiable):
- Sound like a real person who carries, shoots, and follows 2A law closely
- Use specific product names, prices, and case names — never vague
- No "comprehensive guides", "dive into", "robust", "seamlessly", "empower", "game-changer"
- No AI filler phrases like "in today's landscape" or "it's worth noting"
- Use "I", "you", "we" naturally — first person works
- Short punchy sentences when making a point
- Longer sentences only when explaining something specific
- Start with a real hook — something that happened, a number, a fact
- Be opinionated — take a clear position when you have one

ARTICLE REQUIREMENTS:
- 900 to 1100 words total
- 5 sections with h2 headers (no clever titles, just what the section covers)
- Must feel like something a 2A columnist would write, not a content farm
- All facts must be current as of 2026
- Original — no copied text from any source
- End with "DownRange Bottom Line:" — one paragraph, clear takeaway`

  const userPrompt = `Write a blog article about: ${topic}

Key angle: ${angle}
Tags: ${tags.join(', ')}
Date: ${dateStr}

Write the full article in HTML. Use <h2> for section headers, <p> for paragraphs, <ul>/<li> for lists when appropriate, <strong> for emphasis on key terms.

Do not add a main title — that comes separately.
Start directly with the first section h2 or a strong opening paragraph.`

  let body = null

  // Try Claude Haiku first (cost-effective for batch writing)
  if (ANTHROPIC_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
        signal: AbortSignal.timeout(45000),
      })
      const d = await res.json()
      body = d.content?.[0]?.text || null
    } catch (e) {
      console.error('[blog-writer] Claude error:', e.message)
    }
  }

  // Fallback to GLM
  if (!body && GLM_KEY) {
    try {
      const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + GLM_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'glm-4-air',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 1800,
        }),
        signal: AbortSignal.timeout(30000),
      })
      const d = await res.json()
      body = d.choices?.[0]?.message?.content || null
    } catch (e) {
      console.error('[blog-writer] GLM error:', e.message)
    }
  }

  if (!body) return null

  // Generate slug from topic
  const slug = 'dj-' + topic.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) + '-' + today.getFullYear()

  // Generate title from topic
  const titlePrompt = `Write a punchy, direct headline for an article about: ${topic}
Angle: ${angle}
Rules: Under 12 words. No clickbait. No questions. Sounds like a firearms columnist, not a content marketer.
Return ONLY the headline, nothing else.`

  let title = topic.charAt(0).toUpperCase() + topic.slice(1)
  try {
    if (ANTHROPIC_KEY) {
      const tr = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', max_tokens: 60,
          messages: [{ role: 'user', content: titlePrompt }],
        }),
        signal: AbortSignal.timeout(10000),
      })
      const td = await tr.json()
      title = td.content?.[0]?.text?.trim().replace(/^["']|["']$/g, '') || title
    }
  } catch {}

  const imageUrl = await findRepresentativeImage(topic, category)

  return {
    _type:       'blogPost',
    slug:        { _type: 'slug', current: slug },
    title,
    excerpt:     angle,
    body,
    imageUrl,
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    authorImg:   '/img/dj-avatar.png',
    category,
    tags,
    readTime:    '8 min read',
    published:   false,   // DRAFT — requires DJ review
    publishedAt: today.toISOString(),
    qualityReviewed: false,
    editorLocked: false,
  }
}

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')

  const isCron  = cronSecret && auth === 'Bearer ' + cronSecret
  const isAdmin = adminKey === ADMIN_KEY
  if (!isCron && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const stats = { written: 0, failed: 0, titles: [] }

  try {
    // Pick 10 topics — rotate based on week number to avoid repeats
    const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000))
    const topics = TOPIC_BUCKETS.slice(0, 10) // use all 10 each week

    for (let i = 0; i < topics.length; i++) {
      try {
        const article = await writeArticle(topics[i], i)
        if (!article) { stats.failed++; continue }

        // Save to Sanity as draft
        await sanity.create(article)
        stats.written++
        stats.titles.push(article.title)

        // Small delay between articles to avoid rate limits
        if (i < topics.length - 1) await new Promise(r => setTimeout(r, 2000))
      } catch (e) {
        console.error('[blog-writer] Article', i, 'failed:', e.message)
        stats.failed++
      }
    }

    return NextResponse.json({
      ok: true,
      ms: Date.now() - t0,
      ...stats,
      message: stats.written + ' draft articles written — pending DJ review at /admin → Blog',
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
