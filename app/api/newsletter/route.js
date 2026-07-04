import { reportCronRun } from '@/lib/cronReporter'
import { generateNewsletterHTML } from '@/lib/emailTemplates'
export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

function getResend() {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

// ── Subscriber signup (POST) ────────────────────────────────────────────────
export async function POST(req) {
  try {
    const { email, name } = await req.json()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    try {
      const existing = await sanity.fetch(
        `*[_type == "newsletterSubscriber" && email == $email][0]`,
        { email }
      )
      if (existing) {
        if (existing.status === 'unsubscribed') {
          await sanity.patch(existing._id).set({ status: 'active', subscribedAt: new Date().toISOString() }).commit()
        }
      } else {
        await sanity.create({
          _type: 'newsletterSubscriber',
          email,
          status: 'active',
          subscribedAt: new Date().toISOString(),
          source: 'website',
          notes: name ? `Signup name: ${name}` : '',
        })
      }
    } catch (err) {
      console.error('Sanity subscriber error:', err.message)
    }

    if (process.env.MAILERLITE_API_KEY) {
      const { mlSubscribe } = require('@/lib/mailerLite')
      await mlSubscribe(email, { name }).catch(e => console.error('MailerLite error:', e.message))
    }

    const resend = getResend()
    if (process.env.RESEND_API_KEY) {
      const { generateWelcomeEmailHTML } = require('@/lib/emailTemplates')
      await resend.emails.send({
        from: 'DownRange <news@downrangeco.com>',
        to: email,
        subject: 'Welcome to DownRange — Your 2A Intelligence Briefing',
        html: generateWelcomeEmailHTML(name),
      }).catch(err => console.error('Email send error:', err.message))
    }
    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}

// ── Weekly digest cron (GET) ────────────────────────────────────────────────
export async function GET(req) {
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  const isAuth   = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  if (!isVercel && !isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()

  try {
    // Fetch all content in parallel — top 10 stories + videos + ammo + NFA
    const [stories, deals, alerts, subscribers, videos, ammo, nfaSnap] = await Promise.all([
      sanity.fetch(
        `*[_type == "newsArticle" && defined(slug.current) && defined(publishedAt)] | order(urgencyScore desc, publishedAt desc) [0...10] { title, slug, summary, category, urgencyScore, imageUrl }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "gunDeal"] | order(_createdAt desc) [0...4] { title, name, price, dealPrice, originalPrice, store, retailer, url, imageUrl }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "breakingAlert" && active == true] | order(_createdAt desc) [0...3] { text, title }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "newsletterSubscriber" && status == "active"] { email, _id }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "video" && active == true] | order(addedAt desc, publishedAt desc) [0...3] { title, youtubeId, videoId, channelName, thumbnail, thumbnailUrl, category, duration }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "ammoPrice"] | order(recordedAt desc) [0...6] { caliber, pricePerRound, trendDir, trendPct, inStock }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "nfaWaitTime"] | order(fetchedAt desc) [0] { forms, reportMonth }`
      ).catch(() => null),
    ])

    // Dedupe ammo by caliber, pick top 3 key calibers
    const KEY_CALIBERS = ['9mm', '5.56', '.308']
    const dedupedAmmo = []
    for (const cal of KEY_CALIBERS) {
      const match = ammo.find(a => a.caliber && a.caliber.toLowerCase().includes(cal.toLowerCase()))
      if (match) dedupedAmmo.push(match)
    }
    const ammoFinal = dedupedAmmo.length >= 2 ? dedupedAmmo : ammo.slice(0, 3)

    if (!process.env.RESEND_API_KEY) {
      await reportCronRun('newsletter', { status: 'success', ms: Date.now() - t0, details: 'RESEND_API_KEY not set — skipped send' })
      return Response.json({ message: 'RESEND_API_KEY not configured', stories: stories.length })
    }

    const resend = getResend()

    // Build subject from top story / alerts
    let subject
    if (alerts.length > 0) {
      subject = `⚡ ${(alerts[0].text || alerts[0].title || '').slice(0, 60)} — DownRange Alert`
    } else if (stories.length > 0) {
      subject = `${stories[0].title.slice(0, 68)} — DownRange Brief`
    } else {
      subject = `DownRange Weekly Brief — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    }

    // Test send first
    const testEmails = (process.env.NEWSLETTER_TEST_EMAILS || '').split(',').filter(Boolean)
    for (const email of testEmails) {
      const html = generateNewsletterHTML(
        { news: stories, deals, alerts, videos, ammo: ammoFinal, nfa: nfaSnap, unsubUrl: 'https://www.downrangeco.com/unsubscribe' },
        true
      )
      await resend.emails.send({
        from: 'DownRange <news@downrangeco.com>',
        to: email,
        subject: `[TEST] ${subject}`,
        html,
      }).catch(err => console.error('Test send error:', err.message))
    }

    // Send to subscribers in batches of 40
    let sent = 0, failed = 0
    const allEmails = subscribers.map(s => s.email).filter(Boolean)

    if (allEmails.length > 0) {
      for (let i = 0; i < allEmails.length; i += 40) {
        const batch = allEmails.slice(i, i + 40)
        const html  = generateNewsletterHTML(
          { news: stories, deals, alerts, videos, ammo: ammoFinal, nfa: nfaSnap, unsubUrl: 'https://www.downrangeco.com/unsubscribe' },
          false
        )
        const batchPayload = batch.map(email => ({
          from: 'DownRange <news@downrangeco.com>',
          to: email,
          subject,
          html,
        }))
        try {
          await resend.batch.send(batchPayload)
          sent += batch.length
        } catch (err) {
          console.error(`Batch ${i}-${i+40} error:`, err.message)
          failed += batch.length
        }
        if (i + 40 < allEmails.length) await new Promise(r => setTimeout(r, 300))
      }
    }

    await reportCronRun('newsletter', {
      status: 'success', ms: Date.now() - t0,
      details: `sent=${sent} failed=${failed} stories=${stories.length} deals=${deals.length} videos=${videos.length}`,
    })

    return Response.json({ success: true, sent, failed, stories: stories.length, deals: deals.length, videos: videos.length, subscribers: allEmails.length })

  } catch (err) {
    console.error('Newsletter cron error:', err)
    await reportCronRun('newsletter', { status: 'failed', ms: Date.now() - t0, error: err.message })
    return Response.json({ error: err.message }, { status: 500 })
  }
}
