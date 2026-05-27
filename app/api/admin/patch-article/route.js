export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// ── Curated Wikimedia images, verified accessible ───────────────────────────
// Self-hosted SVGs served from Vercel CDN — zero external deps
const IMAGES = {
  LAW:    '/img/law.svg',
  PISTOL: '/img/pistol.svg',
  RIFLE:  '/img/rifle.svg',
  AMMO:   '/img/ammo.svg',
}

// Keyword → image mapping — checked in order, first match wins
const RULES = [
  // LAW / LEGAL
  [/\bban\b|lawsuit|saf\b|nra-ila|ccfr|court|atf\b|scotus|supreme.court|circuit|injunction|unconstitutional|bruen|heller|mcdonald|legislation|\bbill\b|congress|senate|second.amend|2a.rights|constitutional.carry|gun.control|preemption|nra\b|goa\b|fpc\b|feds\b|doj\b|fbi\b|indicted|prosecut|charged with|federal.agent|legal.challenge/i, IMAGES.LAW],
  // PISTOL / HANDGUN
  [/pistol|handgun|glock|sig.sauer|sig p|p365|p320|hellcat|shield|bodyguard|9mm|45.acp|40.s&w|380.acp|10mm|concealed.carry|edc|ccw|carry.gun|smith.wesson|s&w|ruger|kimber|springfield.armory|walther|beretta|fn.509|fn5|iron.sight|trigger.upgrade|holster|magazine|mag.release|revolver/i, IMAGES.PISTOL],
  // RIFLE / LONG GUN
  [/ar.?15|ar15|m4\b|m16|ak.?47|rifle|carbine|bolt.action|5\.56|6\.5.creedmoor|\.308|\.223|300.blackout|suppressor|silencer|nfa|shotgun|12.gauge|mossberg|benelli|optic|scope|red.dot|eotech|aimpoint|trijicon|vortex|precision.rifle|prs|long.range/i, IMAGES.RIFLE],
  // AMMO
  [/ammo|ammunition|cartridge|\bgrain\b|fmj|jhp|hollow.point|9mm.ammo|bulk.ammo|rounds/i, IMAGES.AMMO],
]

// Category fallbacks
const CAT_MAP = {
  law:      IMAGES.LAW,
  breaking: IMAGES.LAW,
  opinion:  IMAGES.LAW,
  industry: IMAGES.RIFLE,
  training: IMAGES.PISTOL,
  news:     IMAGES.PISTOL,
  deals:    IMAGES.PISTOL,
}

function pickImage(title, category) {
  const t = (title || '').toLowerCase()
  for (const [pattern, img] of RULES) {
    if (pattern.test(t)) return img
  }
  return CAT_MAP[category] || IMAGES.PISTOL
}

// An imageUrl is "wrong" if:
// 1. It's null/empty
// 2. It's NOT from a trusted CDN (external RSS photo = likely unrelated stock image)
// 3. It IS from Wikimedia BUT is the wrong image for the article topic
function needsFix(imageUrl, title, category) {
  if (!imageUrl) return true

  const TRUSTED = ['/img/', 'cdn.sanity.io', 'img.youtube.com', 'i.ytimg.com']
  const isTrusted = TRUSTED.some(d => imageUrl.includes(d))

  // Not from trusted CDN = external RSS stock photo = replace it
  if (!isTrusted) return true

  // If it's a Sanity CDN upload, it was manually set — keep it
  if (imageUrl.includes('cdn.sanity.io')) return false

  // It's a Wikimedia URL — check it's the RIGHT one for this article
  const correct = pickImage(title, category)
  if (imageUrl !== correct) return true

  return false
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { force } = await req.json().catch(() => ({}))
  
  let total = 0, fixed = 0, skipped = 0
  const samples = []

  // Paginate ALL articles in batches of 200
  let offset = 0
  while (true) {
    const batch = await sanity.fetch(
      `*[_type == "newsArticle"][${offset}...${offset + 200}] {
        _id, title, category, slug, imageUrl,
        heroImage { asset->{url} }
      }`
    )
    if (!batch.length) break
    total += batch.length

    const mutations = []
    for (const a of batch) {
      // Don't touch manually-uploaded Sanity CDN images
      const effectiveUrl = a.heroImage?.asset?.url || a.imageUrl
      if (effectiveUrl?.includes('cdn.sanity.io')) { skipped++; continue }

      const correct = pickImage(a.title, a.category)

      if (force || needsFix(a.imageUrl, a.title, a.category)) {
        mutations.push({ patch: { id: a._id, set: { imageUrl: correct } } })
        fixed++
        if (samples.length < 15) samples.push({
          slug:    a.slug?.current || a._id,
          title:   (a.title || '').slice(0, 55),
          was:     (a.imageUrl || 'null').split('/').pop().slice(0, 30),
          now:     correct.split('/').pop(),
        })
      } else {
        skipped++
      }
    }

    if (mutations.length) await sanity.mutate(mutations)
    offset += 200
    if (batch.length < 200) break
  }

  return Response.json({ ok: true, total, fixed, skipped, samples })
}

export async function GET(req) { return POST(req) }
