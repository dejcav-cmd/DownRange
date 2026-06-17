import { reportCronRun } from '@/lib/cronReporter'
export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  const isCron   = req.headers.get('x-vercel-cron') === '1'
  const isBearer = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = adminKey === process.env.ADMIN_KEY
  if (!isCron && !isBearer && !isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    // FBI has changed this URL multiple times — try all known locations
    const NICS_URLS = [
      'https://www.fbi.gov/file-repository/nics_firearm_checks_month_year_by_state_type.csv/view',
      'https://www.fbi.gov/file-repository/nics_firearm_checks_month_year_by_state_type.csv',
      'https://s3-us-gov-west-1.amazonaws.com/cg-d4b776d0-d898-4153-90c8-8336f86bdfec/nics_firearm_checks_month_year_by_state_type.csv',
    ]
    let res = null
    for (const url of NICS_URLS) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)' }, signal: AbortSignal.timeout(15000) })
        if (r.ok) { res = r; break }
      } catch {}
    }
    if (!res) return Response.json({ message: 'NICS CSV unavailable — FBI URL may have changed. Check https://www.fbi.gov/services/cjis/nics' })
    const csv  = await res.text()
    const rows = csv.trim().split('\n').map(r => r.split(','))
    let totalChecks = 0
    for (const row of rows.slice(1)) {
      const total = parseInt(row[row.length - 1]?.replace(/"/g, '') || '0')
      if (!isNaN(total)) totalChecks += total
    }
    await sanity.createOrReplace({
      _id: 'globalStats', _type: 'globalStats',
      nicsMonthlyTotal: totalChecks, nicsLastUpdated: new Date().toISOString(),
    })
    await reportCronRun('nics', { status: 'success', ms: 0, details: 'completed' }).catch(()=>{})
    return Response.json({ success: true, totalChecks })
  } catch (err) {
    await reportCronRun('nics', { status: 'failed', ms: 0, error: err.message }).catch(() => {})
    return Response.json({ error: err.message }, { status: 500 })
  }
}
