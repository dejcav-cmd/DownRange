export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// ─────────────────────────────────────────────────────────────────────────────
// SET 1 — YOUTUBERS
// ─────────────────────────────────────────────────────────────────────────────

const YOUTUBER_INTRO = {
  name: 'YouTuber — Introduction & Embed Permission (Primary)',
  type: 'youtuber',
  subject: 'Quick note — {{channelName}} on DownRange',
  previewText: 'Not a pitch. Just wanted to let you know.',
  body: `<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Hey {{firstName}},</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">My name is DJ. I've been building <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">DownRange</a> for the past several months — it's a free firearms and Second Amendment portal I put together because I think the community deserves something better than what's out there.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">The idea is simple: one place for breaking news, new releases, state laws, ammo prices, and — this is where you come in — creator content. I've got a video section on the site and I've already added {{channelName}} to it. Gun owners browsing DownRange can find your videos without fighting YouTube's algorithm.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">I'm not asking for anything. I just wanted to reach out personally rather than quietly embed your content without saying anything. If you'd rather not be on there, say the word and I'll take it down. No drama.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">That said — if you think your audience would find the site useful, feel free to mention it. And if you have five minutes to look at it and tell me what you'd do differently, I'd genuinely appreciate it. I'm still building this thing and outside perspective from people who actually know the space is worth more than anything.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;"><a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>

<p style="margin:0 0 6px;font-size:15px;color:#e5e7eb;">Thanks for what you do,</p>
<p style="margin:0;font-size:15px;color:#e5e7eb;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">DownRange — <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{channelName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const YOUTUBER_FOLLOWUP = {
  name: 'YouTuber — Follow-Up (14 Days)',
  type: 'youtuber',
  subject: 'Following up',
  previewText: 'Short one — just checking in.',
  body: `<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Hey {{firstName}},</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Sent you a note a couple weeks back about DownRange — just wanted to make sure it didn't get buried.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Your channel's already on the site at <a href="https://www.downrangeco.com/video" style="color:#C8922A;text-decoration:none;">downrangeco.com/video</a>. Just wanted to flag it in case it's useful — the site's been growing and I think your audience would like what we're building.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">No pressure on anything. If you ever want to chat about the project or have feedback, I'm around.</p>

<p style="margin:0 0 6px;font-size:15px;color:#e5e7eb;">— DJ</p>
<p style="margin:0;font-size:13px;color:#9ca3af;"><a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>`,
  variables: ['{{firstName}}','{{channelName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const YOUTUBER_COLLAB = {
  name: 'YouTuber — Deeper Collaboration Ask',
  type: 'youtuber',
  subject: 'Wanted to ask you something — {{channelName}}',
  previewText: 'Not a sponsorship. Something different.',
  body: `<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Hey {{firstName}},</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">I've been building <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">DownRange</a> — a free Second Amendment intelligence portal — and I've followed your channel for a while. Your content is the kind of thing I want more of on the platform.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">I'm not going to pitch you a sponsorship or ask you to read an ad. What I'm actually interested in is whether there's a real collaboration here — something that's useful for both of us and for the community.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">A few ideas, none of them mandatory:</p>

<ul style="margin:0 0 16px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li>A dedicated creator page on DownRange — your channel, bio, latest content, all in one place</li>
  <li>If you've ever wanted to publish a written piece somewhere, the platform is open to you</li>
  <li>Cross-promotion to a growing audience of gun owners who are already there for the 2A content</li>
</ul>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Or none of that and just a mention if you ever think your viewers would get something out of it. I'm flexible.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Worth a conversation if you're interested: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>

<p style="margin:0 0 6px;font-size:15px;color:#e5e7eb;">Appreciate your time,</p>
<p style="margin:0;font-size:15px;color:#e5e7eb;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{channelName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

// ─────────────────────────────────────────────────────────────────────────────
// SET 2 — COMMUNITY & BUSINESS
// ─────────────────────────────────────────────────────────────────────────────

const SHOP_INTRO = {
  name: 'Gun Shop & FFL — Introduction',
  type: 'gun_shop',
  subject: 'Something I built that might be useful for {{businessName}}',
  previewText: 'Free resource for gun shops — no catch.',
  body: `<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">My name is DJ Cavalcanti. I'm a Second Amendment advocate based in Washington state and I've been building <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">DownRange</a> — a free firearms intelligence portal for the gun community.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">The goal was to build something that actually keeps gun owners, dealers, and instructors current — ATF updates, new manufacturer releases, state law changes, ammo prices. The kind of stuff that comes up at the counter every single day.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">I'd love for {{businessName}} to know about it. A business card on the counter, a mention to customers, or just bookmarking it yourself — whatever makes sense. There's nothing to sign up for and nothing to pay.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">A couple of other things: if you ever want to write something for the site — a perspective on your local market, a breakdown of a law that's affecting your customers in {{state}}, anything — I'd genuinely want to publish it under your name. Same if you come across a story worth covering and want to tip us off.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Take a look when you have a minute: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a>. And if you have thoughts on what's missing, I want to hear them.</p>

<p style="margin:0 0 6px;font-size:15px;color:#e5e7eb;">Thanks for your time,</p>
<p style="margin:0;font-size:15px;color:#e5e7eb;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{businessName}}','{{state}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const INSTRUCTOR_INTRO = {
  name: 'NRA Instructor — Introduction',
  type: 'instructor',
  subject: 'Built something your students will probably ask about',
  previewText: 'Free 2A resource — and an open invitation to write for us.',
  body: `<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">My name is DJ Cavalcanti. I'm a gun owner and Second Amendment advocate in Washington state, and I've spent the last several months building <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">DownRange</a> — a free portal for the firearms community.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">It covers the stuff your students are going to ask you about: what's changing in {{state}}, new ATF rules, CCW and carry law updates, new gear, training resources. I built a Learning Center specifically for new gun owners — the kind of thing you could point a student to after class and know they'd get accurate information.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">I'm reaching out to instructors directly because you're the people I actually want involved. If you ever want to write for the site — your take on responsible carry, a breakdown of a law that came up in your class, anything you think gun owners in {{state}} need to understand — the platform is open to you. Full credit, your name on it.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">No obligation. Just wanted you to know it exists and that the door is open: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>

<p style="margin:0 0 6px;font-size:15px;color:#e5e7eb;">Stay safe,</p>
<p style="margin:0;font-size:15px;color:#e5e7eb;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{state}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const ORGANIZATION_INTRO = {
  name: 'Range / Organization / Advocate — Introduction',
  type: 'organization',
  subject: 'DownRange — wanted to introduce myself',
  previewText: 'Building something for the 2A community in {{state}}. Open to talking.',
  body: `<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">My name is DJ Cavalcanti. I've been building <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">DownRange</a> — a free Second Amendment and firearms intelligence portal — and I wanted to reach out to organizations doing real work in {{state}}.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">The platform covers breaking news, legislation, court decisions, new releases, state law breakdowns, and community resources. The whole thing is free and the goal is simple: keep gun owners and advocates educated and connected.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">I'm not looking for anything in particular — just wanted to introduce myself and see if there's any common ground. A few things that have come up with other organizations:</p>

<ul style="margin:0 0 16px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li>Sharing the site with your members as a resource</li>
  <li>Contributing content — if there's a legal issue, a campaign, or a local story worth covering in {{state}}, we want to know about it</li>
  <li>Co-promotion when it makes sense for both sides</li>
</ul>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">No pressure. Take a look and let me know if any of it resonates: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>

<p style="margin:0 0 6px;font-size:15px;color:#e5e7eb;">With respect,</p>
<p style="margin:0;font-size:15px;color:#e5e7eb;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{businessName}}','{{state}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const GENERIC_FOLLOWUP = {
  name: 'All — Follow-Up (14 Days)',
  type: 'follow_up',
  subject: 'Following up',
  previewText: 'One question — genuinely curious what you think.',
  body: `<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Reached out a couple weeks ago about DownRange — just checking in.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">One honest question: what's missing in firearms media right now that you'd actually use? Not a survey — genuinely curious what someone in your position needs that isn't out there.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">One line is fine. Either way, the site's at <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a> if you haven't looked yet.</p>

<p style="margin:0 0 6px;font-size:15px;color:#e5e7eb;">— DJ</p>
<p style="margin:0;font-size:13px;color:#9ca3af;">DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>`,
  variables: ['{{firstName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}


const MANUFACTURER_INTRO = {
  name: 'Manufacturer — Partnership & Press Coverage',
  type: 'organization',
  subject: 'DownRange — covering {{businessName}} releases to gun owners nationwide',
  previewText: 'We cover your new releases. Wanted to introduce ourselves.',
  body: `<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Hi {{firstName}},</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">My name is DJ Cavalcanti. I run <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">DownRange</a> — a free firearms intelligence portal that covers new releases, industry news, legislation, and market data for gun owners across the country.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">We're already covering {{businessName}} releases through our automated press feed, but I wanted to reach out directly because I think there's more we can do together.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">A few things that might be useful:</p>

<ul style="margin:0 0 16px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li>If you have press releases, new product launches, or announcements you want covered, send them directly to us — we'll publish them to our audience of gun owners and dealers</li>
  <li>We can feature {{businessName}} in our Releases section with photos, full specs, and a link back to your product page</li>
  <li>If you have a media contact or PR rep we should be in touch with, I'd appreciate the introduction</li>
</ul>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">No paid placement, no strings attached — we cover what's relevant to gun owners and dealers, and that means covering what you build.</p>

<p style="margin:0 0 16px;font-size:15px;color:#e5e7eb;line-height:1.8;">Take a look at what we've built and let me know if there's a conversation worth having: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>

<p style="margin:0 0 6px;font-size:15px;color:#e5e7eb;">Thanks for your time,</p>
<p style="margin:0;font-size:15px;color:#e5e7eb;"><strong>DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{businessName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const ALL_TEMPLATES = [
  YOUTUBER_INTRO, YOUTUBER_FOLLOWUP, YOUTUBER_COLLAB,
  SHOP_INTRO, INSTRUCTOR_INTRO, ORGANIZATION_INTRO, MANUFACTURER_INTRO, GENERIC_FOLLOWUP,
]

// ─────────────────────────────────────────────────────────────────────────────
// TOP FIREARMS YOUTUBERS
// ─────────────────────────────────────────────────────────────────────────────

const YOUTUBER_LIST = [
  { name:'hickok45',                firstName:'Greg',      youtubeUrl:'https://www.youtube.com/@hickok45',              subscribers:8100000, tags:['mega','reviews','classic','family-friendly'] },
  { name:'Garand Thumb',            firstName:'Mike',      youtubeUrl:'https://www.youtube.com/@GarandThumb',           subscribers:4500000, tags:['mega','military','reviews','tactics'] },
  { name:'Edwin Sarkissian',        firstName:'Edwin',     youtubeUrl:'https://www.youtube.com/@EdwinSarkissian',       subscribers:5400000, tags:['mega','entertainment','destruction'] },
  { name:'Forgotten Weapons',       firstName:'Ian',       youtubeUrl:'https://www.youtube.com/@ForgottenWeapons',      subscribers:3100000, tags:['mega','history','rare-guns','education'] },
  { name:'Colion Noir',             firstName:'Colion',    youtubeUrl:'https://www.youtube.com/@ColionNoir',            subscribers:3200000, tags:['mega','2A-advocacy','legal','NRA'] },
  { name:'Warrior Poet Society',    firstName:'John',      youtubeUrl:'https://www.youtube.com/@WarriorPoetSociety',    subscribers:2800000, tags:['mega','tactics','CCW','faith','military'] },
  { name:'Kentucky Ballistics',     firstName:'Scott',     youtubeUrl:'https://www.youtube.com/@KentuckyBallistics',   subscribers:2000000, tags:['mega','ballistics','destruction','testing'] },
  { name:'IraqVeteran8888',         firstName:'Eric',      youtubeUrl:'https://www.youtube.com/@IraqVeteran8888',       subscribers:2100000, tags:['mega','military','reviews','2A'] },
  { name:'Paul Harrell',            firstName:'Paul',      youtubeUrl:'https://www.youtube.com/@PaulHarrell',           subscribers:1100000, tags:['mega','reviews','practical','methodology'] },
  { name:'Sootch00',                firstName:'Don',       youtubeUrl:'https://www.youtube.com/@sootch00',              subscribers:1500000, tags:['mega','reviews','survival','EDC'] },
  { name:'Military Arms Channel',   firstName:'Tim',       youtubeUrl:'https://www.youtube.com/@MilitaryArmsChannel',   subscribers:1200000, tags:['mega','reviews','AR','AK','NFA'] },
  { name:'Polenar Tactical',        firstName:'Ziga',      youtubeUrl:'https://www.youtube.com/@PolenarTactical',       subscribers:1100000, tags:['mega','tactics','professional'] },
  { name:'MrGunsNGear',             firstName:'Brian',     youtubeUrl:'https://www.youtube.com/@MrGunsNGear',           subscribers:900000,  tags:['macro','reviews','EDC','gear'] },
  { name:'Backfire',                firstName:'Jim',       youtubeUrl:'https://www.youtube.com/@BackfireOfficial',      subscribers:850000,  tags:['macro','hunting','outdoors','2A','legal'] },
  { name:'Guns & Gadgets',          firstName:'Jared',     youtubeUrl:'https://www.youtube.com/@GunsGadgets',           subscribers:774000,  tags:['macro','2A-news','legislation','ATF'] },
  { name:'The Yankee Marshal',      firstName:'Yankee',    youtubeUrl:'https://www.youtube.com/@TheYankeeMarshal',      subscribers:700000,  tags:['macro','reviews','CCW','opinion'] },
  { name:'TFBTV',                   firstName:'Alex',      youtubeUrl:'https://www.youtube.com/@TFBTV',                 subscribers:650000,  tags:['macro','reviews','no-politics','industry'] },
  { name:'Lucky Gunner',            firstName:'Chris',     youtubeUrl:'https://www.youtube.com/@LuckyGunner',           subscribers:580000,  tags:['macro','ammo','ballistics','data'] },
  { name:'Honest Outlaw',           firstName:'Stephen',   youtubeUrl:'https://www.youtube.com/@HonestOutlaw',          subscribers:500000,  tags:['macro','reviews','honest'] },
  { name:'Pew Pew Tactical',        firstName:'Eric',      youtubeUrl:'https://www.youtube.com/@PewPewTactical',        subscribers:400000,  tags:['macro','beginners','reviews','EDC'] },
  { name:'Reid Henrichs',           firstName:'Reid',      youtubeUrl:'https://www.youtube.com/@ValorRidge',            subscribers:350000,  tags:['macro','training','history','2A'] },
  { name:'Tactical Hyve',           firstName:'John',      youtubeUrl:'https://www.youtube.com/@TacticalHyve',          subscribers:320000,  tags:['macro','Glock','mods','upgrades'] },
  { name:'Armed and Styled',        firstName:'Robyn',     youtubeUrl:'https://www.youtube.com/@ArmedAndStyled',        subscribers:180000,  tags:['micro','women','CCW'] },
  { name:'2A Entertainment',        firstName:'Brandon',   youtubeUrl:'https://www.youtube.com/@2AEntertainment',       subscribers:230000,  tags:['macro','reviews','2A'] },
  {
    name: 'Washington Gun Law',
    firstName: 'William',
    youtubeUrl: 'https://www.youtube.com/@WashingtonGunLaw',
    website: 'https://www.washingtongunlaw.com',
    state: 'WA',
    city: 'Spokane',
    subscribers: 400000,
    tags: ['macro','2A-law','attorney','washington','legislation','CCW','self-defense'],
    notes: 'William Kirk — 2A attorney, 20x Washington Super Lawyer, President of Washington Gun Law. Covers WA state gun laws, national 2A issues, self-defense law. Based in WA — strong alignment with DownRange mission and geography.',
  },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const action = new URL(req.url).searchParams.get('action') || 'all'
  const results = { templates: { created:0, skipped:0, updated:0 }, contacts: { created:0, skipped:0 } }

  // ── Templates: delete old versions and reseed fresh ─────────────────────────
  if (action === 'all' || action === 'templates') {
    for (const tmpl of ALL_TEMPLATES) {
      const existing = await sanity.fetch(
        `*[_type == "outreachTemplate" && name == $name][0]._id`,
        { name: tmpl.name }
      )
      if (existing) {
        await sanity.patch(existing).set({ ...tmpl }).commit()
        results.templates.updated++
      } else {
        await sanity.create({ _type: 'outreachTemplate', ...tmpl, isActive: true, createdAt: new Date().toISOString() })
        results.templates.created++
      }
    }
  }

  // ── YouTuber contacts ───────────────────────────────────────────────────────
  if (action === 'all' || action === 'contacts') {
    for (const yt of YOUTUBER_LIST) {
      const existing = await sanity.fetch(
        `*[_type == "outreachContact" && youtubeUrl == $url][0]._id`,
        { url: yt.youtubeUrl }
      )
      if (existing) { results.contacts.skipped++; continue }
      await sanity.create({
        _type: 'outreachContact',
        type: 'youtuber',
        status: 'active',
        source: 'youtube_scrape',
        country: 'USA',
        emailPermission: false,
        addedAt: new Date().toISOString(),
        ...yt,
      })
      results.contacts.created++
      await new Promise(r => setTimeout(r, 150))
    }
  }

  return Response.json({
    ok: true,
    templates: { ...results.templates, total: ALL_TEMPLATES.length },
    contacts:  { ...results.contacts,  total: YOUTUBER_LIST.length },
    message: `Templates: ${results.templates.created} created, ${results.templates.updated} updated. Contacts: ${results.contacts.created} added, ${results.contacts.skipped} skipped.`
  })
}
