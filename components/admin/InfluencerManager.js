'use client'
import { useState, useEffect, useCallback } from 'react'

const STATUS_CONFIG = {
  identified: { label: 'Identified',         color: '#60A5FA', bg: 'rgba(96,165,250,.12)' },
  contacted:  { label: 'Contacted',           color: '#FBBF24', bg: 'rgba(251,191,36,.12)' },
  replied:    { label: 'Replied',             color: '#34D399', bg: 'rgba(52,211,153,.12)' },
  active:     { label: 'Active Partnership',  color: '#C8922A', bg: 'rgba(200,146,42,.12)' },
  paused:     { label: 'Paused',             color: '#9CA3AF', bg: 'rgba(156,163,175,.12)' },
  declined:   { label: 'Not Interested',     color: '#EF4444', bg: 'rgba(239,68,68,.12)'  },
  dnc:        { label: 'Do Not Contact',     color: '#7F1D1D', bg: 'rgba(127,29,29,.12)'  },
}

const FOCUS_OPTIONS = [
  'gun-reviews','CCW-EDC','AR-15','AK-platform','pistols','revolvers','shotguns',
  'suppressors-NFA','long-range','competition-USPSA-IDPA','hunting','2A-advocacy',
  '2A-law','home-defense','training-tactics','ammo-testing','gear-accessories',
  'historical-firearms','budget-guns','beginners','women-shooters','minority-2A',
  'military-veteran','law-enforcement',
]

function fmt(n) {
  if (!n) return '—'
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n/1000).toFixed(1) + 'K'
  return String(n)
}

export default function InfluencerManager({ adminKey }) {
  const H = { 'x-admin-key': adminKey }
  const api = '/api/admin/influencers'

  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [busy,     setBusy]     = useState(false)
  const [msg,      setMsg]      = useState('')
  const [sel,      setSel]      = useState(null)
  const [filter,   setFilter]   = useState('')
  const [statusF,  setStatusF]  = useState('')
  const [tierF,    setTierF]    = useState('')
  const [checked,  setChecked]  = useState(new Set())
  const [showAdd,  setShowAdd]  = useState(false)
  const [addForm,  setAddForm]  = useState({})
  const [editVals, setEditVals] = useState({})

  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusF) params.set('status', statusF)
    if (tierF)   params.set('tier', tierF)
    const r = await fetch(`${api}?${params}`, { headers: H })
    const d = await r.json()
    setItems(d.items || [])
    setLoading(false)
  }, [statusF, tierF])

  useEffect(() => { load() }, [load])

  const selItem = items.find(x => x._id === sel)

  useEffect(() => {
    if (selItem) {
      const v = {}
      Object.keys(selItem).forEach(k => { v[k] = selItem[k] ?? '' })
      setEditVals(v)
    }
  }, [sel])

  async function patch(id, fields) {
    const r = await fetch(api, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'patch', id, fields }) })
    const d = await r.json()
    if (d.ok) setItems(prev => prev.map(x => x._id === id ? { ...x, ...fields } : x))
    return d.ok
  }

  async function createNew() {
    if (!addForm.channelName) { flash('❌ Channel name required'); return }
    setBusy(true)
    const r = await fetch(api, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', ...addForm }) })
    const d = await r.json()
    if (d.ok) { setShowAdd(false); setAddForm({}); await load(); flash('✅ Added') }
    setBusy(false)
  }

  async function del(id) {
    if (!confirm('Delete this influencer?')) return
    await fetch(api, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }) })
    setSel(null); await load(); flash('🗑 Deleted')
  }

  async function bulkStatus(status) {
    if (!checked.size) return
    setBusy(true)
    await fetch(api, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bulk-status', ids: [...checked], status }) })
    setChecked(new Set()); await load()
    setBusy(false); flash(`✅ Updated ${checked.size} to ${status}`)
  }

  async function saveEdit() {
    if (!sel) return
    setBusy(true)
    const fields = {}
    const skip = ['_id','_type','_createdAt','_updatedAt','_rev']
    Object.keys(editVals).forEach(k => {
      if (!skip.includes(k) && editVals[k] !== (selItem[k] ?? '')) fields[k] = editVals[k]
    })
    if (Object.keys(fields).length === 0) { flash('Nothing changed'); setBusy(false); return }
    const ok = await patch(sel, fields)
    setBusy(false)
    if (ok) flash('✅ Saved')
    else    flash('❌ Save failed')
  }

  const visible = items.filter(i => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (i.channelName||'').toLowerCase().includes(q) ||
           (i.hostName||'').toLowerCase().includes(q) ||
           (i.email||'').toLowerCase().includes(q) ||
           (i.focus||[]).some(f => f.includes(q))
  })

  const mono = { fontFamily: "'IBM Plex Mono',monospace" }
  const gold = '#C8922A'

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 600, gap: 0 }}>

      {/* ── LEFT LIST ── */}
      <div style={{ width: 360, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ ...mono, fontSize: 11, color: gold, fontWeight: 700, letterSpacing: '.1em' }}>
              📺 INFLUENCERS ({visible.length})
            </span>
            <button onClick={() => setShowAdd(true)} style={{ background: gold, color: '#000', border: 'none',
              padding: '4px 10px', ...mono, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              + ADD
            </button>
          </div>

          {/* Search */}
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search channel, name, focus..."
            style={{ width: '100%', background: '#0d1117', border: '1px solid var(--border)', color: 'var(--text)',
              padding: '6px 8px', ...mono, fontSize: 11, boxSizing: 'border-box', marginBottom: 6 }} />

          {/* Filters */}
          <div style={{ display: 'flex', gap: 4 }}>
            <select value={statusF} onChange={e => setStatusF(e.target.value)}
              style={{ flex: 1, background: '#0d1117', border: '1px solid var(--border)', color: 'var(--text)',
                padding: '4px 6px', ...mono, fontSize: 10 }}>
              <option value="">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <select value={tierF} onChange={e => setTierF(e.target.value)}
              style={{ flex: 1, background: '#0d1117', border: '1px solid var(--border)', color: 'var(--text)',
                padding: '4px 6px', ...mono, fontSize: 10 }}>
              <option value="">All Tiers</option>
              <option value="nano (&lt;10K)">Nano (&lt;10K)</option>
              <option value="micro (10K–50K)">Micro (10K–50K)</option>
              <option value="mid (50K–150K)">Mid (50K–150K)</option>
            </select>
          </div>
        </div>

        {/* Bulk bar */}
        {checked.size > 0 && (
          <div style={{ padding: '6px 10px', background: '#111318', borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ ...mono, fontSize: 10, color: gold }}>{checked.size} selected</span>
            <button onClick={() => bulkStatus('contacted')} style={{ ...mono, fontSize: 9, padding: '3px 8px',
              background: 'rgba(251,191,36,.15)', border: '1px solid #FBBF24', color: '#FBBF24', cursor: 'pointer' }}>
              📤 Mark Contacted
            </button>
            <button onClick={() => bulkStatus('active')} style={{ ...mono, fontSize: 9, padding: '3px 8px',
              background: 'rgba(200,146,42,.15)', border: `1px solid ${gold}`, color: gold, cursor: 'pointer' }}>
              🤝 Mark Active
            </button>
            <button onClick={() => bulkStatus('dnc')} style={{ ...mono, fontSize: 9, padding: '3px 8px',
              background: 'rgba(239,68,68,.1)', border: '1px solid #EF4444', color: '#EF4444', cursor: 'pointer' }}>
              🚫 DNC
            </button>
            <button onClick={() => setChecked(new Set())} style={{ marginLeft: 'auto', background: 'none',
              border: 'none', color: '#4B5563', cursor: 'pointer', ...mono, fontSize: 10 }}>✕</button>
          </div>
        )}

        {/* Msg */}
        {msg && <div style={{ padding: '6px 12px', ...mono, fontSize: 11, color: '#22c55e', background: 'rgba(34,197,94,.08)' }}>{msg}</div>}

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20, ...mono, fontSize: 11, color: '#4B5563' }}>Loading...</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: 20, ...mono, fontSize: 11, color: '#4B5563' }}>No influencers found</div>
          ) : visible.map(item => {
            const sc = STATUS_CONFIG[item.outreachStatus] || STATUS_CONFIG.identified
            const isSelected = sel === item._id
            return (
              <div key={item._id}
                onClick={() => setSel(isSelected ? null : item._id)}
                style={{ padding: '10px 12px', borderBottom: '1px solid #111', cursor: 'pointer',
                  background: isSelected ? '#1a1f2e' : 'transparent',
                  borderLeft: isSelected ? `3px solid ${gold}` : '3px solid transparent',
                  display: 'flex', gap: 8, alignItems: 'flex-start' }}>

                <input type="checkbox" checked={checked.has(item._id)}
                  onClick={e => e.stopPropagation()}
                  onChange={e => {
                    const s = new Set(checked)
                    e.target.checked ? s.add(item._id) : s.delete(item._id)
                    setChecked(s)
                  }} style={{ marginTop: 3, flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14,
                      color: '#E5E5E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
                      {item.channelName}
                    </span>
                    <span style={{ ...mono, fontSize: 9, color: sc.color, background: sc.bg,
                      padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {sc.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {item.hostName && <span style={{ ...mono, fontSize: 9, color: '#6B7280' }}>{item.hostName}</span>}
                    <span style={{ ...mono, fontSize: 9, color: gold, fontWeight: 700 }}>
                      {fmt(item.subscribers)} subs
                    </span>
                    {item.email && <span style={{ ...mono, fontSize: 9, color: '#34D399' }}>✉</span>}
                  </div>
                  {item.focus?.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {item.focus.slice(0, 3).map(f => (
                        <span key={f} style={{ ...mono, fontSize: 8, color: '#4B5563',
                          background: '#111318', padding: '1px 4px', border: '1px solid #1F2428' }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT DETAIL ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
        {!selItem ? (
          <div style={{ padding: 40, textAlign: 'center', ...mono, fontSize: 12, color: '#4B5563' }}>
            Select an influencer to view and edit
          </div>
        ) : (
          <div style={{ padding: '20px 24px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.8rem', color: 'var(--text)',
                  letterSpacing: '.04em', margin: '0 0 4px' }}>
                  {selItem.channelName}
                </h2>
                {selItem.hostName && <div style={{ ...mono, fontSize: 11, color: '#6B7280' }}>{selItem.hostName}</div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' }}>
                  <span style={{ ...mono, fontSize: 13, color: gold, fontWeight: 700 }}>
                    {fmt(selItem.subscribers)} subscribers
                  </span>
                  {selItem.tier && <span style={{ ...mono, fontSize: 10, color: '#6B7280' }}>{selItem.tier}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {selItem.youtubeUrl && (
                  <a href={selItem.youtubeUrl} target="_blank" rel="noreferrer"
                    style={{ ...mono, fontSize: 10, color: '#EF4444', textDecoration: 'none',
                      border: '1px solid #EF4444', padding: '5px 10px' }}>
                    ▶ YouTube
                  </a>
                )}
                <button onClick={saveEdit} disabled={busy}
                  style={{ ...mono, fontSize: 10, padding: '5px 14px', background: '#14532d',
                    border: '1px solid #22c55e', color: '#22c55e', cursor: 'pointer' }}>
                  💾 Save
                </button>
                <button onClick={() => del(sel)}
                  style={{ ...mono, fontSize: 10, padding: '5px 10px', background: 'rgba(239,68,68,.1)',
                    border: '1px solid #EF4444', color: '#EF4444', cursor: 'pointer' }}>
                  🗑
                </button>
              </div>
            </div>

            {/* Status selector */}
            <div style={{ marginBottom: 20, padding: '12px 16px', background: '#111318', border: '1px solid var(--border)' }}>
              <div style={{ ...mono, fontSize: 9, color: '#4B5563', marginBottom: 8, letterSpacing: '.1em' }}>OUTREACH STATUS</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <button key={k}
                    onClick={() => { setEditVals(p => ({...p, outreachStatus: k})); patch(sel, { outreachStatus: k }); flash(`Status → ${v.label}`) }}
                    style={{ ...mono, fontSize: 9, padding: '4px 10px', cursor: 'pointer',
                      background: editVals.outreachStatus === k ? v.bg : 'transparent',
                      border: `1px solid ${editVals.outreachStatus === k ? v.color : '#2D3748'}`,
                      color: editVals.outreachStatus === k ? v.color : '#6B7280' }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Two-column form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { key: 'email',        label: 'Primary Email',  type: 'text' },
                { key: 'email2',       label: 'Secondary Email', type: 'text' },
                { key: 'youtubeUrl',   label: 'YouTube URL',    type: 'url' },
                { key: 'website',      label: 'Website',        type: 'url' },
                { key: 'instagram',    label: 'Instagram (@)',   type: 'text' },
                { key: 'twitter',      label: 'Twitter/X (@)',   type: 'text' },
                { key: 'subscribers',  label: 'Subscribers',    type: 'number' },
                { key: 'monthlyViews', label: 'Monthly Views',  type: 'number' },
                { key: 'avgViews',     label: 'Avg Views/Video', type: 'number' },
                { key: 'startedYear',  label: 'Year Started',   type: 'number' },
                { key: 'partnershipType', label: 'Partnership Type', type: 'select',
                  opts: ['content-mention','review-collab','affiliate','sponsored','ambassador','press-kit','giveaway'] },
                { key: 'dealValue',    label: 'Deal Value / Notes', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ ...mono, fontSize: 9, color: '#6B7280', marginBottom: 3, letterSpacing: '.08em', textTransform: 'uppercase' }}>{f.label}</div>
                  {f.type === 'select' ? (
                    <select value={editVals[f.key] || ''} onChange={e => setEditVals(p => ({...p, [f.key]: e.target.value}))}
                      style={{ width: '100%', background: '#0d1117', border: '1px solid var(--border)',
                        color: 'var(--text)', padding: '6px 8px', ...mono, fontSize: 11 }}>
                      <option value="">— select —</option>
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={editVals[f.key] || ''} onChange={e => setEditVals(p => ({...p, [f.key]: e.target.value}))}
                      style={{ width: '100%', background: '#0d1117', border: '1px solid var(--border)',
                        color: 'var(--text)', padding: '6px 8px', ...mono, fontSize: 11, boxSizing: 'border-box' }} />
                  )}
                </div>
              ))}
            </div>

            {/* Focus tags */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...mono, fontSize: 9, color: '#6B7280', marginBottom: 6, letterSpacing: '.08em', textTransform: 'uppercase' }}>CONTENT FOCUS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {FOCUS_OPTIONS.map(f => {
                  const active = (editVals.focus || []).includes(f)
                  return (
                    <button key={f} onClick={() => {
                      const cur = editVals.focus || []
                      setEditVals(p => ({...p, focus: active ? cur.filter(x => x !== f) : [...cur, f]}))
                    }} style={{ ...mono, fontSize: 9, padding: '3px 7px', cursor: 'pointer',
                      background: active ? 'rgba(200,146,42,.15)' : 'transparent',
                      border: `1px solid ${active ? gold : '#2D3748'}`,
                      color: active ? gold : '#4B5563' }}>
                      {f}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Textareas */}
            {[
              { key: 'bio',         label: 'Channel Bio' },
              { key: 'whyGoodFit', label: 'Why Good Fit for DownRange' },
              { key: 'notes',       label: 'Internal Notes' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ ...mono, fontSize: 9, color: '#6B7280', marginBottom: 3, letterSpacing: '.08em', textTransform: 'uppercase' }}>{f.label}</div>
                <textarea rows={3} value={editVals[f.key] || ''} onChange={e => setEditVals(p => ({...p, [f.key]: e.target.value}))}
                  style={{ width: '100%', background: '#0d1117', border: '1px solid var(--border)',
                    color: 'var(--text)', padding: '7px 8px', ...mono, fontSize: 11,
                    resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            ))}

            {/* Email copy */}
            {selItem.email && (
              <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,.06)', border: '1px solid rgba(52,211,153,.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ ...mono, fontSize: 11, color: '#34D399' }}>{selItem.email}</span>
                <button onClick={() => { navigator.clipboard.writeText(selItem.email); flash('📋 Email copied!') }}
                  style={{ ...mono, fontSize: 9, padding: '4px 10px', background: 'rgba(52,211,153,.1)',
                    border: '1px solid #34D399', color: '#34D399', cursor: 'pointer' }}>
                  Copy Email
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── ADD MODAL ── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#111318', border: '1px solid var(--border)', padding: 24,
            width: 420, maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ ...mono, fontSize: 12, color: gold, fontWeight: 700, marginBottom: 16, letterSpacing: '.1em' }}>
              + ADD INFLUENCER
            </div>
            {[
              { key: 'channelName', label: 'Channel Name *',  type: 'text' },
              { key: 'hostName',    label: 'Host / Creator',  type: 'text' },
              { key: 'email',       label: 'Email',           type: 'text' },
              { key: 'youtubeUrl',  label: 'YouTube URL',     type: 'url'  },
              { key: 'subscribers', label: 'Subscribers',     type: 'number' },
              { key: 'instagram',   label: 'Instagram (@)',   type: 'text' },
              { key: 'twitter',     label: 'Twitter/X (@)',   type: 'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <div style={{ ...mono, fontSize: 9, color: '#6B7280', marginBottom: 3 }}>{f.label}</div>
                <input type={f.type} value={addForm[f.key] || ''} onChange={e => setAddForm(p => ({...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value}))}
                  style={{ width: '100%', background: '#0d1117', border: '1px solid var(--border)',
                    color: 'var(--text)', padding: '7px 8px', ...mono, fontSize: 11, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={createNew} disabled={busy}
                style={{ flex: 1, background: '#14532d', border: '1px solid #22c55e', color: '#22c55e',
                  padding: '8px 0', ...mono, fontSize: 11, cursor: 'pointer' }}>
                ✅ Add Influencer
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{ flex: 1, background: '#0d1117', border: '1px solid var(--border)', color: '#6B7280',
                  padding: '8px 0', ...mono, fontSize: 11, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
