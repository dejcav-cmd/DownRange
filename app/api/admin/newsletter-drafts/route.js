import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function weekOf() {
  const d = new Date()
  const mon = new Date(d)
  mon.setDate(d.getDate() - d.getDay() + 1)
  return mon.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
}

async function generateWithClaude(articles) {
  const topArticles = articles.slice(0, 8).map((a, i) =>
    (i+1) + '. ' + a.title + (a.summary ? ' — ' + a.summary.slice(0,120) : '')
  ).join('\n')

  const prompt = [
    'Write a weekly firearms and Second Amendment newsletter email for DownRange.',
    'DownRange is run by DJ Cavalcanti, a gun owner and 2A advocate in Washington State.',
    '',
    'TONE: Write like a person, not a newsletter bot. Direct, informed, opinionated.',
    'BANNED: comprehensive, dive into, game-changer, leverage, synergy, seamlessly, unprecedented.',
    'NO corporate-speak. Sound like a gun owner writing to other gun owners.',
    '',
    'This week\'s top stories from the site:',
    topArticles,
    '',
    'Write the newsletter in this format:',
    '',
    '== SUBJECT LINE ==',
    'One punchy, specific subject line. Under 60 chars. Provocative but accurate.',
    '',
    '== BODY (HTML format) ==',
    'Opening paragraph: 2-3 sentences. What happened this week that matters to gun owners. Hard news first.',
    '',
    '<h2>This Week\'s Top Stories</h2>',
    'Bullet each top story with 1-2 sentence summary. Be specific. Name the law, the agency, the ruling.',
    '',
    '<h2>From the DownRange Blog</h2>',
    'Tease 1-2 recent blog posts. Specific, actionable.',
    '',
    '<h2>Quick Hits</h2>',
    '3-4 one-liners on industry news, deals, or events worth knowing.',
    '',
    '<h2>Bottom Line This Week</h2>',
    '2-3 sentences. Editorial take. What should gun owners do with this information? Be direct.',
    '',
    'Signature: "— DJ Cavalcanti, DownRange"',
    '',
    'Return JSON: { "subject": "...", "bodyHtml": "...", "preview": "First 90 chars for email preview text" }',
    'CRITICAL: Return only valid JSON. No markdown fences.',
  ].join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const d = await res.json()
  const raw = d.content?.[0]?.text || '{}'
  const clean = raw.split('```json').join('').split('```').join('').trim()
  return JSON.parse(clean)
}

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const drafts = await sanity.fetch(
    '*[_type=="newsletterDraft"] | order(_createdAt desc) [0...20] { _id, subject, status, weekOf, bodyText, bodyHtml, preview, _createdAt, sentAt, sentCount }'
  ).catch(() => [])

  return Response.json({ ok: true, drafts })
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { action } = body

  if (action === 'generate') {
    if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 400 })

    // Pull this week's top articles
    const articles = await sanity.fetch(
      '*[_type=="newsArticle" && approved==true] | order(publishedAt desc) [0...10] { title, summary, slug, category }'
    ).catch(() => [])

    const ai = await generateWithClaude(articles)

    const draft = await sanity.create({
      _type:    'newsletterDraft',
      subject:  ai.subject || 'DownRange Weekly — ' + weekOf(),
      bodyHtml: ai.bodyHtml || '',
      bodyText: ai.bodyHtml?.replace(/<[^>]+>/g, '') || '',
      preview:  ai.preview || '',
      weekOf:   weekOf(),
      status:   'draft',
    })

    return Response.json({ ok: true, draft })
  }

  if (action === 'update') {
    const { id, subject, bodyText, bodyHtml, status } = body
    const patch = {}
    if (subject !== undefined) patch.subject = subject
    if (bodyText !== undefined) { patch.bodyText = bodyText; patch.bodyHtml = '<p>' + bodyText.replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>') + '</p>' }
    if (bodyHtml !== undefined) patch.bodyHtml = bodyHtml
    if (status   !== undefined) patch.status   = status
    await sanity.patch(id).set(patch).commit()
    return Response.json({ ok: true })
  }

  if (action === 'delete') {
    await sanity.delete(body.id)
    return Response.json({ ok: true })
  }

  if (action === 'test' || action === 'send') {
    const draft = await sanity.fetch('*[_type=="newsletterDraft" && _id==$id][0]', { id: body.id })
    if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 })
    if (!process.env.RESEND_API_KEY) return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 400 })

    const { Resend } = await import('resend')
    const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")

    const html = `
      <div style="max-width:600px;margin:0 auto;background:#09090B;color:#F0EDE6;font-family:Georgia,serif">
        <div style="background:#0A0B0C;border-bottom:3px solid #C8922A;padding:24px 32px;text-align:center">
          <div style="font-family:Arial,sans-serif;font-size:32px;font-weight:900;color:#C8922A;letter-spacing:6px">DOWNRANGE</div>
          <div style="font-family:'Courier New',monospace;font-size:10px;color:#374151;letter-spacing:3px;margin-top:4px">WEEKLY BRIEFING · ${draft.weekOf || ''}</div>
        </div>
        <div style="padding:32px;font-size:15px;line-height:1.8;color:#E5E5E0">
          ${draft.bodyHtml || ''}
        </div>
        <div style="padding:24px 32px;border-top:1px solid #1F2428;font-family:'Courier New',monospace;font-size:10px;color:#374151;text-align:center">
          <a href="https://downrangeco.com" style="color:#C8922A;text-decoration:none">downrangeco.com</a> ·
          <a href="https://downrangeco.com/unsubscribe" style="color:#374151;text-decoration:none">Unsubscribe</a>
        </div>
      </div>`

    if (action === 'test') {
      await getResend().emails.send({
        from: 'DJ Cavalcanti — DownRange <dj@downrangeco.com>',
        to: [body.testEmail || 'dj@downrangeco.com'],
        subject: '[TEST] ' + draft.subject,
        html,
      })
      return Response.json({ ok: true })
    }

    // Real send — to audience
    const audienceId = process.env.RESEND_AUDIENCE_ID
    if (!audienceId) return Response.json({ error: 'RESEND_AUDIENCE_ID not configured' }, { status: 400 })

    const contacts = await resend.contacts.list({ audienceId })
    const emails = (contacts.data?.data || []).filter(c => !c.unsubscribed).map(c => c.email)
    if (emails.length === 0) return Response.json({ error: 'No subscribers found in audience' }, { status: 400 })

    // Send in batches of 50
    let sent = 0
    for (let i = 0; i < emails.length; i += 50) {
      const batch = emails.slice(i, i+50)
      await getResend().emails.send({
        from: 'DJ Cavalcanti — DownRange <dj@downrangeco.com>',
        to: batch,
        subject: draft.subject,
        html,
      })
      sent += batch.length
    }

    await sanity.patch(body.id).set({ status: 'sent', sentAt: new Date().toISOString(), sentCount: sent }).commit()
    return Response.json({ ok: true, sent })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
