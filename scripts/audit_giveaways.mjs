/**
 * Audit every giveaway document in Sanity against the quality bar the scraper
 * now enforces at write time. Read-only — prints what would be retired.
 */
const TOKEN = (process.env.SANITY_TOKEN || '').replace(/^ST=/, '').trim()
const API = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

async function q(query) {
  const res = await fetch(`${API}?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: 'Bearer ' + TOKEN },
  })
  const j = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(j).slice(0, 300))
  return j.result
}

const all = await q('*[_type=="giveaway"]{_id,title,sponsor,entryUrl,prizeValue,endDate,active,sourceType,addedAt,source}')
console.log(`total giveaway docs: ${all.length}`)
console.log(`  active: ${all.filter(g => g.active).length}`)
console.log(`  no endDate: ${all.filter(g => !g.endDate).length}`)
console.log(`  no prizeValue: ${all.filter(g => !g.prizeValue).length}`)
console.log(`  neither: ${all.filter(g => !g.endDate && !g.prizeValue).length}`)

const host = u => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
const SOURCE_HOSTS = ['wintheguns.com', 'gungiveaways.net', 'gunmade.com']

const selfLink = all.filter(g => SOURCE_HOSTS.includes(host(g.entryUrl)))
const noSignal = all.filter(g => !g.endDate && !g.prizeValue)

console.log(`\n=== self-links (entryUrl points at an aggregator, not a sponsor) ===`)
for (const g of selfLink) console.log(`  ${g.active ? 'ACTIVE ' : 'inactive'} ${(g.title||'').slice(0,55).padEnd(55)} ${g.entryUrl}`)

console.log(`\n=== no end date AND no prize value (ONGOING forever) ===`)
for (const g of noSignal.slice(0, 60)) console.log(`  ${g.active ? 'ACTIVE ' : 'inactive'} ${(g.title||'').slice(0,50).padEnd(50)} | ${(g.sponsor||'').slice(0,22).padEnd(22)} | ${(g.entryUrl||'').slice(0,60)}`)

console.log(`\n=== ACTIVE docs, oldest addedAt first ===`)
const act = all.filter(g => g.active).sort((a,b) => (a.addedAt||'').localeCompare(b.addedAt||''))
for (const g of act.slice(0, 40)) console.log(`  ${(g.addedAt||'?').slice(0,10)} ${(g.endDate||'—').padEnd(10)} $${String(g.prizeValue||0).padEnd(6)} ${(g.title||'').slice(0,60)}`)
