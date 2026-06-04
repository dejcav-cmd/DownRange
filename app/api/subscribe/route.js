export const dynamic = 'force-dynamic'
import { Resend } from 'resend'

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

    // Welcome email
    await resend().emails.send({
      from:    'DownRange <intel@downrangeco.com>',
      to:      emailLower,
      subject: "You're in. DownRange Daily starts now.",
      html: `
        <div style="background:#09090B;color:#E5E5E5;font-family:'IBM Plex Mono',monospace;max-width:560px;margin:0 auto;padding:40px 32px;">
          <div style="border-bottom:2px solid #C8922A;padding-bottom:16px;margin-bottom:28px;">
            <div style="font-size:11px;color:#C8922A;letter-spacing:0.15em;font-weight:700;">DOWNRANGE INTELLIGENCE</div>
            <div style="font-size:24px;font-weight:700;color:#F5F5F3;margin-top:4px;">Welcome to the Feed</div>
          </div>
          <p style="font-size:14px;line-height:1.8;color:#9CA3AF;">
            You are now subscribed to DownRange Daily. Independent 2A news, state law updates, and intelligence briefings for people who carry.
          </p>
          <div style="margin:28px 0;padding:16px 20px;border-left:3px solid #C8922A;background:#111318;">
            <div style="font-size:11px;color:#C8922A;letter-spacing:0.1em;margin-bottom:8px;">WHAT YOU'LL GET</div>
            <ul style="font-size:13px;color:#9CA3AF;line-height:2;margin:0;padding-left:16px;">
              <li>Breaking ATF rules and SCOTUS decisions</li>
              <li>50-state CCW reciprocity updates</li>
              <li>New gun releases and honest reviews</li>
              <li>Weekly intelligence briefing</li>
            </ul>
          </div>
          <a href="https://downrangeco.com/news" style="display:inline-block;background:#C8922A;color:#09090B;padding:12px 28px;font-weight:700;font-size:13px;letter-spacing:0.08em;text-decoration:none;margin-top:8px;">READ TODAY'S INTEL</a>
          <div style="margin-top:40px;padding-top:20px;border-top:1px solid #1F2428;font-size:10px;color:#374151;">
            Subscribed at downrangeco.com.
          </div>
        </div>`,
    }).catch(e => console.log('Welcome email error:', e.message))

    return Response.json({ ok: true })
  } catch (e) {
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}
