export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'
const sanity = createClient({ projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'vbnsqnkg', dataset:'production', apiVersion:'2024-01-01', token:process.env.SANITY_API_TOKEN, useCdn:false })

export async function POST(req) {
  const body = await req.json()
  const { name, email, bio, topic, outline, sampleUrl, expertise } = body
  if (!name||!email||!topic||!outline) return Response.json({ error:'Required fields missing' }, { status:400 })

  // Save to Sanity
  try {
    await sanity.create({ _type:'submission', name, email, bio, topic, outline, sampleUrl, expertise, submittedAt: new Date().toISOString(), status: 'pending' })
  } catch {}

  // Email notification via Resend
  try {
    const { Resend } = await import('resend')
    const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")
    await getResend().emails.send({
      from:'DownRange <noreply@downrangeco.com>',
      to:[process.env.CONTACT_EMAIL||'dejalma.cavalcanti@icloud.com'],
      replyTo: email,
      subject:`[DownRange Submission] ${topic}`,
      html:`<div style="font-family:monospace;padding:24px;background:var(--background);color:#F0EDE6"><h2 style="color:#C8922A">New Article Submission</h2><p><b>From:</b> ${name} (${email})</p><p><b>Expertise:</b> ${expertise||'Not specified'}</p><p><b>Topic:</b> ${topic}</p><p><b>Outline:</b><br>${outline.replace(/\n/g,'<br>')}</p>${sampleUrl?`<p><b>Sample:</b> <a href="${sampleUrl}">${sampleUrl}</a></p>`:''}</div>`
    })
  } catch {}

  return Response.json({ success:true })
}
