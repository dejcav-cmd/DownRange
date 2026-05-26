require('dotenv').config()
const axios  = require('axios')
const Parser = require('rss-parser')
const crypto = require('crypto')
const { rewriteWithClaude, isDuplicate, publishToSanity, notifyBreaking, notifyError, sleep } = require('../utils')

// ── CONFIG ─────────────────────────────────────────────────────────────────────
const CONCURRENCY    = 5    // process N items in parallel (was 1)
const ITEMS_PER_FEED = 10   // cap per RSS feed (was 15)
const MAX_ITEMS      = 60   // hard cap total items to process per run
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
  { name: 'The Firearm Blog',    url: 'https://www.thefirearmblog.com/blog/feed/', cat: 'industry' },
  { name: 'TTAG',                url: 'https://www.thetruthaboutguns.com/feed/',   cat: 'news' },
  { name: 'Guns.com',            url: 'https://www.guns.com/feed',                 cat: 'industry' },
  { name: 'Guns & Ammo',         url: 'https://www.gunsandammo.com/feed/',         cat: 'industry' },
  { name: 'Shooting Wire',       url: 'https://www.shootingwire.com/feed',         cat: 'industry' },
  { name: 'Firearms News',       url: 'https://www.firearmsnews.com/feed/',        cat: 'industry' },
  { name: 'Concealed Nation',    url: 'https://concealednation.org/feed/',         cat: 'news' },
  // ── LEGAL & RIGHTS ────────────────────────────────────────────────────
  { name: 'NRA-ILA',             url: 'https://www.nraila.org/rss/',               cat: 'law' },
  { name: 'SAF',                 url: 'https://www.saf.org/feed/',                 cat: 'law' },
  { name: 'GOA',                 url: 'https://gunowners.org/feed/',               cat: 'law' },
  { name: 'CleanUpATF',          url: 'https://www.cleanupatf.org/feed/',          cat: 'law' },
  { name: 'Duke Firearms Law',   url: 'https://firearmslaw.duke.edu/feed/',        cat: 'law' },
  // ── GOVERNMENT ────────────────────────────────────────────────────────
  { name: 'ATF News',            url: 'https://www.atf.gov/rss/news_whats-new.xml', cat: 'law' },
  { name: 'Congress.gov 2A',     url: 'https://www.congress.gov/rss/most-viewed-bills.xml', cat: 'law' },
  // ── DEALS ─────────────────────────────────────────────────────────────
  { name: 'AmmoLand',            url: 'https://www.ammoland.com/feed/',            cat: 'deals' },
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
    const res = await axios.get('https://newsapi.org/v2/everything', {
      timeout: 10000,
      params: {
        q: 'firearms OR "Second Amendment" OR ATF OR "gun rights" OR "concealed carry"',
        sortBy: 'publishedAt', pageSize: 30, language: 'en',
        apiKey: process.env.NEWSAPI_KEY
      }
    })
    return res.data.articles
      .filter(a => a.title && a.url && !a.title.includes('[Removed]'))
      .map(a => ({
        title: a.title, description: a.description, url: a.url,
        source: a.source?.name, publishedAt: a.publishedAt,
        imageUrl: cleanImageUrl(a.urlToImage), imageAlt: a.title,
      }))
  } catch (err) {
    console.error('[NEWS] NewsAPI error:', err.message)
    return []
  }
}

async function fetchGNews() {
  if (!process.env.GNEWS_KEY) return []
  try {
    const res = await axios.get('https://gnews.io/api/v4/search', {
      timeout: 10000,
      params: { q: 'firearms OR "gun law" OR "Second Amendment"', lang: 'en', max: 20, token: process.env.GNEWS_KEY }
    })
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
    console.log(`[NEWS] RSS ${feed.name}: ${items.length} items`)
    return items
  } catch (err) {
    console.error(`[NEWS] RSS error (${feed.name}): ${err.message}`)
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
  const category = item.feedCat === 'deals'
    ? 'deals'
    : (ai?.category || item.feedCat || 'news')

  const doc = {
    _id:           'news-' + hash,
    _type:         'newsArticle',
    title:         item.title,
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
    imageUrl:      item.imageUrl || null,
    imageAlt:      item.imageAlt || item.title,
    publishedAt:   item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
    autoGenerated: true,
    approved:      true,
    dedupHash:     hash,
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

module.exports = { runNewsFeed }
if (require.main === module) runNewsFeed().catch(console.error)
