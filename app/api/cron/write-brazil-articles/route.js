export const dynamic  = 'force-dynamic'
export const maxDuration = 300

export async function GET(req) {
  const isCron   = process.env.CRON_SECRET && (req.headers.get('authorization')||'') === `Bearer ${process.env.CRON_SECRET}`
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && !isVercel) return Response.json({ error:'Unauthorized' }, { status:401 })

  const origin = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL || 'downrangeco.com'}` : 'https://downrangeco.com'

  const res = await fetch(`${origin}/api/admin/write-brazil-articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: `Bearer ${process.env.CRON_SECRET}` },
    body: JSON.stringify({ limit: 2 }),
  })
  const d = await res.json().catch(() => ({}))
  return Response.json({ ok: true, cron: 'write-brazil-articles', ...d })
}
