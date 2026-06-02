export const dynamic = 'force-dynamic'

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const log = []
  const ts  = () => new Date().toISOString()

  // ── ENV CHECK ─────────────────────────────────────────────────────────────
  const env = {
    RESEND_API_KEY:      process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.slice(0,12)+'...' : 'MISSING',
    ADMIN_KEY:           process.env.ADMIN_KEY       ? '✅ set' : 'MISSING',
    SANITY_API_TOKEN:    process.env.SANITY_API_TOKEN ? process.env.SANITY_API_TOKEN.slice(0,12)+'...' : 'MISSING',
    SANITY_PROJECT_ID:   process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg (default)',
    NODE_ENV:            process.env.NODE_ENV,
  }
  log.push({ step:'ENV', ts:ts(), data: env })

  // ── IMPORT SANITY ─────────────────────────────────────────────────────────
  let sanity
  try {
    const { createClient } = await import('@sanity/client')
    sanity = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
      dataset:   'production',
      apiVersion:'2024-01-01',
      useCdn:    false,
      token:     process.env.SANITY_API_TOKEN,
    })
    log.push({ step:'SANITY_INIT', ts:ts(), ok:true })
  } catch(e) {
    log.push({ step:'SANITY_INIT', ts:ts(), ok:false, error:e.message })
    return Response.json({ ok:false, log })
  }

  // ── COUNT ALL SENDLOGS ────────────────────────────────────────────────────
  try {
    const counts = await sanity.fetch(`{
      "total":    count(*[_type=="outreachSendLog"]),
      "draft":    count(*[_type=="outreachSendLog" && status=="draft"]),
      "sent":     count(*[_type=="outreachSendLog" && status=="sent"]),
      "failed":   count(*[_type=="outreachSendLog" && status=="failed"]),
      "contacts": count(*[_type=="outreachContact"]),
      "templates":count(*[_type=="outreachTemplate"]),
    }`)
    log.push({ step:'SANITY_COUNTS', ts:ts(), ok:true, data:counts })
  } catch(e) {
    log.push({ step:'SANITY_COUNTS', ts:ts(), ok:false, error:e.message, hint:'Sanity token may be invalid or project ID wrong' })
    return Response.json({ ok:false, log })
  }

  // ── FIND FIRST DRAFT ──────────────────────────────────────────────────────
  let draftId
  try {
    draftId = await sanity.fetch(`*[_type=="outreachSendLog" && status=="draft"][0]._id`)
    log.push({ step:'FIND_DRAFT', ts:ts(), ok:true, id: draftId || 'NONE — no drafts in Sanity' })
  } catch(e) {
    log.push({ step:'FIND_DRAFT', ts:ts(), ok:false, error:e.message })
    return Response.json({ ok:false, log })
  }

  if (!draftId) {
    // No drafts — try to find ANY sendLog to verify the collection exists
    try {
      const anyLog = await sanity.fetch(`*[_type=="outreachSendLog"][0]{ _id, status, toEmail, _createdAt }`)
      log.push({ step:'ANY_SENDLOG', ts:ts(), data: anyLog || 'collection empty or does not exist' })
    } catch(e) {
      log.push({ step:'ANY_SENDLOG', ts:ts(), error:e.message })
    }

    // Also check contacts
    try {
      const contacts = await sanity.fetch(`*[_type=="outreachContact"][0..2]{ _id, name, email, type, status }`)
      log.push({ step:'SAMPLE_CONTACTS', ts:ts(), data: contacts })
    } catch(e) {
      log.push({ step:'SAMPLE_CONTACTS', ts:ts(), error:e.message })
    }

    return Response.json({ ok:false, log, conclusion:'No draft sendLog entries exist — queue is empty. Use Compose → select contacts → Queue for Approval first.' })
  }

  // ── FETCH FULL ENTRY ──────────────────────────────────────────────────────
  let entry
  try {
    entry = await sanity.fetch(`*[_type=="outreachSendLog" && _id==$id][0]{
      _id, _createdAt, status, toEmail, toName, subject,
      "bodyHtml_length": length(bodyHtml),
      "bodyHtml_preview": bodyHtml[0..100],
      "contact_ref": contact._ref,
      "template_ref": template._ref,
    }`, { id: draftId })
    log.push({ step:'FETCH_ENTRY', ts:ts(), ok:true, data:entry })
  } catch(e) {
    log.push({ step:'FETCH_ENTRY', ts:ts(), ok:false, error:e.message })
    return Response.json({ ok:false, log })
  }

  // ── FETCH CONTACT ─────────────────────────────────────────────────────────
  let contact
  if (entry?.contact_ref) {
    try {
      contact = await sanity.fetch(`*[_id==$id][0]{ _id, name, firstName, email, type, status }`, { id: entry.contact_ref })
      log.push({ step:'FETCH_CONTACT', ts:ts(), ok:true, data:contact || 'NOT FOUND' })
    } catch(e) {
      log.push({ step:'FETCH_CONTACT', ts:ts(), ok:false, error:e.message })
    }
  } else {
    log.push({ step:'FETCH_CONTACT', ts:ts(), ok:false, error:'No contact reference on sendLog entry' })
  }

  // ── FETCH TEMPLATE ────────────────────────────────────────────────────────
  let template
  if (entry?.template_ref) {
    try {
      template = await sanity.fetch(`*[_id==$id][0]{ _id, name, subject, "body_length": length(body) }`, { id: entry.template_ref })
      log.push({ step:'FETCH_TEMPLATE', ts:ts(), ok:true, data:template || 'NOT FOUND' })
    } catch(e) {
      log.push({ step:'FETCH_TEMPLATE', ts:ts(), ok:false, error:e.message })
    }
  } else {
    log.push({ step:'FETCH_TEMPLATE', ts:ts(), ok:false, error:'No template reference on sendLog entry' })
  }

  // ── VALIDATE SEND REQUIREMENTS ────────────────────────────────────────────
  const toEmail = entry?.toEmail || contact?.email
  const issues  = []
  if (!toEmail)            issues.push('NO toEmail on entry or contact')
  if (!entry?.subject)     issues.push('NO subject')
  if (!entry?.bodyHtml_length) issues.push('bodyHtml is null/empty — will need re-render')
  if (!entry?.template_ref)    issues.push('no template reference')
  if (!entry?.contact_ref)     issues.push('no contact reference')
  log.push({ step:'VALIDATION', ts:ts(), toEmail, issues, sendable: issues.filter(i=>i.includes('NO toEmail')||i.includes('NO subject')).length===0 })

  // ── ATTEMPT RESEND ────────────────────────────────────────────────────────
  if (!toEmail) {
    return Response.json({ ok:false, log, conclusion:'Cannot send — no email address' })
  }

  let html = entry?.bodyHtml_preview ? '(exists in Sanity — fetching full)' : '<p>Debug test body</p>'
  try {
    const full = await sanity.fetch(`*[_id==$id][0].bodyHtml`, { id: draftId })
    html = full || '<p>No body stored — debug fallback</p>'
    log.push({ step:'FETCH_BODY', ts:ts(), ok:true, chars: html.length, source: full ? 'Sanity' : 'fallback' })
  } catch(e) {
    log.push({ step:'FETCH_BODY', ts:ts(), ok:false, error:e.message })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    log.push({ step:'RESEND_INIT', ts:ts(), ok:true })

    const { data, error } = await resend.emails.send({
      from:    'DJ Cavalcanti <dj@downrangeco.com>',
      to:      [toEmail],
      replyTo: 'dj@downrangeco.com',
      subject: entry?.subject || '[DownRange debug]',
      html,
    })

    log.push({ step:'RESEND_SEND', ts:ts(), ok:!error, data, error })

    if (error) return Response.json({ ok:false, log, conclusion:'Resend rejected: '+JSON.stringify(error) })

    // Patch to sent
    await sanity.patch(draftId).set({ status:'sent', sentAt:ts(), resendId:data?.id||null }).commit()
    log.push({ step:'PATCH_SENT', ts:ts(), ok:true })

    return Response.json({ ok:true, log, resend_id:data?.id, to:toEmail, conclusion:'✅ Email sent successfully' })

  } catch(e) {
    log.push({ step:'RESEND_EXCEPTION', ts:ts(), ok:false, error:e.message, stack:e.stack?.slice(0,400) })
    return Response.json({ ok:false, log, conclusion:'Exception: '+e.message })
  }
}
