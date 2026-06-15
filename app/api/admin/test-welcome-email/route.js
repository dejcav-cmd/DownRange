// app/api/admin/test-welcome-email/route.js
import { Resend } from 'resend'
import { generateWelcomeEmailHTML } from '@/lib/emailTemplates'

const resend = () => new Resend(process.env.RESEND_API_KEY || 're_placeholder')

export async function POST(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }

    const result = await resend().emails.send({
      from: 'DownRange <news@downrangeco.com>',
      to: email,
      subject: "Welcome to DownRange — Your Daily 2A Intelligence Briefing",
      html: generateWelcomeEmailHTML(),
    })

    return Response.json({
      success: true,
      message: `Welcome email sent to ${email}`,
      id: result.data?.id,
    })
  } catch (error) {
    console.error('[test-welcome-email] Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
