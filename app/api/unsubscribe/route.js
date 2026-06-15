export const dynamic = 'force-dynamic'
import { client } from '@/sanity/lib/client'
import { Resend } from 'resend'

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }
    const emailLower = email.toLowerCase().trim()

    // 1. Update status in Sanity
    const existing = await client.fetch(
      `*[_type == "newsletterSubscriber" && email == $email][0]._id`,
      { email: emailLower }
    ).catch(() => null)

    if (existing) {
      await client.patch(existing).set({ status: 'unsubscribed' }).commit()
        .catch(e => console.log('Sanity unsubscribe error:', e.message))
    }

    // 2. Mark unsubscribed in Resend audience
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (audienceId && audienceId !== 'your_audience_id') {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.contacts.update({ audienceId, email: emailLower, unsubscribed: true })
        .catch(e => console.log('Resend unsubscribe error:', e.message))
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[unsubscribe] Error:', e)
    return Response.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}

// Also support GET with ?email= for one-click links
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }
    const emailLower = email.toLowerCase().trim()

    // Update Sanity
    const existing = await client.fetch(
      `*[_type == "newsletterSubscriber" && email == $email][0]._id`,
      { email: emailLower }
    ).catch(() => null)

    if (existing) {
      await client.patch(existing).set({ status: 'unsubscribed' }).commit()
        .catch(e => console.log('Sanity unsubscribe error:', e.message))
    }

    // Update Resend
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (audienceId && audienceId !== 'your_audience_id') {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.contacts.update({ audienceId, email: emailLower, unsubscribed: true })
        .catch(e => console.log('Resend unsubscribe error:', e.message))
    }

    // Redirect to unsubscribe page with success state
    return Response.redirect(new URL(`/unsubscribe?success=1&email=${encodeURIComponent(emailLower)}`, req.url))
  } catch (e) {
    console.error('[unsubscribe GET] Error:', e)
    return Response.redirect(new URL('/unsubscribe?error=1', req.url))
  }
}
