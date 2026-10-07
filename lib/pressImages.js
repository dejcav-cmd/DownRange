// Real images for manufacturer press releases. Server only.
// RULE: never a placeholder, never an SVG, never a stock photo. Every image comes from the
// manufacturer's own release page, is validated, and is uploaded to the Sanity CDN.
import crypto from 'crypto'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#x2F;/gi, '/')

// Things that are never article photos
const BAD_URL = /(logo|icon|sprite|avatar|favicon|badge|emoji|social|payment|visa|mastercard|paypal|flag-|spinner|loader|loading|placeholder|blank\.|pixel|spacer|tracking|beacon|1x1|footer|arrow|btn-|button|menu|search|cart|age-?gate|newsletter|signup|subscribe|qrcode|gravatar|wp-emoji|\/wp-content\/themes\/|\/plugins\/|default-?(share|og|image)|og-?default|fallback|sharing|facebook|twitter|instagram|youtube|tiktok|linkedin|\.svg|\.gif|data:image)/i
const GOOD_PATH = /(news|press|blog|media|release|article|uploads|content|product|gallery|hero|feature)/i

function attr(tag, name) {
  const m = tag.match(new RegExp('[\\s"\']' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', 'i'))
  return m ? decode(m[1] != null ? m[1] : m[2]) : ''
}

function bestFromSrcset(s) {
  if (!s) return ''
  let best = '', bw = -1
  for (const part of s.split(/,\s+(?=\S)/)) {
    const [u, d] = part.trim().split(/\s+/)
    if (!u) continue
    const w = d ? parseFloat(d) * (/x$/i.test(d) ? 1000 : 1) : 0
    if (w >= bw) { bw = w; best = u }
  }
  return best
}

function resolve(u, base) {
  if (!u || /^(data:|blob:|javascript:)/i.test(u)) return null
  try {
    const x = new URL(u.replace(/\\\//g, '/'), base)
    if (!/^https?:$/.test(x.protocol)) return null
    return x.toString()
  } catch { return null }
}

// Try to turn a thumbnail URL into the full-size original
export function upgradeUrl(u) {
  try {
    const x = new URL(u)
    x.pathname = x.pathname
      .replace(/-\d{2,4}x\d{2,4}(\.(?:jpe?g|png|webp))$/i, '$1')      // WordPress thumbnails
      .replace(/_\d{2,4}x\d{0,4}(\.(?:jpe?g|png|webp))$/i, '$1')       // Shopify thumbnails
      .replace(/_(?:small|medium|thumb|thumbnail|compact|grande)(\.(?:jpe?g|png|webp))$/i, '$1')
    for (const k of ['w', 'h', 'width', 'height', 'resize', 'fit', 'crop', 'quality', 'q']) x.searchParams.delete(k)
    return x.toString()
  } catch { return u }
}

const keyOf = u => {
  try {
    const x = new URL(u)
    return (x.hostname + x.pathname).toLowerCase().replace(/-\d{2,4}x\d{2,4}(?=\.)/, '').replace(/_\d{2,4}x\d{0,4}(?=\.)/, '').replace(/\.(jpe?g|png|webp|avif)$/, '')
  } catch { return u }
}

// ── Candidate discovery (ordered best-first) ─────────────────────────────────
export function extractImageCandidates(page, pageUrl) {
  const base = page.finalUrl || pageUrl
  const out = []
  const seen = new Set()
  const add = (raw, alt, src, w, h) => {
    const abs = resolve(raw, base)
    if (!abs) return
    const path = (() => { try { return new URL(abs).pathname } catch { return abs } })()
    if (BAD_URL.test(path) || BAD_URL.test(abs.split('?')[0])) return
    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(abs) && !/(\/image|images?\/|\/media\/|cdn|cloudinary|imgix|wp-content|uploads)/i.test(abs)) return
    if (w && h && w < 120 && h < 120) return
    const k = keyOf(abs)
    if (seen.has(k)) return
    seen.add(k)
    out.push({ url: abs, alt: (alt || '').replace(/\s+/g, ' ').trim(), src, rank: out.length })
  }

  if (page.mode === 'markdown') {
    const rx = /!\[([^\]]*)\]\((https?:[^)\s]+)[^)]*\)/g
    let m
    while ((m = rx.exec(page.body)) !== null) add(m[2], m[1], 'md')
    return out.slice(0, 16)
  }

  const html = page.body || ''
  const metaVal = key => {
    const a = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + key + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'))
    const b = html.match(new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + key + '["\']', 'i'))
    return decode((a && a[1]) || (b && b[1]) || '')
  }
  for (const k of ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']) add(metaVal(k), '', 'meta')
  const ld = [...html.matchAll(/"image"\s*:\s*(?:\[\s*)?(?:"([^"]+)"|\{[^}]*?"url"\s*:\s*"([^"]+)")/g)]
  for (const m of ld) add(m[1] || m[2], '', 'jsonld')

  // body scope: article / main, else the page without chrome
  const scoped = (html.match(/<article[\s\S]*?<\/article>/i) || html.match(/<main[\s\S]*?<\/main>/i) || [null])[0]
  const chromeFree = html.replace(/<(script|style|noscript|nav|header|footer|svg)[\s\S]*?<\/\1>/gi, ' ')
  const scopes = scoped ? [scoped.replace(/<(script|style|noscript|nav|footer|svg)[\s\S]*?<\/\1>/gi, ' '), chromeFree] : [chromeFree]

  for (const scope of scopes) {
    for (const m of scope.matchAll(/<img\b[^>]*>/gi)) {
      const tag = m[0]
      const cls = attr(tag, 'class') + ' ' + attr(tag, 'id')
      if (/(logo|icon|avatar|emoji|sprite|badge)/i.test(cls)) continue
      const w = parseInt(attr(tag, 'width'), 10) || 0
      const h = parseInt(attr(tag, 'height'), 10) || 0
      const u = bestFromSrcset(attr(tag, 'srcset')) || bestFromSrcset(attr(tag, 'data-srcset')) ||
        attr(tag, 'data-src') || attr(tag, 'data-lazy-src') || attr(tag, 'data-original') || attr(tag, 'data-lazy') || attr(tag, 'src')
      add(u, attr(tag, 'alt'), 'img', w, h)
    }
    for (const m of scope.matchAll(/<source\b[^>]*>/gi)) add(bestFromSrcset(attr(m[0], 'srcset')) || bestFromSrcset(attr(m[0], 'data-srcset')), '', 'source')
    for (const m of scope.matchAll(/(?:background(?:-image)?\s*:\s*url\(|data-bg(?:-image)?\s*=\s*)["']?([^"')\s]+)/gi)) add(decode(m[1]), '', 'bg')
    for (const m of scope.matchAll(/<a\b[^>]*href=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi)) add(decode(m[1]), '', 'link')
    if (out.length >= 3) break
  }

  // last resort: image URLs inside inline JSON (React / Next / Nuxt data blobs)
  if (out.length < 2) {
    const flat = html.replace(/\\u002F/gi, '/').replace(/\\\//g, '/')
    for (const m of flat.matchAll(/https?:\/\/[^"'\s\\<>)]+\.(?:jpe?g|png|webp)(?:\?[^"'\s\\<>)]*)?/gi)) add(m[0], '', 'json')
  }

  // keep source order, but float images with news-like paths a little ahead of generic ones
  const scored = out.map(c => ({ ...c, score: (c.src === 'meta' || c.src === 'jsonld' ? 3 : 0) + (GOOD_PATH.test(c.url) ? 1 : 0) - c.rank * 0.05 }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 16)
}

// ── Download + validate ──────────────────────────────────────────────────────
function sniff(buf) {
  if (buf.length < 16) return null
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg'
  if (buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG') return 'png'
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp'
  return null // svg, gif, html, avif, anything else: rejected
}

function dimensions(buf, type) {
  try {
    if (type === 'png') return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
    if (type === 'webp') {
      const c = buf.toString('latin1', 12, 16)
      if (c === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
      if (c === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 } }
      if (c === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) }
      return null
    }
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue }
      const mk = buf[i + 1]
      if (mk >= 0xc0 && mk <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(mk)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  } catch {}
  return null
}

async function download(url, referer) {
  for (const u of url === upgradeUrl(url) ? [url] : [upgradeUrl(url), url]) {
    try {
      const r = await fetch(u, {
        headers: { 'User-Agent': UA, Accept: 'image/jpeg,image/png,image/webp,image/*;q=0.8', Referer: referer },
        signal: AbortSignal.timeout(15000), redirect: 'follow',
      })
      if (!r.ok) continue
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length < 15000 || buf.length > 12 * 1024 * 1024) continue
      const type = sniff(buf)
      if (!type) continue
      const d = dimensions(buf, type)
      if (!d || !d.w || !d.h) continue
      return { buf, type, w: d.w, h: d.h, url: u }
    } catch {}
  }
  return null
}

const okShape = d => d.w >= 400 && d.h >= 240 && d.w / d.h <= 3.3 && d.w / d.h >= 0.45

// Pick up to `max` real images (1 hero + body images), upload to Sanity, return asset info.
export async function collectImages(sanity, page, pageUrl, { brand = '', label = 'press', max = 4, seenHashes = null } = {}) {
  if (!process.env.SANITY_API_TOKEN) return { hero: null, body: [] }
  const cands = extractImageCandidates(page, pageUrl)
  const picked = []
  const hashes = new Set()
  for (let i = 0; i < cands.length && picked.length < max; i += 3) {
    const batch = await Promise.all(cands.slice(i, i + 3).map(async c => ({ c, d: await download(c.url, pageUrl) })))
    for (const { c, d } of batch) {
      if (!d || !okShape(d) || picked.length >= max) continue
      const h = crypto.createHash('md5').update(d.buf).digest('hex')
      if (hashes.has(h)) continue
      if (seenHashes && (seenHashes.get(h) || 0) >= 2) continue // same picture on 3+ releases = site-wide graphic
      hashes.add(h)
      if (seenHashes) seenHashes.set(h, (seenHashes.get(h) || 0) + 1)
      picked.push({ ...d, alt: c.alt, hash: h, rank: c.rank })
    }
  }
  if (!picked.length) return { hero: null, body: [] }

  // hero: first good image that is wide enough; fall back to the largest
  let heroIdx = picked.findIndex(p => p.w >= 800)
  if (heroIdx < 0) heroIdx = picked.reduce((bi, p, i) => (p.w * p.h > picked[bi].w * picked[bi].h ? i : bi), 0)
  const ordered = [picked[heroIdx], ...picked.filter((_, i) => i !== heroIdx)]

  const slug = (brand + '-' + label).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)
  const uploaded = []
  for (const p of ordered) {
    try {
      const asset = await sanity.assets.upload('image', p.buf, {
        contentType: p.type === 'png' ? 'image/png' : p.type === 'webp' ? 'image/webp' : 'image/jpeg',
        filename: 'press-' + slug + '-' + (uploaded.length + 1) + '.' + (p.type === 'jpeg' ? 'jpg' : p.type),
      })
      if (asset && asset._id && asset.url) {
        uploaded.push({ assetId: asset._id, url: asset.url, width: p.w, height: p.h, alt: p.alt, sourceUrl: p.url })
      }
    } catch {}
  }
  if (!uploaded.length) return { hero: null, body: [] }
  return { hero: uploaded[0], body: uploaded.slice(1, max) }
}

// ── Weave images into the article body ───────────────────────────────────────
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function goodCaption(alt) {
  const a = (alt || '').trim()
  if (a.length < 12 || a.length > 160) return ''
  if (/\.(jpe?g|png|webp)$/i.test(a) || /^(img|image|dsc|photo|banner)[-_ ]?\d*$/i.test(a)) return ''
  return a
}

export function stripFigures(html) {
  return String(html || '').replace(/<figure[\s\S]*?<\/figure>/gi, '')
}

export function weaveImages(html, images, brand) {
  const body = stripFigures(html)
  if (!images || !images.length) return body
  const figs = images.map(im => {
    const cap = goodCaption(im.alt)
    const w = im.width && im.width > 1400 ? 1400 : im.width || 1200
    const h = im.width && im.height ? Math.round(w * im.height / im.width) : 0
    return '<figure class="pr-fig"><img src="' + im.url + '?w=' + w + '&auto=format&q=82" alt="' + esc(cap || (brand + ' photo')) + '"' +
      (h ? ' width="' + w + '" height="' + h + '"' : '') + ' loading="lazy" decoding="async">' +
      '<figcaption>' + (cap ? esc(cap) + ' ' : '') + '<span>Image: ' + esc(brand) + '</span></figcaption></figure>'
  })
  // insertion points: after a closing </p> or </ul>, never right after a heading
  const parts = body.split(/(<\/p>|<\/ul>)/i)
  const slots = []
  for (let i = 1; i < parts.length; i += 2) slots.push(i)
  if (slots.length < 2) return body + figs.join('')
  const n = slots.length
  const at = new Map()
  figs.forEach((f, k) => {
    let s = slots[Math.min(n - 1, Math.max(0, Math.round(((k + 1) * n) / (figs.length + 1)) - 1))]
    while (at.has(s) && s + 2 < parts.length) s += 2
    at.set(s, f)
  })
  return parts.map((p, i) => (at.has(i) ? p + at.get(i) : p)).join('')
}
