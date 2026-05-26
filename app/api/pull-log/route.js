/**
 * /app/api/pull-log/route.js
 * Serves pull log data + stats to the admin dashboard.
 * Also accepts POST to seed test entries during dev.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getPullLog, getPullStats, logPull, STATUS, PULL_SOURCES } from '@/lib/pullLogger'

// GET /api/pull-log?limit=100&source=ammoland_news&status=failed&category=news
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const limit    = parseInt(searchParams.get('limit') || '200')
    const source   = searchParams.get('source') || null
    const status   = searchParams.get('status') || null
    const category = searchParams.get('category') || null
    const view     = searchParams.get('view') || 'log' // 'log' | 'stats'

    if (view === 'stats') {
      const stats = getPullStats()
      return NextResponse.json({ ok: true, stats })
    }

    const entries = getPullLog({ limit, source, status, category })
    const stats   = getPullStats()

    return NextResponse.json({ ok: true, entries, stats, count: entries.length })
  } catch (err) {
    console.error('[pull-log GET]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// POST /api/pull-log/seed  — dev only, seeds realistic fake data
export async function POST(req) {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    return NextResponse.json({ ok: false, error: 'Seeding not allowed in production' }, { status: 403 })
  }

  try {
    const sources = Object.values(PULL_SOURCES)
    const statuses = [STATUS.SUCCESS, STATUS.SUCCESS, STATUS.SUCCESS, STATUS.PARTIAL, STATUS.FAILED, STATUS.SKIPPED]
    const sampleHeadlines = {
      news: [
        'Springfield Armory Releases New Hellcat Pro Variant',
        'ATF Ruling on Pistol Braces Faces Court Challenge',
        'Ruger Announces Limited Edition 10/22 Carbine',
        'SIG Sauer Wins Military Contract for P320 Upgrade',
        'Glock 17 Gen6 Leaked Photos Surface Online',
      ],
      deals: [
        'Federal HST 9mm 124gr - $18.99/50rd at Brownells',
        'Hornady Critical Defense 45 ACP - 15% Off This Week',
        'Magpul PMAG 30 AR/M4 - $9.99 each (limit 10)',
        'Taurus G3C 9mm - $269 shipped - Cheapest Ever',
        'Bulk .223 Rem 55gr FMJ - $0.32/rd with code DOWNRANGE',
      ],
      hunting: [
        'Early Elk Season Tags Open June 1 in Eastern WA',
        'Federal Duck Stamps Now Available at Post Offices',
        'Pheasant Population Report Shows Record Numbers',
      ],
      video: [
        'MrGunsNGear: We Tested Every Budget Red Dot',
        'Kentucky Ballistics: 50 BMG vs Engine Block',
        'Garand Thumb: Is the AR-15 Still Relevant?',
      ],
    }

    const seeded = []
    const count = 60
    const now = Date.now()

    for (let i = 0; i < count; i++) {
      const src = sources[Math.floor(Math.random() * sources.length)]
      const st  = statuses[Math.floor(Math.random() * statuses.length)]
      const daysAgo = Math.random() * 7
      const fakeTimestamp = new Date(now - daysAgo * 86400000)

      const items  = st === STATUS.FAILED ? 0 : Math.floor(Math.random() * 40) + 1
      const newIt  = Math.floor(items * (0.1 + Math.random() * 0.6))
      const dur    = Math.floor(Math.random() * 3200) + 80
      const catHeadlines = sampleHeadlines[src.category] || sampleHeadlines.news

      const entry = logPull({
        sourceId: src.id,
        status: st,
        itemCount: items,
        newItems: newIt,
        duration: dur,
        error: st === STATUS.FAILED ? 'Connection timeout after 10000ms' : null,
        headlines: st !== STATUS.FAILED
          ? catHeadlines.sort(() => 0.5 - Math.random()).slice(0, 3)
          : [],
        meta: {
          url: `https://feeds.example.com/${src.id}`,
          httpStatus: st === STATUS.FAILED ? 503 : 200,
          feedSize: `${Math.floor(Math.random() * 120) + 10}KB`,
          triggeredBy: ['cron', 'manual', 'webhook'][Math.floor(Math.random() * 3)],
        },
      })

      seeded.push(entry.id)
    }

    return NextResponse.json({ ok: true, seeded: seeded.length })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
