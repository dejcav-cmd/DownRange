/**
 * Backfill real gun.deals product images.
 *
 * Replaces the Pexels stock photos that fix-placeholder-images wrote while
 * gun.deals was unreachable, and fills in deals that have no image at all.
 *
 * Runs from GitHub Actions rather than Vercel so it does not depend on the
 * Vercel env var being set yet. The ongoing hourly healer still needs
 * JINA_API_KEY in Vercel to keep new deals covered.
 *
 * Identification note: a stock image is NOT detectable from imageUrl — Sanity's
 * CDN path is the content sha1, not the upload filename. The tell is the asset's
 * originalFilename, which the fallback set to `deal-search-*`.
 */
import { createHash } from 'crypto'

const KEY = (process.env.JINA_API_KEY || '').trim()
const TOKEN = (process.env.SANITY_TOKEN || '').replace(/^ST=/, '').trim()
const DRY = process.env.DRY_RUN === 'true'
const LIMIT = parseInt(process.env.LIMIT || '600', 10)
const PROJECT = 'vbnsqnkg'
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const q = async (query) => {
  const r = await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(query)}`,
    { headers: { Authorization: 'Bearer ' + TOKEN } })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300))
  return j.result
}

const mutate = async (mutations) => {
  const r = await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production?returnDocuments=false`,
    { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mutations }) })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300))
  return j
}

async function uploadToSanity(buf, contentType, filename) {
  const r = await fetch(`https://${PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename=${encodeURIComponent(filename)}`,
    { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': contentType }, body: buf })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 200))
  // Sanity returns { document: { url } } — not { url }.
  return j?.document?.url || null
}

// Markdown mode first. HTML mode returns 200-476KB per product page and Jina
// bills by token — the first backfill burned the entire account balance after
// 178 pages and then reported 297 false "no image" results, because a 402 was
// being swallowed as "not found". Markdown with an image summary is ~19-42KB
// for the same page, roughly a tenth the cost, and still carries the image URL.
async function ogImageFor(productUrl) {
  const attempt = async (headers) => {
    const res = await fetch('https://r.jina.ai/' + productUrl, {
      headers: { 'User-Agent': UA, Authorization: 'Bearer ' + KEY, ...headers },
      signal: AbortSignal.timeout(60000),
    })
    const body = await res.text()
    if (!res.ok) {
      // Surface quota and rate-limit failures instead of letting them look like
      // products that genuinely have no picture.
      const code = res.status === 402 ? 'QUOTA_EXHAUSTED'
                 : res.status === 429 ? 'RATE_LIMITED'
                 : `HTTP_${res.status}`
      throw Object.assign(new Error(code), { fatal: res.status === 402 })
    }
    return body
  }

  let body
  try {
    body = await attempt({ 'x-with-images-summary': 'true', Accept: 'text/plain' })
  } catch (e) {
    if (e.fatal) throw e
    body = await attempt({ 'x-respond-with': 'html', Accept: 'text/html' })
  }

  const og = body.match(/og:image["'\s]+content=["']([^"']+)["']/i)
          || body.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
  if (og) return og[1]

  // Markdown mode: pick the first gun.deals-hosted product image.
  const imgs = [...body.matchAll(/https?:\/\/[^\s)\]"']+/gi)].map(m => m[0])
  return imgs.find(u => /gun\.deals\/(cdn-cgi\/image|sites\/default\/files)/.test(u)) || null
}

// gun.deals wraps its og:image in a Cloudflare image transform sized for social
// cards (w=1200,h=630), which crops tall product shots. The untransformed file
// underneath is the real photo, so prefer it and fall back to the transform.
function nativeUrl(ogUrl) {
  const m = ogUrl.match(/\/cdn-cgi\/image\/[^/]+\/(.+)$/)
  return m ? `https://gun.deals/${m[1]}` : null
}

async function download(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(25000) })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (!ct.startsWith('image/')) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength < 8000) return null   // logos and 1px fallbacks
    return { buf, ct }
  } catch { return null }
}

// ── Gather targets ────────────────────────────────────────────────────────────
const targets = await q(`*[_type=="gunDeal" && source=="gun.deals" && defined(externalUrl)]{
  _id, title, externalUrl, imageUrl, _createdAt,
  "orig": *[_type=="sanity.imageAsset" && url == ^.imageUrl][0].originalFilename
} | order(_createdAt desc)[0...${LIMIT}]`)

const needsFix = targets.filter(d => !d.imageUrl || /^deal-search-/.test(d.orig || ''))
console.log(`${targets.length} gun.deals docs scanned`)
console.log(`  ${needsFix.filter(d => !d.imageUrl).length} with no image`)
console.log(`  ${needsFix.filter(d => d.imageUrl).length} carrying a stock search image`)
console.log(`  ${needsFix.length} to fix${DRY ? '  (DRY RUN)' : ''}\n`)

let fixed = 0, failed = 0
const hashes = new Map()
const batch = []

for (const [i, deal] of needsFix.entries()) {
  const label = (deal.title || '').slice(0, 50)
  try {
    const og = await ogImageFor(deal.externalUrl)
    if (!og) { failed++; console.log(`  ✗ ${label} — no og:image`); continue }

    const img = (await download(nativeUrl(og) || og)) || (await download(og))
    if (!img) { failed++; console.log(`  ✗ ${label} — image not downloadable`); continue }

    const sha = createHash('sha1').update(img.buf).digest('hex').slice(0, 12)
    hashes.set(sha, (hashes.get(sha) || 0) + 1)

    if (DRY) { fixed++; console.log(`  ✓ ${label} — ${img.buf.byteLength}b sha=${sha}`); continue }

    const name = (deal.externalUrl.split('/').pop() || 'deal').slice(0, 60)
    const cdn = await uploadToSanity(img.buf, img.ct, `deal-gundeals-${name}.jpg`)
    if (!cdn) { failed++; console.log(`  ✗ ${label} — upload failed`); continue }

    batch.push({ patch: { id: deal._id, set: { imageUrl: cdn } } })
    fixed++
    console.log(`  ✓ ${label} — ${img.buf.byteLength}b sha=${sha}`)

    if (batch.length >= 50) { await mutate(batch.splice(0, batch.length)) }
  } catch (e) {
    failed++
    console.log(`  ✗ ${label} — ${e.message.slice(0, 90)}`)
    if (e.fatal) {
      console.log(`\n  STOPPING: Jina account balance exhausted after ${fixed} deals.`)
      console.log('  Recharge, then re-run — already-fixed deals are skipped automatically.')
      break
    }
  }
  if (i % 25 === 24) console.log(`  … ${i + 1}/${needsFix.length}`)
}

if (batch.length && !DRY) await mutate(batch)

const reused = [...hashes.values()].filter(n => n > 1).length
console.log(`\nfixed ${fixed}, failed ${failed}`)
console.log(`distinct images: ${hashes.size} across ${fixed} deals`)
console.log(reused === 0
  ? 'PASS — no image is shared between products'
  : `NOTE — ${reused} image(s) appear on more than one deal (duplicate listings are normal)`)
