/**
 * The backfill went 10/12 on a small sample then 178/475 at scale — that smells
 * like a quota or rate limit, not "these products have no image". Distinguish
 * them by reporting the actual HTTP status, and measure how much cheaper
 * markdown mode is (HTML responses were 200-476KB each, which burns a free-tier
 * token budget fast).
 */
const KEY = (process.env.JINA_API_KEY || '').trim()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const rss = await (await fetch('https://gun.deals/rss.xml', { headers: { 'User-Agent': UA } })).text()
const links = [...rss.matchAll(/<link>(https:\/\/gun\.deals\/product\/[^<]+)</g)].map(m => m[1]).slice(0, 5)

async function call(url, headers) {
  const t0 = Date.now()
  const res = await fetch('https://r.jina.ai/' + url, {
    headers: { 'User-Agent': UA, Authorization: 'Bearer ' + KEY, ...headers },
    signal: AbortSignal.timeout(60000),
  })
  const body = await res.text()
  return { status: res.status, ms: Date.now() - t0, bytes: body.length, body,
           remaining: res.headers.get('x-ratelimit-remaining') || res.headers.get('x-token-budget-remaining') || '' }
}

console.log('=== HTML mode (what the backfill used) ===')
for (const l of links.slice(0, 2)) {
  const r = await call(l, { 'x-respond-with': 'html', Accept: 'text/html' })
  const og = (r.body.match(/og:image["'\s]+content=["']([^"']+)["']/i) || [])[1]
  console.log(`  ${r.status} ${String(r.bytes).padStart(7)}b ${String(r.ms).padStart(6)}ms rl=${r.remaining} og=${og ? 'yes' : 'NO'}`)
  if (r.status !== 200) console.log(`     ${r.body.slice(0, 220).replace(/\s+/g, ' ')}`)
}

console.log('\n=== markdown + images summary (candidate: ~10x smaller) ===')
for (const l of links) {
  const r = await call(l, { 'x-with-images-summary': 'true', Accept: 'text/plain' })
  // Jina lists images as "Images: 1. url" or inline ![alt](url)
  const imgs = [...r.body.matchAll(/https?:\/\/[^\s)\]"']+?(?:\.(?:jpg|jpeg|png|webp)|cdn-cgi\/image\/[^\s)\]"']+)/gi)].map(m => m[0])
  const product = imgs.find(u => /sites\/default\/files|cdn-cgi\/image/.test(u))
  console.log(`  ${r.status} ${String(r.bytes).padStart(7)}b ${String(r.ms).padStart(6)}ms imgs=${imgs.length} pick=${product ? product.slice(0, 70) : 'NONE'}`)
  if (r.status !== 200) console.log(`     ${r.body.slice(0, 220).replace(/\s+/g, ' ')}`)
}

console.log('\n=== Is JINA_API_KEY live on Vercel? ===')
try {
  const res = await fetch('https://www.downrangeco.com/api/admin/scrape-diag?url=' +
    encodeURIComponent(links[0]), { headers: { 'x-admin-key': process.env.ADMIN_KEY }, signal: AbortSignal.timeout(90000) })
  const j = await res.json()
  console.log('  hasJinaKey:', j.hasJinaKey)
  for (const a of j.attempts || []) console.log(`    ${a.label.padEnd(22)} ${a.status} ${a.ogImage ? 'og=yes' : ''}`)
} catch (e) { console.log('  diag failed:', e.message.slice(0, 100)) }
