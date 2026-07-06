// Runs from GitHub Actions (Azure IP) — can reach gun.deals + our deployed API.
// Pinpoints which step of the deal-image pipeline is failing.
import { writeFileSync } from 'fs'

const OUT = 'scripts/deals-image-diagnosis.txt'
const lines = []
const log = (s = '') => { lines.push(s); console.log(s) }

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const RSS = 'https://gun.deals/rss.xml'

async function scrapeOG(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, signal: AbortSignal.timeout(15000) })
  if (!res.ok) return { ok: false, status: res.status }
  const html = await res.text()
  const m = html.match(/<meta[\s\S]*?property=["']og:image["'][\s\S]*?content=["']([^"']+)["']/i)
         || html.match(/<meta[\s\S]*?content=["']([^"']+)["'][\s\S]*?property=["']og:image["']/i)
  if (!m) {
    const im = html.match(/sites\/default\/files\/[^"'\s]+\.(jpg|jpeg|png|webp|gif)/i)
    return { ok: !!im, og: im ? 'https://gun.deals/' + im[0] : null, note: im ? 'from img tag' : 'NO og:image' }
  }
  let og = m[1].trim()
  let raw = og
  const cc = og.match(/\/cdn-cgi\/image\/[^\/]+\/(.+)/)
  if (cc) { raw = cc[1].startsWith('http') ? cc[1] : 'https://gun.deals/' + cc[1].replace(/^\//, '') }
  return { ok: true, og, raw }
}

async function tryDownload(label, url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://gun.deals/', 'Accept': 'image/*' }, signal: AbortSignal.timeout(15000) })
    const ct = res.headers.get('content-type') || ''
    let bytes = 0
    if (res.ok) bytes = (await res.arrayBuffer()).byteLength
    log(`    ${label}: HTTP ${res.status} · ${ct} · ${bytes} bytes ${res.ok && bytes > 1000 ? '✓' : '✗'}`)
    return res.ok && bytes > 1000
  } catch (e) { log(`    ${label}: ERROR ${e.message} ✗`); return false }
}

async function main() {
  log('=== DEAL IMAGE PIPELINE DIAGNOSIS ===')
  log('time: ' + new Date().toISOString())

  // 1) Live API imageUrl distribution
  log('\n--- 1) Live /api/deals imageUrl distribution ---')
  try {
    const r = await fetch('https://www.downrangeco.com/api/deals?sort=new', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) })
    log('  /api/deals HTTP ' + r.status)
    if (r.ok) {
      const { deals = [] } = await r.json()
      let nullc = 0, sanity = 0, proxy = 0, gundeals = 0, other = 0
      for (const d of deals) {
        const u = d.imageUrl || ''
        if (!u) nullc++
        else if (u.includes('cdn.sanity.io')) sanity++
        else if (u.includes('/api/img-proxy')) proxy++
        else if (u.includes('gun.deals')) gundeals++
        else other++
      }
      log(`  total:${deals.length}  null:${nullc}  sanity:${sanity}  proxy:${proxy}  gundeals:${gundeals}  other:${other}`)
      const sample = deals.find(d => d.imageUrl)
      if (sample) log('  sample imageUrl: ' + sample.imageUrl.slice(0, 120))
    }
  } catch (e) { log('  ERROR: ' + e.message) }

  // 2) Test the scrape+download pipeline on 5 real product pages
  log('\n--- 2) Pipeline test on 5 real gun.deals product pages ---')
  let pages = []
  try {
    const xml = await (await fetch(RSS, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) })).text()
    pages = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1]).filter(u => u.includes('gun.deals') && !u.endsWith('rss.xml')).slice(0, 5)
    log('  got ' + pages.length + ' product links from RSS')
  } catch (e) { log('  RSS ERROR: ' + e.message) }

  for (const page of pages) {
    log('\n  PAGE: ' + page.slice(0, 90))
    const og = await scrapeOG(page).catch(e => ({ ok: false, note: e.message }))
    if (!og.ok) { log('    scrapeOG: FAILED — ' + (og.note || og.status)); continue }
    log('    og:image = ' + (og.og || '').slice(0, 100))
    if (og.raw && og.raw !== og.og) log('    unwrapped = ' + og.raw.slice(0, 100))
    if (og.og) await tryDownload('download og-as-is  ', og.og)
    if (og.raw && og.raw !== og.og) await tryDownload('download unwrapped ', og.raw)
    if (og.og) await tryDownload('via our proxy      ', 'https://www.downrangeco.com/api/img-proxy?url=' + encodeURIComponent(og.og))
  }

  // 3) What image data does the RSS itself carry?
  log('\n--- 3) RSS item structure (looking for embedded images) ---')
  try {
    const xml = await (await fetch(RSS, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) })).text()
    const item = xml.match(/<item>([\s\S]*?)<\/item>/)
    if (item) {
      const block = item[1]
      log('  has <enclosure>: ' + /<enclosure/i.test(block))
      const enc = block.match(/<enclosure[^>]*url=["']([^"']+)["']/i)
      if (enc) log('    enclosure url: ' + enc[1].slice(0, 120))
      const mediaC = block.match(/<media:content[^>]*url=["']([^"']+)["']/i)
      if (mediaC) log('    media:content url: ' + mediaC[1].slice(0, 120))
      const mediaT = block.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i)
      if (mediaT) log('    media:thumbnail url: ' + mediaT[1].slice(0, 120))
      const imgInDesc = block.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (imgInDesc) log('    <img> in description: ' + imgInDesc[1].slice(0, 120))
      if (!enc && !mediaC && !mediaT && !imgInDesc) {
        log('    NO image in RSS item. Raw block (first 700 chars):')
        log('    ' + block.replace(/\s+/g, ' ').slice(0, 700))
      }
    }
  } catch (e) { log('  RSS dump ERROR: ' + e.message) }

  log('\n=== END ===')
  writeFileSync(OUT, lines.join('\n'))
}
main().catch(e => { log('FATAL: ' + e.message); writeFileSync(OUT, lines.join('\n')); process.exit(0) })
main().catch(e => { log('FATAL: ' + e.message); writeFileSync(OUT, lines.join('\n')); process.exit(0) })
