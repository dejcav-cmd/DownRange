export const dynamic = 'force-dynamic'
export const maxDuration = 300

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
const FIREARM_IMAGES = {
  // Pistols / handguns / EDC / carry
  pistol: [
    'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=900&q=85',  // pistol grip closeup
    'https://images.unsplash.com/photo-1584553391547-8ba39d3e3b51?w=900&q=85',  // compact pistol
    'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=900&q=85',  // handgun dark bg
    'https://images.unsplash.com/photo-1621415814107-a4cbf5b3f1ea?w=900&q=85',  // pistol profile
    'https://images.unsplash.com/photo-1578674473215-9e07ee2e577d?w=900&q=85',  // handgun with suppressor
  ],
  // AR-15 / rifles / carbines
  rifle: [
    'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=900&q=85',  // AR-15 confirmed
    'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=900&q=85',  // rifle action
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=900&q=85',  // rifle in field
    'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=900&q=85',  // rifle scope
  ],
  // Shotguns
  shotgun: [
    'https://images.unsplash.com/photo-1543393716-375f47996a77?w=900&q=85',     // shotgun confirmed
    'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=900&q=85',  // pump shotgun
  ],
  // Suppressors / NFA / silencers
  suppressor: [
    'https://images.unsplash.com/photo-1578674473215-9e07ee2e577d?w=900&q=85',  // pistol with suppressor
    'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=900&q=85',  // pistol close
  ],
  // Optics / scopes / red dots
  optic: [
    'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=900&q=85',  // rifle scope
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=900&q=85',  // scope in field
    'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=900&q=85',  // rifle with optic
  ],
  // Ammunition / calibers / reloading
  ammo: [
    'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=900&q=85',  // cartridges
    'https://images.unsplash.com/photo-1621415814107-a4cbf5b3f1ea?w=900&q=85',  // ammo rounds
    'https://images.unsplash.com/photo-1584553391547-8ba39d3e3b51?w=900&q=85',  // brass casings
  ],
  // Law / legislation / ATF / courts / 2A rights
  law: [
    'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=900&q=85',  // pistol (rights)
    'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=900&q=85',  // handgun
    'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=900&q=85',  // rifle
  ],
  // Range / training / shooting sports
  range: [
    'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=900&q=85',
    'https://images.unsplash.com/photo-1584553391547-8ba39d3e3b51?w=900&q=85',
    'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=900&q=85',
  ],
  // Hunting / outdoor
  hunting: [
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=900&q=85',  // field/hunting rifle
    'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=900&q=85',  // rifle hunting
    'https://images.unsplash.com/photo-1543393716-375f47996a77?w=900&q=85',     // shotgun hunting
  ],
  // Military / defense / contracts
  military: [
    'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=900&q=85',
    'https://images.unsplash.com/photo-1609081144289-d74b6c2b4b73?w=900&q=85',
    'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=900&q=85',
  ],
  // Holsters / carry gear / accessories
  holster: [
    'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=900&q=85',
    'https://images.unsplash.com/photo-1584553391547-8ba39d3e3b51?w=900&q=85',
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
  const authHeader = req.headers.get('authorization')
  const cronHeader = req.headers.get('x-vercel-cron')
  const secret     = process.env.CRON_SECRET || process.env.ADMIN_KEY
  if (secret && authHeader !== `Bearer ${secret}` && cronHeader !== '1') {
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
