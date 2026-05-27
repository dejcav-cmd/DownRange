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

// Any URL containing these strings is a generic placeholder — always re-evaluate
const PLACEHOLDER_PATTERNS = [
  'upload.wikimedia.org',
  'images.unsplash.com',
  'wikimedia.org/wikipedia/commons',
]

function isPlaceholder(url) {
  if (!url) return true
  return PLACEHOLDER_PATTERNS.some(p => url.includes(p))
}

function pickImage(title, category) {
  const t = (title || '').toLowerCase()
  // LAW first — must precede pistol patterns
  if (/constitutional.carry|gun.control|preemption|second.amend|2a.rights/.test(t)) return LAW_IMAGE
  if (/\blegislat|\bbill\b|congress|senate|most.viewed.bill|week.of/.test(t)) return LAW_IMAGE
  if (/atf\b|scotus|supreme.court|circuit.court|federal.court|injunction/.test(t)) return LAW_IMAGE
  if (/\bfeds\b|federal.agent|\bdoj\b|\bfbi\b|indicted|prosecut|charged with/.test(t)) return LAW_IMAGE
  if (/\bban\b|lawsuit|legal.challenge|unconstitutional|bruen|heller|mcdonald/.test(t)) return LAW_IMAGE
  if (/\bsaf\b|\bnra\b|\bgoa\b|\bfpc\b|second.amendment.foundation/.test(t)) return LAW_IMAGE
  // PISTOL
  if (/pistols?|handguns?|glock|sig.sauer|bodyguard|shield|hellcat|p365|p320/.test(t)) return PISTOL_IMAGE
  if (/9mm|45.acp|40.s&w|380.acp|10mm|concealed.carry|edc|ccw|carry.gun/.test(t)) return PISTOL_IMAGE
  if (/smith.wesson|s&w|ruger|kimber|springfield.armory|walther|beretta|fn.509/.test(t)) return PISTOL_IMAGE
  if (/iron.sight|trigger.upgrade|holster|magazine|mag.release/.test(t)) return PISTOL_IMAGE
  // RIFLE
  if (/ar.?15|ar15|m4\b|m16|ak.?47|rifle|carbine|bolt.action/.test(t)) return RIFLE_IMAGE
  if (/5\.56|6\.5.creedmoor|\.308|\.223|300.blackout|suppressor|silencer|nfa/.test(t)) return RIFLE_IMAGE
  if (/shotgun|12.gauge|mossberg|benelli/.test(t)) return RIFLE_IMAGE
  if (/optic|scope|red.dot|eotech|aimpoint|trijicon|vortex/.test(t)) return RIFLE_IMAGE
  if (/ammo|ammunition|cartridge|\bgrain\b|fmj|jhp/.test(t)) return PISTOL_IMAGE
  const catMap = { law: LAW_IMAGE, breaking: LAW_IMAGE, opinion: LAW_IMAGE, industry: RIFLE_IMAGE, training: PISTOL_IMAGE, news: PISTOL_IMAGE }
  return catMap[category] || PISTOL_IMAGE
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch ALL approved articles — no filter, patch everything
  const articles = await sanity.fetch(
    '*[_type=="newsArticle" && approved==true][0...500]{_id,title,category,slug,imageUrl}'
  )

  let fixed = 0
  let skipped = 0
  const results = []

  for (const a of articles) {
    const correct = pickImage(a.title, a.category)
    const current = a.imageUrl || ''

    // Always re-evaluate if:
    // 1. No image at all
    // 2. Has a generic placeholder (Unsplash, Wikimedia) that might be wrong
    if (!current || isPlaceholder(current)) {
      // Only write if it would actually change
      if (current !== correct) {
        await sanity.patch(a._id).set({ imageUrl: correct }).commit()
        results.push({
          slug:  a.slug?.current,
          title: (a.title || '').slice(0, 60),
          old:   current ? current.split('/').pop().slice(0, 30) : 'none',
          new:   correct.split('/').pop(),
        })
        fixed++
      } else {
        skipped++
      }
    } else {
      // Has a real non-placeholder image (from RSS/source) — leave it alone
      skipped++
    }
  }

  // Trigger revalidation for patched articles so they serve fresh images immediately
  if (fixed > 0 && process.env.REVALIDATE_SECRET) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.downrangeco.com'
    await Promise.allSettled(
      results.slice(0, 20).map(r =>
        r.slug ? fetch(baseUrl + '/api/revalidate?secret=' + process.env.REVALIDATE_SECRET + '&path=/news/' + r.slug) : null
      ).filter(Boolean)
    )
  }

  return Response.json({ ok: true, total: articles.length, fixed, skipped, results })
}

export async function GET(req) { return POST(req) }
