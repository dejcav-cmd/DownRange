export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

function personalize(template, contact) {
  const vars = {
    '{{firstName}}':      contact.firstName || contact.name?.split(' ')[0] || 'there',
    '{{fullName}}':       contact.name || '',
    '{{businessName}}':   contact.name || '',
    '{{channelName}}':    contact.name || '',
    '{{email}}':          contact.email || '',
    '{{city}}':           contact.city || '',
    '{{state}}':          contact.state || '',
    '{{cityState}}':      [contact.city, contact.state].filter(Boolean).join(', ') || '',
    '{{website}}':        contact.website || '',
    '{{youtubeUrl}}':     contact.youtubeUrl || '',
    '{{subscribers}}':    contact.subscribers ? Number(contact.subscribers).toLocaleString() : '',
    '{{portalUrl}}':      'https://www.downrangeco.com',
    '{{unsubscribeUrl}}': `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(contact.email || '')}`,
    '{{currentYear}}':    new Date().getFullYear().toString(),
    '{{pressUrl}}':       'https://www.downrangeco.com/press',
  }
  let subject = template.subject || ''
  let body    = template.body    || ''
  for (const [k, v] of Object.entries(vars)) {
    subject = subject.replaceAll(k, v)
    body    = body.replaceAll(k, v)
  }
  return { subject, body }
}

function wrapEmail(body, contact) {
  const unsubUrl = `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(contact.email || '')}`
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0A0B0C;border:1px solid #1f2428;">
    <div style="background:#0A0B0C;border-bottom:3px solid #C8922A;padding:20px 32px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:28px;font-weight:900;color:#C8922A;letter-spacing:0.1em;">DOWNRANGE</div>
      <div style="font-size:10px;color:#6b7280;letter-spacing:0.2em;margin-top:2px;">INTELLIGENCE HUB</div>
    </div>
    <div style="padding:32px;color:#e5e7eb;font-size:15px;line-height:1.7;">${body}</div>
    <div style="padding:20px 32px;border-top:1px solid #1f2428;text-align:center;">
      <div style="font-size:11px;color:#4b5563;line-height:1.8;">
        DownRange Intelligence Hub · <a href="https://www.downrangeco.com" style="color:#C8922A;">downrangeco.com</a><br>
        <a href="${unsubUrl}" style="color:#6b7280;font-size:10px;">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>`
}

// POST /api/outreach/send/direct
// Body: { contactId, subject, html, toEmail, toName } — pre-built from composer
//   OR: { templateId, contactId } — legacy template-based
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await req.json()
  const { contactId } = payload

  if (!contactId) return Response.json({ error: 'contactId required' }, { status: 400 })

  // Fetch contact for logging (email/name fallback)
  const contact = await sanity.fetch(`*[_type=="outreachContact" && _id==$id][0]`, { id: contactId })
    .catch(() => null)

  // Resolve email + name — prefer payload fields, fall back to contact doc
  const toEmail = payload.toEmail || contact?.email
  const toName  = payload.toName  || contact?.name  || ''

  if (!toEmail) return Response.json({ error: 'No email address — contact has no email' }, { status: 400 })

  // Resolve html + subject — prefer payload, fall back to template render
  let subject = payload.subject || ''
  let html    = payload.html    || ''

  if ((!subject || !html) && payload.templateId) {
    const template = await sanity.fetch(`*[_type=="outreachTemplate" && _id==$id][0]`, { id: payload.templateId })
    if (template && contact) {
      const p = personalize(template, contact)
      subject = subject || p.subject
      html    = html    || wrapEmail(p.body, contact)
    }
  }

  if (!subject) return Response.json({ error: 'No subject — pass subject or templateId' }, { status: 400 })
  if (!html)    html = '<p>No body provided.</p>'

  try {
    const unsubUrl = `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(contact.email || '')}`
    const unsubUrl = `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(toEmail)}`
    const { data, error } = await getResend().emails.send({
      from:    'DJ Cavalcanti <dj@downrangeco.com>',
      to:      [toEmail],
      replyTo: 'dj@downrangeco.com',
      subject,
      html,
      headers: {
        'List-Unsubscribe':      `<${unsubUrl}>, <mailto:dj@downrangeco.com?subject=unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence':            'bulk',
      },
    })

    if (error) {
      console.error('[OUTREACH DIRECT] Resend error for', toEmail, ':', JSON.stringify(error))
      throw new Error(error.message || JSON.stringify(error))
    }

    // Log to Sanity
    await sanity.create({
      _type:    'outreachSendLog',
      contact:  { _type: 'reference', _ref: contactId },
      toEmail,
      toName,
      subject,
      bodyHtml: html,
      status:   'sent',
      resendId: data?.id || null,
      sentAt:   new Date().toISOString(),
    })

    await sanity.patch(contactId).set({ lastContactedAt: new Date().toISOString() }).commit()

    return Response.json({ ok: true, resendId: data?.id, toEmail })

  } catch (err) {
    console.error('[OUTREACH DIRECT] Exception for', toEmail, ':', err.message)
    await sanity.create({
      _type:   'outreachSendLog',
      contact: { _type: 'reference', _ref: contactId },
      toEmail, toName, subject, bodyHtml: html,
      status:  'failed',
      error:   err.message,
      sentAt:  new Date().toISOString(),
    }).catch(() => {})

    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
