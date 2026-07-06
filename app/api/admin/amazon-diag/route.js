export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'

const ADMIN_KEY   = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const DEAL_FILTER = '&rh=p_n_deal_type%3A23566065011&s=discount-rank'

const TEST_URLS = {
  with_filter:    'https://www.amazon.com/s?k=olight+flashlight+tactical&i=sporting' + DEAL_FILTER,
  without_filter: 'https://www.amazon.com/s?k=olight+flashlight+tactical&i=sporting',
}

async function fetchViaJina(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'x-respond-with': 'html',
    'Accept': 'text/html',
  }
  if (process.env.JINA_API_KEY) headers['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY
  try {
    const res = await fetch('https://r.jina.ai/' + url, { headers, signal: AbortSignal.timeout(25000) })
    const html = await res.text()
    return { ok: res.ok, status: res.status, html, length: html.length }
  } catch (e) {
    return { ok: false, error: e.message, html: null, length: 0 }
  }
}

function diagnoseHtml(html = '') {
  if (!html) return { asins: [], totalAsins: 0 }
  const asinRe = /data-asin="([A-Z0-9]{10})"/gi
  const asins = []; const seen = new Set(); let m
  while ((m = asinRe.exec(html)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); asins.push(m[1]) }
  }
  const signals = {
    pctBadge:   /[−\-]\s*\d+\s*%|\d+\s*%\s*off/i.test(html),
    limitedDeal:/limited\s+time\s+deal/i.test(html),
    dealOfDay:  /deal\s+of\s+the\s+day/i.test(html),
    textPrice:  /class="[^"]*a-text-price[^"]*"/.test(html),
    youSave:    /you\s+save/i.test(html),
    wasDollar:  /was\s+\$[\d,.]+/i.test(html),
  }
  const anySignal = Object.values(signals).some(Boolean)
  let sampleBlock = ''
  if (asins.length > 0) {
    const idx = html.indexOf(`data-asin="${asins[0]}"`)
    if (idx >= 0) sampleBlock = html.slice(idx, idx + 600).replace(/\s+/g, ' ')
  }
  return {
    totalAsins: asins.length,
    asins: asins.slice(0, 10),
    dealSignals: signals,
    anyDealSignal: anySignal,
    htmlStart: html.slice(0, 200).replace(/\s+/g, ' '),
    sampleBlock,
  }
}

export async function GET(req) {
  if (req.headers.get('x-admin-key') !== ADMIN_KEY)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const results = {}

  for (const [key, url] of Object.entries(TEST_URLS)) {
    const fetch = await fetchViaJina(url)
    results[key] = { httpStatus: fetch.status, htmlLength: fetch.length, error: fetch.error || null, ...diagnoseHtml(fetch.html) }
    await new Promise(r => setTimeout(r, 1500))
  }

  return NextResponse.json({ ms: Date.now() - t0, ...results })
}
