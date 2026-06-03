export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/outreach/send
 * Sends a campaign to a list of contacts.
 * - Personalizes templates with contact variables
 * - Rate-limits to 2 emails/second (Resend free tier = 100/day, paid = unlimited)
 * - Logs every send to Sanity outreachSendLog
 * - Updates campaign stats
 * - Marks contacts as lastContactedAt
 *
 * Body: {
 *   campaignId: string,
 *   contactIds?: string[],   // if omitted, sends to all matching campaign target filters
 *   previewOnly?: boolean,   // returns rendered email for a contact without sending
 *   previewContactId?: string,
 *   dryRun?: boolean,        // logs but does not actually send
 * }
 */

import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// ── Variable replacement ───────────────────────────────────────────────────────
function personalize(template, contact) {
  const vars = {
    '{{firstName}}':      contact.firstName || contact.name?.split(' ')[0] || 'there',
    '{{fullName}}':       contact.name || '',
    '{{businessName}}':   contact.name || '',
    '{{channelName}}':    contact.youtubeChannel || contact.name || '',
    '{{email}}':          contact.email || '',
    '{{city}}':           contact.city || '',
    '{{state}}':          contact.state || '',
    '{{cityState}}':      [contact.city, contact.state].filter(Boolean).join(', ') || '',
    '{{website}}':        contact.website || '',
    '{{youtubeUrl}}':     contact.youtubeUrl || '',
    '{{subscribers}}':    contact.subscribers ? Number(contact.subscribers).toLocaleString() : '',
    '{{instagram}}':      contact.instagram ? `@${contact.instagram}` : '',
    '{{twitter}}':        contact.twitter ? `@${contact.twitter}` : '',
    '{{fflLicense}}':     contact.fflLicense || '',
    '{{specialties}}':    (contact.specialties || []).join(', '),
    '{{portalUrl}}':      'https://www.downrangeco.com',
    '{{unsubscribeUrl}}': `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(contact.email || '')}`,
    '{{currentYear}}':    new Date().getFullYear().toString(),
    '{{currentMonth}}':   new Date().toLocaleString('default', { month: 'long' }),
  }
  let subject = template.subject
  let body    = template.body
  for (const [k, v] of Object.entries(vars)) {
    subject = subject.replaceAll(k, v)
    body    = body.replaceAll(k, v)
  }
  return { subject, body }
}

// ── Wrap body in branded HTML shell ──────────────────────────────────────────
function wrapEmail(body, contact, unsubUrl) {
  // If the template body is already a full HTML document, never double-wrap it.
  // Nested <html> docs cause Outlook and most email clients to strip all formatting.
  const trimmed = (body || '').trimStart()
  if (trimmed.startsWith('<!DOCTYPE') || trimmed.toLowerCase().startsWith('<html')) {
    return body
  }
  // Plain-text or partial-HTML body — wrap in branded shell
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
        DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;">downrangeco.com</a><br>
        <a href="${unsubUrl}" style="color:#6b7280;font-size:10px;">Unsubscribe</a>
      </div>
    </div>
  </div>
</body>
</html>`
}

// ── Fetch contacts for campaign ───────────────────────────────────────────────
async function getTargetContacts(campaign, contactIds) {
  if (contactIds?.length) {
    return sanity.fetch(
      `*[_type == "outreachContact" && _id in $ids && status == "active" && defined(email)] {
        _id, type, name, firstName, email, phone, city, state, website,
        youtubeUrl, youtubeChannel, subscribers, instagram, twitter,
        fflLicense, specialties, nraInstructorId
      }`,
      { ids: contactIds }
    )
  }

  let filter = `_type == "outreachContact" && status == "active" && defined(email) && email != ""`
  if (campaign.targetTypes?.length) {
    filter += ` && type in ["${campaign.targetTypes.join('","')}"]`
  }
  if (campaign.targetStates?.length) {
    filter += ` && state in ["${campaign.targetStates.join('","')}"]`
  }

  return sanity.fetch(`*[${filter}] {
    _id, type, name, firstName, email, city, state, website,
    youtubeUrl, youtubeChannel, subscribers, instagram, twitter,
    fflLicense, specialties, nraInstructorId
  }`)
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { campaignId, contactIds, previewOnly, previewContactId, dryRun } = await req.json()
  if (!campaignId) return Response.json({ error: 'campaignId required' }, { status: 400 })

  // Load campaign + template
  const campaign = await sanity.fetch(
    `*[_type == "outreachCampaign" && _id == $id][0] {
      _id, name, status, fromName, fromEmail, replyTo, targetTypes, targetStates, targetTags,
      template->{ _id, name, subject, body }
    }`,
    { id: campaignId }
  )
  if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 })
  if (!campaign.template) return Response.json({ error: 'Campaign has no template assigned' }, { status: 400 })

  // Preview mode
  if (previewOnly && previewContactId) {
    const contact = await sanity.fetch(`*[_type == "outreachContact" && _id == $id][0]`, { id: previewContactId })
    if (!contact) return Response.json({ error: 'Contact not found' }, { status: 404 })
    const { subject, body } = personalize(campaign.template, contact)
    const unsubUrl = `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(contact.email || '')}`
    return Response.json({ ok: true, subject, body, html: wrapEmail(body, contact, unsubUrl) })
  }

  // Get contacts
  const contacts = await getTargetContacts(campaign, contactIds)
  if (!contacts.length) return Response.json({ error: 'No eligible contacts found' }, { status: 400 })

  const results = { sent: 0, failed: 0, skipped: 0, errors: [] }

  // Mark campaign as active
  if (!dryRun) {
    await sanity.patch(campaignId).set({ status: 'active' }).commit()
  }

  for (const contact of contacts) {
    if (!contact.email) { results.skipped++; continue }

    const { subject, body } = personalize(campaign.template, contact)
    const unsubUrl = `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(contact.email)}`
    const html = wrapEmail(body, contact, unsubUrl)

    if (!dryRun) {
      try {
        const { data, error } = await getResend().emails.send({
          from:     `${campaign.fromName} <${campaign.fromEmail}>`,
          to:       [contact.email],
          replyTo:  campaign.replyTo || campaign.fromEmail,
          subject,
          html,
        })

        if (error) throw new Error(error.message)

        // Log to Sanity
        await sanity.create({
          _type: 'outreachSendLog',
          campaign: { _type: 'reference', _ref: campaignId },
          contact:  { _type: 'reference', _ref: contact._id },
          toEmail: contact.email,
          toName:  contact.name,
          subject,
          status: 'sent',
          resendId: data?.id || null,
          sentAt: new Date().toISOString(),
        })

        // Update contact last contacted
        await sanity.patch(contact._id).set({ lastContactedAt: new Date().toISOString() }).commit()

        results.sent++
      } catch (err) {
        results.failed++
        results.errors.push({ email: contact.email, error: err.message })
        await sanity.create({
          _type: 'outreachSendLog',
          campaign: { _type: 'reference', _ref: campaignId },
          contact:  { _type: 'reference', _ref: contact._id },
          toEmail: contact.email, toName: contact.name, subject,
          status: 'failed', error: err.message, sentAt: new Date().toISOString(),
        })
      }
    } else {
      results.sent++ // dry run counts
    }

    // Rate limit: 2/sec for Resend free tier
    await new Promise(r => setTimeout(r, 500))
  }

  // Update campaign stats + status
  if (!dryRun) {
    await sanity.patch(campaignId).set({
      status: 'completed',
      sentAt: new Date().toISOString(),
      'stats.sent': results.sent,
      'stats.failed': results.failed,
    }).commit()
  }

  return Response.json({
    ok: true, dryRun: !!dryRun,
    totalContacts: contacts.length,
    ...results,
  })
}
