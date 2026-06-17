/**
 * Patches all firearmRelease docs missing imageUrl
 * Uses category-based Unsplash images as fallback
 * Run: node scripts/patch-releases-images.js
 */
const https = require('https')

const PROJECT_ID = 'vbnsqnkg'
const DATASET = 'production'
const TOKEN = process.env.SANITY_API_TOKEN

const CATEGORY_IMAGES = {
  Pistol:     'https://images.unsplash.com/photo-1578302758063-aaff0d54e35f?w=800&q=80',
  Rifle:      'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80',
  Shotgun:    'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80',
  Suppressor: 'https://images.unsplash.com/photo-1580261450046-d0a30080dc9b?w=800&q=80',
  Revolver:   'https://images.unsplash.com/photo-1578302758063-aaff0d54e35f?w=800&q=80',
  default:    'https://images.unsplash.com/photo-1578302758063-aaff0d54e35f?w=800&q=80',
}

function sanityFetch(path, method='GET', body=null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      }
    }
    const req = https.request(opts, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch(e) { reject(new Error('Parse error: ' + data.slice(0,200))) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function run() {
  // Fetch all releases missing imageUrl
  const query = encodeURIComponent(
    '*[_type=="firearmRelease" && !defined(imageUrl) && !defined(heroImage)]{_id, category, brand, model}'
  )
  const result = await sanityFetch(`query/${DATASET}?query=${query}`)
  const docs = result.result || []
  console.log(`Found ${docs.length} releases without images`)
  
  if (docs.length === 0) {
    console.log('All releases already have images!')
    return
  }

  // Batch mutations - 50 at a time
  const batchSize = 50
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize)
    const mutations = batch.map(doc => ({
      patch: {
        id: doc._id,
        set: {
          imageUrl: CATEGORY_IMAGES[doc.category] || CATEGORY_IMAGES.default
        }
      }
    }))
    
    const res = await sanityFetch(`mutate/${DATASET}`, 'POST', { mutations })
    if (res.error) {
      console.error('Mutation error:', res.error)
    } else {
      console.log(`Patched batch ${Math.floor(i/batchSize)+1}: ${batch.length} releases`)
    }
    
    // Small delay between batches
    await new Promise(r => setTimeout(r, 500))
  }
  
  console.log('✓ Done patching all releases with images')
}

run().catch(e => { console.error(e); process.exit(1) })
