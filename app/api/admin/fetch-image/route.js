export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

// Real self-hosted photos — always available, no egress needed
function pickPhoto(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen|heller/.test(t))         return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc|p365|hellcat|shield|kimber|walther|hk.vp|fn.509|cz.p|ruger.*lc|springfield.*hell/.test(t)) return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr|ar.10|ddm4|scar|ruger.pc|m16|fn.*15|daniel|bcm|assault/.test(t)) return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|remington.*870|benelli|gauge|pump|590|870/.test(t))                               return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa|omega|dead.air|surefire|thunder|obsidian/.test(t))                        return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic|hst|gold.dot|hornady|federal|speer/.test(t))     return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl|turkey|bear|boar/.test(t))                                           return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa|ipsc|3.gun|steel.*match|bianchi/.test(t))                                      return '/img/photos/competition.jpg'
  if (/train|range|practice|marksmanship|drill|dry.fire/.test(t))                                        return '/img/photos/training.jpg'
  if (/gear|holster|optic|sight|scope|light|sling|magazine|accessory/.test(t))                           return '/img/photos/gear.jpg'
  if (/home.*defense|nightstand|self.defense/.test(t))                                                   return '/img/photos/homedefense.jpg'
  if (/military|army|marine|navy|soldier|combat|veteran/.test(t))                                        return '/img/photos/military.jpg'
  return '/img/photos/news.jpg'
}

async function tryOgImage(sourceUrl) {
  if (!sourceUrl?.startsWith('http')) return null
  try {
    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)' },
      signal:  AbortSignal.timeout(6000),
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
      if (m && m[1].startsWith('http') && !m[1].includes('placeholder') && !m[1].includes('logo') && !m[1].includes('default')) {
        return m[1]
      }
    }
  } catch {}
  return null
}

const IMAGE_FIELD = {
  newsArticle:    'imageUrl',
  blogPost:       'imageUrl',
  firearmRelease: 'imageUrl',
  review:         'imageUrl',
  canadaContent:  'imageUrl',
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, type = 'newsArticle', title = '', category = '', sourceUrl = '' } = await req.json().catch(() => ({}))
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  // Try OG image from source URL first
  let imageUrl = sourceUrl ? await tryOgImage(sourceUrl) : null
  const source = imageUrl ? 'og:image' : 'photo-library'

  // Always fall back to real keyword-matched photo
  if (!imageUrl) imageUrl = pickPhoto(title, category)

  const field = IMAGE_FIELD[type] || 'imageUrl'

  try {
    await sanity.patch(id).set({ [field]: imageUrl }).commit()
  } catch (e) {
    return Response.json({ error: `Sanity write failed: ${e.message}` }, { status: 500 })
  }

  return Response.json({ ok: true, imageUrl, source, changed: true })
}
