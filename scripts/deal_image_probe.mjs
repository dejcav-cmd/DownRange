const TOKEN = (process.env.SANITY_TOKEN || '').replace(/^ST=/, '').trim()
async function q(query) {
  const r = await fetch(`https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(query)}`,
    { headers: { Authorization: 'Bearer ' + TOKEN } })
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0,300)); return j.result
}
const since = new Date(Date.now() - 5 * 86400000).toISOString()
const deals = await q(`*[_type=="gunDeal" && _createdAt > "${since}"]|order(_createdAt desc){_id,title,externalUrl,imageUrl,_createdAt}`)

const counts = {}
for (const d of deals) { const k = (d.imageUrl||'none').split('/').pop().split('?')[0]; counts[k] = (counts[k]||0)+1 }
const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1])
console.log(`${deals.length} deals, ${sorted.length} distinct images\n`)
console.log('=== most-reused images ===')
for (const [k,n] of sorted.slice(0,12)) console.log(`  ${String(n).padStart(4)}x  ${k}`)

console.log('\n=== examples sharing the top image ===')
const top = sorted[0][0]
for (const d of deals.filter(d => (d.imageUrl||'').includes(top)).slice(0,8)) console.log(`  ${d.title.slice(0,70)}`)
console.log('\n  full url:', deals.find(d=>(d.imageUrl||'').includes(top))?.imageUrl)

console.log('\n=== images used exactly once (likely genuine) ===')
console.log(`  ${sorted.filter(([,n])=>n===1).length} of ${sorted.length}`)

// Asset metadata for the worst offenders
const ids = sorted.slice(0,5).map(([k])=>k.replace(/-\d+x\d+\.\w+$/,''))
const assets = await q(`*[_type=="sanity.imageAsset" && sha1hash in [${ids.map(i=>`"${i}"`).join(',')}]]{sha1hash,originalFilename,size,metadata{dimensions}}`)
console.log('\n=== asset metadata ===')
for (const a of assets) console.log(`  ${a.originalFilename} ${a.metadata?.dimensions?.width}x${a.metadata?.dimensions?.height} ${a.size}b`)
