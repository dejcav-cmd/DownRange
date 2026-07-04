import { reportCronRun } from '@/lib/cronReporter'
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

// ── Build email HTML ────────────────────────────────────────────────────────
function buildDigestHTML({ stories, deals, alerts, unsubToken }) {
  const date = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  const CAT_COLOR = { breaking:'#EF4444', law:'#60A5FA', industry:'#C8922A', news:'#9CA3AF', opinion:'#C084FC', training:'#34D399', review:'#C8922A' }

  const alertsHtml = alerts.length > 0 ? `
    <div style="background:#2a0000;border:1px solid #EF4444;border-left:4px solid #EF4444;padding:14px 18px;margin-bottom:24px;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#EF4444;letter-spacing:0.15em;font-weight:700;margin-bottom:8px;">⚡ BREAKING ALERTS</div>
      ${alerts.map(a => `<div style="font-family:Arial,sans-serif;font-size:13px;color:#F5F5F3;margin-bottom:4px;">• ${a.text || a.title || ''}</div>`).join('')}
    </div>
  ` : ''

  const storiesHtml = stories.map((s, i) => `
    <div style="border-bottom:1px solid #1F2428;padding:18px 0;${i === 0 ? 'padding-top:0;' : ''}">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:${CAT_COLOR[s.category] || '#9CA3AF'};letter-spacing:0.12em;font-weight:700;margin-bottom:6px;">${(s.category || 'NEWS').toUpperCase()}</div>
      <h3 style="font-family:Arial,sans-serif;font-size:${i === 0 ? '20px' : '16px'};color:#F5F5F3;margin:0 0 8px;line-height:1.35;font-weight:700;">
        <a href="https://www.downrangeco.com/news/${s.slug?.current}" style="color:#F5F5F3;text-decoration:none;">${s.title}</a>
      </h3>
      ${s.summary ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#94A3B8;margin:0 0 10px;line-height:1.6;">${s.summary}</p>` : ''}
      <a href="https://www.downrangeco.com/news/${s.slug?.current}" style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#C8922A;text-decoration:none;letter-spacing:0.06em;">READ MORE →</a>
    </div>
  `).join('')

  const dealsHtml = deals.length > 0 ? `
    <div style="background:#111318;border:1px solid #1F2428;padding:20px;margin:24px 0;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#C8922A;letter-spacing:0.15em;font-weight:700;margin-bottom:16px;border-bottom:1px solid #1F2428;padding-bottom:10px;">🔥 TOP GUN DEALS THIS WEEK</div>
      ${deals.map(d => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #1F2428;">
          <div>
            <div style="font-family:Arial,sans-serif;font-size:13px;color:#F5F5F3;font-weight:600;margin-bottom:2px;">${d.title || d.name || ''}</div>
            ${d.store ? `<div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#4B5563;">${d.store}</div>` : ''}
          </div>
          ${d.price ? `<div style="font-family:'Bebas Neue',Arial,sans-serif;font-size:18px;color:#34D399;white-space:nowrap;margin-left:12px;">$${d.price}</div>` : ''}
        </div>
      `).join('')}
      <a href="https://www.downrangeco.com/deals" style="display:inline-block;margin-top:14px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#C8922A;text-decoration:none;letter-spacing:0.06em;">ALL DEALS →</a>
    </div>
  ` : ''

  const unsubUrl = unsubToken
    ? `https://www.downrangeco.com/unsubscribe?token=${unsubToken}`
    : `https://www.downrangeco.com/unsubscribe`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>DownRange Weekly Brief</title>
</head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;">
<div style="max-width:620px;margin:0 auto;background:#09090B;">

  <!-- Header -->
  <div style="background:#0D1117;border-bottom:2px solid #C8922A;padding:24px 28px;text-align:center;">
    <div style="font-family:'Bebas Neue',Impact,Arial,sans-serif;font-size:42px;color:#C8922A;letter-spacing:6px;line-height:1;">DOWNRANGE</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#4B5563;letter-spacing:0.12em;margin-top:4px;">AMERICA'S FIREARMS INTELLIGENCE HUB</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#374151;margin-top:8px;">${date}</div>
  </div>

  <!-- Body -->
  <div style="padding:28px;">
    ${alertsHtml}

    <!-- Top Stories -->
    <div style="margin-bottom:8px;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#C8922A;letter-spacing:0.15em;font-weight:700;margin-bottom:16px;border-bottom:1px solid #1F2428;padding-bottom:10px;">TOP STORIES</div>
      ${storiesHtml}
    </div>

    ${dealsHtml}

    <!-- CTA -->
    <div style="background:#111318;border:1px solid #1F2428;padding:20px;text-align:center;margin:24px 0;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#4B5563;margin-bottom:12px;">TOOLS WORTH BOOKMARKING</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        ${[
          ['Ballistics Calc', '/ballistics'],
          ['Range Finder', '/ranges'],
          ['Gun Value Est.', '/value-estimator'],
          ['NFA Wait Times', '/nfa-tracker'],
          ['State Gun Laws', '/laws'],
        ].map(([label, path]) => `<a href="https://www.downrangeco.com${path}" style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#C8922A;background:#09090B;border:1px solid #2A2F38;padding:6px 12px;text-decoration:none;letter-spacing:0.06em;display:inline-block;margin:2px;">${label}</a>`).join('')}
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#0D1117;border-top:1px solid #1F2428;padding:18px 28px;text-align:center;">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#374151;margin-bottom:8px;">DownRange · downrangeco.com · DJ Cavalcanti, Founder</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#374151;">
      <a href="${unsubUrl}" style="color:#4B5563;text-decoration:underline;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="https://www.downrangeco.com/privacy" style="color:#4B5563;text-decoration:underline;">Privacy Policy</a>
    </div>
  </div>

</div>
</body>
</html>`
}

// ── Build subject line from top story ──────────────────────────────────────
function buildSubject(stories, alerts) {
  if (alerts.length > 0) {
    const alert = alerts[0]
    const txt = (alert.text || alert.title || '').slice(0, 60)
    return `🚨 ${txt} — DownRange Alert`
  }
  if (stories.length > 0) {
    const top = stories[0]
    const title = (top.title || '').slice(0, 70)
    return `${title} — DownRange Brief`
  }
  return `DownRange Weekly Brief — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
}

// ── Weekly digest cron (GET) ────────────────────────────────────────────────
export async function GET(req) {
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  const isAuth   = req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  if (!isVercel && !isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()

  try {
    // Fetch content in parallel
    const [stories, deals, alerts, subscribers] = await Promise.all([
      sanity.fetch(
        `*[_type == "newsArticle" && defined(slug.current) && defined(publishedAt)] | order(urgencyScore desc, publishedAt desc) [0...5] { title, slug, summary, category, urgencyScore }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "gunDeal"] | order(_createdAt desc) [0...3] { title, name, price, store, url }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "breakingAlert" && active == true] | order(_createdAt desc) [0...2] { text, title }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "newsletterSubscriber" && status == "active"] { email, _id }`
      ).catch(() => []),
    ])

    if (!process.env.RESEND_API_KEY) {
      await reportCronRun('newsletter', { status: 'success', ms: Date.now() - t0, details: 'RESEND_API_KEY not set — skipped send' })
      return Response.json({ message: 'RESEND_API_KEY not configured', stories: stories.length })
    }

    const resend  = getResend()
    const subject = buildSubject(stories, alerts)

    // Always send to test list first
    const testEmails = (process.env.NEWSLETTER_TEST_EMAILS || '').split(',').filter(Boolean)
    for (const email of testEmails) {
      const html = buildDigestHTML({ stories, deals, alerts, unsubToken: null })
      await resend.emails.send({
        from: 'DownRange <news@downrangeco.com>',
        to: email,
        subject: `[TEST] ${subject}`,
        html,
      }).catch(err => console.error('Test send error:', err.message))
    }

    // Send to actual subscribers in batches of 40
    let sent = 0
    let failed = 0
    const allEmails = subscribers.map(s => s.email).filter(Boolean)

    if (allEmails.length > 0) {
      for (let i = 0; i < allEmails.length; i += 40) {
        const batch = allEmails.slice(i, i + 40)
        const batchPayload = batch.map(email => ({
          from: 'DownRange <news@downrangeco.com>',
          to: email,
          subject,
          html: buildDigestHTML({ stories, deals, alerts, unsubToken: null }),
        }))
        try {
          await resend.batch.send(batchPayload)
          sent += batch.length
        } catch (err) {
          console.error(`Batch send error (${i}–${i + 40}):`, err.message)
          failed += batch.length
        }
        // Small delay between batches to avoid rate limiting
        if (i + 40 < allEmails.length) await new Promise(r => setTimeout(r, 300))
      }
    }

    await reportCronRun('newsletter', {
      status: 'success',
      ms: Date.now() - t0,
      details: `sent=${sent} failed=${failed} stories=${stories.length} deals=${deals.length}`,
    })

    return Response.json({ success: true, sent, failed, stories: stories.length, deals: deals.length, subscribers: allEmails.length })

  } catch (err) {
    console.error('Newsletter cron error:', err)
    await reportCronRun('newsletter', { status: 'failed', ms: Date.now() - t0, error: err.message })
    return Response.json({ error: err.message }, { status: 500 })
  }
}
