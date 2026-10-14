// Token-optimized radar pipeline.
//  - No AI for fetching, classifying or diffing. Items are hashed; unchanged items cost nothing.
//  - One batched Haiku call, only for milestone changes (grant / decision / denial) and
//    new DOJ items with no summary. Capped at 8 items and 700 output tokens per run.
//  - Seed docs use createIfNotExists so live and manual edits are never overwritten.
import crypto from 'crypto'
import { writeClient } from '../../sanity/lib/client'
import { callAI } from '../aiClient'
import { SEED } from './seed'
import { fetchFederalRegister, fetchDojRss, fetchCongressBills, fetchCourtListener, fetchScotusDocket } from './sources'

const hash = (o) => crypto.createHash('md5').update(JSON.stringify(o)).digest('hex').slice(0, 12)
const idOf = (i) => i._id || `lc-${i.slug}`

export async function runRadar({ mode = 'light', deadlineMs = 240000, dryRun = false } = {}) {
  const t0 = Date.now()
  const left = () => deadlineMs - (Date.now() - t0)
  const out = { mode, created: 0, updated: 0, unchanged: 0, scotusChecked: 0, aiItems: 0, errors: [] }

  const existing = await writeClient.fetch(
    `*[_type=="legalCase"]{_id, changeHash, locked, status, docket, court, events, stage, nextDate}`)
  const have = new Map(existing.map(d => [d._id, d]))
  const tx = writeClient.transaction()
  let ops = 0
  const milestones = []

  if (mode === 'seed') {
    for (const s of SEED) { if (!have.has(s._id)) { tx.createIfNotExists({ ...s, changeHash: hash(s) }); ops++; out.created++ } }
    if (!dryRun && ops) await tx.commit()
    return out
  }

  // 1. Generic sources
  const jobs = [['federalregister', fetchFederalRegister], ['doj', fetchDojRss]]
  if (mode === 'full') {
    jobs.push(['congress', () => fetchCongressBills(process.env.CONGRESS_GOV_KEY)])
    jobs.push(['courtlistener', () => fetchCourtListener(process.env.COURTLISTENER_TOKEN)])
  }
  for (const [name, fn] of jobs) {
    if (left() < 30000) break
    try {
      for (const item of await fn()) {
        const _id = idOf(item), h = hash([item.title, item.stageLabel, item.lastDate])
        const cur = have.get(_id)
        if (cur?.locked) { out.unchanged++; continue }
        if (cur && cur.changeHash === h) { out.unchanged++; continue }
        const doc = { ...item, _id, _type: 'legalCase', changeHash: h }
        if (cur) { tx.patch(_id, p => p.set(doc)); out.updated++ } else { tx.createIfNotExists(doc); out.created++ }
        ops++
        if (item.kind === 'doj' && !cur) milestones.push({ _id, text: `${item.title}. ${item.summary}` })
      }
    } catch (e) { out.errors.push(`${name}: ${e.message}`) }
  }

  // 2. SCOTUS dockets for active tracked cases (seed or live)
  const tracked = [...new Map([...SEED, ...existing].filter(d => d.court === 'scotus' && d.docket && (d.status || 'active') === 'active').map(d => [d.docket, d])).values()]
  for (const t of tracked) {
    if (left() < 20000) break
    try {
      const dk = await fetchScotusDocket(t.docket)
      out.scotusChecked++
      if (!dk) continue
      const _id = idOf(t), cur = have.get(_id), h = hash([dk.lastText, dk.count])
      if (cur?.changeHash === h || cur?.locked) { out.unchanged++; continue }
      const set = { changeHash: h, lastDate: dk.lastDate, source: 'scotus', needsReview: false }
      const ev = { _key: h, date: dk.lastDate, label: dk.lastText.slice(0, 140) }
      const conf = dk.lastText.match(/Conference of (\w+ \d{1,2}, \d{4})/i)
      if (conf) { const d = new Date(conf[1]); if (!isNaN(d)) { set.nextDate = d.toISOString().slice(0, 10); set.nextLabel = 'Conference' } }
      if (/petition.*denied|certiorari denied/i.test(dk.lastText)) { Object.assign(set, { status: 'denied', stage: 'denied', stageLabel: `Cert denied ${dk.lastDate}`, outcome: 'Cert denied' }); milestones.push({ _id, text: `${t.title}: cert denied` }) }
      else if (/petition.*granted|certiorari granted/i.test(dk.lastText)) { Object.assign(set, { stage: 'granted', stageLabel: 'Cert granted' }); milestones.push({ _id, text: `${t.title}: cert granted` }) }
      else if (/\bargued\b/i.test(dk.lastText)) set.stage = 'argued'
      if (cur) tx.patch(_id, p => p.set(set).setIfMissing({ events: [] }).append('events', [ev]))
      else tx.createIfNotExists({ ...t, ...set, _type: 'legalCase', events: [...(t.events || []), ev] })
      ops++; out.updated++
    } catch (e) { out.errors.push(`scotus ${t.docket}: ${e.message}`); if (out.errors.length > 5) break }
  }

  // 3. One batched AI call for milestone summaries (skipped when there is nothing)
  const batch = milestones.slice(0, 8)
  if (batch.length && left() > 25000 && process.env.ANTHROPIC_API_KEY) {
    try {
      const prompt = `For each item write one plain sentence (max 30 words) for gun owners saying what happened. No hype. Return only JSON: [{"id":"..","s":".."}].\n` +
        batch.map(b => `${b._id}: ${b.text.slice(0, 300)}`).join('\n')
      const r = await callAI({ prompt, maxTokens: 700, useCase: 'law' })
      const arr = JSON.parse((r.text || '').replace(/```json|```/g, '').trim())
      for (const a of arr) { if (batch.find(b => b._id === a.id)) { tx.patch(a.id, p => p.set({ summary: a.s })); ops++ } }
      out.aiItems = arr.length
    } catch (e) { out.errors.push(`ai: ${e.message}`) }
  }

  if (!dryRun && ops) await tx.commit()
  out.ops = ops
  return out
}
