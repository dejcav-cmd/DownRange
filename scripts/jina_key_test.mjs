/**
 * Two independent questions, answered separately:
 *   1. Does an API key get us past the Cloudflare wall in front of r.jina.ai?
 *   2. If so, can Jina's own fetchers get through gun.deals' Cloudflare?
 * A pass on (1) with a fail on (2) means a paid Jina plan buys nothing here.
 */
const KEY = (process.env.JINA_API_KEY || '').trim()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

console.log('key present:', Boolean(KEY), KEY ? `(${KEY.slice(0, 12)}…, ${KEY.length} chars)` : '')

async function via(target, { key = true, respondWith = 'html' } = {}) {
  const h = { 'User-Agent': UA, 'Accept': 'text/html' }
  if (respondWith) h['x-respond-with'] = respondWith
  if (key && KEY) h['Authorization'] = 'Bearer ' + KEY
  const t0 = Date.now()
  try {
    const res = await fetch('https://r.jina.ai/' + target, { headers: h, signal: AbortSignal.timeout(60000) })
    const body = await res.text()
    const og = (body.match(/og:image["'\s]+content=["']([^"']+)["']/i)
             || body.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i) || [])[1]
    const cf = /just a moment|cf-browser-verification|attention required/i.test(body.slice(0, 1500))
    return { status: res.status, ms: Date.now() - t0, bytes: body.length, cloudflare: cf, og, head: body.slice(0, 160).replace(/\s+/g, ' ') }
  } catch (e) { return { status: 0, ms: Date.now() - t0, error: e.name } }
}

const show = (label, r) => console.log(
  `  ${label.padEnd(30)} ${String(r.status).padEnd(4)} ${String(r.ms).padStart(6)}ms ${String(r.bytes ?? 0).padStart(8)}b` +
  `${r.cloudflare ? ' [CF-WALL]' : ''}${r.og ? ' og=' + r.og.slice(0, 55) : ''}${r.error ? ' ' + r.error : ''}\n` +
  (r.head && !r.og ? `       ${r.head}\n` : ''))

console.log('\n=== 1. Can we reach Jina at all? (example.com as control) ===')
show('no key', await via('https://example.com', { key: false }))
show('with key', await via('https://example.com'))

console.log('\n=== 2. Can Jina reach gun.deals? ===')
const rss = await (await fetch('https://gun.deals/rss.xml', { headers: { 'User-Agent': UA } })).text()
const links = [...rss.matchAll(/<link>(https:\/\/gun\.deals\/product\/[^<]+)</g)].map(m => m[1]).slice(0, 3)
for (const [i, l] of links.entries()) {
  console.log(`\n  product ${i + 1}: ${l.slice(0, 95)}`)
  show('  html mode', await via(l))
  show('  markdown mode', await via(l, { respondWith: null }))
}
