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

// ── PARSE RSS/ATOM FEED (native fetch, no rss-parser) ─────────────────────────
async function parseFeed(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)' },
      signal: AbortSignal.timeout(10000),
    })
    if (!r.ok) { console.log(`[RELEASES] Feed ${url} returned ${r.status}`); return [] }
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
                       ?.replace(/<[^>]+>/g,'').slice(0,400).trim()||''
      const pubDate = (b.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)                            ||[])[1]?.trim()||''
      if (title && link) items.push({ title, link, desc, pubDate })
    }
    return items
  } catch(e) {
    console.log(`[RELEASES] Feed error ${url}: ${e.message}`)
    return []
  }
}

// ── GOOGLE NEWS RSS (no blocking, no auth) ────────────────────────────────────
async function fetchGoogleNews(query) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
  return parseFeed(url)
}

// ── SIGNAL DETECTION ──────────────────────────────────────────────────────────
const SIGNALS = ['new ','release','launch','introduces','announced','unveiled','debuts',
  'ships','available now','first look','new model','new pistol','new rifle','new shotgun','new suppressor']
const SKIP    = ['recall','lawsuit','earnings','quarterly','hiring','scholarship','sale ends']
const BRANDS  = ['Glock','SIG Sauer','Smith & Wesson','Ruger','Springfield Armory','Taurus',
  'Canik','Staccato','Shadow Systems','Walther','CZ','HK','Beretta','Kimber','Wilson Combat',
  'Daniel Defense','Aero Precision','LWRC','Christensen Arms','Savage','Tikka','Mossberg',
  'Winchester','Browning','Benelli','SilencerCo','Dead Air','Holosun','Trijicon','Vortex',
  'Leupold','Magpul','Geissele','Surefire','Streamlight','Maxim Defense','IWI','ZEV Technologies',
  'Nighthawk','Fusion Firearms','BCM','Barrett','Radian','LaRue','CMMG','Troy Industries']

function isRelease(title, desc) {
  const t = (title+' '+desc).toLowerCase()
  return SIGNALS.some(k=>t.includes(k)) && !SKIP.some(k=>t.includes(k))
}
function detectBrand(text) {
  const t = text.toLowerCase()
  return BRANDS.find(b => t.includes(b.toLowerCase())) || null
}

// ── AI EXTRACT + WRITE ────────────────────────────────────────────────────────
async function extractAndWrite(title, desc, link) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[RELEASES] No ANTHROPIC_API_KEY — skipping AI extraction')
    return null
  }
  const prompt = `You are a DownRange firearms editor. Given this article, extract product data and write an original article.

Title: ${title}
Excerpt: ${desc.slice(0,800)}
Source: ${link}

Return ONLY this JSON (no markdown fences):
{
  "brand": "manufacturer name",
  "model": "exact model",
  "category": "Pistol|Rifle|Shotgun|Revolver|Suppressor|Optic|Accessory",
  "caliber": "e.g. 9mm or null",
  "msrp": 0,
  "summary": "2-3 sentences, specific, direct, for serious gun owners",
  "body": "400-600 word HTML article with <h2> sections. Original prose.",
  "specs": [{"label":"Barrel","value":"4in"}],
  "skip": false
}
If this is NOT a new product announcement, set skip:true.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    })
    const data  = await res.json()
    const raw   = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    const parsed = JSON.parse(clean)
    return parsed.skip ? null : parsed
  } catch(e) {
    console.error('[RELEASES] AI error:', e.message)
    return null
  }
}

// ── DEDUP ─────────────────────────────────────────────────────────────────────
async function isDuplicate(brand, model) {
  try {
    const n = await sanity.fetch(
      `count(*[_type=="firearmRelease" && brand==$brand && model==$model])`,
      { brand, model }
    )
    return n > 0
  } catch { return false }
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
async function saveRelease(extracted, sourceUrl, pubDate) {
  const slug = extracted.title
    ? extracted.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)
    : (extracted.brand+'-'+extracted.model).toLowerCase().replace(/[^a-z0-9]+/g,'-')
  const _id = 'release-' + crypto.createHash('md5')
    .update((extracted.brand+extracted.model).toLowerCase()).digest('hex').slice(0,12)

  return sanity.createOrReplace({
    _id, _type: 'firearmRelease',
    title:    extracted.title || `${extracted.brand} ${extracted.model}`,
    slug:     { _type:'slug', current:slug },
    brand:    extracted.brand,
    model:    extracted.model,
    category: extracted.category || 'Pistol',
    caliber:  extracted.caliber  || null,
    msrp:     extracted.msrp     || 0,
    summary:  extracted.summary  || '',
    body:     extracted.body     || null,
    specs:    (extracted.specs||[]).map(s=>({
      _type:'object', _key:s.label.toLowerCase().replace(/\s+/g,'-'), label:s.label, value:s.value
    })),
    sourceUrl,
    isJustDropped:   true,
    approved:        true,
    qualityReviewed: true,
    publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
  })
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  let created = 0, skipped = 0, failed = 0
  const saved = [], errors = [], seenKeys = new Set()

  // Google News queries — broad + brand-specific
  const queries = [
    'new firearm release 2026', 'new pistol announced 2026', 'new rifle 2026',
    'new shotgun 2026', 'new suppressor 2026', 'gun manufacturer new model 2026',
    'Glock new 2026', 'SIG Sauer new 2026', 'Smith Wesson new 2026',
    'Springfield Armory new 2026', 'Ruger new 2026', 'Taurus new 2026',
    'Canik new 2026', 'Walther new 2026', 'CZ new pistol 2026',
    'Daniel Defense new 2026', 'Christensen Arms new 2026',
    'Mossberg new 2026', 'Savage Arms new 2026', 'Tikka new rifle 2026',
    'SilencerCo new 2026', 'Dead Air new 2026',
    'Holosun new optic 2026', 'Trijicon new 2026',
    'ammoland new gun', 'thetruthaboutguns new firearm', 'pewpewtactical new gun',
  ]

  console.log(`[RELEASES] Starting — ${queries.length} queries, ANTHROPIC_KEY=${!!process.env.ANTHROPIC_API_KEY}`)

  const allItems = []
  const seenUrls = new Set()

  for (const query of queries) {
    const items = await fetchGoogleNews(query)
    for (const item of items) {
      if (!item.link || seenUrls.has(item.link)) continue
      if (!isRelease(item.title, item.desc)) continue
      seenUrls.add(item.link)
      allItems.push(item)
    }
    await sleep(200)
  }

  console.log(`[RELEASES] ${allItems.length} candidates from Google News`)

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Pre-filter: only items with a known brand, within cutoff
  const brandedItems = allItems.filter(item => {
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

    const extracted = await extractAndWrite(item.title, item.desc, item.link)
    if (!extracted) { skipped++; console.log(`[RELEASES] AI skip: ${item.title.slice(0,60)}`); continue }

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
