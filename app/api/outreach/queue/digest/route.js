export const dynamic = 'force-dynamic'
// GET /api/outreach/queue/digest — called by Vercel cron daily
// Sends DJ an email summary of pending approvals
export async function GET(req) {
  const cronHeader = req.headers.get('x-vercel-cron')
  const adminKey   = req.headers.get('x-admin-key')
  if (cronHeader !== '1' && adminKey !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.downrangeco.com'
  const res = await fetch(`${origin}/api/outreach/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': process.env.ADMIN_KEY || '' },
    body: JSON.stringify({ action: 'digest' }),
  })
  const d = await res.json()
  return Response.json(d)
}
