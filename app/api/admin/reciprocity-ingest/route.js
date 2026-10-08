export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { callAIText } from '../../../../lib/aiClient.js'
import { reportCronRun } from '../../../../lib/cronReporter'

// Monthly CCW reciprocity sync.
// A GitHub Actions workflow (reciprocity-sync.yml, 8th of each month) downloads the 50 state
// PDFs from handgunlaw.us, cuts out each "Permits/Licenses This State Honors" section and
// POSTs them here. We turn each section into a list of state codes with Claude Haiku, then
// store, per state:
//   reciprocityHonors  = states whose permits THIS state honors
//   reciprocityStates  = states that honor THIS state's permit (the inverse; what travellers need)
//   reciprocityNotes   = short qualifiers (enhanced permit only, resident only, age 21+, ...)
//   reciprocityVerified = the "Last Updated" date printed on the source page
//   reciprocityCheckedAt = when this sync ran

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

function authed(req) {
  const k = req.headers.get('x-admin-key')
  const adm = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
  return !!adm && k === adm
}

async function parseSection(code, section) {
  const prompt = `Below is the section of a state concealed-carry reciprocity page for ${NAMES[code]} that lists which other states' permits ${NAMES[code]} honors. Footnotes may follow the list.

Return ONLY a JSON object, no prose:
{"honors":["XX",...],"allOtherStates":false,"none":false,"notes":"..."}

Rules:
- "honors": 2-letter codes of the states whose permits ${NAMES[code]} honors, only states named in the text.
- If the text says it honors all other states' permits, set "allOtherStates": true and leave "honors" empty.
- If it says it honors no out-of-state permits, set "none": true.
- "notes": one plain sentence (max 220 chars) with the qualifiers (for example enhanced permit only, resident permits only, age 21+). Empty string if none.

TEXT:
${section.slice(0, 5000)}`
  let j = null, raw = ''
  for (let attempt = 0; attempt < 3 && !j; attempt++) {
    try {
      raw = await callAIText({ prompt, useCase: 'fast', maxTokens: 1500 })
      const m = raw.match(/\{[\s\S]*\}/)
      if (m) j = JSON.parse(m[0])
    } catch (e) { if (attempt === 2) throw e }
  }
  if (!j) throw new Error(`no JSON (got: ${raw.slice(0, 80).replace(/\s+/g, ' ')})`)
  let honors = Array.isArray(j.honors) ? j.honors.map(x => String(x).toUpperCase()) : []
  const lower = section.toLowerCase()
  // Safety net: keep only valid codes whose full state name really appears in the source text
  honors = honors.filter(c => c !== code && NAMES[c] && lower.includes(NAMES[c].toLowerCase()))
  if (j.allOtherStates) honors = CODES.filter(c => c !== code)
  if (j.none) honors = []
  return { honors: [...new Set(honors)].sort(), notes: String(j.notes || '').slice(0, 240), all: !!j.allOtherStates, none: !!j.none }
}

async function mapLimit(items, n, fn) {
  const out = []; let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]) }
  }))
  return out
}

export async function POST(req) {
  if (!authed(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const t0 = Date.now()
  let body
  try { body = await req.json() } catch { return Response.json({ error: 'bad json' }, { status: 400 }) }
  const states = body?.states || {}
  const dry = body?.dry === true
  const codes = Object.keys(states).filter(c => NAMES[c])
  try {
    if (codes.length < 45) throw new Error(`only ${codes.length} states received, expected 50`)
    const parsed = {}
    const errors = []
    await mapLimit(codes, 8, async code => {
      const s = states[code]
      try {
        if (!s?.honorsText || s.honorsText.length < 20) throw new Error('empty section')
        parsed[code] = { ...(await parseSection(code, s.honorsText)), verified: s.updated || null }
      } catch (e) { errors.push(`${code}: ${e.message}`) }
    })
    if (Object.keys(parsed).length < 45) throw new Error(`parsed only ${Object.keys(parsed).length}/50: ${errors.slice(0, 5).join('; ')}`)

    // Inverse: which states honor each state's permit
    const honoredBy = Object.fromEntries(CODES.map(c => [c, []]))
    for (const [code, p] of Object.entries(parsed)) for (const h of p.honors) honoredBy[h].push(code)

    const checkedAt = new Date().toISOString()
    if (!dry) {
      let tx = sanity.transaction()
      for (const code of Object.keys(parsed)) {
        const p = parsed[code]
        tx = tx.createIfNotExists({ _id: `state-${code.toLowerCase()}`, _type: 'stateProfile', name: NAMES[code], abbr: code })
          .patch(`state-${code.toLowerCase()}`, { set: {
            reciprocityHonors: p.honors,
            reciprocityStates: honoredBy[code].sort(),
            reciprocityNotes: p.notes,
            reciprocityVerified: p.verified,
            reciprocityCheckedAt: checkedAt,
          } })
      }
      await tx.commit()
    }
    const summary = `${Object.keys(parsed).length} states parsed${errors.length ? `, ${errors.length} errors` : ''}${dry ? ' (dry run)' : ''}`
    await reportCronRun('reciprocity-sync', { status: errors.length ? 'warning' : 'success', ms: Date.now() - t0, details: summary, error: errors.length ? errors.slice(0, 3).join('; ') : null })
    return Response.json({
      ok: true, summary, errors,
      sample: Object.fromEntries(['WA', 'FL', 'TX', 'CA'].map(c => [c, { honors: parsed[c]?.honors, honoredBy: honoredBy[c], notes: parsed[c]?.notes, verified: parsed[c]?.verified }])),
    })
  } catch (e) {
    await reportCronRun('reciprocity-sync', { status: 'failed', ms: Date.now() - t0, error: e.message }).catch(() => {})
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
