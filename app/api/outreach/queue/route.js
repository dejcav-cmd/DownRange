export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/outreach/queue
 * Actions:
 *   generate  — auto-draft emails for all contacts missing outreach (or by filter)
 *   approve   — mark draft(s) approved and send immediately
 *   skip      — mark draft(s) as skipped (no email)
 *   snooze    — push draft to a future date
 *   edit      — update subject/body of a draft
 *   digest    — email DJ a summary of pending drafts
 *
 * GET /api/outreach/queue?status=draft&limit=50
 *   Returns queue entries with full contact + template + rendered HTML
 */

import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const resend = new Resend(process.env.RESEND_API_KEY)

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// ── Template auto-match by contact type ───────────────────────────────────────
const TYPE_TO_TEMPLATE = {
  youtuber:     ['YouTuber — Introduction & Embed Permission (Primary)', 'YouTuber — Deeper Collaboration Ask'],
  instructor:   ['NRA Instructor — Introduction'],
  gun_shop:     ['Gun Shop & FFL — Introduction'],
  ffl_dealer:   ['Dealer & Retailer — Introduction'],
  organization: ['Manufacturer — Partnership & Press Coverage', 'Holster Company — Introduction & Coverage', 'Range / Organization / Advocate — Introduction'],
  range:        ['Range / Organization / Advocate — Introduction'],
  press:        ['Range / Organization / Advocate — Introduction'],
  influencer:   ['YouTuber — Introduction & Embed Permission (Primary)'],
  other:        ['All — Follow-Up (14 Days)'],
}

// ── Personalize ───────────────────────────────────────────────────────────────
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
    '{{instagram}}':      contact.instagram ? `@${contact.instagram}` : '',
    '{{twitter}}':        contact.twitter ? `@${contact.twitter}` : '',
    '{{fflLicense}}':     contact.fflLicense || '',
    '{{specialties}}':    (contact.specialties || []).join(', '),
    '{{portalUrl}}':      'https://www.downrangeco.com',
    '{{pressUrl}}':       'https://www.downrangeco.com/press',
    '{{unsubscribeUrl}}': `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(contact.email || '')}`,
    '{{currentYear}}':    new Date().getFullYear().toString(),
    '{{currentMonth}}':   new Date().toLocaleString('default', { month: 'long' }),
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

// ── GET — fetch queue ────────────────────────────────────────────────────────
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const p      = new URL(req.url).searchParams
  const status = p.get('status') || 'draft'
  const limit  = Math.min(200, parseInt(p.get('limit') || '50'))
  const type   = p.get('type')

  let filter = `_type == "outreachSendLog" && status == "${status}"`
  if (status === 'draft') filter += ` && (!defined(snoozeUntil) || snoozeUntil < now())`

  const entries = await sanity.fetch(
    `*[${filter}] | order(draftedAt desc) [0...${limit}] {
      _id, status, toEmail, toName, subject, bodyHtml, approvalNote, draftedAt, approvedAt, sentAt, snoozeUntil,
      contact->{ _id, name, firstName, type, email, city, state, youtubeUrl, subscribers, website, notes, tags, lastContactedAt },
      template->{ _id, name, type, subject, body },
      campaign->{ _id, name }
    }`
  )

  // Count by status for stats
  const stats = await sanity.fetch(`{
    "draft":    count(*[_type == "outreachSendLog" && status == "draft"]),
    "approved": count(*[_type == "outreachSendLog" && status == "approved"]),
    "sent":     count(*[_type == "outreachSendLog" && status == "sent"]),
    "skipped":  count(*[_type == "outreachSendLog" && status == "skipped"]),
    "snoozed":  count(*[_type == "outreachSendLog" && status == "snoozed"]),
    "replied":  count(*[_type == "outreachSendLog" && status == "replied"]),
  }`)

  return Response.json({ ok: true, entries, stats, count: entries.length })
}

// ── POST — actions ────────────────────────────────────────────────────────────
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await req.json()
  const action = body.action

  // ── GENERATE — auto-draft for contacts ───────────────────────────────────────
  if (action === 'generate') {
    const { contactIds, templateId, filterType, filterState, limit = 50, skipContacted = true } = body

    // Load templates for auto-matching
    const templates = await sanity.fetch(`*[_type == "outreachTemplate" && isActive == true] { _id, name, type, subject, body }`)
    const templateMap = {}
    for (const t of templates) templateMap[t._id] = t

    // Build contact query
    let contactFilter = `_type == "outreachContact" && status == "active" && defined(email) && email != ""`
    if (contactIds?.length) contactFilter += ` && _id in ["${contactIds.join('","')}"]`
    if (filterType)  contactFilter += ` && type == "${filterType}"`
    if (filterState) contactFilter += ` && state == "${filterState}"`
    if (skipContacted) contactFilter += ` && !defined(lastContactedAt)`

    const contacts = await sanity.fetch(
      `*[${contactFilter}] | order(addedAt desc) [0...${limit}] {
        _id, name, firstName, type, email, city, state, youtubeUrl, subscribers,
        website, fflLicense, instagram, twitter, specialties, notes, lastContactedAt
      }`
    )

    let created = 0, skipped = 0
    const drafts = []

    for (const contact of contacts) {
      // Check if already has a pending draft
      const existingDraft = await sanity.fetch(
        `*[_type == "outreachSendLog" && contact._ref == $id && status in ["draft","approved"]][0]._id`,
        { id: contact._id }
      )
      if (existingDraft) { skipped++; continue }

      // Pick template — explicit or auto-match
      let tmpl = templateId ? templateMap[templateId] : null
      if (!tmpl) {
        const preferredNames = TYPE_TO_TEMPLATE[contact.type] || TYPE_TO_TEMPLATE.other
        tmpl = templates.find(t => preferredNames.some(n => t.name.includes(n.split(' — ')[0])))
          || templates.find(t => t.type === contact.type)
          || templates.find(t => t.type === 'generic')
          || templates[0]
      }
      if (!tmpl) { skipped++; continue }

      const { subject, body: emailBody } = personalize(tmpl, contact)
      const html = wrapEmail(emailBody, contact)

      const doc = await sanity.create({
        _type:    'outreachSendLog',
        contact:  { _type: 'reference', _ref: contact._id },
        template: { _type: 'reference', _ref: tmpl._id },
        toEmail:  contact.email,
        toName:   contact.name,
        subject,
        bodyHtml: html,
        status:   'draft',
        draftedAt: new Date().toISOString(),
      })

      drafts.push({ id: doc._id, name: contact.name, email: contact.email, template: tmpl.name })
      created++
      await new Promise(r => setTimeout(r, 80))
    }

    return Response.json({ ok: true, action: 'generate', created, skipped, total: contacts.length, drafts })
  }

  // ── APPROVE + SEND — fire one or many ────────────────────────────────────────
  if (action === 'approve') {
    const { ids } = body  // array of sendLog _ids
    if (!ids?.length) return Response.json({ error: 'ids required' }, { status: 400 })

    const results = { sent: 0, failed: 0, errors: [] }

    for (const id of ids) {
      const entry = await sanity.fetch(
        `*[_type == "outreachSendLog" && _id == $id][0] {
          _id, toEmail, toName, subject, bodyHtml,
          contact->{ _id, name }
        }`,
        { id }
      )
      if (!entry?.toEmail) { results.failed++; continue }

      try {
        const { data, error } = await resend.emails.send({
          from:    'DJ Cavalcanti — DownRange <dj@downrangeco.com>',
          to:      [entry.toEmail],
          replyTo: 'dj@downrangeco.com',
          subject: entry.subject,
          html:    entry.bodyHtml,
        })
        if (error) throw new Error(error.message)

        await sanity.patch(id).set({
          status:     'sent',
          approvedAt: new Date().toISOString(),
          sentAt:     new Date().toISOString(),
          resendId:   data?.id || null,
        }).commit()

        if (entry.contact?._id) {
          await sanity.patch(entry.contact._id).set({ lastContactedAt: new Date().toISOString() }).commit()
        }

        results.sent++
      } catch (err) {
        await sanity.patch(id).set({ status: 'failed', error: err.message }).commit()
        results.failed++
        results.errors.push({ id, error: err.message })
      }
      await new Promise(r => setTimeout(r, 400))
    }

    return Response.json({ ok: true, action: 'approve', ...results })
  }

  // ── EDIT — update subject/body of a draft ────────────────────────────────────
  if (action === 'edit') {
    const { id, subject, bodyHtml, templateId } = body
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })

    const updates = {}
    if (subject)  updates.subject  = subject
    if (bodyHtml) updates.bodyHtml = bodyHtml
    if (templateId) updates.template = { _type: 'reference', _ref: templateId }

    // If switching template, re-render
    if (templateId && !bodyHtml) {
      const [tmpl, entry] = await Promise.all([
        sanity.fetch(`*[_type == "outreachTemplate" && _id == $id][0]`, { id: templateId }),
        sanity.fetch(`*[_type == "outreachSendLog" && _id == $id][0] { contact->{ _id, name, firstName, type, email, city, state, youtubeUrl, subscribers, website, fflLicense, specialties, instagram, twitter } }`, { id }),
      ])
      if (tmpl && entry?.contact) {
        const { subject: s, body: b } = personalize(tmpl, entry.contact)
        updates.subject  = updates.subject || s
        updates.bodyHtml = wrapEmail(b, entry.contact)
      }
    }

    const doc = await sanity.patch(id).set(updates).commit()
    return Response.json({ ok: true, action: 'edit', id: doc._id })
  }

  // ── SKIP ─────────────────────────────────────────────────────────────────────
  if (action === 'skip') {
    const { ids } = body
    await Promise.all((ids || [body.id]).map(id =>
      sanity.patch(id).set({ status: 'skipped' }).commit()
    ))
    return Response.json({ ok: true, action: 'skip', count: (ids || [body.id]).length })
  }

  // ── SNOOZE ────────────────────────────────────────────────────────────────────
  if (action === 'snooze') {
    const { id, days = 7 } = body
    const until = new Date(Date.now() + days * 86400000).toISOString()
    await sanity.patch(id).set({ status: 'snoozed', snoozeUntil: until }).commit()
    return Response.json({ ok: true, action: 'snooze', until })
  }

  // ── DIGEST — email DJ pending queue summary ──────────────────────────────────
  if (action === 'digest') {
    const pending = await sanity.fetch(
      `*[_type == "outreachSendLog" && status == "draft"] | order(draftedAt desc) [0...100] {
        toName, toEmail, subject, draftedAt,
        contact->{ type }
      }`
    )
    if (!pending.length) return Response.json({ ok: true, message: 'No pending drafts' })

    const rows = pending.map(e =>
      `<tr style="border-bottom:1px solid #1f2428;">
        <td style="padding:8px 12px;font-size:13px;color:#e5e7eb;">${e.toName}</td>
        <td style="padding:8px 12px;font-size:11px;color:#9ca3af;">${e.toEmail}</td>
        <td style="padding:8px 12px;font-size:11px;color:#C8922A;">${e.contact?.type || ''}</td>
        <td style="padding:8px 12px;font-size:11px;color:#d1d5db;">${e.subject}</td>
      </tr>`
    ).join('')

    const html = `<!DOCTYPE html><html><body style="background:#09090B;color:#e5e7eb;font-family:Arial,sans-serif;padding:32px;">
      <div style="max-width:700px;margin:0 auto;background:#0A0B0C;border:1px solid #1f2428;border-top:3px solid #C8922A;padding:28px;">
        <div style="font-family:Georgia,serif;font-size:22px;color:#C8922A;font-weight:900;margin-bottom:4px;">DOWNRANGE OUTREACH</div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:20px;">Daily Approval Queue — ${pending.length} emails pending your review</div>
        <p style="font-size:14px;color:#9ca3af;margin-bottom:16px;">
          These emails are drafted and personalized, waiting for your approval. 
          <a href="https://www.downrangeco.com/admin" style="color:#C8922A;">Open Mission Control →</a>
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="border-bottom:1px solid #C8922A;">
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#C8922A;letter-spacing:.08em;">NAME</th>
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#C8922A;letter-spacing:.08em;">EMAIL</th>
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#C8922A;letter-spacing:.08em;">TYPE</th>
              <th style="padding:8px 12px;text-align:left;font-size:10px;color:#C8922A;letter-spacing:.08em;">SUBJECT</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <a href="https://www.downrangeco.com/admin" style="display:inline-block;background:#C8922A;color:#000;padding:12px 24px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:.08em;">
          REVIEW & APPROVE →
        </a>
      </div>
    </body></html>`

    await resend.emails.send({
      from: 'DownRange Outreach <outreach@downrangeco.com>',
      to:   ['dejcav@gmail.com'],
      subject: `[DownRange] ${pending.length} emails pending approval`,
      html,
    })

    return Response.json({ ok: true, action: 'digest', sent: pending.length })
  }

  return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
