/**
 * Jina reaches gun.deals. Remaining question: are the og:image URLs DISTINCT
 * real product photos, or one shared social-card banner? Getting this wrong
 * repeats the exact failure we're fixing.
 */
const KEY = (process.env.JINA_API_KEY || '').trim()
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const H = { 'User-Agent': UA }
import { createHash } from 'crypto'

const rss = await (await fetch('https://gun.deals/rss.xml', { headers: H })).text()
const links = [...rss.matchAll(/<link>(https:\/\/gun\.deals\/product\/[^<]+)</g)].map(m => m[1]).slice(0, 6)

const seen = new Map()
for (const l of links) {
  const res = await fetch('https://r.jina.ai/' + l, {
    headers: { ...H, 'x-respond-with': 'html', Authorization: 'Bearer ' + KEY },
    signal: AbortSignal.timeout(60000),
  })
  const html = await res.text()
  const og = (html.match(/og:image["'\s]+content=["']([^"']+)["']/i) || [])[1]
  const name = l.split('/').pop().slice(0, 44)
  if (!og) { console.log(`  ${name.padEnd(46)} NO OG`); continue }

  // Static paths on gun.deals are NOT Cloudflare-blocked — download direct,
  // no proxy needed once we know the URL.
  let dl = 'download failed'
  let hash = ''
  try {
    const r2 = await fetch(og, { headers: H, signal: AbortSignal.timeout(20000) })
    if (r2.ok) {
      const buf = Buffer.from(await r2.arrayBuffer())
      hash = createHash('sha1').update(buf).digest('hex').slice(0, 12)
      dl = `${r2.status} ${buf.byteLength}b ${r2.headers.get('content-type')}`
      seen.set(hash, (seen.get(hash) || 0) + 1)
    } else dl = `HTTP ${r2.status}`
  } catch (e) { dl = e.name }

  console.log(`  ${name.padEnd(46)} ${dl.padEnd(30)} sha=${hash}`)
  console.log(`     og: ${og.slice(0, 130)}`)
}
console.log(`\n  distinct images: ${seen.size} of ${links.length}`)
console.log(seen.size === links.length ? '  PASS — every product has its own image' : '  FAIL — images are being shared across products')
