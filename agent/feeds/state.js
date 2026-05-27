/**
 * State Hub Feed Agent
 * Updates recent bills per state from LegiScan
 * Runs daily at 8am via cron
 */
import { discordNotify, sleep } from '../utils.js'
import { createClient } from '@sanity/client'


const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})


const STATE_ABBRS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]
const KEYWORDS = 'firearms OR gun OR "concealed carry" OR "Second Amendment" OR ammunition'

async function fetchStateBills(stateAbbr) {
  const url = new URL('https://api.legiscan.com/')
  url.searchParams.set('key',   process.env.LEGISCAN_KEY)
  url.searchParams.set('op',    'getSearch')
  url.searchParams.set('query', KEYWORDS)
  url.searchParams.set('state', stateAbbr)

  const res  = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== 'OK' || !data.searchresult?.results) return []

  return Object.values(data.searchresult.results)
    .filter(r => r && r.bill_id)
    .slice(0, 5)
    .map(r => ({
      title:  r.title,
      status: mapStatus(r.status),
      url:    r.url,
      date:   r.last_action_date,
    }))
}

function mapStatus(statusId) {
  const map = { 1: 'Introduced', 2: 'In Committee', 3: 'Passed', 4: 'Signed', 5: 'Failed', 6: 'Vetoed' }
  return map[statusId] || 'In Progress'
}

async function runStateFeed() {
  console.log('🗺 State feed starting...')
  let updated = 0
  const BATCH = 10

  for (let i = 0; i < STATE_ABBRS.length; i += BATCH) {
    const batch = STATE_ABBRS.slice(i, i + BATCH)

    for (const abbr of batch) {
      try {
        await sleep(800)
        const bills = await fetchStateBills(abbr)

        // Patch the stateProfile document — only update recentBills array
        // sanity client defined at module level above

        await sanity.patch(`state-${abbr.toLowerCase()}`)
          .set({ recentBills: bills, lastUpdated: new Date().toISOString() })
          .commit()

        updated++
        console.log(`✓ ${abbr}: ${bills.length} bills`)
      } catch (err) {
        console.error(`✗ ${abbr}: ${err.message}`)
      }
    }

    // Wait 30s between batches
    if (i + BATCH < STATE_ABBRS.length) {
      console.log(`Batch done. Waiting 30s before next batch...`)
      await new Promise(r => setTimeout(r, 30000))
    }
  }

  console.log(`🗺 State feed done — ${updated}/50 states updated`)
  return updated
}

export { runStateFeed }
