export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'
import { Resend } from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// POST /api/outreach/debug-send
// Pass { id } = a specific outreachSendLog _id, OR omit to use the first draft
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const steps = []
  const body  = await req.json().catch(() => ({}))
  let { id }  = body

  try {
    // STEP 1: find the entry
    steps.push({ step: 1, label: 'Find entry in Sanity' })
    if (!id) {
      const first = await sanity.fetch(
        `*[_type=="outreachSendLog" && status=="draft"] | order(_createdAt desc) [0]._id`
      )
      id = first
      steps[0].found_id = id
    }
    if (!id) return Response.json({ ok: false, steps, error: 'No draft entries in Sanity' })

    // STEP 2: fetch full entry
    steps.push({ step: 2, label: 'Fetch full entry' })
    const entry = await sanity.fetch(
      `*[_type=="outreachSendLog" && _id==$id][0] {
        _id, status, toEmail, toName, subject, bodyHtml,
        contact->{ _id, name, firstName, type, email },
        template->{ _id, name }
      }`,
      { id }
    )
    steps[1].entry = {
      _id:             entry?._id,
      status:          entry?.status,
      toEmail:         entry?.toEmail,
      toName:          entry?.toName,
      subject:         entry?.subject,
      bodyHtml_length: entry?.bodyHtml?.length || 0,
      bodyHtml_null:   !entry?.bodyHtml,
      contact_id:      entry?.contact?._id,
      contact_email:   entry?.contact?.email,
      template_name:   entry?.template?.name,
    }
    if (!entry) return Response.json({ ok: false, steps, error: 'Entry not found in Sanity for id: ' + id })

    // STEP 3: validate fields
    steps.push({ step: 3, label: 'Validate fields' })
    const issues = []
    if (!entry.toEmail)   issues.push('toEmail is empty')
    if (!entry.subject)   issues.push('subject is empty')
    if (!entry.bodyHtml)  issues.push('bodyHtml is null/empty — will send blank email')
    steps[2].issues = issues
    steps[2].will_send = entry.toEmail && entry.subject

    // STEP 4: attempt Resend
    steps.push({ step: 4, label: 'Call Resend API' })
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from:    'DJ Cavalcanti <dj@downrangeco.com>',
      to:      [entry.toEmail],
      replyTo: 'dj@downrangeco.com',
      subject: entry.subject || '(no subject)',
      html:    entry.bodyHtml || '<p>Test</p>',
    })
    steps[3].resend_response = { data, error }

    if (error) {
      steps[3].result = 'FAILED'
      return Response.json({ ok: false, steps, resend_error: error })
    }

    steps[3].result  = 'SUCCESS'
    steps[3].resend_id = data?.id

    // STEP 5: patch status
    steps.push({ step: 5, label: 'Patch Sanity status to sent' })
    await sanity.patch(id).set({
      status: 'sent', sentAt: new Date().toISOString(), resendId: data?.id
    }).commit()
    steps[4].result = 'patched'

    return Response.json({ ok: true, steps, resend_id: data?.id, to: entry.toEmail })

  } catch (e) {
    steps.push({ step: 'EXCEPTION', error: e.message, stack: e.stack?.slice(0, 600) })
    return Response.json({ ok: false, steps, exception: e.message })
  }
}
