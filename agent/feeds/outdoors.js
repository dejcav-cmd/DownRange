/**
 * Outdoors Weekly Content Feed — DownRange
 * Publishes fresh hunting + preparedness content every week.
 * Alternates between hunting and preparedness topics.
 * Runs: 0 9 * * 1 (9am every Monday)
 */
import { callAIText } from '../../lib/aiClient.js'
import { publishToSanity, sleep } from '../utils.js'

const HUNTING_TOPICS = [
  'Whitetail deer rut behavior and how to use it to your advantage',
  'Best elk hunting units on public land in Colorado for new hunters',
  'Turkey calling mistakes that kill your hunts and how to fix them',
  'How to read topo maps for mule deer hunting',
  'Field dressing a deer alone: step-by-step with photos guide',
  'Black bear hunting: bait vs. spot-and-stalk strategies compared',
  'Best hunting states for non-residents without breaking the bank',
  'Waterfowl hunting the Mississippi Flyway: timing and location strategy',
  'Archery elk: calling sequences that work during the rut',
  'How to choose a hunting rifle caliber based on your game and terrain',
  'Scouting whitetail deer before the season opens',
  'Winter coyote hunting tactics and gear recommendations',
]

const PREP_TOPICS = [
  'How to build a 72-hour emergency kit for a family of four under $200',
  'Home security audit: what most gun owners get wrong about their perimeter',
  'HAM radio for preppers: getting your Technician license in 30 days',
  'IFAK build guide: what goes in your individual first aid kit and why',
  'Water storage and purification for grid-down scenarios',
  'Food storage on a budget: what to buy first and how to rotate it',
  'Vehicle emergency kit: what belongs in every truck bed',
  'Grid-down communication plan for families',
  'Home defense gun selection: shotgun vs. carbine vs. pistol',
  'Generator selection guide: what size do you actually need',
  'Building a neighborhood preparedness network',
  'Power bank and solar charging: keeping devices alive off-grid',
]

async function generateContent(topic, type) {
  const prompt = `Write a practical, no-nonsense article for DownRange about: "${topic}"

Audience: Serious gun owners, hunters, and prepared citizens who carry daily and read 2A case law.
Tone: Direct. Specific. Like a guy who actually does this wrote it.
Length: 600-800 words.
Format: Return HTML with these exact 4 sections using <h2> tags:
1. Opening (no h2 needed — just start strong, no fluff)
2. <h2>The Setup</h2> — background, why this matters right now
3. <h2>What Actually Works</h2> — specific, actionable, field-tested advice
4. <h2>What to Do Next</h2> — concrete next steps the reader can take this week

Rules:
- No "comprehensive", "dive into", "robust", "leverage", "seamlessly"
- No padded intros
- Specific details only — brand names, distances, weights, prices where relevant
- Active voice
- If it's a hunting article, include specific states/seasons/cartridges where relevant
- If it's a preparedness article, include specific products/prices/sources where relevant

Return ONLY the HTML body content. No markdown. No preamble.`

  const body = await callAIText({ prompt, useCase: 'article', maxTokens: 1500 })
  return body
}

export async function runOutdoorsFeed() {
  console.log('[OUTDOORS] ===== Weekly outdoors content starting =====')
  const t = Date.now()
  let done = 0
  const errors = []

  // Alternate: week number determines hunting vs prep
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 3600 * 1000))
  const isHuntingWeek = weekNumber % 2 === 0

  // Pick 2 topics: 1 hunting + 1 prep every week
  const huntingTopic = HUNTING_TOPICS[weekNumber % HUNTING_TOPICS.length]
  const prepTopic    = PREP_TOPICS[weekNumber % PREP_TOPICS.length]

  const topics = [
    { topic: huntingTopic, type: 'hunting',      docType: 'huntingContent'  },
    { topic: prepTopic,    type: 'preparedness', docType: 'prepContent'     },
  ]

  for (const { topic, type, docType } of topics) {
    try {
      console.log(`[OUTDOORS] Generating ${type}: "${topic.slice(0, 60)}..."`)
      const body = await generateContent(topic, type)
      if (!body || body.length < 200) {
        errors.push(`${type}: content too short`)
        continue
      }

      const slug = topic.toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .trim().replace(/\s+/g, '-')
        .slice(0, 80) + '-' + weekNumber

      await publishToSanity({
        _id:         `${docType}-${weekNumber}-${type}`,
        _type:       docType,
        title:       topic,
        body,
        category:    type,
        publishedAt: new Date().toISOString(),
        slug:        { current: slug },
        weekNumber,
      })
      done++
      console.log(`[OUTDOORS] ✓ Published: ${topic.slice(0, 60)}`)
      await sleep(2000)
    } catch (e) {
      const msg = `${type}: ${e.message}`
      errors.push(msg)
      console.error(`[OUTDOORS] ✗ ${msg}`)
    }
  }

  const ms = Date.now() - t
  console.log(`[OUTDOORS] Done: ${done} published, ${errors.length} errors in ${ms}ms`)
  return { done, errors, ms, week: weekNumber, saved, headlines: saved.slice(0, 20) }
}
