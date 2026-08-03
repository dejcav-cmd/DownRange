/**
 * Live test for the giveaway scrapers. Runs the REAL lib/giveawaySources.js
 * against the real sites from a datacenter IP — the same conditions the Vercel
 * cron runs under. Fails loudly if a required source comes back empty or if the
 * rows it produces don't look like giveaways.
 */
import { scrapeAllSources, SOURCES, dedup, normalizeUrl } from '../lib/giveawaySources.js'

const results = await scrapeAllSources()
let fatal = 0

for (const r of results) {
  const required = SOURCES.find(s => s.name === r.name)?.required
  console.log(`\n=== ${r.name} ${required ? '(required)' : '(optional)'} ===`)
  console.log(`   via=${r.via} status=${r.status} rows=${r.giveaways.length}${r.reason ? ' reason=' + r.reason : ''}`)
  for (const g of r.giveaways.slice(0, 8)) {
    console.log(`   • ${g.title.slice(0, 62).padEnd(62)} | $${String(g.prizeValue).padEnd(6)} | ends ${g.endDate || '—'} | ${g.category.padEnd(11)} | ${g.entryUrl.slice(0, 55)}`)
  }
  if (required && r.giveaways.length === 0) {
    console.error(`   !! FATAL: required source ${r.name} returned 0 rows`)
    fatal++
  }
}

const all = dedup(results.flatMap(r => r.giveaways))
console.log(`\n--- ${results.reduce((n, r) => n + r.giveaways.length, 0)} raw -> ${all.length} after dedup ---`)

const today = new Date().toISOString().split('T')[0]
const withDate = all.filter(g => g.endDate)
const withValue = all.filter(g => g.prizeValue > 0)
const past = all.filter(g => g.endDate && g.endDate < today)
const badDate = all.filter(g => g.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(g.endDate))
const selfLink = all.filter(g => SOURCES.some(s => {
  try { return new URL(g.entryUrl).hostname.replace(/^www\./, '') === new URL(s.url).hostname.replace(/^www\./, '') } catch { return true }
}))

console.log(`end dates parsed : ${withDate.length}/${all.length}`)
console.log(`values parsed    : ${withValue.length}/${all.length}`)
console.log(`already expired  : ${past.length}`)
console.log(`malformed dates  : ${badDate.length}`)
console.log(`self-links (bad) : ${selfLink.length}`)
console.log(`unique norm urls : ${new Set(all.map(g => normalizeUrl(g.entryUrl))).size}`)

if (all.length < 15) { console.error(`!! FATAL: only ${all.length} total giveaways, expected 15+`); fatal++ }
if (withDate.length < all.length * 0.5) { console.error('!! FATAL: fewer than half the rows have an end date'); fatal++ }
if (badDate.length) { console.error('!! FATAL: malformed end dates present'); fatal++ }
if (selfLink.length) { console.error('!! FATAL: clean-link rule violated'); fatal++ }

console.log(fatal ? `\nFAILED (${fatal})` : '\nPASSED')
process.exit(fatal ? 1 : 0)
