/**
 * Deletes obviously bad releases — horoscopes, news articles, non-gun content
 */
const https = require('https')

const PROJECT_ID = 'vbnsqnkg'
const DATASET    = 'production'
const TOKEN      = process.env.SANITY_API_TOKEN

function sanityRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/${path}`,
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    }
    const req = https.request(opts, res => {
      let d = ''
      res.on('data', c => (d += c))
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { reject(new Error(d.slice(0,200))) } })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

// Patterns that indicate NOT a gun release
const BAD_PATTERNS = [
  /horoscope/i, /astrology/i, /zodiac/i, /gemini.*today/i, /aries.*today/i, /taurus.*today/i,
  /family feud/i, /ultra luxury.*ford/i, /ford.*luxury/i, /socom contract/i,
  /department of/i, /commonwealths attorney/i, /commonwealth/i,
  /journal/i, /newspaper/i, /music in/i, /nra.*groups/i, /attorneys/i,
  /court/i, /lawsuit/i, /senate/i, /congress/i, /politics/i,
  /2026 ford/i, /toyota/i, /honda/i, /chevrolet/i,
  /fascinating family/i, /today for june/i, /june \d+, 202/i,
  /opportunity/i, /emotional decision/i,
]

// Bad source domains
const BAD_DOMAINS = [
  'economictimes', 'indiatimes', 'horoscope', 'astrology', 'timesofindia',
  'ndtv', 'hindustantimes', 'yahoo.com/horoscope', 'dailymail.co.uk',
  'theguardian.com/sport', 'nytimes.com/sports',
]

async function run() {
  console.log('Fetching all releases...')
  const query = encodeURIComponent(
    '*[_type=="firearmRelease"] { _id, title, model, brand, sourceUrl, publishedAt } | order(publishedAt desc) [0...500]'
  )
  const { result: docs } = await sanityRequest(`query/${DATASET}?query=${query}`)
  console.log(`Found ${docs.length} releases`)

  const toDelete = docs.filter(doc => {
    const text = `${doc.title} ${doc.model} ${doc.sourceUrl}`.toLowerCase()
    const isBadPattern = BAD_PATTERNS.some(rx => rx.test(text))
    const isBadDomain  = BAD_DOMAINS.some(d => (doc.sourceUrl||'').toLowerCase().includes(d))
    const isBadModel   = doc.model && (
      /today|june|gemini|horoscope|astrology|family feud|ford|toyota|senate|congress|lawsuit|socom contract|department of/i.test(doc.model) ||
      doc.model.length > 60  // model names should be short
    )
    return isBadPattern || isBadDomain || isBadModel
  })

  console.log(`\nMarked for deletion: ${toDelete.length}`)
  toDelete.forEach(d => console.log(`  ✗ [${d.brand}] ${d.model} — ${(d.sourceUrl||'').slice(0,70)}`))

  if (toDelete.length === 0) { console.log('Nothing to delete.'); return }

  // Delete in batches of 50
  const batchSize = 50
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize)
    const mutations = batch.map(d => ({ delete: { id: d._id } }))
    const res = await sanityRequest(`mutate/${DATASET}`, 'POST', { mutations })
    if (res.error) console.error('Delete error:', res.error)
    else console.log(`Deleted batch ${Math.floor(i/batchSize)+1}: ${batch.length} docs`)
  }

  console.log(`\n✓ Deleted ${toDelete.length} bad releases`)
}

run().catch(e => { console.error(e); process.exit(1) })
