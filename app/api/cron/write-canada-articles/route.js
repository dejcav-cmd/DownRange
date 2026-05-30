// Weekly cron: writes 10 Canada articles every Monday at 10am UTC
// Calls the admin route with cron auth
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req) {
  const auth   = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== 'Bearer ' + secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Call the admin route with admin key
  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://downrangeco.com'

  const res = await fetch(`${origin}/api/admin/write-canada-articles`, {
    method: 'POST',
    headers: { 'x-admin-key': process.env.ADMIN_KEY || '', 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit: 10 }),
  })
  const d = await res.json()
  return Response.json({ ok: true, cron: 'write-canada-articles', ...d })
}
