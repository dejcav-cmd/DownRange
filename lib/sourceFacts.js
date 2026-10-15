// Pulls the readable text of a source article so the rewriter has real facts to work from.
// Best-effort and layered, because many outlets (Bearing Arms, TTAG, TFB) refuse plain bot requests:
//   1. direct fetch with a browser-like request, preferring JSON-LD articleBody, then <article> paragraphs
//   2. the Jina reader (renders the page and returns clean text) when the direct read is thin
// Returns '' when nothing readable is found. The rewrite prompts still require facts only,
// a new structure and original analysis.

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function clean(html) {
  return html
    .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
}

function decode(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;|&ndash;/g, '-').replace(/&#x27;/g, "'").replace(/&hellip;/g, '...')
}

const BOILER = /^(share|subscribe|sign up|click here|related|advertisement|read more|copyright|follow us|join|©|comments?\b|tags?:|filed under|the post .* appeared first)/i

// schema.org articleBody from JSON-LD, when the site publishes it (cleanest source of the full text)
function jsonLdBody(rawHtml) {
  const out = []
  for (const m of rawHtml.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (n) => {
        if (!n) return
        if (Array.isArray(n)) return n.forEach(walk)
        if (typeof n === 'object') {
          if (typeof n.articleBody === 'string' && n.articleBody.length > 300) out.push(n.articleBody)
          Object.values(n).forEach(v => typeof v === 'object' && walk(v))
        }
      }
      walk(JSON.parse(m[1].trim()))
    } catch { /* ignore malformed JSON-LD */ }
  }
  return out.sort((a, b) => b.length - a.length)[0] || ''
}

async function direct(url, timeoutMs) {
  const res = await fetch(url, {
    headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9', Referer: 'https://www.google.com/' },
    signal: AbortSignal.timeout(timeoutMs), redirect: 'follow',
  })
  if (!res.ok) return ''
  const raw = await res.text()
  const ld = jsonLdBody(raw)
  if (ld) return decode(ld.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  const html = clean(raw)
  const art = html.match(/<article[\s\S]*?<\/article>/i)?.[0] || html
  const paras = [...art.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(m => decode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 60 && !BOILER.test(p))
  return paras.join('\n\n')
}

async function jina(url, timeoutMs) {
  const res = await fetch('https://r.jina.ai/' + url, { headers: { Accept: 'text/plain', 'X-Return-Format': 'text' }, signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) return ''
  const txt = await res.text()
  const paras = txt.split(/\n{2,}/)
    .map(p => p.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*_>`]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 80 && !BOILER.test(p) && !/^(title|url source|published time|markdown content):/i.test(p))
  return paras.join('\n\n')
}

export async function fetchSourceFacts(url, { maxChars = 6000, timeoutMs = 9000 } = {}) {
  if (!url || !/^https?:\/\//i.test(url)) return ''
  let text = ''
  try { text = await direct(url, timeoutMs) } catch { /* fall through to reader */ }
  if (text.length < 900) {
    try {
      const alt = await jina(url, Math.max(timeoutMs, 14000))
      if (alt.length > text.length) text = alt
    } catch { /* keep whatever the direct read found */ }
  }
  return text.length > 200 ? text.slice(0, maxChars) : ''
}

// Plain word count of an HTML body.
export const wordCount = (html) => (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
