'use client'
import { useState } from 'react'

const MONO = "'IBM Plex Mono',monospace"

// Finds articles whose page 404s (no URL slug) and fixes the link or deletes the thin, old ones.
export default function BrokenArticlesFixer({ adminKey, onDone }) {
  const [plan, setPlan] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  async function scan() {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/admin/fix-broken-articles', { headers: H })
      const d = await r.json()
      if (!r.ok || !d.ok) throw new Error(d.error || 'HTTP ' + r.status)
      setPlan(d)
      if (!d.total) setMsg('✅ No articles with a broken (404) page.')
    } catch (e) { setMsg('❌ ' + e.message) }
    setBusy(false)
  }

  async function apply() {
    if (!plan) return
    setBusy(true); setMsg('Applying...')
    try {
      const r = await fetch('/api/admin/fix-broken-articles', { method: 'POST', headers: H, body: JSON.stringify({ confirm: true }) })
      const d = await r.json()
      if (!r.ok || !d.ok) throw new Error(d.error || 'HTTP ' + r.status)
      setMsg(`✅ ${d.repaired} links fixed, ${d.deleted} old thin articles deleted` + (d.backup ? ` (backup: ${d.backup})` : ''))
      setPlan(null)
      onDone && onDone()
    } catch (e) { setMsg('❌ ' + e.message) }
    setBusy(false)
  }

  const btn = (primary) => ({
    fontFamily: MONO, fontSize: 11, padding: '8px 14px', cursor: busy ? 'wait' : 'pointer', minHeight: 36,
    background: primary ? 'var(--gold)' : 'transparent', color: primary ? '#000' : 'var(--gold)', border: '1px solid var(--gold)',
  })

  return (
    <div className="adm-card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>🔗 Fix 404 articles</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-dim)' }}>
            Articles with no URL slug open a 404 page. This gives each a working link, and deletes the ones that are thin (under 250 words) and over 7 days old. Deleted articles are backed up first.
          </div>
        </div>
        <button style={btn(false)} disabled={busy} onClick={scan}>{busy && !plan ? '⏳ Scanning...' : '🔎 Scan'}</button>
      </div>

      {msg && <div style={{ fontFamily: MONO, fontSize: 11, marginTop: 10, color: msg.startsWith('❌') ? '#f87171' : 'var(--text)' }}>{msg}</div>}

      {plan && plan.total > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, marginBottom: 8 }}>
            <b>{plan.total}</b> broken · <span style={{ color: '#22c55e' }}>{plan.repair} to fix</span> · <span style={{ color: '#ef4444' }}>{plan.delete} to delete</span>{plan.skip ? ` · ${plan.skip} skipped` : ''}
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--border)' }}>
            {plan.items.map(i => (
              <div key={i._id} style={{ display: 'flex', gap: 10, padding: '6px 10px', borderBottom: '1px solid var(--border)', fontFamily: MONO, fontSize: 10 }}>
                <span style={{ color: i.action === 'delete' ? '#ef4444' : i.action === 'repair' ? '#22c55e' : '#6b7280', minWidth: 52, textTransform: 'uppercase' }}>{i.action}</span>
                <span style={{ flex: 1, color: 'var(--text)' }}>{i.title || '(no title)'}</span>
                <span style={{ color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{i.words}w · {i.ageDays}d</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button style={btn(true)} disabled={busy} onClick={apply}>{busy ? '⏳ Working...' : `Apply: fix ${plan.repair}, delete ${plan.delete}`}</button>
            <button style={btn(false)} disabled={busy} onClick={() => setPlan(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
