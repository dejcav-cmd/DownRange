const TOKEN = (process.env.SANITY_TOKEN || '').replace(/^ST=/, '').trim()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept': 'text/html,image/avif,image/webp,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' }

async function q(query) {
  const r = await fetch(`https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(query)}`,
    { headers: { Authorization: 'Bearer ' + TOKEN } })
  const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0,200)); return j.result
}
async function probe(label, url, headers = H) {
  if (!url) return console.log(`   ${label.padEnd(34)} (skip)`)
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
    const ct = res.headers.get('content-type') || ''
    let extra = ''
    if (ct.startsWith('image/')) extra = `${(await res.arrayBuffer()).byteLength}b IMAGE`
    else { const b = await res.text(); extra = `${b.length}b` + (/<loc>|og:image/.test(b) ? ' (has urls/og)' : '') }
    console.log(`   ${label.padEnd(34)} ${res.status}  ${ct.slice(0,28).padEnd(28)} ${extra}`)
  } catch (e) { console.log(`   ${label.padEnd(34)} ${e.name}`) }
}

console.log('=== Do any deals still point at gun.deals-hosted images? ===')
const hosted = await q(`*[_type=="gunDeal" && defined(imageUrl) && imageUrl match "*gun.deals*"][0...5]{title,imageUrl,_createdAt}`)
console.log(`found ${hosted.length}`)
for (const d of hosted) console.log(`   ${d._createdAt.slice(0,10)} ${d.imageUrl.slice(0,110)}`)

console.log('\n=== Is the gun.deals IMAGE CDN blocked, or only HTML pages? ===')
if (hosted[0]) await probe('stored gun.deals image', hosted[0].imageUrl)
await probe('gun.deals favicon', 'https://gun.deals/favicon.ico')
await probe('gun.deals robots.txt', 'https://gun.deals/robots.txt')
await probe('gun.deals sitemap.xml', 'https://gun.deals/sitemap.xml')
await probe('gun.deals rss.xml', 'https://gun.deals/rss.xml')

console.log('\n=== Drupal node paths (RSS guid gives the node id) ===')
const rss = await (await fetch('https://gun.deals/rss.xml', { headers: H })).text()
const item = rss.match(/<item>([\s\S]*?)<\/item>/)?.[1] || ''
const nid = item.match(/<guid[^>]*>(\d+)/)?.[1]
console.log('   node id:', nid)
await probe('/node/{id}', nid && `https://gun.deals/node/${nid}`)
await probe('/node/{id}?_format=json', nid && `https://gun.deals/node/${nid}?_format=json`, { ...H, Accept: 'application/json' })
await probe('/jsonapi/node/product', 'https://gun.deals/jsonapi/node/product?page[limit]=1', { ...H, Accept: 'application/vnd.api+json' })
