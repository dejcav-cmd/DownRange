export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// ── SOURCES to scrape ─────────────────────────────────────────────────────
// ATF official: https://www.atf.gov/resource-center/current-processing-times
// Silencer Shop: https://www.silencershop.com/atf-wait-times  (updates daily)
// Silencer Central: https://www.silencercentral.com/blog/nfa-wait-times/

async function scrapeATF() {
  try {
    const res = await fetch('https://www.atf.gov/resource-center/current-processing-times', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0 NFA Tracker; +https://downrangeco.com)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`ATF returned ${res.status}`)
    const html = await res.text()

    // ATF publishes a table — parse it
    const forms = []
    let reportMonth = ''

    // Extract report period (e.g. "Average processing times for applications finalized in March 2026")
    const periodMatch = html.match(/applications (?:finalized|processed) (?:in|during) ([A-Za-z]+ \d{4})/i)
    if (periodMatch) reportMonth = periodMatch[1]

    // Parse table rows — ATF table has form type, individual avg, trust avg columns
    // Format: <td>Form X</td><td>N days</td><td>N days</td>
    const rowMatches = html.matchAll(/<tr[^>]*>[\s\S]*?<\/tr>/gi)
    for (const rowMatch of rowMatches) {
      const row = rowMatch[0]
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
        m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
      )
      if (cells.length < 2) continue
      const formName = cells[0]
      if (!formName || !/form [1-9]/i.test(formName)) continue

      // Try to extract day numbers
      for (let i = 1; i < cells.length; i++) {
        const dayMatch = cells[i].match(/(\d+)\s*(?:days?|d\b)/i) ||
                         cells[i].match(/^(\d+)$/)
        if (dayMatch) {
          const days = parseInt(dayMatch[1])
          const isIndividual = i === 1
          forms.push({
            formType: formName + (cells.length > 2 ? (isIndividual ? ' (Individual)' : ' (Trust)') : ''),
            category: detectCategory(formName),
            method: /paper/i.test(formName) ? 'Paper' : 'eForms',
            avgDays: days,
            minDays: Math.round(days * 0.5),
            maxDays: Math.round(days * 2.0),
            trend: 'stable',
          })
        }
      }
    }

    if (forms.length === 0) throw new Error('No form data parsed from ATF page')
    return { forms, reportMonth, source: 'atf.gov', official: true, url: 'https://www.atf.gov/resource-center/current-processing-times' }
  } catch (e) {
    console.error('[NFA] ATF scrape failed:', e.message)
    return null
  }
}

async function scrapeSilencerShop() {
  try {
    const res = await fetch('https://www.silencershop.com/atf-wait-times', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0 NFA Tracker)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`SilencerShop returned ${res.status}`)
    const html = await res.text()

    const forms = []

    // SilencerShop shows "X days" prominently for each form type
    // Look for patterns like "eForm 4: X days" or "3-10 days"
    const patterns = [
      { regex: /eForm?\s*4[^<]*?(\d+)(?:\s*[-–]\s*(\d+))?\s*days/gi, type: 'Form 4 eFile', category: 'suppressor', method: 'eForms' },
      { regex: /paper\s*(?:Form\s*)?4[^<]*?(\d+)(?:\s*[-–]\s*(\d+))?\s*days/gi, type: 'Form 4 Paper', category: 'suppressor', method: 'Paper' },
      { regex: /Form\s*1[^<]*?(\d+)(?:\s*[-–]\s*(\d+))?\s*days/gi, type: 'Form 1 eFile', category: 'sbr', method: 'eForms' },
      { regex: /Form\s*3[^<]*?(\d+)(?:\s*[-–]\s*(\d+))?\s*days/gi, type: 'Form 3', category: 'dealer-transfer', method: 'eForms' },
    ]

    // Remove script/style tags first
    const cleanHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')

    for (const { regex, type, category, method } of patterns) {
      const matches = [...cleanHtml.matchAll(regex)]
      if (matches.length > 0) {
        const m = matches[0]
        const min = parseInt(m[1])
        const max = m[2] ? parseInt(m[2]) : Math.round(min * 1.5)
        const avg = m[2] ? Math.round((min + max) / 2) : min
        forms.push({ formType: type, category, method, avgDays: avg, minDays: min, maxDays: max, trend: 'stable' })
      }
    }

    // Extract their "last updated" note
    const updatedMatch = cleanHtml.match(/(?:updated|as of)[^.]*?(\w+ \d+,?\s*\d{4}|\w+ \d{4})/i)
    const reportMonth = updatedMatch ? updatedMatch[1] : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    if (forms.length === 0) throw new Error('No data parsed from SilencerShop')
    return { forms, reportMonth, source: 'silencershop.com', official: false, url: 'https://www.silencershop.com/atf-wait-times' }
  } catch (e) {
    console.error('[NFA] SilencerShop scrape failed:', e.message)
    return null
  }
}

function detectCategory(formName) {
  const f = formName.toLowerCase()
  if (/form\s*3/.test(f)) return 'dealer-transfer'
  if (/form\s*1/.test(f)) return 'sbr-make'
  if (/machine\s*gun|mg|post.?86/i.test(f)) return 'machinegun'
  if (/paper/.test(f)) return 'paper'
  return 'suppressor'
}

// Fallback data based on most recent confirmed figures from multiple sources
function getFallbackData() {
  const now = new Date()
  const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  return {
    forms: [
      { formType: 'Form 4 eFile Individual', category: 'suppressor', method: 'eForms', avgDays: 4,   minDays: 1,   maxDays: 14,  trend: 'down', note: 'Per ATF March 2026 data; individual NICS instant checks often approve same-day' },
      { formType: 'Form 4 eFile Trust',      category: 'suppressor', method: 'eForms', avgDays: 18,  minDays: 7,   maxDays: 45,  trend: 'down', note: 'Per Silencer Central May 2026; multi-party trusts take longer' },
      { formType: 'Form 4 Paper',            category: 'suppressor', method: 'Paper',  avgDays: 286, minDays: 180, maxDays: 420, trend: 'stable', note: 'Paper forms manually processed; ATF strongly recommends eForms' },
      { formType: 'Form 1 eFile (Make SBR)', category: 'sbr-make',   method: 'eForms', avgDays: 22,  minDays: 7,   maxDays: 60,  trend: 'down', note: 'Form 1 for making SBR/SBS; faster than Form 4 in most cases' },
      { formType: 'Form 3 (Dealer Transfer)',category: 'dealer-transfer', method: 'eForms', avgDays: 3, minDays: 1, maxDays: 7, trend: 'stable', note: 'FFL-to-FFL transfer; often approved within 24 hours electronically' },
      { formType: 'Form 4 (Machine Gun)',    category: 'machinegun',  method: 'eForms', avgDays: 365, minDays: 270, maxDays: 540, trend: 'up', note: 'Pre-86 transferable MGs only; limited supply, higher scrutiny' },
    ],
    reportMonth: month,
    source: 'downrange-baseline',
    official: false,
    url: 'https://www.atf.gov/resource-center/current-processing-times',
  }
}

// ── GET: Return latest stored wait times ───────────────────────────────────
export async function GET(req) {
  try {
    const latest = await sanity.fetch(
      `*[_type == "nfaWaitTime"] | order(fetchedAt desc) [0] {
        fetchedAt, reportMonth, reportedByAtf, sourceUrl, forms, communityNotes
      }`
    )

    if (latest && latest.forms?.length > 0) {
      const age = Date.now() - new Date(latest.fetchedAt).getTime()
      return Response.json({
        ok: true,
        data: latest,
        ageHours: Math.round(age / 3600000),
        stale: age > 25 * 3600000, // stale if > 25 hours
      })
    }

    // No stored data — return fallback
    return Response.json({ ok: true, data: getFallbackData(), ageHours: 999, stale: true, fallback: true })
  } catch (e) {
    return Response.json({ ok: true, data: getFallbackData(), ageHours: 999, stale: true, fallback: true })
  }
}

// ── POST: Trigger a fresh fetch (called by cron or admin) ─────────────────
export async function POST(req) {
  const cronAuth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  const isCron   = process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = adminKey === process.env.ADMIN_KEY
  if (!isCron && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()

  // Try sources in priority order: ATF official > SilencerShop > fallback
  let result = await scrapeATF()
  if (!result || result.forms.length === 0) {
    console.log('[NFA] ATF parse returned empty, trying SilencerShop...')
    result = await scrapeSilencerShop()
  }
  if (!result || result.forms.length === 0) {
    console.log('[NFA] All scrapes failed, using fallback data')
    result = getFallbackData()
  }

  // Compute trends by comparing to previous snapshot
  try {
    const prev = await sanity.fetch(
      `*[_type == "nfaWaitTime"] | order(fetchedAt desc) [0] { forms }`
    )
    if (prev?.forms) {
      const prevMap = Object.fromEntries(prev.forms.map(f => [f.formType, f.avgDays]))
      result.forms = result.forms.map(f => {
        const prevDays = prevMap[f.formType]
        if (prevDays == null) return f
        const delta = f.avgDays - prevDays
        return { ...f, trend: delta > 5 ? 'up' : delta < -5 ? 'down' : 'stable', prevDays, delta }
      })
    }
  } catch {}

  // Save to Sanity
  const doc = {
    _id:            `nfa-wait-${Date.now()}`,
    _type:          'nfaWaitTime',
    fetchedAt:      new Date().toISOString(),
    reportMonth:    result.reportMonth,
    reportedByAtf:  result.official || false,
    sourceUrl:      result.url,
    forms:          result.forms,
    communityNotes: `Fetched from ${result.source} in ${Date.now() - t0}ms`,
  }

  await sanity.create(doc)

  return Response.json({
    ok:     true,
    source: result.source,
    official: result.official,
    forms:  result.forms.length,
    month:  result.reportMonth,
    ms:     Date.now() - t0,
    data:   result,
  })
}
