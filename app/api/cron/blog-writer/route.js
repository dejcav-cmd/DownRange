export const dynamic = 'force-dynamic'
export const maxDuration = 120
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'
import { callAIText } from '@/lib/aiClient.js'
import { fetchAndUploadImage } from '@/lib/imageUpload.js'

// DownRange Blog Writer — Tuesdays + Thursdays, 7:32 AM Pacific
// Publishes exactly ONE article LIVE per run (no draft/review step — DJ wants
// these live immediately). Each article carries DJ's byline, so quality gates
// below are strict: banned-language check, minimum length, and a real
// topic-relevant image downloaded and uploaded to the Sanity CDN (never a
// generic hotlinked stock photo).
//
// Topic selection (Sep 2026 rewrite):
//   Tuesday  -> the week's biggest firearms story from our own news feed
//   Thursday -> roundup of the week's new gun releases
//   Fallback -> the other type, then the evergreen TOPIC_BUCKETS rotation
// Every run creates a NEW post (unique _id + slug). The old design gave each
// evergreen topic a fixed _id and used createOrReplace, so posts overwrote each
// other, kept their original _createdAt and sank out of the /blog listing, and
// at most 10 writer posts could ever exist.

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Use the flagship model first for this job specifically — every other
// useCase in lib/aiClient.js defaults to Haiku-primary for cost reasons, but
// this content carries DJ's signature and must be the best the site produces.
const QUALITY_CHAIN = 'anthropic:claude-sonnet-4-5-20251022,anthropic:claude-haiku-4-5-20251001'

const BANNED_PHRASES = [
  'comprehensive guide', 'dive into', 'cutting-edge', 'robust', 'seamlessly',
  'empower', 'game-changer', "in today's landscape", "it's worth noting",
  'unpack', 'delve', 'navigate the', 'unprecedented', 'paradigm', 'synergy',
  'holistic', 'takeaway', 'shed light on', 'moving forward', 'utilize',
]

function findBannedPhrase(text) {
  const lower = (text || '').toLowerCase()
  return BANNED_PHRASES.find(p => lower.includes(p)) || null
}

// 10 rotating topic buckets, each with a real, specific image search query
// (always anchored with a concrete firearm/gear noun per the site's image rule).
const TOPIC_BUCKETS = [
  {
    id: 0,
    topic: 'suppressors and NFA after the One Big Beautiful Bill tax elimination',
    category: 'OPINION',
    tags: ['NFA', 'Suppressors', 'One Big Beautiful Bill', 'Tax Stamps'],
    angle: 'What changed, what it costs now, which states still ban it, what to buy',
    imageQuery: 'suppressor silencer rifle firearm',
    baseSlug: 'suppressors-nfa-tax-elimination',
  },
  {
    id: 1,
    topic: 'concealed carry reciprocity and the state-by-state patchwork in 2026',
    category: 'LAW',
    tags: ['CCW', 'Reciprocity', 'Concealed Carry', 'State Laws'],
    angle: 'Practical guide for people who carry and cross state lines',
    imageQuery: 'concealed carry holster handgun firearm',
    baseSlug: 'ccw-reciprocity-state-patchwork',
  },
  {
    id: 2,
    topic: 'best EDC handguns in 2026 — real comparisons for real carry',
    category: 'GEAR',
    tags: ['EDC', 'Pistols', 'Concealed Carry', 'Handguns'],
    angle: 'Glock 19 vs SIG P365 XL vs Springfield Hellcat — specific, opinionated picks',
    imageQuery: 'compact pistol handgun firearm',
    baseSlug: 'best-edc-handguns',
  },
  {
    id: 3,
    topic: 'the Bruen standard and how states are trying to work around it',
    category: 'LAW',
    tags: ['Bruen', 'Second Amendment', 'SCOTUS', 'Constitutional Carry'],
    angle: 'Which state laws are winning in court, which are getting struck down',
    imageQuery: 'courthouse justice column government',
    baseSlug: 'bruen-standard-state-workarounds',
  },
  {
    id: 4,
    topic: 'building your first AR-15 in 2026 — parts, tariffs, and what to skip',
    category: 'BUILDS',
    tags: ['AR-15', 'Build Guide', 'Tariffs', 'Parts'],
    angle: 'Real build advice including the tariff impact on parts pricing',
    imageQuery: 'AR-15 rifle firearm parts',
    baseSlug: 'first-ar15-build-guide',
  },
  {
    id: 5,
    topic: 'women and firearms — the fastest growing demographic in gun ownership',
    category: 'OPINION',
    tags: ['Women', 'New Gun Owners', '2A', 'Training'],
    angle: 'Why the numbers are moving, what the industry is getting right and wrong',
    imageQuery: 'woman shooting range pistol firearm',
    baseSlug: 'women-firearms-growing-demographic',
  },
  {
    id: 6,
    topic: 'constitutional carry — 29 states and counting, what it actually means',
    category: 'LAW',
    tags: ['Constitutional Carry', 'Permitless Carry', 'State Laws'],
    angle: 'Which states passed it recently, what changed for carriers on the ground',
    imageQuery: 'handgun holster concealed carry firearm',
    baseSlug: 'constitutional-carry-29-states',
  },
  {
    id: 7,
    topic: 'CCW insurance in 2026 — USCCA vs CCW Safe vs Armed Citizens Legal Defense',
    category: 'GEAR',
    tags: ['CCW Insurance', 'USCCA', 'CCW Safe', 'Legal Defense'],
    angle: 'Hard comparison of costs, coverage, and real claim scenarios',
    imageQuery: 'handgun holster carry firearm legal',
    baseSlug: 'ccw-insurance-comparison',
  },
  {
    id: 8,
    topic: 'ammo pricing in 2026 — tariffs, bulk buying strategy, and caliber choices',
    category: 'MARKET',
    tags: ['Ammo', 'Tariffs', 'Pricing', 'Bulk Buying'],
    angle: 'Which calibers got hit hardest by tariffs, when to stock up',
    imageQuery: 'ammunition bullets cartridges firearm',
    baseSlug: 'ammo-pricing-tariffs',
  },
  {
    id: 9,
    topic: 'home defense setup — what actually works vs what YouTube sells you',
    category: 'TRAINING',
    tags: ['Home Defense', 'Shotgun', 'AR-15', 'Training'],
    angle: 'Practical advice on guns, staging, lighting, and communication',
    imageQuery: 'shotgun rifle home defense firearm',
    baseSlug: 'home-defense-setup-reality-check',
  },
]

// ISO week number, used to derive a deterministic rotation slot with no
// persisted state needed.
function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

async function generateArticleBody(topicData) {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const systemPrompt = `You are DJ Cavalcanti, founder of DownRange — a firearms media portal based in Washington State.
You carry daily. You've been a gun owner for over 15 years. You're direct, opinionated, and don't pad your writing.
You write for serious gun owners who are tired of fluffy content. This article is published under your real byline
with no editorial review before it goes live — it must read as something you would actually put your name on.

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

  const userPrompt = `Write a blog article about: ${topicData.topic}

Key angle: ${topicData.angle}
Tags: ${topicData.tags.join(', ')}
Date: ${dateStr}
${topicData.context ? `
BASE THE ARTICLE ON THESE REAL, CURRENT DEVELOPMENTS (from DownRange's own coverage this week).
Use these facts; do not invent specs, prices, dates, case names or quotes beyond them.
When you reference one of these items, link it with its DownRange URL using <a href="...">.
${topicData.context}
` : ''}
Write the full article in HTML. Use <h2> for section headers, <p> for paragraphs, <ul>/<li> for lists when appropriate, <strong> for emphasis on key terms.

Do not add a main title — that comes separately.
Start directly with the first section h2 or a strong opening paragraph.`

  // Up to 2 attempts: if the first pass trips the banned-language check or is
  // too short, retry once with an explicit correction before giving up. This
  // is worth the extra call — a bad article going live under DJ's name is a
  // worse outcome than one skipped run.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = attempt === 1
      ? userPrompt
      : userPrompt + `\n\nIMPORTANT: A previous draft used corporate-sounding filler language. Avoid every banned phrase listed in your instructions — write plainer, more direct sentences.`

    let body
    try {
      body = await callAIText({ prompt, systemPrompt, maxTokens: 2500, chain: QUALITY_CHAIN })
    } catch (e) {
      console.error(`[blog-writer] generation attempt ${attempt} failed:`, e.message)
      continue
    }

    const plainWords = (body || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
    const banned = findBannedPhrase(body)

    if (body && plainWords >= 500 && !banned) {
      return { body, wordCount: plainWords }
    }
    console.warn(`[blog-writer] attempt ${attempt} rejected — words:${plainWords} banned:"${banned}"`)
  }
  return null
}

async function generateTitle(topicData) {
  const titlePrompt = `Write a punchy, direct headline for an article about: ${topicData.topic}
Angle: ${topicData.angle}
Rules: Under 12 words. No clickbait. No questions. Sounds like a firearms columnist, not a content marketer.
Return ONLY the headline, nothing else.`
  try {
    const title = await callAIText({ prompt: titlePrompt, maxTokens: 60, chain: QUALITY_CHAIN })
    return title?.trim().replace(/^["']|["']$/g, '') || null
  } catch (e) {
    console.error('[blog-writer] title generation failed:', e.message)
    return null
  }
}

async function writeArticle(topicData) {
  const gen = await generateArticleBody(topicData)
  if (!gen) return null

  const title = await generateTitle(topicData) || (topicData.topic.charAt(0).toUpperCase() + topicData.topic.slice(1))

  const today = new Date()
  const year = today.getUTCFullYear()
  const stamp = today.toISOString().slice(0, 10).replace(/-/g, '')
  const baseSlug = topicData.baseSlug || slugify(title)
  let slug = `dj-${baseSlug}-${year}`
  // Never overwrite an existing post: add the date if the slug is taken
  const taken = await sanity.fetch('count(*[_type=="blogPost" && slug.current==$s])', { s: slug }).catch(() => 0)
  if (taken) slug = `dj-${baseSlug}-${stamp}`

  // Real, topic-relevant image — searched and uploaded to the Sanity CDN, not
  // a generic hotlinked stock photo. If the search comes back empty, we skip
  // this run rather than publish with no image or a wrong one.
  const imageUrl = topicData.imageUrl
    || await fetchAndUploadImage(topicData.imageQuery, slug).catch(() => null)
  if (!imageUrl) {
    console.error('[blog-writer] no image found for', slug)
    return null
  }

  const readTime = Math.max(1, Math.ceil(gen.wordCount / 200))

  return {
    _id:         `blog-dj-${stamp}-${Math.random().toString(36).slice(2, 8)}`,
    topicSource: topicData.source || 'evergreen',
    sourceRefs:  topicData.sourceRefs || [],
    _type:       'blogPost',
    slug:        { _type: 'slug', current: slug },
    title,
    excerpt:     topicData.angle,
    body:        gen.body,
    imageUrl,
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    authorImg:   '/img/dj-avatar.png',
    category:    topicData.category,
    tags:        topicData.tags,
    readTime,
    status:      'published',
    published:   true,
    publishedAt: today.toISOString(),
    qualityReviewed: true,
    editorLocked: false,
  }
}

// ── Topic builders ─────────────────────────────────────────────────────────────
function slugify(t) {
  return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)
}

async function usedSourceRefs() {
  const rows = await sanity.fetch(
    `*[_type=="blogPost" && defined(sourceRefs) && _createdAt > $since].sourceRefs[]`,
    { since: new Date(Date.now() - 60 * 86400000).toISOString() }
  ).catch(() => [])
  return new Set(rows || [])
}

// Tuesday: the week's biggest story, plus related coverage for context
async function buildNewsTopic(used) {
  const since = new Date(Date.now() - 7 * 86400000).toISOString()
  const rows = await sanity.fetch(
    `*[_type=="newsArticle" && approved==true && publishedAt > $since && defined(slug.current)
       && category in ["law","breaking","policy","industry","legal","news"]]
     | order(coalesce(urgencyScore,0) desc, publishedAt desc)[0...25]
     { title, summary, category, source, "slug": slug.current, relatedStates, urgencyScore }`,
    { since }
  ).catch(() => [])
  const fresh = (rows || []).filter(r => !used.has('news:' + r.slug) && r.title && r.summary)
  if (fresh.length < 2) return null
  const lead = fresh[0]
  const related = fresh.filter(r => r !== lead && (r.category === lead.category ||
    (r.relatedStates || []).some(s => (lead.relatedStates || []).includes(s)))).slice(0, 3)
  const items = [lead, ...related]
  const context = items.map(r =>
    `- ${r.title} (${r.source || 'DownRange'}) — https://www.downrangeco.com/news/${r.slug}\n  ${String(r.summary).slice(0, 400)}`
  ).join('\n')
  const states = [...new Set(items.flatMap(r => r.relatedStates || []))].slice(0, 6)
  return {
    source: 'news',
    topic: lead.title,
    angle: `What this week's development means for gun owners${states.length ? ` (especially in ${states.join(', ')})` : ''}, what happens next, and what readers should do now. Link the relevant DownRange state law pages (https://www.downrangeco.com/laws/XX) where states are involved.`,
    category: 'ANALYSIS',
    tags: [lead.category, ...states].filter(Boolean).slice(0, 6),
    imageQuery: `${lead.title.split(' ').slice(0, 6).join(' ')} firearm`,
    context,
    sourceRefs: items.map(r => 'news:' + r.slug),
  }
}

// Thursday: this week's new gun releases
async function buildReleasesTopic(used) {
  const since = new Date(Date.now() - 10 * 86400000).toISOString()
  const rows = await sanity.fetch(
    `*[_type=="firearmRelease" && publishedAt > $since && defined(slug.current)]
     | order(publishedAt desc)[0...8]
     { brand, model, category, caliber, msrp, summary, "slug": slug.current, "img": heroImage.asset->url }`,
    { since }
  ).catch(() => [])
  const fresh = (rows || []).filter(r => !used.has('release:' + r.slug) && r.brand && r.model)
  if (fresh.length < 2) return null
  const picks = fresh.slice(0, 5)
  const names = picks.map(r => `${r.brand} ${r.model}`)
  const context = picks.map(r =>
    `- ${r.brand} ${r.model}${r.category ? ' — ' + r.category : ''}${r.caliber ? ', ' + r.caliber : ''}${r.msrp ? ', MSRP $' + r.msrp : ''} — https://www.downrangeco.com/releases/${r.slug}\n  ${String(r.summary || '').slice(0, 350)}`
  ).join('\n')
  return {
    source: 'releases',
    topic: `new gun releases this week: ${names.join(', ')}`,
    angle: 'A roundup of this week\'s new guns: who each one is for, what stands out, price where known, and which one DJ would actually buy. One h2 section per gun plus the bottom line. Note state legality issues (magazine limits, assault-weapon bans) where relevant.',
    category: 'RELEASES',
    tags: ['New Releases', ...picks.map(r => r.brand)].slice(0, 6),
    imageUrl: picks.find(r => r.img)?.img || null,
    imageQuery: `${names[0]} firearm`,
    baseSlug: `new-gun-releases-week-${new Date().toISOString().slice(0, 10)}`,
    context,
    sourceRefs: picks.map(r => 'release:' + r.slug),
  }
}

// Fallback: evergreen rotation, skipping topics written in the last 60 days
async function buildEvergreenTopic(week, isThursday) {
  const recent = await sanity.fetch(
    `*[_type=="blogPost" && _createdAt > $since].slug.current`,
    { since: new Date(Date.now() - 60 * 86400000).toISOString() }
  ).catch(() => [])
  for (let i = 0; i < TOPIC_BUCKETS.length; i++) {
    const t = TOPIC_BUCKETS[(week * 2 + (isThursday ? 1 : 0) + i) % TOPIC_BUCKETS.length]
    if (!(recent || []).some(sl => sl && sl.includes(t.baseSlug))) return { ...t, source: 'evergreen' }
  }
  return null
}

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')

  const isCron    = cronSecret && auth === 'Bearer ' + cronSecret
  const isVercel  = req.headers.get('x-vercel-cron') === '1'
  const isAdmin   = adminKey === ADMIN_KEY
  if (!isCron && !isVercel && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()

  try {
    const now = new Date()
    const isThursday = now.getUTCDay() === 4 // cron fires 14:32 UTC = 7:32 AM PDT, same calendar day both zones
    const week = getISOWeek(now)
    const used = await usedSourceRefs()
    const forced = new URL(req.url).searchParams.get('mode') // manual: ?mode=news|releases|evergreen
    const order = forced ? [forced]
      : isThursday ? ['releases', 'news', 'evergreen'] : ['news', 'releases', 'evergreen']
    let topicData = null
    for (const mode of order) {
      if (mode === 'news')      topicData = await buildNewsTopic(used)
      if (mode === 'releases')  topicData = await buildReleasesTopic(used)
      if (mode === 'evergreen') topicData = await buildEvergreenTopic(week, isThursday)
      if (topicData) break
    }
    if (!topicData) topicData = TOPIC_BUCKETS[(week * 2 + (isThursday ? 1 : 0)) % TOPIC_BUCKETS.length]

    const article = await writeArticle(topicData)

    if (!article) {
      await reportCronRun('blog-writer', {
        status: 'failed',
        ms: Date.now() - t0,
        error: `Failed to produce a publishable article for topic "${topicData.topic}" (quality gate or image search failed)`,
      })
      return NextResponse.json({ ok: false, error: 'Article failed quality gate or image search', topic: topicData.topic }, { status: 500 })
    }

    await sanity.create(article)

    await reportCronRun('blog-writer', {
      status: 'success',
      ms: Date.now() - t0,
      details: `Published live (${article.topicSource}): "${article.title}" [${article.slug.current}]`,
    })
    return NextResponse.json({
      ok: true,
      ms: Date.now() - t0,
      title: article.title,
      slug: article.slug.current,
      imageUrl: article.imageUrl,
      message: 'Article published live at /blog/' + article.slug.current,
    })
  } catch (err) {
    await reportCronRun('blog-writer', { status: 'failed', ms: Date.now() - t0, error: err.message })
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
