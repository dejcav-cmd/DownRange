// Real images for manufacturer press releases. Server only.
// RULE: never a placeholder, never an SVG, never a stock photo. Every image comes from the
// manufacturer's own release page, is validated, and is uploaded to the Sanity CDN.
import crypto from 'crypto'
import * as cheerio from 'cheerio'

// Bump when the image rules change: every article processed under an older version is re-checked.
export const IMAGE_RULES_VERSION = 2

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

const decode = s => String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&#x2F;/gi, '/')

// Things that are never article photos
const BAD_URL = /(logo|icon|sprite|avatar|favicon|badge|emoji|social|payment|visa|mastercard|paypal|flag-|spinner|loader|loading|placeholder|blank\.|pixel|spacer|tracking|beacon|1x1|footer|arrow|btn-|button|menu|search|cart|age-?gate|newsletter|signup|subscribe|qrcode|gravatar|wp-emoji|\/wp-content\/themes\/|\/plugins\/|default-?(share|og|image)|og-?default|fallback|sharing|facebook|twitter|instagram|youtube|tiktok|linkedin|\.svg|\.gif|data:image)/i
// Alt text that says the picture is not a photo of the product / event
const BAD_ALT = /(\bqr\b|qr[- ]?code|barcode|scan (me|to|this|the)|generated for this page|\blogo\b|\bicon\b|badge|sticker|button|sprite|avatar|spinner)/i
// Containers (below the article root) whose images are promos, not the article's own photos
const BAD_CTX = /(related|recommend|sidebar|widget|promo|carousel|slider|swiper|featured-products|latest|popular|trending|newsletter|\bshop\b|\bcart\b|product-?(grid|list|card|tile|slider)|\bnav|menu|footer|banner|advert|\bad-|sponsor|breadcrumb|social|share|comment|author|\blogo|search|modal|popup|cookie|subscribe|pagination|you-may|also-like|more-from|next-post|prev-post)/i
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
    if (alt && BAD_ALT.test(alt)) return
    const k = keyOf(abs)
    if (seen.has(k)) return
    seen.add(k)
    out.push({ url: abs, alt: (alt || '').replace(/\s+/g, ' ').trim(), src, rank: out.length })
  }

  if (page.mode === 'markdown') {
    // reader output has the whole page: keep only images inside the story (around the headline and text)
    const body = page.body
    const lines = body.split('\n')
    let pos = 0, first = -1, last = 0
    for (const ln of lines) {
      if (first < 0 && /^#{1,3}\s+\S/.test(ln)) first = pos
      const plain = ln.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').trim()
      if (plain.length >= 80 && !/^[-*]\s*\[/.test(ln)) last = pos + ln.length
      pos += ln.length + 1
    }
    const lo = Math.max(0, (first < 0 ? 0 : first) - 700)
    const rx = /!\[([^\]]*)\]\((https?:[^)\s]+)[^)]*\)/g
    let m
    while ((m = rx.exec(body)) !== null) { if (m.index >= lo && m.index <= last + 200) add(m[2], m[1], 'md') }
    return out.slice(0, 16)
  }

  const html = page.body || ''
  const $ = cheerio.load(html)
  const metaVal = key => decode($('meta[property="' + key + '"], meta[name="' + key + '"]').first().attr('content') || '')
  for (const k of ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']) add(metaVal(k), $('meta[property="og:image:alt"]').attr('content') || '', 'meta')
  $('script[type="application/ld+json"]').each((_, el) => {
    const txt = $(el).contents().text()
    for (const m of txt.matchAll(/"image"\s*:\s*(?:\[\s*)?(?:"([^"]+)"|\{[^}]*?"url"\s*:\s*"([^"]+)")/g)) add(m[1] || m[2], '', 'jsonld')
  })

  // article root: the element that holds the story, never the whole page
  let root = null
  for (const sel of ['article', '[role="main"]', 'main', '.entry-content', '.post-content', '.article-content', '.article-body', '.news-content', '#content', '#main']) {
    const el = $(sel).first()
    if (el.length) { root = el; break }
  }
  if (!root) root = $('body')
  const rootEl = root.get(0)
  const clean = el => {
    // walk up to (not including) the root: promos / related / sidebars are skipped
    let n = el.parent
    while (n && n !== rootEl && n.type === 'tag') {
      const tag = n.name
      if (['nav', 'footer', 'aside', 'form', 'noscript', 'button'].includes(tag)) return false
      if (tag === 'header' && $(n).find('nav, a[href="/"]').length) return false
      if (BAD_CTX.test(((n.attribs && n.attribs.class) || '') + ' ' + ((n.attribs && n.attribs.id) || ''))) return false
      n = n.parent
    }
    return true
  }
  root.find('img').each((_, el) => {
    if (!clean(el)) return
    const a = el.attribs || {}
    const cls = (a.class || '') + ' ' + (a.id || '')
    if (/(logo|icon|avatar|emoji|sprite|badge)/i.test(cls)) return
    const w = parseInt(a.width, 10) || 0
    const h = parseInt(a.height, 10) || 0
    let u = bestFromSrcset(a.srcset) || bestFromSrcset(a['data-srcset']) || a['data-src'] || a['data-lazy-src'] || a['data-original'] || a['data-lazy'] || a.src
    if (el.parent && el.parent.name === 'picture') {
      const best = $(el.parent).find('source').toArray().map(sr => bestFromSrcset((sr.attribs || {}).srcset)).filter(Boolean)[0]
      if (best && !u) u = best
    }
    add(u, a.alt || '', 'img', w, h)
  })
  root.find('[style*="background"], [data-bg], [data-bg-image]').each((_, el) => {
    if (!clean(el)) return
    const a = el.attribs || {}
    const m = (a.style || '').match(/url\(["']?([^"')]+)/i)
    add(decode(a['data-bg'] || a['data-bg-image'] || (m && m[1]) || ''), '', 'bg')
  })
  root.find('a[href]').each((_, el) => {
    const hrefAttr = (el.attribs || {}).href || ''
    if (/\.(jpe?g|png|webp)(\?|$)/i.test(hrefAttr) && clean(el)) add(decode(hrefAttr), '', 'link')
  })

  // only when the page has nothing else: image URLs inside inline JSON (React / Next / Nuxt blobs)
  if (out.length === 0) {
    const flat = html.replace(/\\u002F/gi, '/').replace(/\\\//g, '/')
    for (const m of flat.matchAll(/https?:\/\/[^"'\s\\<>)]+\.(?:jpe?g|png|webp)(?:\?[^"'\s\\<>)]*)?/gi)) add(m[0], '', 'json')
  }

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


// QR codes, barcodes and flat graphics are not photos. Pixel check on a 96x96 greyscale thumbnail:
// a QR code is almost purely black/white (no mid-tones), roughly half dark, and flips colour many times per row/column.
export async function looksLikeGraphic(buf) {
  try {
    const sharp = (await import('sharp')).default
    const { data } = await sharp(buf, { failOn: 'none' }).flatten({ background: '#ffffff' }).resize(96, 96, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true })
    const N = 96
    let dark = 0, mid = 0
    for (let i = 0; i < data.length; i++) { const v = data[i]; if (v < 90) dark++; else if (v <= 170) mid++ }
    let rowT = 0, colT = 0
    for (let y = 0; y < N; y++) for (let x = 1; x < N; x++) if ((data[y * N + x] < 128) !== (data[y * N + x - 1] < 128)) rowT++
    for (let x = 0; x < N; x++) for (let y = 1; y < N; y++) if ((data[y * N + x] < 128) !== (data[(y - 1) * N + x] < 128)) colT++
    const darkR = dark / data.length, midR = mid / data.length
    const rowA = rowT / N, colA = colT / N
    // QR / barcode: about half dark, and colour flips 16+ times per scan line in both directions (photos: under ~13)
    const qrLike = (darkR > 0.2 && darkR < 0.75 && rowA >= 16 && colA >= 16) ||
      (darkR > 0.3 && darkR < 0.7 && midR < 0.2 && rowA >= 10 && colA >= 10)
    return { qrLike, darkR, midR, rowAvg: rowT / N, colAvg: colT / N }
  } catch { return { qrLike: false } }
}

const okShape = d => d.w >= 400 && d.h >= 240 && d.w / d.h <= 3.3 && d.w / d.h >= 0.45

// usage: Map(hash -> Set(docIds)) of images already used by other articles (promo / site-wide graphics repeat)
const usedByOthers = (usage, h, selfId) => {
  const set = usage && usage.get(h)
  if (!set) return 0
  return [...set].filter(id => id !== selfId).length
}

// Pick up to `max` real images (1 hero + body images), upload to Sanity, return asset info.
export async function collectImages(sanity, page, pageUrl, { brand = '', label = 'press', max = 4, usage = null, selfId = 'new' } = {}) {
  if (!process.env.SANITY_API_TOKEN) return { hero: null, body: [], rejected: [] }
  const cands = extractImageCandidates(page, pageUrl)
  const picked = []
  const rejected = []
  const hashes = new Set()
  for (let i = 0; i < cands.length && picked.length < max; i += 3) {
    const batch = await Promise.all(cands.slice(i, i + 3).map(async c => ({ c, d: await download(c.url, pageUrl) })))
    for (const { c, d } of batch) {
      if (!d || picked.length >= max) continue
      if (!okShape(d)) { rejected.push(c.url + ' (size)'); continue }
      const h = crypto.createHash('md5').update(d.buf).digest('hex')
      if (hashes.has(h)) continue
      const g = await looksLikeGraphic(d.buf)
      if (g.qrLike) { rejected.push(c.url + ' (qr/graphic)'); continue }
      hashes.add(h)
      picked.push({ ...d, alt: c.alt, hash: h, rank: c.rank, others: usedByOthers(usage, h, selfId) })
    }
  }
  if (!picked.length) return { hero: null, body: [], rejected }

  // hero: first wide-enough image that is not a site-wide repeat; body: only pictures no other article uses
  const heroPool = picked.filter(p => p.others < 2)
  let hero = heroPool.find(p => p.w >= 800) || heroPool.reduce((b, p) => (!b || p.w * p.h > b.w * b.h ? p : b), null)
  if (!hero) return { hero: null, body: [], rejected }
  const bodyPool = picked.filter(p => p !== hero && p.others === 0)
  const ordered = [hero, ...bodyPool].slice(0, max)

  const slug = (brand + '-' + label).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)
  const uploaded = []
  for (const p of ordered) {
    try {
      const asset = await sanity.assets.upload('image', p.buf, {
        contentType: p.type === 'png' ? 'image/png' : p.type === 'webp' ? 'image/webp' : 'image/jpeg',
        filename: 'press-' + slug + '-' + (uploaded.length + 1) + '.' + (p.type === 'jpeg' ? 'jpg' : p.type),
      })
      if (asset && asset._id && asset.url) {
        uploaded.push({ assetId: asset._id, url: asset.url, width: p.w, height: p.h, alt: p.alt, sourceUrl: p.url, hash: p.hash })
        if (usage) { if (!usage.has(p.hash)) usage.set(p.hash, new Set()); usage.get(p.hash).add(selfId) }
      }
    } catch {}
  }
  if (!uploaded.length) return { hero: null, body: [], rejected }
  return { hero: uploaded[0], body: uploaded.slice(1, max), rejected }
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
