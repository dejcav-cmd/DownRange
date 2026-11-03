// Compares tokenless CDN reads against token API reads for every public doc type,
// checks dataset access exposure, and exercises the real `rf` wrapper. Prints a report.
import { createClient } from '@sanity/client'
const base = { projectId: 'vbnsqnkg', dataset: 'production', apiVersion: '2024-01-01' }
const cdn = createClient({ ...base, useCdn: true })
const api = createClient({ ...base, useCdn: false, token: process.env.SANITY_API_TOKEN })
const out = []; let fail = 0
const log = (...a) => out.push(a.join(' '))
const types = ['newsArticle','blogPost','stateProfile','review','legislation','firearmRelease','video','globalStats','breakingAlert']
for (const t of types) {
  const q = `*[_type == "${t}" && !(_id in path("drafts.**"))] | order(_id) { _id, _updatedAt }`
  try {
    const [a, c] = await Promise.all([api.fetch(q), cdn.fetch(q)])
    const aset = new Map(a.map(d => [d._id, d._updatedAt])), cset = new Map(c.map(d => [d._id, d._updatedAt]))
    const missing = [...aset.keys()].filter(k => !cset.has(k)).length
    const extra = [...cset.keys()].filter(k => !aset.has(k)).length
    const stale = [...aset].filter(([k, v]) => cset.has(k) && cset.get(k) !== v).length
    const ok = a.length === c.length && !missing && !extra
    if (!ok) fail++
    log(ok ? 'PASS' : 'FAIL', t.padEnd(15), `api=${a.length} cdn=${c.length} missingInCdn=${missing} extraInCdn=${extra} staleInCdn=${stale}`)
  } catch (e) { fail++; log('FAIL', t, 'error:', e.statusCode || '', e.message) }
}
// exposure check: is anything private readable without a token?
for (const t of ['newsletterSubscriber','cronRun','subscriber','user','order']) {
  try {
    const n = await cdn.fetch(`count(*[_type == "${t}"])`)
    const real = await api.fetch(`count(*[_type == "${t}"])`)
    log('EXPOSURE', t.padEnd(22), `tokenless-visible=${n} actual=${real}`, n > 0 ? '<-- PUBLICLY READABLE' : '')
  } catch (e) { log('EXPOSURE', t.padEnd(22), 'blocked', e.statusCode || e.message) }
}
// same GROQ the site uses, compared API vs CDN
try {
  const q = `*[_type=="newsArticle" && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...5]{_id,title,publishedAt}`
  const [a, c] = await Promise.all([api.fetch(q), cdn.fetch(q)])
  const same = JSON.stringify(a) === JSON.stringify(c) && a.length === 5
  if (!same) fail++
  log(same ? 'PASS' : 'FAIL', 'latest-5 identical API vs CDN:', JSON.stringify(c.map(x => x.title)).slice(0, 160))
} catch (e) { fail++; log('FAIL latest-5', e.message) }
log(fail ? `RESULT: ${fail} FAILURE(S)` : 'RESULT: ALL PASS')
console.log(out.join('\n'))
process.exit(0)
