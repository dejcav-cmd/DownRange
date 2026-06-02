export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const steps = []
  const body  = await req.json().catch(() => ({}))
  let { id }  = body

  try {
    // ── STEP 1: find first draft id ───────────────────────────────────────
    steps.push({ step:1, label:'Find draft entry' })
    if (!id) {
      id = await sanity.fetch(`*[_type=="outreachSendLog" && status=="draft"][0]._id`)
    }
    steps[0].id = id || 'NONE'
    if (!id) return Response.json({ ok:false, steps, error:'No draft entries found in Sanity' })

    // ── STEP 2: fetch raw doc — NO joins ──────────────────────────────────
    steps.push({ step:2, label:'Fetch raw doc (no joins)' })
    const raw = await sanity.fetch(
      `*[_type=="outreachSendLog" && _id==$id][0]`,
      { id }
    )
    steps[1].raw = {
      _id:            raw?._id,
      status:         raw?.status,
      toEmail:        raw?.toEmail,
      toName:         raw?.toName,
      subject:        raw?.subject,
      bodyHtml_chars: raw?.bodyHtml?.length ?? 'NULL',
      contact_ref:    raw?.contact?._ref || 'MISSING',
      template_ref:   raw?.template?._ref || 'MISSING',
    }
    if (!raw) return Response.json({ ok:false, steps, error:'Doc not found for id: '+id })

    // ── STEP 3: validate toEmail ──────────────────────────────────────────
    steps.push({ step:3, label:'Validate toEmail' })
    const toEmail = raw.toEmail
    steps[2].toEmail  = toEmail || 'EMPTY'
    steps[2].ok       = !!toEmail
    if (!toEmail) return Response.json({ ok:false, steps, error:'toEmail is empty — contact has no email' })

    // ── STEP 4: fetch contact separately ─────────────────────────────────
    steps.push({ step:4, label:'Fetch contact doc' })
    let contact = null
    if (raw.contact?._ref) {
      contact = await sanity.fetch(
        `*[_id==$id][0]{ _id, name, firstName, email, type }`,
        { id: raw.contact._ref }
      )
    }
    steps[3].contact = contact
      ? { _id: contact._id, name: contact.name, email: contact.email, type: contact.type }
      : 'NOT FOUND — ref: ' + (raw.contact?._ref || 'none')

    // ── STEP 5: check bodyHtml ────────────────────────────────────────────
    steps.push({ step:5, label:'Check bodyHtml' })
    const html = raw.bodyHtml || '<p>Fallback test body — original was empty</p>'
    steps[4].bodyHtml_source = raw.bodyHtml ? 'from Sanity' : 'FALLBACK (original was null)'
    steps[4].html_length     = html.length

    // ── STEP 6: send via Resend ───────────────────────────────────────────
    steps.push({ step:6, label:'Call Resend' })
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from:    'DJ Cavalcanti <dj@downrangeco.com>',
      to:      [toEmail],
      replyTo: 'dj@downrangeco.com',
      subject: raw.subject || '(no subject)',
      html,
    })
    steps[5].resend_data  = data
    steps[5].resend_error = error

    if (error) {
      steps[5].result = 'FAILED'
      return Response.json({ ok:false, steps, resend_error: error })
    }

    // ── STEP 7: patch Sanity ──────────────────────────────────────────────
    steps.push({ step:7, label:'Patch Sanity → sent' })
    await sanity.patch(id).set({
      status: 'sent', sentAt: new Date().toISOString(), resendId: data?.id || null
    }).commit()
    steps[6].result = 'patched'

    return Response.json({ ok:true, steps, resend_id: data?.id, to: toEmail })

  } catch (e) {
    steps.push({ step:'EXCEPTION', error: e.message, stack: e.stack?.slice(0,800) })
    return Response.json({ ok:false, steps, exception: e.message })
  }
}
