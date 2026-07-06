import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

import { fetchAndUploadImage } from '@/lib/imageUpload.js'

async function fetchImage(query) {
  return fetchAndUploadImage(query, 'canada')
}

const VOICE_RULES = `MANDATORY RULES:
- Author is DJ Cavalcanti — write in first person where natural
- Sound like a real gun owner who knows Canadian firearms law cold, not an AI
- No "comprehensive", "dive into", "cutting-edge", "robust", "seamlessly", "leverage", "empower", "game-changer"
- No padded intros. Start with the hardest fact or most important point
- Active voice, specific numbers, real product names, real organization names
- DO NOT append any Source footer, attribution line, or "visit the original article" text at the end
- Title MUST be original DownRange phrasing`

// 20 topics — day-of-year rotation means a different topic runs each day, cycling every 20 days.
// Slugs include a month-year suffix so the same topic can be re-published with fresh content each cycle.
// The cron calls POST with limit=1 twice/day → 2 new articles/day, rotating through the pool.
const CANADA_TOPICS = [
  {
    imageQuery: 'Canada firearms handgun law regulation',
    baseSlug: 'canada-handgun-transfer-freeze',
    title: "Canada's Handgun Transfer Freeze: What Every Owner Actually Needs to Know",
    tag: 'LAW', readMins: '8 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Canada handgun transfer freeze (Bill C-21). Cover: what is banned vs allowed, dealer impact, inheritance rules, CCFR constitutional challenge, Conservative government position, what owners must do now.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada rifle ban AR-15 legislation parliament',
    baseSlug: 'canada-oic-rifle-ban-explained',
    title: 'The OIC Rifle Ban: Illegal to Sell, Legal to Own — The Full Mess Explained',
    tag: 'POLICY', readMins: '9 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Canada 2020 OIC rifle ban. Cover: what got banned (AR-15, Mini-14, Vz-58, etc.), ongoing amnesty details, cancelled C$756M buyback, Conservative reversal promises vs reality, what banned-firearm owners must do today.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada firearms license PAL course training range',
    baseSlug: 'how-to-get-pal-canada',
    title: 'How to Get Your PAL in Canada: The Realistic Step-by-Step Guide',
    tag: 'GUIDE', readMins: '10 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Getting your Possession and Acquisition Licence (PAL) in Canada. Cover: CFSC and CRFSC courses, application process, honest processing times (6-12 months), background checks, references, tips to avoid delays.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada hunting rifle outdoors forest deer moose',
    baseSlug: 'canada-hunting-season-province-guide',
    title: 'Canada Hunting Season: Province-by-Province Firearms Guide',
    tag: 'GUIDE', readMins: '9 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: 2025 hunting season across Canada. Cover: key provincial season dates (BC, AB, SK, MB, ON, QC), non-resident licensing, legal firearms for hunting, storage/transport on hunting trips, best cartridges for moose, deer, bear, elk.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada restricted firearm storage transport lock box',
    baseSlug: 'canada-restricted-firearm-storage-transport-rules',
    title: 'Restricted Firearms in Canada: Storage, Transport, and Range Rules Explained',
    tag: 'GUIDE', readMins: '8 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Owning restricted firearms in Canada. Cover: RPAL requirements, approved storage, ATT rules for transport, range-only use, what happens at a traffic stop, common legal mistakes.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada parliament conservative party government Mark Carney',
    baseSlug: 'bill-c21-conservative-government-future',
    title: 'Bill C-21 Under a Conservative Government: What Could Actually Change',
    tag: 'POLICY', readMins: '7 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Conservative government impact on C-21 and Canadian gun laws. Cover: what has been promised, what is politically realistic, OIC reversal vs legislation process, CCFR legal challenges, realistic timelines.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada ammunition bullets 9mm .308 cost price',
    baseSlug: 'canada-ammo-prices-availability',
    title: "Canadian Ammo Prices: What It Costs, Where to Buy, and Why It's Expensive",
    tag: 'GUIDE', readMins: '7 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Ammunition availability and pricing in Canada 2025. Cover: real CAD price comparisons (9mm, .308, 12ga, .22LR), why Canadian ammo costs more, best Canadian online retailers (Wolverine Supplies, Ellwood Epps, P.A.L. Gun Shop), import rules, reloading economics.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada firearms rights organization CCFR protest parliament',
    baseSlug: 'ccfr-nfa-canada-gun-rights-organizations',
    title: "The CCFR and NFA: Canada's Gun Rights Organizations and What They're Fighting For",
    tag: 'LAW', readMins: '8 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Canadian gun rights organizations — CCFR and NFA. Cover: what each does, legal victories and losses, Section 7 constitutional challenge to C-21, how Canadian advocacy differs from the US model, what gun owners can do.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'gun safe firearm storage security lock biometric',
    baseSlug: 'canada-safe-storage-requirements',
    title: "Canadian Safe Storage Laws: What You're Actually Required to Do",
    tag: 'LAW', readMins: '7 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Canadian safe storage requirements under the Firearms Act. Cover: non-restricted vs restricted storage rules, ammo storage, home defense access problem, what safe storage charges look like, recommended safes at real Canadian prices.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada Alberta Saskatchewan landscape outdoor firearms rural',
    baseSlug: 'canada-gun-friendly-provinces-ranked',
    title: "Canada's Most Gun-Friendly Provinces Ranked",
    tag: 'GUIDE', readMins: '8 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Gun-friendly province ranking 2025. Rank and analyze: Alberta (best), Saskatchewan, Manitoba, BC, Ontario, Quebec (worst). Cover: provincial pushback on federal gun laws, rural hunting culture, local police attitudes, cost of living + gun ownership.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada shooting range pistol competition sport',
    baseSlug: 'canada-shooting-ranges-guide',
    title: 'Canada Shooting Ranges: How to Find One, What to Expect, What It Costs',
    tag: 'GUIDE', readMins: '7 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Shooting ranges in Canada. Cover: how clubs work under the Firearms Act, finding an approved range as a new PAL holder, annual membership costs by province, what gear to bring, range rules that differ from US norms, IPSC/IDPA competition scene in Canada.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada handgun self defense home protection firearm',
    baseSlug: 'canada-home-defense-firearms-law',
    title: "Home Defense in Canada: What the Law Actually Says About Using a Firearm",
    tag: 'LAW', readMins: '9 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Home defense with a firearm in Canada. Cover: Criminal Code section 34 self-defense provisions, the safe storage vs access problem for restricted firearms, real Canadian cases where homeowners faced charges, what the courts actually look at, best legal defensive firearms available under PAL.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada border crossing firearms transport rules CBSA',
    baseSlug: 'canada-us-border-crossing-firearms',
    title: 'Taking Firearms Across the Canada-US Border: The Complete Rules',
    tag: 'GUIDE', readMins: '8 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Crossing the Canada-US border with firearms. Cover: CBSA Form BSF519 (non-resident declaration), ATF Form 6NIA for US citizens, which Canadian firearms are prohibited in the US, common mistakes at the border, hunting import rules, penalties.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada indigenous rights firearms hunting land treaty',
    baseSlug: 'canada-indigenous-hunting-firearms-rights',
    title: "Indigenous Hunting Rights and Firearms in Canada: What the Law Says",
    tag: 'LAW', readMins: '7 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Indigenous peoples and firearms law in Canada. Cover: how treaty rights interact with the Firearms Act, exemptions for Indigenous hunters, PAL requirements vs treaty rights, recent court decisions, practical impact on First Nations gun owners.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada firearm inheritance estate law probate',
    baseSlug: 'canada-inheriting-firearms-what-to-do',
    title: 'Inheriting Firearms in Canada: The Step-by-Step Legal Process',
    tag: 'LAW', readMins: '7 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Inheriting firearms in Canada. Cover: what happens to registered firearms when the owner dies, executor duties, how to transfer to a PAL holder, what to do if you don't have a PAL, deactivation options, the 180-day window under the Firearms Act, common mistakes that result in criminal charges.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada Glock pistol handgun restricted purchase dealer',
    baseSlug: 'canada-buying-first-handgun-guide',
    title: 'Buying Your First Handgun in Canada: What You Need, What to Expect',
    tag: 'GUIDE', readMins: '9 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Buying a handgun in Canada. Cover: RPAL requirement, which handguns are non-restricted vs restricted vs prohibited, the club membership requirement for restricted handguns, registration process, best first handguns available in Canada (Glock 17, Beretta 92, CZ Shadow 2, etc.) with realistic Canadian prices.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada AR-15 semi-automatic rifle legal prohibited firearm',
    baseSlug: 'canada-semi-auto-rifles-legal-status',
    title: 'Semi-Auto Rifles in Canada: What Is and Is Not Legal to Own Right Now',
    tag: 'LAW', readMins: '8 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Legal semi-automatic rifles in Canada after the OIC ban. Cover: which semi-autos remain legal (Ruger Mini-14 Ranch, SKS, Springfield M1A variants in non-prohibited config), which were banned (AR-15, etc.), how grandfathered prohibited firearms work, what manufacturers are selling as compliant alternatives.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada cartridge rifle hunting moose deer caliber',
    baseSlug: 'canada-best-hunting-cartridges-guide',
    title: 'Best Hunting Cartridges in Canada: What Locals Actually Use',
    tag: 'GUIDE', readMins: '7 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Best hunting cartridges for Canadian game in 2025. Cover: moose (.30-06, .308, .300 Win Mag, 7mm Rem Mag), deer (.243, 6.5 Creedmoor, .30-30), bear (.338 Federal, .45-70), waterfowl (steel shot mandated), wolves/coyotes (.223, .22-250). Include ammo availability and pricing in CAD from Canadian retailers.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada police RCMP firearms complaint investigation',
    baseSlug: 'canada-rcmp-firearms-enforcement-what-to-know',
    title: 'RCMP Firearms Enforcement: What Canadian Gun Owners Need to Know',
    tag: 'LAW', readMins: '8 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: RCMP firearms enforcement in Canada. Cover: how RCMP classifies firearms, the CFO (Chief Firearms Officer) system by province, how inspections work, your rights during an RCMP firearms inspection, complaint mechanisms when RCMP misclassifies your firearm, famous misclassification cases (Swiss Arms, CZ858).\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
  {
    imageQuery: 'Canada rural farm firearms protection property security',
    baseSlug: 'canada-rural-firearms-ownership-guide',
    title: 'Firearms Ownership in Rural Canada: What Farm and Ranch Owners Must Know',
    tag: 'GUIDE', readMins: '8 min',
    prompt: `${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Firearms for rural Canadians — farmers and ranch owners. Cover: practical firearms for predator control (coyote, wolf, bear), legal use of a firearm to protect livestock, storage requirements on rural property, transporting between properties, the political argument for why rural Canada keeps pushing back on C-21.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.`,
  },
]

export async function GET() {
  return Response.json({ topics: CANADA_TOPICS.map(t => ({ baseSlug: t.baseSlug, title: t.title, tag: t.tag })) })
}

export async function POST(req) {
  const key    = req.headers.get('x-admin-key')
  const auth   = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  const valid  = (key && key === process.env.ADMIN_KEY) || (secret && auth === 'Bearer ' + secret) || !process.env.ADMIN_KEY
  if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { limit = 1, force = false } = await req.json().catch(() => ({}))

  // ── DATE-BASED ROTATION ──────────────────────────────────────────────────────
  // Pick which topic to write today by rotating through the list using day-of-year.
  // A new date-stamped slug is generated each month so the same topic can be
  // refreshed with current content rather than being skipped as "already exists".
  const now        = new Date()
  const dayOfYear  = Math.floor((now - new Date(now.getUTCFullYear(), 0, 0)) / 86400000)
  const monthStamp = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  // Build the rotation window: pick `limit` consecutive topics starting at today's index
  const startIdx = dayOfYear % CANADA_TOPICS.length
  const pool = []
  for (let i = 0; i < Math.min(limit, CANADA_TOPICS.length); i++) {
    pool.push(CANADA_TOPICS[(startIdx + i) % CANADA_TOPICS.length])
  }

  const results = []

  for (const article of pool) {
    // Date-stamped slug: canada-handgun-transfer-freeze-2025-07
    const slug = `${article.baseSlug}-${monthStamp}`

    try {
      if (!force) {
        const existing = await sanity.fetch(
          '*[_type == "canadaContent" && slug.current == $slug][0]{ _id }',
          { slug }
        )
        if (existing) {
          results.push({ slug, status: 'skipped', reason: 'already published this month' })
          continue
        }
      }

      const body = await callAIText({ prompt: article.prompt, useCase: 'canada', maxTokens: 2000 })
      if (!body || body.length < 200) throw new Error('Empty AI response')

      const summary = body.replace(/<[^>]+>/g, '').slice(0, 220).trim() + '...'
      const imageUrl = (await fetchImage(article.imageQuery || 'Canada firearms')) || '/img/photos/law.jpg'

      await sanity.createOrReplace({
        _id:             `ca-written-${slug}`,
        _type:           'canadaContent',
        type:            'article',
        title:           article.title,
        slug:            { _type: 'slug', current: slug },
        tag:             article.tag,
        readMins:        article.readMins,
        imageUrl,
        body,
        summary,
        author:          'DJ Cavalcanti',
        qualityReviewed: false,
        publishedAt:     now.toISOString(),
        active:          true,
        order:           99,
      })
      results.push({ slug, status: 'created', title: article.title })
    } catch (e) {
      results.push({ slug, status: 'failed', error: e.message })
    }
  }

  const created = results.filter(r => r.status === 'created').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const failed  = results.filter(r => r.status === 'failed').length

  return Response.json({
    ok: true,
    message: `${created} created · ${skipped} skipped · ${failed} failed.`,
    results,
  })
}
