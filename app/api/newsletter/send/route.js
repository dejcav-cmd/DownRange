export const dynamic = 'force-dynamic'

export async function POST(req) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error:'Unauthorized' }, { status:401 })
  const { subject, body } = await req.json()
  if (!subject || !body) return Response.json({ error:'subject and body required' }, { status:400 })

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_AUDIENCE_ID) {
    return Response.json({ error:'RESEND_API_KEY or RESEND_AUDIENCE_ID not configured' }, { status:500 })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const result = await resend.emails.send({
      from: 'DownRange <newsletter@downrangeco.com>',
      to: [`audience:${process.env.RESEND_AUDIENCE_ID}`],
      subject,
      text: body,
      html: `<div style="font-family:monospace;max-width:600px;margin:0 auto;background:var(--background);color:#F0EDE6;padding:32px"><h1 style="color:#C8922A;font-family:Georgia,serif;letter-spacing:2px">${subject}</h1><div style="line-height:1.8;color:#94A3B8">${body.replace(/\n/g,'<br>')}</div><hr style="border-color:#1F2428;margin-top:32px"><p style="font-size:11px;color:#4B5563">DownRange · America's Firearms Intelligence Hub · <a href="https://downrangeco.com/unsubscribe" style="color:#C8922A">Unsubscribe</a></p></div>`,
    })
    return Response.json({ sent: 1, id: result.data?.id })
  } catch (err) {
    return Response.json({ error: err.message }, { status:500 })
  }
}
