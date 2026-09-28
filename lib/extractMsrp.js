// Deterministic MSRP extraction from manufacturer / press-release text.
// The AI writers were returning msrp: 0 even when the source stated a price
// (e.g. S&W Model 642 America 250: "$579 MSRP"), which left release pages with
// no price and broke their Product structured data.
//
// Only accepts prices explicitly tied to MSRP / retail / suggested price, so
// accessory prices, "save $50", or competitor prices are not picked up.
// Returns an integer USD value, or 0 when no confident match exists.

const PRICE = String.raw`\$\s?(\d{1,2},?\d{3}|\d{2,4})(?:\.(\d{2}))?`
const LABEL = String.raw`(?:MSRP|M\.S\.R\.P\.|suggested retail(?: price)?|retail price|starting (?:MSRP|price)|priced (?:at|from|starting at))`

const PATTERNS = [
  new RegExp(`${LABEL}\\s*(?:of|is|:|at|from|starts at|starting at|begins at)?\\s*(?:just|only|around|approximately)?\\s*${PRICE}`, 'gi'),
  new RegExp(`${PRICE}\\s*(?:USD\\s*)?(?:\\(|-|–)?\\s*${LABEL.replace('priced (?:at|from|starting at)|', '')}`, 'gi'),
]

export function extractMsrp(text = '') {
  if (!text || typeof text !== 'string') return 0
  const hits = []
  for (const re of PATTERNS) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) {
      const n = parseInt(m[1].replace(/,/g, ''), 10)
      // Plausible firearm price window — rejects "$5 off", "$25,000 raffle", etc.
      if (n >= 99 && n <= 15000) hits.push({ n, i: m.index })
    }
  }
  if (!hits.length) return 0
  // First stated MSRP in the text is the headline product's price.
  hits.sort((a, b) => a.i - b.i)
  return hits[0].n
}

// Normalise whatever the AI returned ("$579", "579.99", 579) to an integer, or 0.
export function normalizeMsrp(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 99 && v <= 15000 ? Math.round(v) : 0
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^0-9.]/g, ''))
    return Number.isFinite(n) && n >= 99 && n <= 15000 ? Math.round(n) : 0
  }
  return 0
}
