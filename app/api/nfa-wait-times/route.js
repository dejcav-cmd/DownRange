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
// NOTE: as of 2026-08-22, direct fetches to ATF_URL return HTTP 403 — ATF added
// bot/WAF protection around their Drupal 10 site redesign. Routed through the
// Jina reader proxy (same pattern already used for gun.deals elsewhere in this
// codebase). Deliberately anonymous (no Authorization header) and requesting
// the DEFAULT markdown format, not X-Return-Format: html — two things changed
// from the original approach after live testing:
//   1. The JINA_API_KEY secret on file returns 402 Payment Required; an
//      unauthenticated request succeeds on Jina's free tier. Do not re-add
//      the key here without verifying it's valid again first.
//   2. ATF's page now uses a "Tablesaw" responsive-table library that makes
//      the raw HTML unreliable to regex against (duplicated/reordered cells
//      for the mobile stacked view). Jina's cleaned markdown is far more
//      stable, but it also duplicates each cell's column-label as a bold
//      prefix (e.g. "**eForms****57 days") — the regexes below are written
//      to tolerate that specific artifact. Verified against a live fetch on
//      2026-08-22: all 10 forms and all 6 headline stats matched the ATF
//      page exactly.
const FORM_LABELS = [
  'Form 4 Trust', 'Form 4 Individual', 'Form 1', 'Form 2', 'Form 3',
  'Form 5', 'Form 7', 'Form 9', 'Form 10', 'Form 20',
]

async function scrapeATF() {
  try {
    let res = await fetch('https://r.jina.ai/' + ATF_URL, {
      signal: AbortSignal.timeout(25000),
    })
    // Fall back to a direct fetch in case ATF ever lifts the block, or Jina is down
    if (!res.ok) {
      res = await fetch(ATF_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0 NFA Tracker; +https://downrangeco.com)' },
        signal: AbortSignal.timeout(15000),
      })
    }
    if (!res.ok) throw new Error(`ATF returned ${res.status}`)
    const md = await res.text()

    const period = md.match(/applications finalized in ([A-Za-z]+ \d{4})/i)
    const reportMonth = period ? period[1] : ''

    const forms = []
    const lines = md.split('\n')
    const dataLines = lines.filter(ln => ln.trim().startsWith('|') && /\*\*Form\s/.test(ln))
    for (const ln of dataLines) {
      const matchedLabel = FORM_LABELS.find(label => new RegExp('\\*\\*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\*\\*').test(ln))
      if (!matchedLabel) continue
      const eformM = ln.match(/eForms\*+\s*(-|\d+)/)
      const paperM = ln.match(/Paper\*+\s*(-|\d+)/)
      const eform = (!eformM || eformM[1] === '-') ? null : parseInt(eformM[1])
      const paper = (!paperM || paperM[1] === '-') ? null : parseInt(paperM[1])
      const f = buildForm(matchedLabel, eform, paper)
      if (f) forms.push(f)
    }

    // Parse headline stats — tolerate the repeated bold-label prefix and
    // trailing " day"/"days" suffix that Jina's markdown conversion adds.
    const stats = { ...BASE_STATS }
    const grab = (labelPattern) => {
      const m = md.match(new RegExp(labelPattern + '\\s*\\|[^|\\n]*?(\\d+(?:,\\d{3})*)(?:\\s*days?)?\\s*\\|', 'i'))
      return m ? parseInt(m[1].replace(/,/g, '')) : null
    }
    stats.totalNfaReceived    = grab('Total number of NFA applications received') ?? stats.totalNfaReceived
    stats.silencerAppsReceived = grab('Total number of Form 4 silencer applications received') ?? stats.silencerAppsReceived
    stats.nfaFinalized        = grab('Total number of NFA applications finalized') ?? stats.nfaFinalized
    stats.medianEForm4        = grab('Median processing times for individual eForm 4 applications') ?? stats.medianEForm4
    stats.silencersRegistered = grab('\\bSilencers\\b') ?? stats.silencersRegistered
    stats.sbrRegistered       = grab('Short-Barreled Rifles') ?? stats.sbrRegistered
    if (reportMonth) stats.reportMonth = reportMonth

    if (forms.length < 3) throw new Error(`Only parsed ${forms.length} forms`)
    return { forms, reportMonth, stats, source: 'atf.gov', official: true, url: ATF_URL }
  } catch (e) {
    console.error('[NFA] ATF scrape failed:', e.message)
    return null
  }
}

// ── Accurate current ATF figures (July 2026 report, confirmed 2026-08-22) as the
// reliable baseline used only when the live scrape fails ──────────────────────
const BASE_STATS = {
  reportMonth: 'July 2026',
  lastUpdated: 'August 17, 2026',
  silencerAppsReceived: 120623,
  totalNfaReceived: 225231,
  nfaFinalized: 254639,
  medianEForm4: 8,
  silencersRegistered: 6654209,
  sbrRegistered: 1227044,
}

function getFallbackData() {
  const rows = [
    ['Form 4 Individual', 9, 28],
    ['Form 4 Trust', 33, 34],
    ['Form 1', 57, 38],
    ['Form 3', 1, 7],
    ['Form 5', 1, 6],
    ['Form 2', 1, 6],
    ['Form 9', 1, 3],
    ['Form 10', 22, 6],
    ['Form 20', 2, 7],
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

  const usedFallback = result.source !== 'atf.gov'
  const doc = {
    _id:            `nfa-wait-${Date.now()}`,
    _type:          'nfaWaitTime',
    fetchedAt:      new Date().toISOString(),
    reportMonth:    result.reportMonth,
    reportedByAtf:  true,
    sourceUrl:      ATF_URL,
    forms:          result.forms,
    atfStats:       result.stats,
    communityNotes: usedFallback
      ? `WARNING: live ATF scrape failed — served hardcoded baseline (${result.reportMonth}) in ${Date.now() - t0}ms`
      : `Fetched from ATF.gov in ${Date.now() - t0}ms`,
  }
  await sanity.create(doc)

  // CRITICAL: report a distinct 'warning' status when we fall back to the
  // baseline — this was previously always reported as 'success', which let
  // the live ATF scrape silently break for a month while Mission Control
  // showed HEALTHY the whole time. A fallback run is not a healthy run.
  await reportCronRun('nfa-wait-times', {
    status: usedFallback ? 'warning' : 'success',
    ms: Date.now() - t0,
    details: `${result.forms.length} forms from ${result.source}, month: ${result.reportMonth}`,
    error: usedFallback ? 'Live ATF scrape failed — served hardcoded fallback baseline instead of fresh data' : null,
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
