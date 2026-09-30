'use client'
import { useState, useEffect } from 'react'

const MONO = "'IBM Plex Mono',monospace"
const COND = "'Barlow Condensed',sans-serif"
const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—'

export default function ContentCleanup({ adminKey }) {
  const [type, setType] = useState('news')
  const [days, setDays] = useState(90)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }
  const [auto, setAuto] = useState(null)       // { dealsAutoEnabled, dealsAutoDays, lastRun }
  const [autoMsg, setAutoMsg] = useState(null)

  useEffect(() => {
    if (!adminKey) return
    fetch('/api/admin/content-cleanup?settings=1', { headers: H }).then(r => r.json()).then(j => j.ok && setAuto(j)).catch(() => {})
  }, [adminKey])

  const saveAuto = async (next) => {
    setAutoMsg(null)
    try {
      const r = await fetch('/api/admin/content-cleanup', { method: 'PUT', headers: H, body: JSON.stringify(next) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status)
      setAuto(a => ({ ...a, ...j })); setAutoMsg({ text: '✅ Saved' })
    } catch (e) { setAutoMsg({ err: true, text: '❌ ' + e.message }) }
  }

  const runNow = async () => {
    if (!window.confirm(`Run the monthly cleanup now?\n\nDeletes deals older than ${auto.dealsDays} days (no backup) and news older than ${auto.newsDays} days (backed up; articles linked from blog posts are kept).`)) return
    setAutoMsg({ text: '⏳ Running…' })
    try {
      const r = await fetch('/api/cron/monthly-cleanup', { headers: { 'x-admin-key': adminKey } })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error || 'HTTP ' + r.status)
      setAuto(a => ({ ...a, lastRun: j }))
      setAutoMsg({ text: `✅ Deleted ${j.dealsDeleted} deals and ${j.newsDeleted} news articles${j.continued ? ' — still running in the background' : ''}` })
    } catch (e) { setAutoMsg({ err: true, text: '❌ ' + e.message }) }
  }

  const doPreview = async (t = type, d = days) => {
    setBusy(true); setMsg(null); setPreview(null)
    try {
      const r = await fetch(`/api/admin/content-cleanup?type=${t}&days=${d}`, { headers: H })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status)
      setPreview(j)
    } catch (e) { setMsg({ err: true, text: e.message }) }
    setBusy(false)
  }

  const doDelete = async () => {
    if (!preview?.count) return
    const note = type === 'news'
      ? 'A full JSON backup is saved to DownRange-Backups/cleanup/ first. Deleted pages return 404 and drop out of Google over time.'
      : 'Deals are deleted permanently — no backup.'
    if (!window.confirm(`Permanently delete ${preview.count} ${preview.type.toLowerCase()} older than ${preview.days} days?\n\n${note}`)) return
    setBusy(true); setMsg({ text: `⏳ Backing up and deleting ${preview.count}…` })
    try {
      const r = await fetch('/api/admin/content-cleanup', { method: 'POST', headers: H, body: JSON.stringify({ type, days, confirmCount: preview.count }) })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'HTTP ' + r.status)
      setMsg({ text: `✅ Deleted ${j.deleted} ${j.type?.toLowerCase() || ''}.${j.backup ? ' Backup: ' + j.backup : ''}` })
      setPreview(null)
    } catch (e) { setMsg({ err: true, text: '❌ ' + e.message }) }
    setBusy(false)
  }

  const box = { background:'var(--bg2, #0f1115)', border:'1px solid var(--border, #1f2937)', padding:16, marginBottom:14 }
  const btn = (bg, fg='#000') => ({ fontFamily:COND, fontWeight:700, fontSize:13, letterSpacing:'.05em', padding:'8px 16px', background:bg, color:fg, border:'none', cursor: busy ? 'wait' : 'pointer', opacity: busy ? .6 : 1 })

  return (
    <div style={{ maxWidth:760 }}>
      <div style={{ fontFamily:COND, fontSize:22, fontWeight:700, marginBottom:4 }}>🧹 Content Cleanup</div>
      <div style={{ fontFamily:MONO, fontSize:11, color:'#6b7280', marginBottom:16 }}>
        Delete news articles or deals older than a number of days. Preview first. News is backed up to GitHub before deleting; deals are not. Editor-locked items are never deleted. Minimum 7 days.
      </div>

      <div style={{ ...box, borderColor: auto?.monthlyEnabled ? '#C8922A' : 'var(--border, #1f2937)' }}>
        <div style={{ fontFamily:COND, fontSize:16, fontWeight:700, marginBottom:8 }}>📅 Monthly cleanup — 1st of each month, 2:20 AM PT</div>
        {auto ? (
          <>
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', fontFamily:MONO, fontSize:12, color:'#d1d5db' }}>
              <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                <input type="checkbox" checked={!!auto.monthlyEnabled}
                  onChange={e => saveAuto({ monthlyEnabled: e.target.checked, dealsDays: auto.dealsDays, newsDays: auto.newsDays })} />
                On
              </label>
              <span>· Deals older than</span>
              <input type="number" min={7} value={auto.dealsDays} onChange={e => setAuto(a => ({ ...a, dealsDays: e.target.value }))} style={{ width:64, fontFamily:MONO, fontSize:13, padding:'6px 8px', background:'#000', color:'#fff', border:'1px solid #374151' }} />
              <span>days · News older than</span>
              <input type="number" min={7} value={auto.newsDays} onChange={e => setAuto(a => ({ ...a, newsDays: e.target.value }))} style={{ width:64, fontFamily:MONO, fontSize:13, padding:'6px 8px', background:'#000', color:'#fff', border:'1px solid #374151' }} />
              <span>days</span>
              <button onClick={() => saveAuto({ monthlyEnabled: auto.monthlyEnabled, dealsDays: auto.dealsDays, newsDays: auto.newsDays })} style={btn('#e5e7eb')}>SAVE</button>
              <button onClick={runNow} style={btn('transparent', '#fca5a5')}>RUN NOW</button>
            </div>
            <div style={{ fontFamily:MONO, fontSize:11, color:'#6b7280', marginTop:8, lineHeight:1.6 }}>
              {auto.monthlyEnabled ? '● ON' : '○ OFF'} · Deals: no backup · News: backed up to GitHub; articles linked from blog posts are kept.
              <br />{auto.lastRun ? `Last run ${fmt(auto.lastRun.at)}: ${auto.lastRun.dealsDeleted} deals, ${auto.lastRun.newsDeleted} news deleted (${auto.lastRun.newsKeptForBlogLinks || 0} kept for blog links).` : 'Not run yet — first run on the 1st.'}
            </div>
            {autoMsg && <div style={{ fontFamily:MONO, fontSize:11, marginTop:6, color: autoMsg.err ? '#fca5a5' : '#86efac' }}>{autoMsg.text}</div>}
          </>
        ) : <div style={{ fontFamily:MONO, fontSize:11, color:'#6b7280' }}>Loading settings…</div>}
      </div>

      <div style={box}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {[['news','📰 News Articles'],['deals','🔥 Deals']].map(([id,label]) => (
            <button key={id} onClick={() => { setType(id); setPreview(null) }}
              style={{ ...btn(type===id ? '#C8922A' : 'transparent', type===id ? '#000' : '#9ca3af'), border:'1px solid #374151' }}>{label}</button>
          ))}
          <span style={{ fontFamily:MONO, fontSize:12, color:'#9ca3af', marginLeft:8 }}>older than</span>
          <input type="number" min={7} value={days} onChange={e => { setDays(e.target.value); setPreview(null) }}
            style={{ width:80, fontFamily:MONO, fontSize:13, padding:'7px 8px', background:'#000', color:'#fff', border:'1px solid #374151' }} />
          <span style={{ fontFamily:MONO, fontSize:12, color:'#9ca3af' }}>days</span>
          <button onClick={() => doPreview()} disabled={busy} style={btn('#e5e7eb')}>PREVIEW</button>
        </div>
        <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
          {[30, 60, 90, 180, 365].map(n => (
            <button key={n} onClick={() => { setDays(n); doPreview(type, n) }} disabled={busy}
              style={{ fontFamily:MONO, fontSize:10, padding:'4px 10px', background:'transparent', color:'#9ca3af', border:'1px solid #374151', cursor:'pointer' }}>{n}d</button>
          ))}
        </div>
      </div>

      {preview && (
        <div style={{ ...box, borderColor: preview.count ? '#ef4444' : '#374151' }}>
          <div style={{ fontFamily:COND, fontSize:18, fontWeight:700, marginBottom:6 }}>
            {preview.count ? `${preview.count} ${preview.type.toLowerCase()} older than ${preview.days} days` : `No ${preview.type.toLowerCase()} older than ${preview.days} days`}
          </div>
          <div style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', lineHeight:1.7 }}>
            {preview.count > 0 && <>Range: {fmt(preview.oldest)} → {fmt(preview.newest)}<br /></>}
            Kept after cleanup: {preview.remaining} of {preview.total}
          </div>
          {preview.sample?.length > 0 && (
            <ul style={{ fontFamily:MONO, fontSize:11, color:'#d1d5db', margin:'10px 0 0', paddingLeft:18, lineHeight:1.6 }}>
              {preview.sample.map((s, i) => <li key={i}>{fmt(s.publishedAt)} — {s.title}</li>)}
              {preview.count > preview.sample.length && <li style={{ color:'#6b7280', listStyle:'none' }}>…and {preview.count - preview.sample.length} more</li>}
            </ul>
          )}
          {preview.count > 0 && (
            <button onClick={doDelete} disabled={busy} style={{ ...btn('#ef4444', '#fff'), marginTop:14 }}>
              🗑 DELETE {preview.count} {preview.type.toUpperCase()}
            </button>
          )}
        </div>
      )}

      {msg && <div style={{ fontFamily:MONO, fontSize:12, color: msg.err ? '#fca5a5' : '#86efac', wordBreak:'break-all' }}>{msg.text}</div>}
    </div>
  )
}

