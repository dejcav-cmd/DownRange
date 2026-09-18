import { reportCronRun } from '@/lib/cronReporter'
import { generateNewsletterHTML } from '@/lib/emailTemplates'
import { fetchStateProfiles, getWeeklyOutlook } from '@/lib/newsletterPersonalization'
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
        `*[_type == "newsletterSubscriber" && status == "active"] { email, _id, state }`
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

    // Build subject from top story / alerts (weekly framing)
    const weekOf = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    let subject
    if (alerts.length > 0) {
      subject = `⚡ ${(alerts[0].text || alerts[0].title || '').slice(0, 60)} — DownRange Alert`
    } else if (stories.length > 0) {
      subject = `${stories[0].title.slice(0, 60)} — DownRange Weekly Brief`
    } else {
      subject = `DownRange Weekly Brief — Week of ${weekOf}`
    }

    // One AI "What to Watch Next" teaser per send — shared across every subscriber/state
    const outlookContext = stories.slice(0, 5).map(s => s.title).concat(deals.slice(0, 3).map(d => d.title || d.name)).filter(Boolean).join(' | ')
    const outlook = await getWeeklyOutlook(outlookContext)

    // Group active subscribers by state so each group gets its own personalized lead block
    const distinctStates = [...new Set(subscribers.map(s => s.state).filter(Boolean))]
    const stateProfiles = await fetchStateProfiles(distinctStates)

    const groups = new Map() // stateAbbr|'NATIONAL' -> [emails]
    for (const s of subscribers) {
      if (!s.email) continue
      const key = (s.state && stateProfiles[s.state.toUpperCase()]) ? s.state.toUpperCase() : 'NATIONAL'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(s.email)
    }

    const baseContent = { news: stories, deals, alerts, videos, ammo: ammoFinal, nfa: nfaSnap, outlook, unsubUrl: 'https://www.downrangeco.com/unsubscribe' }

    // Test send first — uses the NATIONAL variant (or the first state group, if configured) so DJ sees the real personalization
    const testEmails = (process.env.NEWSLETTER_TEST_EMAILS || '').split(',').filter(Boolean)
    if (testEmails.length) {
      const previewState = distinctStates.length ? stateProfiles[distinctStates[0].toUpperCase()] : null
      const testHtml = generateNewsletterHTML({ ...baseContent, state: previewState }, true)
      for (const email of testEmails) {
        await resend.emails.send({
          from: 'DownRange <news@downrangeco.com>',
          to: email,
          subject: `[TEST] ${subject}`,
          html: testHtml,
        }).catch(err => console.error('Test send error:', err.message))
      }
    }

    // Send one personalized variant per state group, batched in chunks of 40
    let sent = 0, failed = 0
    for (const [key, emails] of groups.entries()) {
      const stateData = key === 'NATIONAL' ? null : stateProfiles[key]
      const html = generateNewsletterHTML({ ...baseContent, state: stateData }, false)
      for (let i = 0; i < emails.length; i += 40) {
        const batch = emails.slice(i, i + 40)
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
          console.error(`Batch ${key} ${i}-${i+40} error:`, err.message)
          failed += batch.length
        }
        if (i + 40 < emails.length) await new Promise(r => setTimeout(r, 300))
      }
    }

    await reportCronRun('newsletter', {
      status: 'success', ms: Date.now() - t0,
      details: `sent=${sent} failed=${failed} stories=${stories.length} deals=${deals.length} videos=${videos.length} segments=${groups.size}`,
    })

    return Response.json({ success: true, sent, failed, stories: stories.length, deals: deals.length, videos: videos.length, subscribers: subscribers.length, segments: groups.size })

  } catch (err) {
    console.error('Newsletter cron error:', err)
    await reportCronRun('newsletter', { status: 'failed', ms: Date.now() - t0, error: err.message })
    return Response.json({ error: err.message }, { status: 500 })
  }
}
