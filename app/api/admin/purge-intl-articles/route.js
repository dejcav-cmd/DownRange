export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// Domains whose articles should be deleted
const BLOCKED_DOMAINS = [
  'sunstar.com.ph','inquirer.net','philstar.com','rappler.com',
  'mb.com.ph','gmanetwork.com','cnn.ph','pna.gov.ph','abs-cbn.com',
  'manilatimes.net','businessmirror.com.ph',
  'thehindu.com','hindustantimes.com','timesofindia.com',
  'ndtv.com','indianexpress.com','livemint.com','deccanherald.com',
  'tribuneindia.com','firstpost.com',
  'dawn.com','thenews.com.pk','geo.tv','thedailystar.net',
]

// Title keywords that indicate non-US articles
const BLOCKED_KEYWORDS = [
  'shabu','pnp','pro-7','pro 7','cebu','davao','manila',
  'philippine national police','nbi philippines','mindanao','quezon city',
  'makati','pasay','caloocan','philipp',
  'karnataka','belagavi','maharashtra','country-made guns','country made guns',
  'desi katta','mumbai','delhi','bengaluru','chennai','kolkata','hyderabad',
  'pune','ahmedabad','lucknow','jaipur','odisha','assam','uttar pradesh',
  'bihar','rajasthan','punjab police','haryana police','indian police',
  'india police',
  'pakistan','bangladesh','afghanistan','karachi','lahore','islamabad',
]

// Stock/placeholder image domains to replace
const STOCK_DOMAINS = [
  'pixabay.com','cdn.pixabay.com',
  'images.pexels.com','pexels.com',
  'images.unsplash.com','unsplash.com',
  'lorempixel.com','picsum.photos','dummyimage.com',
  'placeholder.com','via.placeholder.com','placehold.co','fakeimg.pl',
]

function isStockImage(url = '') {
  if (!url) return false
  try {
    const h = new URL(url).hostname.replace('www.','')
    return STOCK_DOMAINS.some(d => h === d || h.endsWith('.'+d))
  } catch { return false }
}

function pickPhoto(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen/.test(t)) return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc/.test(t))            return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr/.test(t))                                           return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|gauge|pump/.test(t))                                               return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa/.test(t))                                                   return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet/.test(t))                                          return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game/.test(t))                                                        return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa/.test(t))                                                        return '/img/photos/competition.jpg'
  if (/train|range|practice/.test(t))                                                      return '/img/photos/training.jpg'
  if (/gear|holster|optic|scope/.test(t))                                                  return '/img/photos/gear.jpg'
  if (/home.*defense|self.defense/.test(t))                                                return '/img/photos/homedefense.jpg'
  if (/military|army|marine|soldier/.test(t))                                              return '/img/photos/military.jpg'
  return '/img/photos/news.jpg'
}

export async function POST(req) {
  const key      = req.headers.get('x-admin-key')
  const cronAuth = req.headers.get('authorization')
  const isCron   = process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = key === process.env.ADMIN_KEY
  if (!isCron && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const stats = { scanned: 0, deleted: 0, imageFixed: 0, errors: 0 }

  try {
    // Pull last 500 articles — enough to catch recent spam
    const articles = await sanity.fetch(
      `*[_type == "newsArticle"] | order(publishedAt desc) [0...500] {
        _id, title, imageUrl, "sourceUrl": externalUrl
      }`
    )
    stats.scanned = articles.length

    const toDelete = []
    const toFixImage = []

    for (const a of articles) {
      const url   = (a.sourceUrl || '').toLowerCase()
      const title = (a.title    || '').toLowerCase()

      // Check if domain is blocked
      const domainBlocked = BLOCKED_DOMAINS.some(d => url.includes(d))
      // Check if title has blocked keywords
      const titleBlocked = BLOCKED_KEYWORDS.some(k => title.includes(k))

      if (domainBlocked || titleBlocked) {
        toDelete.push(a._id)
        continue
      }

      // Check if image is a stock/placeholder URL → replace with local photo
      if (isStockImage(a.imageUrl)) {
        toFixImage.push({ id: a._id, title: a.title, imageUrl: a.imageUrl })
      }
    }

    // Delete in batches of 50
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50)
      const tx = sanity.transaction()
      batch.forEach(id => tx.delete(id))
      await tx.commit()
      stats.deleted += batch.length
    }

    // Fix stock images → local photo fallback
    if (toFixImage.length) {
      const mutations = toFixImage.map(a => ({
        patch: { id: a.id, set: { imageUrl: pickPhoto(a.title, '') } }
      }))
      // Batch in groups of 50
      for (let i = 0; i < mutations.length; i += 50) {
        await sanity.mutate(mutations.slice(i, i + 50))
        stats.imageFixed += Math.min(50, mutations.length - i)
      }
    }

    return Response.json({
      ok: true,
      ...stats,
      message: `Deleted ${stats.deleted} intl articles, fixed ${stats.imageFixed} stock images`,
    })
  } catch (err) {
    console.error('[PURGE-INTL]', err.message)
    return Response.json({ ok: false, error: err.message, ...stats }, { status: 500 })
  }
}

export async function GET(req) { return POST(req) }
