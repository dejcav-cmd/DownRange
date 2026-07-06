import { writeFileSync } from 'fs'
const OUT = 'scripts/deals-image-diagnosis.txt'
const lines = []
const log = (s = '') => { lines.push(s); console.log(s) }
const RSS = 'https://gun.deals/rss.xml'
const UA  = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

async function tryDownload(label, url, referer) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': referer || 'https://gun.deals/', 'Accept': 'image/*' }, signal: AbortSignal.timeout(15000) })
    const ct = res.headers.get('content-type') || ''
    let bytes = 0
    if (res.ok) bytes = (await res.arrayBuffer()).byteLength
    log(`    ${label}: HTTP ${res.status} · ${ct} · ${bytes}b ${res.ok && bytes > 5000 ? 'OK' : 'x'}`)
    return res.ok && bytes > 5000
  } catch (e) { log(`    ${label}: ERR ${e.message} x`); return false }
}

async function main() {
  log('=== JINA PROXY → gun.deals SOURCE IMAGE TEST ===')
  log('time: ' + new Date().toISOString())
  let links = []
  try {
    const xml = await (await fetch(RSS, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) })).text()
    links = [...xml.matchAll(/<link>([^<]+)<\/link>/g)].map(m => m[1]).filter(u => u.includes('gun.deals') && !u.endsWith('rss.xml')).slice(0, 3)
  } catch (e) { log('RSS ERR ' + e.message) }
  log('links: ' + links.length)

  for (const link of links) {
    log('\n  PRODUCT: ' + link.slice(0, 75))

    // 1) Jina reader in HTML mode (x-respond-with: html) so we get raw og tags
    try {
      const jina = 'https://r.jina.ai/' + link
      const res = await fetch(jina, { headers: { 'User-Agent': UA, 'x-respond-with': 'html', 'Accept': 'text/html' }, signal: AbortSignal.timeout(25000) })
      log('    jina HTTP ' + res.status)
      if (res.ok) {
        const body = await res.text()
        // find gun.deals product image url (og:image or sites/default/files)
        const og = (body.match(/og:image["'\s]+content=["']([^"']+)["']/i) || [])[1]
          || (body.match(/(https?:\/\/gun\.deals\/[^\s"')]*sites\/default\/files\/[^\s"')]+\.(?:jpg|jpeg|png|webp))/i) || [])[1]
          || (body.match(/(https?:\/\/gun\.deals\/cdn-cgi\/image\/[^\s"')]+)/i) || [])[1]
        log('    found image: ' + (og ? og.slice(0, 110) : 'NONE'))
        if (og) {
          await tryDownload('dl og direct  ', og, 'https://gun.deals/')
          const raw = og.match(/\/cdn-cgi\/image\/[^/]+\/(https?:\/\/.+)/)
          if (raw) await tryDownload('dl unwrapped  ', raw[1], 'https://gun.deals/')
        }
      }
    } catch (e) { log('    jina ERR ' + e.message) }
  }
  log('\n=== END ===')
  writeFileSync(OUT, lines.join('\n'))
}
main().catch(e => { log('FATAL: ' + e.message); writeFileSync(OUT, lines.join('\n')); process.exit(0) })
