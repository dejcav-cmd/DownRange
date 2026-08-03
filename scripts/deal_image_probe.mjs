/**
 * Why are recent gunDeal docs showing generic stock photos?
 * 1. Audit what the last few days actually got written with.
 * 2. Find a transport that can reach a real product image again.
 */
const TOKEN = (process.env.SANITY_TOKEN || '').replace(/^ST=/, '').trim()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' }

async function q(query) {
  const r = await fetch(`https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=${encodeURIComponent(query)}`,
    { headers: { Authorization: 'Bearer ' + TOKEN } })
  const j = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300))
  return j.result
}

console.log('=== RECENT gunDeal DOCS (last 5 days) ===')
const since = new Date(Date.now() - 5 * 86400000).toISOString()
const deals = await q(`*[_type=="gunDeal" && _createdAt > "${since}"]|order(_createdAt desc){_id,title,source,externalUrl,imageUrl,_createdAt}`)
console.log(`count: ${deals.length}`)

const byDay = {}, bySource = {}
let stock = 0, real = 0, none = 0
for (const d of deals) {
  const day = d._createdAt.slice(0, 10)
  byDay[day] = (byDay[day] || 0) + 1
  bySource[d.source || '?'] = (bySource[d.source || '?'] || 0) + 1
  if (!d.imageUrl) none++
  else if (/deal-search-/.test(d.imageUrl)) stock++
  else real++
}
console.log('by day:', JSON.stringify(byDay))
console.log('by source:', JSON.stringify(bySource))
console.log(`imageUrl: ${real} non-search, ${stock} stock-search, ${none} none`)

console.log('\nsample (10):')
for (const d of deals.slice(0, 10)) {
  const kind = !d.imageUrl ? 'NONE ' : /deal-search-/.test(d.imageUrl) ? 'STOCK' : 'real '
  console.log(`  ${kind} ${(d.title || '').slice(0, 48).padEnd(48)} ${(d.imageUrl || '').split('/').pop()?.slice(0, 48)}`)
}

console.log('\n=== RSS ITEM STRUCTURE ===')
const rss = await (await fetch('https://gun.deals/rss.xml', { headers: H })).text()
const first = rss.match(/<item>([\s\S]*?)<\/item>/)?.[1] || ''
console.log(first.slice(0, 1200))

console.log('\n=== TRANSPORT TESTS ===')
const link = first.match(/<link>([^<]+)<\/link>/)?.[1]
const storeHref = first.match(/Store:\s*<a[^>]+href="([^"]+)"/)?.[1]
  || first.match(/Store:\s*&lt;a[^&]+href=&quot;([^&]+)&quot;/)?.[1]
console.log('product link:', link)
console.log('store href  :', storeHref)

async function probe(label, url, headers = H) {
  if (!url) return console.log(`   ${label.padEnd(30)} (no url)`)
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
    const body = res.ok ? await res.text() : ''
    const og = (body.match(/og:image["'\s]+content=["']([^"']+)["']/i)
             || body.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i) || [])[1]
    console.log(`   ${label.padEnd(30)} HTTP ${res.status} ${String(body.length).padStart(7)}b og=${og ? og.slice(0, 60) : 'none'}`)
    return og
  } catch (e) {
    console.log(`   ${label.padEnd(30)} ${e.name}`)
  }
}

await probe('gun.deals direct', link)
await probe('gun.deals + jina', link && 'https://r.jina.ai/' + link, { ...H, 'x-respond-with': 'html' })
await probe('gun.deals + allorigins', link && 'https://api.allorigins.win/raw?url=' + encodeURIComponent(link))
await probe('gun.deals + codetabs', link && 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(link))
await probe('merchant direct', storeHref)
