// app/api/newsletter/test/route.js
import { Resend } from 'resend'
import { generateWelcomeEmailHTML } from '@/lib/emailTemplates'

export async function POST(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'DownRange <news@downrangeco.com>',
      to: email,
      subject: '🔫 [TEST] Welcome to DownRange Co. — Your 2A Intelligence Briefing',
      html: generateWelcomeEmailHTML(),
    })

    return Response.json({ success: true, message: `Test email sent to ${email}` })
  } catch (err) {
    console.error('[newsletter/test] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
