export const dynamic    = 'force-dynamic'
export const maxDuration = 120

import { NextResponse }        from 'next/server'
import { createClient }        from '@sanity/client'
import { reportCronRun }       from '@/lib/cronReporter'
import { uploadImageToSanity } from '@/lib/imageUpload'

const ADMIN_KEY     = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID    = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
const ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'downrangeco-20'

// Amazon "All Deals" refinement — appended to every search URL so Amazon
// pre-filters to discounted items server-side before we even parse the HTML.
const DEAL_FILTER = '&rh=p_n_deal_type%3A23566065011&s=discount-rank'

const sanity = createClient({
  projectId:  PROJECT_ID,
  dataset:    'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN,
  useCdn:     false,
})

// ── Brand roster ──────────────────────────────────────────────────────────────
// brandWords: title substrings that always pass the 2A/archery filter for this brand.
// cat: gunDeal category written to Sanity.

const BRAND_SOURCES = [
  // ── Weapon lights ──────────────────────────────────────────────────────────
  {
    id: 'olight', label: 'Olight', store: 'Amazon – Olight', cat: 'accessory',
    url: 'https://www.amazon.com/s?k=olight+flashlight+tactical+weapon&i=sporting' + DEAL_FILTER,
    brandWords: ['olight','weapon light','warrior','baldr','pl-pro','valkyrie',
                 'javelot','marauder','perun','turbo mini','odin','baton'],
  },
  {
    id: 'streamlight', label: 'Streamlight', store: 'Amazon – Streamlight', cat: 'accessory',
    url: 'https://www.amazon.com/s?k=streamlight+weapon+light+tactical&i=sporting' + DEAL_FILTER,
    brandWords: ['streamlight','tlr','stinger','protac','sidewinder','siege',
                 'polytac','microstream','stylus'],
  },
  // ── Optics ─────────────────────────────────────────────────────────────────
  {
    id: 'vortex', label: 'Vortex Optics', store: 'Amazon – Vortex', cat: 'optic',
    url: 'https://www.amazon.com/s?k=vortex+optics+scope&i=sporting' + DEAL_FILTER,
    brandWords: ['vortex','viper','sparc','strikefire','crossfire','diamondback',
                 'razor','ranger','pst','spitfire','summit','kaibab','fury','impact'],
  },
  {
    id: 'holosun', label: 'Holosun', store: 'Amazon – Holosun', cat: 'optic',
    url: 'https://www.amazon.com/s?k=holosun+red+dot+sight&i=sporting' + DEAL_FILTER,
    brandWords: ['holosun','hs510','hs507','hs503','he510','acss','solar','multi-reticle'],
  },
  {
    id: 'monstrum', label: 'Monstrum Tactical', store: 'Amazon – Monstrum', cat: 'optic',
    url: 'https://www.amazon.com/s?k=monstrum+tactical&i=sporting' + DEAL_FILTER,
    brandWords: ['monstrum','scope mount','ring mount','cantilever','riser',
                 'prism scope','red dot','offset mount','scope rail'],
  },
  // ── AR accessories ─────────────────────────────────────────────────────────
  {
    id: 'magpul', label: 'Magpul', store: 'Amazon – Magpul', cat: 'accessory',
    url: 'https://www.amazon.com/s?k=magpul+ar15+accessories&i=sporting' + DEAL_FILTER,
    brandWords: ['magpul','pmag','moe','miad','mbus','afg','rls','xtm','mag552',
                 'ctr','str','ubl','ms4','moe sl','acs','acs-l'],
  },
  // ── Shooting accessories ───────────────────────────────────────────────────
  {
    id: 'caldwell', label: 'Caldwell', store: 'Amazon – Caldwell', cat: 'accessory',
    url: 'https://www.amazon.com/s?k=caldwell+shooting+rest&i=sporting' + DEAL_FILTER,
    brandWords: ['caldwell','lead sled','dead shot','pic rail','pivot bipod',
                 'target','shooting rest','brass catcher','chronograph'],
  },
  {
    id: 'wheeler', label: 'Wheeler', store: 'Amazon – Wheeler', cat: 'accessory',
    url: 'https://www.amazon.com/s?k=wheeler+gunsmithing+tools&i=sporting' + DEAL_FILTER,
    brandWords: ['wheeler','armorer','torque wrench','carbon fiber','level','f.a.t.',
                 'professional','combo kit','ultra scope'],
  },
  // ── Archery ────────────────────────────────────────────────────────────────
  {
    id: 'mathews', label: 'Mathews Archery', store: 'Amazon – Mathews', cat: 'archery',
    url: 'https://www.amazon.com/s?k=mathews+archery&i=sporting' + DEAL_FILTER,
    brandWords: ['mathews','halon','triax','vertix','traverse','prima','phase4',
                 'lift','v3','archery bow','compound bow'],
  },
  {
    id: 'goldtip', label: 'Gold Tip Arrows', store: 'Amazon – Gold Tip', cat: 'archery',
    url: 'https://www.amazon.com/s?k=gold+tip+arrows&i=sporting' + DEAL_FILTER,
    brandWords: ['gold tip','arrow shaft','velocity','hunter pro','pierce','warrior',
                 'traditional','carbon arrow'],
  },
  {
    id: 'carbon-express', label: 'Carbon Express', store: 'Amazon – Carbon Express', cat: 'archery',
    url: 'https://www.amazon.com/s?k=carbon+express+arrows&i=sporting' + DEAL_FILTER,
    brandWords: ['carbon express','maxima','piledriver','crossbolt','cx','nano',
                 'predator','arrow shaft','crossbow bolt'],
  },
  {
    id: 'rage', label: 'Rage Broadheads', store: 'Amazon – Rage', cat: 'archery',
    url: 'https://www.amazon.com/s?k=rage+broadheads&i=sporting' + DEAL_FILTER,
    brandWords: ['rage','broadhead','chisel tip','mechanical','trypan','hypodermic',
                 'x-treme','bowhunting'],
  },
  {
    id: 'barnett', label: 'Barnett Crossbows', store: 'Amazon – Barnett', cat: 'archery',
    url: 'https://www.amazon.com/s?k=barnett+crossbow&i=sporting' + DEAL_FILTER,
    brandWords: ['barnett','crossbow','bolt','quiver','crank','hyper','whitetail',
                 'explorer','recruit'],
  },
  {
    id: 'tenpoint', label: 'TenPoint Crossbows', store: 'Amazon – TenPoint', cat: 'archery',
    url: 'https://www.amazon.com/s?k=tenpoint+crossbow&i=sporting' + DEAL_FILTER,
    brandWords: ['tenpoint','ten point','crossbow','volt','titan','viper','shadow',
                 'turbo','acuslide','rangemaster'],
  },
  {
    id: 'truglo', label: 'TRUGLO', store: 'Amazon – TRUGLO', cat: 'accessory',
    url: 'https://www.amazon.com/s?k=truglo+sights+archery&i=sporting' + DEAL_FILTER,
    brandWords: ['truglo','tru-glo','tritium','fiber optic','bow sight','archery sight',
                 'firearm sight','carbon','tru-bead'],
  },
  // ── Optics (premium) ───────────────────────────────────────────────────────
  {
    id: 'burris', label: 'Burris Optics', store: 'Amazon – Burris', cat: 'optic',
    url: 'https://www.amazon.com/s?k=burris+scope+optic&i=sporting' + DEAL_FILTER,
    brandWords: ['burris','fastfire','speedbead','fullfield','droptine','eliminator',
                 'rt-6','ar-332','rt-1','oracle','ballistic plex','xtreme tactical'],
  },
  {
    id: 'zeiss', label: 'Zeiss Scopes', store: 'Amazon – Zeiss', cat: 'optic',
    url: 'https://www.amazon.com/s?k=zeiss+scope+optic&i=sporting' + DEAL_FILTER,
    brandWords: ['zeiss','conquest','victory','terra','diarange','duralyt','varipoint',
                 'hd5','hd','riflescope','binocular','rangefinder'],
  },
  // ── Archery (premium compound bows) ───────────────────────────────────────
  {
    id: 'hoyt', label: 'Hoyt Archery', store: 'Amazon – Hoyt', cat: 'archery',
    url: 'https://www.amazon.com/s?k=hoyt+archery&i=sporting' + DEAL_FILTER,
    brandWords: ['hoyt','axius','carbon rx','altus','powermax','torrex','invicta',
                 'compound bow','archery bow','riser','limb'],
  },
  {
    id: 'bowtech', label: 'Bowtech', store: 'Amazon – Bowtech', cat: 'archery',
    url: 'https://www.amazon.com/s?k=bowtech+compound+bow&i=sporting' + DEAL_FILTER,
    brandWords: ['bowtech','realm','revolt','carbon one','solution','amplify',
                 'compound bow','archery','riser'],
  },
]

// ── 2A / Archery relevance filter ─────────────────────────────────────────────
const ALLOW_WORDS = [
  'flashlight','weapon light','tactical','gun','firearm','rifle','pistol','shotgun',
  'ar-15','ar15','scope','optic','red dot','sight','reticle','magnifier',
  'mount','ring','rail','picatinny','holster','magazine','trigger','grip',
  'bipod','sling','suppressor','muzzle','brake','hunting','shooting','range',
  'target','ammunition','ammo','rimfire','centerfire','bore','cleaning','mil-spec',
  // Archery
  'bow','archery','arrow','broadhead','quiver','recurve','compound','crossbow',
  'nock','fletching','vane','shaft','bolt','broadhead','bowhunting','release',
  'stabilizer','limb','draw weight','let-off',
]

const BLOCK_WORDS = [
  'kitchen','cooking','baking','beauty','skincare','makeup','cosmetic',
  'jewelry','necklace','bracelet','earring',
  'clothing','shirt','pants','shoe','sneaker','boots ',
  'food','supplement','vitamin','protein powder','toy','kids',
  'garden','planter','furniture','pillow','bedding','curtain',
  'phone case','laptop','tablet','headphone','speaker','bluetooth',
  'pet food','dog food','cat food','aquarium',
]

function is2ARelevant(title = '', brandWords = []) {
  const t = title.toLowerCase()
  if (!t || t.length < 5)                              return false
  if (BLOCK_WORDS.some(w => t.includes(w)))            return false
  if (brandWords.some(w => t.toLowerCase().includes(w))) return true
  if (ALLOW_WORDS.some(w => t.includes(w)))            return true
  return false
}

// ── Deal detection ─────────────────────────────────────────────────────────────
// Confirm the item is actually discounted before saving.
// Amazon may serve non-deal items even with the URL filter applied if Jina
// doesn't fully execute the JS refinement.
function isDealItem(win = '') {
  return (
    /[−\-]\s*\d+\s*%|\d+\s*%\s*off/i.test(win)          ||  // "−17%" / "17% off"
    /limited\s+time\s+deal/i.test(win)                    ||  // "Limited time deal" badge
    /deal\s+of\s+the\s+day/i.test(win)                    ||  // "Deal of the Day"
    /class="[^"]*a-text-price[^"]*"/.test(win)            ||  // crossed-out original price
    /you\s+save[:\s]+\$?[\d,.]+/i.test(win)               ||  // "You Save $X"
    /was[\s:]+\$[\d,.]+/i.test(win)                           // "Was $X.XX"
  )
}

// Extract saving percentage string for the summary line
function parseSavingPct(win = '') {
  const m = win.match(/[−\-]\s*(\d+)\s*%/) || win.match(/(\d+)\s*%\s*off/i)
  return m ? `−${m[1]}%` : null
}

// ── Jina fetch ────────────────────────────────────────────────────────────────
async function fetchViaJina(url) {
  const headers = {
    'User-Agent':     'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'x-respond-with': 'html',
    'Accept':         'text/html',
  }
  if (process.env.JINA_API_KEY) headers['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY

  const res = await fetch('https://r.jina.ai/' + url, {
    headers,
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error(`Jina ${res.status}`)
  const html = await res.text()
  if (html.length < 1000) throw new Error(`Jina response too short (${html.length} chars)`)
  return html
}

// ── Parse deal items from Amazon search result HTML ───────────────────────────
function parseSearchResults(html) {
  const items = []
  const seen  = new Set()

  const asinRe = /data-asin="([A-Z0-9]{10})"/gi
  let m
  while ((m = asinRe.exec(html)) !== null) {
    const asin = m[1]
    if (seen.has(asin)) continue
    seen.add(asin)

    const win = html.slice(m.index, m.index + 4000)

    // ── Deal gate: skip if no discount evidence ──────────────────────────────
    if (!isDealItem(win)) continue

    // ── Title ────────────────────────────────────────────────────────────────
    let title = null
    for (const pat of [
      /class="[^"]*a-size-(?:medium|base-plus|medium-bold)[^"]*"[^>]*>([\s\S]{10,250}?)<\/span>/i,
      /<h2[^>]*>[\s\S]*?<span[^>]*>([\s\S]{10,250}?)<\/span>[\s\S]*?<\/h2>/i,
    ]) {
      const tm = win.match(pat)
      if (tm) {
        const t = tm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
        if (t.length > 10) { title = t; break }
      }
    }

    // ── Current price ────────────────────────────────────────────────────────
    let price = null
    const pm = win.match(/class="a-offscreen">\$?([\d,.]+)<\/span>/)
    if (pm) price = `$${parseFloat(pm[1].replace(/,/g, '')).toFixed(2)}`

    // ── Saving pct ───────────────────────────────────────────────────────────
    const savingPct = parseSavingPct(win)

    // ── Product image ─────────────────────────────────────────────────────────
    let imageUrl = null
    const im = win.match(/<img[^>]+class="[^"]*s-image[^"]*"[^>]*src="([^"]+)"/i)
            || win.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9%._-]+\.(?:jpg|jpeg|png|webp))"/i)
    if (im) imageUrl = im[1].replace(/\._[A-Z]{2,4}\d*_\./, '._SL500_.')

    items.push({ asin, title, price, savingPct, imageUrl })
    if (items.length >= 12) break
  }

  return items
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth       = req.headers.get('authorization')
  const adminKey   = req.headers.get('x-admin-key')
  const isCron     = cronSecret && auth === `Bearer ${cronSecret}`
  const isVercel   = req.headers.get('x-vercel-cron') === '1'
  const isAdmin    = adminKey === ADMIN_KEY

  if (!isCron && !isVercel && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const brandFilter = searchParams.get('brand')
  const sources = brandFilter
    ? BRAND_SOURCES.filter(b => b.id === brandFilter)
    : BRAND_SOURCES

  const t0    = Date.now()
  const stats = { brands: 0, found: 0, notDeals: 0, filtered: 0, added: 0, skipped: 0, imaged: 0 }

  try {
    // Load all existing Amazon ASINs once
    const existingDocs = await sanity.fetch(
      `*[_type == "gunDeal" && source == "amazon"] { tags }`
    ).catch(() => [])
    const existingAsins = new Set(
      existingDocs
        .flatMap(d => d.tags || [])
        .filter(t => typeof t === 'string' && t.startsWith('asin:'))
        .map(t => t.slice(5))
    )

    for (const brand of sources) {
      stats.brands++
      if (stats.brands > 1) await new Promise(r => setTimeout(r, 2000))

      let html
      try {
        html = await fetchViaJina(brand.url)
      } catch (err) {
        console.error(`[amazon-brands] ${brand.id}: ${err.message}`)
        continue
      }

      const items = parseSearchResults(html)
      stats.found += items.length

      const mutations = []
      for (const item of items) {
        if (!item.asin || existingAsins.has(item.asin)) { stats.skipped++; continue }
        if (!item.title || !is2ARelevant(item.title, brand.brandWords)) { stats.filtered++; continue }

        existingAsins.add(item.asin)

        // Upload image to Sanity CDN
        let sanityImg = null
        if (item.imageUrl) {
          sanityImg = await uploadImageToSanity(item.imageUrl, `amazon-${item.asin}`).catch(() => null)
          if (sanityImg) stats.imaged++
        }
        await new Promise(r => setTimeout(r, 400))

        const summaryParts = [item.price, item.savingPct, brand.label, 'Amazon'].filter(Boolean)

        mutations.push({
          create: {
            _type:       'gunDeal',
            title:       item.title,
            externalUrl: `https://www.amazon.com/dp/${item.asin}?tag=${ASSOCIATE_TAG}&linkCode=ogi&th=1&psc=1`,
            source:      'amazon',
            store:        brand.store,
            price:        item.price || '',
            category:     brand.cat,
            summary:      summaryParts.join(' · '),
            imageUrl:     sanityImg || item.imageUrl || null,
            approved:     true,
            publishedAt:  new Date().toISOString(),
            tags:         ['amazon', `asin:${item.asin}`, brand.id, brand.cat, 'deal'],
          },
        })
        stats.added++
      }

      for (let i = 0; i < mutations.length; i += 100) {
        await sanity.mutate(mutations.slice(i, i + 100))
      }
    }

    const ms = Date.now() - t0
    await reportCronRun('amazon-brands', {
      status:  'success', ms,
      details: `brands:${stats.brands} found:${stats.found} notDeals:${stats.notDeals} filtered:${stats.filtered} added:${stats.added} skipped:${stats.skipped} imaged:${stats.imaged}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true, ms, ...stats })

  } catch (err) {
    console.error('[amazon-brands] fatal:', err.message)
    await reportCronRun('amazon-brands', { status: 'failed', ms: Date.now() - t0, error: err.message }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
