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

const BAD = ['/img/news.svg','/img/pistol.svg','/img/rifle.svg','/img/shotgun.svg','/img/suppressor.svg','/img/ammo.svg','/img/law.svg']
function isBad(url = '') { return !url || BAD.some(p => url.endsWith(p)) }

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
    const articles = await sanity.fetch(`*[_type=="newsArticle"] | order(publishedAt desc) [0...50] { _id, title, imageUrl, sourceUrl, category }`)
    stats.scanned = articles.length

    for (const a of articles) {
      if (a.imageUrl && !isBad(a.imageUrl)) { stats.alreadyOk++; continue }
      let newUrl = null
      if (a.sourceUrl) { newUrl = await tryOgImage(a.sourceUrl); if (newUrl) stats.ogFetched++ }
      if (!newUrl) { newUrl = pickFallback(a.title, a.category); stats.photoFallback++ }
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
