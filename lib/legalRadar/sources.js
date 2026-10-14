// Radar sources. All keyword-filtered with no AI. Each returns plain objects and
// throws nothing the pipeline cannot absorb. Unverified live endpoints degrade to
// "no results" rather than failing the run.
import { classifyTopic, isFirearmText, statesInText, circuitOfState, slugify } from './constants'

const UA = { 'User-Agent': 'DownRangeBot/1.0 (+https://www.downrangeco.com)' }
const get = async (url, opts = {}) => {
  const r = await fetch(url, { headers: { ...UA, ...(opts.headers || {}) }, signal: AbortSignal.timeout(opts.timeout || 15000), cache: 'no-store' })
  if (!r.ok) throw new Error(`${r.status} ${url.slice(0, 80)}`)
  return r
}
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)
const strip = (s = '') => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').trim()

// Federal Register: ATF rules and notices (keyless).
export async function fetchFederalRegister() {
  const u = 'https://www.federalregister.gov/api/v1/documents.json?per_page=12&order=newest&conditions[agencies][]=alcohol-tobacco-firearms-and-explosives-bureau'
  const j = await (await get(u)).json()
  return (j.results || []).map(d => ({
    kind: 'rule', court: 'agency', title: d.title, slug: slugify(`fr-${d.document_number}`),
    topic: classifyTopic(d.title + ' ' + (d.abstract || '')), summary: strip(d.abstract || '').slice(0, 400),
    stage: d.type === 'Rule' ? 'decided' : 'pending', stageLabel: `${d.type} ${d.publication_date}`,
    status: d.type === 'Rule' ? 'decided' : 'active', lastDate: d.publication_date, url: d.html_url, source: 'federalregister',
    states: [], events: [{ date: d.publication_date, label: d.type }],
  }))
}

// DOJ press releases (RSS, best effort). Keeps only firearm related items.
export async function fetchDojRss() {
  const xml = await (await get('https://www.justice.gov/news/rss?type=press_release&m=1')).text()
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1])
  return items.map(it => {
    const tag = (t) => strip((it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)) || [])[1] || '')
    const title = tag('title'), desc = tag('description'), link = tag('link'), pub = tag('pubDate')
    return { title, desc, link, date: pub ? new Date(pub).toISOString().slice(0, 10) : null }
  }).filter(i => i.date && i.date >= daysAgo(30) && /second amendment|2nd amendment|firearm|gun/i.test(i.title + i.desc) && /sue|lawsuit|complaint|investigat|letter|civil rights|second amendment/i.test(i.title + i.desc))
    .slice(0, 8).map(i => {
      const st = statesInText(i.title + ' ' + i.desc)
      return {
        kind: 'doj', court: 'agency', title: i.title, slug: slugify(`doj-${i.title}`), topic: classifyTopic(i.title + ' ' + i.desc),
        summary: i.desc.slice(0, 400), stage: 'filed', stageLabel: `DOJ release ${i.date}`, status: 'active', lastDate: i.date,
        url: i.link, source: 'doj', states: st.slice(0, 3), circuit: st[0] ? circuitOfState(st[0]) : null, needsReview: true,
        events: [{ date: i.date, label: 'DOJ announcement' }],
      }
    })
}

const BILL_PATH = { HR: 'house-bill', S: 'senate-bill', HJRES: 'house-joint-resolution', SJRES: 'senate-joint-resolution' }

// Congress.gov: bills updated recently, filtered by title keywords. Title-only (no detail calls).
export async function fetchCongressBills(key) {
  if (!key) return []
  const u = `https://api.congress.gov/v3/bill/119?format=json&limit=250&sort=updateDate+desc&fromDateTime=${daysAgo(8)}T00:00:00Z&api_key=${key}`
  const j = await (await get(u)).json()
  return (j.bills || []).filter(b => isFirearmText(b.title)).slice(0, 25).map(b => {
    const num = `${b.type}${b.number}`
    return {
      kind: 'bill', court: 'congress', title: `${b.type} ${b.number}: ${b.title}`.slice(0, 220), slug: slugify(`bill-119-${num}`),
      docket: `${b.type} ${b.number}`, topic: classifyTopic(b.title), summary: '', stage: 'pending',
      stageLabel: (b.latestAction?.text || 'Introduced').slice(0, 90), status: 'active', lastDate: b.latestAction?.actionDate || b.updateDate?.slice(0, 10),
      url: `https://www.congress.gov/bill/119th-congress/${BILL_PATH[b.type] || 'house-bill'}/${b.number}`,
      source: 'congress', states: [], events: b.latestAction ? [{ date: b.latestAction.actionDate, label: b.latestAction.text.slice(0, 120) }] : [],
    }
  })
}

// CourtListener: recent opinions mentioning the Second Amendment (appellate). Token required.
export async function fetchCourtListener(token) {
  if (!token) return []
  const q = encodeURIComponent('"Second Amendment" AND (firearm OR magazine OR carry)')
  const u = `https://www.courtlistener.com/api/rest/v4/search/?type=o&q=${q}&order_by=dateFiled+desc&filed_after=${daysAgo(8)}&stat_Published=on`
  const j = await (await get(u, { headers: { Authorization: `Token ${token}` } })).json()
  return (j.results || []).slice(0, 15).map(r => {
    const cir = (r.court_id || '').match(/^ca(\d+|dc)$/)
    return {
      kind: 'case', court: cir ? 'circuit' : 'district', title: r.caseName, slug: slugify(`cl-${r.cluster_id}`),
      docket: r.docketNumber, circuit: cir ? cir[1].toUpperCase() : null, topic: classifyTopic(r.caseName + ' ' + (r.syllabus || '')),
      stage: 'decided', stageLabel: `Opinion ${r.dateFiled}`, status: 'decided', lastDate: r.dateFiled,
      url: `https://www.courtlistener.com${r.absolute_url}`, source: 'courtlistener', needsReview: true, states: [],
      summary: '', events: [{ date: r.dateFiled, label: 'Opinion filed' }],
    }
  })
}

// supremecourt.gov docket: latest proceeding for a tracked case. Returns null on parse failure.
export async function fetchScotusDocket(docket) {
  const html = await (await get(`https://www.supremecourt.gov/search.aspx?filename=/docket/docketfiles/html/public/${docket}.html`)).text()
  const rows = [...html.matchAll(/<tr[^>]*>\s*<td[^>]*class="ProceedingDate"[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*class="ProceedingText"[^>]*>([\s\S]*?)<\/td>/g)]
  if (!rows.length) return null
  const entries = rows.map(m => ({ rawDate: strip(m[1]), text: strip(m[2]) }))
  const last = entries[entries.length - 1]
  const d = new Date(last.rawDate)
  return { lastText: last.text, lastDate: isNaN(d) ? null : d.toISOString().slice(0, 10), count: entries.length, entries }
}
