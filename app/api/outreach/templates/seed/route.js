export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// ─────────────────────────────────────────────────────────────────────────────
// SET 1: YOUTUBER TEMPLATES (3 versions — A/B/C for testing)
// ─────────────────────────────────────────────────────────────────────────────

const YOUTUBER_INTRO = {
  name: 'YouTuber — Introduction & Embed Permission (Version A)',
  type: 'youtuber',
  subject: 'Quick note from a fellow 2A advocate — {{channelName}}',
  previewText: 'Built a platform to amplify creators like you — wanted to reach out personally.',
  body: `<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;">Hey {{firstName}},</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">My name is DJ Cavalcanti. I run <strong style="color:#C8922A;">DownRange</strong> — a firearms and Second Amendment intelligence hub I built from scratch because I believe the community deserves a dedicated platform that isn't afraid to cover what we care about.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">The mission is simple: <strong style="color:#C8922A;">grow the Second Amendment and firearms community across America</strong> by putting real intelligence — breaking news, new releases, state laws, market data, and creator content — all in one place, built specifically for gun owners.</p>

<p style="margin:0 0 12px;font-size:14px;color:#C8922A;font-weight:700;letter-spacing:0.04em;">WHAT MAKES DOWNRANGE DIFFERENT</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2;">
  <li>We don't sanitize the Second Amendment to appease advertisers</li>
  <li>Daily intelligence briefings — ATF rulings, legislation, court decisions — as they happen</li>
  <li>A Video section built specifically to surface great firearms creators like you</li>
  <li>Free for every gun owner, dealer, instructor, and advocate in the country</li>
</ul>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I've added <strong style="color:#C8922A;">{{channelName}}</strong> to our Video section because your content is exactly what this community needs more of. Visitors browsing DownRange can now discover your channel through a platform that YouTube can't suppress.</p>

<p style="margin:0 0 12px;font-size:14px;color:#C8922A;font-weight:700;letter-spacing:0.04em;">A FEW THINGS I WANT TO CONFIRM WITH YOU</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2;">
  <li>I feature your channel with full credit — your name, profile, and a direct link back to YouTube</li>
  <li>No monetization on my end from your content — it's purely a discovery tool for your audience</li>
  <li>If you want it removed, just reply and it's done, no questions asked</li>
</ul>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">If you think your viewers would find DownRange useful, feel free to mention it in a video or link it in your description. We're building something real here and the more of the community knows about it, the stronger it gets.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">Either way — I'd love your honest feedback on the site: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a>. What would make it more useful for someone in your position?</p>

<p style="margin:0 0 8px;font-size:15px;color:#e5e7eb;">Keep up the great work,</p>
<p style="margin:0;font-size:15px;"><strong style="color:#e5e7eb;">DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder — DownRange Intelligence Hub<br>
<a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{channelName}}','{{subscribers}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const YOUTUBER_FOLLOWUP = {
  name: 'YouTuber — Follow-Up (14 Days)',
  type: 'youtuber',
  subject: 'Following up — {{channelName}} on DownRange',
  previewText: "Just making sure my last note landed — quick question about your content.",
  body: `<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;">Hey {{firstName}},</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I reached out a couple weeks ago about featuring <strong style="color:#C8922A;">{{channelName}}</strong> on DownRange — wanted to make sure it didn't get lost in the shuffle.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">The short version: I built a free firearms intelligence portal at <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a> and your channel is already featured in our Video section. It's genuinely a better home for your content than YouTube's algorithm-suppressed search results.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">One specific ask: if you're comfortable with it and think your audience would appreciate the resource, a shoutout or a link in your description would mean a lot. We're a small operation but growing fast, and every mention from a trusted voice in the community helps.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">And if you have any feedback on the site — what's missing, what could be better — I'm genuinely listening.</p>

<p style="margin:0 0 8px;font-size:15px;color:#e5e7eb;">Thanks for what you do,</p>
<p style="margin:0;font-size:15px;"><strong style="color:#e5e7eb;">DJ</strong><br>
<span style="color:#9ca3af;font-size:13px;">DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{channelName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const YOUTUBER_COLLAB = {
  name: 'YouTuber — Deep Collaboration Pitch',
  type: 'youtuber',
  subject: '{{channelName}} × DownRange — a collaboration worth talking about',
  previewText: 'More than just a feature — a real partnership for the 2A community.',
  body: `<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;">Hey {{firstName}},</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I've been following <strong style="color:#C8922A;">{{channelName}}</strong> for a while and wanted to reach out about something more than just a feature mention.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I built <strong style="color:#C8922A;">DownRange</strong> as a dedicated Second Amendment intelligence platform. The goal is to give the firearms community — gun owners, instructors, dealers, and advocates — a home that isn't dependent on platforms that don't share our values.</p>

<p style="margin:0 0 12px;font-size:14px;color:#C8922A;font-weight:700;letter-spacing:0.04em;">WHAT I'M PROPOSING</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li><strong style="color:#e5e7eb;">Your own creator page</strong> on DownRange — featured content, bio, links, and your latest videos all in one place</li>
  <li><strong style="color:#e5e7eb;">Cross-promotion</strong> — we push your content to our growing audience of gun owners and 2A advocates</li>
  <li><strong style="color:#e5e7eb;">Content partnership</strong> — if you ever want to publish written articles, op-eds, or gear reviews on DownRange, the platform is open to you</li>
  <li><strong style="color:#e5e7eb;">Community access</strong> — early access to our upcoming features and a voice in what we build next</li>
</ul>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">This isn't a pitch to sell you advertising. I'm building a platform that serves the community and I want the best voices in it. You're one of them.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">Take a look at what we've built: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a> — and if it resonates, reply and let's talk.</p>

<p style="margin:0 0 8px;font-size:15px;color:#e5e7eb;">Respect,</p>
<p style="margin:0;font-size:15px;"><strong style="color:#e5e7eb;">DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder — DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{channelName}}','{{subscribers}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

// ─────────────────────────────────────────────────────────────────────────────
// SET 2: COMMUNITY / BUSINESS TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const SHOP_INTRO = {
  name: 'Gun Shop & FFL — Introduction & Collaboration',
  type: 'gun_shop',
  subject: 'DownRange — built for the firearms community in {{state}}',
  previewText: 'A free intelligence hub your customers are already looking for.',
  body: `<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;">Hi {{firstName}},</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">My name is DJ Cavalcanti. I'm a Second Amendment advocate and I just launched <strong style="color:#C8922A;">DownRange</strong> — a free firearms intelligence platform built to grow the gun community across America.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">The mission: give gun owners, dealers, instructors, and advocates like yourself one authoritative place for everything that matters — breaking news, ATF updates, new releases, state laws, market data, and community resources. All in one place, with no agenda except the Second Amendment.</p>

<p style="margin:0 0 12px;font-size:14px;color:#C8922A;font-weight:700;letter-spacing:0.04em;">WHY IT MATTERS FOR {{businessName}}</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li>Your customers are going to walk in asking about the latest ATF ruling or a new model they saw online — DownRange keeps you ahead of those questions</li>
  <li>We cover {{state}}-specific laws, pending legislation, and carry rights as they change</li>
  <li>New manufacturer releases with full specs and MSRP — Glock, SIG, Ruger, S&W, and 30+ more — published the day they drop</li>
  <li>Ammo market data and deal tracking so you can advise customers on pricing</li>
</ul>

<p style="margin:0 0 12px;font-size:14px;color:#C8922A;font-weight:700;letter-spacing:0.04em;">HOW WE CAN WORK TOGETHER</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li><strong style="color:#e5e7eb;">Share DownRange with your customers</strong> — a simple card, sticker, or mention at the counter goes a long way</li>
  <li><strong style="color:#e5e7eb;">Write for us</strong> — if you have expertise on local regulations, gear, or the business of firearms retail, we'd love to publish your perspective</li>
  <li><strong style="color:#e5e7eb;">Submit news or tips</strong> — you're on the ground. If you see something worth covering, we want to hear it</li>
</ul>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">No cost, no commitment. Just a resource built for people like you: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I'd genuinely love your feedback — what would make this more useful for a shop in {{state}}?</p>

<p style="margin:0 0 8px;font-size:15px;color:#e5e7eb;">Stay in the fight,</p>
<p style="margin:0;font-size:15px;"><strong style="color:#e5e7eb;">DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder — DownRange Intelligence Hub<br>
<a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{businessName}}','{{state}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const INSTRUCTOR_INTRO = {
  name: 'NRA Instructor — Community Resource & Contribution',
  type: 'instructor',
  subject: 'Built for instructors in {{state}} — DownRange',
  previewText: 'Your students are already asking the questions we answer. Keep reading.',
  body: `<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;">Hi {{firstName}},</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I'm DJ Cavalcanti, and I wanted to reach out directly to instructors in {{state}} about a resource I built for our community.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;"><strong style="color:#C8922A;">DownRange</strong> is a free Second Amendment intelligence platform. The purpose is straightforward: grow the firearms community by giving everyone in it — from first-time buyers to seasoned instructors like you — one trustworthy place to stay informed.</p>

<p style="margin:0 0 12px;font-size:14px;color:#C8922A;font-weight:700;letter-spacing:0.04em;">WHAT YOUR STUDENTS ARE ALREADY ASKING ABOUT</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li>{{state}} carry laws, permit requirements, and reciprocity — updated in real time</li>
  <li>ATF rule changes and how they affect their firearms</li>
  <li>New gear releases, training resources, and beginner guides</li>
  <li>Pending legislation that could affect their rights</li>
</ul>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">As an instructor, you're one of the most trusted voices in the community. When your students walk out of class with a DownRange bookmark, they have a resource that keeps them educated long after the course ends.</p>

<p style="margin:0 0 12px;font-size:14px;color:#C8922A;font-weight:700;letter-spacing:0.04em;">COLLABORATE WITH US</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li><strong style="color:#e5e7eb;">Write for DownRange</strong> — your expertise on safety, technique, legal carry, or training methodology is exactly what our audience needs. We'll publish it under your name with full credit</li>
  <li><strong style="color:#e5e7eb;">Share it with your students</strong> — the Learning Center covers everything a new gun owner needs to know</li>
  <li><strong style="color:#e5e7eb;">Send us tips</strong> — if there's a regulatory change in {{state}} we should cover, tell us</li>
</ul>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">Take a look and let me know what you think: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a>. I'd love your honest feedback — especially on anything we're missing for instructors in {{state}}.</p>

<p style="margin:0 0 8px;font-size:15px;color:#e5e7eb;">Semper Paratus,</p>
<p style="margin:0;font-size:15px;"><strong style="color:#e5e7eb;">DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder — DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{state}}','{{specialties}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const ORGANIZATION_INTRO = {
  name: 'Range / Organization / Advocate — Partnership Outreach',
  type: 'organization',
  subject: 'DownRange — a Second Amendment platform worth knowing about',
  previewText: 'Growing the firearms community in {{state}} — open to collaboration.',
  body: `<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;">Hi {{firstName}},</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I'm DJ Cavalcanti — Second Amendment advocate and founder of <strong style="color:#C8922A;">DownRange</strong>, a free firearms intelligence platform built to serve and grow the gun community across America.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">Our mission aligns directly with yours: <strong style="color:#e5e7eb;">protect and expand the Second Amendment community</strong> by keeping gun owners educated, informed, and connected. DownRange covers breaking news, legislation, new releases, state laws, market data, and training resources — all free, all unapologetically pro-2A.</p>

<p style="margin:0 0 12px;font-size:14px;color:#C8922A;font-weight:700;letter-spacing:0.04em;">WHY I'M REACHING OUT</p>
<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">Organizations like yours are the backbone of the Second Amendment community. I'd like to explore how DownRange can support your mission — and how we can support each other.</p>

<ul style="margin:0 0 18px;padding-left:20px;color:#d1d5db;font-size:14px;line-height:2.2;">
  <li><strong style="color:#e5e7eb;">Share DownRange with your members and network</strong> — it's a resource they'll use daily</li>
  <li><strong style="color:#e5e7eb;">Write or submit content</strong> — op-eds, legal updates, event coverage, advocacy pieces — we want your voice on the platform</li>
  <li><strong style="color:#e5e7eb;">Co-promote</strong> — if you're running events, campaigns, or initiatives that align with growing the 2A community, let us help amplify them</li>
  <li><strong style="color:#e5e7eb;">Send tips</strong> — you're on the front lines. If there's a story, a legislative threat, or a community issue in {{state}} we should cover, reach out</li>
</ul>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">No money involved, no corporate agenda. Just people who care about the Second Amendment building something that lasts: <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I'd love your feedback and to hear what you're working on in {{state}}.</p>

<p style="margin:0 0 8px;font-size:15px;color:#e5e7eb;">With respect,</p>
<p style="margin:0;font-size:15px;"><strong style="color:#e5e7eb;">DJ Cavalcanti</strong><br>
<span style="color:#9ca3af;font-size:13px;">Founder — DownRange Intelligence Hub<br>
<a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{businessName}}','{{state}}','{{cityState}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const GENERIC_FOLLOWUP = {
  name: 'All — Follow-Up (14 Days, No Response)',
  type: 'follow_up',
  subject: 'Quick follow-up — DownRange',
  previewText: "Checking in — one question for you.",
  body: `<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;">Hi {{firstName}},</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">I reached out a couple weeks ago about DownRange and wanted to follow up briefly.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">We're a free Second Amendment intelligence platform — <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a> — built to keep the firearms community educated and connected. Growing fast.</p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">One honest question: <strong style="color:#C8922A;">what's missing in the firearms media landscape that would actually be useful to you?</strong></p>

<p style="margin:0 0 18px;font-size:15px;color:#e5e7eb;line-height:1.7;">Even a one-line reply helps us build something better. No pressure either way.</p>

<p style="margin:0 0 8px;font-size:15px;color:#e5e7eb;">Thanks,</p>
<p style="margin:0;font-size:15px;"><strong style="color:#e5e7eb;">DJ</strong><br>
<span style="color:#9ca3af;font-size:13px;">DownRange · <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;">downrangeco.com</a></span></p>`,
  variables: ['{{firstName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const ALL_TEMPLATES = [
  YOUTUBER_INTRO, YOUTUBER_FOLLOWUP, YOUTUBER_COLLAB,
  SHOP_INTRO, INSTRUCTOR_INTRO, ORGANIZATION_INTRO, GENERIC_FOLLOWUP,
]

// ─────────────────────────────────────────────────────────────────────────────
// TOP FIREARMS YOUTUBERS CONTACT LIST
// ─────────────────────────────────────────────────────────────────────────────

const YOUTUBER_LIST = [
  { name:'hickok45',                firstName:'Greg',      youtubeUrl:'https://www.youtube.com/@hickok45',              youtubeChannel:'UCvB3solmhbLToxE_hg-O8Qw', subscribers:8100000, tags:['mega','reviews','classic','family-friendly'] },
  { name:'Garand Thumb',            firstName:'Mike',      youtubeUrl:'https://www.youtube.com/@GarandThumb',           youtubeChannel:'UCdS0ZuTUoJG9bLLfO_2pFjQ', subscribers:4500000, tags:['mega','military','reviews','tactics','fitness'] },
  { name:'Forgotten Weapons',       firstName:'Ian',       youtubeUrl:'https://www.youtube.com/@ForgottenWeapons',      youtubeChannel:'UCrfKGpvbEQXcbe68dzXgJuA', subscribers:3100000, tags:['mega','history','rare-guns','education'] },
  { name:'Colion Noir',             firstName:'Colion',    youtubeUrl:'https://www.youtube.com/@ColionNoir',            youtubeChannel:'UCOSBVfbKFk5rN8qJYpBYjwQ', subscribers:3200000, tags:['mega','2A-advocacy','legal','NRA'] },
  { name:'Warrior Poet Society',    firstName:'John',      youtubeUrl:'https://www.youtube.com/@WarriorPoetSociety',    youtubeChannel:'UCEQxe7hB3O-0i11pBsqJ1Sg', subscribers:2800000, tags:['mega','tactics','CCW','faith','military'] },
  { name:'Sootch00',                firstName:'Don',       youtubeUrl:'https://www.youtube.com/@sootch00',              youtubeChannel:'UCHWRbypJa1b0ZGHbqTXi6vg', subscribers:1500000, tags:['mega','reviews','survival','EDC'] },
  { name:'Military Arms Channel',   firstName:'Tim',       youtubeUrl:'https://www.youtube.com/@MilitaryArmsChannel',   youtubeChannel:'UCZ6EBqbJcmkrQNhNe6Y4Rcg', subscribers:1200000, tags:['mega','reviews','AR','AK','NFA'] },
  { name:'Lucky Gunner',            firstName:'Chris',     youtubeUrl:'https://www.youtube.com/@LuckyGunner',           youtubeChannel:'UCzY-T6nGiO4wkOWQOb1BVDQ', subscribers:580000,  tags:['macro','ammo','ballistics','testing'] },
  { name:'MrGunsNGear',             firstName:'Brian',     youtubeUrl:'https://www.youtube.com/@MrGunsNGear',           youtubeChannel:'UCmte6KSl_SBa_IzX9yPqPEQ', subscribers:900000,  tags:['macro','reviews','EDC','gear'] },
  { name:'Guns & Gadgets 2nd Amendment News', firstName:'Jared', youtubeUrl:'https://www.youtube.com/@GunsGadgets', youtubeChannel:'UC_JUj6LZM9QMZB8BM1Cj3NQ', subscribers:774000,  tags:['macro','2A-news','legislation','ATF'] },
  { name:'Paul Harrell',            firstName:'Paul',      youtubeUrl:'https://www.youtube.com/@PaulHarrell',           youtubeChannel:'UCp36X0VJPGR5NRfEnIMvLwg', subscribers:1100000, tags:['mega','reviews','practical','methodology'] },
  { name:'IraqVeteran8888',         firstName:'Eric',      youtubeUrl:'https://www.youtube.com/@IraqVeteran8888',       youtubeChannel:'UCIOGCEG14WXJPnQqmBVF42A', subscribers:2100000, tags:['mega','military','reviews','2A'] },
  { name:'Kentucky Ballistics',     firstName:'Scott',     youtubeUrl:'https://www.youtube.com/@KentuckyBallistics',    youtubeChannel:'UCKbHJfEWNYnLJlY4xBzLbcg', subscribers:2000000, tags:['mega','ballistics','destruction','testing'] },
  { name:'Edwin Sarkissian',        firstName:'Edwin',     youtubeUrl:'https://www.youtube.com/@EdwinSarkissian',       youtubeChannel:'UCIOGCEG14WXJPnQqmBVF42A', subscribers:5400000, tags:['mega','entertainment','destruction'] },
  { name:'TFBTV',                   firstName:'Alex',      youtubeUrl:'https://www.youtube.com/@TFBTV',                 youtubeChannel:'UCnKbs5xffYPFcnBkINJuRQw', subscribers:650000,  tags:['macro','reviews','no-politics','industry'] },
  { name:'Pew Pew Tactical',        firstName:'Eric',      youtubeUrl:'https://www.youtube.com/@PewPewTactical',        youtubeChannel:'UCKbHJfEWNYnLJlY4xBzLbcg', subscribers:400000,  tags:['macro','beginners','reviews','EDC'] },
  { name:'The Yankee Marshal',      firstName:'Yankee',    youtubeUrl:'https://www.youtube.com/@TheYankeeMarshal',      youtubeChannel:'UCv6IEfBZfnVJmDpvLwJaAuQ', subscribers:700000,  tags:['macro','reviews','CCW','opinion'] },
  { name:'Honest Outlaw',           firstName:'Stephen',   youtubeUrl:'https://www.youtube.com/@HonestOutlaw',          youtubeChannel:'UCY5LBt77-wSE19kO_oGX8nA', subscribers:500000,  tags:['macro','reviews','honest','comparison'] },
  { name:'Backfire',                firstName:'Jim',       youtubeUrl:'https://www.youtube.com/@BackfireOfficial',      youtubeChannel:'UCbWaZEwMJUMjwqJlz5EHakA', subscribers:850000,  tags:['macro','hunting','outdoors','2A','legal'] },
  { name:'Tactical Hyve',           firstName:'John',      youtubeUrl:'https://www.youtube.com/@TacticalHyve',          youtubeChannel:'UC7Z6XjMi2VEWRZ_6GJoaS1g', subscribers:320000,  tags:['macro','Glock','mods','upgrades'] },
  { name:'Polenar Tactical',        firstName:'Ziga',      youtubeUrl:'https://www.youtube.com/@PolenarTactical',       youtubeChannel:'UCHpMoFf6FW8mBDHfDfnCBhg', subscribers:1100000, tags:['mega','tactics','European','professional'] },
  { name:'Reid Henrichs (Valor Ridge)', firstName:'Reid',  youtubeUrl:'https://www.youtube.com/@ValorRidge',            youtubeChannel:'UCeIWFiCKBPDCwi3nUbxjcAQ', subscribers:350000,  tags:['macro','training','history','2A'] },
  { name:'Chris Baker (LuckyGunner Labs)', firstName:'Chris', youtubeUrl:'https://www.youtube.com/@LuckyGunner',        youtubeChannel:'UCzY-T6nGiO4wkOWQOb1BVDQ', subscribers:580000,  tags:['macro','science','ammo','data'] },
  { name:'Armed and Styled',        firstName:'Robyn',     youtubeUrl:'https://www.youtube.com/@ArmedAndStyled',        youtubeChannel:'UCeDNVdlpfF7RLy3Ss1BGUBQ', subscribers:180000,  tags:['micro','women','CCW','fashion'] },
  { name:'2A Entertainment',        firstName:'Brandon',   youtubeUrl:'https://www.youtube.com/@2AEntertainment',       youtubeChannel:'UC8-B4Ij7Y5k1kZ8gp3K2VwQ', subscribers:230000,  tags:['macro','reviews','entertainment','2A'] },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const action = new URL(req.url).searchParams.get('action') || 'all'
  const results = { templates: { created:0, skipped:0 }, contacts: { created:0, skipped:0 } }

  // ── Seed templates ──────────────────────────────────────────────────────────
  if (action === 'all' || action === 'templates') {
    for (const tmpl of ALL_TEMPLATES) {
      const exists = await sanity.fetch(`*[_type == "outreachTemplate" && name == $name][0]._id`, { name: tmpl.name })
      if (exists) { results.templates.skipped++; continue }
      await sanity.create({ _type: 'outreachTemplate', ...tmpl, isActive: true, createdAt: new Date().toISOString() })
      results.templates.created++
    }
  }

  // ── Seed YouTuber contacts ─────────────────────────────────────────────────
  if (action === 'all' || action === 'contacts') {
    for (const yt of YOUTUBER_LIST) {
      const exists = await sanity.fetch(`*[_type == "outreachContact" && youtubeUrl == $url][0]._id`, { url: yt.youtubeUrl })
      if (exists) { results.contacts.skipped++; continue }
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
  })
}
