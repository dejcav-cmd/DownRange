export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { withCronReport } from '../../../../lib/withCronReport'
import { runRadar } from '../../../../lib/legalRadar/pipeline'

// Two scheduled jobs: legal-radar (daily light sweep: SCOTUS dockets, Federal Register, DOJ) and
// legal-radar-weekly (Mondays, ?mode=full adds Congress and CourtListener). ?mode=seed|light|full, ?dry=1.
async function handler(req) {
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  const isAuth = req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin = !!process.env.ADMIN_KEY && req.headers.get('x-admin-key') === process.env.ADMIN_KEY
  if (!isVercel && !isAuth && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = new URL(req.url).searchParams
  const mode = q.get('mode') || 'light'
  const res = await runRadar({ mode, dryRun: q.get('dry') === '1' })
  if (res.ops) revalidatePath('/laws/cases', 'layout')
  // Fail loudly when nothing worked, or when every docket fetched but none parsed (page layout changed).
  const noResults = res.errors.length > 0 && !(res.created + res.updated + res.unchanged)
  const parserBroken = res.scotusChecked >= 3 && res.scotusParsed === 0
  const dead = mode !== 'seed' && (noResults || parserBroken)
  if (parserBroken) res.errors.push('scotus docket parser returned no rows for any case')
  return NextResponse.json({ ok: !dead, ...res }, { status: dead ? 502 : 200 })
}
const daily = withCronReport('legal-radar', handler)
const weekly = withCronReport('legal-radar-weekly', handler)
export const GET = (req, ctx) => (new URL(req.url).searchParams.get('mode') === 'full' ? weekly : daily)(req, ctx)
