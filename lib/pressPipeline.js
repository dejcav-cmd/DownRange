// Manufacturer press release pipeline: pull -> read -> rewrite -> link back -> publish.
// Used by /api/cron/press-releases and the admin manager. Server only.
import crypto from 'crypto'
import { createClient } from '@sanity/client'
import { callAI, stripMarkdownFences } from './aiClient'
import { PRESS_SOURCES, brandSlug } from './pressSources'
import { collectImages, weaveImages, stripFigures, IMAGE_RULES_VERSION } from './pressImages'

// hash -> Set(docIds): which articles already use which picture (promo / site-wide graphics repeat)
async function loadImageUsage(sanity) {
  const rows = await sanity.fetch(`*[_type=="pressRelease" && defined(imageHashes)]{ _id, imageHashes }`).catch(() => [])
  const usage = new Map()
  for (const r of rows) for (const h of (r.imageHashes || [])) { if (!usage.has(h)) usage.set(h, new Set()); usage.get(h).add(r._id) }
  return usage
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const STATE_ID = 'press-pull-state'

export function getSanity() {
  return createClient({
    projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
    dataset:    'production',
    apiVersion: '2024-01-01',
    useCdn:     false,
    token:      process.env.SANITY_API_TOKEN,
  })
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
const withTimeout = (p, ms, label) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error(label + ' timed out')), ms)),
])

// ── FETCH (direct first, reader proxy as fallback for bot-blocked sites) ──────
async function fetchDirect(url, timeout = 15000) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    })
    if (!r.ok) return { ok: false, status: r.status }
    const ct = r.headers.get('content-type') || ''
    if (!/html|xml|text/i.test(ct)) return { ok: false, status: 415 }
    return { ok: true, status: r.status, body: await r.text(), mode: 'html', finalUrl: r.url || url }
  } catch (e) {
    return { ok: false, status: 0, error: e.message }
  }
}

async function fetchReader(url, timeout = 20000) {
  try {
    const r = await fetch('https://r.jina.ai/' + url, {
      headers: { 'User-Agent': UA, Accept: 'text/plain' },
      signal: AbortSignal.timeout(timeout),
    })
    if (!r.ok) return { ok: false, status: r.status }
    const body = await r.text()
    if (!body || body.length < 200) return { ok: false, status: 204 }
    return { ok: true, status: r.status, body, mode: 'markdown', finalUrl: url }
  } catch (e) {
    return { ok: false, status: 0, error: e.message }
  }
}

export async function fetchPage(url) {
  const d = await fetchDirect(url)
  if (d.ok) return d
  // Cloudflare / WAF style blocks get one retry through the reader proxy
  if ([0, 401, 403, 429, 503].includes(d.status)) {
    const j = await fetchReader(url)
    if (j.ok) return { ...j, via: 'reader' }
  }
  return d
}

// ── URL helpers ───────────────────────────────────────────────────────────────
export function normalizeUrl(u) {
  try {
    const x = new URL(u)
    x.hash = ''
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(k => x.searchParams.delete(k))
    let s = x.toString()
    if (s.endsWith('/')) s = s.slice(0, -1)
    return s
  } catch { return u }
}

const SKIP_PATH = /(\/(cart|account|login|register|checkout|search|shop|store|products?|collections?|find-a-dealer|dealers?|warranty|careers?|contact|about|privacy|terms|cookies|faq|support|tag|tags|category|categories|author|feed|rss)(\/|$)|\.(jpg|jpeg|png|gif|webp|svg|css|js|zip|mp4)(\?|$))/i

// ── LINK EXTRACTION ───────────────────────────────────────────────────────────
export function extractCandidates(page, source) {
  const base = new URL(source.url)
  const seen = new Set()
  const out = []
  const push = (href, text) => {
    if (!href || /^(#|javascript:|mailto:|tel:)/i.test(href)) return
    let abs
    try { abs = new URL(href, base).toString() } catch { return }
    const u = new URL(abs)
    if (u.hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '')) return
    const norm = normalizeUrl(abs)
    if (norm === normalizeUrl(source.url)) return
    if (SKIP_PATH.test(u.pathname) && !u.pathname.includes(source.pathHint || '@@none@@')) return
    // Real release links are deeper than the listing and carry a slug-like last segment
    const segs = u.pathname.split('/').filter(Boolean)
    const last = segs[segs.length - 1] || ''
    if (segs.length < 2 && !/\d/.test(last)) return
    if (last.length < 8 || !/[a-z]/i.test(last)) return
    if (/^(page|p)-?\d+$/i.test(last) || /^\d+$/.test(last)) return
    if (source.pathHint && !u.pathname.toLowerCase().includes(source.pathHint.toLowerCase().replace(/\/$/, ''))) return
    if (seen.has(norm)) return
    seen.add(norm)
    out.push({ url: norm, text: (text || '').replace(/\s+/g, ' ').trim() })
  }
  if (page.mode === 'markdown') {
    const rx = /\[([^\]]{3,200})\]\((https?:[^)\s]+)[^)]*\)/g
    let m
    while ((m = rx.exec(page.body)) !== null) push(m[2], m[1])
  } else {
    const rx = /<a\b[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
    let m
    while ((m = rx.exec(page.body)) !== null) push(m[1], m[2].replace(/<[^>]+>/g, ' '))
  }
  return out
}

// ── ARTICLE PARSING ───────────────────────────────────────────────────────────
const decode = s => String(s || '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#8217;|&rsquo;/g, "'")
  .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"').replace(/&#8211;|&ndash;/g, '-').replace(/&#8212;|&mdash;/g, '-')
  .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCharCode(+n) } catch { return '' } })

function meta(html, key) {
  const a = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + key + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'))
  const b = html.match(new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']' + key + '["\']', 'i'))
  return decode((a && a[1]) || (b && b[1]) || '')
}

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec'
function findDate(html, text) {
  const cands = [
    meta(html, 'article:published_time'), meta(html, 'og:article:published_time'),
    meta(html, 'datePublished'), meta(html, 'publish_date'), meta(html, 'date'),
    (html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1],
    (html.match(/<time[^>]+datetime=["']([^"']+)["']/i) || [])[1],
  ].filter(Boolean)
  for (const c of cands) {
    const d = new Date(c)
    if (!isNaN(d) && d.getFullYear() > 2015 && d.getTime() < Date.now() + 86400000) return d.toISOString()
  }
  const head = text.slice(0, 1500)
  let m = head.match(new RegExp('\\b(' + MONTHS + ')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(20\\d{2})\\b', 'i'))
  if (m) { const d = new Date(m[1] + ' ' + m[2] + ', ' + m[3]); if (!isNaN(d) && d.getTime() < Date.now() + 86400000) return d.toISOString() }
  m = head.match(/\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/)
  if (m) { const d = new Date(+m[3], +m[1] - 1, +m[2]); if (!isNaN(d) && d.getTime() < Date.now() + 86400000) return d.toISOString() }
  return null
}

export function parseArticle(page) {
  if (page.mode === 'markdown') {
    const text = page.body
    const title = ((text.match(/^Title:\s*(.+)$/m) || text.match(/^#\s+(.+)$/m) || [])[1] || '').trim()
    const img = (text.match(/!\[[^\]]*\]\((https?:[^)\s]+\.(?:jpe?g|png|webp)[^)\s]*)\)/i) || [])[1] || null
    const body = text.replace(/^(Title|URL Source|Published Time|Markdown Content):.*$/gm, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim()
    const pt = (text.match(/^Published Time:\s*(.+)$/m) || [])[1]
    return { title, text: body, image: img, date: pt && !isNaN(new Date(pt)) ? new Date(pt).toISOString() : findDate('', body) }
  }
  const html = page.body
  const ogTitle = meta(html, 'og:title')
  const h1 = decode(((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  const titleTag = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '')
  const title = (h1 || ogTitle || titleTag).replace(/\s+[|\-–—]\s+[^|\-–—]{2,40}$/, '').trim()
  let scope = (html.match(/<article[\s\S]*?<\/article>/i) || html.match(/<main[\s\S]*?<\/main>/i) || [html])[0]
  const cleaned = scope
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(nav|header|footer|aside|form|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h\d|br)>/gi, '\n').replace(/<[^>]+>/g, ' ')
  const text = decode(cleaned).replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()
  const og = meta(html, 'og:image') || meta(html, 'twitter:image')
  let image = null
  if (og) { try { image = new URL(og, page.finalUrl).toString() } catch {} }
  return { title, text, image, date: findDate(html, text) }
}

// ── AI REWRITE ────────────────────────────────────────────────────────────────
const BANNED = [
  [/\bcomprehensive\b/gi, 'full'], [/\brobust\b/gi, 'solid'], [/\bleverag(e|es|ed|ing)\b/gi, 'use'],
  [/\bseamlessly\b/gi, 'smoothly'], [/\bempower(s|ed|ing)?\b/gi, 'equip'], [/\bgame[- ]changer\b/gi, 'big step'],
  [/\bcutting-edge\b/gi, 'modern'], [/\bdive(s|d)? into\b/gi, 'look at'],
]

const ALLOWED_TAGS = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'br'])

export function sanitizeBody(html, sourceUrl, brand) {
  let out = stripMarkdownFences(String(html || ''))
    .replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, name, attrs) => {
      const n = name.toLowerCase()
      if (!ALLOWED_TAGS.has(n)) return ''
      if (tag.startsWith('</')) return '</' + n + '>'
      if (n === 'a') {
        const href = (attrs.match(/href=["']([^"']+)["']/i) || [])[1]
        if (!href || !/^https?:\/\//i.test(href)) return ''
        return '<a href="' + href.replace(/"/g, '%22') + '" target="_blank" rel="noopener noreferrer">'
      }
      return '<' + n + '>'
    })
  for (const [rx, rep] of BANNED) out = out.replace(rx, rep)
  out = out.replace(/<a>/g, '').replace(/<p>\s*<\/p>/g, '').trim()
  if (sourceUrl && !out.includes(sourceUrl)) {
    out += '<p><em>Source: <a href="' + sourceUrl + '" target="_blank" rel="noopener noreferrer">' + brand + ' press release</a></em></p>'
  }
  return out
}

function parseWriterOutput(raw) {
  const t = stripMarkdownFences(raw || '')
  const grab = k => ((t.match(new RegExp('^' + k + ':\\s*(.+)$', 'mi')) || [])[1] || '').trim()
  if (/^SKIP\b/i.test(t.trim())) return { skip: true, reason: t.trim().slice(0, 120) }
  const body = (t.split(/^-{2,}\s*BODY\s*-{2,}\s*$/mi)[1] || '').trim()
  const title = grab('TITLE')
  if (!title || !body) return null
  return {
    title: title.replace(/^["']|["']$/g, '').replace(/[™®]/g, ''),
    summary: grab('SUMMARY'),
    kind: grab('KIND').toLowerCase(),
    category: grab('CATEGORY').toLowerCase(),
    tags: grab('TAGS').split(',').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 8),
    body,
  }
}

export async function writeArticle({ brand, sourceUrl, sourceTitle, text }) {
  const prompt = `You are the DownRange editor. DownRange is an independent firearms news site for gun owners. Rewrite the manufacturer press release below as a short, factual DownRange article.

MANUFACTURER: ${brand}
ORIGINAL HEADLINE: ${sourceTitle}
ORIGINAL URL: ${sourceUrl}

PRESS RELEASE TEXT:
${text.slice(0, 7000)}

RULES
- Use ONLY facts stated in the text above. Never invent specs, prices, dates, quotes, history or claims. If something is not stated, leave it out.
- Write like a real gun owner and editor: direct sentences, active voice, no hype, no padded intro.
- BANNED words: comprehensive, robust, leverage, seamlessly, empower, game-changer, cutting-edge, dive into.
- Do not copy sentences from the release. Rewrite in your own words. No fake quotes.
- If the page is NOT a real press release or announcement (a sales promo, coupon, job post, plain landing page, or no real news), output exactly: SKIP - reason
- 300 to 550 words in the body. Shorter is fine when the release is thin.
- The first paragraph must link to the original with: <a href="${sourceUrl}">${brand}'s press release</a> (use that exact href).

OUTPUT FORMAT (exactly, no markdown fences):
TITLE: a specific DownRange headline, under 95 characters, no clickbait
SUMMARY: 2 sentences, plain text, under 260 characters
KIND: one of product, corporate, event, recall, partnership
CATEGORY: one of pistol, rifle, shotgun, revolver, suppressor, optic, ammo, gear, none
TAGS: 3 to 6 lowercase tags, comma separated
---BODY---
HTML only, using <p>, <h2>, <ul><li>, <strong>. Use these h2 sections when the facts support them: What Was Announced, Key Details (bullet list of specs, pricing, dates, availability), What It Means for Gun Owners, Bottom Line. Skip a section if there is nothing factual to put in it.`

  const res = await withTimeout(callAI({ prompt, maxTokens: 1800, useCase: 'article' }), 75000, 'AI')
  return parseWriterOutput(res.text)
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
export function makeId(sourceUrl) {
  return 'press-' + crypto.createHash('md5').update(normalizeUrl(sourceUrl)).digest('hex').slice(0, 14)
}

const KINDS = ['product', 'corporate', 'event', 'recall', 'partnership']
const CATS = ['pistol', 'rifle', 'shotgun', 'revolver', 'suppressor', 'optic', 'ammo', 'gear']

export async function saveRelease(sanity, { brand, sourceUrl, sourceTitle, sourceDate, images, written, existingSlugs }) {
  // RULE: no real image, no article. Never publish with a placeholder.
  if (!images || !images.hero) throw new Error('no real image')
  const _id = makeId(sourceUrl)
  const words = written.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  let slug = (written.title || sourceTitle).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  if (!slug) slug = brandSlug(brand) + '-release'
  if (existingSlugs && existingSlugs.has(slug)) slug = slug.slice(0, 70) + '-' + _id.slice(-5)
  if (existingSlugs) existingSlugs.add(slug)
  const publishedAt = sourceDate && new Date(sourceDate) <= new Date() ? new Date(sourceDate).toISOString() : new Date().toISOString()
  const doc = {
    _id, _type: 'pressRelease',
    title: written.title,
    slug: { _type: 'slug', current: slug },
    brand, brandSlug: brandSlug(brand),
    kind: KINDS.includes(written.kind) ? written.kind : 'product',
    summary: written.summary || '',
    body: weaveImages(sanitizeBody(written.body, sourceUrl, brand), images.body, brand),
    sourceUrl, sourceTitle: sourceTitle || written.title,
    tags: written.tags || [],
    readTime: Math.max(1, Math.round(words / 200)),
    approved: true, editorLocked: false,
    publishedAt,
    heroImage: { _type: 'image', asset: { _type: 'reference', _ref: images.hero.assetId } },
    heroSourceUrl: images.hero.sourceUrl,
    imageHashes: [images.hero, ...images.body].map(i => i.hash).filter(Boolean),
    imagesDone: true, imagesVersion: IMAGE_RULES_VERSION, imageTries: 0,
  }
  if (CATS.includes(written.category)) doc.category = written.category
  if (sourceDate) doc.sourceDate = new Date(sourceDate).toISOString()
  // createIfNotExists: never overwrite an item the editor has already touched
  return sanity.createIfNotExists(doc)
}

// ── ORCHESTRATOR ─────────────────────────────────────────────────────────────
async function mapLimit(items, limit, fn) {
  const res = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; res[k] = await fn(items[k], k) }
  }))
  return res
}

export async function runPressPull(opts = {}) {
  const t0 = Date.now()
  const maxCreate  = opts.maxCreate  || 24
  const perBrand   = opts.perBrand   || 3
  const windowDays = opts.windowDays || 120
  const deadline   = t0 + (opts.deadlineMs || 235000)
  const sanity = getSanity()
  const sources = PRESS_SOURCES.filter(s => !opts.brand || brandSlug(s.brand) === opts.brand || s.brand.toLowerCase() === String(opts.brand).toLowerCase())

  const existing = await sanity.fetch(`*[_type=="pressRelease"]{ _id, sourceUrl, "slug": slug.current }`)
  const known = new Set(existing.map(d => d._id))
  const knownUrls = new Set(existing.map(d => normalizeUrl(d.sourceUrl || '')))
  const slugs = new Set(existing.map(d => d.slug).filter(Boolean))

  // 1. listing pages, in parallel
  const report = []
  const queues = await mapLimit(sources, 6, async (src) => {
    const row = { brand: src.brand, status: 'ok', candidates: 0, created: 0, note: '' }
    report.push(row)
    const page = await fetchPage(src.url)
    if (!page.ok) { row.status = 'unreachable'; row.note = 'HTTP ' + page.status; return { src, items: [] } }
    if (page.via) row.note = 'via reader'
    const all = extractCandidates(page, src)
    const fresh = all.filter((c, idx) => { c.rank = idx; return !known.has(makeId(c.url)) && !knownUrls.has(c.url) })
    row.candidates = fresh.length
    if (all.length === 0) { row.status = 'no-links'; row.note = (row.note + ' no release links found').trim() }
    return { src, items: fresh.slice(0, 8) }
  })

  // 2. round-robin across manufacturers so no brand floods a run
  const order = []
  for (let r = 0; r < 8; r++) for (const q of queues) if (q.items[r]) order.push({ src: q.src, c: q.items[r] })
  const taken = {}
  const work = order.filter(w => { taken[w.src.brand] = (taken[w.src.brand] || 0) + 1; return taken[w.src.brand] <= 8 })

  const stats = { created: 0, skipped: 0, failed: 0, stale: 0, noImage: 0, saved: [], errors: [] }
  const usage = await loadImageUsage(sanity)
  const cutoff = Date.now() - windowDays * 86400000
  const made = {}
  let idx = 0
  let exhausted = true

  async function handle({ src, c }) {
    if ((made[src.brand] || 0) >= perBrand) return
    const row = report.find(r => r.brand === src.brand)
    const page = await fetchPage(c.url)
    if (!page.ok) { stats.failed++; return }
    const a = parseArticle(page)
    if (!a.title || a.text.length < 350) { stats.skipped++; return }
    const dateMs = a.date ? new Date(a.date).getTime() : null
    if (dateMs && dateMs < cutoff) { stats.stale++; return }
    if (!dateMs && c.rank > 3) { stats.stale++; return }
    if (stats.created >= maxCreate) return
    try {
      // real images first: if the release page has none we can use, skip it (no AI spend, no placeholder)
      const images = await collectImages(sanity, page, c.url, { brand: src.brand, label: a.title, usage, selfId: makeId(c.url) })
      if (!images.hero) { stats.noImage++; if (row && !row.note.includes('no image')) row.note = (row.note + ' no image on some releases').trim(); return }
      const written = await writeArticle({ brand: src.brand, sourceUrl: c.url, sourceTitle: a.title, text: a.text })
      if (!written || written.skip) { stats.skipped++; return }
      if (stats.created >= maxCreate) return
      await saveRelease(sanity, { brand: src.brand, sourceUrl: c.url, sourceTitle: a.title, sourceDate: a.date, images, written, existingSlugs: slugs })
      stats.created++; made[src.brand] = (made[src.brand] || 0) + 1
      if (row) row.created++
      stats.saved.push(src.brand + ': ' + written.title)
    } catch (e) {
      stats.failed++; stats.errors.push(src.brand + ': ' + e.message.slice(0, 100))
    }
  }

  while (idx < work.length && stats.created < maxCreate) {
    if (Date.now() > deadline) { exhausted = false; break }
    const chunk = work.slice(idx, idx + 4); idx += 4
    await Promise.all(chunk.map(handle))
    await sleep(150)
  }
  const remaining = Math.max(0, work.length - idx) + (stats.created >= maxCreate ? 1 : 0)

  // 3. remember how each source did (powers the admin source table)
  try {
    await sanity.createOrReplace({
      _id: STATE_ID, _type: 'pressPullState',
      lastRunAt: new Date().toISOString(), lastCreated: stats.created,
      sources: report.map(r => ({ _key: brandSlug(r.brand), brand: r.brand, status: r.status, candidates: r.candidates, created: r.created, checkedAt: new Date().toISOString(), note: r.note })),
    })
  } catch {}

  return { ...stats, sources: report, sourceCount: sources.length, remaining, done: exhausted && remaining === 0, ms: Date.now() - t0 }
}

// ── IMAGE REPAIR ─────────────────────────────────────────────────────────────
// Re-reads the original release page for every article that has no real photo yet (or has not
// had its body images added), uploads the manufacturer's images to the Sanity CDN, and weaves them in.
export async function runPressRepair(opts = {}) {
  const t0 = Date.now()
  const deadline = t0 + (opts.deadlineMs || 235000)
  const max = Math.min(80, Math.max(1, parseInt(opts.max, 10) || 30))
  const sanity = getSanity()
  // anything not yet checked under the current image rules (a rules bump re-checks every article)
  const filter = `_type=="pressRelease" && editorLocked != true && (imagesDone != true || coalesce(imagesVersion,0) < ${IMAGE_RULES_VERSION})` +
    (opts.force ? '' : ` && (coalesce(imageTries,0) < 3 || coalesce(imagesVersion,0) < ${IMAGE_RULES_VERSION})`)
  // redo: walk EVERY unlocked article (cursor = last _id) so cross-article duplicate checks see the full picture
  const redo = !!opts.redo
  const after = redo ? String(opts.after || '') : ''
  const where = redo ? `_type=="pressRelease" && editorLocked != true && _id > $after` : filter
  const rows = await sanity.fetch(`*[${where}] | order(${redo ? '_id asc' : 'publishedAt desc'})[0...${max}]{ _id, brand, title, sourceUrl, body, "hasHero": defined(heroImage.asset) }`, { after })
  const stats = { fixed: 0, missing: 0, failed: 0, saved: [] }
  const usage = await loadImageUsage(sanity)
  let i = 0
  async function one(r) {
    try {
      const page = r.sourceUrl ? await fetchPage(r.sourceUrl) : { ok: false }
      if (!page.ok) {
        stats.failed++
        await sanity.patch(r._id).setIfMissing({ imageTries: 0 }).inc({ imageTries: 1 }).commit()
        return
      }
      const images = await collectImages(sanity, page, r.sourceUrl, { brand: r.brand, label: r.title, usage, selfId: r._id })
      if (!images.hero) {
        // page loaded but it has no usable real photo under the current rules: take the article offline (no placeholders)
        stats.missing++
        await sanity.patch(r._id).setIfMissing({ imageTries: 0 }).inc({ imageTries: 1 })
          .set({ imageStatus: 'missing', imagesVersion: IMAGE_RULES_VERSION, imagesDone: false, imageHashes: [], body: stripFigures(r.body || '') })
          .unset(['heroImage', 'imageUrl', 'heroSourceUrl']).commit()
        return
      }
      await sanity.patch(r._id).set({
        heroImage: { _type: 'image', asset: { _type: 'reference', _ref: images.hero.assetId } },
        heroSourceUrl: images.hero.sourceUrl,
        body: weaveImages(stripFigures(r.body || ''), images.body, r.brand),
        imageHashes: [images.hero, ...images.body].map(i => i.hash).filter(Boolean),
        imagesDone: true, imagesVersion: IMAGE_RULES_VERSION, imageStatus: 'ok', imageTries: 0,
      }).unset(['imageUrl']).commit()
      stats.fixed++
      stats.saved.push(r.brand + ': ' + (r.title || '').slice(0, 60) + ' (' + (1 + images.body.length) + ' img)')
    } catch (e) {
      stats.failed++
    }
  }
  while (i < rows.length && Date.now() < deadline) {
    const chunk = rows.slice(i, i + 3); i += 3
    await Promise.all(chunk.map(one))
  }
  if (redo) {
    const next = rows.length ? rows[rows.length - 1]._id : after
    const more = await sanity.fetch(`count(*[_type=="pressRelease" && editorLocked != true && _id > $next])`, { next }).catch(() => 0)
    return { ...stats, remaining: more, next, done: more === 0, ms: Date.now() - t0 }
  }
  const remaining = await sanity.fetch(`count(*[${filter}])`).catch(() => 0)
  return { ...stats, remaining, done: remaining === 0, ms: Date.now() - t0 }
}

export { STATE_ID }
