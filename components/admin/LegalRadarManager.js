'use client'
import { useState, useEffect, useCallback } from 'react'

const FILTERS = [['all', 'All'], ['review', 'Unverified'], ['case', 'Cases'], ['doj', 'DOJ'], ['rule', 'Rules'], ['bill', 'Bills']]
const EDIT_FIELDS = [
  ['stageLabel', 'Stage label', 'text'], ['status', 'Status (active, decided, denied)', 'text'], ['nextDate', 'Next date (YYYY-MM-DD)', 'text'],
  ['nextLabel', 'Next event', 'text'], ['lastDate', 'Last activity (YYYY-MM-DD)', 'text'], ['summary', 'Summary', 'area'], ['ruling', 'Ruling', 'area'],
  ['impact', 'Impact for gun owners', 'area'], ['legal', 'In legal terms', 'area'], ['plain', 'In plain English', 'area'],
]
const mono = "'IBM Plex Mono', monospace"
const card = { background: 'var(--bg2)', border: '1px solid var(--border)', padding: 14 }
const btn = { fontFamily: mono, fontSize: 11, padding: '7px 12px', border: '1px solid var(--border-mid)', background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer' }

const ago = (d) => {
  if (!d) return '—'
  const n = Math.max(0, Math.round((Date.now() - Date.parse(d + 'T12:00:00Z')) / 864e5))
  return n === 0 ? 'today' : n === 1 ? '1 day ago' : n + ' days ago'
}
const when = (iso) => iso ? new Date(iso).toLocaleString() : 'never'

export default function LegalRadarManager({ adminKey }) {
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/legal-radar', { headers: H })
      setData(await r.json())
    } catch { setMsg('Could not load the radar') }
  }, [adminKey])
  useEffect(() => { load() }, [load])

  async function post(body, okMsg) {
    setBusy(true); setMsg('Working...')
    try {
      const r = await fetch('/api/admin/legal-radar', { method: 'POST', headers: H, body: JSON.stringify(body) })
      const d = await r.json().catch(() => ({}))
      setMsg(r.ok ? (okMsg || 'Done') + (d.result ? ': ' + JSON.stringify(d.result).slice(0, 220) : '') : 'Failed: ' + (d.error || r.status))
      await load()
    } catch { setMsg('Request failed or timed out') }
    setBusy(false)
  }

  if (!data) return <div style={{ ...card, fontFamily: mono, fontSize: 12 }}>{data === null ? 'Loading the radar...' : ''}{msg}</div>
  if (data.error) return <div style={{ ...card, fontFamily: mono, fontSize: 12 }}>Error: {data.error}</div>

  const last = data.runs?.[0]
  const items = data.items.filter(i => filter === 'all' ? true : filter === 'review' ? i.needsReview : i.kind === filter)
  const envChips = Object.entries(data.env)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        <div style={card}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-dim)' }}>LAST CRON RUN</div>
          <div style={{ fontSize: 18, color: last?.status === 'success' ? 'var(--green)' : last ? 'var(--red-bright)' : 'var(--text-dim)' }}>{last ? last.status.toUpperCase() : 'NEVER RUN'}</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text-muted)' }}>{last ? when(last.at) + ' · ' + last.ms + 'ms · ' + (last.trigger || 'cron') : 'Run seed first'}</div>
        </div>
        <div style={card}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-dim)' }}>SCHEDULE</div>
          <div style={{ fontSize: 14 }}>{data.schedule.label}</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text-muted)' }}>{data.schedule.cron}</div>
        </div>
        <div style={card}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-dim)' }}>ITEMS</div>
          <div style={{ fontSize: 18 }}>{data.counts.total}</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text-muted)' }}>{data.counts.unverified} unverified · {data.counts.locked} locked · {data.counts.notSaved} not in Sanity</div>
        </div>
        <div style={card}>
          <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-dim)' }}>KEYS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {envChips.map(([k, v]) => <span key={k} style={{ fontFamily: mono, fontSize: 10, padding: '2px 6px', border: '1px solid ' + (v ? 'var(--green)' : 'var(--red-bright)'), color: v ? 'var(--green)' : 'var(--red-bright)' }}>{v ? 'OK' : 'MISSING'} {k}</span>)}
          </div>
        </div>
      </div>

      {data.state?.result ? (
        <div style={{ ...card, fontFamily: mono, fontSize: 11, color: 'var(--text-muted)' }}>
          Last result ({data.state.mode}, {when(data.state.lastRunAt)}): created {data.state.result.created}, updated {data.state.result.updated}, unchanged {data.state.result.unchanged}, SCOTUS dockets read {data.state.result.scotusParsed}/{data.state.result.scotusChecked}
          {data.state.result.errors?.length ? <div style={{ color: 'var(--red-bright)', marginTop: 6 }}>Errors: {data.state.result.errors.join(' | ')}</div> : null}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button style={btn} disabled={busy} onClick={() => post({ action: 'run', mode: 'light' }, 'Light sweep done')}>Run light sweep</button>
        <button style={btn} disabled={busy} onClick={() => post({ action: 'run', mode: 'full' }, 'Full sweep done')}>Run full sweep</button>
        <button style={btn} disabled={busy} onClick={() => post({ action: 'run', mode: 'full', dry: true }, 'Dry run (nothing written)')}>Dry run (test keys)</button>
        <button style={btn} disabled={busy} onClick={() => post({ action: 'run', mode: 'seed' }, 'Seed loaded')}>Load seed docket</button>
        <button style={btn} onClick={load}>Refresh</button>
        <a style={{ ...btn, textDecoration: 'none' }} href="/laws/cases" target="_blank" rel="noreferrer">View public radar</a>
      </div>
      {msg ? <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--gold)' }}>{msg}</div> : null}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} style={{ ...btn, borderColor: filter === k ? 'var(--gold)' : 'var(--border-mid)', color: filter === k ? 'var(--gold)' : 'var(--text)' }}>{l}</button>)}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(i => (
          <div key={i._id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{i.title}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text-muted)' }}>
                  {i.kind} · {i.stageLabel || i.stage || '—'} · last activity {ago(i.activity)} {i.nextDate ? '· next ' + i.nextDate : ''}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {i.needsReview ? <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--gold)', border: '1px solid var(--gold-dim)', padding: '1px 6px' }}>UNVERIFIED</span> : null}
                  {i.locked ? <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--blue)', border: '1px solid var(--blue)', padding: '1px 6px' }}>LOCKED</span> : null}
                  {!i.inSanity ? <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-dim)', border: '1px solid var(--border-mid)', padding: '1px 6px' }}>SEED ONLY</span> : null}
                  {!i.hasWriteup ? <span style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-dim)', border: '1px solid var(--border-mid)', padding: '1px 6px' }}>NO WRITE-UP</span> : null}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {i.needsReview ? <button style={btn} disabled={busy} onClick={() => post({ action: 'verify', id: i._id }, 'Marked verified')}>Verify</button> : null}
                <button style={btn} disabled={busy} onClick={() => post({ action: 'lock', id: i._id, value: !i.locked }, i.locked ? 'Unlocked' : 'Locked from auto-updates')}>{i.locked ? 'Unlock' : 'Lock'}</button>
                <button style={btn} onClick={() => { setOpen(open === i._id ? null : i._id); setForm({}) }}>{open === i._id ? 'Close' : 'Edit'}</button>
                <a style={{ ...btn, textDecoration: 'none' }} href={'/laws/cases/' + i.slug} target="_blank" rel="noreferrer">View</a>
              </div>
            </div>
            {open === i._id ? (
              <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                {EDIT_FIELDS.map(([k, label, type]) => (
                  <label key={k} style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-dim)' }}>{label}
                    {type === 'area'
                      ? <textarea rows={k === 'legal' || k === 'plain' ? 8 : 3} defaultValue={i[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={{ width: '100%', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border-mid)', padding: 8, fontSize: 13 }} />
                      : <input defaultValue={i[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={{ width: '100%', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border-mid)', padding: 8, fontSize: 13 }} />}
                  </label>
                ))}
                <div><button style={{ ...btn, borderColor: 'var(--gold)', color: 'var(--gold)' }} disabled={busy || !Object.keys(form).length} onClick={() => post({ action: 'patch', id: i._id, fields: form }, 'Saved')}>Save changes</button></div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontFamily: mono, fontSize: 10, color: 'var(--text-dim)', marginBottom: 6 }}>RUN HISTORY</div>
        {(data.runs || []).map((r, k) => (
          <div key={k} style={{ fontFamily: mono, fontSize: 11, color: r.status === 'success' ? 'var(--text-muted)' : 'var(--red-bright)', padding: '3px 0' }}>
            {r.status.toUpperCase()} · {when(r.at)} · {r.ms}ms · {r.trigger || 'cron'} {r.error ? '· ' + r.error : ''}
          </div>
        ))}
        {!(data.runs || []).length ? <div style={{ fontFamily: mono, fontSize: 11, color: 'var(--text-dim)' }}>No runs recorded yet.</div> : null}
      </div>
    </div>
  )
}
