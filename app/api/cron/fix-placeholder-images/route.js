export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

// ── HELPERS ───────────────────────────────────────────────────────────────────

function pickPhoto(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen/.test(t))           return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc|p365|hellcat|shield|walther/.test(t)) return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr|ar.10|ddm4|scar|ruger.pc|m16|bcm/.test(t))                  return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|remington.*870|benelli|gauge|pump|590|870/.test(t))                         return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa|omega|dead.air|surefire|thunder|obsidian/.test(t))                   return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic|hornady|federal|speer|reload/.test(t))      return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl|turkey|bear|boar/.test(t))                                      return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa|ipsc|3.gun|steel.*match|bianchi/.test(t))                                 return '/img/photos/competition.jpg'
  if (/train|range|practice|marksmanship|drill|dry.fire/.test(t))                                   return '/img/photos/training.jpg'
  if (/gear|holster|optic|sight|scope|light|sling|magazine|accessory/.test(t))                     return '/img/photos/gear.jpg'
  if (/home.*defense|nightstand|self.defense/.test(t))                                              return '/img/photos/homedefense.jpg'
  if (/military|army|marine|navy|soldier|combat|veteran/.test(t))                                   return '/img/photos/military.jpg'
  return '/img/photos/news.jpg'
}

function isGoodImage(url) {
  if (!url || typeof url !== 'string') return false
  const lower = url.toLowerCase()
  if (lower.includes('.svg'))                         return false
  if (lower.includes('logo') && !lower.includes('gun')) return false
  if (lower.includes('favicon'))                      return false
  if (lower.includes('1x1') || lower.includes('pixel') || lower.includes('spacer')) return false
  if (lower.includes('placeholder') || lower.includes('default-image'))              return false
  if (!lower.match(/\.(jpg|jpeg|png|webp)/))          return false
  return true
}

async function extractOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()

    const patterns = [
      html.match(/<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']/i),
      html.match(/<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+property=[\"']og:image[\"']/i),
      html.match(/<meta[^>]+name=[\"']twitter:image[\"'][^>]+content=[\"']([^\"']+)[\"']/i),
      html.match(/<meta[^>]+content=[\"']([^\"']+)[\"'][^>]+name=[\"']twitter:image[\"']/i),
    ]
    for (const m of patterns) {
      if (m?.[1]) {
        let url = m[1].trim()
        if (url.startsWith('//')) url = 'https:' + url
        if (url.startsWith('/'))  { const b = new URL(pageUrl); url = b.origin + url }
        if (isGoodImage(url)) return url
      }
    }
    return null
  } catch { return null }
}

async function uploadToSanity(imageUrl, filename) {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer':    imageUrl,
        'Accept':     'image/*,*/*',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!imgRes.ok) return null
    const ct = imgRes.headers.get('content-type') || 'image/jpeg'
    if (!ct.includes('image')) return null
    const buf = await imgRes.arrayBuffer()
    if (buf.byteLength < 5000) return null
    const asset = await sanity.assets.upload('image', Buffer.from(buf), { filename, contentType: ct })
    return asset?.url || null
  } catch { return null }
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

async function handler(req) {
  const t0        = Date.now()
  const authHeader = req.headers.get('authorization')
  const cronHeader = req.headers.get('x-vercel-cron')
  const adminKey   = req.headers.get('x-admin-key')
  const secret     = process.env.CRON_SECRET

  const isVercelCron = cronHeader === '1'
  const isValidCron  = secret && authHeader === 'Bearer ' + secret
  const isAdmin      = adminKey && adminKey === process.env.ADMIN_KEY

  if (!isVercelCron && !isValidCron && !isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = { scanned: 0, upgraded: 0, fallback: 0, skipped: 0, failed: 0, samples: [] }

  try {
    // Find all articles still using a local /img/photos/ placeholder
    const articles = await sanity.fetch(
      `*[_type == "newsArticle"
        && approved == true
        && editorLocked != true
        && defined(externalUrl)
        && string::startsWith(imageUrl, "/img/photos/")
      ] | order(publishedAt desc) [0...50] {
        _id, title, externalUrl, imageUrl, category
      }`
    )

    stats.scanned = articles.length
    console.log(`[FIX-PLACEHOLDERS] Found ${articles.length} articles with placeholder images`)

    if (articles.length === 0) {
      await reportCronRun('fix-placeholder-images', {
        status: 'success', ms: Date.now() - t0,
        details: 'No placeholder images found — all clean',
      }).catch(() => {})
      return Response.json({ ok: true, ...stats, ms: Date.now() - t0, message: 'All clean — no placeholder images found' })
    }

    const mutations = []

    for (const article of articles) {
      if (!article.externalUrl) { stats.skipped++; continue }

      console.log(`[FIX-PLACEHOLDERS] Processing: "${article.title?.slice(0, 50)}" (${article.imageUrl})`)

      // Step 1: try to fetch real OG image from source article
      const ogImage = await extractOgImage(article.externalUrl)

      if (ogImage) {
        // Step 2: upload to Sanity CDN
        const slug   = (article.title || 'article').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
        const cdnUrl = await uploadToSanity(ogImage, `${slug}-${article._id.slice(-6)}.jpg`)

        if (cdnUrl) {
          mutations.push({ patch: { id: article._id, set: { imageUrl: cdnUrl } } })
          stats.upgraded++
          if (stats.samples.length < 10) {
            stats.samples.push({ title: article.title?.slice(0, 50), was: article.imageUrl, now: cdnUrl.slice(0, 60) })
          }
          console.log(`[FIX-PLACEHOLDERS] ✓ Upgraded to CDN: "${article.title?.slice(0, 40)}"`)
        } else {
          // Upload failed — assign best-match local photo (may already have one, pick better)
          const better = pickPhoto(article.title, article.category)
          if (better !== article.imageUrl) {
            mutations.push({ patch: { id: article._id, set: { imageUrl: better } } })
          }
          stats.fallback++
        }
      } else {
        // Source blocked scraping — assign best-match local photo
        const better = pickPhoto(article.title, article.category)
        if (better !== article.imageUrl) {
          mutations.push({ patch: { id: article._id, set: { imageUrl: better } } })
          stats.fallback++
        } else {
          stats.skipped++ // already has the best local fallback
        }
      }

      // Avoid hammering sources
      await new Promise(r => setTimeout(r, 400))
    }

    // Batch write all patches to Sanity
    if (mutations.length) {
      await sanity.mutate(mutations)
      console.log(`[FIX-PLACEHOLDERS] Wrote ${mutations.length} mutations to Sanity`)
    }

    const ms      = Date.now() - t0
    const details = `scanned:${stats.scanned} upgraded:${stats.upgraded} fallback:${stats.fallback} skipped:${stats.skipped} failed:${stats.failed} (${ms}ms)`

    await reportCronRun('fix-placeholder-images', { status: 'success', ms, details }).catch(() => {})

    return Response.json({ ok: true, ...stats, ms, message: details })

  } catch (err) {
    console.error('[FIX-PLACEHOLDERS] crash:', err.message)
    const ms = Date.now() - t0
    await reportCronRun('fix-placeholder-images', { status: 'failed', ms, error: err.message }).catch(() => {})
    return Response.json({ ok: false, error: err.message, ...stats, ms }, { status: 500 })
  }
}

export async function GET(req)  { return handler(req) }
export async function POST(req) { return handler(req) }
