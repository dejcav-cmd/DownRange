export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

function pickPhoto(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen/.test(t)) return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc|p365|hellcat|shield|kimber|walther/.test(t)) return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr|ar.10|ddm4|scar|ruger.pc|m16|fn.*15|daniel|bcm/.test(t)) return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|remington.*870|benelli|gauge|pump|590|870/.test(t)) return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa|omega|dead.air|surefire|thunder|obsidian/.test(t)) return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic|hst|gold.dot|hornady|federal|speer/.test(t)) return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl|turkey|bear|boar/.test(t)) return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa|ipsc|3.gun|steel.*match|bianchi/.test(t)) return '/img/photos/competition.jpg'
  if (/train|range|practice|marksmanship|drill|dry.fire/.test(t)) return '/img/photos/training.jpg'
  if (/gear|holster|optic|sight|scope|light|sling|magazine|accessory/.test(t)) return '/img/photos/gear.jpg'
  if (/home.*defense|nightstand|self.defense/.test(t)) return '/img/photos/homedefense.jpg'
  if (/military|army|marine|navy|soldier|combat|veteran/.test(t)) return '/img/photos/military.jpg'
  return '/img/photos/news.jpg'
}

async function tryOgImage(url) {
  if (!url?.startsWith('http')) return null
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    for (const pat of [
      /property=["']og:image["'][^>]*content=["']([^"']{10,})["']/i,
      /content=["']([^"']{10,})["'][^>]*property=["']og:image["']/i,
      /name=["']twitter:image["'][^>]*content=["']([^"']{10,})["']/i,
      /content=["']([^"']{10,})["'][^>]*name=["']twitter:image["']/i,
    ]) {
      const m = html.match(pat)
      if (m && m[1].startsWith('http') &&
          !m[1].includes('placeholder') && !m[1].includes('logo') &&
          !m[1].includes('default') && !m[1].includes('favicon') &&
          !m[1].includes('avatar')) {
        return m[1]
      }
    }
  } catch {}
  return null
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, type = 'newsArticle', title = '', category = '', sourceUrl = '' } = await req.json().catch(() => ({}))
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  // For newsArticle the source URL field in Sanity is 'externalUrl'
  // The manager passes it as 'sourceUrl' param (already mapped in articles-list API)
  // Try the passed sourceUrl first, then fetch from Sanity if missing
  let resolvedSourceUrl = sourceUrl
  if (!resolvedSourceUrl) {
    try {
      const sourceField = type === 'newsArticle' ? 'externalUrl' : 'sourceUrl'
      const doc = await sanity.fetch(`*[_id == $id][0]{ "${sourceField}": ${sourceField} }`, { id })
      resolvedSourceUrl = doc?.[sourceField] || ''
    } catch {}
  }

  // Try OG image
  let imageUrl = await tryOgImage(resolvedSourceUrl)
  const source = imageUrl ? 'og:image' : 'photo-library'

  // Fall back to keyword-matched photo
  if (!imageUrl) imageUrl = pickPhoto(title, category)

  try {
    await sanity.patch(id).set({ imageUrl }).commit()
  } catch (e) {
    return Response.json({ error: `Sanity write failed: ${e.message}` }, { status: 500 })
  }

  return Response.json({ ok: true, imageUrl, source, changed: true })
}
