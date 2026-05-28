export const dynamic = 'force-dynamic'
import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

const MAILBOXES = [
  { from: 'DownRange Contact <noreply@downrangeco.com>',    to: 'dj@downrangeco.com',  subject: '[TEST] noreply@downrangeco.com',       desc: 'Contact form sender' },
  { from: 'DownRange Feedback <feedback@downrangeco.com>',  to: 'dj@downrangeco.com',  subject: '[TEST] feedback@downrangeco.com',     desc: 'Feedback modal sender' },
  { from: 'DownRange <news@downrangeco.com>',               to: 'dj@downrangeco.com',  subject: '[TEST] news@downrangeco.com',          desc: 'Newsletter sender' },
  { from: 'DownRange Intelligence <intelligence@downrangeco.com>', to: 'dj@downrangeco.com', subject: '[TEST] intelligence@downrangeco.com', desc: 'Intelligence briefing sender' },
  { from: 'DJ Cavalcanti — DownRange <dj@downrangeco.com>', to: 'dj@downrangeco.com',  subject: '[TEST] dj@downrangeco.com',             desc: 'Outreach sender' },
  { from: 'DownRange Outreach <outreach@downrangeco.com>',  to: 'dj@downrangeco.com',  subject: '[TEST] outreach@downrangeco.com',      desc: 'Outreach queue digest' },
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const resend = getResend()
  const results = []

  for (const mb of MAILBOXES) {
    try {
      const { data, error } = await resend.emails.send({
        from:    mb.from,
        to:      [mb.to],
        subject: mb.subject,
        html:    `<div style="font-family:monospace;background:#0A0B0C;color:#e5e7eb;padding:24px;max-width:480px">
          <div style="color:#C8922A;font-size:18px;font-weight:bold;margin-bottom:12px">✓ DownRange Email Test</div>
          <div style="margin-bottom:8px"><strong>From:</strong> ${mb.from}</div>
          <div style="margin-bottom:8px"><strong>Purpose:</strong> ${mb.desc}</div>
          <div style="margin-bottom:8px"><strong>SPF/DKIM:</strong> Zoho + Resend (amazonses.com)</div>
          <div style="margin-bottom:8px"><strong>DMARC:</strong> p=none monitoring active</div>
          <div style="margin-top:16px;color:#6B7280;font-size:12px">downrangeco.com — sent ${new Date().toISOString()}</div>
        </div>`,
      })
      results.push({ mailbox: mb.from, status: error ? 'error' : 'sent', id: data?.id, error: error?.message })
    } catch (e) {
      results.push({ mailbox: mb.from, status: 'exception', error: e.message })
    }
  }

  const sent = results.filter(r => r.status === 'sent').length
  return Response.json({ ok: true, sent, total: MAILBOXES.length, results })
}
