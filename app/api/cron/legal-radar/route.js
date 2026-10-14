export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { withCronReport } from '../../../../lib/withCronReport'
import { runRadar } from '../../../../lib/legalRadar/pipeline'

// Daily 2A legal radar. Mondays run a full sweep (Congress, CourtListener); other days
// run the light sweep (SCOTUS dockets, Federal Register, DOJ). ?mode=seed|light|full, ?dry=1.
async function handler(req) {
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  const isAuth = req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
  if (!isVercel && !isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = new URL(req.url).searchParams
  const mode = q.get('mode') || (new Date().getUTCDay() === 1 ? 'full' : 'light')
  const res = await runRadar({ mode, dryRun: q.get('dry') === '1' })
  if (res.ops) revalidatePath('/laws/cases', 'layout')
  const dead = mode !== 'seed' && res.errors.length > 0 && !(res.created + res.updated + res.unchanged)
  return NextResponse.json({ ok: !dead, ...res }, { status: dead ? 502 : 200 })
}
export const GET = withCronReport('legal-radar', handler)
