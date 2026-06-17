/**
 * Fetches real OG images from each release's sourceUrl
 * and patches them into Sanity.
 * Run: SANITY_API_TOKEN=... node scripts/patch-releases-real-images.js
 */
const https = require('https')
const http  = require('http')
const { URL } = require('url')

const PROJECT_ID = 'vbnsqnkg'
const DATASET    = 'production'
const TOKEN      = process.env.SANITY_API_TOKEN

function sanityRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/${path}`,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
    const req = https.request(opts, res => {
      let d = ''
      res.on('data', c => (d += c))
      res.on('end', () => {
        try { resolve(JSON.parse(d)) }
        catch (e) { reject(new Error('Parse fail: ' + d.slice(0, 200))) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

function fetchUrl(rawUrl, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 4) return resolve('')
    let url
    try { url = new URL(rawUrl) } catch { return resolve('') }
    const mod = url.protocol === 'https:' ? https : http
    const req = mod.request(
      { hostname: url.hostname, path: url.pathname + url.search,
        method: 'GET', timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      },
      res => {
        if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : url.origin + res.headers.location
          return resolve(fetchUrl(next, redirects + 1))
        }
        let d = ''
        res.on('data', c => { d += c; if (d.length > 200000) req.destroy() })
        res.on('end', () => resolve(d))
      }
    )
    req.on('error', () => resolve(''))
    req.on('timeout', () => { req.destroy(); resolve('') })
    req.end()
  })
}

function extractOgImage(html) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]
  for (const rx of patterns) {
    const m = html.match(rx)
    if (m?.[1] && m[1].startsWith('http') && !m[1].includes('logo') && m[1].length > 20) return m[1]
  }
  return null
}

async function run() {
  console.log('Fetching all releases from Sanity...')
  const query = encodeURIComponent(
    '*[_type=="firearmRelease" && defined(sourceUrl) && sourceUrl != ""] | order(publishedAt desc) [0...200] { _id, brand, model, category, sourceUrl, imageUrl }'
  )
  const { result: docs } = await sanityRequest(`query/${DATASET}?query=${query}`)
  console.log(`Found ${docs.length} releases with sourceUrl`)

  let patched = 0, failed = 0, skipped = 0

  for (const doc of docs) {
    // Skip if already has a real image (not a generic unsplash one)
    if (doc.imageUrl && !doc.imageUrl.includes('unsplash.com')) {
      skipped++
      continue
    }

    process.stdout.write(`[${doc.brand} — ${doc.model}] `)
    const html = await fetchUrl(doc.sourceUrl)

    if (!html) {
      console.log('✗ fetch failed')
      failed++
      continue
    }

    const img = extractOgImage(html)
    if (!img) {
      console.log('✗ no OG image found')
      failed++
      continue
    }

    // Patch into Sanity
    try {
      await sanityRequest(`mutate/${DATASET}`, 'POST', {
        mutations: [{ patch: { id: doc._id, set: { imageUrl: img } } }]
      })
      console.log(`✓ ${img.slice(0, 60)}`)
      patched++
    } catch (e) {
      console.log(`✗ patch error: ${e.message}`)
      failed++
    }

    await new Promise(r => setTimeout(r, 400))
  }

  console.log(`\nDone: ${patched} patched, ${skipped} already had real images, ${failed} failed`)
}

run().catch(e => { console.error(e); process.exit(1) })
