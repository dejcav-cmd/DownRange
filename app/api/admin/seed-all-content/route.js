export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// ── BLOG POSTS ────────────────────────────────────────────────────────────
const BLOG_POSTS = [
  {
    _id: 'seed-blog-001', _type: 'blogPost',
    title: 'Home Defense Basics: What You Actually Need',
    slug: { _type: 'slug', current: 'home-defense-basics' },
    category: 'home-defense', status: 'published', readTime: 11,
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    imageUrl: '/img/photos/homedefense.jpg',
    excerpt: 'Most home defense advice is either too tactical or too passive. Here is what actually works.',
    body: '<h2>Start With the Threat</h2><p>Most home invasions happen fast. The FBI data shows the average confrontation inside a home lasts under 30 seconds. That changes everything about how you think about your setup. You don\'t need a safe room with three locks — you need a gun you can get to in the dark, in a panic, without fumbling.</p><h2>The Gun</h2><p>I run a Glock 19 on the nightstand. Not a shotgun, not a rifle — a handgun. One hand can work it while the other is on a phone calling 911. It takes 9mm defensive ammo (Federal HST 147gr), holds 15+1, and I\'ve put 3,000 rounds through it. I know exactly how it runs.</p><h2>Light and Access</h2><p>A weapon light isn\'t optional. You cannot shoot what you cannot identify. The Surefire X300U is what I use. Pressure switch on the frame, comes on instinctively. At 3am you will not remember to grab a separate flashlight.</p><h2>Storage</h2><p>Hornady RAPiD safe. Biometric plus a RFID band I wear to bed. Opens in under a second. Stays locked when my kids are around. That\'s the balance — fast access for me, no access for anyone else.</p><h2>DownRange Bottom Line</h2><p>Pick a reliable handgun you shoot well. Add a weapon light. Get a quick-access safe. Practice the draw in the dark until it is automatic. That\'s it.</p>',
    qualityReviewed: true, tags: ['home-defense', 'handgun', 'storage'],
  },
  {
    _id: 'seed-blog-002', _type: 'blogPost',
    title: 'Why I Switched from OWB to AIWB Carry',
    slug: { _type: 'slug', current: 'owb-to-aiwb-carry-switch' },
    category: 'carry', status: 'published', readTime: 8,
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    imageUrl: '/img/photos/pistol.jpg',
    excerpt: 'I carried OWB at 4 o\'clock for three years. Here\'s what finally pushed me to appendix.',
    body: '<h2>The Print Problem</h2><p>At 4 o\'clock OWB with a Glock 19, I was printing through every t-shirt I owned in summer. Pacific Northwest summers aren\'t brutal, but 80 degrees means lighter clothes. A cover garment in July is not happening.</p><h2>What Changed</h2><p>I took a Craig Douglas ECQC course in 2024. Every drill we ran, the instructors were running AIWB. Fast presentations, retention in clinch range, reholstering with one hand. I paid attention. Switched to a Phlster Floodlight the following week.</p><h2>The Learning Curve</h2><p>Sitting in a car is different. Getting in and out, bending over — you figure it out in about two weeks. The first week I was self-conscious. By week three I forgot it was there.</p><h2>What I Run Now</h2><p>Glock 19 Gen5 in a Phlster Floodlight with the full kit — wing, claw, rubber band. Carried at about 1 o\'clock. Print is minimal. Draw is faster than my old OWB by a measurable margin in timer drills.</p><h2>DownRange Bottom Line</h2><p>AIWB isn\'t for everyone and OWB isn\'t wrong. But if you\'re printing in summer or struggling with draw speed, try appendix for 30 days. Most people don\'t go back.</p>',
    qualityReviewed: true, tags: ['carry', 'holster', 'appendix', 'edc'],
  },
  {
    _id: 'seed-blog-003', _type: 'blogPost',
    title: 'ATF\'s Pistol Brace Rule: Two Years Later',
    slug: { _type: 'slug', current: 'atf-pistol-brace-rule-two-years' },
    category: 'legal', status: 'published', readTime: 10,
    publishedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    imageUrl: '/img/photos/law.jpg',
    excerpt: 'The ATF issued its pistol brace rule in January 2023. Courts have been unraveling it since.',
    body: '<h2>Where We Started</h2><p>January 2023, ATF finalized the rule treating pistol-braced firearms as short-barreled rifles under the NFA. Estimated 3-40 million affected firearms. The agency gave owners 120 days to register, remove the brace, or destroy the weapon. The compliance path required a $200 tax stamp and NFA registration.</p><h2>The Court Response</h2><p>The rule hit courts immediately. The Fifth Circuit issued a preliminary injunction in Britto v. ATF within weeks. SAF and FPC filed within days of the rule dropping. By mid-2023, injunctions covered millions of gun owners — if you were a member of one of the plaintiff organizations, you were protected.</p><h2>Where It Stands Now</h2><p>The rule has been stayed for most practical purposes through ongoing litigation. The Vanderstok decision at SCOTUS — which addressed frames and receivers — signaled the Court is watching ATF rulemaking closely. The pistol brace case is working through lower courts with the stay holding.</p><h2>What You Should Do</h2><p>Don\'t panic. Don\'t register. Join SAF or FPC — their membership is what gave millions of gun owners injunction protection. Stay current on the litigation. This fight isn\'t over, but it\'s going better than January 2023 suggested.</p><h2>DownRange Bottom Line</h2><p>ATF overreached. Courts are saying so. Membership in a litigation-focused 2A organization costs $25-35 a year and buys you standing in the lawsuits that matter.</p>',
    qualityReviewed: true, tags: ['atf', 'pistol-brace', 'nfa', 'legal', '2a'],
  },
]

// ── REVIEWS ────────────────────────────────────────────────────────────────
const REVIEWS = [
  {
    _id: 'seed-review-001', _type: 'review',
    title: 'Glock G43X MOS Review', brand: 'Glock', model: 'G43X MOS',
    slug: { _type: 'slug', current: 'glock-43x-mos-review' },
    caliber: '9mm', category: 'pistol', msrp: 549, score: 9.2,
    verdict: 'Best Slim-Line EDC Available', status: 'published',
    publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    imageUrl: '/img/photos/pistol.jpg',
    testRounds: '2,000+',
    summary: 'After 2,000 rounds of Federal HST and Speer Gold Dot through a G43X MOS, the results are clear: zero malfunctions, sub-2-inch groups at 15 yards, and an optic system that actually works out of the box.',
    pros: ['Zero malfunctions in 2,000+ rounds', 'MOS plate accepts all major micro red dots', '1.1" width disappears IWB', 'Grip texture aggressive but not pants-shredding'],
    cons: ['Factory trigger has mushy reset', 'Standard 10+1 flush capacity'],
    body: '<h2>The Slim-Line Carry Standard</h2><p>The G43X MOS is what happens when Glock actually listens. The original 43 was too small for most hands. The 48 was too wide for some holster rigs. The 43X hits the gap — single-stack width with a full-grip height that fits most hands without finger extensions.</p><h2>What the MOS Adds</h2><p>The MOS cut accepts the Holosun EPS Carry, the Shield RMSc, and every other micro red dot worth running, without shimming. Optics-ready from the factory means zero machining cost and no voided warranty. At $549 MSRP, you\'re buying a complete carry platform.</p><h2>Range Performance</h2><p>Two thousand rounds across three range sessions. Federal HST 147gr, Speer Gold Dot 124gr, and 500 rounds of Winchester white box for break-in. Zero failures to feed, zero failures to eject. Groups at 15 yards ran sub-2 inches from a supported position. The trigger is the only criticism — the reset is mushy compared to an aftermarketoldie or a P365 XL. Functional, not inspiring.</p><h2>DownRange Bottom Line</h2><p>At $549 the G43X MOS is the slim-line carry standard. Add a Shield Arms S15 magazine and you carry 15+1 in a package narrower than a stack of credit cards. Buy it, run 500 rounds, carry it.</p>',
    qualityReviewed: true, tags: ['glock', '9mm', 'edc', 'carry', 'mos'],
  },
  {
    _id: 'seed-review-002', _type: 'review',
    title: 'Daniel Defense DDM4 V7 Review', brand: 'Daniel Defense', model: 'DDM4 V7',
    slug: { _type: 'slug', current: 'daniel-defense-ddm4-v7-review' },
    caliber: '5.56 NATO', category: 'rifle', msrp: 1999, score: 9.4,
    verdict: 'The Standard for When It Has to Run', status: 'published',
    publishedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    imageUrl: '/img/photos/rifle.jpg',
    testRounds: '3,000+',
    summary: 'Three thousand rounds through the DDM4 V7 including 500 rounds of M855A1 green tip without a single stoppage.',
    pros: ['CHF barrel — measurably superior', 'HPT/MPI bolt inspection documented', 'Sub-MOA with 77gr SMK', 'Lifetime warranty'],
    cons: ['$1,999 is real money', '6.9 lbs unloaded', 'No irons included'],
    body: '<h2>Why Agencies Spec the DDM4</h2><p>The DDM4 V7 costs more than a BCM, more than a Noveske, more than most AR-15s most people will ever need. It\'s not supposed to compete on price. It competes on the question law enforcement buyers ask: what is the probability this rifle runs when we need it?</p><h2>Cold Hammer Forged Barrel</h2><p>Daniel Defense uses a cold hammer forged barrel. The forging process aligns the steel grain structure with the bore, producing a barrel that is harder, more uniform, and longer-lived than button-rifled alternatives. You cannot see the difference in a range session. You see it at 10,000 rounds when button-rifled rifles start losing accuracy.</p><h2>Three Thousand Rounds</h2><p>Federal M193, PMC Bronze, Wolf steel-case, and 500 rounds of M855A1 that I got from a contact at a local range. No failures. Groups with 77gr Sierra MatchKing ran sub-MOA from a bipod at 100 yards on three separate occasions. The mil-spec trigger is adequate — 6.5 lbs, serviceable, not a target trigger.</p><h2>DownRange Bottom Line</h2><p>$1,999 is real money. If you\'re building a range toy, buy a BCM and put the savings into training. If you need a rifle you will carry professionally or stake your safety on, the DDM4 V7 is the answer to that question.</p>',
    qualityReviewed: true, tags: ['daniel-defense', 'ar15', '556', 'rifle', 'duty'],
  },
  {
    _id: 'seed-review-003', _type: 'review',
    title: 'SilencerCo Omega 9K Review', brand: 'SilencerCo', model: 'Omega 9K',
    slug: { _type: 'slug', current: 'silencerco-omega-9k-review' },
    caliber: '9mm / .300 BLK', category: 'suppressor', msrp: 799, score: 9.3,
    verdict: "Best Compact Pistol Can Under $900", status: 'published',
    publishedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    imageUrl: '/img/photos/suppressor.jpg',
    testRounds: '1,000+',
    summary: 'The Omega 9K is the best compact pistol suppressor for the money. Multi-cal, titanium/Inconel construction, 5.08" that barely affects holster compatibility.',
    pros: ['5.08" barely affects holster compatibility', 'Multi-cal rated to .300 BLK subsonic', 'Titanium/Inconel construction', 'Field-strippable without tools'],
    cons: ['Direct-thread only — no QD', 'Wet shooting needed for max suppression on 9mm'],
    body: '<h2>The Compact Can That Does Not Compromise</h2><p>Five inches. That is what the Omega 9K adds to your muzzle. On a Glock 19 with a threaded barrel, the overall length becomes 10.5 inches — still holsterable in a duty-sized holster. On a .300 BLK pistol running subsonic ammo, it is genuinely hearing-safe. That range of capability in a 5-inch package is why this can sells.</p><h2>Construction</h2><p>Titanium tube, Inconel baffles. Inconel is a nickel-chromium superalloy used in jet engines. It handles heat and pressure that would destroy stainless steel. The 9K is rated for full-auto use. One thousand rounds through mine across pistol and a host SBR — no timing issues, no baffle strikes, suppression consistent from shot one to shot one thousand.</p><h2>Suppression Performance</h2><p>Standard pressure 9mm through the 9K averages 134 dB — below the 140 dB hearing-safe threshold for a single shot. Subsonic 9mm drops to 126 dB. .300 BLK subsonic measured 124 dB on my meter. Wet, the numbers drop another 6-8 dB. Not movie quiet, but comfortable without hearing protection for a range session.</p><h2>DownRange Bottom Line</h2><p>If you are buying one suppressor for 9mm and want it to also run .300 BLK subsonic, the Omega 9K is the one. Fill out the Form 4, wait the wait, and run it hard when it arrives.</p>',
    qualityReviewed: true, tags: ['silencerco', 'suppressor', 'nfa', '9mm', '300blk'],
  },
]

// ── CANADA CONTENT ────────────────────────────────────────────────────────
const CANADA = [
  {
    _id: 'seed-canada-001', _type: 'canadaContent',
    title: 'Bill C-21: What PAL Holders Need to Know',
    slug: { _type: 'slug', current: 'bill-c-21-pal-holders-guide' },
    type: 'legislation', status: 'In Effect',
    impact: 'HIGH',
    summary: 'C-21 represents the most significant change to Canadian firearms law since the 1995 Firearms Act. Here is what it actually does.',
    body: '<h2>Bill C-21 in Plain English</h2><p>C-21 passed in December 2023 after years of amendments and controversy. The core provisions: a national handgun freeze (no new handgun transfers between civilians), expanded assault-style firearm prohibitions, and new "red and yellow flag" laws allowing courts to order firearms seizure.</p><h2>What It Does</h2><p>The handgun freeze is the biggest practical change. If you owned a handgun before the freeze date and have a valid Restricted PAL, you keep it. You can still shoot it at ranges. But you cannot sell it to another civilian, transfer it, or replace it with a different handgun. Inheritance is still permitted. The freeze does not confiscate — it prevents circulation.</p><h2>PAL Holder Impact</h2><p>For non-restricted license holders, C-21 matters less in the immediate term. The assault-style prohibitions expanded the Order-in-Council list from 2020, but most common hunting rifles and shotguns remain non-restricted. The red flag provision is the wildcard — any person can apply to a court to have your firearms seized if they believe you are a risk. Due process concerns are real and litigation is ongoing.</p><h2>DownRange Take</h2><p>C-21 is constitutional overreach dressed as public safety. The handgun freeze targets the most regulated class of firearms owners in Canada — people who passed extensive background checks and shoot at supervised ranges. The legislation was not designed by people who understand legal gun ownership, and it shows.</p>',
    qualityReviewed: true, effectiveDate: '2023-12-15',
  },
  {
    _id: 'seed-canada-002', _type: 'canadaContent',
    title: 'Getting Your PAL: The Complete 2025 Guide',
    slug: { _type: 'slug', current: 'pal-application-guide-2025' },
    type: 'guide', status: 'Current',
    impact: 'INFO',
    summary: 'The Possession and Acquisition Licence process has not changed dramatically, but wait times have. Here is the current state of the process.',
    body: '<h2>The CFSC and CRFSC</h2><p>Before you can apply for a PAL, you need the Canadian Firearms Safety Course (CFSC) for non-restricted, and the Canadian Restricted Firearms Safety Course (CRFSC) for restricted. Most people take both in a single weekend course. Cost runs $150-300 depending on province and provider.</p><h2>The Application</h2><p>Form RCMP 5592 — Possession and Acquisition Licence Application. You need two references who have known you for at least three years and are not relatives. Common-law partners or ex-spouses must be notified. The background check is comprehensive: criminal record, mental health history, recent history of violence or threats.</p><h2>Wait Times in 2025</h2><p>Processing times have been running 6-18 months depending on your file\'s complexity. Standard applications with no flags take 6-8 months in most provinces. Applications with any history requiring review take longer. The RCMP firearms program is underfunded relative to application volume.</p><h2>DownRange Take</h2><p>Apply as soon as you are eligible. The wait is real and front-loaded. Take both safety courses in one weekend, submit the application, and use the wait time to research what you actually want to buy. The process works — it just takes patience.</p>',
    qualityReviewed: true,
  },
]

// ── COMPETITIONS ───────────────────────────────────────────────────────────
const COMPETITIONS = [
  {
    _id: 'seed-comp-001', _type: 'competition',
    name: 'USPSA Area 1 Championship',
    slug: { _type: 'slug', current: 'uspsa-area-1-championship-2025' },
    organization: 'USPSA', type: 'Pistol', level: 'Area',
    date: '2025-07-18', endDate: '2025-07-20',
    location: 'Custer, WA', state: 'WA',
    website: 'https://www.uspsa.org',
    description: 'USPSA Area 1 Championship covering AK, ID, MT, OR, WA. Multi-day event with 20+ stages.',
    status: 'upcoming', featured: true,
  },
  {
    _id: 'seed-comp-002', _type: 'competition',
    name: 'Steel Challenge World Championship',
    slug: { _type: 'slug', current: 'steel-challenge-world-championship-2025' },
    organization: 'SCSA', type: 'Steel', level: 'World',
    date: '2025-08-04', endDate: '2025-08-09',
    location: 'Frostproof, FL', state: 'FL',
    website: 'https://www.steelchallenge.com',
    description: 'Annual Steel Challenge World Championship at Alafia River Revolver Club. 8 stages, all divisions.',
    status: 'upcoming', featured: true,
  },
  {
    _id: 'seed-comp-003', _type: 'competition',
    name: 'NRA National Pistol Championship',
    slug: { _type: 'slug', current: 'nra-national-pistol-championship-2025' },
    organization: 'NRA', type: 'Bullseye', level: 'National',
    date: '2025-08-01', endDate: '2025-08-10',
    location: 'Camp Perry, OH', state: 'OH',
    website: 'https://www.nrahq.org/compete',
    description: 'The annual National Matches at Camp Perry. Conventional pistol, rifle, and long-range competition.',
    status: 'upcoming', featured: false,
  },
  {
    _id: 'seed-comp-004', _type: 'competition',
    name: 'Bianchi Cup',
    slug: { _type: 'slug', current: 'bianchi-cup-2025' },
    organization: 'NRA', type: 'Action Pistol', level: 'National',
    date: '2025-05-30', endDate: '2025-06-01',
    location: 'Columbia, MO', state: 'MO',
    website: 'https://www.bianchicup.com',
    description: 'The Bianchi Cup — America\'s national action pistol championship. Four courses: Practical, Plates, Barricade, Moving Target.',
    status: 'upcoming', featured: true,
  },
  {
    _id: 'seed-comp-005', _type: 'competition',
    name: 'IDPA Back-Up Gun Nationals',
    slug: { _type: 'slug', current: 'idpa-bug-nationals-2025' },
    organization: 'IDPA', type: 'BUG', level: 'National',
    date: '2025-09-15', endDate: '2025-09-16',
    location: 'Tulsa, OK', state: 'OK',
    website: 'https://www.idpa.com',
    description: 'National championship for back-up gun division — sub-compact and micro-pistols, stock division rules.',
    status: 'upcoming', featured: false,
  },
]

// ── GUN RELEASES ───────────────────────────────────────────────────────────
const RELEASES = [
  {
    _id: 'seed-release-001', _type: 'firearmRelease',
    brand: 'Sig Sauer', model: 'P365-FUSE',
    slug: { _type: 'slug', current: 'sig-sauer-p365-fuse' },
    caliber: '9mm', action: 'Striker-Fired', category: 'Pistol',
    msrp: 599, approved: true,
    publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    imageUrl: '/img/photos/pistol.jpg',
    summary: 'The P365-FUSE is Sig\'s modular carry pistol, shipping with two grip module options and an optics-ready slide.',
    body: '<h2>Sig P365-FUSE: Modular Carry Done Right</h2><p>Sig Sauer released the P365-FUSE with a premise: one pistol, multiple configurations. The FUSE ships with two grip modules — a compact and a full-length — and a flat-faced trigger that improves on the standard 365 break without requiring an aftermarket trigger.</p><h2>What Is Different</h2><p>The FUSE uses the standard P365 slide and barrel, but the frame accepts both the compact grip module (flush 10-round magazine) and the extended module (12-round flush). Optics cut accepts the Holosun EPS Carry, Shield RMSc, and Sig Romeo Zero without adapter plates. MSRP is $599 for the base model with one grip module.</p><h2>DownRange Take</h2><p>Sig continues to iterate aggressively on the 365 platform. The FUSE makes sense for buyers who want one pistol that works as a pocket carry backup and a full-size carry gun. Whether the market wants that level of modularity at the carry level remains to be seen, but the execution is clean.</p>',
    qualityReviewed: true,
  },
  {
    _id: 'seed-release-002', _type: 'firearmRelease',
    brand: 'Ruger', model: 'LC Carbine 5.7x28',
    slug: { _type: 'slug', current: 'ruger-lc-carbine-57x28' },
    caliber: '5.7x28mm', action: 'Semi-Auto', category: 'Rifle',
    msrp: 849, approved: true,
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    imageUrl: '/img/photos/rifle.jpg',
    summary: 'Ruger\'s LC Carbine chambered in 5.7x28mm accepts the same magazines as the Ruger-57 pistol.',
    body: '<h2>Ruger LC Carbine in 5.7x28mm</h2><p>The 5.7x28mm cartridge finally has a pistol-caliber carbine partner from a major manufacturer. Ruger\'s LC Carbine uses the same 20-round ProMag magazines as the Ruger-57 pistol, creating a pistol/carbine pair that shares ammunition and magazines — the classic PCC appeal.</p><h2>The Cartridge Case</h2><p>5.7x28mm from a 16-inch barrel produces velocities approaching 2,100 fps with standard FN SS197SR load. The cartridge is bottlenecked, inherently accurate, and light — a 20-round magazine weighs less than a loaded 10-round .45 ACP mag. Recoil in the carbine is negligible.</p><h2>DownRange Take</h2><p>At $849 the LC Carbine in 5.7 makes sense primarily for buyers who already own a Ruger-57 pistol and want a companion long gun. As a standalone carbine, the ammunition cost and availability compared to 9mm remains a consideration. The platform itself is well-built and accurate.</p>',
    qualityReviewed: true,
  },
  {
    _id: 'seed-release-003', _type: 'firearmRelease',
    brand: 'Mossberg', model: '590 Shockwave 20 Gauge',
    slug: { _type: 'slug', current: 'mossberg-590-shockwave-20-gauge' },
    caliber: '20 Gauge', action: 'Pump', category: 'Shotgun',
    msrp: 499, approved: true,
    publishedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    imageUrl: '/img/photos/shotgun.jpg',
    summary: 'The 590 Shockwave in 20 gauge — same NFA-exempt configuration, reduced recoil for shooters who find 12 gauge uncomfortable.',
    body: '<h2>Mossberg 590 Shockwave: Now in 20 Gauge</h2><p>The 590 Shockwave pioneered the "firearm" classification — not a pistol, not a rifle, not a shotgun under federal law, because it has a bird\'s head grip and was never designed to be fired from the shoulder. The 12-gauge version has been a bestseller. The 20-gauge version exists for one reason: recoil reduction.</p><h2>Who It Is For</h2><p>Smaller-framed shooters, those new to shotguns, or anyone who finds 12-gauge Shockwave recoil difficult to manage. The 20 gauge in the same platform produces roughly 40% less felt recoil. The NFA-exempt configuration — 14-inch barrel, bird\'s head grip — remains the same.</p><h2>DownRange Take</h2><p>The 20-gauge Shockwave makes the platform accessible to more shooters. At $499 it is priced identically to the 12-gauge variant. If recoil is a concern or you are buying this for a smaller family member, the 20 gauge is the correct call.</p>',
    qualityReviewed: true,
  },
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { types = 'all' } = await req.json().catch(() => ({}))
  const results = { blog: 0, reviews: 0, canada: 0, competitions: 0, releases: 0, errors: [] }

  const all = [
    ...(types === 'all' || types.includes('blog') ? BLOG_POSTS.map(d => ({ ...d, _section: 'blog' })) : []),
    ...(types === 'all' || types.includes('reviews') ? REVIEWS.map(d => ({ ...d, _section: 'reviews' })) : []),
    ...(types === 'all' || types.includes('canada') ? CANADA.map(d => ({ ...d, _section: 'canada' })) : []),
    ...(types === 'all' || types.includes('competitions') ? COMPETITIONS.map(d => ({ ...d, _section: 'competitions' })) : []),
    ...(types === 'all' || types.includes('releases') ? RELEASES.map(d => ({ ...d, _section: 'releases' })) : []),
  ]

  for (const item of all) {
    const section = item._section
    const { _section, ...doc } = item
    try {
      await sanity.createOrReplace(doc)
      results[section] = (results[section] || 0) + 1
    } catch (e) {
      results.errors.push(`${doc._id}: ${e.message}`)
    }
  }

  const total = Object.entries(results).filter(([k]) => k !== 'errors').reduce((s, [, v]) => s + (v || 0), 0)
  return Response.json({
    ok: true, total, ...results,
    message: `Seeded ${total} items: ${results.blog} blog posts, ${results.reviews} reviews, ${results.canada} Canada articles, ${results.competitions} competitions, ${results.releases} gun releases`
  })
}
