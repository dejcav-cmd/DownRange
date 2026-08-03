/**
 * Giveaway source scrapers — DownRange
 *
 * Pulled out of app/api/cron/giveaways/route.js so the parsing logic can be run
 * against the live sites without booting Next.js (see scripts/test_giveaway_sources.mjs).
 * The route keeps auth, Sanity writes and cron reporting; everything about
 * *getting* and *reading* a source lives here.
 */

// ── URL NORMALIZATION ─────────────────────────────────────────────────────────
// One normalizer used for BOTH in-run dedup and the "already in Sanity" check.
// They used to disagree — dedup stripped the whole query string while the
// existing-URL check kept it — so the same giveaway syndicated by two sources
// (one clean link, one carrying ?utm_source=) was re-created on every run.
// Tracking params are dropped; meaningful query params are kept.
const TRACKING_PARAM = /^(utm_|fbclid|gclid|msclkid|mc_cid|mc_eid|ref|referrer|source)$/i
function normalizeUrl(raw) {
  try {
    const u = new URL(raw)
    u.hash = ''
    u.protocol = 'https:'
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '')
    for (const k of [...u.searchParams.keys()]) {
      if (TRACKING_PARAM.test(k)) u.searchParams.delete(k)
    }
    u.pathname = u.pathname.replace(/\/+$/, '') || '/'
    return u.toString().replace(/\/$/, '').toLowerCase()
  } catch {
    return (raw || '').toLowerCase().replace(/[?#].*/, '').replace(/\/$/, '')
  }
}

function dedup(arr) {
  const seen = new Set()
  return arr.filter(g => {
    const key = normalizeUrl(g.entryUrl)
    if (!key || key.length < 12 || seen.has(key)) return false
    seen.add(key)
    return true
  })
}


// ── HELPERS ───────────────────────────────────────────────────────────────────
function detectCategory(title) {
  const t = (title || '').toLowerCase()
  if (/pistol|handgun|glock|sig ?p\d|9mm|1911|revolver|p365|hellcat|g19|g17|m&p|kimber|staccato|shadow systems|canik/.test(t)) return 'pistol'
  if (/ar-?15|ar-?10|\bar\b|\bspr\b|rifle|carbine|\bak\b|\bpcc\b|m4|308|6\.5|bolt.?action|lever.?action|upper|lower|handguard/.test(t)) return 'rifle'
  if (/shotgun|\bgauge\b|pump.?gun/.test(t))                                           return 'shotgun'
  if (/suppressor|silencer|\bsbr\b|\bsbs\b|full.?auto|\bnfa\b|form ?4/.test(t))      return 'nfa'
  if (/ammo|rounds?|brass|ammunition|cartridge/.test(t))                               return 'ammo'
  if (/optic|scope|red.?dot|lpvo|eotech|vortex|trijicon|aimpoint|holosun/.test(t))    return 'optics'
  if (/gear|tactical|holster|light|knife|bag|chest.?rig|plate.?carrier/.test(t))      return 'gear'
  return 'accessories'
}

function parseValue(str) {
  if (!str) return 0
  const m = String(str).replace(/[$,]/g, '').match(/[\d.]+/)
  return m ? Math.round(parseFloat(m[0])) : 0
}

function parseEndDate(str) {
  if (!str) return null
  str = String(str).trim()
  // M/D/YY or M/D/YYYY
  const slashParts = str.split('/')
  if (slashParts.length === 3) {
    const y = parseInt(slashParts[2]) < 100 ? 2000 + parseInt(slashParts[2]) : parseInt(slashParts[2])
    const m = parseInt(slashParts[0])
    const d = parseInt(slashParts[1])
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2025) {
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
  }
  try {
    const parsed = new Date(str)
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2025) {
      return parsed.toISOString().split('T')[0]
    }
  } catch { /* ignore */ }
  return null
}

function extractSponsor(title) {
  const brands = [
    'Glock','SIG Sauer','SIG','Ruger','Smith & Wesson','S&W','Springfield Armory',
    'Taurus','Beretta','CZ','Heckler & Koch','H&K','Walther','Shadow Systems',
    'Palmetto State Armory','PSA','Century Arms','Faxon','AT3','Staccato',
    'Bul Armory','EOTech','Vortex','Primary Arms','Dead Air','SilencerCo',
    'Streamlight','Swampfox','Magpul','Kimber','Colt','Benelli','Mossberg',
    'Remington','Winchester','Browning','Savage','Tikka','Christensen Arms',
    'Daniel Defense','Aero Precision','BCM','Wilson Combat','Nightforce',
    'Trijicon','Aimpoint','Holosun','Leupold','Burris','Bushnell',
    'LWRCI','Noveske','Canik','FN America','Kahr','Kel-Tec','CMMG',
    'Lucky Gunner','Ammo.com','Brownells','MidwayUSA',
    'Gun Owners of America','GOA','NRA','Second Amendment Foundation','SAF',
    'Warrior Poet Society','Colion Noir','Garand Thumb',
  ]
  for (const b of brands) {
    if ((title || '').toLowerCase().includes(b.toLowerCase())) return b
  }
  return null
}

// ── TRANSPORT ─────────────────────────────────────────────────────────────────
// r.jina.ai moved behind Cloudflare and now answers every datacenter IP with a
// 403 "Just a moment..." interstitial in ~20ms (verified 2026-08-03 from both
// Vercel and a GitHub Actions runner). Three of this cron's four sources were
// proxied through it, which is why every source reported 0 and the whole run
// finished in under a second.
//
// Direct fetch with a real browser UA returns 200 on wintheguns.com and
// gungiveaways.net, so direct is now the primary transport and Jina is only the
// fallback for the day a source starts blocking us instead.
const BROWSER_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control':   'no-cache',
}
const CHALLENGE = /just a moment|cf-browser-verification|checking your browser|enable javascript and cookies/i

async function fetchPage(url) {
  let directStatus = 0
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(20000) })
    directStatus = res.status
    if (res.ok) {
      const html = await res.text()
      if (html.length > 3000 && !CHALLENGE.test(html.slice(0, 2000))) {
        return { html, via: 'direct', status: res.status }
      }
    }
  } catch (e) {
    directStatus = directStatus || `direct:${e.name}`
  }

  try {
    const h = { ...BROWSER_HEADERS, 'x-respond-with': 'html' }
    if (process.env.JINA_API_KEY) h['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY
    const res = await fetch('https://r.jina.ai/' + url, { headers: h, signal: AbortSignal.timeout(25000) })
    if (res.ok) {
      const html = await res.text()
      if (html.length > 1000) return { html, via: 'jina', status: res.status }
    }
    return { html: null, via: 'none', status: `direct ${directStatus} / jina ${res.status}` }
  } catch (e) {
    return { html: null, via: 'none', status: `direct ${directStatus} / jina ${e.name}` }
  }
}

// ── PARSING ───────────────────────────────────────────────────────────────────
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '\u2019', lsquo: '\u2018', ldquo: '\u201C', rdquo: '\u201D', ndash: '\u2013', mdash: '\u2014', hellip: '\u2026', rarr: '\u2192' }
function decodeEntities(str) {
  return (str || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
}
const stripTags = (s) => (s || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ')
const clean = (s) => decodeEntities(stripTags(s)).replace(/\s+/g, ' ').trim()

// Entry-frequency markers these sites prefix titles with (*, ¹, ², daily-entry
// footnotes). Cosmetic to us — strip so titles dedupe and read cleanly.
const LEADING_MARKS = /^[\s*¹²³⁴⁵†‡•·\-–—]+/

// Works against whatever fetchPage returned: raw HTML anchors OR Jina markdown.
// Keeping both parsers alive is the point — the previous version only spoke
// markdown, so the moment the transport changed it silently matched nothing.
function extractLinks(doc, baseUrl) {
  const out = []
  const push = (rawTitle, rawHref, endIdx) => {
    const title = clean(rawTitle).replace(LEADING_MARKS, '').trim()
    if (title.length < 6) return
    let url
    try { url = new URL(decodeEntities(rawHref.trim()), baseUrl).toString() } catch { return }
    if (!/^https?:/i.test(url)) return
    out.push({ title, url, ctx: clean(doc.slice(endIdx, endIdx + 300)) })
  }

  const aRe = /<a\b[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]{0,600}?)<\/a>/gi
  let m
  while ((m = aRe.exec(doc)) !== null) push(m[2], m[1], m.index + m[0].length)

  const mdRe = /\[([^\]]{6,200})\]\((https?:\/\/[^\s\)]{10,300})\)/g
  while ((m = mdRe.exec(doc)) !== null) push(m[1], m[2], m.index + m[0].length)

  return out
}

// Both aggregators print a value and a start/end date pair right after each
// row's link, but in different orders — wintheguns is "$value end start",
// gungiveaways is "start $value end". Taking the LATER of the first two dates
// resolves the end date correctly on both without per-site date logic.
function readRowMeta(ctx) {
  const money = ctx.match(/\$\s?([\d,]+)/)
  const prizeValue = money ? parseValue(money[0]) : 0

  const dates = (ctx.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/g) || []).slice(0, 2)
    .map(parseEndDate).filter(Boolean).sort()
  let endDate = dates.length ? dates[dates.length - 1] : null
  // Guard against a stray date from a neighbouring row parking a giveaway on
  // the page for a year. Anything beyond ~13 months is treated as unknown.
  if (endDate && Date.parse(endDate) - Date.now() > 400 * 86400000) endDate = null

  return { prizeValue, endDate }
}

const JUNK_TITLE = /^(home|about|contact|privacy|terms|search|subscribe|categories|menu|how it works|faq|submit|sign ?in|sign ?up|log ?in|register|enter now|enter to win|enter here|enter|view details?|view|see (the )?giveaway|claim|details|learn more|read more|click here|next|previous|share|follow us|newsletter|advertise|disclosure|affiliate|rules|winners?|wordpress|powered by|designed by|theme by|proudly|cookie|accept)\b/i
const JUNK_HOST = /twitter\.com|x\.com|facebook\.com|instagram\.com|youtube\.com|tiktok\.com|linkedin\.com|pinterest\.|reddit\.com|mailto:/i
const ASSET_EXT = /\.(png|jpe?g|gif|svg|webp|ico|css|js|pdf)(\?|$)/i

// One scraper for every aggregator. Clean-link rule stays: we only ever save the
// outbound sponsor/platform entry URL, never a link back to the source's own site.
async function scrapeAggregator({ name, url, sourceType = 'aggregator' }) {
  const host = new URL(url).hostname.replace(/^www\./, '')
  const page = await fetchPage(url)
  if (!page.html) {
    return { name, giveaways: [], via: page.via, status: page.status,
             reason: `unreachable (${page.status})` }
  }

  const giveaways = []
  const seen = new Set()
  for (const link of extractLinks(page.html, url)) {
    if (JUNK_TITLE.test(link.title)) continue
    if (ASSET_EXT.test(link.url) || JUNK_HOST.test(link.url)) continue

    let linkHost
    try { linkHost = new URL(link.url).hostname.replace(/^www\./, '') } catch { continue }
    if (linkHost === host || linkHost.endsWith('.' + host)) continue

    const key = normalizeUrl(link.url)
    if (seen.has(key)) continue
    seen.add(key)

    const { prizeValue, endDate } = readRowMeta(link.ctx)
    const value = prizeValue || parseValue((link.title.match(/\$\s?([\d,]+)/) || [])[0])

    // Every genuine row on these aggregators carries a prize value, an end date
    // or both. A link with neither is page furniture — the "WordPress" footer
    // credit was landing in Sanity as a giveaway before this check.
    if (!value && !endDate) continue

    giveaways.push({
      title: link.title, entryUrl: link.url, prize: link.title,
      prizeValue: value, endDate,
      category:   detectCategory(link.title),
      sponsor:    extractSponsor(link.title) || sponsorFromHost(linkHost) || 'Various',
      sourceType,
      featured:   value >= 1500,
      active:     true,
      source:     name,
    })
  }

  console.log(`[GIVEAWAYS] ${name}: ${giveaways.length} entries via ${page.via}`)
  return { name, giveaways: giveaways.slice(0, 80), via: page.via, status: page.status,
           reason: giveaways.length ? null : 'reachable but 0 rows matched — check page structure' }
}

// Giveaway platforms are not sponsors; fall back to the sponsor's own domain
// when the title doesn't name a brand we know.
const PLATFORM_HOST = /gleam\.io|wn\.nr|swee\.ps|ggn\.fyi|sweepwidget\.com|rafflecopter\.com|kingsumo\.com|woobox\.com|share-w\.in|viral-loops\.com|secondstreetapp\.com/i
function sponsorFromHost(host) {
  if (!host || PLATFORM_HOST.test(host)) return null
  const core = host.replace(/\.(com|net|org|us|co|shop|store)$/i, '').split('.').pop()
  if (!core || core.length < 3) return null
  return core.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── SOURCES ───────────────────────────────────────────────────────────────────
// The five manufacturer/retailer promo pages that used to live here are gone:
// probed 2026-08-03, all five were dead (PSA 403 Cloudflare, Lucky Gunner 404,
// Springfield 404, GOA 404, Taurus 202/empty-JS-shell) regardless of user agent.
// They contributed nothing but a permanent error line on every run. The two
// aggregators below already syndicate those same manufacturer giveaways.
//
// `required: false` sources may fail without tripping the blackout alarm —
// gunmade.com is Cloudflare-protected and unreachable from datacenter IPs, so it
// is kept as best-effort only.
const SOURCES = [
  { name: 'wintheguns.com',   url: 'https://wintheguns.com/',                    required: true  },
  { name: 'gungiveaways.net', url: 'https://gungiveaways.net/',                  required: true  },
  { name: 'gunmade.com',      url: 'https://www.gunmade.com/gun-giveaways/',     required: false },
]


// ── CROSS-SOURCE DEDUP ────────────────────────────────────────────────────────
// URL dedup isn't enough: both aggregators list the SAME giveaway behind their
// own tracking short-link, so the Henry rifle promo arrives as
// swee.ps/VGcwyP_vwthNjT from one and swee.ps/eGCMJo_FNSvIWq from the other.
// Distinct URLs, one prize — without this the page shows everything twice.
//
// Two rows are the same giveaway only when three signals agree: identical end
// date, at least 2 shared significant title tokens, and those shared tokens
// covering 45%+ of the shorter title. Requiring 2+ shared tokens is what keeps
// "Glock 19 Giveaway" and "Glock 43 Giveaway" apart — they share only "glock".
const STOPWORDS = new Set([
  'win','wins','winner','winners','a','an','the','and','or','of','to','for','with','plus',
  'giveaway','giveaways','sweepstake','sweepstakes','contest','enter','entry','entries',
  'single','daily','free','prize','prizes','package','pack','bundle','more','new','your',
  'get','one','two','three','be','is','it','in','on','at','from','up','x','1','2','3',
])

function titleTokens(title) {
  return new Set(
    (title || '').toLowerCase()
      .replace(/[^a-z0-9\s]+/g, ' ')
      .split(/\s+/)
      .map(w => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
      .filter(w => w.length >= 2 && !STOPWORDS.has(w))
  )
}

// A shared generic word like "lever" or "rifle" is not evidence two listings are
// the same prize. When both titles name a manufacturer and those names differ,
// they are different giveaways full stop — this is what keeps "Win 1 of 6 Rossi
// Lever Rifles!" from being merged into "S&W Model 1854 Lever Action Rifle".
const BRAND_TOKENS = [
  'glock','sig','sauer','ruger','smith','wesson','s&w','springfield','taurus','beretta',
  'cz','walther','heckler','koch','kimber','colt','benelli','mossberg','remington',
  'winchester','browning','savage','tikka','weatherby','franchi','stoeger','marlin',
  'bergara','henry','rossi','canik','staccato','iwi','stribog','grand','power',
  'palmetto','psa','century','faxon','aero','bcm','noveske','lwrci','cmmg','solgw',
  'daniel','defense','wilson','christensen','pof','zev','shadow','systems','moriarti',
  'rock','river','rra','anderson','ballistic','advantage','geissele','timney','magpul',
  'eotech','vortex','trijicon','aimpoint','holosun','leupold','burris','bushnell',
  'nightforce','swampfox','primary','arms','streamlight','silencerco','dead','air',
  'brownells','midwayusa','ammo','luckygunner','grabagun','kawasaki','fn','kel','tec',
]
const BRAND_SET = new Set(BRAND_TOKENS)
function brandTokens(title) {
  const found = new Set()
  for (const w of (title || '').toLowerCase().replace(/[^a-z0-9&\s]+/g, ' ').split(/\s+/)) {
    if (BRAND_SET.has(w)) found.add(w)
  }
  return found
}

function brandsConflict(a, b) {
  const ba = brandTokens(a), bb = brandTokens(b)
  if (!ba.size || !bb.size) return false
  for (const t of ba) if (bb.has(t)) return false
  return true
}

function sameGiveaway(a, b) {
  if (!a.endDate || !b.endDate) return false
  // The two aggregators routinely disagree by a day on the same promo (timezone
  // / inclusive-end differences), so exact equality is too strict a gate.
  if (Math.abs(Date.parse(a.endDate) - Date.parse(b.endDate)) > 86400000) return false
  if (brandsConflict(a.title, b.title)) return false

  // Identical end date AND an identical prize value to the dollar is a strong
  // enough fingerprint on its own — it catches the same prize pack listed under
  // two completely different headlines.
  if (a.endDate === b.endDate && a.prizeValue > 0 && a.prizeValue === b.prizeValue) return true
  const ta = titleTokens(a.title)
  const tb = titleTokens(b.title)
  if (ta.size < 2 || tb.size < 2) return false
  let shared = 0
  for (const t of ta) if (tb.has(t)) shared++
  if (shared < 2) return false
  return shared / Math.min(ta.size, tb.size) >= 0.45
}

// Keep the more informative row: the longer, more product-specific title wins,
// and the higher of the two stated prize values is carried over.
export function dedupSimilar(list) {
  const kept = []
  for (const g of list) {
    const dupeIdx = kept.findIndex(k => sameGiveaway(k, g))
    if (dupeIdx === -1) { kept.push(g); continue }
    const existing = kept[dupeIdx]
    const better = g.title.length > existing.title.length ? { ...g } : { ...existing }
    better.prizeValue = Math.max(existing.prizeValue || 0, g.prizeValue || 0)
    better.featured   = better.prizeValue >= 1500
    kept[dupeIdx] = better
  }
  return kept
}

export async function scrapeAllSources() {
  const settled = await Promise.allSettled(SOURCES.map(src => scrapeAggregator(src)))
  return settled.map((r, i) => (
    r.status === 'fulfilled'
      ? r.value
      : { name: SOURCES[i].name, giveaways: [], via: 'error', status: 0,
          reason: r.reason?.message || 'threw' }
  ))
}

export { SOURCES, normalizeUrl, dedup, scrapeAggregator, extractLinks, readRowMeta, fetchPage, detectCategory, parseEndDate, parseValue }
