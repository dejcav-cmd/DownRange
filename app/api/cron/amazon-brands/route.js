export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

/**
 * amazon-brands — DISABLED (Amazon blocks server-side scrapers with CAPTCHAs)
 *
 * This route was designed to scrape Amazon brand search pages via Jina proxy,
 * but Amazon returns a 2346-byte CAPTCHA redirect to all datacenter IPs.
 * Diagnostic confirmed: 0 ASINs in both filtered and unfiltered Jina fetches.
 *
 * Brand-specific queries are now handled by the PA API cron (amazon-deals),
 * which has slots 4-7 covering Olight, Streamlight, Vortex, Holosun, Burris,
 * Magpul, Monstrum, Gold Tip, Rage, Carbon Express, and Caldwell.
 * That cron activates automatically once AMAZON_ACCESS_KEY + AMAZON_SECRET_KEY
 * are added to Vercel env vars (requires 3 qualifying sales to unlock PA API).
 *
 * Until then: use the manual ASIN import at Admin → Deals Manager.
 */

export async function GET() {
  return NextResponse.json({
    ok: false,
    disabled: true,
    reason: 'Amazon blocks Jina-proxy scraping with CAPTCHA redirects. Brand searches are handled by the PA API cron (amazon-deals) once credentials are active.',
    manualPath: 'Admin → Deals Manager → Amazon ASIN Import',
    paApiCronSlots: 'Slots 4-7 cover Olight, Streamlight, Vortex, Holosun, Burris, Magpul, Monstrum, Gold Tip, Rage, Carbon Express, Caldwell',
  }, { status: 503 })
}

export async function POST(req) { return GET(req) }
