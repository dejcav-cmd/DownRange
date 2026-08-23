import Parser from 'rss-parser'
import crypto from 'crypto'
import { rewriteWithClaude, isSanityDuplicate, resetDedup, publishToSanity, notifyBreaking, notifyError, sleep, fetchAndUploadOgImage, searchForImage } from '../utils.js'
import { decodeHtmlEntities, stripCdata } from '../../lib/decodeEntities.js'

// Module-level gate counter — reset by runNewsFeed at the start of each run
let _gateLog = { noTitle:0, hashDup:0, canada:0, brazil:0, gate3:0, gate4:0, sanityDup:0, passedDedup:0, published:0, threw:0, lastError:null }
// Per-run URL dedup — reset each run, avoids cross-invocation collisions from module-level seenHashes
let _runSeenUrls = new Set()

// ── CONFIG ─────────────────────────────────────────────────────────────────────
const CONCURRENCY    = 5    // up from 3 — more parallel to fit within Vercel 300s limit
const ITEMS_PER_FEED = 8    // back to 8 — 12 was too many when combined with image fetching
const MAX_ITEMS      = 40   // 40 cap — image fetch per item can take 26s; 40/5=8 batches×26s=208s fits 300s
const DEADLINE_MS    = 250 * 1000  // stop processing at 250s, leave time for reportCronRun
const RSS_TIMEOUT_MS = 8000 // per-feed fetch timeout

// ── RSS PARSER ─────────────────────────────────────────────────────────────────
const parser = new Parser({
  timeout: RSS_TIMEOUT_MS,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0; +https://downrangeco.com/about)',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content',   'mediaContent',   { keepArray: false }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure',       'enclosure',      { keepArray: false }],
      ['content:encoded', 'contentEncoded', { keepArray: false }],
    ]
  }
})

const RSS_FEEDS = [
  // ── US FIREARMS NEWS ──────────────────────────────────────────────────
  { name: 'The Firearm Blog',       url: 'https://www.thefirearmblog.com/blog/feed/',          cat: 'industry' },
  { name: 'TTAG',                   url: 'https://www.thetruthaboutguns.com/feed/',             cat: 'news'     },
  { name: 'Guns.com News',          url: 'https://www.guns.com/feed',                           cat: 'industry' },
  { name: 'Guns & Ammo',            url: 'https://www.gunsandammo.com/feed/',                   cat: 'industry' },
  { name: 'Shooting Wire',          url: 'https://www.shootingwire.com/feed',                   cat: 'industry' },
  { name: 'Firearms News',          url: 'https://www.firearmsnews.com/feed/',                  cat: 'industry' },
  { name: 'Concealed Nation',       url: 'https://concealednation.org/feed/',                   cat: 'news'     },
  { name: 'Outdoor Life Guns',      url: 'https://www.outdoorlife.com/category/guns/feed/',     cat: 'industry' },
  { name: 'Field & Stream Guns',    url: 'https://www.fieldandstream.com/category/guns/feed/',  cat: 'industry' },
  { name: 'Tactical Life',          url: 'https://www.tactical-life.com/feed/',                 cat: 'industry' },
  { name: 'Personal Defense World', url: 'https://www.personaldefenseworld.com/feed/',          cat: 'news'     },
  { name: 'Combat Handguns',        url: 'https://www.combathandguns.com/feed/',                cat: 'industry' },
  { name: 'Handguns Magazine',      url: 'https://www.handgunsmag.com/feed/',                   cat: 'industry' },
  { name: 'Rifle Shooter',          url: 'https://www.rifleshootermag.com/feed/',               cat: 'industry' },
  { name: 'American Rifleman',      url: 'https://www.americanrifleman.org/feed/',              cat: 'industry' },
  { name: 'American Hunter',        url: 'https://www.americanhunter.org/feed/',                cat: 'industry' },
  { name: 'Shooting Illustrated',   url: 'https://www.shootingillustrated.com/feed/',           cat: 'industry' },
  { name: 'GunsAmerica Digest',     url: 'https://www.gunsamerica.com/blog/feed/',              cat: 'industry' },
  // ── US LEGAL & RIGHTS ─────────────────────────────────────────────────
  { name: 'NRA-ILA',                url: 'https://www.nraila.org/XML/RSS.aspx',                cat: 'law'      },
  { name: 'SAF',                    url: 'https://www.saf.org/feed/',                           cat: 'law'      },
  { name: 'FPC',                    url: 'https://www.firearmspolicy.org/feed/',                cat: 'law'      },
  { name: 'FPC Law',                url: 'https://fpclaw.org/feed/',                            cat: 'law'      },
  { name: 'CleanUpATF',             url: 'https://www.cleanupatf.org/feed/',                    cat: 'law'      },
  { name: 'Duke Firearms Law',      url: 'https://firearmslaw.duke.edu/feed/',                  cat: 'law'      },
  { name: 'Bearing Arms',           url: 'https://bearingarms.com/feed/',                       cat: 'law'      },
  { name: 'Guns & Patriots',        url: 'https://www.newsmax.com/rss/Guns-And-Patriots/1/',    cat: 'law'      },
  // ── US GOVERNMENT ─────────────────────────────────────────────────────
  { name: 'ATF News',               url: 'https://www.atf.gov/rss/news_whats-new.xml',          cat: 'law'      },
  { name: 'Congress.gov 2A',        url: 'https://www.congress.gov/rss/most-viewed-bills.xml',  cat: 'law'      },
  // ── US GUN RIGHTS ORGS ────────────────────────────────────────────────
  { name: 'GOA',                    url: 'https://www.gunowners.org/feed/',                     cat: 'law'      },
  { name: 'GOA Press',              url: 'https://www.gunowners.org/category/press/feed/',      cat: 'law'      },
  // ── NEW US SOURCES ────────────────────────────────────────────────────
  { name: 'Gun News Daily',         url: 'https://gunnewsdaily.com/feed/',                      cat: 'news'     },
  // AmmoLand removed per DJ request
  { name: 'Gun Digest',             url: 'https://gundigest.com/feed/',                         cat: 'industry' },
  { name: 'Recoil Magazine',        url: 'https://www.recoilweb.com/feed/',                     cat: 'industry' },
  { name: 'Guns.com',               url: 'https://www.guns.com/feed',                           cat: 'industry' },
  { name: 'Daily Caller Guns',      url: 'https://dailycaller.com/section/guns/feed/',          cat: 'news'     },
  { name: 'Washington Free Beacon Guns', url: 'https://freebeacon.com/tag/guns/feed/',          cat: 'news'     },
  { name: 'National Review Guns',   url: 'https://www.nationalreview.com/tag/guns/feed/',       cat: 'news'     },
  { name: 'Townhall Guns',          url: 'https://townhall.com/tag/guns/feed/',                 cat: 'news'     },
  { name: 'Breitbart 2A',           url: 'https://www.breitbart.com/tag/second-amendment/feed/', cat: 'law'    },
  { name: 'NSSF Blog',              url: 'https://www.nssf.org/articles/feed/',                 cat: 'industry' },
  { name: 'USCCA Blog',             url: 'https://www.usconcealedcarry.com/blog/feed/',         cat: 'industry' },
  { name: 'Pew Pew Tactical',       url: 'https://www.pewpewtactical.com/feed/',                cat: 'industry' },
  { name: 'Lucky Gunner',           url: 'https://www.luckygunner.com/lounge/feed/',            cat: 'industry' },
  // Deals feeds removed — handled by dedicated /api/cron/gun-deals cron (runs every 30min).
  // ── CANADA ONLY — routed to canadaContent, never newsArticle ──────────
  // Note: TheGunBlog.ca weekly digest round-ups ('Week of YYYY') are blocked in GATE 1
  { name: 'TheGunBlog.ca',          url: 'https://www.thegunblog.ca/feed/',                     cat: 'law',      region: 'canada' },
  { name: 'NFA Canada',             url: 'https://www.nfa.ca/feed/',                            cat: 'law',      region: 'canada' },
  { name: 'CSSA',                   url: 'https://www.cdnshootingsports.org/feed/',              cat: 'law',      region: 'canada' },
  { name: 'Calibre Magazine',       url: 'https://calibremag.ca/feed/',                         cat: 'industry', region: 'canada' },
  { name: 'CCFR',                   url: 'https://www.firearmrights.ca/feed/',                  cat: 'law',      region: 'canada' },
  { name: 'Wolverine Supplies Blog',url: 'https://www.wolverinesupplies.com/blog/feed/',        cat: 'industry', region: 'canada' },
  { name: 'Justice for Gun Owners', url: 'https://justiceforgunowners.ca/feed/',                cat: 'law',      region: 'canada' },
  { name: 'Calibre Magazine News',  url: 'https://calibremag.ca/category/news/feed/',           cat: 'news',     region: 'canada' },
  { name: 'Calibre Politics',       url: 'https://calibremag.ca/category/politics/feed/',       cat: 'law',      region: 'canada' },
  // ── BRAZIL ONLY — routed to brazilContent, never newsArticle ──────────
  { name: 'Firearmsbrasil.com.br',  url: 'https://firearmsbrasil.com.br/feed/',                cat: 'industry', region: 'brazil' },
  { name: 'CBC Armas',              url: 'https://riobravoarmas.com.br/blog/feed/',             cat: 'industry', region: 'brazil' },
  { name: 'Legalmente Armado',      url: 'https://legalmentearmado.com.br/feed/',               cat: 'law',      region: 'brazil' },
  { name: 'CACs e Armas',           url: 'https://www.cacearmas.com.br/feed/',                  cat: 'industry', region: 'brazil' },
]

// ── IMAGE EXTRACTION ──────────────────────────────────────────────────────────

function extractRSSImage(item) {
  if (item.mediaContent) {
    const mc  = item.mediaContent
    const url = mc.$ ? mc.$.url : (typeof mc === 'string' ? mc : null)
    if (url && isImageUrl(url)) return url
  }
  if (item.mediaThumbnail) {
    const mt  = item.mediaThumbnail
    const url = mt.$ ? mt.$.url : (typeof mt === 'string' ? mt : null)
    if (url && isImageUrl(url)) return url
  }
  if (item.enclosure?.url && isImageUrl(item.enclosure.url)) return item.enclosure.url
  const html = item.contentEncoded || item.content || item['content:encoded'] || ''
  if (html) {
    // Try img src first (most reliable)
    const imgMatch = html.match(/<img[^>]+src=["']([^"']*(?:cdn|media|upload|img|image)[^"']*)["']/i)
    if (imgMatch?.[1] && isImageUrl(imgMatch[1])) return imgMatch[1]
    // Fallback to any img src
    const anyImg = html.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (anyImg?.[1] && isImageUrl(anyImg[1])) return anyImg[1]
  }
  return null
}

function isImageUrl(url) {
  if (!url || typeof url !== 'string' || url.length > 2000) return false
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) ||
         /images\.|img\.|cdn\.|media\./i.test(url) ||
         /wp-content\/uploads/i.test(url) ||
         /townhall\.com\/cdn|hodl\/|cloudfront\.net|imgix\.net/i.test(url)
}

function cleanImageUrl(url) {
  if (!url || typeof url !== 'string') return null
  url = url.trim()
  if (!url.startsWith('http') || url.length > 2000) return null
  if (/1x1|pixel|spacer|blank|transparent/i.test(url)) return null
  return url
}

// ── FETCH FUNCTIONS ───────────────────────────────────────────────────────────

async function fetchNewsAPI() {
  if (!process.env.NEWSAPI_KEY) return []
  try {
    // top-headlines with country=us guarantees US sources only
    const _newsParams = new URLSearchParams({
      q: 'firearms OR "Second Amendment" OR ATF OR "gun rights" OR "gun law" OR NRA OR suppressor OR "concealed carry"',
      language: 'en',
      country:  'us',
      pageSize: '20',
      apiKey:   process.env.NEWSAPI_KEY,
    })
    const _newsR = await fetch('https://newsapi.org/v2/top-headlines?' + _newsParams, { signal: AbortSignal.timeout(10000) })
    if (!_newsR.ok) throw new Error(_newsR.statusText)
    const res = { data: await _newsR.json() }
    return (res.data.articles || [])
      .filter(a => a.title && a.url && !a.title.includes('[Removed]'))
      .map(a => ({
        title: decodeHtmlEntities(a.title), description: a.description, url: a.url,
        source: a.source?.name, publishedAt: a.publishedAt,
        imageUrl: null, imageAlt: a.title,
        feedCat: 'news', region: 'us',
      }))
  } catch (err) {
    console.error('[NEWS] NewsAPI error:', err.message)
    return []
  }
}

// GNews disabled — no reliable US-only filter; pulls global sources
async function fetchGNews() { return [] }

async function fetchOneFeed(feed) {
  try {
    const result = await parser.parseURL(feed.url)
    const items = result.items.slice(0, ITEMS_PER_FEED).map(i => ({
      title:       stripCdata(decodeHtmlEntities(i.title)),
      description: stripCdata(i.contentSnippet || i.summary || i.content?.slice(0, 400)),
      url:         i.link,
      source:      feed.name,
      feedCat:     feed.cat,
      region:      feed.region || 'us',  // 'canada', 'brazil', or 'us' (default)
      publishedAt: i.pubDate || i.isoDate,
      imageUrl:    cleanImageUrl(extractRSSImage(i)),
      imageAlt:    i.title,
    }))
    console.log('[NEWS] RSS ' + feed.name + ': ' + items.length + ' items')
    return items
  } catch (err) {
    console.error('[NEWS] Feed error (' + feed.name + '): ' + err.message)
    return []
  }
}

// Fetch ALL RSS feeds in parallel (no sleep between them)
async function fetchRSS() {
  const results = await Promise.all(RSS_FEEDS.map(f => fetchOneFeed(f)))
  return results.flat()
}

// ── PROCESS + PUBLISH ─────────────────────────────────────────────────────────

// ── REGION GATE ───────────────────────────────────────────────────────────────
// Allowlist approach: only US firearms sources pass to newsArticle.
// Canada RSS feeds route to canadaContent. Everything else is dropped.
// This is the primary enforcement — RSS_FEEDS is pre-filtered, but
// NewsAPI can still return edge cases so we double-check here.

const ALLOWED_US_DOMAINS = new Set([
  'thefirearmblog.com','thetruthaboutguns.com','guns.com','gunsandammo.com',
  'shootingwire.com','firearmsnews.com','concealednation.org','outdoorlife.com',
  'fieldandstream.com','tactical-life.com','personaldefenseworld.com',
  'combathandguns.com','handgunsmag.com','rifleshootermag.com',
  'americanrifleman.org','americanhunter.org','shootingillustrated.com',
  'gunsamerica.com','nraila.org','saf.org','firearmspolicy.org','fpclaw.org',
  'cleanupatf.org','firearmslaw.duke.edu','bearingarms.com','newsmax.com',
  'atf.gov','congress.gov','gunowners.org','pewpewtactical.com',
  'outdoorhub.com','thearmorylife.com','gunnewsdaily.com',
  'gundigest.com','recoilweb.com',
  'dailycaller.com','freebeacon.com','nationalreview.com',
  'townhall.com','breitbart.com','nssf.org',
  'usconcealedcarry.com','luckygunner.com',
  'reddit.com','brownells.com','sportsmanswarehouse.com',
  'slickguns.com','wikiarms.com','palmettostatearmory.com','primaryarms.com','grabaggun.com',
])

function isAllowedUSUrl(url) {
  if (!url) return false
  try {
    const host = new URL(url).hostname.replace('www.', '')
    // Exact match or subdomain of allowed domain
    return [...ALLOWED_US_DOMAINS].some(d => host === d || host.endsWith('.' + d))
  } catch { return false }
}

// ── TOPIC RELEVANCE FILTER ────────────────────────────────────────────────────
// Hard keyword gate — must match at least one firearms/2A term in title+description.
// Runs BEFORE AI to avoid paying tokens on off-topic articles.
// This is the primary defense against bleed from political feeds (Breitbart, Daily Caller, etc.)
// that tag 2A articles but also publish general news.

const FIREARMS_KEYWORDS = [
  // Core terms
  'gun','guns','firearm','firearms','pistol','pistols','rifle','rifles',
  'shotgun','shotguns','revolver','handgun','handguns','ammo','ammunition',
  'caliber','calibre','cartridge','bullet','bullets','suppressor','silencer','muzzle device','red dot',
  'holster','magazine','clip','trigger','barrel','receiver','frame','slide',
  // 2A / legal
  'second amendment','2nd amendment','2a','gun rights','gun control','gun law',
  'gun bill','gun ban','assault weapon','nra','nra-ila','saf','fpc','goa',
  'gun owners','concealed carry','ccw','shall-issue','may-issue','constitutional carry',
  'red flag','atf','batfe','background check','background checks','nics','ffl','4473',
  'bruen','heller','mcdonald','chevron doctrine','ghost gun','80%',
  'bear arms','keep and bear','carry permit','carry law','carry rights',
  'pal','rpal','c-21','c-71','bill c-21','bill c-71','ccfr','nfa canada','cac','tiro esportivo','arma de fogo',
  'porte de arma','clube de tiro','policia federal','exercito','exército','fuzil','espingarda','revolver',
  'campus carry','permitless carry','carry license','gun permit','pistol permit',
  'firearm permit','reloading','blade','knife','knives',
  // Products / brands
  'glock','sig sauer','smith & wesson','smith and wesson','ruger','colt',
  'springfield','beretta','fn','hk','walther','taurus','mossberg','remington',
  'winchester','hornady','federal premium','speer','nosler','ar-15','ar15',
  'ak-47','ak47','1911','2011','fusion firearms','9mm','45 acp','.357','.44 mag','.308','5.56',
  // Activities
  'shooting','range','hunt','hunting','hunter','bow hunting','archery',
  'self-defense','self defense','home defense','concealed','open carry',
  // Dealers / industry
  'gun store','gun shop','gun dealer','gun sale','gun show','gunsmith',
]

// Build a single regex for fast matching
const FIREARMS_REGEX = new RegExp(
  '\\b(' + FIREARMS_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'i'
)

function isFirearmsRelevant(item) {
  const text = ((item.title || '') + ' ' + (item.description || '')).slice(0, 600)
  return FIREARMS_REGEX.test(text)
}

async function processNewsItem(item) {
  if (!item.title || !item.url) { _gateLog && _gateLog.noTitle++; return null }
  if (_runSeenUrls.has(item.url)) { _gateLog && _gateLog.hashDup++; return }
  _runSeenUrls.add(item.url)

  const region = item.region || 'us'

  // ── GATE 1: Canada items route to canadaContent, not newsArticle ──────────
  if (region === 'canada') {
    // Block weekly digest round-ups (TheGunBlog "Canada Gun Rights News: Week of...")
    // These are link-aggregator posts, not individual news articles
    if (/week\s+of\s+\d{4}/i.test(item.title || '') ||
        /gun.rights.news.*week/i.test(item.title || '')) {
      console.log(`[NEWS] 🇨🇦 BLOCKED digest: "${item.title?.slice(0,60)}"`)
      return
    }
    if (await isSanityDuplicate(item.url, item.title)) return

    // ── GATE 1b: Topic relevance — block non-firearms Canada articles ─────
    // Catches off-topic bleed from Calibre/Wolverine general content
    if (!isFirearmsRelevant(item)) {
      console.log(`[NEWS] 🇨🇦 BLOCKED off-topic: "${(item.title||'').slice(0,60)}"`)
      return
    }

    const hash = crypto.createHash('md5').update(item.url).digest('hex')

    // ── SLUG: derive from URL path, not title ─────────────────────────────
    // Titles like "Canada Gun Rights News: Week of 2026 June 08" produce
    // garbage slugs. Use the URL path segment which reflects the real topic.
    // DJ's requirement: slug should reflect article name, prefixed with "canada-"
    function canadaSlugFromUrl(url, title) {
      try {
        const path = new URL(url).pathname
        // Take last non-empty path segment and clean it
        const segments = path.split('/').filter(Boolean)
        const last = segments[segments.length - 1] || ''
        // Strip common date prefixes like "2026-06-08-" from URL slugs
        const cleaned = last.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.html?$/, '')
        if (cleaned.length > 8) {
          // Prefix with "canada-" as DJ requested, avoid double-prefixing
          const base = cleaned.startsWith('canada-') ? cleaned : 'canada-' + cleaned
          return base.slice(0, 96)
        }
      } catch {}
      // Fallback: derive from title, strip "week of YYYY Month DD" digest patterns
      const stripped = title
        .replace(/:\s*week\s+of\s+\d{4}\s+\w+\s+\d+/i, '')
        .replace(/\s*[-–]\s*\w+\s*$/,'')   // strip trailing " - Source"
        .trim()
      const base = stripped.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/, '').slice(0, 80)
      return base.startsWith('canada-') ? base : 'canada-' + base
    }
    const slug = canadaSlugFromUrl(item.url, item.title)

    // ── IMAGE: fetch real OG image if RSS didn't include one ─────────────
    let imageUrl = item.imageUrl || null
    if (!imageUrl && item.url) {
      try {
        const cdnUrl = await Promise.race([
          fetchAndUploadOgImage(item.url, 'ca-' + hash),
          new Promise(resolve => setTimeout(() => resolve(null), 6000)),
        ])
        if (cdnUrl) {
          imageUrl = cdnUrl
          console.log(`[NEWS] 🇨🇦📷 Got image for "${item.title.slice(0,40)}"`)
        }
      } catch { /* non-critical */ }
    }

    // ── AI REWRITE: give every Canada article a proper body+title on ingest ─
    // Raw RSS bodies are 50-200 word excerpts with no h2 structure.
    // They render as broken pages. Rewrite immediately so articles are
    // always publication-ready when they hit Sanity.
    let finalTitle = item.title
    let finalBody  = item.description || null
    let finalSummary = item.description?.slice(0, 300) || item.title
    let hasAI = false

    // ALWAYS AI-rewrite Canada articles — raw RSS descriptions are 50-200 word excerpts
    // that render as broken pages. Never save a Canada article without a full body.
    const srcText = (item.description || item.content || '').trim()
    try {
      const ai = await rewriteWithClaude({
        ...item,
        // Provide full context even if description is short — AI will research and expand
        description: srcText + `\n\nSource: ${item.source} (Canada firearms news)\nTitle: ${item.title}`,
      })
      if (ai?.body && ai.body.length > 300) {
        finalBody    = ai.body
        finalTitle   = ai.title   || item.title
        finalSummary = ai.summary || finalSummary
        hasAI        = true
        console.log(`[NEWS] 🇨🇦🤖 AI body written: "${finalTitle.slice(0,60)}" (${ai.body.length} chars)`)
      } else {
        // AI returned empty — skip this article entirely rather than save a stub
        console.log(`[NEWS] 🇨🇦 Skipping (AI body empty): "${item.title.slice(0,60)}"`)
        return null
      }
    } catch (e) {
      // AI failed — skip rather than save a bodyless article
      console.log(`[NEWS] 🇨🇦 Skipping (AI error: ${e.message.slice(0,40)}): "${item.title.slice(0,50)}"`)
      return null
    }

    await publishToSanity({
      _id:           'ca-' + hash,
      _type:         'canadaContent',
      title:         finalTitle,
      slug:          { _type: 'slug', current: slug },
      excerpt:       finalSummary,
      body:          finalBody,
      type:          'article',
      source:        item.source,
      sourceUrl:     item.url,
      imageUrl,
      publishedAt:   item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
      autoGenerated: true,
      qualityReviewed: hasAI,   // mark reviewed if AI already rewrote it
      active:        true,
    })
    console.log(`[NEWS] 🇨🇦 Canada → canadaContent: "${finalTitle.slice(0,60)}" [${slug}]${hasAI ? ' +AI' : ' +raw'}`)
    return { id: 'ca-' + hash, title: finalTitle, category: 'canada', hasAI }
  }

  // ── GATE 2: Brazil items → brazilContent ─────────────────────────────────
  if (region === 'brazil') {
    if (await isSanityDuplicate(item.url, item.title)) return

    // ── GATE 2b: Topic relevance — block non-firearms Brazil articles ─────
    if (!isFirearmsRelevant(item)) {
      console.log(`[NEWS] 🇧🇷 BLOCKED off-topic: "${(item.title||'').slice(0,60)}"`)
      return
    }

    const hash = crypto.createHash('md5').update(item.url).digest('hex')

    // Slug: derive from URL path, prefixed with "brasil-"
    function brazilSlugFromUrl(url, title) {
      try {
        const path = new URL(url).pathname
        const segments = path.split('/').filter(Boolean)
        const last = segments[segments.length - 1] || ''
        const cleaned = last.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.html?$/, '')
        if (cleaned.length > 8) {
          const base = cleaned.startsWith('brasil-') ? cleaned : 'brasil-' + cleaned
          return base.slice(0, 96)
        }
      } catch {}
      const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/, '').slice(0, 80)
      return base.startsWith('brasil-') ? base : 'brasil-' + base
    }
    const slug = brazilSlugFromUrl(item.url, item.title)

    // OG image fetch
    let imageUrl = item.imageUrl || null
    if (!imageUrl && item.url) {
      try {
        const cdnUrl = await Promise.race([
          fetchAndUploadOgImage(item.url, 'br-' + hash),
          new Promise(resolve => setTimeout(() => resolve(null), 6000)),
        ])
        if (cdnUrl) { imageUrl = cdnUrl }
      } catch { /* non-critical */ }
    }

    // ALWAYS AI-rewrite Brazil articles — may be in Portuguese, never save raw stub
    let finalTitle = item.title
    let finalBody  = null
    let finalSummary = item.description?.slice(0, 300) || item.title
    let hasAI = false
    try {
      const ai = await rewriteWithClaude({
        ...item,
        description: (item.description || item.content || '') + `\n\nFonte: ${item.source} (Brasil)`,
      }, { lang: 'pt-BR' })
      if (ai?.body && ai.body.length > 300) {
        finalBody    = ai.body
        finalTitle   = ai.title   || item.title
        finalSummary = ai.summary || finalSummary
        hasAI        = true
        console.log(`[NEWS] 🇧🇷🤖 AI body written: "${finalTitle.slice(0,60)}"`)
      } else {
        console.log(`[NEWS] 🇧🇷 Skipping (AI body empty): "${item.title.slice(0,60)}"`)
        return null
      }
    } catch (e) {
      console.log(`[NEWS] 🇧🇷 Skipping (AI error): "${item.title.slice(0,50)}"`)
      return null
    }

    await publishToSanity({
      _id:           'br-' + hash,
      _type:         'brazilContent',
      title:         finalTitle,
      slug:          { _type: 'slug', current: slug },
      excerpt:       finalSummary,
      body:          finalBody,
      type:          'artigo',
      source:        item.source,
      sourceUrl:     item.url,
      imageUrl,
      publishedAt:   item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
      autoGenerated: true,
      qualityReviewed: hasAI,
      active:        true,
    })
    console.log(`[NEWS] 🇧🇷 Brazil → brazilContent: "${finalTitle.slice(0,60)}" [${slug}]${hasAI ? ' +AI' : ' +raw'}`)
    return { id: 'br-' + hash, title: finalTitle, category: 'brazil', hasAI }
  }

  // ── GATE 2.5: Block deals-roundup posts from news sources ────────────────
  // TFB (and others) publish "Weekly Web Deals" aggregator posts through their
  // main RSS feeds (cat:'industry'), NOT cat:'deals'. These pass all domain and
  // keyword gates but are not news. Block by title pattern so they never reach
  // newsArticle. The dedicated gun-deals cron handles all deal sourcing.
  if (/weekly.{0,20}deals|web deals|deals.{0,20}roundup|deals.{0,15}for\s+\w+\s+\d/i.test(item.title || '')) {
    console.log('[NEWS] BLOCKED deals-roundup:', item.source, '"' + (item.title || '').slice(0, 70) + '"')
    return
  }

  // ── GATE 3: US only — must be from an allowed US firearms domain ──────────
  // For RSS feeds (all pre-vetted in RSS_FEEDS), always allow.
  // For NewsAPI items, enforce domain allowlist.
  const isFromNewsAPI = !item.feedCat || item.feedCat === 'news'
  const fromKnownRSS  = RSS_FEEDS.some(f => !f.region && item.source === f.name)

  // Deals feeds always pass — pre-vetted sources, domain allowlist may not cover them
  if (item.feedCat !== 'deals' && !fromKnownRSS && !isAllowedUSUrl(item.url)) {
    _gateLog && _gateLog.gate3++
    console.log('[NEWS] BLOCKED non-US/unknown source:', item.source, item.url?.slice(0,60))
    return
  }

  // ── GATE 4: Topic relevance — must contain firearms/2A keywords ──────────
  // Catches off-topic bleed from political/general feeds (Breitbart, Daily Caller,
  // Townhall, National Review, etc.) that tag 2A articles but also publish
  // general news. Deals feeds skip this check (product titles often lack keywords).
  if (item.feedCat !== 'deals' && !isFirearmsRelevant(item)) {
    _gateLog && _gateLog.gate4++
    console.log('[NEWS] BLOCKED off-topic:', item.source, '"' + (item.title || '').slice(0, 60) + '"')
    return
  }

  // Cross-cycle Sanity dedup
  if (await isSanityDuplicate(item.url, item.title)) {
    _gateLog && _gateLog.sanityDup++
    console.log('[NEWS] Sanity-dup skip:', (item.title||'').slice(0,60))
    return
  }
  _gateLog && (_gateLog.passedDedup = (_gateLog.passedDedup||0) + 1)

  const hash = crypto.createHash('md5').update(item.url).digest('hex')
  // Always generate a real slug from the title — never leave it empty
  const rawSlug = (item.title || item.sourceTitle || 'article')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  // Append short hash suffix to guarantee uniqueness even with duplicate titles
  const slugSuffix = hash.slice(0, 6)
  const slug = rawSlug ? `${rawSlug}-${slugSuffix}` : `article-${slugSuffix}`

  // AI rewrite — try Anthropic first, GLM fallback, then null (backfill retries)
  // ── ENRICHMENT GATE ────────────────────────────────────────────────────────
  // Only call the AI rewriter for articles that are worth enriching:
  //   - Legal/breaking categories always enrich (high reader value)
  //   - Deals never enrich (title + price is enough)
  //   - Low-urgency general news skips AI — raw RSS summary is sufficient
  // This cuts ~35% of enrichment calls by skipping filler industry news.
  const HIGH_VALUE_CATS = new Set(['law', 'breaking', 'atf', 'scotus'])
  const skipEnrichment = item.feedCat === 'deals' ||
    (!HIGH_VALUE_CATS.has(item.feedCat) && !isFirearmsRelevant({ title: item.title, description: '' }))

  let ai = null
  if (!skipEnrichment && (process.env.ANTHROPIC_API_KEY || process.env.GLM_API_KEY)) {
    try {
      ai = await rewriteWithClaude(item)
      // If primary rewrite failed and GLM is available, rewriteWithClaude handles fallback internally
      if (!ai || !ai.body) {
        console.warn(`[NEWS] Rewrite returned no body for "${(item.title||'').slice(0,50)}" — will be picked up by backfill`)
      }
    } catch (err) {
      console.warn(`[NEWS] Rewrite threw for "${(item.title||'').slice(0,50)}": ${err.message} — backfill will retry`)
    }
  } else if (skipEnrichment) {
    console.log(`[NEWS] Enrichment skipped (low-value cat: ${item.feedCat}): "${(item.title||'').slice(0,50)}"`)
  } else {
    console.warn('[NEWS] No AI key set — articles will publish without body (backfill required)')
  }

  // Category resolution — strict deal gate:
  // ONLY cat:'deals' feeds route to gunDeal. Never use title price signals —
  // news articles regularly mention prices (product launches, fines, awards).
  // The dedicated /api/cron/gun-deals cron handles all deal sourcing.
  const feedIsDeal = item.feedCat === 'deals'
  const isDeal     = feedIsDeal

  // DEALS GO TO gunDeal, NOT newsArticle
  // This prevents image-fix crons from looping on them, deals page from polluting news, etc.
  if (isDeal) {
    // Never store Reddit URLs as deals — no images, no stable content
    if ((item.url || '').includes('reddit.com')) {
      console.log(`[NEWS] Skipping Reddit deal: ${item.title?.slice(0, 60)}`)
      return null
    }
    const price = (item.title || '').match(/\$[\d,]+(?:\.\d{2})?/)?.[0] || ''
    const dealDoc = {
      _id:         'gd-' + hash,
      _type:       'gunDeal',
      title:       ai?.title || item.title,
      summary:     ai?.summary || item.description?.slice(0, 300) || '',
      externalUrl: item.url,
      source:      item.source || 'reddit',
      category:    'deal',
      approved:    true,
      publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
      imageUrl:    null,   // gun-deals cron or backfill will fill this in
      price,
      tags:        ['deals', item.source?.toLowerCase().replace(/\s+/g,'-') || 'reddit'],
    }
    await publishToSanity(dealDoc)
    console.log(`[NEWS] Deal -> gunDeal: "${item.title.slice(0,60)}"`)
    return { id: dealDoc._id, title: item.title, category: 'deals', hasAI: false }
  }

  const category = ai?.category === 'deals' ? 'news' : (ai?.category || item.feedCat || 'news')

  const doc = {
    _id:           'news-' + hash,
    _type:         'newsArticle',
    title:         ai?.title || item.title,
    sourceTitle:   item.title,
    slug:          { _type: 'slug', current: slug },
    excerpt:       ai?.summary || item.description?.slice(0, 300) || item.title,
    summary:       ai?.summary || item.description?.slice(0, 300) || item.title,
    body:          (ai?.body && ai.body.length > 50) ? ai.body : null,
    category,
    urgencyScore:  ai?.urgencyScore || (item.feedCat === 'law' ? 5 : 3),
    tags:          ai?.tags         || [],
    relatedStates: ai?.relatedStates || [],
    source:        item.source,
    externalUrl:   item.url,
    imageUrl:      item._cdnImageUrl || null,  // never write SVG/placeholder paths
    imageAlt:      item.imageAlt || item.title,
    publishedAt:   item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
    autoGenerated: true,
    approved:      true,
    dedupHash:     hash,
  }

  // Image waterfall:
  // 1. OG image from source article (most specific — actual article photo)
  // 2. Pexels/Pixabay search using exact gun model/brand from title
  // Never fall back to SVG silhouettes or generic /img/photos/ placeholders
  if (!doc.imageUrl && item.url) {
    try {
      const cdnUrl = await Promise.race([
        fetchAndUploadOgImage(item.url, doc._id),
        new Promise(resolve => setTimeout(() => resolve(null), 8000)),
      ])
      if (cdnUrl) { doc.imageUrl = cdnUrl; console.log(`[NEWS] 📷 OG image: "${item.title.slice(0,40)}"`) }
    } catch { /* non-critical */ }
  }
  if (!doc.imageUrl) {
    try {
      const searchUrl = await Promise.race([
        searchForImage(item.title, category),
        new Promise(resolve => setTimeout(() => resolve(null), 8000)),
      ])
      if (searchUrl) { doc.imageUrl = searchUrl; console.log(`[NEWS] 🔍 Search image: "${item.title.slice(0,40)}"`) }
    } catch { /* non-critical */ }
  }

  _gateLog.published++
  try {
    await publishToSanity(doc)
    console.log(`[NEWS] ✓ "${item.title.slice(0, 60)}" [${category}]${ai ? ' +AI' : ' +raw'}`)
  } catch(publishErr) {
    _gateLog.threw++
    _gateLog.lastError = publishErr.message
    console.error(`[NEWS] ✗ publishToSanity FAILED for "${item.title.slice(0,50)}": ${publishErr.message}`)
    return null
  }

  // Breaking alert
  if (category !== 'deals' && (ai?.isBreaking || (ai?.urgencyScore || 0) >= 8)) {
    await publishToSanity({
      _id: 'alert-' + hash, _type: 'breakingAlert',
      headline: item.title, summary: ai?.summary || item.description?.slice(0, 200),
      url: item.url, source: item.source, urgencyScore: ai?.urgencyScore || 8,
      active: true, publishedAt: doc.publishedAt,
    })
    // Discord breaking-alert notifications disabled 2026-08-23 (DJ request) —
    // was re-notifying the same headline on every 2h cron run instead of once,
    // flooding #breaking-alerts. The on-site breakingAlert doc above is
    // unaffected. Re-enable by uncommenting below (and fixing the underlying
    // re-notify-on-every-run issue first, or it'll just flood again).
    // if (process.env.DISCORD_BREAKING_WEBHOOK) {
    //   await notifyBreaking({ title: item.title, url: item.url, urgencyScore: ai?.urgencyScore })
    // }
  }

  return { id: doc._id, title: item.title, category, hasAI: !!ai }
}

// Process items with concurrency cap — much faster than serial, won't flood APIs
async function processWithConcurrency(items, concurrency, startMs) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    // Deadline guard: stop processing if we're close to Vercel's 300s limit
    if (Date.now() - startMs > DEADLINE_MS) {
      console.warn(`[NEWS] ⏱ Deadline reached at item ${i}/${items.length} — stopping to allow reportCronRun`)
      break
    }
    const batch   = items.slice(i, i + concurrency)
    const settled = await Promise.allSettled(batch.map(item => processNewsItem(item)))
    for (const s of settled) {
      if (s.status === 'fulfilled' && s.value) results.push(s.value)
    }
    // Brief pause between batches to avoid Sanity rate limits
    if (i + concurrency < items.length) await sleep(100)
  }
  return results
}

// ── DEALS-ROUNDUP CLEANUP ─────────────────────────────────────────────────────
// One-time (then no-op) cleanup: delete any newsArticle docs whose slug matches
// the deals-roundup pattern that slipped through before GATE 2.5 was added.
// Uses the same fetch-based Sanity mutation path as publishToSanity so it works
// in all environments without importing @sanity/client.
async function cleanupDealsRoundupArticles() {
  try {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
    const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
    const token     = process.env.SANITY_API_TOKEN
    if (!token) return

    // Query for slipped-through deals-roundup articles
    const query = encodeURIComponent(
      '*[_type=="newsArticle" && (slug.current match "*weekly*deals*" || slug.current match "*web-deals*" || slug.current match "*deals*roundup*")]{_id,title,slug}'
    )
    const r = await fetch(
      `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!r.ok) return

    const { result } = await r.json()
    if (!result?.length) return

    for (const doc of result) {
      const dr = await fetch(
        `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ mutations: [{ delete: { id: doc._id } }] }),
        }
      )
      if (dr.ok) {
        console.log(`[NEWS] 🗑 Deleted deals-roundup article: "${(doc.title || doc.slug?.current || doc._id).slice(0, 70)}"`)
      }
    }
  } catch (e) {
    console.warn('[NEWS] Cleanup warning (non-critical):', e.message)
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function runNewsFeed() {
  const t = Date.now()
  // Clear in-memory dedup set — module-level Set persists across warm Lambda invocations.
  // Without this, every URL seen in prior runs gets permanently flagged as a dupe.
  resetDedup()
  // Remove any deals-roundup articles that slipped through before GATE 2.5
  await cleanupDealsRoundupArticles()
  console.log('[NEWS] ▶ Starting feed pull...')
  console.log(`[NEWS] Claude API: ${process.env.ANTHROPIC_API_KEY ? 'AVAILABLE' : 'MISSING — using raw data fallback'}`)
  // Reset gate log and per-run URL dedup for this run
  _gateLog = { noTitle:0, hashDup:0, canada:0, brazil:0, gate3:0, gate4:0, sanityDup:0, passedDedup:0, published:0, threw:0, lastError:null }
  _runSeenUrls = new Set()  // fresh Set prevents cross-invocation hash collisions

  // Fetch all sources in parallel
  const [newsapi, rss] = await Promise.all([fetchNewsAPI(), fetchRSS()])
  const combined = [...newsapi, ...rss]

  // ── REGIONAL SPLIT ────────────────────────────────────────────────────────
  // Canada/Brazil items used to compete with US items in one combined slice,
  // which meant they were almost always dropped — 30+ US feeds × 8 items = 240
  // candidates for 40 slots, so international items never made the cut.
  // Fix: give each region its own quota so Canada/Brazil always get processed.
  const usItems = combined
    .filter(i => i.region !== 'canada' && i.region !== 'brazil')
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 30)  // 30 US slots — 6 batches × 26s ≈ 156s
  const caItems = combined
    .filter(i => i.region === 'canada')
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 10)  // up to 10 Canada items per run
  const brItems = combined
    .filter(i => i.region === 'brazil')
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 10)  // up to 10 Brazil items per run
  // Total ≤ 50 items. 10 batches × 26s = 260s < DEADLINE_MS (250s guard fires first if needed)
  const all = [...usItems, ...caItems, ...brItems]

  console.log(`[NEWS] ${all.length} items to process (US:${usItems.length} CA:${caItems.length} BR:${brItems.length}). With images: ${all.filter(i => i.imageUrl).length}`)

  // Process with concurrency
  const published = await processWithConcurrency(all, CONCURRENCY, t)
  const withAI    = published.filter(p => p.hasAI).length
  const withRaw   = published.length - withAI

  const dupeCount = all.length - published.length
  const summary = {
    done:     published.length,
    withAI,
    withRaw,
    dupes:    dupeCount,
    total:    all.length,
    ms:       Date.now() - t,
    claudeUp: !!process.env.ANTHROPIC_API_KEY,
    headlines: published.map(p => p.title || '').filter(Boolean).slice(0, 20),
    gates:    _gateLog,
  }
  console.log(`[NEWS] ✓ Done: ${published.length} published, ${dupeCount} duped/skipped of ${all.length} fetched. ${summary.ms}ms`)
  console.log('[NEWS] Gate breakdown:', JSON.stringify(_gateLog))
  if (published.length === 0 && all.length > 0) {
    console.warn('[NEWS] ⚠️ All items were deduped — possible stale dedup cache or all sources returning old articles')
  }
  if (published.length === 0 && all.length === 0) {
    console.warn('[NEWS] ⚠️ Zero items fetched from ALL sources — RSS feeds may be blocked or returning empty')
  }
  return summary
}

export { runNewsFeed }
