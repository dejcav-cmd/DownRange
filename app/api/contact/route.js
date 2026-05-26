export const dynamic = 'force-dynamic'

export async function POST(req) {
  const { name, email, subject, message, phone } = await req.json()
  if (!name || !email || !message) return Response.json({ error:'Name, email, and message are required' }, { status:400 })

  // Basic spam check
  if (message.length > 5000) return Response.json({ error:'Message too long' }, { status:400 })

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'DownRange Contact <noreply@downrangeco.com>',
      to: [process.env.CONTACT_EMAIL || 'dejalma.cavalcanti@icloud.com'],
      replyTo: email,
      subject: `[DownRange Contact] ${subject || 'New message from ' + name}`,
      html: `
        <div style="font-family:monospace;max-width:600px;margin:0 auto;background:var(--background);color:#F0EDE6;padding:32px">
          <div style="font-family:Georgia,serif;font-size:24px;color:#C8922A;letter-spacing:2px;margin-bottom:20px;border-bottom:1px solid #1F2428;padding-bottom:16px">
            DOWNRANGE — New Contact
          </div>
          <table style="width:100%;margin-bottom:20px">
            <tr><td style="color:#6B7280;padding:6px 0;width:120px">From</td><td style="color:#F0EDE6">${name}</td></tr>
            <tr><td style="color:#6B7280;padding:6px 0">Email</td><td style="color:#C8922A">${email}</td></tr>
            ${phone ? `<tr><td style="color:#6B7280;padding:6px 0">Phone</td><td style="color:#F0EDE6">${phone}</td></tr>` : ''}
            <tr><td style="color:#6B7280;padding:6px 0">Subject</td><td style="color:#F0EDE6">${subject || '(No subject)'}</td></tr>
          </table>
          <div style="background:#111318;border:1px solid #1F2428;border-left:3px solid #C8922A;padding:16px;margin-bottom:20px">
            <div style="color:#6B7280;font-size:10px;letter-spacing:1px;margin-bottom:10px">MESSAGE</div>
            <div style="color:#D1D5DB;line-height:1.8">${message.replace(/\n/g,'<br>')}</div>
          </div>
          <div style="font-size:10px;color:#374151">Sent from downrangeco.com/contact</div>
        </div>
      `
    })
    return Response.json({ success:true })
  } catch (err) {
    console.error('Contact form error:', err)
    return Response.json({ error:'Failed to send. Please try again.' }, { status:500 })
  }
}
