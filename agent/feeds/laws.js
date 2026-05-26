require('dotenv').config()
const axios = require('axios')
const { enrichLawWithClaude, publishToSanity, notifyError, sleep } = require('../utils')

const STATUS_MAP = {
  'Introduced': 'pending',
  'Referred to Committee': 'pending',
  'Passed House': 'advancing',
  'Passed Senate': 'advancing',
  'Signed by President': 'passed',
  'Became Law': 'passed',
  'Vetoed': 'failed',
  'Failed': 'failed',
}

function mapStatus(text) {
  if (!text) return 'pending'
  for (const [key, val] of Object.entries(STATUS_MAP)) {
    if (text.toLowerCase().includes(key.toLowerCase())) return val
  }
  if (text.toLowerCase().includes('challenge') || text.toLowerCase().includes('injunction')) return 'challenged'
  return 'pending'
}

async function fetchCongressBills() {
  if (!process.env.CONGRESS_GOV_KEY) {
    console.log('[LAWS] No Congress.gov key, skipping federal bills')
    return []
  }
  try {
    const res = await axios.get('https://api.congress.gov/v3/bill', {
      params: {
        query: 'firearms OR gun OR "Second Amendment" OR ATF',
        sort: 'updateDate+desc', limit: 20, format: 'json',
        api_key: process.env.CONGRESS_GOV_KEY
      }
    })
    return (res.data.bills || []).map(b => ({
      _id: `law-federal-${b.congress}-${b.type}-${b.number}`,
      _type: 'legislation',
      title: b.title || 'Untitled Bill',
      billNumber: `${b.type} ${b.number}`,
      level: 'federal',
      status: mapStatus(b.latestAction?.text),
      lastActionText: b.latestAction?.text,
      lastActionDate: b.latestAction?.actionDate,
      summary: b.latestAction?.text,
      url: `https://www.congress.gov/bill/${b.congress}th-congress/${b.type === 'HR' ? 'house-bill' : 'senate-bill'}/${b.number}`,
      congress: `${b.congress}th`,
      urgent: false,
      externalId: `${b.congress}-${b.type}-${b.number}`
    }))
  } catch (err) {
    console.error('[LAWS] Congress.gov error:', err.message)
    return []
  }
}

async function fetchLegiScanState(stateAbbr) {
  if (!process.env.LEGISCAN_KEY) return []
  try {
    const res = await axios.get('https://api.legiscan.com/', {
      params: {
        key: process.env.LEGISCAN_KEY,
        op: 'getSearch',
        query: 'firearms OR gun OR "concealed carry" OR ATF',
        state: stateAbbr
      }
    })
    const results = res.data?.searchresult
    if (!results) return []
    return Object.values(results)
      .filter(b => b.bill_id)
      .slice(0, 5)
      .map(b => ({
        _id: `law-state-${stateAbbr}-${b.bill_id}`,
        _type: 'legislation',
        title: b.title || 'Untitled Bill',
        billNumber: b.bill_number,
        level: 'state',
        state: stateAbbr,
        status: mapStatus(b.last_action),
        lastActionText: b.last_action,
        lastActionDate: b.last_action_date,
        summary: b.title,
        url: b.url,
        urgent: false,
        externalId: String(b.bill_id)
      }))
  } catch (err) {
    console.error(`[LAWS] LegiScan error (${stateAbbr}):`, err.message)
    return []
  }
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

async function runLawsFeed() {
  console.log('[LAWS] Starting laws feed...')
  const t = Date.now()
  let done = 0, failed = 0

  // Federal bills
  const federal = await fetchCongressBills()
  for (const bill of federal) {
    try {
      // Enrich with Claude extended summary + analysis
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const enriched = await enrichLawWithClaude(bill)
          if (enriched.summary) bill.summary = enriched.summary
          if (enriched.analysis) bill.analysis = enriched.analysis
          if (enriched.impact) bill.impact = enriched.impact
        } catch (enrichErr) {
          console.error('[LAWS] Enrichment error:', enrichErr.message)
        }
        await sleep(400)
      }
      await publishToSanity(bill)
      done++
    } catch (err) { failed++; console.error(err.message) }
    await sleep(200)
  }
  console.log(`[LAWS] Federal: ${federal.length} bills processed`)

  // State bills - batch 10 states at a time
  const batches = []
  for (let i = 0; i < US_STATES.length; i += 10) {
    batches.push(US_STATES.slice(i, i + 10))
  }

  for (const batch of batches) {
    const results = await Promise.all(batch.map(s => fetchLegiScanState(s)))
    for (const bills of results) {
      for (const bill of bills) {
        try {
          // Enrich with Claude extended summary
          if (process.env.ANTHROPIC_API_KEY) {
            try {
              const enriched = await enrichLawWithClaude(bill)
              if (enriched.summary) bill.summary = enriched.summary
              if (enriched.analysis) bill.analysis = enriched.analysis
              if (enriched.impact) bill.impact = enriched.impact
            } catch (enrichErr) {
              console.error('[LAWS] State enrichment error:', enrichErr.message)
            }
            await sleep(400)
          }
          await publishToSanity(bill)
          done++
        } catch (err) { failed++ }
      }
    }
    await sleep(30000) // 30s between batches to respect LegiScan limits
  }

  console.log(`[LAWS] Done. ${done} published, ${failed} failed. ${Date.now() - t}ms`)
  return { done, failed }
}

module.exports = { runLawsFeed }
if (require.main === module) runLawsFeed().catch(console.error)
