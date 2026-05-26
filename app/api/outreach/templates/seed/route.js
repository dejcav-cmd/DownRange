export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

const DEFAULT_TEMPLATES = [
  {
    name: 'Gun Shop — Launch Announcement',
    type: 'gun_shop',
    subject: '{{businessName}} — A new firearm intelligence hub built for shops like yours',
    previewText: 'Breaking news, new releases, and law changes — all in one place.',
    body: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;">My name is DJ Cavalcanti and I just launched <strong style="color:#C8922A;">DownRange</strong> — a firearms intelligence portal built for the gun community in {{state}}.</p>

<p style="margin:0 0 16px;">It covers what matters to shops like {{businessName}} daily:</p>

<ul style="margin:0 0 16px;padding-left:20px;color:#e5e7eb;">
  <li style="margin-bottom:8px;"><strong>Breaking news</strong> — ATF rulings, law changes, and 2A developments as they happen</li>
  <li style="margin-bottom:8px;"><strong>New releases</strong> — manufacturer announcements from Glock, SIG, Ruger, and 30+ brands</li>
  <li style="margin-bottom:8px;"><strong>State laws</strong> — {{state}}-specific regulations, carry laws, and pending legislation</li>
  <li style="margin-bottom:8px;"><strong>Market data</strong> — ammo prices, deals, and market trends</li>
</ul>

<p style="margin:0 0 16px;">Your customers are going to walk in asking about the latest ATF ruling or the new Glock Gen6. DownRange makes sure you already know the answer.</p>

<p style="margin:0 0 24px;">Take a look — it's completely free: <a href="https://www.downrangeco.com" style="color:#C8922A;">downrangeco.com</a></p>

<p style="margin:0 0 8px;">Appreciate the work you do,</p>
<p style="margin:0;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder, DownRange Intelligence Hub</span></p>`,
    variables: ['{{firstName}}', '{{businessName}}', '{{state}}', '{{unsubscribeUrl}}'],
  },

  {
    name: 'NRA Instructor — Community Outreach',
    type: 'instructor',
    subject: 'Built for instructors in {{state}} — DownRange Intelligence Hub',
    previewText: 'Law changes, new gear releases, and 2A news — everything your students will ask about.',
    body: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;">I wanted to reach out directly to instructors in {{state}} about a resource I built for the firearms community.</p>

<p style="margin:0 0 16px;"><strong style="color:#C8922A;">DownRange</strong> is a free intelligence portal covering everything your students are going to ask about:</p>

<ul style="margin:0 0 16px;padding-left:20px;color:#e5e7eb;">
  <li style="margin-bottom:8px;">Real-time ATF and legislative updates</li>
  <li style="margin-bottom:8px;">{{state}} carry laws and recent court decisions</li>
  <li style="margin-bottom:8px;">New firearm and gear releases with full specs</li>
  <li style="margin-bottom:8px;">Dry fire training guides and beginner resources (great for referrals)</li>
</ul>

<p style="margin:0 0 16px;">As an instructor, staying ahead of what's changing in the legal landscape is part of your job. DownRange keeps you briefed so your students get accurate, current information.</p>

<p style="margin:0 0 24px;">Free, no signup required: <a href="https://www.downrangeco.com" style="color:#C8922A;">downrangeco.com</a></p>

<p style="margin:0 0 8px;">Stay safe out there,</p>
<p style="margin:0;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder, DownRange</span></p>`,
    variables: ['{{firstName}}', '{{state}}', '{{specialties}}', '{{unsubscribeUrl}}'],
  },

  {
    name: 'YouTube Creator — Embed Permission Request',
    type: 'youtuber',
    subject: 'Featuring {{channelName}} on DownRange — wanted to let you know',
    previewText: "We've added your channel to our firearms portal — reach a new audience of gun owners.",
    body: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;">Big fan of what you're doing on {{channelName}}.</p>

<p style="margin:0 0 16px;">I just launched <strong style="color:#C8922A;">DownRange</strong> — a firearms intelligence portal — and I've added your channel to our Video section. Gun owners visiting DownRange can discover your content directly on the platform.</p>

<p style="margin:0 0 16px;">This is completely free for you — it's additional distribution for your channel, and your viewers find your content through a platform that YouTube doesn't suppress.</p>

<p style="margin:0 0 16px;">I wanted to reach out personally rather than just embed without saying anything. A few things I wanted to confirm:</p>

<ul style="margin:0 0 16px;padding-left:20px;color:#e5e7eb;">
  <li style="margin-bottom:8px;">I'm featuring your channel with your name, profile, and a link back to YouTube</li>
  <li style="margin-bottom:8px;">No monetization on my end from your content — it's a discovery channel</li>
  <li style="margin-bottom:8px;">If you want to be removed, just reply and I'll take it down immediately</li>
</ul>

<p style="margin:0 0 16px;">You can see how it looks here: <a href="https://www.downrangeco.com/video" style="color:#C8922A;">downrangeco.com/video</a></p>

<p style="margin:0 0 24px;">If you'd like a dedicated creator page or want to collaborate, I'm open to that too. Either way, keep making great content.</p>

<p style="margin:0 0 8px;">Respect,</p>
<p style="margin:0;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder, DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;">downrangeco.com</a></span></p>`,
    variables: ['{{firstName}}', '{{channelName}}', '{{subscribers}}', '{{unsubscribeUrl}}'],
  },

  {
    name: 'FFL Dealer — Portal Introduction',
    type: 'ffl_dealer',
    subject: 'New resource for FFL dealers in {{state}} — DownRange',
    previewText: 'ATF updates, new releases, and market data — one place for everything.',
    body: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;">As a licensed dealer in {{state}}, you're fielding questions about new products, law changes, and ATF rulings every day.</p>

<p style="margin:0 0 16px;">I built <strong style="color:#C8922A;">DownRange</strong> specifically for the firearms community — it aggregates everything dealers need to stay current:</p>

<ul style="margin:0 0 16px;padding-left:20px;color:#e5e7eb;">
  <li style="margin-bottom:8px;"><strong>ATF & regulatory updates</strong> — rules changes, rulemaking, and enforcement news</li>
  <li style="margin-bottom:8px;"><strong>Manufacturer releases</strong> — new models, pricing, and specs from 30+ brands</li>
  <li style="margin-bottom:8px;"><strong>{{state}} laws</strong> — carry, transfer, and background check requirements</li>
  <li style="margin-bottom:8px;"><strong>Ammo market data</strong> — pricing trends and best deals</li>
</ul>

<p style="margin:0 0 24px;">No registration needed. Just bookmark it: <a href="https://www.downrangeco.com" style="color:#C8922A;">downrangeco.com</a></p>

<p style="margin:0 0 8px;">Stay informed,</p>
<p style="margin:0;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder, DownRange</span></p>`,
    variables: ['{{firstName}}', '{{state}}', '{{unsubscribeUrl}}'],
  },

  {
    name: 'Follow-Up — No Response (14 days)',
    type: 'follow_up',
    subject: 'Quick follow-up — DownRange',
    previewText: 'Just making sure this landed.',
    body: `<p style="margin:0 0 16px;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;">I sent you a note a couple weeks ago about DownRange and wanted to follow up briefly.</p>

<p style="margin:0 0 16px;">The portal has been growing fast — we're covering daily news, new releases, and 2A legal developments across all 50 states.</p>

<p style="margin:0 0 24px;">Worth a look if you have 2 minutes: <a href="https://www.downrangeco.com" style="color:#C8922A;">downrangeco.com</a></p>

<p style="margin:0 0 8px;">No pressure either way,</p>
<p style="margin:0;"><strong>DJ</strong></p>`,
    variables: ['{{firstName}}', '{{unsubscribeUrl}}'],
  },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = { created: 0, skipped: 0 }

  for (const tmpl of DEFAULT_TEMPLATES) {
    const exists = await sanity.fetch(
      `*[_type == "outreachTemplate" && name == $name][0]._id`,
      { name: tmpl.name }
    )
    if (exists) { results.skipped++; continue }
    await sanity.create({ _type: 'outreachTemplate', ...tmpl, isActive: true, createdAt: new Date().toISOString() })
    results.created++
  }

  return Response.json({ ok: true, ...results, total: DEFAULT_TEMPLATES.length })
}
