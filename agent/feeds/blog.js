/**
 * Blog Articles Weekly Cron — DownRange
 * Generates 10 new blog article drafts every Friday at 10am UTC.
 * All articles are saved as DRAFTS (status:'draft') for DJ to review.
 * Uses Claude to write in DJ's voice with real topic research.
 * 
 * Schedule: 0 10 * * 5 (10am every Friday)
 */
import { callAIText } from '../../lib/aiClient.js'
import { sleep } from '../utils.js'
import { createClient } from '@sanity/client'

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// ── Topic pools — rotated weekly ─────────────────────────────────────────────
const TOPIC_POOLS = [
  // ATF / Regulatory
  {
    topic: 'The ATF\'s 34 new rulemakings: what actually changed for everyday gun owners',
    category: 'LAW', catColor: '#3b82f6',
    keywords: ['ATF', 'NFA reform', '2026', 'rulemaking', 'CLEO', 'Form 4473']
  },
  {
    topic: 'Suppressors in 2026: no $200 stamp, 6 million registered, and what comes next',
    category: 'ANALYSIS', catColor: '#8b5cf6',
    keywords: ['suppressors', 'NFA', 'tax stamp', 'common use', 'Bruen']
  },
  {
    topic: 'The Bruen standard is reshaping gun law in every state — here is the current map',
    category: 'LAW', catColor: '#3b82f6',
    keywords: ['Bruen', 'Second Amendment', 'state laws', 'constitutional carry']
  },
  {
    topic: 'Constitutional carry in 2026: which 29 states allow it and what changed this year',
    category: 'LAW', catColor: '#3b82f6',
    keywords: ['constitutional carry', 'permitless carry', 'CCW', 'state laws']
  },
  {
    topic: 'The AR-15 in 2026: assault weapons bans, court rulings, and where things stand',
    category: 'LAW', catColor: '#3b82f6',
    keywords: ['AR-15', 'assault weapons ban', 'Bruen', 'common use', 'Heller']
  },
  // Gear / Industry
  {
    topic: 'Best EDC handguns of 2026: what I actually carry and why I switched',
    category: 'GEAR', catColor: '#22c55e',
    keywords: ['EDC', 'concealed carry', 'P365', 'Hellcat', 'Glock 43X', 'Shield Plus']
  },
  {
    topic: 'Red dot sights for carry guns: the definitive guide to mounting, zeroing, and training',
    category: 'TRAINING', catColor: '#f59e0b',
    keywords: ['red dot', 'carry optic', 'RMR', 'SRO', 'mounting', 'zero', 'training']
  },
  {
    topic: 'How tariffs are hitting gun prices in 2026 — and what smart buyers are doing about it',
    category: 'MARKET', catColor: '#ef4444',
    keywords: ['tariffs', 'gun prices', 'MSRP', 'steel', 'aluminum', 'import']
  },
  {
    topic: 'PSA vs. BCM vs. Daniel Defense: which AR-15 platform wins at each price point in 2026',
    category: 'ANALYSIS', catColor: '#8b5cf6',
    keywords: ['AR-15', 'PSA', 'BCM', 'Daniel Defense', 'value', 'comparison', '2026']
  },
  {
    topic: 'The real cost of suppressor ownership in 2026: stamp gone, but what about everything else',
    category: 'GEAR', catColor: '#22c55e',
    keywords: ['suppressor', 'cost', 'host gun', 'caliber', 'cleaning', 'maintenance', 'budget']
  },
  // Self-defense / Training
  {
    topic: 'What two-armed citizens stopping a mass shooter tells us about training',
    category: 'OPINION', catColor: '#a855f7',
    keywords: ['self-defense', 'defensive gun use', 'DGU', 'training', 'mass shooting', 'citizen']
  },
  {
    topic: 'Dry fire in 2026: the apps, the tools, and the routines that actually build skill',
    category: 'TRAINING', catColor: '#f59e0b',
    keywords: ['dry fire', 'training', 'SIRT', 'MantisX', 'Strikeman', 'skill building']
  },
  {
    topic: 'The home defense shotgun is not dead — here is why I keep one next to the Glock',
    category: 'OPINION', catColor: '#a855f7',
    keywords: ['home defense', 'shotgun', 'buckshot', 'slug', 'layered defense', 'penetration']
  },
  {
    topic: 'Night vision for civilians: what changed, what is legal, and what is worth the money',
    category: 'GEAR', catColor: '#22c55e',
    keywords: ['night vision', 'NVG', 'PVS-14', 'thermal', 'civilian legal', 'cost']
  },
  {
    topic: 'Everything wrong with how people train for home defense (and how to fix it)',
    category: 'TRAINING', catColor: '#f59e0b',
    keywords: ['home defense', 'training', 'scenario', 'force-on-force', 'fundamentals']
  },
]

const REAL_IMAGES = {
  'LAW':       'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1400&q=80',
  'ANALYSIS':  'https://images.unsplash.com/photo-1550159930-40066082a4fc?w=1400&q=80',
  'GEAR':      'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1400&q=80',
  'TRAINING':  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=1400&q=80',
  'OPINION':   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1400&q=80',
  'MARKET':    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1400&q=80',
}

async function writeArticle(topicData, weekNumber) {
  const { topic, category, keywords } = topicData

  const prompt = `You are DJ Cavalcanti, founder of DownRange (downrangeco.com) — an independent firearms and 2A news portal. You carry every day and you've been deep in the 2A community for years. You're not a journalist. You're a gun owner who built a platform to give the community the information it deserves.

Write a full blog article about: "${topic}"

STYLE RULES (non-negotiable):
- First person, direct voice. You were there, you did the research, you have opinions.
- No AI-speak: no "comprehensive", "dive into", "robust", "seamlessly", "leverage", "game-changer", "empower"
- Active voice. Short sentences. No padding.
- Specific details: brand names, case names, statute numbers, prices, dates where relevant
- You can have opinions. You can be blunt. Readers respect that.
- 900–1200 words total
- The article should feel like a long-form post someone would actually read, not a listicle

FORMAT (HTML body content):
<h2>Hook Section Title</h2>
<p>Opening 2-3 paragraphs — no fluff intro, start in the middle of the action</p>

<h2>Background & Context</h2>
<p>What led to this, what the reader needs to understand</p>

<h2>What This Means for Gun Owners</h2>
<p>Practical implications — what you actually do differently</p>

<h2>The Industry Angle</h2>
<p>What manufacturers, dealers, and advocacy groups are doing</p>

<h2>What I'm Watching Next</h2>
<p>Where this goes from here. Your take. End strong — not with "time will tell."</p>

Keywords to weave in naturally: ${keywords.join(', ')}

Return ONLY the HTML body content. No markdown. No preamble. No closing note.`

  const raw  = await callAIText({ prompt, useCase: 'article', maxTokens: 2000 })
  // Strip markdown code fences the AI adds despite instructions (```html ... ```)
  const body = raw
    .replace(/^```[a-z]*\s*/i, '')   // opening fence
    .replace(/\s*```\s*$/i, '')       // closing fence
    .trim()
  return body
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export async function runBlogFeed() {
  console.log('[BLOG] ===== Weekly blog article generation starting =====')
  const t = Date.now()
  let done = 0
  const errors = []
  const saved = []

  // Pick 10 topics for this week (rotate through the pool)
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 3600 * 1000))
  const startIdx = (weekNumber * 10) % TOPIC_POOLS.length
  const thisWeeksTopics = []
  for (let i = 0; i < 10; i++) {
    thisWeeksTopics.push(TOPIC_POOLS[(startIdx + i) % TOPIC_POOLS.length])
  }

  console.log(`[BLOG] Week ${weekNumber}, generating articles on ${thisWeeksTopics.length} topics`)

  for (const topicData of thisWeeksTopics) {
    try {
      console.log(`[BLOG] Writing: "${topicData.topic.slice(0, 60)}..."`)
      
      const body = await writeArticle(topicData, weekNumber)
      
      if (!body || body.length < 500) {
        errors.push(`Short content for: ${topicData.topic.slice(0, 40)}`)
        continue
      }

      const slug = slugify(topicData.topic) + '-' + new Date().getFullYear()
      const now = new Date().toISOString()
      
      // Generate title from topic (clean it up slightly)
      const title = topicData.topic

      // Save as DRAFT to Sanity — DJ must review and publish
      await writeClient.createOrReplace({
        _id:        `blog-draft-${slug}-${weekNumber}`,
        _type:      'blogPost',
        title,
        slug:       { current: slug },
        status:     'draft',
        category:   topicData.category,
        catColor:   topicData.catColor,
        author:     'DJ Cavalcanti',
        authorRole: 'Founder, DownRange',
        authorImg:  '/img/dj-avatar.jpg',
        body,
        imageUrl:   REAL_IMAGES[topicData.category] || REAL_IMAGES['ANALYSIS'],
        excerpt:    body.replace(/<[^>]+>/g, '').slice(0, 200) + '...',
        tags:       topicData.keywords.slice(0, 5),
        publishedAt: now,
        draftWeek:  weekNumber,
        readTime:   `${Math.ceil(body.replace(/<[^>]+>/g, '').split(' ').length / 200)} min read`,
      })

      done++
      saved.push(title)
      console.log(`[BLOG] ✓ Draft saved: "${title.slice(0, 60)}"`)
      await sleep(3000) // Rate limit respect
      
    } catch (e) {
      const msg = `${topicData.topic.slice(0, 40)}: ${e.message}`
      errors.push(msg)
      console.error(`[BLOG] ✗ ${msg}`)
    }
  }

  const ms = Date.now() - t
  console.log(`[BLOG] Done: ${done} drafts saved, ${errors.length} errors in ${ms}ms`)
  console.log(`[BLOG] Review drafts at: https://www.sanity.io/manage`)
  
  return { done, errors, ms, weekNumber, saved, headlines: saved.slice(0, 20) }
}
