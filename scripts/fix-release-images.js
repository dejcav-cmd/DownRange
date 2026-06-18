
const https = require('https')
const PROJECT_ID = 'vbnsqnkg'
const DATASET = 'production'
const TOKEN = process.env.SANITY_API_TOKEN

const CAT_IMGS = {
  Pistol:    '/img/photos/pistol.jpg',
  Revolver:  '/img/photos/pistol.jpg',
  Rifle:     '/img/photos/rifle.jpg',
  Shotgun:   '/img/photos/shotgun.jpg',
  Suppressor:'/img/photos/suppressor.jpg',
}

function req(path, method, body) {
  return new Promise((res, rej) => {
    const b = body ? JSON.stringify(body) : null
    const r = https.request({
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/${path}`,
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', ...(b?{'Content-Length':Buffer.byteLength(b)}:{}) }
    }, resp => {
      let d = ''; resp.on('data', c => d += c)
      resp.on('end', () => { try { res(JSON.parse(d)) } catch { res({}) } })
    })
    r.on('error', rej); if (b) r.write(b); r.end()
  })
}

async function run() {
  const q = encodeURIComponent('*[_type=="firearmRelease"]{_id,category,imageUrl}')
  const { result: docs } = await req(`query/${DATASET}?query=${q}`, 'GET')
  console.log(`Total releases: ${docs.length}`)
  
  // Find ones with external/missing images
  const toFix = docs.filter(d => 
    !d.imageUrl || 
    d.imageUrl.includes('unsplash.com') || 
    d.imageUrl.includes('pexels.com')
  )
  console.log(`Need fixing: ${toFix.length}`)
  
  if (!toFix.length) { console.log('All good!'); return }
  
  const mutations = toFix.map(d => ({
    patch: {
      id: d._id,
      set: { imageUrl: CAT_IMGS[d.category] || '/img/photos/pistol.jpg' }
    }
  }))
  
  // Batch in 50s
  for (let i = 0; i < mutations.length; i += 50) {
    const batch = mutations.slice(i, i + 50)
    const result = await req(`mutate/${DATASET}`, 'POST', { mutations: batch })
    console.log(`Patched batch ${Math.floor(i/50)+1}: ${batch.length} docs`)
  }
  console.log(`Done - fixed ${toFix.length} releases`)
}
run().catch(e => { console.error(e); process.exit(1) })
