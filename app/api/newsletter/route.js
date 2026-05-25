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
  // Lazy init — only called at runtime, not at build time
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

export async function POST(req) {
  try {
    const { email, name } = await req.json()
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }
    const resend = getResend()
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (audienceId && process.env.RESEND_API_KEY) {
      await resend.contacts.create({ email, firstName: name || '', audienceId }).catch(() => {})
    }
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'DownRange <news@downrangeco.com>',
        to: email,
        subject: 'Welcome to DownRange',
        html: `<div style="background:#0A0B0C;color:#F5F5F3;font-family:Arial;padding:40px;max-width:600px;margin:auto;">
          <h1 style="color:#C8922A;letter-spacing:4px;font-size:42px;">DOWNRANGE</h1>
          <p style="color:#94A3B8;">You're locked and loaded, ${name || 'operator'}. Daily briefings hit your inbox every morning.</p>
          <a href="https://downrangeco.com" style="color:#C8922A;">Visit DownRange &rarr;</a>
        </div>`
      }).catch(err => console.error('Email send error:', err.message))
    }
    return Response.json({ success: true })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const stories = await sanity.fetch(
      `*[_type == "newsArticle" && approved == true] | order(urgencyScore desc) [0...5] { title, slug, summary, category }`
    ).catch(() => [])

    if (!process.env.RESEND_API_KEY) {
      return Response.json({ message: 'RESEND_API_KEY not configured', stories: stories.length })
    }

    const resend = getResend()
    const testEmails = (process.env.NEWSLETTER_TEST_EMAILS || '').split(',').filter(Boolean)
    for (const email of testEmails) {
      await resend.emails.send({
        from: 'DownRange Daily <news@downrangeco.com>',
        to: email,
        subject: `DownRange Daily — ${new Date().toLocaleDateString()}`,
        html: `<div style="background:#0A0B0C;color:#F5F5F3;font-family:Arial;padding:40px;max-width:600px;margin:auto;">
          <h1 style="color:#C8922A;font-size:36px;letter-spacing:4px;">DOWNRANGE</h1>
          ${stories.map(s => `<div style="border-bottom:1px solid #1F2428;padding:16px 0;">
            <p style="color:#C8922A;font-size:11px;margin:0;">${s.category || 'NEWS'}</p>
            <h3 style="color:#F5F5F3;margin:8px 0;"><a href="https://downrangeco.com/news/${s.slug?.current}" style="color:#F5F5F3;">${s.title}</a></h3>
            <p style="color:#94A3B8;font-size:14px;margin:0;">${s.summary || ''}</p>
          </div>`).join('')}
        </div>`
      }).catch(err => console.error('Digest send error:', err.message))
    }
    return Response.json({ success: true, sent: testEmails.length })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
