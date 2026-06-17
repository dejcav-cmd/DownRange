/**
 * Deletes ALL firearmRelease documents from Sanity — complete reset
 */
const https = require('https')
const PROJECT_ID = 'vbnsqnkg'
const DATASET    = 'production'
const TOKEN      = process.env.SANITY_API_TOKEN

function sanityRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : null
    const opts = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/${path}`,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(b ? { 'Content-Length': Buffer.byteLength(b) } : {}),
      },
    }
    const req = https.request(opts, res => {
      let d = ''
      res.on('data', c => (d += c))
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch { resolve({ raw: d }) } })
    })
    req.on('error', reject)
    if (b) req.write(b)
    req.end()
  })
}

async function run() {
  let total = 0
  let round = 0
  while (true) {
    round++
    const q = encodeURIComponent('*[_type=="firearmRelease"][0...100]{_id}')
    const { result: docs } = await sanityRequest(`query/${DATASET}?query=${q}`)
    if (!docs?.length) break
    console.log(`Round ${round}: deleting ${docs.length} releases...`)
    const mutations = docs.map(d => ({ delete: { id: d._id } }))
    const res = await sanityRequest(`mutate/${DATASET}`, 'POST', { mutations })
    if (res.error) { console.error('Error:', res.error); break }
    total += docs.length
    await new Promise(r => setTimeout(r, 300))
  }
  console.log(`\n✓ Deleted ${total} releases total. Sanity is clean.`)
}
run().catch(e => { console.error(e); process.exit(1) })
