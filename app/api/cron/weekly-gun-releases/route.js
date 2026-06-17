export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import crypto from 'crypto'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── AUTH ──────────────────────────────────────────────────────────────────────
function isAuthorized(req) {
  const cron    = req.headers.get('x-vercel-cron')
  const auth    = req.headers.get('authorization')
  const admin   = req.headers.get('x-admin-key')
  const secret  = process.env.CRON_SECRET
  return cron === '1'
    || (secret && auth === `Bearer ${secret}`)
    || admin === process.env.ADMIN_KEY
}

// ── PARSE RSS FEED ────────────────────────────────────────────────────────────
async function parseFeed(url, label='') {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0 +https://downrangeco.com)' },
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) { console.log(`[RELEASES] ${label} returned ${r.status}`); return [] }
    const xml = await r.text()
    const items = []
    const rx = /<item[^>]*>([\s\S]*?)<\/item>/gi
    let m
    while ((m = rx.exec(xml)) !== null) {
      const b = m[1]
      const title   = (b.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)    ||[])[1]?.trim()||''
      const link    = (b.match(/<link[^>]*>([\s\S]*?)<\/link>/)                                  ||[])[1]?.trim()
                   || (b.match(/<guid[^>]*>(https?[^<]+)<\/guid>/)                               ||[])[1]?.trim()||''
      const desc    = (b.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)  ||[])[1]
                       ?.replace(/<[^>]+>/g,'').slice(0,500).trim()||''
      const pubDate = (b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)                            ||[])[1]?.trim()||''
      if (title && link) items.push({ title, link, desc, pubDate })
    }
    return items
  } catch(e) {
    console.log(`[RELEASES] Feed error ${label}: ${e.message}`)
    return []
  }
}

// ── CURATED SOURCES: Gun media + manufacturer PRN feeds ───────────────────────
// These are ONLY gun-specific sources — no general news that mentions gun brands
const SOURCES = [
  // Gun media — dedicated firearms coverage only
  { url: 'https://www.thetruthaboutguns.com/feed/',         label: 'TTAG' },
  { url: 'https://www.ammoland.com/feed/',                  label: 'AmmoLand' },
  { url: 'https://www.guns.com/feed',                       label: 'Guns.com' },
  { url: 'https://www.gunsandammo.com/feed/',               label: 'GunsAndAmmo' },
  { url: 'https://www.pewpewtactical.com/feed/',            label: 'PewPewTactical' },
  { url: 'https://www.shootingillustrated.com/feed/',       label: 'ShootingIllustrated' },
  { url: 'https://www.americanrifleman.org/feed/',          label: 'AmericanRifleman' },
  { url: 'https://www.handgunsmag.com/feed/',               label: 'Handguns' },
  { url: 'https://www.rifleshootermag.com/feed/',           label: 'RifleShooter' },
  { url: 'https://www.outdoorlife.com/guns/feed/',          label: 'OutdoorLife' },
  { url: 'https://www.fieldandstream.com/guns/feed/',       label: 'FieldAndStream' },
  // PRNewswire gun manufacturer keywords
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=firearms', label: 'PRN-firearms' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=pistol',   label: 'PRN-pistol' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=rifle',    label: 'PRN-rifle' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=shotgun',  label: 'PRN-shotgun' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=suppressor', label: 'PRN-suppressor' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Glock',   label: 'PRN-Glock' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=SIG+Sauer', label: 'PRN-SIG' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Smith+Wesson', label: 'PRN-SW' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Ruger',   label: 'PRN-Ruger' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Springfield+Armory', label: 'PRN-Springfield' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Daniel+Defense', label: 'PRN-DD' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Mossberg', label: 'PRN-Mossberg' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Taurus',  label: 'PRN-Taurus' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Canik',   label: 'PRN-Canik' },
  { url: 'https://www.prnewswire.com/rss/news-releases-list.rss?d=rss&kw=Walther',  label: 'PRN-Walther' },
  // BusinessWire
  { url: 'https://feed.businesswire.com/rss/home/?rss=G22&rssid=firearms', label: 'BW-firearms' },
]

// Hard blacklist — domains that NEVER produce gun release content
const BLACKLIST_DOMAINS = [
  'economictimes','indiatimes','timesofindia','ndtv','hindustantimes','deccanherald',
  'moneycontrol','financialexpress','livemint','theprint','scroll.in','thewire',
  'dailymail','theguardian','bbc.','cnn.','foxnews','msnbc','npr.org',
  'yahoo.com/news','msn.com','reddit.com','facebook.com','twitter.com',
  'horoscope','astrology','zodiac',
]

// Patterns that definitively mark an article as NOT a gun product release
const JUNK_PATTERNS = [
  /horoscope/i, /astrology/i, /zodiac/i, /born on/i,
  /family feud/i, /game show/i, /tv show/i, /television/i,
  /ford f-150/i, /toyota/i, /honda civic/i, /chevrolet/i, /automobile/i,
  /socom contract/i, /military contract/i, /department of defense/i,
  /attorney general/i, /commonwealth attorney/i, /district attorney/i,
  /senator/i, /congressman/i, /legislation/i, /vote on/i,
  /nra convention speech/i, /gun violence/i, /mass shooting/i,
  /stock market/i, /earnings report/i, /quarterly results/i,
  /march \d|april \d|may \d|june \d|july \d|august \d|sept \d|oct \d|nov \d|dec \d/i,  // date-specific news
]

function isBlacklisted(url) {
  const u = (url || '').toLowerCase()
  return BLACKLIST_DOMAINS.some(d => u.includes(d))
}

function isJunk(title, desc) {
  const text = `${title} ${desc}`
  return JUNK_PATTERNS.some(rx => rx.test(text))
}

  console.log(`[RELEASES] Starting — ${SOURCES.length} curated sources, ANTHROPIC_KEY=${!!process.env.ANTHROPIC_API_KEY}`)

  const allItems = []
  const seenUrls = new Set()

  // Fetch all curated sources in parallel batches
  for (let i = 0; i < SOURCES.length; i += 5) {
    const batch = SOURCES.slice(i, i + 5)
    const results = await Promise.all(batch.map(s => parseFeed(s.url, s.label)))
    for (let j = 0; j < batch.length; j++) {
      let added = 0
      for (const item of results[j]) {
        if (!item.link || seenUrls.has(item.link)) continue
        if (isBlacklisted(item.link)) continue
        if (isJunk(item.title, item.desc)) continue
        if (!isRelease(item.title, item.desc)) continue
        seenUrls.add(item.link)
        allItems.push({ ...item, feedSource: batch[j].label })
        added++
      }
      if (added) console.log(`[RELEASES] ${batch[j].label}: +${added}`)
    }
    await sleep(200)
  }

  console.log(`[RELEASES] ${allItems.length} total candidates from ${SOURCES.length} curated gun sources`)

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Pre-filter: known brand + within cutoff + not junk
  const brandedItems = allItems.filter(item => {
    if (isBlacklisted(item.link)) return false
    if (isJunk(item.title, item.desc)) return false
    const brand = detectBrand(item.title + ' ' + item.desc)
    if (!brand) return false
    const pub = item.pubDate ? new Date(item.pubDate) : null
    if (pub && pub < cutoff) return false
    return true
  })

  console.log(`[RELEASES] ${brandedItems.length} items passed brand+date filter (of ${allItems.length} total)`)

  // Batch dedup check against Sanity
  let existingKeys = new Set()
  try {
    const existing = await sanity.fetch(`*[_type=="firearmRelease"]{ brand, model }`)
    existingKeys = new Set(existing.map(d => `${d.brand}::${d.model}`.toLowerCase()))
    console.log(`[RELEASES] ${existingKeys.size} existing releases in Sanity`)
  } catch(e) {
    console.log('[RELEASES] Dedup prefetch failed:', e.message)
  }

  for (const item of brandedItems.slice(0, 30)) {
    if (created >= 15) break

    const brand = detectBrand(item.title + ' ' + item.desc)

    let extracted = await extractAndWrite(item.title, item.desc, item.link)
    if (!extracted) {
      // AI failed or no key — try basic extraction as fallback
      extracted = createBasicRelease(item.title, item.desc, item.link, brand)
      if (!extracted || extracted.skip) {
        skipped++
        console.log(`[RELEASES] Skip (no AI + basic failed): ${item.title.slice(0,60)}`)
        continue
      }
      console.log(`[RELEASES] Using basic extraction for: ${extracted.brand} — ${extracted.model}`)
    }

    const key = `${extracted.brand}::${extracted.model}`.toLowerCase()
    if (seenKeys.has(key) || existingKeys.has(key)) {
      skipped++
      console.log(`[RELEASES] Dupe skip: ${extracted.brand} ${extracted.model}`)
      continue
    }

    try {
      await saveRelease(extracted, item.link, item.pubDate)
      seenKeys.add(key)
      created++
      saved.push(`${extracted.brand} — ${extracted.model}`)
      console.log(`[RELEASES] ✓ ${extracted.brand} — ${extracted.model}`)
    } catch(e) {
      failed++
      errors.push(`${extracted.brand} ${extracted.model}: ${e.message}`)
      console.error(`[RELEASES] Save failed: ${e.message}`)
    }

    await sleep(500)
  }

  const ms = Date.now() - t0
  const details = `discovered:${allItems.length} created:${created} skipped:${skipped} failed:${failed} (${ms}ms)`
    + (saved.length ? ' | Saved: ' + saved.join(', ') : ' | None saved')
    + (errors.length ? ' | Errors: ' + errors.slice(0,3).join('; ') : '')

  console.log('[RELEASES] Done:', details)
  await reportCronRun('weekly-gun-releases', { status: 'success', ms, details }).catch(()=>{})

  return Response.json({ ok: true, discovered: allItems.length, created, skipped, failed, saved, errors, ms, message: details })
}

export async function POST(req) { return GET(req) }
