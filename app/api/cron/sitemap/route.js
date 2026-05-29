export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Daily sitemap revalidation cron — 2am UTC
// Forces Next.js to regenerate /sitemap.xml and /news-sitemap.xml on next request

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY

  const isCron  = cronSecret && auth === 'Bearer ' + cronSecret
  const isAdmin = adminKey === ADMIN_KEY

  if (!isCron && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Revalidate all dynamic sitemap routes
    revalidatePath('/sitemap.xml')
    revalidatePath('/news-sitemap.xml')
    revalidatePath('/blog')

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      revalidated: ['/sitemap.xml', '/news-sitemap.xml', '/blog'],
      message: 'Sitemap revalidated — fresh XML will be generated on next request',
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
