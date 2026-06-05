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

// ── Fetch real image from Pexels or Pixabay ─────────────────────────────────
async function fetchImage(query) {
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      )
      const data = await res.json()
      const photo = data.photos?.[0]
      if (photo) return photo.src.large2x || photo.src.large
    } catch {}
  }
  const pixabayKey = process.env.PIXABAY_API_KEY
  if (pixabayKey) {
    try {
      const url = new URL('https://pixabay.com/api/')
      url.searchParams.set('key', pixabayKey)
      url.searchParams.set('q', query)
      url.searchParams.set('image_type', 'photo')
      url.searchParams.set('orientation', 'horizontal')
      url.searchParams.set('per_page', '5')
      url.searchParams.set('safesearch', 'true')
      const res = await fetch(url.toString())
      const data = await res.json()
      const hit = data.hits?.[0]
      if (hit) return hit.largeImageURL || hit.webformatURL
    } catch {}
  }
  return null
}

const VOICE_RULES = `MANDATORY RULES:
- Author is DJ Cavalcanti — write in first person where natural
- Sound like a real gun owner who knows Canadian firearms law cold, not an AI
- No "comprehensive", "dive into", "cutting-edge", "robust", "seamlessly", "leverage", "empower", "game-changer"
- No padded intros. Start with the hardest fact or most important point
- Active voice, specific numbers, real product names, real organization names
- DO NOT append any Source footer, attribution line, or "visit the original article" text at the end
- Title MUST be original DownRange phrasing`

const WEEKLY_TOPICS = [
  { imageQuery:'Canada firearms handgun law regulation', slug:'canada-handgun-freeze-2025-what-owners-must-know', title:"Canada's Handgun Transfer Freeze: What Every Owner Actually Needs to Know", tag:'LAW', readMins:'8 min', imageUrl:'/img/photos/law.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Canada handgun transfer freeze (Bill C-21). Cover: what is banned vs allowed, dealer impact, inheritance rules, CCFR constitutional challenge, Conservative government position, what owners must do now.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'Canada rifle ban AR-15 legislation', slug:'canada-oic-rifle-ban-explained-2025', title:"The OIC Rifle Ban: Illegal to Sell, Legal to Own — The Full Mess Explained", tag:'POLICY', readMins:'9 min', imageUrl:'/img/photos/rifle.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Canada 2020 OIC rifle ban. Cover: what got banned (AR-15, Mini-14, Vz-58, etc.), ongoing amnesty details, cancelled C$756M buyback, Conservative reversal promises vs reality, what banned-firearm owners must do today.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'Canada firearms license PAL course training', slug:'how-to-get-your-pal-canada-complete-guide', title:"How to Get Your PAL in Canada: The Realistic Step-by-Step Guide", tag:'GUIDE', readMins:'10 min', imageUrl:'/img/photos/training.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Getting your Possession and Acquisition Licence (PAL) in Canada. Cover: CFSC and CRFSC courses, application process, honest processing times (6-12 months), background checks, references, tips to avoid delays.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'Canada hunting rifle outdoors forest', slug:'canada-hunting-season-2025-province-guide', title:"2025 Canada Hunting Season: Province-by-Province Firearms Guide", tag:'GUIDE', readMins:'9 min', imageUrl:'/img/photos/hunting.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: 2025 hunting season across Canada. Cover: key provincial season dates (BC, AB, SK, MB, ON, QC), non-resident licensing, legal firearms for hunting, storage/transport on hunting trips, best cartridges for moose, deer, bear, elk.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'Canada restricted firearm storage transport', slug:'canada-restricted-firearm-rules-complete-guide', title:"Restricted Firearms in Canada: Storage, Transport, and Range Rules Explained", tag:'GUIDE', readMins:'8 min', imageUrl:'/img/photos/pistol.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Owning restricted firearms in Canada. Cover: RPAL requirements, approved storage, ATT rules for transport, range-only use, what happens at a traffic stop, common legal mistakes.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'Canada parliament conservative party government', slug:'bill-c21-conservative-government-future', title:"Bill C-21 Under a Conservative Government: What Could Actually Change", tag:'POLICY', readMins:'7 min', imageUrl:'/img/photos/law.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Conservative government impact on C-21 and Canadian gun laws. Cover: what has been promised, what is politically realistic, OIC reversal vs legislation process, CCFR legal challenges, realistic timelines.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'Canada ammunition bullets firearm', slug:'canada-ammo-prices-availability-2025', title:"Canadian Ammo Prices in 2025: What's Available, What It Costs, Where to Buy", tag:'GUIDE', readMins:'7 min', imageUrl:'/img/photos/ammo.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Ammunition availability and pricing in Canada 2025. Cover: real CAD price comparisons (9mm, .308, 12ga, .22LR), why Canadian ammo costs more, best Canadian online retailers (Wolverine Supplies, Ellwood Epps, P.A.L. Gun Shop), import rules, reloading economics.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'Canada firearms rights organization protest', slug:'ccfr-nfa-canada-gun-rights-organizations', title:"The CCFR and NFA: Canada's Gun Rights Organizations and What They're Fighting For", tag:'LAW', readMins:'8 min', imageUrl:'/img/photos/law.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Canadian gun rights organizations — CCFR and NFA. Cover: what each does, legal victories and losses, Section 7 constitutional challenge to C-21, how Canadian advocacy differs from the US model, what gun owners can do.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'gun safe firearm storage security lock', slug:'canada-safe-storage-requirements-complete-guide', title:"Canadian Safe Storage Laws: What You're Actually Required to Do", tag:'LAW', readMins:'7 min', imageUrl:'/img/photos/homedefense.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Canadian safe storage requirements under the Firearms Act. Cover: non-restricted vs restricted storage rules, ammo storage, home defense access problem, what safe storage charges look like, recommended safes at real Canadian prices.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
  { imageQuery:'Canada provinces landscape outdoor firearms', slug:'canada-provinces-gun-friendly-ranked-2025', title:"Canada's Most Gun-Friendly Provinces Ranked for 2025", tag:'GUIDE', readMins:'8 min', imageUrl:'/img/photos/rifle.jpg', prompt:`${VOICE_RULES}\n\nWrite a 900-1100 word article for DownRange Canada, byline DJ Cavalcanti.\nTopic: Gun-friendly province ranking 2025. Rank and analyze: Alberta (best), Saskatchewan, Manitoba, BC, Ontario, Quebec (worst). Cover: provincial pushback on federal gun laws, rural hunting culture, local police attitudes, cost of living + gun ownership.\nFormat: HTML h2/p/ul/li/strong, text-align:justify on all p tags. No h1.` },
]

export async function GET() {
  return Response.json({ topics: WEEKLY_TOPICS.map(t => ({ slug: t.slug, title: t.title, tag: t.tag })) })
}

export async function POST(req) {
  const key    = req.headers.get('x-admin-key')
  const auth   = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  const valid  = (key && key === process.env.ADMIN_KEY) || (secret && auth === 'Bearer ' + secret) || !process.env.ADMIN_KEY
  if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { limit = 10, force = false } = await req.json().catch(() => ({}))
  const topics  = WEEKLY_TOPICS.slice(0, Math.min(limit, WEEKLY_TOPICS.length))
  const results = []

  for (const article of topics) {
    try {
      const existing = await sanity.fetch(
        '*[_type == "canadaContent" && type == "article" && slug.current == $slug][0]{ _id }',
        { slug: article.slug }
      )
      if (existing && !force) {
        results.push({ slug: article.slug, status: 'skipped', reason: 'already exists' })
        continue
      }

      const body = await callAIText({ prompt: article.prompt, useCase: 'canada', maxTokens: 2000 })
      if (!body || body.length < 200) throw new Error('Empty AI response')

      const summary = body.replace(/<[^>]+>/g, '').slice(0, 220).trim() + '...'

      if (existing && force) {
        await sanity.patch(existing._id).set({ body, summary }).commit()
        results.push({ slug: article.slug, status: 'updated', title: article.title })
      } else {
        await sanity.create({
          _type:           'canadaContent',
          type:            'article',
          title:           article.title,
          slug:            { _type: 'slug', current: article.slug },
          tag:             article.tag,
          readMins:        article.readMins,
          imageUrl:        (await fetchImage(article.imageQuery || 'Canada firearms')) || article.imageUrl || '/img/photos/law.jpg',
          body,
          summary,
          author:          'DJ Cavalcanti',
          qualityReviewed: false,
          publishedAt:     new Date().toISOString(),
          active:          true,
          order:           99,
        })
        results.push({ slug: article.slug, status: 'created', title: article.title })
      }

      await new Promise(r => setTimeout(r, 500))
    } catch (e) {
      results.push({ slug: article.slug, status: 'failed', error: e.message })
    }
  }

  const created = results.filter(r => r.status === 'created').length
  const updated = results.filter(r => r.status === 'updated').length
  const failed  = results.filter(r => r.status === 'failed').length
  const skipped = results.filter(r => r.status === 'skipped').length

  return Response.json({
    ok: true,
    message: `${created} created · ${updated} updated · ${skipped} skipped · ${failed} failed. Signed as DJ Cavalcanti, marked for review.`,
    results,
  })
}
