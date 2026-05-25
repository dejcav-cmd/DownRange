require('dotenv').config()
const axios  = require('axios')
const Parser = require('rss-parser')
const crypto = require('crypto')
const { rewriteWithClaude, isDuplicate, publishToSanity, notifyBreaking, notifyError, sleep } = require('../utils')

// RSS parser — custom fields to capture media/enclosure images
const parser = new Parser({
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
  { name: 'The Firearm Blog', url: 'https://www.thefirearmblog.com/blog/feed/' },
  { name: 'AmmoLand',         url: 'https://www.ammoland.com/feed/' },
  { name: 'TTAG',             url: 'https://www.thetruthaboutguns.com/feed/' },
  { name: 'NRA-ILA',          url: 'https://www.nraila.org/rss/' },
  { name: 'Guns.com',         url: 'https://www.guns.com/feed' },
  { name: 'CleanUpATF',       url: 'https://www.cleanupatf.org/feed/' },
]

// ── IMAGE EXTRACTION ──────────────────────────────────────────────────────────

/**
 * Extract the best image URL from an RSS item.
 * Checks media:content, media:thumbnail, enclosure, and content HTML in order.
 */
function extractRSSImage(item) {
  // 1. media:content
  if (item.mediaContent) {
    const mc = item.mediaContent
    const url = mc.$ ? mc.$.url : (typeof mc === 'string' ? mc : null)
    if (url && isImageUrl(url)) return url
  }

  // 2. media:thumbnail
  if (item.mediaThumbnail) {
    const mt = item.mediaThumbnail
    const url = mt.$ ? mt.$.url : (typeof mt === 'string' ? mt : null)
    if (url && isImageUrl(url)) return url
  }

  // 3. enclosure (podcasts use this too — check it's an image)
  if (item.enclosure?.url && isImageUrl(item.enclosure.url)) {
    return item.enclosure.url
  }

  // 4. Parse first <img> from content:encoded or content HTML
  const html = item.contentEncoded || item.content || item['content:encoded'] || ''
  if (html) {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (match && match[1] && isImageUrl(match[1])) return match[1]
  }

  return null
}

function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (url.length > 2000) return false
  // Must look like an image path or known CDN
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) ||
         /images\.|img\.|cdn\.|media\./i.test(url) ||
         /wp-content\/uploads/i.test(url)
}

/**
 * Clean and validate an image URL.
 * Returns the URL if valid, null otherwise.
 */
function cleanImageUrl(url) {
  if (!url || typeof url !== 'string') return null
  url = url.trim()
  if (!url.startsWith('http')) return null
  if (url.length > 2000) return null
  // Skip tracking pixels, tiny images, spacers
  if (/1x1|pixel|spacer|blank|transparent/i.test(url)) return null
  return url
}

// ── FETCH FUNCTIONS ───────────────────────────────────────────────────────────

async function fetchNewsAPI() {
  if (!process.env.NEWSAPI_KEY) return []
  try {
    const res = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'firearms OR "Second Amendment" OR ATF OR "gun rights" OR "concealed carry"',
        sortBy: 'publishedAt', pageSize: 50, language: 'en',
        apiKey: process.env.NEWSAPI_KEY
      }
    })
    return res.data.articles
      .filter(a => a.title && a.url && !a.title.includes('[Removed]'))
      .map(a => ({
        title:       a.title,
        description: a.description,
        url:         a.url,
        source:      a.source?.name,
        publishedAt: a.publishedAt,
        imageUrl:    cleanImageUrl(a.urlToImage),
        imageAlt:    a.title,
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
      params: {
        q: 'firearms OR "gun law" OR "Second Amendment"',
        lang: 'en', max: 25, token: process.env.GNEWS_KEY
      }
    })
    return res.data.articles.map(a => ({
      title:       a.title,
      description: a.description,
      url:         a.url,
      source:      a.source?.name,
      publishedAt: a.publishedAt,
      imageUrl:    cleanImageUrl(a.image),
      imageAlt:    a.title,
    }))
  } catch (err) {
    console.error('[NEWS] GNews error:', err.message)
    return []
  }
}

async function fetchRSS() {
  const all = []
  for (const feed of RSS_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url)
      const items = result.items.slice(0, 15).map(i => {
        const imageUrl = cleanImageUrl(extractRSSImage(i))
        return {
          title:       i.title,
          description: i.contentSnippet || i.summary || i.content?.slice(0, 400),
          url:         i.link,
          source:      feed.name,
          publishedAt: i.pubDate || i.isoDate,
          imageUrl,
          imageAlt:    i.title,
        }
      })
      all.push(...items)
      console.log(`[NEWS] RSS ${feed.name}: ${items.length} items, ${items.filter(i => i.imageUrl).length} with images`)
      await sleep(500)
    } catch (err) {
      console.error(`[NEWS] RSS error (${feed.name}):`, err.message)
    }
  }
  return all
}

// ── PROCESS + PUBLISH ─────────────────────────────────────────────────────────

async function processNewsItem(item) {
  if (!item.title || !item.url) return null
  if (isDuplicate(item.url)) return null

  const ai = await rewriteWithClaude(item)
  const hash = crypto.createHash('md5').update(item.url).digest('hex')

  const doc = {
    _id:          'news-' + hash,
    _type:        'newsArticle',
    title:        item.title,
    slug:         {
      _type:   'slug',
      current: item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 96)
    },
    excerpt:      ai.summary || item.description?.slice(0, 300),
    summary:      ai.summary || item.description?.slice(0, 300),
    category:     ai.category || 'news',
    urgencyScore: ai.urgencyScore || 3,
    tags:         ai.tags || [],
    relatedStates:ai.relatedStates || [],
    source:       item.source,
    externalUrl:  item.url,
    // Store image as a plain URL — no Sanity upload needed
    imageUrl:     item.imageUrl || null,
    imageAlt:     item.imageAlt || item.title,
    publishedAt:  item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString(),
    autoGenerated:true,
    approved:     true,
    dedupHash:    hash,
  }

  await publishToSanity(doc)
  console.log(`[NEWS] Published: "${item.title.slice(0, 60)}" | image: ${item.imageUrl ? '✓' : '✗'}`)

  if (ai.isBreaking || ai.urgencyScore >= 8) {
    await publishToSanity({
      _id:          'alert-' + hash,
      _type:        'breakingAlert',
      headline:     item.title,
      summary:      ai.summary,
      url:          item.url,
      source:       item.source,
      urgencyScore: ai.urgencyScore,
      active:       true,
      publishedAt:  doc.publishedAt,
    })
    await notifyBreaking({ ...item, urgencyScore: ai.urgencyScore, summary: ai.summary })
  }

  return doc
}

async function runNewsFeed() {
  console.log('[NEWS] Starting feed pull...')
  const t = Date.now()

  const [newsapi, gnews, rss] = await Promise.all([fetchNewsAPI(), fetchGNews(), fetchRSS()])
  const all = [...newsapi, ...gnews, ...rss]
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

  const withImages    = all.filter(i => i.imageUrl).length
  const withoutImages = all.length - withImages
  console.log(`[NEWS] ${all.length} items fetched. ${withImages} with images, ${withoutImages} without.`)

  let done = 0, failed = 0
  for (const item of all) {
    try {
      const result = await processNewsItem(item)
      if (result) done++
    } catch (err) {
      failed++
      console.error('[NEWS] Process error:', err.message)
    }
    await sleep(800)
  }

  console.log(`[NEWS] Done. ${done} published, ${failed} failed. ${Date.now() - t}ms`)
  return { done, failed, total: all.length, withImages }
}

module.exports = { runNewsFeed }
if (require.main === module) runNewsFeed().catch(console.error)
