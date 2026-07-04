export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

// Market Brief cron — runs 2x daily: 6am + 6pm UTC
// Fetches live ammo price signals and generates AI analysis via GLM/Claude

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const GLM_KEY   = process.env.GLM_API_KEY
const CLAUDE_KEY= process.env.ANTHROPIC_API_KEY

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Live price sources (public APIs / RSS — no auth required)
const PRICE_SOURCES = [
  // Pistol
  { caliber:'9mm Luger',     slug:'9mm',            floor:0.14, ceiling:0.40 },
  { caliber:'.45 ACP',       slug:'45-acp',         floor:0.28, ceiling:0.75 },
  { caliber:'.40 S&W',       slug:'40-sw',          floor:0.22, ceiling:0.65 },
  { caliber:'.380 ACP',      slug:'380-acp',        floor:0.18, ceiling:0.55 },
  { caliber:'.357 Magnum',   slug:'357-magnum',     floor:0.38, ceiling:1.00 },
  { caliber:'.44 Magnum',    slug:'44-magnum',      floor:0.55, ceiling:1.40 },
  { caliber:'10mm Auto',     slug:'10mm-auto',      floor:0.30, ceiling:0.80 },
  { caliber:'5.7x28mm',      slug:'57x28',          floor:0.40, ceiling:1.10 },
  // Rimfire
  { caliber:'.22 LR',        slug:'22-lr',          floor:0.04, ceiling:0.15 },
  // Rifle
  { caliber:'5.56 NATO',     slug:'223-remington',  floor:0.25, ceiling:0.65 },
  { caliber:'7.62x39mm',     slug:'762x39',         floor:0.22, ceiling:0.60 },
  { caliber:'.308 WIN',      slug:'308-winchester', floor:0.55, ceiling:1.40 },
  { caliber:'.300 BLK',      slug:'300-blackout',   floor:0.35, ceiling:0.90 },
  // PRC Family
  { caliber:'6.5 Creedmoor', slug:'65-creedmoor',   floor:0.80, ceiling:2.20 },
  { caliber:'6.5 PRC',       slug:'65-prc',         floor:1.20, ceiling:3.50 },
  { caliber:'7mm PRC',       slug:'7mm-prc',        floor:1.40, ceiling:3.80 },
  { caliber:'.300 PRC',      slug:'300-prc',        floor:1.60, ceiling:4.50 },
  // Magnum
  { caliber:'.300 Win Mag',  slug:'300-win-mag',    floor:0.90, ceiling:3.00 },
  // Shotgun
  { caliber:'12 Gauge',      slug:'12-gauge',       floor:0.25, ceiling:0.80 },
]

async function fetchAmmoSeekPrice(slug, floor = 0.05, ceil = 8.0) {
  try {
    const res = await fetch(`https://www.ammoseek.com/ammo/${slug}/rss`, {
      headers: { 'User-Agent': 'DownRange/1.0 ammo market tracker' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const xml = await res.text()

    // Parse items: extract price + vendor + link
    const items = []
    const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    for (const block of itemBlocks) {
      const inner = block[1]
      const titleM = inner.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const linkM  = inner.match(/<link[^>]*>([\s\S]*?)<\/link>/i)
      if (!titleM) continue
      const title = titleM[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      const link  = linkM  ? linkM[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''

      const pprM = title.match(/\$\s*([\d.]+)\s*\/\s*(?:rd|round|rnd)\b/i)
        || title.match(/\b([\d.]+)\s*(?:cents?|¢)\s*\/\s*(?:rd|round|rnd)\b/i)
      if (!pprM) continue
      const ppr = pprM[0].toLowerCase().includes('cent') || pprM[0].includes('¢')
        ? parseFloat(pprM[1]) / 100
        : parseFloat(pprM[1])
      if (ppr < floor || ppr > ceil) continue

      // Extract vendor: everything before first ' - '
      const dashIdx = title.indexOf(' - ')
      const vendor  = dashIdx > 0 && dashIdx < 45 ? title.slice(0, dashIdx).trim() : null

      items.push({ ppr: Math.round(ppr * 10000) / 10000, vendor, url: link, title })
    }

    if (!items.length) return null
    items.sort((a, b) => a.ppr - b.ppr)

    // Dedupe by vendor
    const byVendor = new Map()
    for (const item of items) {
      if (item.vendor && !byVendor.has(item.vendor)) byVendor.set(item.vendor, item)
    }
    const top = [...byVendor.values()].slice(0, 4)
    const prices = top.map(i => i.ppr)
    const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length * 10000) / 10000

    return {
      lowest: prices[0],
      avg,
      count: items.length,
      retailers: top.map(i => ({ vendor: i.vendor, price: i.ppr, url: i.url })),
    }
  } catch { return null }
}

async function getCurrentPricesFromSanity() {
  try {
    return await sanity.fetch(
      `*[_type=="ammoPrice"] | order(caliber asc) { caliber, pricePerRound, trendDir, trendPct, inStock, recordedAt }`
    )
  } catch { return [] }
}

async function callAI(prompt, model = 'glm') {
  if (model === 'glm' && GLM_KEY) {
    try {
      const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GLM_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'glm-4-air', messages: [{ role:'user', content:prompt }], max_tokens:800 }),
        signal: AbortSignal.timeout(20000),
      })
      const d = await res.json()
      return d.choices?.[0]?.message?.content || null
    } catch { /* fall through */ }
  }
  if (CLAUDE_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', max_tokens: 800,
          messages: [{ role:'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(20000),
      })
      const d = await res.json()
      return d.content?.[0]?.text || null
    } catch { return null }
  }
  return null
}

async function generateBrief(prices, livePrices) {
  const session = new Date().getHours() < 12 ? 'morning' : 'evening'

  // Build price summary for prompt
  const priceLines = prices.slice(0, 8).map(p => {
    const live = livePrices.find(lp => lp.caliber?.toLowerCase().includes(p.caliber?.toLowerCase().split(' ')[0]))
    const trend = live?.trendDir === 'up' ? '↑' : live?.trendDir === 'down' ? '↓' : '→'
    const ppr = live?.pricePerRound ? `$${live.pricePerRound.toFixed(3)}/rd` : 'price unavail.'
    return `${p.caliber}: ${ppr} ${trend} (${live?.trendPct ? (live.trendPct > 0 ? '+' : '') + live.trendPct.toFixed(1) + '%' : 'flat'})`
  }).join('\n')

  const prompt = [
    `You are a firearms market analyst writing a ${session} market brief for gun owners on DownRange.co.`,
    `Today is ${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}.`,
    '',
    'Current ammo price snapshot:',
    priceLines,
    '',
    'Write a market brief in this EXACT JSON format (no markdown, no extra text):',
    '{',
    '  "title": "one punchy headline about the market today (max 8 words)",',
    '  "summary": "2-3 direct sentences about the market. Sound like a gun owner who trades ammo. No fluff. Specific details about buying signals, price trends, and what to watch.",',
    '  "bullets": [',
    '    "bullet 1 — specific actionable insight about a caliber or trend",',
    '    "bullet 2 — buying signal or warning",',
    '    "bullet 3 — what is driving prices right now",',
    '    "bullet 4 — forward-looking signal for next 30 days"',
    '  ],',
    '  "signal": "BUY | HOLD | WATCH | SELL",',
    '  "signalReason": "one sentence why"',
    '}',
    '',
    'Rules: No "comprehensive", no AI buzzwords. Be direct. Cite specific calibers and prices.',
  ].join('\n')

  const raw = await callAI(prompt)
  if (!raw) return null

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    const start = clean.indexOf('{')
    const end   = clean.lastIndexOf('}')
    if (start < 0 || end < 0) return null
    return JSON.parse(clean.slice(start, end+1))
  } catch { return null }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const key  = req.headers.get('x-admin-key') || searchParams.get('key')
  const force= searchParams.get('force') === '1'
  const t0 = Date.now()

  // Allow cron (no key) OR admin key
  if (key && key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Get current Sanity prices
    const sanityPrices = await getCurrentPricesFromSanity()

    // Fetch live prices from AmmoSeek
    const livePriceResults = await Promise.allSettled(
      PRICE_SOURCES.slice(0, 5).map(s => fetchAmmoSeekPrice(s.slug))
    )
    const livePrices = livePriceResults
      .map((r, i) => r.status === 'fulfilled' && r.value ? { ...PRICE_SOURCES[i], ...r.value } : null)
      .filter(Boolean)

    // Update Sanity ammoPrice records with fresh data
    let updatedPrices = 0
    for (const lp of livePrices) {
      try {
        const existing = await sanity.fetch(
          `*[_type=="ammoPrice" && caliber==$cal][0]{ _id, pricePerRound }`,
          { cal: lp.caliber }
        )
        if (existing?._id) {
          const prev = existing.pricePerRound || lp.avg
          const trendPct = prev ? Math.round((lp.avg - prev) / prev * 1000) / 10 : 0
          const retailers = (lp.retailers || []).map((r, idx) => ({
            _type:   'object',
            _key:    (r.vendor || 'v' + idx).toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20),
            vendor:  r.vendor,
            price:   r.price,
            url:     r.url,
            inStock: true,
          }))
          await sanity.patch(existing._id).set({
            pricePerRound: lp.avg,
            trendDir:      trendPct > 0.5 ? 'up' : trendPct < -0.5 ? 'down' : 'flat',
            trendPct:      trendPct,
            inStock:       true,
            bestVendor:    retailers[0]?.vendor || null,
            bestPrice:     retailers[0]?.price  || null,
            bestUrl:       retailers[0]?.url    || null,
            retailers,
            recordedAt:    new Date().toISOString(),
          }).commit()
          updatedPrices++
        }
      } catch { /* continue */ }
    }

    // Generate AI brief
    const brief = await generateBrief(PRICE_SOURCES, [...sanityPrices, ...livePrices])
    if (!brief) {
      await reportCronRun('market-brief', { status: 'warning', ms: Date.now() - t0, details: `${updatedPrices} prices updated`, error: 'AI brief generation failed' })
      return NextResponse.json({ ok: false, error: 'AI generation failed', updatedPrices })
    }

    // Save to Sanity marketAnalysis
    await sanity.create({
      _type:       'marketAnalysis',
      title:       brief.title,
      summary:     brief.summary,
      bullets:     brief.bullets || [],
      signal:      brief.signal,
      signalReason:brief.signalReason,
      author:      'DownRange AI (GLM-4 Air)',
      publishedAt: new Date().toISOString(),
      session:     new Date().getHours() < 12 ? 'AM' : 'PM',
    })

    // Keep only last 14 briefs (2 weeks)
    try {
      const old = await sanity.fetch(
        `*[_type=="marketAnalysis"] | order(publishedAt desc) [14...50] { _id }`
      )
      for (const doc of old) await sanity.delete(doc._id)
    } catch { /* cleanup not critical */ }

    await reportCronRun('market-brief', {
      status: 'success',
      ms: Date.now() - t0,
      details: `Brief: ${brief.title} | ${updatedPrices} prices updated, ${livePrices.length} live fetched`,
    })

    return NextResponse.json({
      ok: true,
      timestamp:    new Date().toISOString(),
      brief:        brief.title,
      updatedPrices,
      liveFetched:  livePrices.length,
    })
  } catch (err) {
    console.error('[market-brief]', err.message)
    await reportCronRun('market-brief', { status: 'failed', ms: Date.now() - t0, error: err.message })
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
