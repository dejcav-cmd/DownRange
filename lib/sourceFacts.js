// Pulls the readable text of a source article so the rewriter has real facts to work from.
// Before this, the rewriter only saw a 400-char RSS snippet, so it either failed (article
// published with one paragraph) or padded. Best-effort: returns '' when the page cannot be read.
// The rewrite prompts still require facts only, a new structure and original analysis.

const UA = 'Mozilla/5.0 (compatible; DownRangeBot/1.0; +https://www.downrangeco.com)'

function clean(html) {
  return html
    .replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
}

function decode(s) {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;|&ndash;/g, '-').replace(/&#x27;/g, "'").replace(/&hellip;/g, '...')
}

export async function fetchSourceFacts(url, { maxChars = 4000, timeoutMs = 9000 } = {}) {
  if (!url || !/^https?:\/\//i.test(url)) return ''
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' })
    if (!res.ok) return ''
    const html = clean(await res.text())
    // Prefer the <article> element, fall back to the whole body.
    const art = html.match(/<article[\s\S]*?<\/article>/i)?.[0] || html
    const paras = [...art.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map(m => decode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim())
      .filter(p => p.length > 60 && !/^(share|subscribe|sign up|click here|related|advertisement|read more|copyright)/i.test(p))
    const text = paras.join('\n\n')
    return text.length > 200 ? text.slice(0, maxChars) : ''
  } catch { return '' }
}

// Plain word count of an HTML body.
export const wordCount = (html) => (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
