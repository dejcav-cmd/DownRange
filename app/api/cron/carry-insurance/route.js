export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

// Weekly carry insurance data refresh
// Fetches current pricing from official plan websites
// Runs every Monday at 6am UTC: 0 6 * * 1

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY

const PLAN_URLS = {
  USCCA:        'https://www.uscca.com/membership/',
  'CCW Safe':   'https://ccwsafe.com/store/plans/',
  'Second Call Defense': 'https://www.secondcalldefense.org/plans/',
  'US Law Shield': 'https://www.uslawshield.com/plans/',
}

// Canonical plan data — updated when scraped price differs by >5%
// This is the source of truth for the carry-insurance page
const CANONICAL_PLANS = [
  {
    name: 'USCCA',
    tier: 'Elite',
    monthly: 47,
    annual: 497,
    coverage: '$2M civil',
    criminal: 'Attorney fees paid upfront',
    bail: '$100K',
    training: 'Included ($25 value)',
    verdict: 'Best overall for most carriers. Attorney fees paid before trial means no out-of-pocket surprise. Strongest training library in the industry.',
    rating: 9.4,
    url: 'https://www.uscca.com',
    pros: ['Pays attorney before trial', 'Best training resources', 'Established 2003', '$2M civil coverage', 'Bail bond coverage'],
    cons: ['Most expensive plan', 'Monthly cost adds up over years'],
  },
  {
    name: 'CCW Safe',
    tier: 'Ultimate',
    monthly: 55,
    annual: 659,
    coverage: 'Unlimited civil',
    criminal: 'Unlimited attorney fees',
    bail: 'Unlimited',
    training: 'Not included',
    verdict: 'Best for maximum coverage. Unlimited attorney fees is unmatched anywhere. Favored by attorneys themselves for its no-cap structure.',
    rating: 9.2,
    url: 'https://ccwsafe.com',
    pros: ['Unlimited attorney coverage', 'Unlimited civil liability', 'You choose your own attorney', 'Fastest claims processing'],
    cons: ['No training benefits included', 'Most expensive tier available'],
  },
  {
    name: 'Second Call Defense',
    tier: 'Ultimate',
    monthly: 27,
    annual: 324,
    coverage: '$1M civil',
    criminal: '$150K criminal defense',
    bail: '$25K',
    training: 'Not included',
    verdict: 'Best budget choice. Significantly cheaper than the top two while still offering meaningful coverage limits. Good for newer carriers.',
    rating: 8.5,
    url: 'https://www.secondcalldefense.org',
    pros: ['Lowest price of major plans', 'Immediate access to attorneys', 'Covers cleaning fees', 'Crime scene cleanup covered'],
    cons: ['Lower coverage limits', 'No training resources'],
  },
  {
    name: 'US Law Shield',
    tier: 'Defender',
    monthly: 11,
    annual: 131,
    coverage: 'Unlimited civil',
    criminal: 'Unlimited attorney',
    bail: 'Not included',
    training: 'Not included',
    verdict: 'Ultra-budget entry point. Unlimited coverage at the lowest price point. Missing bail and extras but covers the core legal defense need.',
    rating: 8.0,
    url: 'https://www.uslawshield.com',
    pros: ['Cheapest monthly rate', 'Unlimited attorney coverage', 'Available in all 50 states', 'Simple fast signup'],
    cons: ['No bail bond coverage', 'Limited extras and support', 'No training content'],
  },
]

async function tryFetchPrice(url, planName) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // Extract price patterns: $XX/mo, $XX/month, $XX per month
    const monthlyPatterns = [
      /\$(\d+)\.?\d*\s*\/\s*mo/i,
      /\$(\d+)\.?\d*\s*per\s*month/i,
      /\$(\d+)\.?\d*\s*a\s*month/i,
    ]
    for (const pat of monthlyPatterns) {
      const m = html.match(pat)
      if (m) return parseInt(m[1])
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const key    = req.headers.get('x-admin-key') || searchParams.get('key')
  const auth   = req.headers.get('authorization')
  const isCron = req.headers.get('x-vercel-cron') === '1'
  const isBearer = process.env.CRON_SECRET && auth === 'Bearer ' + process.env.CRON_SECRET
  if (!isCron && !isBearer && key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const results = []
  let updated = 0

  for (const plan of CANONICAL_PLANS) {
    const url = PLAN_URLS[plan.name]
    if (!url) continue

    const scrapedPrice = await tryFetchPrice(url, plan.name)
    const delta = scrapedPrice ? Math.abs(scrapedPrice - plan.monthly) / plan.monthly : 0

    results.push({
      plan: plan.name,
      canonical: plan.monthly,
      scraped: scrapedPrice,
      delta: Math.round(delta * 100) + '%',
      action: delta > 0.05 ? 'NEEDS_UPDATE' : 'current',
    })

    if (delta > 0.05 && scrapedPrice) updated++
  }

  // Log result for cron dashboard
  const now = new Date().toISOString()
  console.log(`[carry-insurance-cron] ${now} — checked ${CANONICAL_PLANS.length} plans, ${updated} need price update`)

  return NextResponse.json({
    ok: true,
    timestamp: now,
    checked: CANONICAL_PLANS.length,
    needsUpdate: updated,
    results,
    message: updated > 0
      ? `${updated} plan(s) have pricing changes >5%. Update CANONICAL_PLANS in the cron file.`
      : 'All plan prices current within 5% tolerance.',
  })
}

export async function POST(req) { return GET(req) }
