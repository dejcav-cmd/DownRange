export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'
import { scrapeProductImage } from '@/lib/scrapeProductImage'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

// ── HELPERS ───────────────────────────────────────────────────────────────────

// pickPhoto removed — local /img/photos/ placeholder paths are unacceptable.
// All missing images must be fetched via searchForImage() (Pexels + Pixabay).

function isGoodImage(url) {
  if (!url || typeof url !== 'string') return false
  const lower = url.toLowerCase()
  if (lower.includes('.svg'))                         return false
  if (lower.includes('logo') && !lower.includes('gun')) return false
  if (lower.includes('favicon'))                      return false
  if (lower.includes('1x1') || lower.includes('pixel') || lower.includes('spacer')) return false
  if (lower.includes('placeholder') || lower.includes('default-image'))              return false
  if (!lower.match(/\.(jpg|jpeg|png|webp)/))          return false
  // Reject dimension hints in URL that signal logos/banners (e.g. -306x94.png, _120x60.jpg)
  const dimMatch = lower.match(/-(\d+)x(\d+)\.(png|jpg|jpeg|webp)/)
  if (dimMatch) {
    const w = parseInt(dimMatch[1], 10)
    const h = parseInt(dimMatch[2], 10)
    if (w < 400) return false             // too narrow
    if (h > 0 && w / h > 3.5) return false  // banner/logo aspect ratio
    if (h > w) return false               // portrait logo
  }
  return true
}

// Parse image dimensions from raw bytes without external deps.
// Returns { w, h } or null. Supports JPEG (SOF markers) and PNG (IHDR).
function parseImageDimensions(buf) {
  try {
    const bytes = new Uint8Array(buf)
    // PNG: signature 8 bytes, then IHDR chunk at offset 8
    // IHDR: length(4) + 'IHDR'(4) + width(4) + height(4)
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      const w = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]
      const h = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]
      return { w, h }
    }
    // JPEG: scan for SOF0/SOF1/SOF2 markers (0xFF 0xC0/C1/C2)
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      let i = 2
      while (i < bytes.length - 9) {
        if (bytes[i] !== 0xFF) { i++; continue }
        const marker = bytes[i + 1]
        if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
          const h = (bytes[i + 5] << 8) | bytes[i + 6]
          const w = (bytes[i + 7] << 8) | bytes[i + 8]
          return { w, h }
        }
        const segLen = (bytes[i + 2] << 8) | bytes[i + 3]
        i += 2 + segLen
      }
    }
  } catch {}
  return null
}

// Returns true if image bytes represent a photo-sized image (not a logo/banner)
function isPhotoSized(buf) {
  const dims = parseImageDimensions(buf)
  if (!dims) return true // can't parse → give benefit of the doubt
  const { w, h } = dims
  if (w < 400) return false             // too narrow for an article hero
  if (h > 0 && w / h > 3.5) return false  // banner/logo shape
  if (h > w) return false               // portrait logos
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
    // Reject logo/banner shapes — parse actual pixel dimensions from bytes
    if (!isPhotoSized(buf)) {
      console.log(`[FIX-IMAGES] ✗ Rejected logo-shaped image: ${filename} (${buf.byteLength} bytes)`)
      return null
    }
    const asset = await sanity.assets.upload('image', Buffer.from(buf), { filename, contentType: ct })
    return asset?.url || null
  } catch { return null }
}

// ── SMART IMAGE SEARCH — title-aware, specific gun/topic queries ───────────────
// Priority: 1) extract exact gun model from title  2) category-specific photo search
// Never use generic category keywords — always search for the actual subject.

function buildSearchQuery(title = '', category = '') {
  const t = title.toLowerCase()

  // ── EXTRACT SPECIFIC GUN MODEL / BRAND ──────────────────────────────────────
  // Try to pull the most specific identifier from the title for a targeted search.

  // Named handgun models
  const handgunModel = title.match(
    /\b(glock\s*\d+|sig\s*(?:sauer\s*)?(?:p\d{3}|m\d{3}|cross|emperor|p365|p320|p226|p229|p938|1911)|colt\s*(?:python|cobra|king\s*cobra|anaconda|1911|delta\s*elite)|smith\s*(?:&|and)\s*wesson\s*(?:m&p|model\s*\d+|shield|bodyguard|442|686|629)|springfield\s*(?:armory\s*)?(?:hellcat|xd|xds|xdm|ronin|emissary|echelon|prodigy|1911)|ruger\s*(?:lcp|lc9|sr\d+|american|security\s*\d+|gp100|sp101|redhawk|super\s*redhawk|wrangler|57|max\s*9)|walther\s*(?:ppk|pdp|pdp|creed|pps|q4|q5|ccp)|canik\s*(?:tp9|mete|rival)|kimber\s*(?:micro|pro|raptor|eclipse|custom)|beretta\s*(?:apx|m9|92|px4|a300|a400)|fn\s*(?:509|five\s*seven|fns|fnx|509t)|hk\s*(?:vp9|p30|usp|mk23|hk45|sp5)|desert\s*eagle|baby\s*eagle|taurus\s*(?:g2c|g3|g3c|th9|judge|raging|spectrum|tx22|defender)|hellcat|p365|xd-?s|xd-?m|m&p\s*shield|shield\s*plus|bodyguard\s*380)\b/i
  )?.[1]

  // Named rifle/carbine models
  const rifleModel = title.match(
    /\b(ar-?15|ar-?10|m4\s*carbine|m16|ak-?47|ak-?74|akg\s*\d+|bcm\s*\w+|daniel\s*defense\s*\w+|dd\s*m4|ddm4|bcm\s*recce|scar\s*(?:16|17|20)|m1a|m14|mini-?14|mini-?30|ruger\s*pc\s*carbine|sub-?2000|mpx|mcx|rattler|honey\s*badger|honey\s*badger|300\s*blackout\s*(?:sbr|pistol|rifle)|ban\w*\s*(?:pcc|pistol|rifle)|b&t\s*\w+|iwi\s*(?:tavor|galil|zion|masada|carmel)|cz\s*(?:bren|scorpion|shadow|p10|p09|p07)|steyr\s*(?:aug|mannlicher)|kel-?tec\s*(?:sub|rdb|ksg|p15|su16)|kriss\s*vector|fn\s*(?:scar|fal|f2000|p90)|hk\s*(?:416|433|g36|mp5|ump|sp5)|sig\s*(?:mcx|mpx|rattler|cross)|barrett\s*(?:m82|m107|m95|mrad|rec10|rec7)|windham\s*\w+|cmmg\s*\w+|lwrci\s*\w+|stag\s*arms|aero\s*precision\s*\w+|psa\s*\w+|palmetto\s*\w+|wilson\s*combat\s*\w+|larue\s*\w+|noveske\s*\w+|kac\s*\w+|sr-?25|mk\s*12|mk\s*18|am-?15|dpms\s*\w+)\b/i
  )?.[1]

  // Named shotgun models
  const shotgunModel = title.match(
    /\b(mossberg\s*(?:500|590|940|930|maverick|shockwave)|remington\s*(?:870|1100|v3|versa|model\s*\d+)|benelli\s*(?:m2|m4|supernova|nova|ethos|sbe|montefeltro)|beretta\s*(?:a300|a400|a350|a390)|browning\s*(?:maxus|bps|cynergy|citori|a5)|winchester\s*(?:sxp|sx4|model\s*12)|charles\s*daly\s*\w+|stoeger\s*\w+|kel-?tec\s*ksg|tactical\s*shotgun|bullpup\s*shotgun)\b/i
  )?.[1]

  // Named suppressor/NFA items
  const suppressorModel = title.match(
    /\b(dead\s*air\s*(?:sandman|nomad|mask|primal|wolf)|silencerco\s*(?:omega|hybrid|harvester|switchback|maxim|sparrow)|surefire\s*(?:socom|ryder|warcomp)|thunder\s*beast\s*\w+|sig\s*sauer\s*(?:srd|suppressor)|rugged\s*\w+|gemtech\s*\w+|advanced\s*armament|aac\s*\w+|obsidian\s*45|banish\s*\w+|modular\s*\w+\s*suppressor|integrally\s*suppressed)\b/i
  )?.[1]

  // Named optics
  const opticsModel = title.match(
    /\b(trijicon\s*(?:acog|rmr|sro|vcog|mro|accupoint)|eotech\s*(?:exps|vudu|holographic|xps)|aimpoint\s*(?:pro|comp|micro|acro|patrol)|vortex\s*(?:razor|viper|strike\s*eagle|crossfire|spitfire|sparc|defender|opmod)|leupold\s*(?:deltapoint|mark|vx|firedot)|nightforce\s*\w+|schmidt\s*&\s*bender\s*\w+|holosun\s*(?:\d+|eps|507|510|aems)|burris\s*(?:fastfire|rt\-6|veracity|fullfield)|sig\s*(?:romeo|tango|kilo|electro-optics)|primary\s*arms\s*\w+|bushnell\s*\w+)\b/i
  )?.[1]

  // If we got a specific model, always append a firearm type word.
  // NEVER return a bare model name — "desert eagle" returns the bird,
  // "python" returns the snake, "viper" returns the snake, etc.
  const specificModel = handgunModel || rifleModel || shotgunModel || suppressorModel || opticsModel
  if (specificModel) {
    const cleaned = specificModel.replace(/\s+/g, ' ').trim()
    if (suppressorModel) return `${cleaned} suppressor firearm`
    if (opticsModel)     return `${cleaned} rifle optic scope`
    if (shotgunModel)    return `${cleaned} shotgun firearm`
    if (rifleModel)      return `${cleaned} rifle firearm`
    // handgun — always append to avoid animal/place/brand collisions
    return `${cleaned} pistol handgun firearm`
  }

  // ── BRAND + TYPE EXTRACTION ──────────────────────────────────────────────────
  // No specific model found — try brand + general type
  const brandMatch = title.match(
    /\b(glock|sig\s*sauer|smith\s*(?:&|and)\s*wesson|s&w|ruger|kimber|springfield|colt|beretta|fn\s*america|heckler\s*(?:&|and)\s*koch|hk|walther|canik|taurus|kel-?tec|mossberg|remington|benelli|winchester|browning|savage|tikka|accuracy\s*international|barrett|christensen|daniel\s*defense|aero\s*precision|bcm|larue|lwrci|noveske|kac|silencerco|dead\s*air|surefire|gemtech|leupold|vortex|nightforce|trijicon|eotech|aimpoint|holosun)\b/i
  )?.[1]

  if (brandMatch) {
    const brand = brandMatch.replace(/\s+/g, ' ').trim()
    if (/suppressor|silencer|nfa/i.test(t))       return `${brand} suppressor firearm`
    if (/pistol|handgun|carry|edc|ccw/i.test(t))  return `${brand} pistol handgun`
    if (/rifle|carbine|ar|sbr/i.test(t))           return `${brand} rifle`
    if (/shotgun|gauge/i.test(t))                  return `${brand} shotgun`
    if (/optic|scope|sight/i.test(t))              return `${brand} optic firearm`
    return `${brand} firearm`
  }

  // ── TOPIC-BASED FALLBACK (no brand/model) ───────────────────────────────────
  if (/suppressor|silencer|nfa|form\s*4/i.test(t))            return 'suppressor silencer rifle shooting'
  if (/desert\s*eagle|magnum\s*research/i.test(t))            return 'desert eagle 50AE handgun'
  if (/constitutional\s*carry|permitless\s*carry/i.test(t))   return 'concealed carry handgun holster'
  if (/concealed\s*carry|ccw|edc/i.test(t))                   return 'concealed carry holster pistol'
  if (/atf|bureau\s*alcohol|national\s*firearms\s*act/i.test(t)) return 'ATF firearms bureau gun'
  if (/second\s*amend|2a\s*rights|gun\s*rights/i.test(t))    return 'second amendment gun rights rally'
  if (/scotus|supreme\s*court|bruen|heller/i.test(t))         return 'supreme court second amendment'
  if (/gun\s*control|ban\s*(?:on|the|guns)|restrict/i.test(t)) return 'gun control protest legislation'
  if (/ar-?15|assault\s*(?:weapon|rifle)/i.test(t))           return 'AR-15 rifle range shooting'
  if (/9mm|handgun|pistol|semi-?auto/i.test(t))               return 'handgun pistol shooting range'
  if (/rifle|carbine|long\s*gun/i.test(t))                    return 'rifle shooting range outdoors'
  if (/shotgun|12\s*gauge/i.test(t))                          return 'shotgun shooting range'
  if (/ammo|ammunition|cartridge|bullet/i.test(t))            return 'ammunition bullets firearm'
  if (/hunt|deer|elk|game\s*(?:season|animal)/i.test(t))     return 'hunting rifle outdoors'
  if (/competi|uspsa|idpa|ipsc|3.gun/i.test(t))              return 'shooting competition sport'
  if (/train|range|practice|marksmanship/i.test(t))           return 'shooting range training firearms'
  if (/holster|optic|scope|red\s*dot/i.test(t))              return 'gun accessories holster optic'
  if (/military|army|marine|soldier|veteran/i.test(t))        return 'military soldier weapons training'
  if (/home\s*defense|self.?defense|home\s*security/i.test(t)) return 'home defense firearm shotgun'
  return 'firearm shooting range gun'
}

// Pexels — highest quality, real photography
async function fetchPexels(title, category) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  try {
    const q   = buildSearchQuery(title, category)
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&size=large&per_page=5`
    const res = await fetch(url, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    // Prefer larger photos; pick the first result with a landscape-ish src
    const photo = data.photos?.find(p => p.width >= p.height) || data.photos?.[0]
    return photo?.src?.large2x || photo?.src?.large || photo?.src?.medium || null
  } catch { return null }
}

// Pixabay — fallback when Pexels misses
async function fetchPixabay(title, category) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) return null
  try {
    const q   = buildSearchQuery(title, category)
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(q)}&image_type=photo&orientation=horizontal&min_width=800&per_page=5&safesearch=true`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const data = await res.json()
    return data.hits?.[0]?.largeImageURL || data.hits?.[0]?.webformatURL || null
  } catch { return null }
}

// Primary image search: try Pexels first, Pixabay as fallback
async function searchForImage(title, category) {
  const pexels = await fetchPexels(title, category)
  if (pexels) return pexels
  return fetchPixabay(title, category)
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
    // Catch ALL broken image states:
    //   1. null / undefined imageUrl  → <img src={null}> = broken tag
    //   2. empty string               → <img src=""> = broken tag
    //   3. /img/photos/*.jpg          → local placeholder fallback
    //   4. /img/*.svg                 → legacy SVG, deleted from disk
    //   5. external non-CDN URL       → hotlink that can 404 or get blocked
    // Only cdn.sanity.io URLs are considered stable.
    const articles = await sanity.fetch(
      `*[_type == "newsArticle"
        && defined(externalUrl)
        && category != "deals"
        && (
          !defined(imageUrl)
          || imageUrl == null
          || imageUrl == ""
          || string::startsWith(imageUrl, "/img/")
          || string::startsWith(imageUrl, "/public/")
        )
      ] | order(publishedAt desc) [0...50] {
        _id, title, externalUrl, imageUrl, category
      }`
    )

    stats.scanned = articles.length
    console.log(`[FIX-IMAGES] Found ${articles.length} articles with broken/missing/external images`)

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

      console.log(`[FIX-IMAGES] Processing: "${article.title?.slice(0, 50)}" (${article.imageUrl})`)

      // Step 1: try to fetch real OG image from source article
      const ogImage = await extractOgImage(article.externalUrl)

      if (ogImage) {
        // Step 2: upload real OG image to Sanity CDN
        const slug   = (article.title || 'article').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
        const cdnUrl = await uploadToSanity(ogImage, `${slug}-${article._id.slice(-6)}.jpg`)

        if (cdnUrl) {
          mutations.push({ patch: { id: article._id, set: { imageUrl: cdnUrl } } })
          stats.upgraded++
          if (stats.samples.length < 10) {
            stats.samples.push({ title: article.title?.slice(0, 50), was: article.imageUrl, now: cdnUrl.slice(0, 60) })
          }
          console.log(`[FIX-IMAGES] ✓ CDN: "${article.title?.slice(0, 40)}"`)
        } else {
          // OG upload failed — search Pexels/Pixabay for the specific gun/topic
          const searchUrl = await searchForImage(article.title, article.category)
          if (searchUrl) {
            const slug2    = (article.title || 'article').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
            const searchCdn = await uploadToSanity(searchUrl, `search-${slug2}-${article._id.slice(-6)}.jpg`)
            const finalUrl  = searchCdn || searchUrl
            mutations.push({ patch: { id: article._id, set: { imageUrl: finalUrl } } })
            stats.fallback++
            console.log(`[FIX-IMAGES] ~ Search (${buildSearchQuery(article.title, article.category).slice(0,30)}): "${article.title?.slice(0, 40)}"`)
          } else {
            stats.skipped++
          }
        }
      } else {
        // Source blocked — search Pexels/Pixabay for the specific gun/topic
        const searchUrl = await searchForImage(article.title, article.category)
        if (searchUrl) {
          const slug2     = (article.title || 'article').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
          const searchCdn = await uploadToSanity(searchUrl, `search-${slug2}-${article._id.slice(-6)}.jpg`)
          const finalUrl  = searchCdn || searchUrl
          mutations.push({ patch: { id: article._id, set: { imageUrl: finalUrl } } })
          stats.fallback++
          console.log(`[FIX-IMAGES] ~ Search/blocked (${buildSearchQuery(article.title, article.category).slice(0,30)}): "${article.title?.slice(0, 40)}"`)
        } else {
          // No image found — leave null so next hourly run retries
          // Never write /img/* placeholder paths to Sanity
          stats.skipped++
        }
      }

      // Avoid hammering sources
      await new Promise(r => setTimeout(r, 400))
    }

    // ── PHASE 3: Fix gunDeal docs with missing images (ALL sources) ───────────
    // This covers deals from Reddit, web scrapers, Amazon manual imports, and
    // any gun.deals item that slipped through without an image.
    const badDeals = await sanity.fetch(
      `*[_type == "gunDeal"
          && approved == true
          && defined(externalUrl)
          && (imageUrl == null || imageUrl == "")
        ] | order(publishedAt desc) [0...40] {
          _id, title, externalUrl, category, source, store
        }`
    ).catch(() => [])

    if (badDeals.length > 0) {
      console.log(`[FIX-IMAGES] Phase 3: ${badDeals.length} gunDeal docs with missing images`)
      const dealMutations = []

      for (const deal of badDeals) {
        if (!deal.externalUrl) { stats.skipped++; continue }
        // Skip amazon.com links — those go through the separate fix-asin-deal workflow
        if (deal.externalUrl.includes('amazon.com')) { stats.skipped++; continue }

        const label  = `deal-${deal.source || 'web'}-${deal._id.slice(-6)}`
        const cdnUrl = await scrapeProductImage(deal.externalUrl, label)

        if (cdnUrl) {
          dealMutations.push({ patch: { id: deal._id, set: { imageUrl: cdnUrl } } })
          stats.upgraded++
          console.log(`[FIX-IMAGES] ✓ Deal image: "${deal.title?.slice(0, 40)}"`)
        } else {
          stats.skipped++
        }
        await new Promise(r => setTimeout(r, 500))
      }

      if (dealMutations.length) {
        await sanity.mutate(dealMutations)
        console.log(`[FIX-IMAGES] Phase 3: wrote ${dealMutations.length} deal image patches`)
      }
    }

    // ── PHASE 2: Fix firearmRelease docs with Google News logo image ──────────
    // When releases are scraped via Google News RSS, the redirect link sometimes
    // lands on a Google-hosted reader page whose og:image is the Google News logo
    // (lh3.googleusercontent.com/news-logo or similar). Detect and replace these.
    const BAD_RELEASE_IMG_PATTERNS = [
      'googleusercontent.com',
      'news.google.com',
      'gstatic.com/news',
    ]
    const badReleases = await sanity.fetch(
      `*[_type == "firearmRelease"
        && defined(sourceUrl)
        && defined(imageUrl)
        && (
          imageUrl match "*googleusercontent.com*"
          || imageUrl match "*news.google.com*"
          || imageUrl match "*gstatic.com/news*"
          || imageUrl == null
          || imageUrl == ""
        )
      ] | order(_createdAt desc) [0...30] {
        _id, brand, model, sourceUrl, imageUrl
      }`
    )

    if (badReleases.length > 0) {
      console.log(`[FIX-IMAGES] Found ${badReleases.length} firearmRelease docs with bad/missing images`)
      const releaseMutations = []
      for (const rel of badReleases) {
        if (!rel.sourceUrl) continue
        const label = `${rel.brand || ''} ${rel.model || ''}`.trim().slice(0, 50)
        console.log(`[FIX-IMAGES] Fixing release: "${label}" (was: ${rel.imageUrl?.slice(0, 60)})`)
        const ogImage = await extractOgImage(rel.sourceUrl)
        if (ogImage && !BAD_RELEASE_IMG_PATTERNS.some(p => ogImage.includes(p))) {
          const slug   = label.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
          const cdnUrl = await uploadToSanity(ogImage, `rel-${slug}-${rel._id.slice(-6)}.jpg`)
          if (cdnUrl) {
            releaseMutations.push({ patch: { id: rel._id, set: { imageUrl: cdnUrl } } })
            stats.upgraded++
            console.log(`[FIX-IMAGES] ✓ Release CDN: "${label}"`)
          }
        } else {
          stats.skipped++
        }
        await new Promise(r => setTimeout(r, 400))
      }
      if (releaseMutations.length) {
        await sanity.mutate(releaseMutations)
        console.log(`[FIX-IMAGES] Wrote ${releaseMutations.length} release mutations to Sanity`)
        mutations.push(...releaseMutations)
      }
    }

    // Batch write all patches to Sanity
    if (mutations.length) {
      await sanity.mutate(mutations)
      console.log(`[FIX-IMAGES] Wrote ${mutations.length} mutations to Sanity`)
    }

    const ms      = Date.now() - t0
    const details = `scanned:${stats.scanned} upgraded:${stats.upgraded} fallback:${stats.fallback} skipped:${stats.skipped} failed:${stats.failed} (${ms}ms)`

    await reportCronRun('fix-placeholder-images', { status: 'success', ms, details }).catch(() => {})

    return Response.json({ ok: true, ...stats, ms, message: details })

  } catch (err) {
    console.error('[FIX-IMAGES] crash:', err.message)
    const ms = Date.now() - t0
    await reportCronRun('fix-placeholder-images', { status: 'failed', ms, error: err.message }).catch(() => {})
    return Response.json({ ok: false, error: err.message, ...stats, ms }, { status: 500 })
  }
}

export async function GET(req)  { return handler(req) }
export async function POST(req) { return handler(req) }
