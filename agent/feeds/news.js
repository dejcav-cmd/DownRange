
// Wikimedia verified firearm images — assigned when RSS has no image
const FIREARM_IMAGES = {
  law:        '/img/law.svg',
  pistol:     '/img/pistol.svg',
  rifle:      '/img/rifle.svg',
  shotgun:    '/img/shotgun.svg',
  suppressor: '/img/suppressor.svg',
  ammo:       '/img/ammo.svg',
  news:       '/img/pistol.svg',
  industry:   '/img/rifle.svg',
  breaking:   '/img/law.svg',
}

// Named aliases used by pickImage() below
const LAW_IMAGE    = FIREARM_IMAGES.law
const PISTOL_IMAGE = FIREARM_IMAGES.pistol
const RIFLE_IMAGE  = FIREARM_IMAGES.rifle

function pickImage(title, category) {
  // ALWAYS use real /img/photos/ — never SVGs
  const t = (title || '').toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen|legislature|senate|congress/.test(t)) return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc|p365|hellcat|shield|kimber|walther|p320|bodyguard/.test(t)) return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr|m16|fn.15|daniel|bcm|bolt.action|semi.auto/.test(t)) return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|remington.*870|benelli|gauge|pump|590|870/.test(t)) return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa|omega|dead.air|surefire|thunder|obsidian/.test(t)) return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain|9mm|45.acp|ballistic/.test(t)) return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl|turkey|bear|boar/.test(t)) return '/img/photos/hunting.jpg'
  if (/train|range|practice|marksmanship|drill|dry.fire/.test(t)) return '/img/photos/training.jpg'
  if (/gear|holster|optic|scope|light|sling|magazine/.test(t)) return '/img/photos/gear.jpg'
  if (/military|army|marine|navy|soldier|combat|veteran/.test(t)) return '/img/photos/military.jpg'
  if (/home.defense|self.defense/.test(t)) return '/img/photos/homedefense.jpg'
  const catMap = { law: '/img/photos/law.jpg', breaking: '/img/photos/news.jpg', opinion: '/img/photos/news.jpg', industry: '/img/photos/rifle.jpg', training: '/img/photos/pistol.jpg', news: '/img/photos/pistol.jpg' }
  return catMap[category] || '/img/photos/news.jpg'
}
import Parser from 'rss-parser'
import crypto from 'crypto'
import { rewriteWithClaude, isDuplicate, publishToSanity, notifyBreaking, notifyError, sleep, fetchAndUploadOgImage } from '../utils.js'

// ── CONFIG ─────────────────────────────────────────────────────────────────────
const CONCURRENCY    = 3    // COST: was 5
const ITEMS_PER_FEED = 5    // COST: was 10 — enough for 15-min cadence
const MAX_ITEMS      = 20   // COST: was 60 — runs every 15min, 20 is plenty
const RSS_TIMEOUT_MS = 8000 // per-feed fetch timeout

// ── RSS PARSER ─────────────────────────────────────────────────────────────────
const parser = new Parser({
  timeout: RSS_TIMEOUT_MS,
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
  // ── FIREARMS NEWS ─────────────────────────────────────────────────────
  { name: 'The Firearm Blog',        url: 'https://www.thefirearmblog.com/blog/feed/',         cat: 'industry' },
  { name: 'TTAG',                    url: 'https://www.thetruthaboutguns.com/feed/',            cat: 'news'     },
  { name: 'Guns.com News',           url: 'https://www.guns.com/feed',                          cat: 'industry' },
  { name: 'Guns & Ammo',             url: 'https://www.gunsandammo.com/feed/',                  cat: 'industry' },
  { name: 'Shooting Wire',           url: 'https://www.shootingwire.com/feed',                  cat: 'industry' },
  { name: 'Firearms News',           url: 'https://www.firearmsnews.com/feed/',                 cat: 'industry' },
  { name: 'Concealed Nation',        url: 'https://concealednation.org/feed/',                  cat: 'news'     },
  { name: 'Outdoor Life Guns',       url: 'https://www.outdoorlife.com/category/guns/feed/',    cat: 'industry' },
  { name: 'Field & Stream Guns',     url: 'https://www.fieldandstream.com/category/guns/feed/',cat: 'industry' },
  { name: 'Tactical Life',           url: 'https://www.tactical-life.com/feed/',                cat: 'industry' },
  { name: 'Personal Defense World',  url: 'https://www.personaldefenseworld.com/feed/',         cat: 'news'     },
  { name: 'Combat Handguns',         url: 'https://www.combathandguns.com/feed/',               cat: 'industry' },
  { name: 'Handguns Magazine',       url: 'https://www.handgunsmag.com/feed/',                  cat: 'industry' },
  { name: 'Rifle Shooter',           url: 'https://www.rifleshootermag.com/feed/',              cat: 'industry' },
  { name: 'American Rifleman',       url: 'https://www.americanrifleman.org/feed/',             cat: 'industry' },
  { name: 'American Hunter',         url: 'https://www.americanhunter.org/feed/',               cat: 'industry' },
  { name: 'Shooting Illustrated',    url: 'https://www.shootingillustrated.com/feed/',          cat: 'industry' },
  // ── LEGAL & RIGHTS ────────────────────────────────────────────────────
  { name: 'NRA-ILA',                 url: 'https://www.nraila.org/rss/',                       cat: 'law'      },
  { name: 'SAF',                     url: 'https://www.saf.org/feed/',                          cat: 'law'      },
  { name: 'FPC',                     url: 'https://www.firearmspolicy.org/feed/',               cat: 'law'      },
  { name: 'Firearms Policy Coalition',url: 'https://fpclaw.org/feed/',                          cat: 'law'      },
  { name: 'CleanUpATF',              url: 'https://www.cleanupatf.org/feed/',                   cat: 'law'      },
  { name: 'Duke Firearms Law',       url: 'https://firearmslaw.duke.edu/feed/',                 cat: 'law'      },
  { name: 'Bearing Arms',            url: 'https://bearingarms.com/feed/',                      cat: 'law'      },
  { name: 'Guns & Patriots',         url: 'https://www.newsmax.com/rss/Guns-And-Patriots/1/',   cat: 'law'      },
  // ── GOVERNMENT ────────────────────────────────────────────────────────
  { name: 'ATF News',                url: 'https://www.atf.gov/rss/news_whats-new.xml',         cat: 'law'      },
  { name: 'Congress.gov 2A',         url: 'https://www.congress.gov/rss/most-viewed-bills.xml', cat: 'law'      },
  // ── GUN RIGHTS ───────────────────────────────────────────────────────────
  { name: 'GOA',            url: 'https://www.gunowners.org/feed/',                 cat: 'law'      },
  { name: 'GOA Press',      url: 'https://www.gunowners.org/category/press/feed/', cat: 'law'      },
  // ── CANADA ────────────────────────────────────────────────────────────────
  { name: 'TheGunBlog.ca',  url: 'https://www.thegunblog.ca/feed/',           cat: 'law'      },
  { name: 'NFA Canada',     url: 'https://www.nfa.ca/feed/',                  cat: 'law'      },
  { name: 'CSSA',           url: 'https://www.cdnshootingsports.org/feed/',   cat: 'law'      },
  // ── AMMO & MARKET ─────────────────────────────────────────────────────
  // AmmoLand removed from news feed — all AmmoLand content routes to /deals only
  { name: 'GunsAmerica Digest',      url: 'https://www.gunsamerica.com/blog/feed/',             cat: 'industry' },
  // ── REDDIT ────────────────────────────────────────────────────────────
  { name: 'r/guns',                  url: 'https://www.reddit.com/r/guns/hot.json?limit=10',    cat: 'news',    isReddit: true },
  { name: 'r/firearms',              url: 'https://www.reddit.com/r/firearms/hot.json?limit=10',cat: 'news',    isReddit: true },
  { name: 'r/CCW',                   url: 'https://www.reddit.com/r/CCW/hot.json?limit=10',     cat: 'news',    isReddit: true },
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
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (match?.[1] && isImageUrl(match[1])) return match[1]
  }
  return null
}

function isImageUrl(url) {
  if (!url || typeof url !== 'string' || url.length > 2000) return false
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) ||
         /images\.|img\.|cdn\.|media\./i.test(url) ||
         /wp-content\/uploads/i.test(url)
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
    const _newsParams = new URLSearchParams({
      q: '(firearms OR "Second Amendment" OR "gun control" OR ATF OR "gun rights" OR "concealed carry" OR Glock OR "pistol brace" OR NRA OR "gun law" OR suppressor OR "Gun Rights" OR gunrights.org) AND -"video game"',
      language: 'en', sortBy: 'publishedAt', pageSize: '30', apiKey: process.env.NEWSAPI_KEY
    })
    const _newsR = await fetch('https://newsapi.org/v2/everything?' + _newsParams, { signal: AbortSignal.timeout(10000) })
    if (!_newsR.ok) throw new Error(_newsR.statusText)
    const res = { data: await _newsR.json() }
    return res.data.articles
      .filter(a => a.title && a.url && !a.title.includes('[Removed]'))
      .map(a => ({
        title: a.title, description: a.description, url: a.url,
        source: a.source?.name, publishedAt: a.publishedAt,
        imageUrl: pickImage(a.title, 'news'), imageAlt: a.title,
      }))
  } catch (err) {
    console.error('[NEWS] NewsAPI error:', err.message)
    return []
  }
}

async function fetchGNews() {
  if (!process.env.GNEWS_KEY) return []
  try {
    const _gnewsParams = new URLSearchParams({ q: 'firearms OR "gun law" OR "Second Amendment"', lang: 'en', max: '20', token: process.env.GNEWS_KEY })
    const _gnewsR = await fetch('https://gnews.io/api/v4/search?' + _gnewsParams, { signal: AbortSignal.timeout(10000) })
    if (!_gnewsR.ok) throw new Error(_gnewsR.statusText)
    const res = { data: await _gnewsR.json() }
    return res.data.articles.map(a => ({
      title: a.title, description: a.description, url: a.url,
      source: a.source?.name, publishedAt: a.publishedAt,
      imageUrl: cleanImageUrl(a.image), imageAlt: a.title,
    }))
  } catch (err) {
    console.error('[NEWS] GNews error:', err.message)
    return []
  }
}

async function fetchOneFeed(feed) {
  try {
    // Reddit JSON feeds use different format
    if (feed.isReddit) {
      const _feedR = await fetch(feed.url, { headers: { 'User-Agent': 'DownRange/1.0' }, signal: AbortSignal.timeout(8000) })
      if (!_feedR.ok) throw new Error(_feedR.statusText)
      const res = { data: await _feedR.json() }
      // Only include Reddit posts clearly about firearms/2A
      const FIREARMS_TERMS = /gun|firearm|pistol|rifle|shotgun|ammo|ammunition|carry|ccw|2a|second.amend|glock|sig|ar.?15|ak|suppressor|holster|caliber|bullet|trigger|magazine|nfa|atf|ruger|colt|smith/i
      const NON_FIREARMS_TERMS = /reptile|snake|lizard|smuggl|crypto|bitcoin|nft|recipe|cooking|fashion|sports.team|nba|nfl|mlb|animal.smuggl/i
      const posts = (res.data?.data?.children || [])
        .filter(p => p.data && !p.data.is_self && p.data.score > 10)
        .filter(p => FIREARMS_TERMS.test(p.data.title) && !NON_FIREARMS_TERMS.test(p.data.title))
        .slice(0, 5)
        .map(p => ({
          title:       p.data.title,
          description: p.data.selftext?.slice(0, 400) || p.data.title,
          url:         p.data.url?.startsWith('http') ? p.data.url : 'https://reddit.com' + p.data.permalink,
          source:      feed.name,
          feedCat:     feed.cat,
          publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
          imageUrl:    p.data.thumbnail?.startsWith('http') ? p.data.thumbnail : null,
          imageAlt:    p.data.title,
        }))
      console.log('[NEWS] Reddit ' + feed.name + ': ' + posts.length + ' items')
      return posts
    }

    const result = await parser.parseURL(feed.url)
    const items = result.items.slice(0, ITEMS_PER_FEED).map(i => ({
      title:       i.title,
      description: i.contentSnippet || i.summary || i.content?.slice(0, 400),
      url:         i.link,
      source:      feed.name,
      feedCat:     feed.cat,
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

async function processNewsItem(item) {
  if (!item.title || !item.url) return null
  if (isDuplicate(item.url)) return null

  const hash = crypto.createHash('md5').update(item.url).digest('hex')
  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)

  // Attempt Claude rewrite — gracefully fall back to raw data if API unavailable
  let ai = null
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      ai = await rewriteWithClaude(item)
    } catch (err) {
      console.warn(`[NEWS] Claude rewrite failed for "${item.title.slice(0,50)}": ${err.message}`)
    }
  }

  // Derive category from feed cat or AI result
  // AmmoLand is always deals — never news
  const category = item.feedCat === 'deals' || item.source === 'AmmoLand'
    ? 'deals'
    : (ai?.category || item.feedCat || 'news')

  const doc = {
    _id:           'news-' + hash,
    _type:         'newsArticle',
    title:         ai?.title || item.title,
    sourceTitle:   item.title,
    slug:          { _type: 'slug', current: slug },
    excerpt:       ai?.summary || item.description?.slice(0, 300) || item.title,
    summary:       ai?.summary || item.description?.slice(0, 300) || item.title,
    body:          ai?.body    || null,
    category,
    urgencyScore:  ai?.urgencyScore || (item.feedCat === 'law' ? 5 : 3),
    tags:          ai?.tags         || [],
    relatedStates: ai?.relatedStates || [],
    source:        item.source,
    externalUrl:   item.url,
    // Try to get real og:image from source article; fall back to category SVG
    imageUrl:      item._cdnImageUrl || pickImage(item.title, category),
    imageAlt:      item.imageAlt || item.title,
    publishedAt:   item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
    autoGenerated: true,
    approved:      true,
    dedupHash:     hash,
  }

  // Attempt to fetch real image from source article (async, non-blocking)
  try {
    const cdnUrl = await fetchAndUploadOgImage(item.url, doc._id)
    if (cdnUrl) {
      doc.imageUrl = cdnUrl
      console.log(`[NEWS] 📷 Got real image for "${item.title.slice(0,40)}"`)
    }
  } catch { /* non-critical */ }

  // Skip non-US/international sources
  const extUrl = (item.url || '').toLowerCase()
  const intlDomains = ['thehindu.com','hindustantimes.com','timesofindia.com',
    'ndtv.com','theguardian.com','bbc.com','bbc.co.uk','channelnewsasia.com',
    'straitstimes.com','scmp.com','aljazeera.com','dawn.com','thenews.com.pk',
    'smh.com.au','abc.net.au','news.com.au','stuff.co.nz','rnz.co.nz']
  if (intlDomains.some(d => extUrl.includes(d))) {
    console.log('[NEWS] Skipping non-US source: ' + (item.url || '').slice(0, 60))
    return
  }

  // Skip articles with clearly non-US jurisdictional language
  const lowerTitle = (item.title || '').toLowerCase()
  const nonUSTerms = ['karnataka', 'belagavi', 'maharashtra', 'country-made guns',
    'country made guns', 'desi katta', 'mumbai', 'delhi', 'bengaluru', 'chennai',
    'pakistan', 'bangladesh', 'afghanistan', 'indian police', 'victoria police',
    'new south wales', 'queensland police', 'ontario', 'british columbia',
    'metropolitan police', 'scotland yard']
  if (nonUSTerms.some(t => lowerTitle.includes(t))) {
    console.log('[NEWS] Skipping non-US jurisdiction article: ' + item.title?.slice(0, 60))
    return
  }

  await publishToSanity(doc)
  console.log(`[NEWS] ✓ "${item.title.slice(0, 60)}" [${category}]${ai ? ' +AI' : ' +raw'}`)

  // Breaking alert if high urgency
  if (category !== 'deals' && (ai?.isBreaking || (ai?.urgencyScore || 0) >= 8)) {
    await publishToSanity({
      _id:          'alert-' + hash,
      _type:        'breakingAlert',
      headline:     item.title,
      summary:      ai?.summary || item.description?.slice(0, 200),
      url:          item.url,
      source:       item.source,
      urgencyScore: ai?.urgencyScore || 8,
      active:       true,
      publishedAt:  doc.publishedAt,
    })
    if (process.env.DISCORD_BREAKING_WEBHOOK) {
      await notifyBreaking({ title: item.title, url: item.url, urgencyScore: ai?.urgencyScore })
    }
  }

  return { id: doc._id, title: item.title, category, hasAI: !!ai }
}

// Process items with concurrency cap — much faster than serial, won't flood APIs
async function processWithConcurrency(items, concurrency) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch   = items.slice(i, i + concurrency)
    const settled = await Promise.allSettled(batch.map(item => processNewsItem(item)))
    for (const s of settled) {
      if (s.status === 'fulfilled' && s.value) results.push(s.value)
    }
    // Brief pause between batches to avoid Sanity rate limits
    if (i + concurrency < items.length) await sleep(200)
  }
  return results
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function runNewsFeed() {
  const t = Date.now()
  console.log('[NEWS] ▶ Starting feed pull...')
  console.log(`[NEWS] Claude API: ${process.env.ANTHROPIC_API_KEY ? 'AVAILABLE' : 'MISSING — using raw data fallback'}`)

  // Fetch all sources in parallel
  const [newsapi, gnews, rss] = await Promise.all([fetchNewsAPI(), fetchGNews(), fetchRSS()])
  const all = [...newsapi, ...gnews, ...rss]
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, MAX_ITEMS) // hard cap

  console.log(`[NEWS] ${all.length} items to process (capped at ${MAX_ITEMS}). With images: ${all.filter(i => i.imageUrl).length}`)

  // Process with concurrency
  const published = await processWithConcurrency(all, CONCURRENCY)
  const withAI    = published.filter(p => p.hasAI).length
  const withRaw   = published.length - withAI

  const summary = {
    done:     published.length,
    withAI,
    withRaw,
    total:    all.length,
    ms:       Date.now() - t,
    claudeUp: !!process.env.ANTHROPIC_API_KEY,
  }
  console.log(`[NEWS] ✓ Done: ${published.length} published (${withAI} AI-rewritten, ${withRaw} raw). ${summary.ms}ms`)
  return summary
}

export { runNewsFeed }
