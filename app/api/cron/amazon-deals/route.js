export const dynamic    = 'force-dynamic'
export const maxDuration = 120

import { NextResponse }          from 'next/server'
import { createClient }          from '@sanity/client'
import { reportCronRun }         from '@/lib/cronReporter'
import { searchFirearmsDeals }   from '@/lib/amazonPA'
import { uploadImageToSanity }   from '@/lib/imageUpload'

const ADMIN_KEY  = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'

const sanity = createClient({
  projectId: PROJECT_ID,
  dataset:   'production',
  apiVersion:'2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

// ── Search rotation — 32 queries across 8 six-hour slots ─────────────────────
//   PA API runs every 6hr → 8 slots/day → full cycle every 2 days
//   Slot 0 (00-05 UTC): generic accessories
//   Slot 1 (06-11 UTC): optics accessories
//   Slot 2 (12-17 UTC): storage & protection
//   Slot 3 (18-23 UTC): maintenance & shooting aids
//   Slot 4 (next 00-05): weapon lights (Olight / Streamlight)
//   Slot 5 (next 06-11): optics brands (Vortex / Holosun / Burris / Zeiss)
//   Slot 6 (next 12-17): AR accessories (Magpul / Monstrum / Caldwell / Wheeler)
//   Slot 7 (next 18-23): archery (Mathews / Hoyt / Gold Tip / Rage / Barnett)

const ALL_QUERIES = [
  // ── Slot 0: generic accessories ────────────────────────────────────────────
  { keywords: 'gun cleaning kit firearm',               cat: 'accessory', minSave: 5  },
  { keywords: 'electronic shooting ear protection',     cat: 'accessory', minSave: 5  },
  { keywords: 'shooting eye protection ballistic',      cat: 'accessory', minSave: 5  },
  { keywords: 'gun bore snake cleaner',                 cat: 'accessory', minSave: 5  },
  // ── Slot 1: optics accessories ─────────────────────────────────────────────
  { keywords: 'rifle bipod adjustable lightweight',     cat: 'accessory', minSave: 5  },
  { keywords: 'rifle scope rings mount picatinny',      cat: 'optic',     minSave: 5  },
  { keywords: 'concealed carry holster iwb kydex',      cat: 'accessory', minSave: 5  },
  { keywords: 'shooting sling two point rifle',         cat: 'accessory', minSave: 5  },
  // ── Slot 2: storage & protection ──────────────────────────────────────────
  { keywords: 'gun quick access safe biometric pistol', cat: 'accessory', minSave: 5  },
  { keywords: 'gun lock trigger cable lock storage',    cat: 'accessory', minSave: 5  },
  { keywords: 'shooting range bag backpack tactical',   cat: 'accessory', minSave: 5  },
  { keywords: 'steel shooting target ar500 reactive',   cat: 'accessory', minSave: 5  },
  // ── Slot 3: maintenance & shooting aids ───────────────────────────────────
  { keywords: 'gun oil CLP firearm lubricant',          cat: 'accessory', minSave: 5  },
  { keywords: 'shooting rest bench bag sandbag',        cat: 'accessory', minSave: 5  },
  { keywords: 'gun cleaning mat workstation bench',     cat: 'accessory', minSave: 5  },
  { keywords: 'gun vise armorer bench block',           cat: 'accessory', minSave: 5  },
  // ── Slot 4: weapon lights ──────────────────────────────────────────────────
  { keywords: 'Olight weapon light tactical flashlight',cat: 'accessory', minSave: 5  },
  { keywords: 'Olight Baldr PL warrior flashlight',     cat: 'accessory', minSave: 5  },
  { keywords: 'Streamlight TLR weapon light rail',      cat: 'accessory', minSave: 5  },
  { keywords: 'Streamlight ProTac tactical flashlight', cat: 'accessory', minSave: 5  },
  // ── Slot 5: optics brands ─────────────────────────────────────────────────
  { keywords: 'Vortex Optics scope red dot sight',      cat: 'optic',     minSave: 5  },
  { keywords: 'Vortex Strikefire SPARC Crossfire optic',cat: 'optic',     minSave: 5  },
  { keywords: 'Holosun red dot sight ACSS reticle',     cat: 'optic',     minSave: 5  },
  { keywords: 'Burris FastFire scope optic riflescope', cat: 'optic',     minSave: 5  },
  // ── Slot 6: AR accessories & tools ────────────────────────────────────────
  { keywords: 'Magpul PMAG AR15 magazine grip stock',   cat: 'accessory', minSave: 5  },
  { keywords: 'Magpul MOE furniture AR15 accessories',  cat: 'accessory', minSave: 5  },
  { keywords: 'Monstrum scope mount ring cantilever',   cat: 'optic',     minSave: 5  },
  { keywords: 'Caldwell shooting rest Lead Sled target', cat: 'accessory', minSave: 5  },
  // ── Slot 7: archery ───────────────────────────────────────────────────────
  { keywords: 'Gold Tip arrows carbon arrow shafts',    cat: 'archery',   minSave: 5  },
  { keywords: 'Rage broadheads mechanical archery',     cat: 'archery',   minSave: 5  },
  { keywords: 'Carbon Express arrows crossbow bolts',   cat: 'archery',   minSave: 5  },
  { keywords: 'archery bow hunting accessories release', cat: 'archery',   minSave: 5  },
]

function currentSlotQueries() {
  const hour = new Date().getUTCHours()
  const slot = Math.floor(hour / 6) % 8   // 8 slots cycling across two days
  const start = slot * 4
  return ALL_QUERIES.slice(start, start + 4)
}

// ── Category detection (fills gunDeal.category) ───────────────────────────────
function detectCategory(title = '') {
  const t = title.toLowerCase()
  if (/scope|red dot|lpvo|eotech|aimpoint|sight|optic/.test(t)) return 'optic'
  if (/holster|magazine|pmag|trigger|sling|grip|stock|buffer/.test(t)) return 'accessory'
  return 'accessory'
}

// ── Expire Amazon deals older than N days ─────────────────────────────────────
async function expireOldDeals(days = 14) {
  const cutoff = new Date(Date.now() - days * 86400 * 1000).toISOString()
  const old = await sanity.fetch(
    `*[_type == "gunDeal" && source == "amazon" && approved == true && publishedAt < $cutoff] { _id }`,
    { cutoff }
  ).catch(() => [])
  if (!old.length) return 0
  const muts = old.map(d => ({ patch: { id: d._id, set: { approved: false } } }))
  await sanity.mutate(muts)
  return old.length
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

  const t0    = Date.now()
  const stats = { searched: 0, found: 0, added: 0, skipped: 0, imaged: 0, expired: 0 }

  try {
    // 1. Load existing ASINs to skip duplicates
    const existingDocs = await sanity.fetch(
      `*[_type == "gunDeal" && source == "amazon"] { tags }`
    ).catch(() => [])
    const existingAsins = new Set(
      existingDocs
        .flatMap(d => d.tags || [])
        .filter(t => typeof t === 'string' && t.startsWith('asin:'))
        .map(t => t.slice(5))
    )

    // 2. Run current slot's queries
    const queries = currentSlotQueries()
    const mutations = []

    for (const q of queries) {
      stats.searched++
      try {
        // Throttle between requests to respect PA API rate limit (1 req/sec)
        if (stats.searched > 1) await new Promise(r => setTimeout(r, 1200))

        const results = await searchFirearmsDeals(q.keywords, {
          minSavePercent: q.minSave,
          itemCount:      10,
        })
        stats.found += results.length

        for (const item of results) {
          if (existingAsins.has(item.asin)) {
            stats.skipped++
            continue
          }
          existingAsins.add(item.asin)  // prevent dups within this run

          // Upload product image to Sanity CDN (Amazon images are public — no proxy needed)
          let sanityImageUrl = null
          if (item.imageUrl) {
            sanityImageUrl = await uploadImageToSanity(
              item.imageUrl,
              `amazon-${item.asin}`
            )
            if (sanityImageUrl) stats.imaged++
          }

          mutations.push({
            create: {
              _type:       'gunDeal',
              title:       item.title,
              externalUrl: item.affiliateUrl,
              source:      'amazon',
              store:        'Amazon',
              price:        item.price || '',
              category:     detectCategory(item.title),
              summary:      item.summary,
              imageUrl:     sanityImageUrl || item.imageUrl || null,
              approved:     true,
              publishedAt:  new Date().toISOString(),
              tags:         [
                'amazon',
                `asin:${item.asin}`,
                detectCategory(item.title),
                ...(item.isPrime ? ['prime'] : []),
                ...(item.savingPct > 0 ? [`save:${item.savingPct}pct`] : []),
              ],
            },
          })
          stats.added++
        }
      } catch (qErr) {
        console.error(`[amazon-deals] query "${q.keywords}" failed:`, qErr.message)
        // Continue with next query rather than aborting the whole run
      }
    }

    // 3. Batch-write new deals (Sanity cap: 100 per mutate call)
    for (let i = 0; i < mutations.length; i += 100) {
      await sanity.mutate(mutations.slice(i, i + 100))
    }

    // 4. Expire deals older than 14 days
    stats.expired = await expireOldDeals(14)

    const ms = Date.now() - t0
    await reportCronRun('amazon-deals', {
      status:  'success',
      ms,
      details: `queries:${stats.searched} found:${stats.found} added:${stats.added} skipped:${stats.skipped} imaged:${stats.imaged} expired:${stats.expired}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true, ms, ...stats })

  } catch (err) {
    console.error('[amazon-deals] fatal:', err.message)
    await reportCronRun('amazon-deals', {
      status: 'failed',
      ms:     Date.now() - t0,
      error:  err.message,
    }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
