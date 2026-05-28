export const dynamic = 'force-dynamic'
export const maxDuration = 120
import { reportCronRun } from '@/lib/cronReporter'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// All real photos — self-hosted, always available
function pickPhoto(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen/.test(t)) return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc|p365|hellcat|shield|kimber|springfield|ruger.*lc|walther|hk.*vp|fn.*509|cz.*p10/.test(t)) return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr|assault|ar.10|ddm4|scar|ruger.pc|m16|mini.14|fn.*15|daniel|bcm/.test(t)) return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|remington.*870|benelli|gauge|pump|scatter|590|870/.test(t)) return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa|omega|dead.air|surefire.socom|can\b|thunder|obsidian/.test(t)) return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic|hst|gold.dot|critical|hornady|federal|speer/.test(t)) return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl|turkey|bear|boar/.test(t)) return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa|ipsc|3.gun|multigun|steel.*match|bianchi/.test(t)) return '/img/photos/competition.jpg'
  if (/train|range|practice|marksmanship|drill|qualification|dry.fire/.test(t)) return '/img/photos/training.jpg'
  if (/gear|holster|accessory|optic|sight|scope|light|sling|magazine/.test(t)) return '/img/photos/gear.jpg'
  if (/home.*defense|nightstand|self.defense/.test(t)) return '/img/photos/homedefense.jpg'
  if (/military|army|marine|navy|soldier|combat|veteran|troop/.test(t)) return '/img/photos/military.jpg'
  return '/img/photos/news.jpg'
}

const BAD = ['.svg', '/img/pistol', '/img/rifle', '/img/shotgun', '/img/suppressor', '/img/ammo', '/img/law', '/img/news']
function isBad(url = '') {
  if (!url) return true
  return BAD.some(p => url.includes(p))
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
    ]) {
      const m = html.match(pat)
      if (m && m[1].startsWith('http') && !m[1].includes('placeholder') && !m[1].includes('logo')) return m[1]
    }
  } catch {}
  return null
}

export async function POST(req) {
  const t0  = Date.now()
  const key = req.headers.get('x-admin-key')
  const cron = req.headers.get('x-vercel-cron') === '1' || (process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`)
  if (key !== process.env.ADMIN_KEY && !cron) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url   = new URL(req.url)
  const batch = Math.min(100, parseInt(url.searchParams.get('batch') || '50'))
  const force = url.searchParams.get('force') === 'true'

  const stats = { scanned:0, fixed:0, alreadyOk:0, failed:0 }

  // Query ALL content types with bad images
  const QUERIES = [
    `*[_type=="newsArticle"    && (${force ? 'true' : '!defined(imageUrl) || imageUrl == "" || string::startsWith(imageUrl, "/img/pistol") || string::startsWith(imageUrl, "/img/rifle") || string::startsWith(imageUrl, "/img/shotgun") || string::startsWith(imageUrl, "/img/suppressor") || string::startsWith(imageUrl, "/img/ammo") || string::startsWith(imageUrl, "/img/law") || string::startsWith(imageUrl, "/img/news")'})] | order(publishedAt desc) [0...${batch}] { _id, title, imageUrl, sourceUrl, category }`,
    `*[_type=="blogPost"       && (${force ? 'true' : '!defined(imageUrl) || imageUrl == "" || string::startsWith(imageUrl, "/img/pistol") || string::startsWith(imageUrl, "/img/rifle") || string::startsWith(imageUrl, "/img/shotgun") || string::startsWith(imageUrl, "/img/suppressor") || string::startsWith(imageUrl, "/img/ammo") || string::startsWith(imageUrl, "/img/law") || string::startsWith(imageUrl, "/img/news")'})] | order(_createdAt desc) [0...20] { _id, title, imageUrl, category }`,
    `*[_type=="firearmRelease" && (${force ? 'true' : '!defined(imageUrl) || imageUrl == "" || string::startsWith(imageUrl, "/img/pistol") || string::startsWith(imageUrl, "/img/rifle") || string::startsWith(imageUrl, "/img/shotgun") || string::startsWith(imageUrl, "/img/suppressor") || string::startsWith(imageUrl, "/img/ammo") || string::startsWith(imageUrl, "/img/law") || string::startsWith(imageUrl, "/img/news")'})] | order(_createdAt desc) [0...30] { _id, "title": brand+" "+model, imageUrl, sourceUrl, category }`,
    `*[_type=="review"         && (${force ? 'true' : '!defined(imageUrl) || imageUrl == "" || string::startsWith(imageUrl, "/img/pistol") || string::startsWith(imageUrl, "/img/rifle") || string::startsWith(imageUrl, "/img/shotgun") || string::startsWith(imageUrl, "/img/suppressor") || string::startsWith(imageUrl, "/img/ammo") || string::startsWith(imageUrl, "/img/law") || string::startsWith(imageUrl, "/img/news")'})] | order(_createdAt desc) [0...20] { _id, "title": brand+" "+model, imageUrl, category }`,
    `*[_type=="canadaContent"  && (${force ? 'true' : '!defined(imageUrl) || imageUrl == "" || string::startsWith(imageUrl, "/img/pistol") || string::startsWith(imageUrl, "/img/rifle") || string::startsWith(imageUrl, "/img/shotgun") || string::startsWith(imageUrl, "/img/suppressor") || string::startsWith(imageUrl, "/img/ammo") || string::startsWith(imageUrl, "/img/law") || string::startsWith(imageUrl, "/img/news")'})] | order(_createdAt desc) [0...20] { _id, title, imageUrl, category }`,
  ]

  const allDocs = []
  for (const q of QUERIES) {
    try { allDocs.push(...(await sanity.fetch(q))) } catch {}
  }

  stats.scanned = allDocs.length

  for (const doc of allDocs) {
    if (!force && !isBad(doc.imageUrl)) { stats.alreadyOk++; continue }

    // Try OG image from source first
    let newUrl = doc.sourceUrl ? await tryOgImage(doc.sourceUrl) : null
    if (!newUrl) newUrl = pickPhoto(doc.title || '', doc.category || '')

    try {
      await sanity.patch(doc._id).set({ imageUrl: newUrl }).commit()
      stats.fixed++
    } catch { stats.failed++ }

    await new Promise(r => setTimeout(r, 80))
  }

  const ms  = Date.now() - t0
  const msg = `Fixed ${stats.fixed} images across all content types (${stats.scanned} scanned, ${stats.alreadyOk} already ok, ${stats.failed} failed)`
  await reportCronRun('fix-images', { status: stats.failed > 20 ? 'failed' : 'success', ms, details: msg }).catch(() => {})
  return Response.json({ ok: true, ...stats, ms, message: msg })
}

export async function GET(req) { return POST(req) }
