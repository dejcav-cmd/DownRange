/**
 * Giveaways Feed — DownRange
 * Searches the web for active gun giveaways from manufacturers, YouTubers, and retailers.
 * Stores entries to Sanity giveaway schema.
 * Runs daily at 8am UTC.
 */
import { callAIText } from '../../lib/aiClient.js'
import { publishToSanity, sleep } from '../utils.js'

// Manufacturers and retailers known to run giveaways
const GIVEAWAY_SOURCES = [
  { name: 'Palmetto State Armory',  url: 'https://palmettostatearmory.com/blog/',          type: 'retailer'     },
  { name: 'Springfield Armory',     url: 'https://www.springfield-armory.com/blog/',        type: 'manufacturer' },
  { name: 'SIG Sauer',              url: 'https://www.sigsauer.com/news/',                  type: 'manufacturer' },
  { name: 'Brownells',              url: 'https://www.brownells.com/promotions/',            type: 'retailer'     },
  { name: 'GLOCK',                  url: 'https://us.glock.com/en/news',                    type: 'manufacturer' },
  { name: 'Gun Owners of America',  url: 'https://gunowners.org/news/',                     type: 'organization' },
  { name: 'Warrior Poet Society',   url: 'https://www.warriorpoetsociety.net/blogs/news',   type: 'youtuber'     },
  { name: 'Colion Noir',            url: 'https://colionnoir.com/',                         type: 'youtuber'     },
]

// Web search queries to find active giveaways
const SEARCH_QUERIES = [
  'gun giveaway 2026 enter win free firearm',
  'firearm giveaway sweepstakes 2026 site:instagram.com OR site:youtube.com',
  'free gun giveaway manufacturer 2026',
  'pistol rifle giveaway enter win 2026',
  'palmetto state armory giveaway 2026',
  'sig sauer glock springfield giveaway 2026',
]

async function searchForGiveaways() {
  const results = []
  
  for (const query of SEARCH_QUERIES) {
    try {
      const prompt = `Search for active gun/firearm giveaways using this query: "${query}"

Find real, currently active firearm giveaways from legitimate manufacturers, retailers, or 2A organizations.

For each giveaway found, extract:
- title: The giveaway name/prize description
- sponsor: Who is running it (company/brand name)
- entryUrl: Direct link to enter (must be a real URL)
- endDate: When it ends (ISO date string, or null if unknown)
- prize: What they're giving away
- category: one of: pistol, rifle, shotgun, ammo, gear, accessories, nfa, optics
- type: one of: manufacturer, retailer, youtuber, organization

Only include giveaways that:
1. Are currently active (not expired)
2. Have a real entry URL
3. Are for firearms, ammo, or firearms accessories
4. Are from legitimate, identifiable companies

Respond ONLY with valid JSON array. No markdown. No commentary. Example:
[{"title":"Win a SIG P365","sponsor":"SIG Sauer","entryUrl":"https://...","endDate":"2026-06-30","prize":"SIG Sauer P365 Pistol","category":"pistol","type":"manufacturer"}]

If no real results found, respond with: []`

      const raw = await callAIText(prompt, 'smart')
      const clean = (raw || '').replace(/```json|```/g, '').trim()
      if (!clean || clean === '[]') continue

      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed)) {
        results.push(...parsed)
        console.log(`[GIVEAWAYS] Query "${query.slice(0,40)}": found ${parsed.length} giveaways`)
      }
    } catch (e) {
      console.warn(`[GIVEAWAYS] Query failed: ${e.message}`)
    }
    await sleep(1000)
  }
  return results
}

function deduplicateGiveaways(giveaways) {
  const seen = new Set()
  return giveaways.filter(g => {
    const key = (g.entryUrl || '').toLowerCase().replace(/[?#].*/, '')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function runGiveawaysFeed() {
  console.log('[GIVEAWAYS] ===== Giveaways feed starting =====')
  const t = Date.now()
  let done = 0
  let skipped = 0
  const errors = []

  try {
    const raw = await searchForGiveaways()
    const giveaways = deduplicateGiveaways(raw)
    console.log(`[GIVEAWAYS] Found ${raw.length} raw, ${giveaways.length} unique after dedup`)

    for (const g of giveaways) {
      if (!g.entryUrl || !g.title || !g.sponsor) { skipped++; continue }

      // Validate URL format
      try { new URL(g.entryUrl) } catch { skipped++; continue }

      const _id = 'giveaway-' + Buffer.from(g.entryUrl).toString('base64').slice(0,20).replace(/[^a-zA-Z0-9]/g,'')

      try {
        await publishToSanity({
          _id,
          _type:     'giveaway',
          title:     g.title,
          sponsor:   g.sponsor,
          entryUrl:  g.entryUrl,
          prize:     g.prize || g.title,
          category:  g.category || 'gear',
          sourceType:g.type || 'manufacturer',
          endDate:   g.endDate || null,
          active:    true,
          featured:  false,
          addedAt:   new Date().toISOString(),
        })
        done++
        console.log(`[GIVEAWAYS] ✓ ${g.sponsor}: ${g.title.slice(0,60)}`)
      } catch (e) {
        if (e.message?.includes('duplicate') || e.message?.includes('already exists')) {
          skipped++
        } else {
          errors.push(`${g.sponsor}: ${e.message}`)
        }
      }
    }
  } catch (e) {
    console.error('[GIVEAWAYS] Fatal:', e.message)
    errors.push(e.message)
  }

  const ms = Date.now() - t
  console.log(`[GIVEAWAYS] Done: ${done} new, ${skipped} skipped, ${errors.length} errors in ${ms}ms`)
  return { done, skipped, errors, ms }
}
