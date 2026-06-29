export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { reportCronRun } from '@/lib/cronReporter'

// Daily sitemap revalidation cron — 2am UTC
// Forces Next.js to regenerate /sitemap.xml and /news-sitemap.xml on next request

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
  const isCron  = cronSecret && auth === 'Bearer ' + cronSecret
  const isAdmin = adminKey === ADMIN_KEY
  const isVercel = req.headers.get('x-vercel-cron') === '1'

  if (!isCron && !isAdmin && !isVercel) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  try {
    revalidatePath('/sitemap.xml')
    revalidatePath('/news-sitemap.xml')
    revalidatePath('/blog')

    const ms = Date.now() - t0
    await reportCronRun('sitemap', {
      status: 'success', ms,
      details: 'Revalidated: /sitemap.xml, /news-sitemap.xml, /blog',
    }).catch(() => {})

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      revalidated: ['/sitemap.xml', '/news-sitemap.xml', '/blog'],
      message: 'Sitemap revalidated — fresh XML will be generated on next request',
    })
  } catch (err) {
    await reportCronRun('sitemap', { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
