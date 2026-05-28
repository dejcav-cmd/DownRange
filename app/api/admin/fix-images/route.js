export const dynamic = 'force-dynamic'
export const maxDuration = 300
import { reportCronRun } from '@/lib/cronReporter'
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

const BAD_URLS = ['/img/pistol.svg','/img/rifle.svg','/img/shotgun.svg','/img/suppressor.svg','/img/ammo.svg','/img/law.svg','/img/news.svg','/img/photos/news.jpg','/img/photos/pistol.jpg','/img/photos/rifle.jpg','/img/photos/shotgun.jpg','/img/photos/suppressor.jpg','/img/photos/ammo.jpg','/img/photos/law.jpg']

function isBad(url = '') {
  if (!url) return true
  // SVGs always bad
  if (url.endsWith('.svg')) return true
  // Generic placeholder photos — we want the real OG image
  if (BAD_URLS.includes(url)) return true
  return false
}

async function tryOgImage(url) {
  if (!url || !url.startsWith('http')) return null
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
          !m[1].includes('default') && !m[1].includes('avatar') &&
          !m[1].includes('favicon')) {
        return m[1]
      }
    }
  } catch {}
  return null
}

export async function POST(req) {
  const t0 = Date.now()
  const key = req.headers.get('x-admin-key')
  const cron = req.headers.get('x-vercel-cron') === '1' ||
    (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`)
  if (key !== process.env.ADMIN_KEY && !cron) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url   = new URL(req.url)
  const batch = Math.min(200, parseInt(url.searchParams.get('batch') || '50'))
  const force = url.searchParams.get('force') === 'true'

  const stats = { scanned: 0, ogFetched: 0, photoAssigned: 0, alreadyOk: 0, failed: 0 }

  // NOTE: newsArticle uses 'externalUrl' for source, others use 'sourceUrl'
  // We alias them all to 'sourceUrl' in the projection for uniform handling
  // Build GROQ queries without JS interpolation inside string (Sanity treats $ as param)
  const newsSlice = '[0...' + String(batch) + ']'
  const QUERIES = [
    '*[_type == "newsArticle" && editorLocked != true] | order(publishedAt desc) ' + newsSlice + ' { _id, title, imageUrl, "sourceUrl": externalUrl, category }',
    '*[_type == "blogPost" && editorLocked != true] | order(_createdAt desc) [0...30] { _id, title, imageUrl, category }',
    '*[_type == "firearmRelease" && editorLocked != true] | order(_createdAt desc) [0...50] { _id, "title": brand + " " + model, imageUrl, sourceUrl, category }',
    '*[_type == "review" && editorLocked != true] | order(_createdAt desc) [0...30] { _id, "title": brand + " " + model, imageUrl, category }',
    '*[_type == "canadaContent" && editorLocked != true] | order(_createdAt desc) [0...30] { _id, title, imageUrl, category }',
  ]

  const allDocs = []
  for (const q of QUERIES) {
    try { allDocs.push(...(await sanity.fetch(q))) } catch (e) {
      console.error('[fix-images] query failed:', e.message)
    }
  }

  stats.scanned = allDocs.length

  for (const doc of allDocs) {
    // Skip if already has a real image and not forcing
    if (!force && !isBad(doc.imageUrl)) { stats.alreadyOk++; continue }
    // Also skip if forcing but image is already a real external URL
    if (force && doc.imageUrl && doc.imageUrl.startsWith('http') && !isBad(doc.imageUrl)) {
      stats.alreadyOk++; continue
    }

    // Step 1: try OG image from source URL
    let newUrl = null
    if (doc.sourceUrl) {
      newUrl = await tryOgImage(doc.sourceUrl)
      if (newUrl) stats.ogFetched++
    }

    // Step 2: fall back to category-matched real photo
    if (!newUrl) {
      newUrl = pickPhoto(doc.title || '', doc.category || '')
      stats.photoAssigned++
    }

    try {
      await sanity.patch(doc._id).set({ imageUrl: newUrl }).commit()
    } catch (e) {
      console.error('[fix-images] patch failed:', doc._id, e.message)
      stats.failed++
      stats.ogFetched = Math.max(0, stats.ogFetched - (newUrl?.startsWith('http') ? 1 : 0))
      stats.photoAssigned = Math.max(0, stats.photoAssigned - 1)
    }

    await new Promise(r => setTimeout(r, 60)) // gentle on Sanity rate limits
  }

  const ms = Date.now() - t0
  const msg = `${stats.scanned} scanned · ${stats.ogFetched} OG images fetched · ${stats.photoAssigned} photos assigned · ${stats.alreadyOk} already ok · ${stats.failed} failed`
  await reportCronRun('fix-images', {
    status: stats.failed > 10 ? 'failed' : 'success', ms, details: msg,
  }).catch(() => {})

  return Response.json({ ok: true, ...stats, ms, message: msg })
}

export async function GET(req) { return POST(req) }
