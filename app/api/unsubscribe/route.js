export const dynamic = 'force-dynamic'
import { client } from '@/sanity/lib/client'
import { mlUnsubscribe } from '@/lib/mailerLite'

export async function POST(req) {
  try {
    const { email } = await req.json()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }
    const emailLower = email.toLowerCase().trim()

    // Update Sanity record
    const existing = await client.fetch(
      `*[_type == "newsletterSubscriber" && email == $email][0]._id`,
      { email: emailLower }
    ).catch(() => null)

    if (existing) {
      await client.patch(existing).set({ status: 'unsubscribed' }).commit()
        .catch(e => console.error('[unsubscribe] Sanity error:', e.message))
    }

    // Unsubscribe from MailerLite
    if (process.env.MAILERLITE_API_KEY) {
      await mlUnsubscribe(emailLower).catch(e =>
        console.error('[unsubscribe] MailerLite error:', e.message)
      )
    }

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[unsubscribe] Error:', e)
    return Response.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}

// One-click unsubscribe via GET ?email=
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
        .catch(e => console.error('[unsubscribe GET] Sanity error:', e.message))
    }

    // Unsubscribe from MailerLite
    if (process.env.MAILERLITE_API_KEY) {
      await mlUnsubscribe(emailLower).catch(e =>
        console.error('[unsubscribe GET] MailerLite error:', e.message)
      )
    }

    return Response.redirect(
      new URL(`/unsubscribe?success=1&email=${encodeURIComponent(emailLower)}`, req.url)
    )
  } catch (e) {
    console.error('[unsubscribe GET] Error:', e)
    return Response.redirect(new URL('/unsubscribe?error=1', req.url))
  }
}
