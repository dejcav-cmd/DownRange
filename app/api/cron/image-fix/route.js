export const dynamic  = 'force-dynamic'
export const maxDuration = 300

import { reportCronRun } from '@/lib/cronReporter'
import { createClient }  from '@sanity/client'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production', apiVersion: '2024-01-01', useCdn: false,
  token:      process.env.SANITY_API_TOKEN,
})

function pickFallback(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen/.test(t)) return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc/.test(t))            return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr|assault/.test(t))                                   return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|remington.*870|gauge|pump/.test(t))                                return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa|omega|dead air/.test(t))                                   return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain/.test(t))                                   return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl/.test(t))                                             return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa|ipsc|3.gun|steel.*match/.test(t))                               return '/img/photos/competition.jpg'
  if (/train|range|practice|marksmanship/.test(t))                                        return '/img/photos/training.jpg'
  if (/gear|holster|accessory|optic|scope|light/.test(t))                                 return '/img/photos/gear.jpg'
  if (/home.*defense|nightstand|self.defense/.test(t))                                    return '/img/photos/homedefense.jpg'
  if (/military|army|marine|soldier|combat|veteran/.test(t))                              return '/img/photos/military.jpg'
  return '/img/photos/news.jpg'
}

const BAD = [
  '/img/photos/', '/img/pistol', '/img/rifle', '/img/law', '/img/shotgun',
  '/img/suppressor', '/img/ammo', '/img/news', '/img/gear', '/img/training',
  '/img/hunting', '/img/military', '/img/homedefense', '/img/competition',
]
function isBad(url = '') {
  if (!url) return true
  return BAD.some(p => url.includes(p))
}

async function searchPixabay(title, category) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) return null
  try {
    const query = buildImageQuery(title, category)
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=800&per_page=3&safesearch=true`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    const hit = (data.hits || [])[0]
    return hit?.largeImageURL || hit?.webformatURL || null
  } catch { return null }
}

async function searchPexels(title, category) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  try {
    const query = buildImageQuery(title, category)
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: key }, signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()
    return data.photos?.[0]?.src?.large || null
  } catch { return null }
}

function buildImageQuery(title, category) {
  const t = (title + ' ' + category).toLowerCase()
  if (/home.?defense|self.?defense/.test(t)) return 'home defense firearm gun'
  if (/conceal|carry|edc|holster|ccw/.test(t)) return 'concealed carry holster pistol'
  if (/ammo|ammunition|cartridge|bullet/.test(t)) return 'firearm ammunition bullets'
  if (/clean|maintain/.test(t)) return 'gun cleaning maintenance firearm'
  if (/train|range|practice/.test(t)) return 'shooting range training firearms'
  if (/law|court|atf|bill|bruen|legislat/.test(t)) return 'second amendment law constitution US'
  if (/suppressor|silencer/.test(t)) return 'firearm suppressor NFA'
  if (/storage|safe|lock/.test(t)) return 'gun safe firearm storage security'
  if (/ar.?15|rifle|carbine/.test(t)) return 'AR-15 rifle firearms range'
  if (/pistol|handgun|glock|sig/.test(t)) return 'handgun pistol shooting range'
  if (/shotgun|mossberg|gauge/.test(t)) return 'shotgun firearms range'
  if (/hunt/.test(t)) return 'hunting rifle outdoors'
  return 'firearms gun second amendment'
}

async function tryOgImage(sourceUrl) {
  if (!sourceUrl?.startsWith('http')) return null
  try {
    const res = await fetch(sourceUrl, { headers:{'User-Agent':'Mozilla/5.0 (compatible; DownRange/1.0)'}, signal: AbortSignal.timeout(7000) })
    if (!res.ok) return null
    const html = await res.text()
    for (const pat of [/property=["']og:image["'][^>]+content=["']([^"']+)["']/i, /content=["']([^"']+)["'][^>]+property=["']og:image["']/i]) {
      const m = html.match(pat)
      if (m && m[1].startsWith('http') && !m[1].includes('placeholder') && !m[1].includes('logo')) return m[1]
    }
    return null
  } catch { return null }
}

export async function GET(req)  { return handler(req) }
export async function POST(req) { return handler(req) }

async function handler(req) {
  const t0 = Date.now()
  const isCron   = process.env.CRON_SECRET && (req.headers.get('authorization')||'') === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = process.env.ADMIN_KEY   && (req.headers.get('x-admin-key')||'')   === process.env.ADMIN_KEY
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && !isAdmin && !isVercel) return Response.json({ error:'Unauthorized' }, { status:401 })

  const stats = { scanned:0, ogFetched:0, photoFallback:0, alreadyOk:0, failed:0 }

  try {
    // Cover newsArticle + canadaContent articles + brazilContent artigos
    const [newsArts, canadaArts, brazilArts] = await Promise.all([
      sanity.fetch('*[_type=="newsArticle"] | order(publishedAt desc) [0...50] { _id, title, imageUrl, sourceUrl, category }'),
      sanity.fetch('*[_type=="canadaContent" && type=="article"] | order(publishedAt desc) [0...20] { _id, title, imageUrl, sourceUrl }'),
      sanity.fetch('*[_type=="brazilContent" && type=="artigo"] | order(publishedAt desc) [0...20] { _id, title, imageUrl, sourceUrl }'),
    ])

    const allItems = [
      ...newsArts.map(a => ({...a, _country:'us'})),
      ...canadaArts.map(a => ({...a, _country:'canada'})),
      ...brazilArts.map(a => ({...a, _country:'brazil'})),
    ]
    stats.scanned = allItems.length

    for (const a of allItems) {
      if (a.imageUrl && !isBad(a.imageUrl)) { stats.alreadyOk++; continue }
      let newUrl = null
      // Country-specific query for intl articles
      const catOrCountry = a._country !== 'us' ? a._country + ' firearms' : (a.category || '')
      if (a.sourceUrl) { newUrl = await tryOgImage(a.sourceUrl); if (newUrl) stats.ogFetched++ }
      if (!newUrl) { newUrl = await searchPixabay(a.title, catOrCountry); if (newUrl) stats.ogFetched++ }
      if (!newUrl) { newUrl = await searchPexels(a.title, catOrCountry); if (newUrl) stats.ogFetched++ }
      if (!newUrl) { newUrl = pickFallback(a.title, a.category || ''); stats.photoFallback++ }
      try { await sanity.patch(a._id).set({ imageUrl: newUrl }).commit() }
      catch (e) { stats.failed++; stats.photoFallback-- }
      await new Promise(r => setTimeout(r, 80))
    }

    const ms  = Date.now() - t0
    const msg = `Scanned ${stats.scanned} · ok: ${stats.alreadyOk} · OG: ${stats.ogFetched} · fallback: ${stats.photoFallback} · failed: ${stats.failed}`
    await reportCronRun('image-fix', { status: stats.failed > 10 ? 'failed' : 'success', ms, details: msg })
    return Response.json({ ok:true, ...stats, ms, message: msg })
  } catch (e) {
    const ms = Date.now() - t0
    await reportCronRun('image-fix', { status:'failed', ms, error: e.message })
    return Response.json({ ok:false, error:e.message, ms }, { status:500 })
  }
}
