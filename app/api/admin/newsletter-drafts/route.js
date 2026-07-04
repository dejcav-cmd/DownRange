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

// Build a fallback newsletter template from raw articles (no AI needed)
function buildFallbackNewsletter(articles) {
  const top = articles[0]
  const subject = top ? top.title.slice(0, 65) + ' — DownRange' : 'DownRange Weekly Brief'
  const CAT = { breaking:'#EF4444', law:'#60A5FA', industry:'#C8922A', news:'#9CA3AF', training:'#34D399', review:'#C8922A' }

  const storiesHtml = articles.slice(0, 5).map(a => `
    <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #1F2428;">
      <div style="font-size:10px;color:${CAT[a.category]||'#9CA3AF'};letter-spacing:0.12em;font-weight:700;margin-bottom:4px;">${(a.category||'news').toUpperCase()}</div>
      <h3 style="margin:0 0 6px;font-size:16px;color:#F0EDE6;line-height:1.35;">
        <a href="https://www.downrangeco.com/news/${a.slug?.current}" style="color:#F0EDE6;text-decoration:none;">${a.title}</a>
      </h3>
      ${a.summary ? `<p style="margin:0 0 8px;font-size:13px;color:#94A3B8;line-height:1.6;">${a.summary}</p>` : ''}
      <a href="https://www.downrangeco.com/news/${a.slug?.current}" style="font-size:11px;color:#C8922A;text-decoration:none;">READ MORE →</a>
    </div>`).join('')

  const bodyHtml = `
    <p style="font-size:15px;color:#CBD5E1;line-height:1.8;margin-bottom:24px;">
      Another week of 2A news — here are the stories that matter most for gun owners right now.
    </p>
    <h2 style="font-family:Arial,sans-serif;font-size:20px;color:#C8922A;border-bottom:2px solid #1F2428;padding-bottom:8px;margin-bottom:16px;">This Week's Top Stories</h2>
    ${storiesHtml}
    <p style="font-size:13px;color:#6B7280;margin-top:24px;">— DJ Cavalcanti, DownRange</p>`

  return {
    subject,
    bodyHtml,
    preview: top ? top.summary?.slice(0, 90) || top.title.slice(0, 90) : 'This week in firearms and 2A news.',
  }
}

async function generateWithAI(articles) {
  const topArticles = articles.slice(0, 8).map((a, i) =>
    (i+1) + '. ' + a.title + (a.summary ? ' — ' + a.summary.slice(0, 120) : '')
  ).join('\n')

  const prompt = `Write a weekly firearms and Second Amendment newsletter email for DownRange.
DownRange is run by DJ Cavalcanti, a gun owner and 2A advocate in Washington State.

TONE: Write like a person, not a newsletter bot. Direct, informed, opinionated.
BANNED words: comprehensive, dive into, game-changer, leverage, synergy, seamlessly, unprecedented.
NO corporate-speak. Sound like a gun owner writing to other gun owners.

This week's top stories:
${topArticles}

Write the newsletter body as HTML with these sections:
- Opening paragraph (2-3 sentences, hard news first)
- <h2>This Week's Top Stories</h2> (bullet each story, 1-2 sentence summary, be specific)
- <h2>Quick Hits</h2> (3-4 one-liners on industry news)
- <h2>Bottom Line</h2> (2-3 sentences editorial take, what should gun owners do?)
- Signature: "— DJ Cavalcanti, DownRange"

Return ONLY a JSON object, no markdown:
{"subject":"punchy subject line under 60 chars","bodyHtml":"<p>...</p>","preview":"first 90 chars of body for email preview"}`

  try {
    const raw = await callAIText({ prompt, maxTokens: 3000, useCase: 'generation' })
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim()
    // Extract JSON even if there's surrounding text
    const match = clean.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON object found in AI response')
    return JSON.parse(match[0])
  } catch (err) {
    console.warn('[NEWSLETTER] AI generation failed:', err.message, '— using fallback template')
    return buildFallbackNewsletter(articles)
  }
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

    const ai = await generateWithAI(articles)

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

    // Real send — fetch active subscribers from MailerLite group
    const { mlGetGroupSubscribers } = require('@/lib/mailerLite')
    const mlSubscribers = await mlGetGroupSubscribers()
    const emails = mlSubscribers.map(s => s.email).filter(Boolean)
    if (emails.length === 0) return Response.json({ error: 'No active subscribers found in MailerLite group' }, { status: 400 })

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

  if (action === 'send-test') {
    const { to = 'dj@downrangeco.com' } = body
    if (!process.env.RESEND_API_KEY) return Response.json({ error: 'RESEND_API_KEY not set' }, { status: 400 })

    const { generateNewsletterHTML } = await import('@/lib/emailTemplates.js')
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const [stories, deals, alerts, videos, ammo, nfa] = await Promise.all([
      sanity.fetch(`*[_type=="newsArticle" && defined(slug.current) && defined(publishedAt)] | order(urgencyScore desc, publishedAt desc) [0...10] { title, slug, summary, category, urgencyScore, imageUrl }`).catch(() => []),
      sanity.fetch(`*[_type=="gunDeal"] | order(_createdAt desc) [0...4] { title, name, price, dealPrice, originalPrice, store, retailer, url, imageUrl }`).catch(() => []),
      sanity.fetch(`*[_type=="breakingAlert" && active==true] | order(_createdAt desc) [0...3] { text, title }`).catch(() => []),
      sanity.fetch(`*[_type=="video" && active==true] | order(addedAt desc) [0...3] { title, youtubeId, videoId, channelName, thumbnail, thumbnailUrl, category, duration }`).catch(() => []),
      sanity.fetch(`*[_type=="ammoPrice"] | order(recordedAt desc) [0...6] { caliber, pricePerRound, trendDir, trendPct, inStock }`).catch(() => []),
      sanity.fetch(`*[_type=="nfaWaitTime"] | order(fetchedAt desc) [0] { forms, reportMonth }`).catch(() => null),
    ])

    const html = generateNewsletterHTML({ news: stories, deals, alerts, videos, ammo, nfa,
      unsubUrl: 'https://www.downrangeco.com/unsubscribe' }, true)

    const subject = stories.length > 0
      ? `[TEST] ${stories[0].title.slice(0,68)} — DownRange`
      : '[TEST] DownRange Weekly Brief'

    const result = await resend.emails.send({
      from: 'DownRange <news@downrangeco.com>',
      to,
      subject,
      html,
    })

    if (result.error) return Response.json({ error: result.error }, { status: 500 })
    return Response.json({ ok: true, sent: to, id: result.data?.id })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
