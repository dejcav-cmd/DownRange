/**
 * gun-deals uses r.jina.ai to scrape og:image off gun.deals product pages.
 * Jina now 403s datacenter IPs, so that path returns null on every deal and the
 * deals page falls back to placeholders. This checks whether a direct fetch can
 * replace it before anyone rewrites that cron.
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' }

async function tryFetch(label, url, headers) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
    const body = res.ok ? await res.text() : ''
    const og = (body.match(/og:image["'\s]+content=["']([^"']+)["']/i) || [])[1]
    console.log(`   ${label.padEnd(22)} HTTP ${res.status}  ${String(body.length).padStart(7)}b  og:image=${og ? og.slice(0, 70) : 'none'}`)
    return { ok: res.ok, og }
  } catch (e) {
    console.log(`   ${label.padEnd(22)} ${e.name}`)
    return { ok: false }
  }
}

console.log('\n=== gun.deals image transport ===')
const rss = await tryFetch('gun.deals RSS', 'https://gun.deals/rss.xml', H)
let productUrl = null
if (rss.ok) {
  const res = await fetch('https://gun.deals/rss.xml', { headers: H })
  const xml = await res.text()
  productUrl = (xml.match(/<link>(https:\/\/gun\.deals\/product\/[^<]+)</) || [])[1]
}
console.log(`   sample product: ${productUrl || 'none found'}`)
if (productUrl) {
  await tryFetch('direct', productUrl, H)
  await tryFetch('via r.jina.ai', 'https://r.jina.ai/' + productUrl, { ...H, 'x-respond-with': 'html' })
}

// If neither transport can reach a product page, the RSS feed itself is the
// only remaining image source — check whether it carries them.
console.log('\n=== gun.deals RSS image content ===')
const res = await fetch('https://gun.deals/rss.xml', { headers: H })
const xml = await res.text()
const patterns = {
  'media:content':  /<media:content[^>]+url=["']([^"']+)["']/gi,
  'media:thumbnail': /<media:thumbnail[^>]+url=["']([^"']+)["']/gi,
  'enclosure':      /<enclosure[^>]+url=["']([^"']+)["']/gi,
  '<img> in body':  /&lt;img[^&]*src=&quot;([^&]+)&quot;|<img[^>]+src=["']([^"']+)["']/gi,
  'any image url':  /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi,
}
for (const [name, re] of Object.entries(patterns)) {
  const hits = [...xml.matchAll(re)].map(m => m[1] || m[2] || m[0]).filter(Boolean)
  console.log(`   ${name.padEnd(18)} ${String(hits.length).padStart(4)} hits  ${hits[0] ? hits[0].slice(0, 85) : ''}`)
}
