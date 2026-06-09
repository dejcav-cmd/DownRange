export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY

export async function GET(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url') || 'https://gun.deals/product/hk45c-v1-45-acp-394-8rd-pistol-night-sights-69999'
  const result = { url, status: null, bodyLength: 0, ogImage: null, error: null, snippet: '', cfChallenge: false }

  try {
    const HEADERS = {
      'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    }
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(12000) })
    result.status = res.status
    const html = await res.text()
    result.bodyLength = html.length
    result.cfChallenge = html.includes('Just a moment') || html.includes('cf-browser-verification')
    const m = html.match(/<meta[\s\S]*?property=["']og:image["'][\s\S]*?content=["']([^"']+)["']/i)
           || html.match(/<meta[\s\S]*?content=["']([^"']+)["'][\s\S]*?property=["']og:image["']/i)
    result.ogImage = m?.[1] || null
    const headStart = Math.max(0, html.indexOf('<head'))
    result.snippet = html.slice(headStart, headStart + 600)
  } catch (e) {
    result.error = e.message
  }
  return NextResponse.json(result)
}
