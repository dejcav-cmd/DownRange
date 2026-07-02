export const dynamic = 'force-dynamic'
import { Resend } from 'resend'
import { generateWelcomeEmailHTML } from '@/lib/emailTemplates'
import { mlSubscribe } from '@/lib/mailerLite'

const resend = () => new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function POST(req) {
  try {
    const { email, name } = await req.json()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }
    const emailLower = email.toLowerCase().trim()

    // Add to MailerLite group
    if (process.env.MAILERLITE_API_KEY) {
      await mlSubscribe(emailLower, { name }).catch(e =>
        console.error('[subscribe] MailerLite error:', e.message)
      )
    }

    // Welcome email via Resend
    await resend().emails.send({
      from:    'DownRange <news@downrangeco.com>',
      to:      emailLower,
      subject: 'Welcome to DownRange Co. — Your 2A Intelligence Briefing',
      html:    generateWelcomeEmailHTML(name),
    }).catch(e => console.error('[subscribe] Welcome email error:', e.message))

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[subscribe] Error:', e)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
