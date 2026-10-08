export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { callAIText } from '../../../../lib/aiClient.js'
import { reportCronRun } from '../../../../lib/cronReporter'
import { STATE_SEED } from '../../../../lib/stateSeed.js'

// Monthly state-law data sync (runs from GitHub Actions: state-data-sync.yml, 8th of each month).
// Inputs per state: the "Summary table" rows from Wikipedia's "Gun laws in <state>" article, and
// whether handgunlaw.us lists the state as permitless carry. Claude Haiku turns the rows into
// numbers; permitless carry always follows handgunlaw.us. Writes to the stateProfile fields the
// site already reads: constitutionalCarry, magLimit (0 = none), awbStatus, redFlagLaw, waitPeriod.

const NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}
const CODES = Object.keys(NAMES)

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

const authed = req => { const adm = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY; return !!adm && req.headers.get('x-admin-key') === adm }

async function parseState(code, rows) {
  const prompt = `These are rows from the "Summary table" of Wikipedia's "Gun laws in ${NAMES[code]}" article. Each row is: subject | answer for the main column | answer for the second column | notes.

Return ONLY a JSON object:
{"magLimit":0,"awb":"None","waitDays":0,"redFlag":false}

Rules:
- "magLimit": the maximum rounds allowed in a magazine under state law as an integer. 0 if the state has no magazine capacity restriction. If there are different limits (for example 10 for long guns and 15 for handguns) use the lowest.
- "awb": "Banned" if the state bans sale of assault weapons, "Partial" if only some types or only handguns or limited, otherwise "None".
- "waitDays": the statewide waiting period for buying a firearm in days (convert hours to days, rounding up; 72 hours = 3). 0 if none.
- "redFlag": true if the state has a red flag / extreme risk protection order law.
Use only the rows given.

ROWS:
${rows.slice(0, 6000)}`
  let j = null
  for (let a = 0; a < 3 && !j; a++) {
    try { const raw = await callAIText({ prompt, useCase: 'fast', maxTokens: 1200 }); const m = raw.match(/\{[\s\S]*\}/); if (m) j = JSON.parse(m[0]) } catch (e) { if (a === 2) throw e }
  }
  if (!j) throw new Error('no JSON')
  const mag = Number.isFinite(+j.magLimit) ? Math.max(0, Math.round(+j.magLimit)) : 0
  const wait = Number.isFinite(+j.waitDays) ? Math.max(0, Math.round(+j.waitDays)) : 0
  const awb = ['Banned', 'Partial', 'None'].includes(j.awb) ? j.awb : 'None'
  // The table's Yes/No column is the gate; the AI only supplies the numbers behind a "Yes".
  const gate = re => {
    const line = rows.split('\n').find(l => re.test(l.split('|')[0]))
    if (!line) return null
    const c = (line.split('|')[1] || '').trim().toLowerCase()
    return c.startsWith('yes') ? 'yes' : c.startsWith('partial') ? 'partial' : c.startsWith('no') ? 'no' : null
  }
  const gMag = gate(/magazine/i), gAwb = gate(/assault/i), gRf = gate(/red flag/i), gWait = gate(/waiting/i)
  const out = { magLimit: mag, awb, waitDays: wait, redFlag: !!j.redFlag, gates: { mag: gMag, awb: gAwb, rf: gRf, wait: gWait } }
  if (gMag === 'no') out.magLimit = 0
  if (gAwb === 'no') out.awb = 'None'; else if (gAwb === 'partial') out.awb = 'Partial'; else if (gAwb === 'yes' && out.awb === 'None') out.awb = 'Banned'
  if (gRf) out.redFlag = gRf !== 'no'
  if (gWait === 'no') out.waitDays = 0
  if (out.magLimit > 0 && (out.magLimit < 5 || out.magLimit > 30)) throw new Error(`implausible magLimit ${out.magLimit}`)
  if (out.waitDays > 30) throw new Error(`implausible waitDays ${out.waitDays}`)
  if (gMag === 'yes' && out.magLimit === 0) throw new Error('magazine restriction Yes but no limit found')
  return out
}

async function mapLimit(items, n, fn) {
  const out = []; let i = 0
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]) } }))
  return out
}

export async function POST(req) {
  if (!authed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const t0 = Date.now()
  let body
  try { body = await req.json() } catch { return Response.json({ error: 'bad json' }, { status: 400 }) }
  const states = body?.states || {}
  const permitless = new Set((body?.permitless || []).map(String))
  const dry = body?.dry === true
  const verified = body?.verified || null
  const codes = Object.keys(states).filter(c => NAMES[c])
  try {
    if (codes.length < 45) throw new Error(`only ${codes.length} states received`)
    if (permitless.size < 20) throw new Error(`permitless list looks wrong (${permitless.size})`)
    const parsed = {}, errors = []
    await mapLimit(codes, 8, async code => {
      try { parsed[code] = await parseState(code, states[code].rows || '') } catch (e) { errors.push(`${code}: ${e.message}`) }
    })
    if (Object.keys(parsed).length < 45) throw new Error(`parsed only ${Object.keys(parsed).length}/50: ${errors.slice(0, 5).join('; ')}`)

    const current = await sanity.fetch(`*[_type=="stateProfile"]{abbr,constitutionalCarry,magLimit,awbStatus,redFlagLaw,waitPeriod}`).catch(() => [])
    const curMap = Object.fromEntries((current || []).map(c => [c.abbr, c]))
    const changes = [], reviews = []
    const checkedAt = new Date().toISOString()
    let tx = sanity.transaction()
    for (const code of Object.keys(parsed)) {
      const p = parsed[code]
      const cc = permitless.has(NAMES[code]) || permitless.has(code)
      const c0 = curMap[code] || {}
      const sd = STATE_SEED[code] || {}
      // baseline = what the site shows now (Sanity value, else seed)
      const base = {
        mag: c0.magLimit ?? sd.magLimit ?? 0,
        awb: String(c0.awbStatus ?? sd.awbStatus ?? 'none').toLowerCase(),
        rf: c0.redFlagLaw ?? sd.redFlagLaw,
      }
      const g = p.gates
      const doc = { constitutionalCarry: cc, lawsVerified: verified, lawsCheckedAt: checkedAt }
      const diff = [], review = []
      // Only definite Yes/No answers from the source table are applied. Unknown rows are left alone,
      // and anything that would REMOVE a restriction the site currently shows is held for review.
      if (g.mag) {
        if (p.magLimit === 0 && (base.mag || 0) > 0) review.push(`mag ${base.mag}->none`)
        else { doc.magLimit = p.magLimit; if ((base.mag || 0) !== p.magLimit) diff.push(`mag ${base.mag || 0}->${p.magLimit}`) }
      }
      if (g.awb) {
        const nb = p.awb.toLowerCase(), cur = base.awb === 'full' ? 'banned' : base.awb
        if (nb === 'none' && cur !== 'none') review.push(`awb ${cur}->none`)
        else { doc.awbStatus = p.awb; if (nb !== cur) diff.push(`awb ${cur}->${nb}`) }
      }
      if (g.rf) {
        if (!p.redFlag && base.rf) review.push('redflag true->false')
        else { doc.redFlagLaw = p.redFlag; if (!!base.rf !== p.redFlag) diff.push(`redflag ${!!base.rf}->${p.redFlag}`) }
      }
      if (g.wait === 'no') { doc.waitPeriod = 'None' }
      else if (g.wait && p.waitDays) { doc.waitPeriod = `${p.waitDays} days` }
      if (c0.constitutionalCarry !== undefined ? !!c0.constitutionalCarry !== cc : !!sd.constitutionalCarry !== cc) diff.push(`carry ${c0.constitutionalCarry ?? sd.constitutionalCarry}->${cc}`)
      if (review.length) reviews.push(`${code}: ${review.join(', ')}`)
      if (diff.length) changes.push(`${code}: ${diff.join(', ')}`)
      tx = tx.createIfNotExists({ _id: `state-${code.toLowerCase()}`, _type: 'stateProfile', name: NAMES[code], abbr: code })
        .patch(`state-${code.toLowerCase()}`, { set: doc })
    }
    if (!dry) await tx.commit()
    const summary = `${Object.keys(parsed).length} states parsed, ${changes.length} changed, ${reviews.length} held for review${errors.length ? `, ${errors.length} errors` : ''}${dry ? ' (dry run)' : ''}`
    await reportCronRun('state-laws-sync', { status: errors.length ? 'warning' : 'success', ms: Date.now() - t0, details: summary, error: errors.length ? errors.slice(0, 3).join('; ') : null })
    return Response.json({ ok: true, summary, errors, changes, reviews, audit: Object.fromEntries(Object.entries(parsed).map(([c, p]) => [c, `${p.magLimit}/${p.awb}/${p.waitDays}/${p.redFlag ? 'RF' : '-'} g=${Object.values(p.gates).map(x => x || '?').join(',')}`])) })
  } catch (e) {
    await reportCronRun('state-laws-sync', { status: 'failed', ms: Date.now() - t0, error: e.message }).catch(() => {})
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
