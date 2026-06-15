// app/api/newsletter/send-test/route.js
// Send test newsletter to a specific email address

import { generateNewsletterHTML } from '@/lib/emailTemplates'

export const dynamic = 'force-dynamic'

function getResend() {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

export async function POST(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await req.json()
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Fetch newsletter content
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://downrangeco.com'
    const contentRes = await fetch(`${baseUrl}/api/newsletter/content`)
    if (!contentRes.ok) throw new Error('Failed to fetch newsletter content')
    const content = await contentRes.json()

    // Generate HTML (with test badge)
    const html = generateNewsletterHTML(content, true)

    // Send via Resend
    const resend = getResend()
    const result = await resend.emails.send({
      from: 'DownRange Daily <news@downrangeco.com>',
      to: email,
      subject: `📰 DownRange Daily TEST — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      html,
    })

    return Response.json({
      success: true,
      message: `Test newsletter sent to ${email}`,
      id: result.data?.id,
    })
  } catch (error) {
    console.error('[newsletter/send-test] Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
