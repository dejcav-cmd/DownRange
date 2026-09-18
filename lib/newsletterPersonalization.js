// lib/newsletterPersonalization.js
// State-based personalization + AI "What to Watch" teaser for the weekly newsletter.
// Kept separate from emailTemplates.js so /api/newsletter (real send) and
// /api/newsletter/content (demo/test preview) share identical logic.

import { client } from '@/sanity/lib/client'
import { ai } from '@/lib/aiRouter'

// Fetch stateProfile docs for a set of 2-letter state codes in one query.
// Returns { WA: {...}, TX: {...} } keyed by abbr. Never throws — fails open to {}.
export async function fetchStateProfiles(abbrs = []) {
  const clean = [...new Set(abbrs.filter(Boolean).map(a => String(a).toUpperCase()))]
  if (!clean.length) return {}
  try {
    const rows = await client.fetch(
      `*[_type == "stateProfile" && abbr in $abbrs]{ name, abbr, rating, "recentBills": recentBills[0...1], summary }`,
      { abbrs: clean }
    )
    const map = {}
    for (const r of rows) map[r.abbr] = r
    return map
  } catch (e) {
    console.error('[newsletter] stateProfile batch fetch error:', e.message)
    return {}
  }
}

// Single-state convenience wrapper (used by the demo/preview route).
export async function getStateBlockData(stateAbbr) {
  if (!stateAbbr) return null
  const map = await fetchStateProfiles([stateAbbr])
  return map[String(stateAbbr).toUpperCase()] || null
}

const FALLBACK_OUTLOOK = [
  'Keep an eye on state legislatures this month — several magazine and permit bills are moving through committee.',
  'ATF rulemaking has stayed active. Expect more guidance on braces and NFA items in the coming weeks.',
  'Ammo prices have been range-bound. Watch for movement if a major manufacturer announces a production change.',
  'Court dockets are full this quarter. A Bruen-adjacent ruling could reshape carry law in more than one state soon.',
]

// One AI call per send (not per subscriber/state) — cheap tier, fails open to a static line.
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
