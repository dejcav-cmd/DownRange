'use client'
import { useEffect, useState, useCallback } from 'react'

const MONO = "'IBM Plex Mono',monospace"
const HEALTH = {
  healthy:     { label: 'Healthy',      color: '#22c55e', hint: 'Reachable and releases are on the site' },
  empty:       { label: 'No releases',  color: '#f59e0b', hint: 'Reachable, but nothing published yet (maybe no photos on their pages)' },
  'no-links':  { label: 'Layout changed', color: '#ef4444', hint: 'Page loads but no release links were found' },
  unreachable: { label: 'Blocked',      color: '#ef4444', hint: 'The site refused or failed the request' },
  never:       { label: 'Not checked',  color: '#6b7280', hint: 'No pull has recorded this manufacturer yet' },
}
const ORDER = { 'no-links': 0, unreachable: 1, empty: 2, never: 3, healthy: 4 }

function ago(iso) {
  if (!iso) return 'never'
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return m + ' min ago'
  if (m < 2880) return Math.round(m / 60) + ' h ago'
  return Math.round(m / 1440) + ' d ago'
}

export default function PressSourcesPanel({ adminKey }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    if (!adminKey) return
    try {
      const r = await fetch('/api/admin/press-sources', { headers: { 'x-admin-key': adminKey } })
      const d = await r.json()
      if (!r.ok || !d.ok) throw new Error(d.error || 'HTTP ' + r.status)
      setData(d); setErr('')
    } catch (e) { setErr(e.message) }
  }, [adminKey])
  useEffect(() => { load() }, [load])

  // Deep pull for one manufacturer: reads several listing pages, up to 3 years back.
  async function pull(brand) {
    setBusy(brand); setNote('Pulling ' + brand + '... this can take a few minutes')
    try {
      let created = 0
      for (let i = 0; i < 6; i++) {
        const q = '?max=24&per=12&listing=30&depth=6&window=1095&brand=' + encodeURIComponent(brand)
        const r = await fetch('/api/cron/press-releases' + q, { headers: { 'x-admin-key': adminKey } })
        const d = await r.json().catch(() => ({}))
        if (!r.ok) { setNote('❌ ' + brand + ': ' + (d.error || 'HTTP ' + r.status)); setBusy(''); return }
        created += d.created || 0
        if (d.done || !d.remaining) break
      }
      setNote('✅ ' + brand + ': ' + created + ' new release' + (created === 1 ? '' : 's'))
    } catch (e) { setNote('❌ ' + brand + ': ' + e.message) }
    setBusy(''); load()
  }

  const rows = (data?.rows || []).slice().sort((a, b) => ORDER[a.health] - ORDER[b.health] || a.brand.localeCompare(b.brand))
  const counts = rows.reduce((m, r) => (m[r.health] = (m[r.health] || 0) + 1, m), {})
  const shown = filter === 'all' ? rows : rows.filter(r => r.health === filter)

  return (
    <div>
      <div className="panel-title">🏭 Manufacturers</div>
      <div className="panel-sub">
        Every manufacturer we pull press releases from, with the result of the last pull.
        {data?.lastRunAt ? ' Last pull ' + ago(data.lastRunAt) + ' (' + (data.lastCreated ?? 0) + ' new).' : ''}
      </div>

      {err && <div className="adm-card" style={{ borderColor: '#ef4444', color: '#f87171', fontFamily: MONO, fontSize: 12 }}>{err}</div>}
      {note && <div className="adm-card" style={{ fontFamily: MONO, fontSize: 12 }}>{note}</div>}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '14px 0' }}>
            <button onClick={() => setFilter('all')} style={chip(filter === 'all', 'var(--gold)')}>All {rows.length}</button>
            {Object.keys(HEALTH).filter(h => counts[h]).map(h => (
              <button key={h} onClick={() => setFilter(h)} style={chip(filter === h, HEALTH[h].color)} title={HEALTH[h].hint}>
                {HEALTH[h].label} {counts[h]}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: 'var(--text-dim)', alignSelf: 'center' }}>
              {data.totals.releases} releases on site
            </span>
            <button onClick={load} style={chip(false, 'var(--text-dim)')}>↺ Refresh</button>
          </div>

          <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="adm-table">
              <thead><tr>
                <th>Manufacturer</th><th>Status</th><th>On site</th><th>Newest</th><th>Last pull</th><th>Found / new</th><th></th>
              </tr></thead>
              <tbody>
                {shown.map(r => {
                  const h = HEALTH[r.health]
                  return (
                    <tr key={r.slug}>
                      <td>
                        <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text)', fontWeight: 700, textDecoration: 'none' }}>{r.brand} ↗</a>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{r.kind}</div>
                      </td>
                      <td title={h.hint}>
                        <span style={{ color: h.color, fontSize: 11 }}>● {h.label}</span>
                        {r.note && <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{r.note}</div>}
                      </td>
                      <td>
                        <b>{r.published}</b>
                        {r.missingImage > 0 && <span style={{ color: '#f59e0b', fontSize: 10 }}> · {r.missingImage} no photo</span>}
                      </td>
                      <td style={{ color: 'var(--text-dim)' }}>{r.latest ? new Date(r.latest).toLocaleDateString() : '—'}</td>
                      <td style={{ color: 'var(--text-dim)' }}>{ago(r.checkedAt)}</td>
                      <td style={{ color: 'var(--text-dim)' }}>{r.candidates == null ? '—' : r.candidates + ' / ' + (r.createdLastRun ?? 0)}</td>
                      <td>
                        <button disabled={!!busy} onClick={() => pull(r.brand)} style={chip(false, 'var(--gold)')}>
                          {busy === r.brand ? '⏳' : '▶ Pull'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!data && !err && <div style={{ fontFamily: MONO, fontSize: 12, color: 'var(--text-dim)', marginTop: 16 }}>Loading...</div>}
    </div>
  )
}

function chip(active, color) {
  return {
    fontFamily: MONO, fontSize: 11, padding: '6px 12px', cursor: 'pointer',
    background: active ? color : 'transparent', color: active ? '#000' : color,
    border: '1px solid ' + color, minHeight: 32,
  }
}
