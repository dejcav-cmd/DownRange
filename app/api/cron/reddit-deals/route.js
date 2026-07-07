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

import { NextResponse }             from 'next/server'
import { createClient }             from '@sanity/client'
import { reportCronRun }            from '@/lib/cronReporter'
import { uploadImageToSanity }      from '@/lib/imageUpload'
import { scrapeProductImage }       from '@/lib/scrapeProductImage'

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
    // 1. Fetch r/gundeals via RSS feed
    // Reddit's JSON API 403s from datacenter IPs; RSS is not rate-limited.
    // RSS hot feed is sorted by Reddit's hot algorithm — same quality signal.
    const rssRes = await fetch(
      'https://www.reddit.com/r/gundeals/hot.rss?limit=100',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0; +https://downrangeco.com)',
          'Accept':     'application/rss+xml, application/xml, text/xml, */*',
        },
        signal: AbortSignal.timeout(20000),
      }
    )
    if (!rssRes.ok) throw new Error(`Reddit RSS ${rssRes.status}`)
    const xml = await rssRes.text()

    // Parse RSS — handle both RSS 2.0 (<item>) and Atom (<entry>) formats.
    // For Reddit link posts: <link> IS the deal URL (not reddit.com).
    // For self posts: <link> is reddit.com — skip those.
    const posts = []

    function unescape(s = '') {
      return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).trim()
    }

    // Try RSS 2.0 <item> blocks first, fall back to Atom <entry>
    const blockTag  = xml.includes('<item>') ? 'item' : 'entry'
    const blockRe   = new RegExp(`<${blockTag}>([\\s\\S]*?)<\\/${blockTag}>`, 'gi')
    let em
    while ((em = blockRe.exec(xml)) !== null && posts.length < 100) {
      const block = em[1]

      // Title
      const titleM = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
      if (!titleM) continue
      const title = unescape(titleM[1])
      if (!title || title.length < 10) continue

      // Link — RSS 2.0 uses <link>text</link>; Atom uses <link href="..."/>
      let link = ''
      const linkHrefM = block.match(/<link[^>]+href="([^"]+)"/i)
      const linkTextM = block.match(/<link[^>]*>([^<]+)<\/link>/i)
      if (linkHrefM)      link = unescape(linkHrefM[1])
      else if (linkTextM) link = unescape(linkTextM[1])
      if (!link) continue

      // Determine deal URL and post ID
      // If link is a reddit.com comments URL, extract deal URL from description/content
      let dealUrl = link
      let id = ''

      const redditComments = link.match(/reddit\.com\/r\/[^\/]+\/comments\/([a-z0-9]+)\//i)
      if (redditComments) {
        id = redditComments[1]
        // Extract the actual deal link from description or content
        const descM = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)
                   || block.match(/<content[^>]*>([\s\S]*?)<\/content>/i)
        if (descM) {
          const decoded = unescape(descM[1])
          const hrefM   = decoded.match(/href="(https?:\/\/(?!(?:www\.)?reddit)[^"]+)"/i)
          if (hrefM) dealUrl = hrefM[1]
          else {
            // No external link in content = self post; skip
            continue
          }
        } else continue
      } else {
        // Link is already the deal URL (non-reddit); extract ID from guid or URL
        const guidM = block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i)
        if (guidM) {
          const gm = unescape(guidM[1]).match(/comments\/([a-z0-9]+)/i)
          if (gm) id = gm[1]
        }
        if (!id) id = Math.abs(dealUrl.split('').reduce((h,c)=>(Math.imul(31,h)+c.charCodeAt(0))|0,0)).toString(36)
      }

      if (!dealUrl || dealUrl.includes('reddit.com')) continue

      const dateM   = block.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/i)
                   || block.match(/<updated[^>]*>([^<]+)<\/updated>/i)
      const imgM    = block.match(/<img[^>]+src="([^"]+)"/i)

      posts.push({
        id,
        title,
        url:             dealUrl,
        score:           50,
        num_comments:    0,
        link_flair_text: '',
        is_self:         false,
        created_utc:     dateM ? new Date(unescape(dateM[1])).getTime() / 1000 : Date.now() / 1000,
        thumbnail:       imgM ? imgM[1] : '',
        preview:         null,
      })
    }
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

      // 1. Try Reddit preview image → Sanity CDN
      // 2. Fall back to scraping OG image from the actual retailer product URL
      let sanityImg = null
      if (imgUrl) {
        sanityImg = await uploadImageToSanity(imgUrl, `reddit-${post.id}`).catch(() => null)
      }
      if (!sanityImg && post.url) {
        sanityImg = await scrapeProductImage(post.url, `reddit-${post.id}`).catch(() => null)
      }
      if (sanityImg) stats.imaged++

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
