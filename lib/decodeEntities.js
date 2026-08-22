/**
 * decodeHtmlEntities — strip all HTML entities from feed titles.
 *
 * RSS feeds (especially WordPress-based ones) encode special characters
 * as HTML numeric/named entities in their <title> tags. rss-parser passes
 * them through verbatim. This function decodes everything so titles like:
 *   "GOA&#039;s Lawsuit Over Gun &#038; Magazine Bans &#8211; TAKE ACTION"
 * become:
 *   "GOA's Lawsuit Over Gun & Magazine Bans – TAKE ACTION"
 *
 * Covers: named entities (&amp; &lt; &gt; &quot; &apos; &nbsp; &ndash;
 *         &mdash; &lsquo; &rsquo; &ldquo; &rdquo; &hellip;),
 *         decimal numeric (&#8211; &#038;), and hex numeric (&#x2014;).
 * Safe to call on null/undefined — returns '' in that case.
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return str || ''

  return str
    // Named entities (most common in WordPress RSS)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&hellip;/g, '…')
    .replace(/&trade;/g, '™')
    .replace(/&reg;/g, '®')
    .replace(/&copy;/g, '©')
    // Decimal numeric entities — covers &#038; &#8211; &#8212; &#8216; etc.
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    // Hex numeric entities — covers &#x26; &#x2014; etc.
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    // Collapse any double-decoded artifacts (e.g. &amp;amp; → &amp; → &)
    .replace(/&amp;/g, '&')
    .trim()
}

/**
 * stripCdata — remove literal CDATA wrapper markers that occasionally leak
 * through into parsed RSS text (title/description).
 *
 * rss-parser normally unwraps <![CDATA[ ... ]]> sections transparently as
 * part of standard XML parsing, but some feeds double-wrap content or use
 * non-standard formatting that the underlying XML parser doesn't fully
 * resolve, leaving the literal markers in the extracted text — e.g.
 *   "<![CDATA[When law enforcement opposes some pro-gun measure...]]>"
 * Root-caused 2026-08-22 on a Bearing Arms item; applied defensively to
 * every RSS-derived title/description regardless of source, since the
 * failure mode is silent (no error, just garbage text in the stored field).
 * Safe to call on null/undefined/already-clean strings.
 */
export function stripCdata(str) {
  if (!str || typeof str !== 'string') return str || ''
  return str
    .replace(/<!\[CDATA\[/gi, '')
    .replace(/\]\]>/g, '')
    .trim()
}
