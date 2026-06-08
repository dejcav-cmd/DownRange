import Parser from 'rss-parser'
import { enrichLawWithClaude, isDuplicate, publishToSanity, notifyBreaking, notifyError, sleep } from '../utils.js'

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
    const _cpParams = new URLSearchParams({ query: 'firearms OR gun OR "Second Amendment" OR ATF', sort: 'updateDate+desc', limit: '20', format: 'json', api_key: process.env.CONGRESS_GOV_KEY })
    const _cpR = await fetch('https://api.congress.gov/v3/bill?' + _cpParams, { signal: AbortSignal.timeout(15000) })
    if (!_cpR.ok) throw new Error(_cpR.statusText)
    const res = { data: await _cpR.json() }
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
    const _lsParams = new URLSearchParams({ key: process.env.LEGISCAN_KEY, op: 'getSearch', query: 'firearms OR gun OR "concealed carry" OR ATF', state: stateAbbr })
    const _lsR = await fetch('https://api.legiscan.com/?' + _lsParams, { signal: AbortSignal.timeout(15000) })
    if (!_lsR.ok) throw new Error(_lsR.statusText)
    const res = { data: await _lsR.json() }
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


// RSS fallback — works with NO API keys
// Pulls 2A legal news from public RSS feeds
async function fetchLawsFromRSS() {
  const parser = new Parser({ timeout: 10000, headers: { 'User-Agent': 'DownRange/1.0' } })
  const feeds = [
    { name: 'NRA-ILA',       url: 'https://www.nraila.org/rss/',                    cat: 'legal'    },
    { name: 'GOA News',      url: 'https://gunowners.org/feed/',                    cat: 'legal'    },
    { name: 'FPC',           url: 'https://www.firearmspolicycoalition.org/feed/',  cat: 'legal'    },
    { name: 'SAF',           url: 'https://www.saf.org/feed/',                      cat: 'legal'    },
    { name: 'Bearing Arms',  url: 'https://bearingarms.com/feed/',                  cat: 'news'     },
    { name: 'TTAG Laws',     url: 'https://www.thetruthaboutguns.com/category/gun-laws/feed/', cat: 'legal' },
  ]
  const items = []
  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url)
      for (const item of (parsed.items || []).slice(0, 5)) {
        if (!item.title || !item.link) continue
        const lower = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase()
        const relevant = ['law','bill','court','ruling','atf','ban','legislation','second amendment','2a','carry','permit','firearm','gun'].some(k => lower.includes(k))
        if (!relevant) continue
        items.push({
          _id:        `law-rss-${Buffer.from(item.link).toString('base64').slice(0,40)}`,
          _type:      'legislation',
          title:      item.title,
          level:      'federal',
          status:     'pending',
          summary:    item.contentSnippet?.slice(0, 400) || item.title,
          url:        item.link,
          externalUrl: item.link,
          source:     feed.name,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          urgent:     false,
        })
      }
    } catch (e) {
      console.warn(`[LAWS] RSS fallback failed for ${feed.name}:`, e.message)
    }
  }
  console.log(`[LAWS] RSS fallback: ${items.length} relevant items from ${feeds.length} feeds`)
  return items
}

async function runLawsFeed() {
  console.log('[LAWS] Starting laws feed...')
  const t = Date.now()
  let done = 0, failed = 0

  // Env var diagnostics — logged every run so cron dashboard shows what is/isn't configured
  const hasCongress  = !!process.env.CONGRESS_GOV_KEY
  const hasLegiScan  = !!process.env.LEGISCAN_KEY
  console.log(`[LAWS] API keys: Congress.gov=${hasCongress ? 'YES' : 'MISSING'}, LegiScan=${hasLegiScan ? 'YES' : 'MISSING'}`)
  if (!hasCongress && !hasLegiScan) {
    console.log('[LAWS] No API keys — using RSS fallback only')
  }

  // RSS fallback — always runs first (no API key needed, fast, reliable)
  const rssItems = await fetchLawsFromRSS()
  for (const item of rssItems) {
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const enriched = await enrichLawWithClaude(item)
          if (enriched.summary) item.summary = enriched.summary
        } catch {}
      }
      await publishToSanity(item)
      done++
    } catch (err) {
      if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
        failed++
        console.error('[LAWS] RSS item publish error:', err.message)
      }
    }
  }
  console.log(`[LAWS] RSS fallback published ${done} items`)

  // Federal bills (requires CONGRESS_GOV_KEY)
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

export { runLawsFeed }
