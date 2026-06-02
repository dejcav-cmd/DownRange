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
const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")

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
        // Match full name first, then partial, then type, then fallback
        tmpl = templates.find(t => preferredNames.some(n => t.name === n))
          || templates.find(t => preferredNames.some(n => t.name.startsWith(n.split(' — ')[0]) && t.name.includes('Introduction')))
          || templates.find(t => t.type === contact.type && t.name.includes('Introduction'))
          || templates.find(t => t.type === contact.type)
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
        const unsubUrl = `https://www.downrangeco.com/api/outreach/unsubscribe?email=${encodeURIComponent(entry.toEmail)}`
        const { data, error } = await getResend().emails.send({
          from:    'DJ Cavalcanti <dj@downrangeco.com>',
          to:      [entry.toEmail],
          replyTo: 'dj@downrangeco.com',
          subject: entry.subject,
          html:    entry.bodyHtml,
          headers: {
            'List-Unsubscribe':      `<${unsubUrl}>, <mailto:dj@downrangeco.com?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'X-Entity-Ref-ID':       entry._id || '',
            'Precedence':            'bulk',
          },
        })
        if (error) {
          console.error('[OUTREACH SEND] Resend error for', entry.toEmail, ':', JSON.stringify(error))
          throw new Error(error.message || JSON.stringify(error))
        }

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
        const errMsg = err.message || String(err)
        console.error('[OUTREACH SEND] Failed to send to', entry.toEmail, ':', errMsg)
        await sanity.patch(id).set({
          status: 'failed',
          error:  errMsg,
          sentAt: new Date().toISOString(),
        }).commit()
        results.failed++
        results.errors.push({ id, to: entry.toEmail, error: errMsg })
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
    const cutoff30d = new Date(Date.now() - 30 * 86400000).toISOString()
    const cutoff7d  = new Date(Date.now() - 7 * 86400000).toISOString()
    const today     = new Date().toISOString().split('T')[0]

    // Fetch pending drafts with full context
    const [pending, sentHistory] = await Promise.all([
      sanity.fetch(
        `*[_type == "outreachSendLog" && status == "draft"] | order(draftedAt desc) [0...150] {
          _id, toName, toEmail, subject, draftedAt, body,
          contact->{ type, company, website }
        }`
      ),
      sanity.fetch(
        `*[_type == "outreachSendLog" && status == "sent" && sentAt > $c] | order(sentAt desc) [0...200] {
          sentAt, contact->{ type }
        }`,
        { c: cutoff30d }
      ).catch(() => []),
    ])

    // Only email if 5+ pending — otherwise skip
    if (pending.length < 5) return Response.json({ ok: true, message: `Only ${pending.length} pending drafts — skipping digest (min 5)` })

    // Group by contact type
    const TYPE_LABELS = {
      manufacturer: 'Manufacturer', holster_company: 'Holster Company', gun_shop: 'Gun Shop / FFL',
      ffl_dealer: 'FFL Dealer', youtuber: 'YouTuber / Creator', instructor: 'Instructor',
      range: 'Range', organization: 'Organization', influencer: 'Influencer', other: 'Other',
    }
    const groups = {}
    pending.forEach(e => {
      const t = e.contact?.type || 'other'
      if (!groups[t]) groups[t] = []
      groups[t].push(e)
    })

    // Staleness threshold
    const STALE_DAYS = 7
    const isStale = d => d && (Date.now() - new Date(d).getTime()) > STALE_DAYS * 86400000
    const staleCount = pending.filter(e => isStale(e.draftedAt)).length

    // Sent stats
    const sentThisMonth = sentHistory.length
    const sentByType    = {}
    sentHistory.forEach(s => { const t = s.contact?.type || 'other'; sentByType[t] = (sentByType[t] || 0) + 1 })

    // Build group sections
    const typeColor = t => ({
      manufacturer: '#C8922A', holster_company: '#3b82f6', gun_shop: '#22c55e',
      ffl_dealer: '#22c55e', youtuber: '#a855f7', instructor: '#06b6d4',
      range: '#f59e0b', organization: '#f97316', influencer: '#ec4899', other: '#6b7280',
    })[t] || '#6b7280'

    const groupSections = Object.entries(groups).sort((a, b) => b[1].length - a[1].length).map(([type, items]) => {
      const label = TYPE_LABELS[type] || type
      const color = typeColor(type)
      const sentCount = sentByType[type] || 0
      const staleInGroup = items.filter(e => isStale(e.draftedAt)).length

      const itemRows = items.slice(0, 8).map(e => {
        const daysAgo = e.draftedAt ? Math.floor((Date.now() - new Date(e.draftedAt).getTime()) / 86400000) : null
        const stale   = isStale(e.draftedAt)
        // Preview: first 120 chars of body text
        const preview = (e.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
        return `<tr style="border-bottom:1px solid #1a1c20;">
          <td style="padding:10px 12px;">
            <div style="font-size:12px;font-weight:700;color:#e5e7eb;">${e.toName}</div>
            <div style="font-size:10px;color:#4b5563;">${e.toEmail}${e.contact?.company ? ` · ${e.contact.company}` : ''}</div>
            ${preview ? `<div style="font-size:10px;color:#6b7280;margin-top:4px;font-style:italic;line-height:1.4;">"${preview}…"</div>` : ''}
          </td>
          <td style="padding:10px 12px;font-size:11px;color:#9ca3af;max-width:180px;">${e.subject}</td>
          <td style="padding:10px 12px;text-align:center;white-space:nowrap;">
            ${stale
              ? `<span style="background:#451a03;color:#f97316;font-size:9px;font-weight:700;padding:2px 7px;letter-spacing:.06em;">STALE ${daysAgo}d</span>`
              : `<span style="font-size:10px;color:#6b7280;">${daysAgo !== null ? daysAgo + 'd ago' : '—'}</span>`
            }
          </td>
        </tr>`
      }).join('')

      const overflow = items.length > 8 ? `<tr><td colspan="3" style="padding:8px 12px;font-size:10px;color:#6b7280;font-style:italic;">…and ${items.length - 8} more ${label} drafts</td></tr>` : ''

      return `
        <!-- ${label} Group -->
        <div style="margin-bottom:16px;border:1px solid #1f2428;">
          <div style="padding:10px 16px;background:#0d0e10;border-bottom:1px solid #1f2428;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="display:inline-block;width:3px;height:16px;background:${color};"></span>
              <span style="font-size:12px;font-weight:700;color:${color};">${label}</span>
              <span style="background:${color}22;color:${color};font-size:9px;font-weight:700;padding:2px 8px;letter-spacing:.06em;">${items.length} PENDING</span>
              ${staleInGroup > 0 ? `<span style="background:#451a0322;color:#f97316;font-size:9px;font-weight:700;padding:2px 8px;letter-spacing:.06em;">${staleInGroup} STALE</span>` : ''}
            </div>
            <span style="font-size:10px;color:#4b5563;">${sentCount} sent this month</span>
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid #1f2428;background:#0a0b0d;">
                <th style="padding:7px 12px;text-align:left;font-size:9px;color:#6b7280;letter-spacing:.08em;">CONTACT + PREVIEW</th>
                <th style="padding:7px 12px;text-align:left;font-size:9px;color:#6b7280;letter-spacing:.08em;">SUBJECT LINE</th>
                <th style="padding:7px 12px;text-align:center;font-size:9px;color:#6b7280;letter-spacing:.08em;">AGE</th>
              </tr>
            </thead>
            <tbody>${itemRows}${overflow}</tbody>
          </table>
        </div>`
    }).join('')

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;color:#e5e7eb;">
<div style="max-width:760px;margin:0 auto;background:#09090B;">

  <!-- MASTHEAD -->
  <div style="background:#0A0B0C;border-bottom:3px solid #C8922A;padding:24px 36px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-family:Georgia,serif;font-size:26px;font-weight:900;color:#C8922A;letter-spacing:0.12em;">DOWNRANGE</div>
        <div style="font-size:9px;color:#4b5563;letter-spacing:0.24em;margin-top:3px;">OUTREACH QUEUE · ${today} · 1:00 PM</div>
      </div>
      <div style="text-align:center;background:#1c1108;border:2px solid #C8922A;padding:12px 18px;">
        <div style="font-size:36px;font-weight:900;color:#C8922A;line-height:1;">${pending.length}</div>
        <div style="font-size:8px;color:#C8922A;letter-spacing:.14em;margin-top:2px;">PENDING</div>
      </div>
    </div>
    <!-- Stats bar -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
      ${[
        ['Pending drafts',   pending.length,    '#C8922A'],
        ['Stale (7d+)',      staleCount,         staleCount > 0 ? '#f97316' : '#22c55e'],
        ['Sent this month',  sentThisMonth,     '#22c55e'],
        ['Contact types',    Object.keys(groups).length, '#3b82f6'],
      ].map(([l, v, c]) => `<div style="text-align:center;padding:8px 14px;background:#111;border:1px solid #1f2428;">
        <div style="font-size:22px;font-weight:900;color:${c};">${v}</div>
        <div style="font-size:8px;color:#4b5563;letter-spacing:.08em;">${l.toUpperCase()}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- STALE WARNING -->
  ${staleCount > 0 ? `
  <div style="background:#1c0e04;border-bottom:1px solid #1f2428;padding:14px 36px;border-left:4px solid #f97316;">
    <div style="font-size:11px;color:#f97316;font-weight:700;margin-bottom:4px;">⚠ ${staleCount} drafts are ${STALE_DAYS}+ days old</div>
    <div style="font-size:11px;color:#9ca3af;line-height:1.6;">
      These drafts may reference outdated context. Consider refreshing them in the Outreach Portal before sending.
      Stale emails often get lower response rates.
    </div>
  </div>` : ''}

  <!-- QUICK DECISION GUIDE -->
  <div style="background:#0d0e10;border-bottom:1px solid #1f2428;padding:16px 36px;">
    <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.2em;margin-bottom:10px;">DECISION GUIDE</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
      <div style="padding:10px;background:#0a0b0d;border-left:3px solid #22c55e;">
        <div style="font-size:10px;font-weight:700;color:#22c55e;margin-bottom:4px;">APPROVE</div>
        <div style="font-size:10px;color:#9ca3af;line-height:1.5;">Fresh draft, strong subject, contact is relevant to current content</div>
      </div>
      <div style="padding:10px;background:#0a0b0d;border-left:3px solid #f59e0b;">
        <div style="font-size:10px;font-weight:700;color:#f59e0b;margin-bottom:4px;">EDIT FIRST</div>
        <div style="font-size:10px;color:#9ca3af;line-height:1.5;">Stale draft, generic subject, or contact needs personalization</div>
      </div>
      <div style="padding:10px;background:#0a0b0d;border-left:3px solid #ef4444;">
        <div style="font-size:10px;font-weight:700;color:#ef4444;margin-bottom:4px;">SKIP</div>
        <div style="font-size:10px;color:#9ca3af;line-height:1.5;">Contact not relevant, wrong timing, or already reached out recently</div>
      </div>
    </div>
  </div>

  <!-- GROUPED DRAFTS -->
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.2em;margin-bottom:16px;">
      DRAFTS BY CONTACT TYPE (${Object.keys(groups).length} categories)
    </div>
    ${groupSections}
  </div>

  <!-- MONTHLY STATS BY TYPE -->
  ${Object.keys(sentByType).length > 0 ? `
  <div style="background:#0d0e10;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#6b7280;font-weight:700;letter-spacing:.2em;margin-bottom:12px;">SENT THIS MONTH BY TYPE</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${Object.entries(sentByType).sort((a,b) => b[1]-a[1]).map(([t, n]) =>
        `<div style="padding:6px 12px;background:#0a0b0d;border:1px solid #1f2428;text-align:center;">
          <div style="font-size:14px;font-weight:700;color:${typeColor(t)};">${n}</div>
          <div style="font-size:9px;color:#4b5563;">${TYPE_LABELS[t] || t}</div>
        </div>`
      ).join('')}
    </div>
  </div>` : ''}

  <!-- CTA -->
  <div style="padding:20px 36px;background:#0d0e10;display:flex;gap:16px;align-items:center;">
    <a href="https://downrangeco.com/admin" style="background:#C8922A;color:#000;padding:12px 24px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:.08em;">REVIEW & APPROVE →</a>
    <span style="font-size:11px;color:#4b5563;">Open the Outreach Portal to approve, edit, skip, or snooze each draft.</span>
  </div>

  <div style="padding:12px 36px;font-size:10px;color:#374151;">DownRange Outreach System · ${today} · Sent daily at 1:00 PM</div>
</div>
</body></html>`

    await getResend().emails.send({
      from:    'DownRange Outreach <outreach@downrangeco.com>',
      to:      ['dejcav@gmail.com'],
      subject: `[DownRange] Outreach Queue ${today} · ${pending.length} pending · ${staleCount} stale · ${Object.keys(groups).length} types`,
      html,
    })

    return Response.json({ ok: true, action: 'digest', pending: pending.length, stale: staleCount, groups: Object.keys(groups).length })
  }

  return Response.json({ error: `Unknown action: ${action}` }, { status: 400 })
}
