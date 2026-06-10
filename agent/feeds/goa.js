import { callAIText } from '../../lib/aiClient.js'
import { publishToSanity, isDuplicate, hashUrl, sleep } from '../utils.js'

const GOA_SOURCES = [
  { name: 'GOA',      base: 'https://www.gunowners.org', cat: 'press-center' },
  { name: 'GOA News', base: 'https://www.gunowners.org', cat: 'goanews' },
]

// Reliable RSS fallbacks that don't require WP API (used when GOA blocks Vercel IPs)
const GOA_RSS_FALLBACKS = [
  { name: 'NRA-ILA',  url: 'https://www.nraila.org/rss/' },
  { name: 'FPC',      url: 'https://www.firearmspolicycoalition.org/feed/' },
  { name: 'SAF',      url: 'https://www.saf.org/feed/' },
  { name: 'GOA Feed', url: 'https://gunowners.org/feed/' },
]

import Parser from 'rss-parser'
import { decodeHtmlEntities } from '../../lib/decodeEntities.js'
const rssParser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'DownRange/1.0' } })

async function fetchGOARSSFallbacks() {
  const items = []
  for (const feed of GOA_RSS_FALLBACKS) {
    try {
      const parsed = await rssParser.parseURL(feed.url)
      for (const item of (parsed.items || []).slice(0, 8)) {
        if (!item.title || !item.link) continue
        const lower = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase()
        const relevant = ['gun','firearm','second amendment','2a','atf','carry','legislation','court','ruling','ban','permit','bill'].some(k => lower.includes(k))
        if (!relevant) continue
        items.push({
          title:       decodeHtmlEntities(item.title),
          url:         item.link,
          description: item.contentSnippet?.slice(0, 400) || item.title,
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          source:      feed.name,
          category:    'law',
          feedCat:     'law',
          imageUrl:    '/img/law.svg',
        })
      }
      console.log(`[GOA] RSS fallback ${feed.name}: ${items.length} items so far`)
    } catch (e) {
      console.warn(`[GOA] RSS fallback ${feed.name} failed:`, e.message)
    }
  }
  return items
}

async function fetchGOAPosts(base, cat, limit = 20) {
  // WordPress REST API — works even when RSS feed is blocked by Cloudflare
  const url = `${base}/wp-json/wp/v2/posts?categories_name=${cat}&per_page=${limit}&_fields=id,title,excerpt,link,date,categories,tags`

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0; +https://downrangeco.com)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const posts = await res.json()
      return posts.map(p => ({
        title:       decodeHtmlEntities(p.title?.rendered) || '',
        description: p.excerpt?.rendered?.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&#[0-9]+;/g,'').trim() || '',
        url:         p.link,
        publishedAt: p.date,
        source:      'Gun Owners of America',
        category:    'law',
        feedCat:     'law',
        imageUrl:    '/img/law.svg',
      })).filter(p => p.title && p.url)
    }
  } catch (e) {
    console.warn(`[GOA] WP API failed (${cat}): ${e.message}`)
  }

  // Fallback: try the standard RSS feed URL
  try {
    const rssRes = await fetch(`${base}/${cat}/feed/`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0; +https://downrangeco.com)' },
      signal: AbortSignal.timeout(8000),
    })
    if (rssRes.ok) {
      const xml = await rssRes.text()
      const items = []
      const itemRx = /<item>([\s\S]*?)<\/item>/g
      let m
      while ((m = itemRx.exec(xml)) !== null) {
        const item = m[1]
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
        const link  = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
        const desc  = item.match(/<description><!\[CDATA\[(.*?)\]\]>/)?.[1]?.replace(/<[^>]+>/g,'').trim() || ''
        const date  = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        if (title && link) items.push({ title, url: link, description: desc, publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(), source: 'Gun Owners of America', category: 'law', feedCat: 'law', imageUrl: '/img/law.svg' })
        if (items.length >= limit) break
      }
      return items
    }
  } catch (e) {
    console.warn(`[GOA] RSS fallback failed (${cat}): ${e.message}`)
  }

  return []
}

async function processGOAItem(item) {
  if (!item.url || !item.title) return null
  if (isDuplicate(item.url)) return null

  const hash = hashUrl(item.url)
  const slug = item.title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) + '-' + hash.slice(0, 6)

  // Build AI prompt for summary
  const prompt = `Write a 2-sentence DownRange summary of this GOA (Gun Owners of America) press release.
Voice: direct, written for gun owners. No fluff. State the key legal/political action and why it matters.
Title: ${item.title}
${item.description ? `Context: ${item.description.slice(0, 400)}` : ''}
Return ONLY a JSON object: {"summary":"...","urgencyScore":5}
urgencyScore 1-10: court rulings/ATF actions=8-9, legislation=6-7, statements=4-5`

  let ai = null
  try {
    const text = await callAIText({ prompt, useCase: 'laws', maxTokens: 200 })
    const clean = text.split('```json').join('').split('```').join('').trim()
    ai = JSON.parse(clean)
  } catch {
    ai = { summary: item.description?.slice(0, 200) || item.title, urgencyScore: 5 }
  }

  const doc = {
    _id:          'goa-' + hash,
    _type:        'newsArticle',
    title:        item.title,
    slug:         { _type: 'slug', current: slug },
    excerpt:      ai.summary,
    summary:      ai.summary,
    body:         null,
    category:     'law',
    urgencyScore: ai.urgencyScore || 5,
    tags:         ['GOA', '2A', 'gun-rights', 'legislation'],
    relatedStates:[],
    source:       'Gun Owners of America',
    externalUrl:  item.url,
    imageUrl:     '/img/law.svg',
    imageAlt:     item.title,
    publishedAt:  item.publishedAt || new Date().toISOString(),
    autoGenerated:true,
    approved:     true,
    dedupHash:    hash,
  }

  await publishToSanity(doc)
  console.log(`[GOA] ✓ "${item.title.slice(0, 60)}"`)
  return { id: doc._id, title: item.title }
}

export async function runGOAFeed() {
  const t = Date.now()
  console.log('[GOA] Starting Gun Owners of America press feed...')

  let all = []
  for (const src of GOA_SOURCES) {
    const posts = await fetchGOAPosts(src.base, src.cat)
    console.log(`[GOA] ${src.name} (${src.cat}): ${posts.length} posts`)
    all.push(...posts)
    await sleep(300)
  }

  // If GOA WP API returned nothing (Cloudflare blocking Vercel IPs), use RSS fallbacks
  if (all.length === 0) {
    console.log('[GOA] Primary sources returned 0 posts — using RSS fallbacks')
    const fallbackItems = await fetchGOARSSFallbacks()
    all.push(...fallbackItems)
    console.log(`[GOA] RSS fallbacks provided ${fallbackItems.length} items`)
  }

  // Deduplicate by URL
  const seen = new Set()
  all = all.filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true })

  console.log(`[GOA] ${all.length} unique posts to process`)

  const results = []
  for (const item of all) {
    const r = await processGOAItem(item)
    if (r) results.push(r)
    await sleep(300)
  }

  return {
    done:   results.length,
    total:  all.length,
    source: 'Gun Owners of America',
    ms:     Date.now() - t,
  }
}
