export const dynamic    = 'force-dynamic'
export const maxDuration = 120

/**
 * r/gundeals scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Reddit's public JSON API (no auth required).
 * Quality gate: score ≥ 10, not expired, not a self/meta post, within 48h.
 * Community upvotes serve as the deal quality signal that gun.deals lacks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse }        from 'next/server'
import { createClient }        from '@sanity/client'
import { reportCronRun }       from '@/lib/cronReporter'
import { uploadImageToSanity } from '@/lib/imageUpload'

const ADMIN_KEY  = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'

const sanity = createClient({
  projectId:  PROJECT_ID,
  dataset:    'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN,
  useCdn:     false,
})

// ── Reddit flair → gunDeal category ──────────────────────────────────────────
const FLAIR_MAP = {
  'rifle':        'rifle',     'rifles':       'rifle',
  'handgun':      'pistol',    'handguns':     'pistol',    'pistol':    'pistol',
  'shotgun':      'shotgun',   'shotguns':     'shotgun',
  'ammo':         'ammo',      'ammunition':   'ammo',
  'nfa':          'suppressor','suppressor':   'suppressor','silencer':  'suppressor',
  'optic':        'optic',     'optics':       'optic',     'scope':     'optic',
  'archery':      'archery',
  'accessory':    'accessory', 'accessories':  'accessory', 'gear':      'accessory',
}

function mapFlair(raw = '') {
  return FLAIR_MAP[raw.toLowerCase().trim()] || 'accessory'
}

// ── Detect deal category from title when flair isn't specific ────────────────
function detectCategory(title = '') {
  const t = title.toLowerCase()
  if (/\bnfa\b|suppressor|silencer|form 4/.test(t))                              return 'suppressor'
  if (/\bammo\b|9mm|\\.223|5\\.56|\\.308|7\\.62|\\.45|rounds|gr fmj/.test(t))   return 'ammo'
  if (/rifle|ar-?15|ak-?47|carbine|sbr|bolt.action|lever.action/.test(t))       return 'rifle'
  if (/pistol|handgun|glock|sig |beretta|1911|revolver/.test(t))                 return 'pistol'
  if (/shotgun|mossberg|remington 870|benelli/.test(t))                          return 'shotgun'
  if (/scope|optic|red dot|lpvo|eotech|aimpoint|vortex|holosun/.test(t))         return 'optic'
  if (/\bbow\b|archery|broadhead|crossbow|arrow /.test(t))                       return 'archery'
  return 'accessory'
}

// ── Extract price string from title ──────────────────────────────────────────
function extractPrice(title = '') {
  const m = title.match(/\$[\d,]+(?:\.\d{2})?/)
  return m ? m[0] : null
}

// ── Extract store/retailer name from title ────────────────────────────────────
function extractStore(title = '') {
  // Patterns: "at Brownells", "@ PSA", "from MidwayUSA"
  const m = title.match(/(?:\bat\b|[@]|from)\s+([A-Z][A-Za-z0-9 &'.]+?)(?:\s*[\[\(]|\s*$)/i)
  if (m) return m[1].trim().slice(0, 40)
  return null
}

// ── Skip posts that aren't real deals ─────────────────────────────────────────
const SKIP_FLAIRS = new Set(['discussion','meta','weekly thread','ban appeal','mod post','ama','megathread'])
const SKIP_TITLE_PATTERNS = /\[expired\]|\[removed\]|\[deleted\]|\bweekly\b|\bmonthly\b|\bmod post\b|\bdiscussion\b/i

function shouldSkip(post) {
  const flair  = (post.link_flair_text || '').toLowerCase()
  const title  = post.title || ''
  if (SKIP_FLAIRS.has(flair))              return true
  if (SKIP_TITLE_PATTERNS.test(title))     return true
  if (post.is_self)                        return true  // text post, no deal URL
  if (post.score < 10)                     return true  // quality gate
  const ageHours = (Date.now() / 1000 - post.created_utc) / 3600
  if (ageHours > 48)                       return true  // deals expire quickly
  // Skip non-retail URLs (images, youtube, etc.)
  const url = post.url || ''
  if (/\.(jpg|png|gif|webp|mp4|youtube|youtu\.be|imgur\.com\/[^a])/i.test(url)) return true
  return false
}

// ── Get best available image URL from a post ─────────────────────────────────
function getPostImageUrl(post) {
  // Preview images have full-res versions; URLs are NOT entity-encoded when raw_json=1
  try {
    const src = post.preview?.images?.[0]?.source?.url
    if (src && src.startsWith('http')) return src
  } catch {}
  // Thumbnail fallback (small but usable)
  const thumb = post.thumbnail || ''
  if (thumb.startsWith('https')) return thumb
  return null
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
  const DEADLINE = 100_000
  const stats = { fetched: 0, skipped: 0, added: 0, imaged: 0, errors: 0 }

  try {
    // 1. Fetch r/gundeals hot posts (raw_json=1 prevents &amp; encoding in URLs)
    const res = await fetch(
      'https://www.reddit.com/r/gundeals/hot.json?limit=100&raw_json=1',
      {
        headers: {
          'User-Agent': 'DownRange:downrange-deals-aggregator:v1.0 (by /u/downrange_deals)',
          'Accept':     'application/json',
        },
        signal: AbortSignal.timeout(20000),
      }
    )
    if (!res.ok) throw new Error(`Reddit API ${res.status}`)
    const data  = await res.json()
    const posts = (data?.data?.children || []).map(c => c.data)
    stats.fetched = posts.length

    // 2. Load existing Reddit post IDs to skip duplicates
    const existingDocs = await sanity.fetch(
      `*[_type == "gunDeal" && source == "reddit"] { tags }`,
      {}
    ).catch(() => [])
    const existingIds = new Set(
      existingDocs
        .flatMap(d => d.tags || [])
        .filter(t => t.startsWith('reddit:'))
        .map(t => t.slice(7))
    )

    // 3. Process posts
    const mutations = []

    for (const post of posts) {
      if (Date.now() - t0 > DEADLINE) break

      if (shouldSkip(post)) { stats.skipped++; continue }
      if (existingIds.has(post.id)) { stats.skipped++; continue }
      existingIds.add(post.id)

      const flair    = post.link_flair_text || ''
      const category = mapFlair(flair) !== 'accessory'
        ? mapFlair(flair)
        : detectCategory(post.title)

      const price    = extractPrice(post.title)
      const store    = extractStore(post.title)
      const imgUrl   = getPostImageUrl(post)
      const score    = post.score
      const comments = post.num_comments || 0

      // Upload image to Sanity CDN
      let sanityImg = null
      if (imgUrl) {
        sanityImg = await uploadImageToSanity(imgUrl, `reddit-${post.id}`).catch(() => null)
        if (sanityImg) stats.imaged++
      }

      const summaryParts = [
        price,
        store,
        `▲${score}`,
        comments > 0 ? `${comments} comments` : null,
        'r/gundeals',
      ].filter(Boolean)

      mutations.push({
        create: {
          _type:       'gunDeal',
          title:       post.title.replace(/^\[[^\]]+\]\s*/, '').slice(0, 200), // strip leading [Category]
          externalUrl: post.url,
          source:      'reddit',
          store:       store || 'r/gundeals',
          price:       price || '',
          category,
          summary:     summaryParts.join(' · '),
          imageUrl:    sanityImg || null,
          approved:    true,
          publishedAt: new Date(post.created_utc * 1000).toISOString(),
          tags:        [
            'reddit',
            'r/gundeals',
            `reddit:${post.id}`,
            category,
            flair.toLowerCase() || 'deal',
          ].filter(Boolean),
        },
      })
      stats.added++
    }

    // 4. Write to Sanity in batches of 100
    for (let i = 0; i < mutations.length; i += 100) {
      await sanity.mutate(mutations.slice(i, i + 100))
    }

    // 5. Expire Reddit deals older than 5 days (they go stale fast)
    const cutoff = new Date(Date.now() - 5 * 86400 * 1000).toISOString()
    const stale = await sanity.fetch(
      `*[_type=="gunDeal" && source=="reddit" && approved==true && publishedAt < $cutoff]{_id}`,
      { cutoff }
    ).catch(() => [])
    if (stale.length > 0) {
      await sanity.mutate(stale.map(d => ({ patch: { id: d._id, set: { approved: false } } })))
    }

    const ms = Date.now() - t0
    await reportCronRun('reddit-deals', {
      status: 'success', ms,
      details: `fetched:${stats.fetched} added:${stats.added} skipped:${stats.skipped} imaged:${stats.imaged} expired:${stale.length}`,
    }).catch(() => {})

    return NextResponse.json({ ok: true, ms, ...stats, expired: stale.length })

  } catch (err) {
    console.error('[reddit-deals]', err.message)
    await reportCronRun('reddit-deals', {
      status: 'failed', ms: Date.now() - t0, error: err.message,
    }).catch(() => {})
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
