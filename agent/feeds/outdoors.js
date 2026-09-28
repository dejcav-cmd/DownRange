/**
 * Outdoors Weekly Content Feed — DownRange
 * Publishes one fresh hunting article every week.
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

Return ONLY the HTML body content. No markdown. No preamble.`

  const raw = await callAIText({ prompt, useCase: 'article', maxTokens: 1500 })
  // Strip any markdown fences (```html ... ```) the model may add
  return (raw || '').replace(/^```[a-z]*\r?\n?/im, '').replace(/\r?\n?```\s*$/im, '').trim()
}

export async function runOutdoorsFeed() {
  console.log('[OUTDOORS] ===== Weekly outdoors content starting =====')
  const t = Date.now()
  let done = 0
  const errors = []
  const saved = []

  const weekNumber = Math.floor(Date.now() / (7 * 24 * 3600 * 1000))

  // Outdoors = Hunting only (Preparedness section removed Sep 2026)
  const huntingTopic = HUNTING_TOPICS[weekNumber % HUNTING_TOPICS.length]

  const topics = [
    { topic: huntingTopic, type: 'hunting', docType: 'huntingContent' },
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
      saved.push(topic.slice(0, 80))
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
