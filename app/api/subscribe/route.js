export const dynamic = 'force-dynamic'
import { Resend } from 'resend'
import { generateWelcomeEmailHTML } from '@/lib/emailTemplates'

const resend = () => new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }
    const emailLower = email.toLowerCase().trim()

    // Add to Resend audience
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (audienceId && audienceId !== 'your_audience_id') {
      await resend().contacts.create({ audienceId, email: emailLower, unsubscribed: false })
        .catch(e => console.log('Resend audience:', e.message))
    }

    // Welcome email with new template
    await resend().emails.send({
      from:    'DownRange <news@downrangeco.com>',
      to:      emailLower,
      subject: "Welcome to DownRange — Your Daily 2A Intelligence Briefing",
      html: generateWelcomeEmailHTML(),
    }).catch(e => console.log('Welcome email error:', e.message))

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
