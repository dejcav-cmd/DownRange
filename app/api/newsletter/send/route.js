// app/api/newsletter/send/route.js
// Send curated daily newsletter to all active subscribers

import { client } from '@/sanity/lib/client'
import { generateNewsletterHTML } from '@/lib/emailTemplates'
import { reportCronRun } from '@/lib/cronReporter'

export const dynamic = 'force-dynamic'

function getResend() {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

export async function POST(req) {
  const t0 = Date.now()
  try {
    const adminKey = req.headers.get('x-admin-key')
    const auth = req.headers.get('authorization')
    
    // Accept both admin key and cron secret for flexibility
    const isAuthorized = (adminKey && adminKey === process.env.ADMIN_KEY) ||
                         (auth && auth === `Bearer ${process.env.CRON_SECRET}`)
    
    if (!isAuthorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch newsletter content
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://downrangeco.com'
    const contentRes = await fetch(`${baseUrl}/api/newsletter/content`)
    if (!contentRes.ok) throw new Error('Failed to fetch newsletter content')
    const content = await contentRes.json()

    // Get all active subscribers
    const subscribers = await client.fetch(
      `*[_type == "newsletterSubscriber" && status == "active"] { email }`
    )

    if (subscribers.length === 0) {
      await reportCronRun('newsletter-send', { status: 'warning', ms: Date.now() - t0, details: 'No active subscribers', error: 'Zero subscribers' })
      return Response.json({ message: 'No active subscribers', sent: 0 })
    }

    // Generate HTML
    const html = generateNewsletterHTML(content)

    // Send via Resend
    const resend = getResend()
    const batchSize = 50
    let sent = 0

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize)
      const promises = batch.map(sub =>
        resend.emails.send({
          from: 'DownRange Daily <news@downrangeco.com>',
          to: sub.email,
          subject: `📰 DownRange Daily — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          html,
        }).catch(err => {
          console.error(`Failed to send to ${sub.email}:`, err.message)
          return null
        })
      )

      const results = await Promise.all(promises)
      sent += results.filter(r => r).length
    }

    await reportCronRun('newsletter-send', {
      status: sent > 0 ? 'success' : 'warning',
      ms: Date.now() - t0,
      details: `Sent to ${sent}/${subscribers.length} subscribers`,
      error: sent === 0 ? 'Zero emails delivered' : null,
    })

    return Response.json({
      success: true,
      message: `Newsletter sent to ${sent}/${subscribers.length} subscribers`,
      sent,
      total: subscribers.length,
    })
  } catch (error) {
    console.error('[newsletter/send] Error:', error)
    await reportCronRun('newsletter-send', { status: 'failed', ms: Date.now() - t0, error: error.message })
    return Response.json({ error: error.message }, { status: 500 })
  }
}
