/**
 * Scrape transport diagnostic.
 *
 * Answers one question that cannot be answered from anywhere else: can THIS
 * runtime — Vercel's egress IP — reach a given page, and by which transport?
 * GitHub Actions runners and the dev sandbox sit on different networks, so a
 * 403 there does not prove a 403 in production.
 *
 * GET /api/admin/scrape-diag?url=https://gun.deals/product/...
 * Requires x-admin-key.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const UA_BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const UA_BOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

function findOg(html = '') {
  const pats = [
    /property=["']og:image["'][^>]*content=["']([^"']{10,})["']/i,
    /content=["']([^"']{10,})["'][^>]*property=["']og:image["']/i,
    /name=["']twitter:image["'][^>]*content=["']([^"']{10,})["']/i,
  ]
  for (const p of pats) { const m = html.match(p); if (m) return m[1] }
  return null
}

async function attempt(label, url, headers) {
  const t0 = Date.now()
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
    const body = res.ok ? await res.text() : ''
    return {
      label, status: res.status, ms: Date.now() - t0, bytes: body.length,
      challenge: /just a moment|cf-browser-verification|checking your browser/i.test(body.slice(0, 2000)),
      ogImage: findOg(body),
    }
  } catch (e) {
    return { label, status: 0, ms: Date.now() - t0, error: `${e.name}: ${e.message}`.slice(0, 120) }
  }
}

export async function GET(req) {
  if (req.headers.get('x-admin-key') !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const target = new URL(req.url).searchParams.get('url')
  if (!target) return NextResponse.json({ error: 'url param required' }, { status: 400 })

  const browser = { 'User-Agent': UA_BROWSER, 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' }
  const jina = { 'User-Agent': UA_BROWSER, 'x-respond-with': 'html', 'Accept': 'text/html' }
  if (process.env.JINA_API_KEY) jina['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY

  const attempts = await Promise.all([
    attempt('direct-browser-ua', target, browser),
    attempt('direct-googlebot-ua', target, { ...browser, 'User-Agent': UA_BOT }),
    attempt('jina', 'https://r.jina.ai/' + target, jina),
    // gun.deals is Drupal; these expose node data without the themed HTML page
    // and are often not covered by the same bot rule.
    attempt('drupal-json', target + '?_format=json', { ...browser, Accept: 'application/json' }),
    attempt('amp', target.replace(/\/?$/, '') + '?amp', browser),
  ])

  return NextResponse.json({
    target,
    runtime: 'vercel',
    hasJinaKey: Boolean(process.env.JINA_API_KEY),
    attempts,
  })
}
