export const dynamic = 'force-dynamic'

import { Resend } from 'resend'

const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")

export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json()

    if (!name || !email || !message) {
      return Response.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (message.length > 2000) {
      return Response.json({ error: 'Message too long (max 2000 characters).' }, { status: 400 })
    }

    const { error } = await getResend().emails.send({
      from: 'DownRange Feedback <feedback@downrangeco.com>',
      to: ['dejcav@gmail.com'],
      replyTo: email,
      subject: `[DownRange Feedback] ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family:sans-serif;background:#09090B;color:#e5e7eb;padding:32px;">
            <div style="max-width:560px;margin:0 auto;background:#111316;border:1px solid #1f2428;border-top:3px solid #C8922A;padding:32px;border-radius:4px;">
              <h2 style="color:#C8922A;font-size:20px;margin:0 0 24px;letter-spacing:0.05em;">NEW FEEDBACK — DOWNRANGECO.COM</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#9ca3af;width:100px;">Name</td><td style="padding:8px 0;color:#e5e7eb;">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#9ca3af;">Email</td><td style="padding:8px 0;color:#e5e7eb;"><a href="mailto:${email}" style="color:#C8922A;">${email}</a></td></tr>
                ${phone ? `<tr><td style="padding:8px 0;color:#9ca3af;">Phone</td><td style="padding:8px 0;color:#e5e7eb;">${phone}</td></tr>` : ''}
              </table>
              <div style="margin-top:24px;padding-top:24px;border-top:1px solid #1f2428;">
                <p style="color:#9ca3af;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
                <p style="color:#e5e7eb;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
              </div>
              <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1f2428;font-size:11px;color:#4b5563;">
                Sent from downrangeco.com feedback form
              </div>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return Response.json({ error: 'Failed to send. Please try again.' }, { status: 500 })
    }

    return Response.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('Feedback route error:', err)
    return Response.json({ error: 'Server error.' }, { status: 500 })
  }
}
