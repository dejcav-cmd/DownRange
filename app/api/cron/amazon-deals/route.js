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

// ── Search rotation — 16 queries, 4 per 6-hour slot ───────────────────────────
//   Slot 0 (00-05 UTC): cleaning & protection
//   Slot 1 (06-11 UTC): stability & lighting
//   Slot 2 (12-17 UTC): optics & storage
//   Slot 3 (18-23 UTC): maintenance & shooting aids

const ALL_QUERIES = [
  // Slot 0
  { keywords: 'gun cleaning kit firearm',               cat: 'accessory', minSave: 5  },
  { keywords: 'electronic shooting ear protection',     cat: 'accessory', minSave: 5  },
  { keywords: 'shooting eye protection ballistic',      cat: 'accessory', minSave: 5  },
  { keywords: 'gun bore snake cleaner',                 cat: 'accessory', minSave: 5  },
  // Slot 1
  { keywords: 'rifle bipod adjustable lightweight',     cat: 'accessory', minSave: 5  },
  { keywords: 'tactical flashlight weapon light',       cat: 'accessory', minSave: 5  },
  { keywords: 'shooting range bag backpack tactical',   cat: 'accessory', minSave: 5  },
  { keywords: 'shooting sling two point rifle',         cat: 'accessory', minSave: 5  },
  // Slot 2
  { keywords: 'rifle scope rings mount picatinny',      cat: 'optic',     minSave: 5  },
  { keywords: 'concealed carry holster iwb kydex',      cat: 'accessory', minSave: 5  },
  { keywords: 'gun quick access safe pistol',           cat: 'accessory', minSave: 5  },
  { keywords: 'gun lock trigger cable lock storage',    cat: 'accessory', minSave: 5  },
  // Slot 3
  { keywords: 'gun oil CLP firearm lubricant',          cat: 'accessory', minSave: 5  },
  { keywords: 'steel shooting target ar500 reactive',   cat: 'accessory', minSave: 5  },
  { keywords: 'shooting rest bench bag sandbag',        cat: 'accessory', minSave: 5  },
  { keywords: 'gun cleaning mat workstation bench',     cat: 'accessory', minSave: 5  },
]

function currentSlotQueries() {
  const hour = new Date().getUTCHours()
  const slot = Math.floor(hour / 6) // 0-3
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
