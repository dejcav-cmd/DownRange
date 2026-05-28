export const dynamic = 'force-dynamic'
import { reportCronRun } from '@/lib/cronReporter'
export const maxDuration = 60

/**
 * POST /api/admin/fix-images?batch=50&force=false
 *
 * Scans ALL articles and fixes missing/non-firearm images.
 * Strategy per article:
 *   1. If article has a valid image URL that loads → keep it
 *   2. If article has externalUrl → try to extract OG image from source page
 *   3. Fall back to keyword-matched firearm photo from curated library
 *
 * force=true  → re-evaluates all articles, even those with existing images
 * batch=N     → articles per call (default 50, max 100)
 */

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// ── Curated firearm image library — multiple options per category ─────────────
// All verified Unsplash firearm/2A photography IDs
// Verified CC-licensed firearm images from Wikimedia Commons
const WM = '/img/photos/news.jpg'
const FIREARM_IMAGES = {
  pistol: [
    `${WM}/1/17/Glock_19_9_x_19.jpg/1200px-Glock_19_9_x_19.jpg`,
    `${WM}/9/9b/SIG_Sauer_P365_XL.jpg/1200px-SIG_Sauer_P365_XL.jpg`,
    `${WM}/8/80/Beretta_92FS_bk.jpg/1200px-Beretta_92FS_bk.jpg`,
    `${WM}/3/35/M1911A1.jpg/1200px-M1911A1.jpg`,
    `${WM}/b/b0/Glock_17_2.jpg/1200px-Glock_17_2.jpg`,
    `${WM}/4/4e/CZ_75_SP-01_Shadow.jpg/1200px-CZ_75_SP-01_Shadow.jpg`,
  ],
  rifle: [
    `${WM}/f/f3/AR-15_rifle.jpg/1200px-AR-15_rifle.jpg`,
    `${WM}/2/2b/AK-47_type_II_Para_title.jpg/1200px-AK-47_type_II_Para_title.jpg`,
    `${WM}/5/5b/M16A1_brimob.jpg/1200px-M16A1_brimob.jpg`,
    `${WM}/9/9f/Ruger_Mini-14.jpg/1200px-Ruger_Mini-14.jpg`,
    `${WM}/f/f3/AR-15_rifle.jpg/800px-AR-15_rifle.jpg`,
  ],
  shotgun: [
    `${WM}/e/e1/Mossberg_500_Persuader.jpg/1200px-Mossberg_500_Persuader.jpg`,
    `${WM}/6/6d/Remington_870_Wingmaster.jpg/1200px-Remington_870_Wingmaster.jpg`,
    `${WM}/e/e1/Mossberg_500_Persuader.jpg/800px-Mossberg_500_Persuader.jpg`,
  ],
  suppressor: [
    `${WM}/1/17/Glock_19_9_x_19.jpg/1200px-Glock_19_9_x_19.jpg`,
    `${WM}/f/f3/AR-15_rifle.jpg/1200px-AR-15_rifle.jpg`,
  ],
  optic: [
    `${WM}/f/f3/AR-15_rifle.jpg/1200px-AR-15_rifle.jpg`,
    `${WM}/9/9f/Ruger_Mini-14.jpg/1200px-Ruger_Mini-14.jpg`,
    `${WM}/5/5b/M16A1_brimob.jpg/1200px-M16A1_brimob.jpg`,
  ],
  ammo: [
    `${WM}/1/17/Glock_19_9_x_19.jpg/1200px-Glock_19_9_x_19.jpg`,
    `${WM}/9/9b/SIG_Sauer_P365_XL.jpg/1200px-SIG_Sauer_P365_XL.jpg`,
    `${WM}/f/f3/AR-15_rifle.jpg/1200px-AR-15_rifle.jpg`,
  ],
  law: [
    `${WM}/1/17/Glock_19_9_x_19.jpg/1200px-Glock_19_9_x_19.jpg`,
    `${WM}/f/f3/AR-15_rifle.jpg/1200px-AR-15_rifle.jpg`,
    `${WM}/3/35/M1911A1.jpg/1200px-M1911A1.jpg`,
    `${WM}/8/80/Beretta_92FS_bk.jpg/1200px-Beretta_92FS_bk.jpg`,
  ],
  range: [
    `${WM}/f/f3/AR-15_rifle.jpg/1200px-AR-15_rifle.jpg`,
    `${WM}/1/17/Glock_19_9_x_19.jpg/1200px-Glock_19_9_x_19.jpg`,
    `${WM}/9/9b/SIG_Sauer_P365_XL.jpg/1200px-SIG_Sauer_P365_XL.jpg`,
  ],
  hunting: [
    `${WM}/9/9f/Ruger_Mini-14.jpg/1200px-Ruger_Mini-14.jpg`,
    `${WM}/e/e1/Mossberg_500_Persuader.jpg/1200px-Mossberg_500_Persuader.jpg`,
    `${WM}/6/6d/Remington_870_Wingmaster.jpg/1200px-Remington_870_Wingmaster.jpg`,
    `${WM}/f/f3/AR-15_rifle.jpg/1200px-AR-15_rifle.jpg`,
  ],
  military: [
    `${WM}/5/5b/M16A1_brimob.jpg/1200px-M16A1_brimob.jpg`,
    `${WM}/f/f3/AR-15_rifle.jpg/1200px-AR-15_rifle.jpg`,
    `${WM}/2/2b/AK-47_type_II_Para_title.jpg/1200px-AK-47_type_II_Para_title.jpg`,
  ],
  holster: [
    `${WM}/1/17/Glock_19_9_x_19.jpg/1200px-Glock_19_9_x_19.jpg`,
    `${WM}/9/9b/SIG_Sauer_P365_XL.jpg/1200px-SIG_Sauer_P365_XL.jpg`,
  ],
}

// Deterministic selection — same article always gets same image
function selectImage(category, title) {
  const images = FIREARM_IMAGES[category] || FIREARM_IMAGES.pistol
  // Use title hash for deterministic but varied selection
  const hash = (title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return images[hash % images.length]
}

// ── Keyword → category mapping ─────────────────────────────────────────────────
function categorizeTitle(title, category) {
  const t = (title || '').toLowerCase()

  // Check Sanity category first
  if (category === 'law')      return 'law'
  if (category === 'training') return 'range'
  if (category === 'industry') {
    // Industry can still be pistol/rifle/ammo specific
  }

  // Title keyword matching — ordered by specificity
  if (/ar-?15|ar15|m4|m16|5\.56|\.223|nato|ddm4|bcm|noveske|pcc|carbine|sbr/.test(t))           return 'rifle'
  if (/ak-?47|ak47|ak-?74|7\.62x39|kalash|dragunov/.test(t))                                     return 'rifle'
  if (/bolt.?action|precision rifle|prs|long.?range|sniper|308|6\.5|creedmoor|lapua|338/.test(t)) return 'rifle'
  if (/shotgun|12.?gauge|20.?gauge|mossberg|remington 870|590|benelli|pump.?action/.test(t))      return 'shotgun'
  if (/suppressor|silencer|nfa|form.?4|form 4|aow|sbr|sbs|silencerco|dead air|omega/.test(t))    return 'suppressor'
  if (/optic|scope|lpvo|red dot|eotech|aimpoint|vortex|trijicon|holosun|sig romeo|mro/.test(t))  return 'optic'
  if (/ammo|ammunition|cartridge|caliber|grain|fmj|jhp|hst|gold dot|critical|hollow|brass|reload/.test(t)) return 'ammo'
  if (/hunt|elk|deer|turkey|waterfowl|pheasant|big.?game|field|season|tag|license/.test(t))       return 'hunting'
  if (/militar|army|navy|marines|air force|navy seal|special ops|contract|defense dept|pentagon/.test(t)) return 'military'
  if (/holster|iwb|owb|appendix|kydex|leather carry|retention|draw/.test(t))                      return 'holster'
  if (/range|drill|training|dry.?fire|shooting|course|marksmanship|competition|uspsa|idpa/.test(t)) return 'range'
  if (/law|legislation|bill|act|senate|house|congress|scotus|court|ruling|atf|ban|rights|2a|amendment|constitutional/.test(t)) return 'law'
  if (/glock|sig sauer|p320|p365|hellcat|shield|xd|cz|beretta|walther|taurus|ruger|kimber|1911/.test(t)) return 'pistol'
  if (/pistol|handgun|revolver|semi.?auto|striker|edc|carry|concealed|ccw|cpl/.test(t))          return 'pistol'

  // Category-based fallback
  if (category === 'breaking') return 'law'
  if (category === 'news')     return 'pistol'

  return 'pistol' // universal default — always relevant
}

// ── Try to fetch OG image from source page ─────────────────────────────────────
async function fetchOGImage(url) {
  if (!url || !url.startsWith('http')) return null
  try {
    const controller = new AbortController()
    const timeout    = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(url, {
      signal:  controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)' },
    })
    clearTimeout(timeout)
    if (!res.ok) return null

    const html = await res.text()
    // Try og:image first
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogMatch?.[1] && ogMatch[1].startsWith('http')) return ogMatch[1]

    // Try twitter:image
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
    if (twMatch?.[1] && twMatch[1].startsWith('http')) return twMatch[1]

    return null
  } catch {
    return null
  }
}

// ── Check if an image URL is actually reachable ────────────────────────────────
async function imageIsReachable(url) {
  if (!url || !url.startsWith('http')) return false
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal })
    return res.ok && (res.headers.get('content-type') || '').startsWith('image/')
  } catch {
    return false
  }
}

// ── Main handler ───────────────────────────────────────────────────────────────
export async function POST(req) {
  // Accept admin key, bearer token, or cron secret
  const adminKey  = process.env.ADMIN_KEY
  const cronSecret = process.env.CRON_SECRET
  const xKey      = req.headers.get('x-admin-key')
  const bearer    = req.headers.get('authorization')
  const isCron    = new URL(req.url).searchParams.get('cron') === '1'
  const authed    = !adminKey
    || xKey === adminKey
    || bearer === ('Bearer ' + adminKey)
    || (isCron && cronSecret && bearer === ('Bearer ' + cronSecret))
    || (isCron && !cronSecret)  // allow if no cron secret configured
  if (!authed) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const batchSize = Math.min(100, Math.max(1, parseInt(searchParams.get('batch') || '50')))
  const force     = searchParams.get('force') === 'true'
  const t         = Date.now()

  // Fetch articles — force=true gets all, otherwise only those missing images
  const filter = force
    ? `_type == "newsArticle" && approved == true`
    : `_type == "newsArticle" && approved == true && (!defined(imageUrl) || imageUrl == "" || imageUrl == null) && !defined(heroImage)`

  const [articles, total] = await Promise.all([
    sanity.fetch(`*[${filter}] | order(publishedAt desc) [0...${batchSize}] {
      _id, title, imageUrl, imageAlt, heroImage, source, category, externalUrl, tags
    }`),
    sanity.fetch(`count(*[${filter}])`),
  ])

  if (!articles.length) {
    return Response.json({
      done: 0, skipped: 0, remaining: 0, total,
      message: force ? 'All articles processed.' : 'All articles already have images. ✓',
    })
  }

  console.log(`[FIX-IMAGES] Processing ${articles.length} articles. ${total} total need images.`)

  const results = []

  for (const article of articles) {
    const hasImage = article.imageUrl || article.heroImage?.asset?.url
    if (hasImage && !force) {
      results.push({ id: article._id, title: article.title?.slice(0, 55), status: 'skip' })
      continue
    }

    let chosenUrl    = null
    let chosenMethod = 'fallback'

    // Strategy 1: Keep existing image if it looks valid (force mode — verify it still loads)
    if (force && hasImage) {
      const existing = article.imageUrl || article.heroImage?.asset?.url
      const reachable = await imageIsReachable(existing)
      if (reachable) {
        results.push({ id: article._id, title: article.title?.slice(0, 55), status: 'ok', method: 'existing', url: existing })
        continue
      }
    }

    // Strategy 2: Fetch OG image from original source page
    if (article.externalUrl) {
      const og = await fetchOGImage(article.externalUrl)
      if (og) {
        chosenUrl    = og
        chosenMethod = 'og-image'
      }
    }

    // Strategy 3: Keyword-matched fallback from curated library
    if (!chosenUrl) {
      const imgCategory = categorizeTitle(article.title, article.category)
      chosenUrl    = selectImage(imgCategory, article.title)
      chosenMethod = `fallback:${imgCategory}`
    }

    // Patch Sanity
    try {
      await sanity.patch(article._id)
        .set({
          imageUrl:  chosenUrl,
          imageAlt:  article.imageAlt || article.title || 'Firearms news',
        })
        .commit()

      results.push({
        id:     article._id,
        title:  article.title?.slice(0, 55),
        status: 'fixed',
        method: chosenMethod,
        url:    chosenUrl.slice(0, 60) + '…',
      })
      console.log(`[FIX-IMAGES] ✓ ${chosenMethod} | "${article.title?.slice(0, 45)}"`)
    } catch (err) {
      results.push({ id: article._id, title: article.title?.slice(0, 55), status: 'failed', error: err.message })
      console.error(`[FIX-IMAGES] ✗ "${article.title?.slice(0, 45)}": ${err.message}`)
    }

    await new Promise(r => setTimeout(r, 50))
  }

  const fixed    = results.filter(r => r.status === 'fixed').length
  const failed   = results.filter(r => r.status === 'failed').length
  const skipped  = results.filter(r => r.status === 'skip' || r.status === 'ok').length
  const remaining = Math.max(0, total - fixed)
  const byMethod = results.reduce((acc, r) => {
    if (r.method) acc[r.method] = (acc[r.method] || 0) + 1
    return acc
  }, {})

  await reportCronRun('fix-images', {
    status: failed > 0 && fixed === 0 ? 'failed' : 'success',
    ms: Date.now() - t,
    details: fixed + ' fixed, ' + failed + ' failed, ' + remaining + ' remaining',
    error: failed > 0 ? failed + ' articles failed to get images' : null,
  })
  return Response.json({
    fixed, failed, skipped, total, remaining,
    ms:       Date.now() - t,
    byMethod,
    results,
    message: remaining > 0
      ? `✓ ${fixed} images fixed. ${failed > 0 ? `${failed} failed. ` : ''}${remaining} remaining — POST again.`
      : `✓ Done! ${fixed} articles got images. ${skipped} already had images.`,
  })
}

export async function GET(req) { return POST(req) }
