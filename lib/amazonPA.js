/**
 * Amazon Product Advertising API 5.0 client
 * Uses AWS Signature Version 4 — no external deps, pure Node.js crypto
 *
 * Required env vars:
 *   AMAZON_ACCESS_KEY      – PA API access key
 *   AMAZON_SECRET_KEY      – PA API secret key
 *   AMAZON_ASSOCIATE_TAG   – Associate tag (e.g. "downrange-20")
 */

import { createHmac, createHash } from 'crypto'

const SERVICE  = 'ProductAdvertisingAPI'
const REGION   = 'us-east-1'
const HOST     = 'webservices.amazon.com'
const ENDPOINT = 'https://webservices.amazon.com/paapi5/searchitems'
const TARGET   = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems'

// ── Signing helpers ────────────────────────────────────────────────────────────
function sha256hex(data) {
  return createHash('sha256').update(data, 'utf8').digest('hex')
}
function hmac(key, data) {
  return createHmac('sha256', key).update(data, 'utf8').digest()
}
function signingKey(secretKey, dateStamp) {
  const kDate    = hmac('AWS4' + secretKey, dateStamp)
  const kRegion  = hmac(kDate,    REGION)
  const kService = hmac(kRegion,  SERVICE)
  return         hmac(kService, 'aws4_request')
}

// ── Core request ───────────────────────────────────────────────────────────────
export async function paSearchItems(params) {
  const accessKey  = process.env.AMAZON_ACCESS_KEY
  const secretKey  = process.env.AMAZON_SECRET_KEY
  const partnerTag = process.env.AMAZON_ASSOCIATE_TAG

  if (!accessKey || !secretKey || !partnerTag) {
    throw new Error('Amazon PA API env vars not configured (AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY / AMAZON_ASSOCIATE_TAG)')
  }

  const body = JSON.stringify({
    PartnerTag:   partnerTag,
    PartnerType:  'Associates',
    Marketplace:  'www.amazon.com',
    ...params,
  })

  const now       = new Date()
  const amzDate   = now.toISOString().replace(/[:\-]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const dateStamp = amzDate.slice(0, 8)

  // Canonical request — headers MUST be sorted alphabetically
  const headers = {
    'content-encoding': 'amz-1.0',
    'content-type':     'application/json; charset=utf-8',
    'host':             HOST,
    'x-amz-date':       amzDate,
    'x-amz-target':     TARGET,
  }
  const sortedKeys    = Object.keys(headers).sort()
  const canonHeaders  = sortedKeys.map(k => `${k}:${headers[k]}`).join('\n') + '\n'
  const signedHeaders = sortedKeys.join(';')

  const canonRequest = [
    'POST',
    '/paapi5/searchitems',
    '',           // no query string
    canonHeaders,
    signedHeaders,
    sha256hex(body),
  ].join('\n')

  const credScope   = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const strToSign   = ['AWS4-HMAC-SHA256', amzDate, credScope, sha256hex(canonRequest)].join('\n')
  const signature   = createHmac('sha256', signingKey(secretKey, dateStamp))
                        .update(strToSign, 'utf8').digest('hex')
  const authHeader  = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { ...headers, Authorization: authHeader },
    body,
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '(no body)')
    throw new Error(`PA API ${res.status}: ${txt.slice(0, 300)}`)
  }

  return res.json()
}

// ── Search helper ──────────────────────────────────────────────────────────────
/**
 * Search Amazon for firearm-adjacent products on deal.
 * Returns an array of normalised deal objects.
 */
export async function searchFirearmsDeals(keywords, {
  searchIndex      = 'SportingGoods',
  itemCount        = 10,
  minSavePercent   = 5,
  sortBy           = 'AvgCustomerReviews',
} = {}) {
  const data = await paSearchItems({
    Keywords:         keywords,
    SearchIndex:      searchIndex,
    ItemCount:        itemCount,
    SortBy:           sortBy,
    ...(minSavePercent > 0 ? { MinSavingPercent: minSavePercent } : {}),
    Resources: [
      'Images.Primary.Large',
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'Offers.Listings.Price',
      'Offers.Listings.Price.Savings',
      'Offers.Listings.SavingBasis',
      'Offers.Listings.DeliveryInfo.IsPrimeEligible',
      'Offers.Listings.IsBuyBoxWinner',
    ],
  })

  const items = data?.SearchResult?.Items || []
  return items.map(normalizeItem).filter(Boolean)
}

function normalizeItem(item) {
  try {
    const asin     = item.ASIN
    if (!asin) return null

    const title    = item.ItemInfo?.Title?.DisplayValue || ''
    if (!title)    return null

    const listing  = item.Offers?.Listings?.[0]
    const price    = listing?.Price
    const saving   = price?.Savings
    const basis    = listing?.SavingBasis

    const priceAmt = price?.DisplayAmount || null
    const saveAmt  = saving?.DisplayAmount || null
    const savePct  = saving?.Percentage   || 0
    const origAmt  = basis?.DisplayAmount || null
    const isPrime  = listing?.DeliveryInfo?.IsPrimeEligible || false

    const brand    = item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || ''
    const imgUrl   = item.Images?.Primary?.Large?.URL || null

    const tag        = process.env.AMAZON_ASSOCIATE_TAG
    const affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${tag}&linkCode=ogi&th=1&psc=1`

    // Build a readable summary
    const parts = []
    if (priceAmt) parts.push(priceAmt)
    if (savePct > 0 && origAmt) parts.push(`↓${savePct}% off ${origAmt}`)
    if (isPrime) parts.push('Prime')
    if (brand) parts.push(brand)

    return {
      asin,
      title,
      affiliateUrl,
      imageUrl:    imgUrl,
      price:       priceAmt,
      savingPct:   savePct,
      summary:     parts.join(' · '),
      isPrime,
      brand,
    }
  } catch {
    return null
  }
}
