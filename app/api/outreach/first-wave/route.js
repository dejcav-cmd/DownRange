export const dynamic  = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'
import { Resend }        from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

const resend = () => new Resend(process.env.RESEND_API_KEY)

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// Priority first-wave targets — law/news content alignment with DownRange
const PRIORITY_TARGETS = [
  'Washington Gun Law',
  'Armed Attorneys',
  'Guns & Gadgets 2nd Amendment News',
  'Colion Noir',
  'Reno May',
  'IraqVeteran8888',
  'Warrior Poet Society',
  'sootch00',
  'Kentucky Ballistics',
  'TheGunCollective',
]

function buildEmail(contact) {
  const firstName = contact.firstName || contact.name.split(' ')[0]
  return {
    subject: `DownRange.co — featuring your content to 2A readers`,
    html: `
<div style="font-family:'IBM Plex Mono',monospace;max-width:560px;color:#1a1a1a;line-height:1.7;">
  <p>Hi ${firstName},</p>
  <p>I'm DJ Cavalcanti, founder of <strong>DownRange Co.</strong> — an independent 2A intelligence portal at <a href="https://downrangeco.com">downrangeco.com</a>. Daily carry, Washington State, pro-Second Amendment.</p>
  <p>I built DownRange to give gun owners a single place for breaking 2A law news, 50-state CCW reciprocity data, ATF updates, and legislative tracking — without the paywall or political noise you get from mainstream outlets.</p>
  <p>I currently feature your channel in our <a href="https://downrangeco.com/video">Video Intelligence</a> section because your content is exactly what our readers need. I wanted to reach out directly about a simple partnership:</p>
  <p><strong>If any of your videos cover CCW laws, state legislation, ATF rules, or 2A court cases — dropping a link to the relevant DownRange page in your description helps your viewers go deeper.</strong> No sponsorship fees, no commitments — just two pro-2A resources pointing readers to each other.</p>
  <p>As a gesture of good faith, I also write up summaries of landmark 2A cases and state law changes that you're welcome to reference or share with your audience.</p>
  <p>If this sounds useful, just reply — I'll send over the specific pages that match your content focus. Takes 30 seconds to add a link, and your viewers get real value from it.</p>
  <p>Either way, keep doing what you're doing. We need more voices like yours.</p>
  <p>Stay armed,<br/>
  <strong>DJ Cavalcanti</strong><br/>
  Founder, DownRange Co.<br/>
  <a href="https://downrangeco.com">downrangeco.com</a> · dj@downrangeco.com</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
  <p style="font-size:11px;color:#888;">You received this because your channel covers Second Amendment topics we cover at DownRange. Reply to unsubscribe from future outreach.</p>
</div>`
  }
}

// GET — preview who will be contacted
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const contacts = await sanity.fetch(
    `*[_type=="outreachContact" && type=="youtuber" && status=="active"] | order(subscribers desc) {
      _id, name, firstName, email, subscribers, lastContactedAt
    }`
  )
  const eligible = contacts.filter(c =>
    c.email && !c.email.includes('placeholder') &&
    PRIORITY_TARGETS.includes(c.name) &&
    !c.lastContactedAt
  )
  return Response.json({ ok: true, eligible: eligible.length, contacts: eligible.map(c => ({ name: c.name, email: c.email, subscribers: c.subscribers })) })
}

// POST — send first wave
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const contacts = await sanity.fetch(
    `*[_type=="outreachContact" && type=="youtuber" && status=="active"] | order(subscribers desc) {
      _id, name, firstName, email, subscribers, lastContactedAt
    }`
  )

  // Only uncontacted priority targets with real emails
  const targets = contacts.filter(c =>
    c.email && !c.email.includes('placeholder') &&
    PRIORITY_TARGETS.includes(c.name) &&
    !c.lastContactedAt
  )

  const results = []
  for (const contact of targets) {
    try {
      const emailContent = buildEmail(contact)
      await resend().emails.send({
        from:    'DJ Cavalcanti <dj@downrangeco.com>',
        to:      contact.email,
        subject: emailContent.subject,
        html:    emailContent.html,
        replyTo: 'dj@downrangeco.com',
      })
      // Mark as contacted in Sanity
      await sanity.patch(contact._id).set({
        lastContactedAt:  new Date().toISOString(),
        outreachStatus:   'first_wave_sent',
      }).commit()
      results.push({ name: contact.name, email: contact.email, status: 'sent' })
    } catch (e) {
      results.push({ name: contact.name, status: 'error', error: e.message })
    }
  }

  const sent = results.filter(r => r.status === 'sent').length
  return Response.json({ ok: true, sent, total: targets.length, results })
}
