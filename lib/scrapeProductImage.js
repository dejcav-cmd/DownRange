/**
 * lib/scrapeProductImage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetch the og:image from any retail product page and upload it to Sanity CDN.
 * Used by the gunDeal backfill cron, Reddit deal cron, and web-deals scraper.
 *
 * Strategy:
 *   1. Direct fetch with browser headers (works for most retailers)
 *   2. Jina proxy fallback (handles Cloudflare-protected pages)
 *   3. Returns null — never a stock/Pexels image for product deals
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { uploadImageToSanity } from '@/lib/imageUpload'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ── Fetch HTML from a URL ─────────────────────────────────────────────────────
async function fetchDirect(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':      UA,
        'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control':   'no-cache',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const html = await res.text()
    // Reject bot-detection pages (too short or has CAPTCHA markers)
    if (html.length < 2000) return null
    if (/cf-browser-verification|recaptcha|challenge-form/i.test(html)) return null
    return html
  } catch {
    return null
  }
}

async function fetchViaJina(url) {
  try {
    const headers = {
      'User-Agent':     UA,
      'x-respond-with': 'html',
      'Accept':         'text/html',
    }
    if (process.env.JINA_API_KEY) headers['Authorization'] = 'Bearer ' + process.env.JINA_API_KEY
    const res = await fetch('https://r.jina.ai/' + url, { headers, signal: AbortSignal.timeout(20000) })
    if (!res.ok) return null
    const html = await res.text()
    return html.length > 2000 ? html : null
  } catch {
    return null
  }
}

// ── Parse og:image (and og:title, og:description) from HTML ──────────────────
export function parseOgData(html = '') {
  const og = (prop) => {
    const m = html.match(new RegExp(`<meta[^>]*property=["']og:${prop}["'][^>]*content=["']([^"']+)["']`, 'i'))
           || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${prop}["']`, 'i'))
    return m ? m[1].trim() : null
  }

  const title = og('title')
    ?.replace(/\s*[-–|]\s*(amazon\.com|brownells|palmetto state armory|primary arms|midwayusa|natchez).*$/i, '')
    ?.trim() || null

  const image = og('image') || null
  const price = (() => {
    const m = html.match(/"price"\s*:\s*"?([\d.]+)"?/)
           || html.match(/<span[^>]*class="[^"]*a-offscreen[^"]*"[^>]*>\$?([\d,.]+)</i)
           || html.match(/itemprop="price"[^>]*content="([\d.]+)"/)
    return m ? `$${parseFloat(m[1].replace(/,/g, '')).toFixed(2)}` : null
  })()

  return { title, image, price }
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * Fetch og:image from a product URL and upload to Sanity CDN.
 * @param {string} productUrl  The retail product page URL
 * @param {string} label       Sanity asset label (for the filename)
 * @returns {Promise<string|null>}  Sanity CDN URL or null
 */
export async function scrapeProductImage(productUrl, label = 'deal') {
  if (!productUrl) return null

  // Try direct fetch first
  let html = await fetchDirect(productUrl)
  if (!html) html = await fetchViaJina(productUrl)
  if (!html) return null

  const { image } = parseOgData(html)
  if (!image) return null

  return uploadImageToSanity(image, label).catch(() => null)
}

/**
 * Scrape full product metadata (title, image, price) from a product page.
 * Used by web-deals scraper to visit product pages directly.
 * @returns {Promise<{title,image,price,cdnUrl}|null>}
 */
export async function scrapeProductPage(productUrl, label = 'deal') {
  if (!productUrl) return null

  let html = await fetchDirect(productUrl)
  if (!html) html = await fetchViaJina(productUrl)
  if (!html) return null

  const { title, image, price } = parseOgData(html)
  if (!title && !image) return null

  const cdnUrl = image
    ? await uploadImageToSanity(image, label).catch(() => null)
    : null

  return { title, image, price, cdnUrl }
}
