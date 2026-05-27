export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getPullLog, getPullStats, logPull, STATUS, PULL_SOURCES } from '@/lib/pullLogger'

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { searchParams } = new URL(req.url)
    const limit    = parseInt(searchParams.get('limit') || '200')
    const source   = searchParams.get('source') || null
    const status   = searchParams.get('status') || null
    const category = searchParams.get('category') || null
    const view     = searchParams.get('view') || 'log'

    if (view === 'stats') {
      const stats = await getPullStats()
      return NextResponse.json({ ok: true, stats })
    }

    const [entries, stats] = await Promise.all([
      getPullLog({ limit, source, status, category }),
      getPullStats(),
    ])

    return NextResponse.json({ ok: true, entries, stats, count: entries.length })
  } catch (err) {
    console.error('[pull-log GET]', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  // Seed test data (any env — useful for testing dashboard)
  try {
    const sources  = Object.values(PULL_SOURCES)
    const statuses = [STATUS.SUCCESS, STATUS.SUCCESS, STATUS.SUCCESS, STATUS.PARTIAL, STATUS.FAILED]
    const sampleH  = {
      news:   ['Springfield Releases Hellcat Pro Variant','ATF Brace Rule Faces Court Challenge','Ruger Announces 10/22 Limited Edition'],
      deals:  ['Federal HST 9mm 124gr $18.99/50 at Brownells','Magpul PMAG 30rd $9.99 limit 10','Taurus G3C 9mm $269 shipped'],
      law:    ['House Passes SHARE Act','CA AWB Ruled Unconstitutional','SCOTUS Takes Up 2A Challenge'],
      video:  ['MrGunsNGear: Every Budget Red Dot Tested','Kentucky Ballistics: 50BMG vs Engine Block'],
    }
    const seeded = []
    for (let i = 0; i < 40; i++) {
      const src = sources[Math.floor(Math.random() * sources.length)]
      const st  = statuses[Math.floor(Math.random() * statuses.length)]
      const items = st === STATUS.FAILED ? 0 : Math.floor(Math.random() * 30) + 1
      const h   = sampleH[src.category] || sampleH.news
      const entry = await logPull({
        sourceId:  src.id,
        status:    st,
        itemCount: items,
        newItems:  Math.floor(items * Math.random() * 0.7),
        duration:  Math.floor(Math.random() * 3000) + 100,
        error:     st === STATUS.FAILED ? 'Connection timeout after 10000ms' : null,
        headlines: st !== STATUS.FAILED ? h.slice(0, 2) : [],
        meta:      { triggeredBy:'seed', httpStatus: st===STATUS.FAILED?503:200 },
      })
      seeded.push(entry.id)
    }
    return NextResponse.json({ ok: true, seeded: seeded.length })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
