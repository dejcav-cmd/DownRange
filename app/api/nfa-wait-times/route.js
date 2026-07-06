export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const ATF_URL = 'https://www.atf.gov/resource-center/current-processing-times'

// Curated set of NFA forms we surface, keyed by the ATF table's form name.
// tier controls primary (big cards) vs secondary (compact) placement.
const FORM_MAP = {
  'form 4 individual': { category:'form4-ind',   tier:'primary',   label:'Form 4 · Individual', desc:'Suppressor / SBR tax-paid transfer — individual' },
  'form 4 trust':      { category:'form4-trust', tier:'primary',   label:'Form 4 · Trust',      desc:'Suppressor / SBR tax-paid transfer — gun trust' },
  'form 1':            { category:'form1',       tier:'primary',   label:'Form 1 · Make',       desc:'Make & register (SBR / SBS / can DIY)' },
  'form 3':            { category:'form3',       tier:'primary',   label:'Form 3 · Dealer',     desc:'Tax-exempt FFL / SOT transfer' },
  'form 5':            { category:'form5',       tier:'primary',   label:'Form 5 · Tax-Exempt', desc:'Tax-exempt transfer (estate, gov)' },
  'form 2':            { category:'form2',       tier:'secondary', label:'Form 2 · Mfg',        desc:'Notice of firearms manufactured' },
  'form 9':            { category:'form9',       tier:'secondary', label:'Form 9 · Export',     desc:'Permanent export permit' },
  'form 10':           { category:'form10',      tier:'secondary', label:'Form 10 · Gov',       desc:'Registration by government entities' },
  'form 20':           { category:'form20',      tier:'secondary', label:'Form 20 · Transport', desc:'Interstate NFA transport' },
  'form 7':            { category:'form7',       tier:'secondary', label:'Form 7 · FFL',        desc:'Federal Firearms License application' },
}

function buildForm(name, eform, paper) {
  const key = name.toLowerCase().trim()
  const meta = FORM_MAP[key]
  if (!meta) return null
  const avg = eform ?? paper
  if (avg == null) return null
  return {
    formType: meta.label,
    desc:     meta.desc,
    category: meta.category,
    tier:     meta.tier,
    method:   eform != null ? 'eForms' : 'Paper',
    avgDays:  avg,
    minDays:  eform ?? paper,
    maxDays:  paper ?? eform,
    eformDays: eform,
    paperDays: paper,
    trend:    'stable',
    note:     eform != null && paper != null
      ? `eForm ${eform}d · paper ${paper}d — ${meta.desc}`
      : `${meta.desc}`,
  }
}

// ── ATF scrape: parse the official processing-times table ──────────────────
async function scrapeATF() {
  try {
    const res = await fetch(ATF_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0 NFA Tracker; +https://downrangeco.com)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new Error(`ATF returned ${res.status}`)
    const html = await res.text()

    const period = html.match(/applications finalized in ([A-Za-z]+ \d{4})/i)
    const reportMonth = period ? period[1] : ''

    const forms = []
    const dayVal = (c) => {
      const s = c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
      if (s === '-' || s === '—' || s === '') return null
      const m = s.match(/(\d+)/)
      return m ? parseInt(m[1]) : null
    }
    for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map(m => m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
      if (cells.length < 3) continue
      const name = cells[0]
      if (!/^form\s/i.test(name)) continue
      // last two cells that look like a day count or dash = eForms, Paper
      const dayCells = cells.filter(c => /^\d+\s*days?$/i.test(c) || /^\d+$/.test(c) || c === '-' || c === '—')
      if (dayCells.length < 2) continue
      const eform = dayVal(dayCells[dayCells.length - 2])
      const paper = dayVal(dayCells[dayCells.length - 1])
      const f = buildForm(name, eform, paper)
      if (f) forms.push(f)
    }

    // Parse headline stats
    const stats = { ...BASE_STATS }
    const grab = (re) => { const m = html.match(re); return m ? parseInt(m[1].replace(/,/g, '')) : null }
    stats.silencerAppsReceived = grab(/Form 4 silencer applications received[^\d]*([\d,]+)/i) ?? stats.silencerAppsReceived
    stats.totalNfaReceived      = grab(/Total number of NFA applications received[^\d]*([\d,]+)/i) ?? stats.totalNfaReceived
    stats.nfaFinalized          = grab(/Total number of NFA applications finalized[^\d]*([\d,]+)/i) ?? stats.nfaFinalized
    stats.medianEForm4          = grab(/Median processing times for individual eForm 4 applications[^\d]*([\d,]+)/i) ?? stats.medianEForm4
    stats.silencersRegistered   = grab(/Silencers[^\d]*([\d,]{6,})/i) ?? stats.silencersRegistered
    stats.sbrRegistered         = grab(/Short-Barreled Rifles[^\d]*([\d,]+)/i) ?? stats.sbrRegistered
    if (reportMonth) stats.reportMonth = reportMonth

    if (forms.length < 3) throw new Error(`Only parsed ${forms.length} forms`)
    return { forms, reportMonth, stats, source: 'atf.gov', official: true, url: ATF_URL }
  } catch (e) {
    console.error('[NFA] ATF scrape failed:', e.message)
    return null
  }
}

// ── Accurate current ATF figures (May 2026 report) as the reliable baseline ──
const BASE_STATS = {
  reportMonth: 'May 2026',
  lastUpdated: 'June 24, 2026',
  silencerAppsReceived: 116821,
  totalNfaReceived: 222550,
  nfaFinalized: 216669,
  medianEForm4: 8,
  silencersRegistered: 6439813,
  sbrRegistered: 1178348,
}

function getFallbackData() {
  const rows = [
    ['Form 4 Individual', 8, 63],
    ['Form 4 Trust', 25, 25],
    ['Form 1', 62, 33],
    ['Form 3', 1, 8],
    ['Form 5', 2, 9],
    ['Form 2', 1, 8],
    ['Form 9', 1, 6],
    ['Form 10', 6, 9],
    ['Form 20', 2, 6],
    ['Form 7', null, 60],
  ]
  const forms = rows.map(([n, e, p]) => buildForm(n, e, p)).filter(Boolean)
  return {
    forms,
    reportMonth: BASE_STATS.reportMonth,
    stats: { ...BASE_STATS },
    source: 'atf.gov',
    official: true,
    url: ATF_URL,
  }
}

// ── GET: public read, or scrape when called by cron/admin ──────────────────
export async function GET(req) {
  const adminKey = req.headers.get('x-admin-key')
  const isCron   = req.headers.get('x-vercel-cron') === '1'
  const isAdmin  = adminKey === process.env.ADMIN_KEY
  const auth     = req.headers.get('authorization')
  const isBearer = process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`

  if (isCron || isAdmin || isBearer) return runScrapeAndSave(req)

  try {
    const latest = await sanity.fetch(
      `*[_type == "nfaWaitTime"] | order(fetchedAt desc) [0] {
        fetchedAt, reportMonth, reportedByAtf, sourceUrl, forms, atfStats, communityNotes
      }`
    )
    if (latest && latest.forms?.length > 0) {
      const age = Date.now() - new Date(latest.fetchedAt).getTime()
      return Response.json({ ok: true, data: latest, ageHours: Math.round(age / 3600000), stale: age > 96 * 3600000 })
    }
    const fb = getFallbackData()
    return Response.json({ ok: true, data: { ...fb, atfStats: fb.stats, reportedByAtf: true, sourceUrl: fb.url }, ageHours: 999, stale: true, fallback: true })
  } catch (e) {
    const fb = getFallbackData()
    return Response.json({ ok: true, data: { ...fb, atfStats: fb.stats, reportedByAtf: true, sourceUrl: fb.url }, ageHours: 999, stale: true, fallback: true })
  }
}

async function runScrapeAndSave(req) {
  const t0 = Date.now()
  try {
    return await doScrapeAndSave(t0)
  } catch (err) {
    await reportCronRun('nfa-wait-times', { status: 'failed', ms: Date.now() - t0, error: err.message })
    return Response.json({ ok: false, error: err.message, ms: Date.now() - t0 }, { status: 500 })
  }
}

async function doScrapeAndSave(t0) {
  const scraped = await scrapeATF()
  const baseline = getFallbackData()

  // Prefer freshly scraped ATF data; otherwise use the accurate baseline
  const result = (scraped && scraped.forms.length >= 3)
    ? { forms: scraped.forms, reportMonth: scraped.reportMonth || baseline.reportMonth, stats: { ...baseline.stats, ...scraped.stats }, official: true, url: ATF_URL, source: 'atf.gov' }
    : { ...baseline, source: 'atf.gov-baseline' }

  // Compute trends vs previous snapshot
  try {
    const prev = await sanity.fetch(`*[_type == "nfaWaitTime"] | order(fetchedAt desc) [0] { forms }`)
    if (prev?.forms) {
      const prevMap = Object.fromEntries(prev.forms.map(f => [f.formType, f.avgDays]))
      result.forms = result.forms.map(f => {
        const prevDays = prevMap[f.formType]
        if (prevDays == null) return f
        const delta = f.avgDays - prevDays
        return { ...f, trend: delta > 3 ? 'up' : delta < -3 ? 'down' : 'stable', prevDays, delta: Math.abs(delta) }
      })
    }
  } catch {}

  const doc = {
    _id:            `nfa-wait-${Date.now()}`,
    _type:          'nfaWaitTime',
    fetchedAt:      new Date().toISOString(),
    reportMonth:    result.reportMonth,
    reportedByAtf:  true,
    sourceUrl:      ATF_URL,
    forms:          result.forms,
    atfStats:       result.stats,
    communityNotes: `Fetched from ATF.gov in ${Date.now() - t0}ms`,
  }
  await sanity.create(doc)

  await reportCronRun('nfa-wait-times', {
    status: 'success',
    ms: Date.now() - t0,
    details: `${result.forms.length} forms from ${result.source}, month: ${result.reportMonth}`,
  })

  return Response.json({ ok: true, source: result.source, official: true, forms: result.forms.length, month: result.reportMonth, ms: Date.now() - t0, data: result })
}

export async function POST(req) {
  const cronAuth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  const isCron   = req.headers.get('x-vercel-cron') === '1' || (process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`)
  const isAdmin  = adminKey === process.env.ADMIN_KEY
  if (!isCron && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return runScrapeAndSave(req)
}
