export const dynamic = 'force-dynamic'
import { Resend } from 'resend'

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey   = process.env.RESEND_API_KEY
  const diag = {
    RESEND_API_KEY_set:    !!apiKey,
    RESEND_API_KEY_prefix: apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING',
    ADMIN_KEY_set:         !!process.env.ADMIN_KEY,
    SANITY_TOKEN_set:      !!process.env.SANITY_API_TOKEN,
    NODE_ENV:              process.env.NODE_ENV,
  }

  if (!apiKey) return Response.json({ ok: false, diag, error: 'RESEND_API_KEY not set in Vercel env' })

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from:    'DJ Cavalcanti <dj@downrangeco.com>',
      to:      ['dj@downrangeco.com'],
      subject: '[DownRange] Outreach test — ' + new Date().toISOString(),
      html:    '<p style="font-family:sans-serif">Test send from DownRange outreach system. Resend is reachable.</p>',
    })

    if (error) return Response.json({ ok: false, diag, resend_error: error })
    return Response.json({ ok: true, diag, resend_id: data?.id, message: 'Sent to dj@downrangeco.com' })
  } catch (e) {
    return Response.json({ ok: false, diag, exception: e.message, stack: e.stack?.slice(0, 500) })
  }
}
