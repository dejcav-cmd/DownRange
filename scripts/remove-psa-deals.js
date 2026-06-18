const https = require('https')
const PROJECT_ID = 'vbnsqnkg', DATASET = 'production', TOKEN = process.env.SANITY_API_TOKEN

function sanityReq(path, method, body) {
  return new Promise((resolve, reject) => {
    const b = body ? JSON.stringify(body) : null
    const req = https.request({
      hostname: `${PROJECT_ID}.api.sanity.io`, path: `/v2024-01-01/data/${path}`, method,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(b ? { 'Content-Length': Buffer.byteLength(b) } : {}) }
    }, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve(JSON.parse(d))}catch{resolve({})} }) })
    req.on('error', reject); if(b) req.write(b); req.end()
  })
}

async function run() {
  const q = encodeURIComponent(`*[_type=="firearmRelease" && (
    model match "*Kit*" || model match "*kit*" || model match "*Deal*" || model match "*deal*" ||
    model match "*Brace*" || title match "*Kit*" || title match "*Daily Deal*" || title match "*Blem*"
  )]{_id, brand, model}`)
  const { result } = await sanityReq(`query/${DATASET}?query=${q}`, 'GET')
  if (!result?.length) { console.log('No bad entries found'); return }
  console.log(`Deleting ${result.length}:`, result.map(d => `${d.brand} — ${d.model}`))
  await sanityReq(`mutate/${DATASET}`, 'POST', { mutations: result.map(d => ({ delete: { id: d._id } })) })
  console.log('✓ Done')
}
run().catch(e => { console.error(e); process.exit(1) })
