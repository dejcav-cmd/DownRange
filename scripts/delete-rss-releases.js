/**
 * Deletes all firearmRelease docs sourced from RSS/media sites
 * (not from manufacturer pages). These pulled deals, reviews, etc.
 */
const https = require('https')
const PROJECT_ID = 'vbnsqnkg'
const DATASET    = 'production'
const TOKEN      = process.env.SANITY_API_TOKEN

const BAD_DOMAINS = [
  'ammoland.com', 'thetruthaboutguns.com', 'pewpewtactical.com',
  'guns.com', 'gunsandammo.com', 'americanrifleman.org',
  'shootingillustrated.com', 'handgunsmag.com', 'rifleshootermag.com',
  'outdoorlife.com', 'fieldandstream.com', 'prnewswire.com',
  'businesswire.com', 'yahoo.com', 'msn.com',
  // PSA deals specifically
  'palmettostatearmory.com/daily-deal',
  'palmettostatearmory.com/ar15-parts',
  'palmettostatearmory.com/shop',
]

function sanityReq(path, method, body) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/${path}`, method,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json',
        ...(b ? { 'Content-Length': Buffer.byteLength(b) } : {}) }
    }, res => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve({}) } })
    })
    req.on('error', reject); if (b) req.write(b); req.end()
  })
}

async function run() {
  const q = encodeURIComponent('*[_type=="firearmRelease"]{_id, brand, model, sourceUrl}')
  const { result: docs } = await sanityReq(`query/${DATASET}?query=${q}`, 'GET')
  console.log(`Total releases: ${docs.length}`)

  const toDelete = docs.filter(d => {
    const url = (d.sourceUrl || '').toLowerCase()
    return BAD_DOMAINS.some(domain => url.includes(domain))
  })

  console.log(`\nMarked for deletion: ${toDelete.length}`)
  toDelete.forEach(d => console.log(`  ✗ [${d.brand}] ${d.model} — ${(d.sourceUrl||'').slice(0,70)}`))

  if (!toDelete.length) { console.log('Nothing to delete.'); return }

  // Delete in batches
  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50)
    const res = await sanityReq(`mutate/${DATASET}`, 'POST', {
      mutations: batch.map(d => ({ delete: { id: d._id } }))
    })
    if (res.error) console.error('Error:', res.error)
    else console.log(`Deleted batch ${Math.floor(i/50)+1}: ${batch.length}`)
  }
  console.log(`\n✓ Deleted ${toDelete.length} RSS-sourced releases`)
}
run().catch(e => { console.error(e); process.exit(1) })
