import { writeFileSync } from 'fs'
const OUT = 'scripts/deals-image-diagnosis.txt'
const lines = []
const log = (s = '') => { lines.push(s); console.log(s) }
const RSS = 'https://gun.deals/rss.xml'
const UA  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
const FULL_HEADERS = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-ch-ua': '"Chromium";v="126", "Google Chrome";v="126", "Not.A/Brand";v="24"',
  'sec-ch-ua-mobile': '?0', 'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document', 'Sec-Fetch-Mode': 'navigate', 'Sec-Fetch-Site': 'none', 'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
}
const BAD_IMG = /logo|icon|sprite|avatar|placeholder|blank|1x1|pixel|thumb_|\/thumbs?\//i
function cleanTitle(t = '') {
  return t.replace(/\s*[-\u2013]\s*\$[\d,.]+.*$/, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\bafter code\b.*$/i, '').replace(/[()"]/g, '').trim()
}
async function tryDownload(label, url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://www.bing.com/', 'Accept': 'image/*' }, signal: AbortSignal.timeout(15000) })
    const ct = res.headers.get('content-type') || ''
    let bytes = 0
    if (res.ok) bytes = (await res.arrayBuffer()).byteLength
    log(`    ${label}: HTTP ${res.status} · ${ct} · ${bytes}b ${res.ok && bytes > 5000 ? 'OK' : 'x'}`)
    return res.ok && bytes > 5000
  } catch (e) { log(`    ${label}: ERR ${e.message} x`); return false }
}
async function bingImageSearch(query) {
  const url = `https://www.bing.com/images/search?q=${encodeURIComponent(query + ' firearm')}&qft=+filterui:imagesize-large&first=1`
  try {
    const html = await (await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000) })).text()
    const cands = []; let m
    const re1 = /murl&quot;:&quot;(https?:\/\/[^&"]+\.(?:jpg|jpeg|png|webp)[^&"]*)/gi
    while ((m = re1.exec(html))) { const u = decodeURIComponent(m[1].replace(/&amp;/g, '&')); if (!BAD_IMG.test(u)) cands.push(u) }
    const re2 = /"murl":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi
    while ((m = re2.exec(html))) { if (!BAD_IMG.test(m[1])) cands.push(m[1]) }
    return { httpOk: true, count: cands.length, top: cands.slice(0, 3) }
  } catch (e) { return { httpOk: false, err: e.message } }
}
async function main() {
  log('=== DEAL IMAGE — SOURCE-ACCURATE FIX TEST ===')
  log('time: ' + new Date().toISOString())
  let items = []
  try {
    const xml = await (await fetch(RSS, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) })).text()
    items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(b => ({
      title: (b[1].match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '',
      link:  (b[1].match(/<link>([^<]+)<\/link>/) || [])[1] || '',
    })).filter(i => i.link.includes('gun.deals')).slice(0, 4)
    log('\nRSS items: ' + items.length)
  } catch (e) { log('RSS ERR ' + e.message) }
  log('\n--- A) gun.deals product page with FULL browser headers ---')
  for (const it of items.slice(0, 3)) {
    try {
      const res = await fetch(it.link, { headers: FULL_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(15000) })
      log(`  ${res.status}  ${it.link.slice(0, 70)}`)
      if (res.ok) {
        const html = await res.text()
        const og = (html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || [])[1]
        log('    og:image: ' + (og ? og.slice(0, 100) : 'none'))
      }
    } catch (e) { log(`  ERR ${e.message}`) }
  }
  log('\n--- B) Bing image search per product title ---')
  for (const it of items) {
    const q = cleanTitle(it.title)
    log(`\n  TITLE: ${it.title.slice(0, 80)}`)
    log(`  QUERY: ${q}`)
    const r = await bingImageSearch(q)
    if (!r.httpOk) { log('    Bing FAILED: ' + r.err); continue }
    log(`    candidates: ${r.count}`)
    r.top.forEach((u, i) => log(`      [${i}] ${u.slice(0, 100)}`))
    if (r.top[0]) await tryDownload('download top   ', r.top[0])
  }
  log('\n=== END ===')
  writeFileSync(OUT, lines.join('\n'))
}
main().catch(e => { log('FATAL: ' + e.message); writeFileSync(OUT, lines.join('\n')); process.exit(0) })
