/**
 * Giveaways Cron — DownRange
 *
 * Real web scraping via Jina proxy (r.jina.ai) — no hallucination.
 * Sources: wintheguns.com, gungiveaways.net, gunmade.com (dedicated
 *          giveaways hub, ~30-40 live at once), PSA, Lucky Gunner,
 *          Springfield Armory, GOA, Taurus USA.
 * Every source is scraped for its clean, direct entry link (sponsor site
 * or giveaway platform) — never a source's own tracking/listing URL.
 *
 * Runs: 8am, 2pm, 8pm UTC daily via vercel.json
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse }    from 'next/server'
import { createClient }    from '@sanity/client'
import { reportCronRun }   from '@/lib/cronReporter'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN,
  useCdn:     false,
})

// ── AUTH ──────────────────────────────────────────────────────────────────────
function isAuthorized(req) {
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  const isAuth   = process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = req.headers.get('x-admin-key') === ADMIN_KEY
  return isVercel || isAuth || isAdmin
}

import {
  SOURCES, scrapeAllSources, normalizeUrl, dedup, dedupSimilar,
} from '@/lib/giveawaySources'

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(req)  { return handler(req) }
export async function POST(req) { return handler(req) }

async function handler(req) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0    = Date.now()
  const stats = { scraped: 0, added: 0, skipped: 0, expired: 0, errors: [], sources: {} }

  try {
    const today    = new Date().toISOString().split('T')[0]
    const existing = await sanity.fetch('*[_type == "giveaway"] { _id, entryUrl, endDate, active }').catch(() => [])
    const existingUrls = new Set((existing || []).map(g => normalizeUrl(g.entryUrl)))

    // Expire past giveaways
    const toExpire = (existing || []).filter(g => g.active && g.endDate && g.endDate < today)
    if (toExpire.length > 0) {
      await sanity.mutate(toExpire.map(g => ({ patch: { id: g._id, set: { active: false } } })))
      stats.expired = toExpire.length
    }

    const settled = await scrapeAllSources()

    // Per-source detail, BEFORE dedup. A source that quietly returns 0 is the
    // failure mode that hid the Jina outage for weeks, so every source reports
    // how it was reached, what HTTP status it got, and why it came back empty.
    const perSource = {}
    const allRaw = []
    for (const r of settled) {
      perSource[r.name] = { count: r.giveaways.length, via: r.via, status: r.status }
      if (r.reason) {
        perSource[r.name].reason = r.reason
        stats.errors.push(`${r.name}: ${r.reason}`)
      }
      allRaw.push(...r.giveaways)
    }
    stats.perSource = perSource
    stats.scraped   = allRaw.length

    const giveaways = dedupSimilar(dedup(allRaw))
    stats.deduped = allRaw.length - giveaways.length

    const mutations = []
    for (const g of giveaways) {
      if (!g.entryUrl || !g.title) { stats.skipped++; continue }
      if (g.endDate && g.endDate < today) { stats.expired++; continue }
      try { new URL(g.entryUrl) } catch { stats.skipped++; continue }

      const normUrl = normalizeUrl(g.entryUrl)
      if (existingUrls.has(normUrl)) { stats.skipped++; continue }
      existingUrls.add(normUrl)

      // Deterministic _id derived from the normalized entry URL + createIfNotExists.
      // The old code used a bare `create` with a Sanity-assigned random _id, so any
      // gap in the existing-URL check produced a duplicate document instead of a
      // no-op.
      const _id = 'giveaway-' + Buffer.from(normUrl).toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)

      const doc = {
        _id, _type: 'giveaway',
        title:      g.title.slice(0, 200),
        entryUrl:   g.entryUrl,
        prize:      (g.prize || g.title).slice(0, 200),
        prizeValue: g.prizeValue || 0,
        category:   g.category || 'accessories',
        sponsor:    g.sponsor || 'Various',
        sourceType: g.sourceType || 'aggregator',
        featured:   g.featured || false,
        active:     true,
        addedAt:    new Date().toISOString(),
      }
      // endDate is written as bare YYYY-MM-DD on purpose — the /giveaways page
      // does `new Date(endDate + 'T23:59:59Z')`, which yields Invalid Date if a
      // full ISO timestamp is stored. Omit the key entirely when unknown rather
      // than sending null.
      if (g.endDate) doc.endDate = g.endDate

      mutations.push({ createIfNotExists: doc })
      stats.added++
      stats.sources[g.source] = (stats.sources[g.source] || 0) + 1
    }

    for (let i = 0; i < mutations.length; i += 50) {
      try {
        await sanity.mutate(mutations.slice(i, i + 50), { returnDocuments: false })
      } catch (e) {
        stats.errors.push('sanity: ' + e.message.slice(0, 120))
      }
    }

    const ms = Date.now() - t0
    console.log('[GIVEAWAYS] Done:', JSON.stringify(stats))

    // Only REQUIRED sources count toward the blackout alarm. gunmade.com sits
    // behind Cloudflare and can't be reached from a datacenter IP, so letting it
    // vote would keep the alarm permanently red and train us to ignore it.
    const requiredEmpty = SOURCES.filter(s => s.required)
      .every(s => (perSource[s.name]?.count || 0) === 0)

    await reportCronRun('giveaways', {
      status:  requiredEmpty ? 'failed' : 'success',
      ms,
      error:   requiredEmpty ? 'All required giveaway sources returned 0 results this run — see details' : null,
      details: JSON.stringify({ perSource, added: stats.added, skipped: stats.skipped, expired: stats.expired, errors: stats.errors.slice(0, 10) }),
    })
    return NextResponse.json({ ok: true, ms, ...stats })

  } catch (err) {
    const ms = Date.now() - t0
    console.error('[giveaways-cron]', err.message)
    await reportCronRun('giveaways', { status: 'failed', ms, error: err.message })
    return NextResponse.json({ ok: false, error: err.message, ms }, { status: 500 })
  }
}
