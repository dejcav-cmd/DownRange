// lib/newsletterPersonalization.js
// AI "What to Watch" teaser used by the weekly newsletter.
// (State-based personalization was removed — no reliable way to determine
// a subscriber's state from just their email, and there's no signup field
// for it, so it was always going to be a "set your state" CTA for ~everyone.)

import { ai } from '@/lib/aiRouter'

const FALLBACK_OUTLOOK = [
  'Keep an eye on state legislatures this month — several magazine and permit bills are moving through committee.',
  'ATF rulemaking has stayed active. Expect more guidance on braces and NFA items in the coming weeks.',
  'Ammo prices have been range-bound. Watch for movement if a major manufacturer announces a production change.',
  'Court dockets are full this quarter. A Bruen-adjacent ruling could reshape carry law in more than one state soon.',
]

// One AI call per send (not per subscriber) — cheap tier, fails open to a static line.
export async function getWeeklyOutlook(context = '') {
  try {
    const text = await ai.nano(
      `You write a 2-sentence "What to Watch Next" teaser for a firearms/2A weekly email newsletter. ` +
      `Plain, direct language — like a gun owner talking to other gun owners, not a press release. ` +
      `Never use: comprehensive, robust, leverage, seamlessly, empower, game-changer, dive into. ` +
      `Base it on this week's top stories/deals below. Output ONLY the 2 sentences, nothing else.\n\n${String(context).slice(0, 800)}`,
      { maxTokens: 150 }
    )
    const clean = (text || '').trim().replace(/^["']|["']$/g, '')
    return clean || FALLBACK_OUTLOOK[Math.floor(Math.random() * FALLBACK_OUTLOOK.length)]
  } catch (e) {
    console.error('[newsletter] outlook AI error:', e.message)
    return FALLBACK_OUTLOOK[Math.floor(Math.random() * FALLBACK_OUTLOOK.length)]
  }
}
