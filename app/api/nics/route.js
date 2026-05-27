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
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const nicsCSVUrl = `https://www.fbi.gov/file-repository/nics_firearm_checks_month_year_by_state_type.csv`
    const res = await fetch(nicsCSVUrl, { headers: { 'User-Agent': 'DownRange/1.0' } })
    if (!res.ok) return Response.json({ message: 'NICS CSV unavailable' })
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
    return Response.json({ success: true, totalChecks })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
