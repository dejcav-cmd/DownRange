export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// ── BRAND SHELL ────────────────────────────────────────────────────────────
const G='#C8922A',BG='#09090B',CARD='#0d0e10',TEXT='#e5e7eb',MUT='#9ca3af',BOR='#1f2428',DRK='#0A0B0C'
const LOGO='https://downrangeco.com/img/logo-banner.png'
const AV  ='https://downrangeco.com/img/dj-avatar.png'

const shell = (body, accent) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:${TEXT};-webkit-text-size-adjust:100%;">
<div style="max-width:640px;margin:0 auto;background:${BG};">
  <div style="height:4px;background:${accent||G};"></div>
  <div style="background:${DRK};padding:18px 36px 14px;border-bottom:1px solid ${BOR};">
    <img src="${LOGO}" alt="DownRange" width="160" height="auto" style="display:block;height:auto;max-height:42px;width:auto;max-width:180px;">
  </div>
  <div style="padding:40px;background:${CARD};">${body}</div>
  <div style="padding:20px 36px 24px;background:${DRK};border-top:1px solid ${BOR};">
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${BOR};padding-top:16px;margin-top:0;width:100%;"><tr>
      <td style="vertical-align:middle;padding-right:14px;width:60px;">
        <img src="${AV}" alt="DJ Cavalcanti" width="48" height="48" style="display:block;width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid ${G};">
      </td>
      <td style="vertical-align:middle;">
        <div style="font-size:14px;font-weight:700;color:${TEXT};margin-bottom:2px;">DJ Cavalcanti</div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Founder, DownRange</div>
        <a href="https://www.downrangeco.com" style="font-size:12px;color:${G};text-decoration:none;font-weight:600;">downrangeco.com</a>
      </td>
    </tr></table>
  </div>
  <div style="padding:12px 36px;background:${BG};text-align:center;">
    <p style="margin:0;font-size:10px;color:#374151;line-height:1.6;">
      You received this because you were added to the DownRange outreach list as a trusted creator or partner.
      &nbsp;<a href="{{unsubscribeUrl}}" style="color:#4b5563;text-decoration:none;">Unsubscribe</a>
    </p>
  </div>
</div></body></html>`

const p  = t => `<p style="margin:0 0 18px;font-size:15px;color:${TEXT};line-height:1.85;">${t}</p>`
const a  = (h,t) => `<a href="${h}" style="color:${G};text-decoration:none;font-weight:600;">${t}</a>`
const hr = () => `<div style="height:1px;background:${BOR};margin:24px 0;"></div>`
const hl = t => `<div style="padding:14px 18px;background:#111316;border-left:3px solid ${G};margin:20px 0;font-size:14px;color:#d1d5db;line-height:1.75;">${t}</div>`
const cta= (h,t) => `<div style="margin:28px 0 8px;"><a href="${h}" style="display:block;background:${G};color:#000;padding:14px 36px;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;text-align:center;">${t} &rarr;</a></div>`
const ul = items => `<ul style="margin:0 0 18px;padding-left:22px;">${items.map(i=>`<li style="margin-bottom:8px;font-size:14px;color:#d1d5db;line-height:1.75;">${i}</li>`).join('')}</ul>`

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBER TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const YOUTUBER_INTRO = {
  name: 'YouTuber — Introduction & Embed Permission (Primary)',
  type: 'youtuber',
  subject: 'DJ from DownRange — wanted to tell you directly',
  previewText: 'Built something for the 2A community. Your content is already part of it.',
  body: shell(`
<div style="text-align:center;padding:8px 0 32px;">
  <img src="${LOGO}" alt="DownRange" width="560" height="auto" style="display:inline-block;height:auto;max-height:68px;width:auto;max-width:100%;">
  <div style="height:1px;background:${G};width:80px;margin:20px auto 0;opacity:0.6;"></div>
</div>
${p(`Hey {{firstName}},`)}
${p(`My name is DJ Cavalcanti, founder of DownRange — a free Second Amendment intelligence portal built for gun owners who want real information: breaking 2A news updated every 15 minutes, all 50 states’ gun laws and CCW reciprocity, live ammo prices, NFA wait times, manufacturer releases, and NICS data. No ads, no manufacturer funding, no pay-to-play. Free for the community, always.`)}
${p(`I’m reaching out because <strong style="color:#C8922A;">{{channelName}} is already featured on DownRange</strong> through a dedicated creator profile and inclusion in our Video Hub, helping firearms enthusiasts discover your content alongside the news, resources, and tools they already use on the platform. I wanted you to hear about it directly rather than stumble across it later.`)}
${hl(`If you’d prefer not to have your content featured on DownRange, just let me know and I’ll respect that decision completely.`)}
${p(`That said, I’m also hoping this becomes the start of something more useful for both sides. A few things that could benefit us both:`)}
<div style="background:#111316;border-top:3px solid ${G};padding:20px 24px;margin:24px 0;">
  ${ul([
    `A dedicated creator profile on DownRange linking directly to your channel — helping firearms-focused users discover your content`,
    `Your videos featured in our Video Hub, in front of an audience actively looking for reviews, training, industry updates, and 2A content`,
    `A mention of DownRange as a free resource for 50-state gun laws, CCW reciprocity, live ammo pricing, NFA wait times, and firearms news — the kind of thing your audience actually uses`,
    `Sharing or referencing DownRange content when it aligns with topics you cover — we publish original 2A news, industry analysis, and legislative updates daily`,
  ])}
</div>
${p(`This is not a sponsorship request. I’m not asking you to promote something you don’t believe in. The audience that follows {{channelName}} is exactly who DownRange was built to serve — connecting them with quality creators and useful resources is the whole point.`)}
${cta('https://www.downrangeco.com','Visit DownRange')}
${hr()}
${p(`If you’d like to explore working together, I’d love to hear from you. Thank you for your time, and for everything you do for the firearms community.`)}
`),
  variables: ['{{firstName}}','{{channelName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}
const YOUTUBER_FOLLOWUP = {
  name: 'YouTuber — Follow-Up (14 Days)',
  type: 'youtuber',
  subject: 'Following up, {{firstName}}',
  previewText: "Sent you something two weeks ago — wanted to check in.",
  body: shell(`
${p(`Hey {{firstName}},`)}
${p(`Sent you a note a couple weeks back about DownRange — just making sure it didn't get buried.`)}
${p(`{{channelName}} is still on the site at ${a('https://www.downrangeco.com/video','downrangeco.com/video')}. Gun owners who use the platform find your content there without fighting the algorithm.`)}
${hl(`No pressure, no pitch. If you've been meaning to look and haven't had a chance — totally fine. I build things I'd want to exist and this is one of them.`)}
${p(`If you have questions or want to talk about the project: ${a('mailto:dj@downrangeco.com','dj@downrangeco.com')}`)}
${p(`— DJ`)}
`),
  variables: ['{{firstName}}','{{channelName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const YOUTUBER_COLLAB = {
  name: 'YouTuber — Deeper Collaboration Ask',
  type: 'youtuber',
  subject: '{{firstName}} — wanted to ask you something',
  previewText: "Not a sponsorship. Something actually worth your time.",
  body: shell(`
${p(`Hey {{firstName}},`)}
${p(`I've been building ${a('https://www.downrangeco.com','DownRange')} for the past several months — a free firearms and Second Amendment portal — and I've been following {{channelName}} for a while. Your content is exactly what I want more of on the platform.`)}
${p(`I'm not going to pitch you a sponsorship or ask you to read an ad. What I actually want to know is whether there's a real collaboration here — something useful for both of us and for the community.`)}
${p(`A few ideas, none of them mandatory:`)}
${ul([
  'A dedicated creator page on DownRange — your channel, bio, and latest content in one place',
  "If you've wanted to publish longer-form written pieces, the platform is open to you",
  'Cross-promotion to gun owners who are already there for 2A content',
  "Your honest take on what the platform is missing — your perspective is worth more than any focus group",
])}
${hl(`DownRange covers news, laws, releases, ammo prices, CCW info, and NFA data. The people reading it are the same people who watch {{channelName}}.`)}
${cta('https://www.downrangeco.com','Take a look')}
${p(`Or just reply. Either works.<br><br>DJ`)}
`),
  variables: ['{{firstName}}','{{channelName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

const MANUFACTURER_INTRO = {
  name: 'Manufacturer — Partnership & Press Coverage',
  type: 'organization',
  subject: '{{firstName}} — DownRange editorial & press coverage for {{businessName}}',
  previewText: "Independent firearms portal. No manufacturer funding. Editorial merit only.",
  body: shell(`
${p(`Hi {{firstName}},`)}
${p(`My name is DJ Cavalcanti. I'm the founder of ${a('https://www.downrangeco.com','DownRange')} — an independent Second Amendment portal built for the firearms community.`)}
${p(`DownRange is not funded by manufacturers, distributors, or advertisers. It's independently built and free to use. Editorial coverage is earned, not bought.`)}
${hr()}
${p(`What we cover:`)}
${ul([
  'New product launches and manufacturer releases — tracked across 16+ manufacturer feeds',
  'Ballistics, specifications, and comparative analysis',
  'Breaking firearms news across 13+ sources, updated throughout the day',
  'All 50 states\' gun laws, CCW reciprocity, and NFA data',
])}
${hl(`We track every public announcement and cover the ones that matter to our readers — active gun owners, instructors, dealers, and 2A advocates. {{businessName}} belongs in that coverage.`)}
${p(`If you have new products launching, press releases, or changes to existing lines:`)}
${hr()}
${p(`<strong style="color:#C8922A;">One more thing — and this one is worth reading.</strong>`)}
${p(`We just launched a <strong>written reviews section</strong> on DownRange, and we\'re building it the right way: hands-on testing, no pay-to-play, no sponsored content disguised as editorial. Every review we publish will be honest — the good, the bad, and what a real gun owner actually needs to know before buying.`)}
${p(`The roadmap goes beyond written. We\'re expanding into video reviews on YouTube and other platforms as the audience grows. The goal is to become the independent review destination the firearms community has always deserved — not another outlet that praises everything it receives.`)}
${p(`<strong>Here\'s the ask: ship us a product.</strong>`)}
${p(`If {{businessName}} has something worth talking about — a new pistol, a rifle, an accessory — send it our way. We\'ll put real range time into it, photograph it, test it the way your customers actually use it, and publish a thorough honest review with full specs and our call on whether it\'s worth the money. Our readers are exactly who you want to reach: serious gun owners who research before they buy.`)}
${hl(`We don\'t charge for reviews. We don\'t guarantee positive coverage. What we guarantee is that the review will be seen by people actively making purchase decisions — and that your product gets the same respect you put into building it.`)}
${p(`To get {{businessName}} in our review queue, reply to this email. We\'ll coordinate details and send shipping info. No commitment needed on either side until we both agree it\'s a good fit.`)}
${cta('https://www.downrangeco.com/reviews','See Our Reviews Section')}
${p(`DJ Cavalcanti`)}
`),
  variables: ['{{firstName}}','{{businessName}}','{{portalUrl}}','{{pressUrl}}','{{unsubscribeUrl}}'],
}

const ORGANIZATION_INTRO = {
  name: 'Organization / Advocacy — Introduction',
  type: 'organization',
  subject: '{{businessName}} + DownRange — community coverage',
  previewText: "Independent. No political funding. Editorial coverage of 2A advocacy.",
  body: shell(`
${p(`Hi {{firstName}},`)}
${p(`I wanted to reach out personally about ${a('https://www.downrangeco.com','DownRange')} — a free Second Amendment portal I built for gun owners, dealers, and instructors who want one place for news, laws, releases, and market data.`)}
${p(`DownRange takes no manufacturer money and no political funding. The platform is independent — built to serve the community, not represent anyone's interests.`)}
${hl(`We cover 2A legislation, court cases including Bruen and post-Bruen decisions, state-by-state law changes, and the full news cycle — automatically updated throughout the day.`)}
${p(`{{businessName}} is doing important work in this space. I'd like to cover your news, legislative alerts, and advocacy efforts for our readers.`)}
${p(`If you have press releases, campaigns, or legislative updates worth distributing to a firearms-engaged audience:`)}
${cta('https://www.downrangeco.com/press','DownRange Press & Partners')}
${p(`DJ`)}
`),
  variables: ['{{firstName}}','{{businessName}}','{{portalUrl}}','{{pressUrl}}','{{unsubscribeUrl}}'],
}

const SHOP_INTRO = {
  name: 'Gun Shop & FFL — Introduction',
  type: 'gun_shop',
  subject: 'Something I built that might be useful for {{businessName}}',
  previewText: "Free resource for FFLs and gun shops — nothing to sign up for.",
  body: shell(`
${p(`Hi {{firstName}},`)}
${p(`My name is DJ Cavalcanti. I'm a gun owner based in Washington state and I built ${a('https://www.downrangeco.com','DownRange')} — a free firearms intelligence portal for the gun community.`)}
${p(`The platform covers real-time ammo prices, new manufacturer releases, a 50-state gun law tracker, CCW information, and breaking 2A news. It's completely free and always will be.`)}
${hl(`The people browsing DownRange are active buyers — researching calibers, comparing prices, looking up their state's laws before they walk into a shop. They're your customers.`)}
${p(`DownRange has an FFL Finder built in — licensed dealers can be listed there for free. If you want to be included, or if there's any way the platform can be more useful for {{businessName}}, I'm genuinely interested in the feedback.`)}
${cta('https://www.downrangeco.com','Take a look')}
${p(`DJ Cavalcanti`)}
`),
  variables: ['{{firstName}}','{{businessName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const INSTRUCTOR_INTRO = {
  name: 'NRA Instructor — Introduction',
  type: 'instructor',
  subject: '{{firstName}} — built something your students will ask about',
  previewText: "Free 2A resource. State law tools. Open invitation to contribute.",
  body: shell(`
${p(`Hi {{firstName}},`)}
${p(`I'm DJ, and I built ${a('https://www.downrangeco.com','DownRange')} — a free Second Amendment portal covering news, state gun laws, CCW information, NFA data, and manufacturer releases.`)}
${p(`I'm reaching out to instructors specifically because I want the platform to be genuinely useful in the classroom and at the range — not just for enthusiasts browsing at home.`)}
${ul([
  '50-state law tracker with CCW reciprocity and permit requirements',
  'NFA wait time data updated daily',
  'Real-time ammo price tracking by caliber',
  'Breaking 2A news updated throughout the day',
])}
${hl(`If you recommend your students keep up with local firearms laws, DownRange is the fastest way to do it. The State Hub gives them everything by state in one place.`)}
${p(`I'd also like to feature qualified instructors on the platform's Training section. If you offer training and want to be listed — I'd be glad to include you, no charge.`)}
${cta('https://www.downrangeco.com/training','See the Training Section')}
${p(`DJ`)}
`),
  variables: ['{{firstName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const HOLSTER_INTRO = {
  name: 'Holster Company — Introduction & Coverage',
  type: 'organization',
  subject: '{{firstName}} — {{businessName}} on DownRange CCW section',
  previewText: "Dedicated CCW section. Active carry audience. Editorial coverage.",
  body: shell(`
${p(`Hi {{firstName}},`)}
${p(`My name is DJ. I run ${a('https://www.downrangeco.com','DownRange')} — an independent firearms portal with a dedicated CCW section covering all 50 states.`)}
${p(`The readers in that section are actively carrying or actively getting their permit. They're researching holsters right now.`)}
${hl(`{{businessName}} makes exactly the kind of gear this audience is looking for. I'd like to feature your products and releases on the platform — no cost, no strings, editorial merit only.`)}
${p(`What editorial coverage includes:`)}
${ul([
  'New product releases covered in the Releases section',
  'Inclusion in CCW-related editorial content',
  'Holster section listing for relevant models',
  'Press release distribution to our audience',
])}
${cta('https://www.downrangeco.com/ccw','See the CCW Section')}
${p(`Press info: ${a('https://www.downrangeco.com/press','downrangeco.com/press')}<br><br>DJ`)}
`),
  variables: ['{{firstName}}','{{businessName}}','{{portalUrl}}','{{pressUrl}}','{{unsubscribeUrl}}'],
}

const DEALER_INTRO = {
  name: 'Dealer & Retailer — Introduction',
  type: 'ffl_dealer',
  subject: '{{businessName}} — DownRange FFL directory + editorial',
  previewText: "Free portal with FFL directory. Your customers are already here.",
  body: shell(`
${p(`Hi {{firstName}},`)}
${p(`I built ${a('https://www.downrangeco.com','DownRange')} — a free Second Amendment portal that gun owners use daily for news, laws, ammo prices, and new releases.`)}
${p(`I'm reaching out because DownRange has an FFL Finder where licensed retailers can be listed — free, no paid tier, no catch.`)}
${hl(`Your customers are using this site to research before they walk through your door. A listing puts {{businessName}} in front of them at exactly the right moment.`)}
${ul([
  'Real-time ammo price comparison',
  'New manufacturer releases and product availability',
  '50-state gun law tracker with CCW information',
  'NFA wait time data updated daily',
])}
${cta('https://www.downrangeco.com/ffl-finder','FFL Finder')}
${p(`For a listing or editorial coverage: ${a('https://www.downrangeco.com/press','downrangeco.com/press')}<br><br>DJ Cavalcanti`)}
`),
  variables: ['{{firstName}}','{{businessName}}','{{portalUrl}}','{{pressUrl}}','{{unsubscribeUrl}}'],
}

const GENERIC_FOLLOWUP = {
  name: 'All — Follow-Up (14 Days)',
  type: 'all',
  subject: 'Following up — DJ from DownRange',
  previewText: "Short one — sent you something two weeks ago.",
  body: shell(`
${p(`Hi {{firstName}},`)}
${p(`Sent you a note a couple weeks back about DownRange — wanted to make sure it found you.`)}
${p(`Quick version: ${a('https://www.downrangeco.com','DownRange')} is a free Second Amendment portal covering news, laws, ammo prices, manufacturer releases, and CCW information for all 50 states. Built independently, no manufacturer money.`)}
${p(`If there's a way I can make it useful for you or your audience, I'm listening. If the timing is off — no worries at all.`)}
${p(`— DJ<br><br>${a('https://www.downrangeco.com','downrangeco.com')}`)}
`),
  variables: ['{{firstName}}','{{portalUrl}}','{{unsubscribeUrl}}'],
}

const ALL_TEMPLATES = [
  YOUTUBER_INTRO, YOUTUBER_FOLLOWUP, YOUTUBER_COLLAB,
  SHOP_INTRO, INSTRUCTOR_INTRO, ORGANIZATION_INTRO,
  MANUFACTURER_INTRO, DEALER_INTRO, HOLSTER_INTRO, GENERIC_FOLLOWUP,
]

// ─────────────────────────────────────────────────────────────────────────────
// YOUTUBERS — FULL LIST WITH REAL NAMES (researched from public sources)
// ─────────────────────────────────────────────────────────────────────────────
const YOUTUBER_LIST = [
  // MEGA TIER
  { name:'Hickok45',               firstName:'Greg',    youtubeUrl:'https://youtube.com/@hickok45',                subscribers:8100000, notes:'Real name: Greg Kinman. Retired teacher. Born 1950. 8.1M subs.' },
  { name:'Garand Thumb',           firstName:'Mike',    youtubeUrl:'https://youtube.com/@GarandThumb',             subscribers:4600000, notes:'Real name: Michael (Mike) Jones. USAF TACP veteran. Founder Onward Research.' },
  { name:'Brandon Herrera',        firstName:'Brandon', youtubeUrl:'https://youtube.com/@BrandonHerrera',          subscribers:4200000, notes:'Real name: Brandon Herrera. The AK Guy. Ran for Congress TX-23.' },
  { name:'Colion Noir',            firstName:'Collins', youtubeUrl:'https://youtube.com/@MrColionNoir',            subscribers:3200000, notes:'Real name: Collins Iyare Idehen Jr. Attorney. NRA affiliated.' },
  { name:'Kentucky Ballistics',    firstName:'Scott',   youtubeUrl:'https://youtube.com/@KentuckyBallistics',      subscribers:3100000, notes:'Real name: Scott Duran.' },
  { name:'Forgotten Weapons',      firstName:'Ian',     youtubeUrl:'https://youtube.com/@ForgottenWeapons',        subscribers:3000000, notes:'Real name: Ian McCollum. InRange TV co-host.' },
  { name:'Active Self Protection', firstName:'John',    youtubeUrl:'https://youtube.com/@ActiveSelfProtection',    subscribers:2900000, notes:'Real name: John Correia.' },
  { name:'IraqVeteran8888',        firstName:'Eric',    youtubeUrl:'https://youtube.com/@IraqVeteran8888',         subscribers:2600000, notes:'Real name: Eric Blandford.' },
  { name:'Warrior Poet Society',   firstName:'John',    youtubeUrl:'https://youtube.com/@WarriorPoetSociety',      subscribers:2000000, notes:'Real name: John Lovell. Former Army Ranger.' },
  // MACRO TIER
  { name:'Sootch00',               firstName:'Don',     youtubeUrl:'https://youtube.com/@sootch00',                subscribers:940000,  notes:'Real name: Don Porter.' },
  { name:'Mrgunsngear',            firstName:'Chris',   youtubeUrl:'https://youtube.com/@Mrgunsngear',             subscribers:1300000, notes:'Real name: Chris Baker.' },
  { name:'Guns and Gadgets 2A',    firstName:'Jared',   youtubeUrl:'https://youtube.com/@Guns_and_Gadgets',        subscribers:774000,  notes:'Real name: Jared Yanis.' },
  { name:'T.REX ARMS',             firstName:'Lucas',   youtubeUrl:'https://youtube.com/@TREXARMS',                subscribers:750000,  notes:'Real name: Lucas Botkin. Runs T.REX ARMS holster company.' },
  { name:'School of the American Rifle', firstName:'Chad', youtubeUrl:'https://youtube.com/@SchoolOfTheAmericanRifle', subscribers:760000, notes:'Real name: Chad. SOTAR.' },
  { name:'Paul Harrell',           firstName:'Paul',    youtubeUrl:'https://youtube.com/@PaulHarrell',             subscribers:720000,  notes:'Real name: Paul Harrell. No sponsorships policy.' },
  { name:'Classic Firearms',       firstName:'Scott',   youtubeUrl:'https://youtube.com/@ClassicFirearms',         subscribers:750000,  notes:'Real name: Scott (channel manager). Surplus and classic guns retailer.' },
  { name:'Lucky Gunner',           firstName:'Chris',   youtubeUrl:'https://youtube.com/@LuckyGunner',             subscribers:610000,  notes:'Real name: Chris Baker (Lounge editor). Ammo retailer + ballistics.' },
  { name:'TFB TV',                 firstName:'James',   youtubeUrl:'https://youtube.com/@TFBTV',                   subscribers:680000,  notes:'Real name: James Reeves, Executive Producer.' },
  { name:'Honest Outlaw',          firstName:'Riley',   youtubeUrl:'https://youtube.com/@HonestOutlawReviews',     subscribers:650000,  notes:'Real name: Riley Bowman.' },
  { name:'Reno May',               firstName:'Reno',    youtubeUrl:'https://youtube.com/@RenoMay',                 subscribers:510000,  notes:'Real name: Reno May.' },
  { name:'InRange TV',             firstName:'Karl',    youtubeUrl:'https://youtube.com/@InRangeTV',               subscribers:500000,  notes:'Real name: Karl Kasarda.' },
  { name:'Backfire',               firstName:'Justin',  youtubeUrl:'https://youtube.com/@Backfire',                subscribers:500000,  notes:'Real name: Justin.' },
  { name:'VSO Gun Channel',        firstName:'Frank',   youtubeUrl:'https://youtube.com/@VSO_GUN_Channel',         subscribers:400000,  notes:'Real name: Frank.' },
  { name:'Washington Gun Law',     firstName:'William', youtubeUrl:'https://youtube.com/@WashingtonGunLaw',        subscribers:390000,  notes:'Real name: William Kirk. 2A attorney in WA state (same as DJ).' },
  { name:'TheGunCollective',       firstName:'Jon',     youtubeUrl:'https://youtube.com/@TheGunCollective',        subscribers:430000,  notes:'Real name: Jon Patton.' },
  { name:'Tactical Hyve',          firstName:'Mike',    youtubeUrl:'https://youtube.com/@TacticalHyve',            subscribers:360000,  notes:'Real name: Mike.' },
  { name:'Gun Talk Media',         firstName:'Tom',     youtubeUrl:'https://youtube.com/@GunTalkMedia',            subscribers:320000,  notes:'Real name: Tom Gresham.' },
  { name:'Pew Pew Tactical',       firstName:'Eric',    youtubeUrl:'https://youtube.com/@PewPewTactical',          subscribers:340000,  notes:'Real name: Eric Hung, founder.' },
  { name:'9-Hole Reviews',         firstName:'Steve',   youtubeUrl:'https://youtube.com/@9HoleReviews',            subscribers:460000,  notes:'Real name: Steve.' },
  { name:'Armed Attorneys',        firstName:'Richard', youtubeUrl:'https://youtube.com/@ArmedAttorneys',          subscribers:340000,  notes:'Real names: Richard Hayes + Emily Taylor. 2A attorneys.' },
  { name:'Brownells Inc',          firstName:'Pete',    youtubeUrl:'https://youtube.com/@Brownells',               subscribers:260000,  notes:'Real name: Pete (channel host). Official Brownells industry channel.' },
  // NEW CHANNELS NOT PREVIOUSLY IN LIST
  { name:'Jonathan Sherry',        firstName:'Jonathan',youtubeUrl:'https://youtube.com/@JonathanSherry',          subscribers:380000,  notes:'Real name: Jonathan Sherry. CCW and defensive firearms. Fast growing.' },
  { name:'Precision Rifle Network',firstName:'Joel',    youtubeUrl:'https://youtube.com/@PrecisionRifleNetwork',   subscribers:120000,  notes:'Real name: Joel Wise. Security consultant, precision rifle competitor.' },
  { name:'Kentucky Tactical',      firstName:'Kyle',    youtubeUrl:'https://youtube.com/@kentucky.tactical',       subscribers:280000,  notes:'Real name: Kyle. Brownells partner. Suppressors and accessories.' },
  { name:'Milspec Mojo',           firstName:'Brandon', youtubeUrl:'https://youtube.com/@MilSpecMojo',             subscribers:180000,  notes:'Real name: Brandon. High-speed shooting skills. Fast-growing channel.' },
  { name:'Cory and Erica',         firstName:'Cory',    youtubeUrl:'https://youtube.com/@CoryAndErica',            subscribers:270000,  notes:'Real names: Cory and Erica. Couple channel. CCW lifestyle. Strong female audience.' },
  { name:'Reid Henrichs',          firstName:'Reid',    youtubeUrl:'https://youtube.com/@ValorRidge',              subscribers:350000,  notes:'Real name: Reid Henrichs. Valor Ridge founder. Training, history, 2A.' },
  { name:'Polenar Tactical',       firstName:'Ziga',    youtubeUrl:'https://youtube.com/@PolenarTactical',         subscribers:1100000, notes:'Real name: Ziga (Slovenian team). High-production professional tactics.' },
  { name:'Military Arms Channel',  firstName:'Tim',     youtubeUrl:'https://youtube.com/@MilitaryArmsChannel',     subscribers:1200000, notes:'Real name: Tim. AR/AK reviews, NFA content, suppressors.' },
  { name:'The Yankee Marshal',     firstName:'Yankee',  youtubeUrl:'https://youtube.com/@TheYankeeMarshal',        subscribers:700000,  notes:'Real name: not public (YM). CCW, reviews, opinions. Outspoken.' },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const action = new URL(req.url).searchParams.get('action') || 'all'
  const results = { templates: { created:0, skipped:0, updated:0 }, contacts: { created:0, skipped:0, patched:0 } }

  if (action === 'all' || action === 'templates') {
    for (const tmpl of ALL_TEMPLATES) {
      try {
        const existing = await sanity.fetch(`*[_type=="outreachTemplate"&&name==$name][0]._id`,{name:tmpl.name})
        if (existing) {
          // NEVER overwrite subject/body on existing templates — admin edits must be preserved
          // Only backfill fields that are genuinely missing
          const existingFull = await sanity.fetch(`*[_id==$id][0]{subject,body}`,{id:existing})
          const patch = {}
          if (!existingFull?.subject) patch.subject = tmpl.subject
          if (!existingFull?.body)    patch.body    = tmpl.body
          if (tmpl.previewText)       patch.previewText = tmpl.previewText
          if (tmpl.variables)         patch.variables   = tmpl.variables
          if (Object.keys(patch).length > 0) {
            await sanity.patch(existing).set(patch).commit()
            results.templates.updated++
          } else {
            results.templates.skipped++
          }
        } else {
          await sanity.create({_type:'outreachTemplate',...tmpl,isActive:true,createdAt:new Date().toISOString()})
          results.templates.created++
        }
      } catch(e){ console.error('tmpl',tmpl.name,e.message) }
    }
  }

  if (action === 'all' || action === 'contacts') {
    for (const yt of YOUTUBER_LIST) {
      try {
        const existing = await sanity.fetch(`*[_type=="outreachContact"&&youtubeUrl==$url][0]._id`,{url:yt.youtubeUrl})
        if (existing) {
          if (yt.firstName) { await sanity.patch(existing).set({firstName:yt.firstName,notes:yt.notes}).commit(); results.contacts.patched++ }
          else results.contacts.skipped++
        } else {
          await sanity.create({_type:'outreachContact',type:'youtuber',status:'active',source:'youtube_research',addedAt:new Date().toISOString(),...yt})
          results.contacts.created++
        }
        await new Promise(r=>setTimeout(r,100))
      } catch(e){ console.error('contact',yt.name,e.message) }
    }
  }

  return Response.json({
    ok:true,
    templates:{...results.templates,total:ALL_TEMPLATES.length},
    contacts:{...results.contacts,total:YOUTUBER_LIST.length},
    message:`Templates: ${results.templates.created} created, ${results.templates.updated} updated. Contacts: ${results.contacts.created} new, ${results.contacts.patched} real-names patched, ${results.contacts.skipped} unchanged.`
  })
}
