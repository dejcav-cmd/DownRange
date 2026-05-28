export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

// Keyword → real photo mapping (self-hosted, always available)
function pickPhoto(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen|heller/.test(t)) return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc|p365|hellcat|shield/.test(t)) return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr|assault|ar.10|ddm4|scar|ruger.pc/.test(t))                  return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|remington.*870|benelli|gauge|pump|scatter/.test(t))                         return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa|omega|dead.air|surefire.socom|can\b/.test(t))                       return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic|hst|gold.dot|critical/.test(t))            return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl|turkey|bear|boar/.test(t))                                     return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa|ipsc|3.gun|multigun|steel.*match|bianchi/.test(t))                       return '/img/photos/competition.jpg'
  if (/train|range|practice|marksmanship|drill|qualification|dry.fire/.test(t))                    return '/img/photos/training.jpg'
  if (/gear|holster|accessory|optic|sight|scope|light|sling|magazine/.test(t))                     return '/img/photos/gear.jpg'
  if (/home.*defense|nightstand|self.defense|home.*security/.test(t))                              return '/img/photos/homedefense.jpg'
  if (/military|army|marine|navy|soldier|combat|veteran|troop|special.forces/.test(t))             return '/img/photos/military.jpg'
  if (/news|shot.show|industry|manufacturer|nssf|dealer|store/.test(t))                            return '/img/photos/news.jpg'
  return '/img/photos/news.jpg'
}

async function tryOgImage(sourceUrl) {
  if (!sourceUrl?.startsWith('http')) return null
  try {
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0 image-bot)' },
      signal:  AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    for (const pat of [
      /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i,
    ]) {
      const m = html.match(pat)
      if (m && m[1].startsWith('http') && !m[1].includes('placeholder') && !m[1].includes('logo')) {
        return m[1]
      }
    }
  } catch {}
  return null
}

// Types → Sanity field names
const TYPE_CONFIG = {
  newsArticle:    { imageField: 'imageUrl', sourceField: 'sourceUrl' },
  blogPost:       { imageField: 'imageUrl', sourceField: null },
  firearmRelease: { imageField: 'imageUrl', sourceField: 'sourceUrl' },
  review:         { imageField: 'imageUrl', sourceField: null },
  canadaContent:  { imageField: 'imageUrl', sourceField: null },
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, type = 'newsArticle', title = '', category = '', sourceUrl = '' } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.newsArticle
  let imageUrl = null
  let source   = 'photo-library'

  // Step 1: Try og:image from source URL
  if (sourceUrl) {
    imageUrl = await tryOgImage(sourceUrl)
    if (imageUrl) source = 'og:image'
  }

  // Step 2: If no OG image, check if we already have a non-SVG image from Sanity
  if (!imageUrl) {
    try {
      const doc = await sanity.fetch(`*[_id == $id][0]{ ${cfg.imageField}, ${cfg.sourceField || '"_none":null'} }`, { id })
      const existing = doc?.[cfg.imageField]
      const existingSource = cfg.sourceField ? doc?.[cfg.sourceField] : null

      // Try the stored source URL if different from passed one
      if (!sourceUrl && existingSource) {
        imageUrl = await tryOgImage(existingSource)
        if (imageUrl) source = 'og:image'
      }

      // If existing is already a real photo (not SVG), return it
      if (!imageUrl && existing && !existing.endsWith('.svg') && existing.startsWith('http')) {
        return Response.json({ ok: true, imageUrl: existing, source: 'existing', changed: false })
      }
    } catch {}
  }

  // Step 3: Fall back to keyword-matched real photo
  if (!imageUrl) {
    imageUrl = pickPhoto(title, category)
    source   = 'photo-library'
  }

  // Save to Sanity
  try {
    await sanity.patch(id).set({ [cfg.imageField]: imageUrl }).commit()
  } catch (e) {
    return Response.json({ error: `Sanity write failed: ${e.message}` }, { status: 500 })
  }

  return Response.json({ ok: true, imageUrl, source, changed: true })
}
