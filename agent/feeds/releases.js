import axios from 'axios'
import Parser from 'rss-parser'
import { rewriteWithClaude, isDuplicate, publishToSanity, notifyBreaking, notifyError, sleep } from '../utils.js'
import crypto from 'crypto'

const parser = new Parser()

const MFR_FEEDS = [
  { brand: 'Glock', url: 'https://us.glock.com/news/rss' },
  { brand: 'Smith & Wesson', url: 'https://www.smith-wesson.com/news/rss' },
  { brand: 'Sig Sauer', url: 'https://www.sigsauer.com/news/rss/' },
  { brand: 'Ruger', url: 'https://www.ruger.com/news/rss.xml' },
  { brand: 'Springfield Armory', url: 'https://www.springfield-armory.com/rss/' },
  { brand: 'CZ-USA', url: 'https://cz-usa.com/news/feed/' },
  { brand: 'Beretta', url: 'https://www.beretta.com/en-us/news/rss/' },
  { brand: 'HK USA', url: 'https://www.hk-usa.com/news/feed/' },
]

const NEW_KEYWORDS = ['new', 'introducing', 'unveiling', 'release', 'launch', 'announced', 'available now', 'ships']

function isNewRelease(title, description) {
  const text = (title + ' ' + (description || '')).toLowerCase()
  return NEW_KEYWORDS.some(kw => text.includes(kw))
}

function extractCaliberFromText(text) {
  const calibers = ['9mm', '.45 ACP', '.40 S&W', '.380 ACP', '.22 LR', '.308', '.223', '5.56', '6.5 Creedmoor', '.357', '.44 Mag', '12 gauge', '20 gauge']
  for (const c of calibers) {
    if (text.toLowerCase().includes(c.toLowerCase())) return c
  }
  return null
}

function extractMSRP(text) {
  const match = text.match(/\$([0-9,]+(?:\.[0-9]{2})?)/i)
  if (match) return parseFloat(match[1].replace(',', ''))
  return null
}

async function fetchMfrRSS() {
  const releases = []
  for (const feed of MFR_FEEDS) {
    try {
      const result = await parser.parseURL(feed.url)
      for (const item of result.items.slice(0, 10)) {
        if (!isNewRelease(item.title, item.contentSnippet)) continue
        if (isDuplicate(item.link)) continue

        const text = item.title + ' ' + (item.contentSnippet || '')
        releases.push({
          brand: feed.brand,
          model: item.title.replace(feed.brand, '').trim(),
          description: item.contentSnippet?.slice(0, 400),
          caliber: extractCaliberFromText(text),
          msrp: extractMSRP(text),
          url: item.link,
          announceDate: item.pubDate ? new Date(item.pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          source: feed.brand + ' RSS'
        })
      }
      await sleep(1000)
    } catch (err) {
      console.error(`[RELEASES] RSS error (${feed.brand}):`, err.message)
    }
  }
  return releases
}

async function fetchGunBrokerNew() {
  if (!process.env.GUNBROKER_KEY) return []
  try {
    const res = await axios.get('https://api.gunbroker.com/Items', {
      params: { Keywords: 'new release 2026', Sort: 13, PageSize: 20 },
      headers: {
        'X-DevKey': process.env.GUNBROKER_KEY,
        'X-AccessToken': process.env.GUNBROKER_TOKEN || ''
      }
    })
    return (res.data.results || []).map(item => ({
      brand: item.manufacturer || 'Unknown',
      model: item.manufacturerModelName || item.title,
      description: item.title,
      caliber: item.caliber,
      msrp: item.currentBid || item.buyNowPrice,
      category: item.categoryName,
      url: `https://www.gunbroker.com/item/${item.itemID}`,
      announceDate: new Date().toISOString().split('T')[0],
      source: 'GunBroker'
    }))
  } catch (err) {
    console.error('[RELEASES] GunBroker error:', err.message)
    return []
  }
}

async function runReleasesFeed() {
  console.log('[RELEASES] Starting releases feed...')
  const t = Date.now()
  let done = 0, failed = 0

  const [mfrItems, gbItems] = await Promise.all([fetchMfrRSS(), fetchGunBrokerNew()])
  const all = [...mfrItems, ...gbItems]

  for (const item of all) {
    try {
      const id = crypto.createHash('md5').update(`${item.brand}-${item.model}-${item.announceDate}`).digest('hex')
      const doc = {
        _id: `release-${id}`,
        _type: 'firearmRelease',
        brand: item.brand,
        model: item.model,
        caliber: item.caliber,
        description: item.description,
        msrp: item.msrp,
        announceDate: item.announceDate,
        isNew: true,
        source: item.source,
        specUrl: item.url,
        externalId: id
      }
      await publishToSanity(doc)
      done++
    } catch (err) {
      failed++
      console.error('[RELEASES] Publish error:', err.message)
    }
    await sleep(300)
  }

  console.log(`[RELEASES] Done. ${done} published, ${failed} failed. ${Date.now() - t}ms`)
  return { done, failed }
}

export { runReleasesFeed }
