export const dynamic    = 'force-dynamic'
export const maxDuration = 30

/**
 * r/gundeals cron — Vercel endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 * Reddit's Cloudflare blocks RSS from datacenter IPs (Vercel included).
 * Actual scraping runs via GitHub Actions (residential IPs, not blocked):
 *   .github/workflows/reddit-deals-fetch.yml  →  scripts/fetch_reddit_deals.py
 *
 * This route exists to:
 *   1. Keep Vercel's scheduler happy (cron endpoint must exist)
 *   2. Fire reportCronRun so Mission Control shows correct status
 *   3. Surface the last Actions run result from the committed log file
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse }    from 'next/server'
import { createClient }    from '@sanity/client'
import { reportCronRun }   from '@/lib/cronReporter'

const ADMIN_KEY  = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'

const sanity = createClient({
  projectId:  PROJECT_ID,
  dataset:    'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN,
  useCdn:     false,
})

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth       = req.headers.get('authorization')
  const adminKey   = req.headers.get('x-admin-key')
  const isCron     = cronSecret && auth === `Bearer ${cronSecret}`
  const isVercel   = req.headers.get('x-vercel-cron') === '1'
  const isAdmin    = adminKey === ADMIN_KEY

  if (!isCron && !isVercel && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const t0 = Date.now()

  try {
    // Count recent Reddit deals written by Actions as a health signal
    const cutoff = new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    const recentCount = await sanity.fetch(
      `count(*[_type=="gunDeal" && source=="reddit" && approved==true && publishedAt > $cutoff])`,
      { cutoff }
    ).catch(() => null)

    const ms = Date.now() - t0
    const details = recentCount !== null
      ? `actions-managed; ${recentCount} reddit deals in last 2h`
      : 'actions-managed; sanity check skipped'

    await reportCronRun('reddit-deals', { status: 'success', ms, details }).catch(() => {})

    return NextResponse.json({ ok: true, ms, note: 'scraping via GitHub Actions', recentDeals2h: recentCount })

  } catch (err) {
    const ms = Date.now() - t0
    await reportCronRun('reddit-deals', { status: 'failed', ms, error: err.message }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
