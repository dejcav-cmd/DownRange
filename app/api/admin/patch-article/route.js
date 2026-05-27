export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const LAW_IMAGE    = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/US_Supreme_Court_Building.jpg/1280px-US_Supreme_Court_Building.jpg'
const PISTOL_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg'
const RIFLE_IMAGE  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/M4A1_SOPMOD_Block_II.jpg/1280px-M4A1_SOPMOD_Block_II.jpg'

function pickImage(title, category) {
  const t = (title || '').toLowerCase()
  if (/constitutional.carry|gun.control|preemption|second.amend|2a.rights/.test(t)) return LAW_IMAGE
  if (/\blegislat|\bbill\b|congress|senate|most.viewed.bill|week.of/.test(t)) return LAW_IMAGE
  if (/atf\b|scotus|supreme.court|circuit.court|federal.court|injunction/.test(t)) return LAW_IMAGE
  if (/\bfeds\b|federal.agent|\bdoj\b|\bfbi\b|indicted|prosecut|charged with/.test(t)) return LAW_IMAGE
  if (/\bban\b|lawsuit|legal.challenge|unconstitutional|bruen|heller|mcdonald/.test(t)) return LAW_IMAGE
  if (/\bsaf\b|\bnra\b|\bgoa\b|\bfpc\b|second.amendment.foundation/.test(t)) return LAW_IMAGE
  if (/pistols?|handguns?|glock|sig.sauer|bodyguard|shield|hellcat|p365|p320/.test(t)) return PISTOL_IMAGE
  if (/9mm|45.acp|40.s&w|380.acp|10mm|concealed.carry|edc|ccw|carry.gun/.test(t)) return PISTOL_IMAGE
  if (/smith.wesson|s&w|ruger|kimber|springfield.armory|walther|beretta|fn.509/.test(t)) return PISTOL_IMAGE
  if (/iron.sight|trigger.upgrade|holster|magazine|mag.release/.test(t)) return PISTOL_IMAGE
  if (/ar.?15|ar15|m4\b|m16|ak.?47|rifle|carbine|bolt.action/.test(t)) return RIFLE_IMAGE
  if (/5\.56|6\.5.creedmoor|\.308|\.223|300.blackout|suppressor|silencer|nfa/.test(t)) return RIFLE_IMAGE
  if (/shotgun|12.gauge|mossberg|benelli/.test(t)) return RIFLE_IMAGE
  if (/optic|scope|red.dot|eotech|aimpoint|trijicon|vortex/.test(t)) return RIFLE_IMAGE
  if (/ammo|ammunition|cartridge|\bgrain\b|fmj|jhp/.test(t)) return PISTOL_IMAGE
  const catMap = { law: LAW_IMAGE, breaking: LAW_IMAGE, opinion: LAW_IMAGE, industry: RIFLE_IMAGE, training: PISTOL_IMAGE, news: PISTOL_IMAGE }
  return catMap[category] || PISTOL_IMAGE
}

function isBrokenUrl(url) {
  if (!url) return true
  const trusted = ['upload.wikimedia.org', 'cdn.sanity.io', 'img.youtube.com', 'i.ytimg.com', 'images.unsplash.com']
  return !trusted.some(d => url.includes(d))
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let total = 0, fixed = 0, skipped = 0
  const results = []

  // Paginate through ALL articles — 200 at a time
  let offset = 0
  const PAGE = 200
  while (true) {
    const batch = await sanity.fetch(
      `*[_type == "newsArticle"][${offset}...${offset + PAGE}]{_id, title, category, slug, imageUrl, heroImage{asset->{url}}}`
    )
    if (!batch.length) break
    total += batch.length

    // Build mutation array for this batch
    const mutations = []
    for (const a of batch) {
      const current = a.heroImage?.asset?.url || a.imageUrl
      if (isBrokenUrl(current)) {
        const correct = pickImage(a.title, a.category)
        mutations.push({ patch: { id: a._id, set: { imageUrl: correct } } })
        fixed++
        if (results.length < 20) results.push({ slug: a.slug?.current, was: (a.imageUrl || 'null').slice(0, 40), now: correct.split('/').pop() })
      } else {
        skipped++
      }
    }

    // Commit batch mutations in one request
    if (mutations.length > 0) {
      await sanity.mutate(mutations)
    }

    offset += PAGE
    if (batch.length < PAGE) break
  }

  return Response.json({ ok: true, total, fixed, skipped, results })
}

export async function GET(req) { return POST(req) }
