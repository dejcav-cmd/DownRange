'use client'
import { useState, useEffect, useCallback } from 'react'

const MONO = "'IBM Plex Mono',monospace"
const COND = "'Barlow Condensed',sans-serif"

const S = `
.td-card{background:var(--bg2);border:1px solid var(--border);padding:14px 18px}
.td-tile{background:var(--bg2);border:1px solid var(--border);padding:14px 16px;cursor:pointer;text-align:left;min-width:0}
.td-tile:hover{border-color:var(--gold)}
.td-num{font-family:'Bebas Neue',cursive;font-size:2.3rem;line-height:1;letter-spacing:.03em}
.td-lbl{font-family:${MONO};font-size:9px;color:#6b7280;letter-spacing:.1em;text-transform:uppercase;margin-top:4px}
.td-btn{background:var(--gold);color:#000;border:none;font-family:${COND};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:6px 14px;cursor:pointer}
.td-btn:disabled{opacity:.4;cursor:not-allowed}
.td-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:${MONO};font-size:10px;padding:5px 10px;cursor:pointer}
.td-ghost:hover{border-color:var(--gold);color:var(--gold)}
.td-h{font-family:${COND};font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text);margin:26px 0 10px}
.td-jump{display:flex;gap:8px;align-items:center;padding:9px 12px;background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:${COND};font-size:14px;font-weight:700;cursor:pointer;text-align:left}
.td-jump:hover{border-color:var(--gold);color:var(--gold)}
`

const ago = (iso) => {
  if (!iso) return 'never'
  const m = Math.round((Date.now() - new Date(iso)) / 60000)
  return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'
}

export default function TodayDashboard({ adminKey, onOpen, jumpGroups }) {
  const [jobs, setJobs] = useState(null)
  const [quality, setQuality] = useState(null)
  const [health, setHealth] = useState(null)
  const [errs, setErrs] = useState({})
  const [running, setRunning] = useState({})
  const [results, setResults] = useState({})
  const [loadedAt, setLoadedAt] = useState(null)

  const H = { 'x-admin-key': adminKey }

  const load = useCallback(async () => {
    const get = async (u) => { try { const r = await fetch(u, { headers: H }); return await r.json() } catch (e) { return { ok: false, error: e.message } } }
    const [c, q, h] = await Promise.all([get('/api/admin/cron-status'), get('/api/admin/content-quality'), get('/api/admin/cron-health')])
    setJobs(c.ok ? c.jobs : null)
    setQuality(q.ok ? q : null)
    setHealth(h)
    setErrs({ jobs: c.ok ? null : (c.error || 'Could not load jobs'), quality: q.ok ? null : (q.error || 'Could not load content quality') })
    setLoadedAt(new Date())
  }, [adminKey])

  useEffect(() => { if (adminKey) load() }, [adminKey, load])

  async function runJob(job) {
    setRunning(r => ({ ...r, [job.id]: true })); setResults(r => ({ ...r, [job.id]: null }))
    try {
      const res = await fetch('/api/admin/cron-status?trigger=true', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: job.id }) })
      const d = await res.json()
      setResults(r => ({ ...r, [job.id]: d.ok ? { ok: true, msg: (d.details || 'Ran OK') + ' · ' + Math.round((d.ms || 0) / 1000) + 's' } : { ok: false, msg: d.error || d.details || 'Failed' } }))
      await load()
    } catch (e) { setResults(r => ({ ...r, [job.id]: { ok: false, msg: e.message } })) }
    setRunning(r => ({ ...r, [job.id]: false }))
  }

  const active = (jobs || []).filter(j => !j.paused)
  const failed = active.filter(j => j.status === 'failed')
  const overdue = active.filter(j => j.status === 'overdue')
  const neverCritical = active.filter(j => j.status === 'never' && j.critical)
  const attention = [...failed, ...overdue, ...neverCritical]
  const healthy = active.filter(j => j.status === 'success' || j.status === 'warning').length
  const qc = quality?.counts
  const qIssues = qc ? qc.thin + qc.badImage : 0
  const hidden = quality?.hidden?.length || 0
  const degraded = health && health.status && health.status !== 'HEALTHY'
  const total = attention.length + (qIssues ? 1 : 0)
  const allGood = jobs && quality && attention.length === 0 && !qIssues && !degraded

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: S }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.9rem', color: 'var(--gold)', letterSpacing: '.05em', lineHeight: 1 }}>Today</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#64748b', marginTop: 4 }}>What needs you right now{loadedAt ? ' · updated ' + loadedAt.toLocaleTimeString() : ''}</div>
        </div>
        <button className="td-ghost" onClick={load}>↻ Refresh</button>
      </div>

      {(errs.jobs || errs.quality) && (
        <div className="td-card" style={{ borderLeft: '3px solid #ef4444', marginBottom: 12, fontFamily: MONO, fontSize: 11, color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {errs.jobs && <div>Jobs: {errs.jobs}</div>}
          {errs.quality && <div>Content quality: {errs.quality}</div>}
          <div style={{ color: '#6b7280', marginTop: 4 }}>If the admin key was rejected, sign in again.</div>
        </div>
      )}

      {/* Overall status */}
      {(jobs || quality) && (
        <div className="td-card" style={{ borderLeft: `3px solid ${allGood ? '#22c55e' : '#f59e0b'}`, marginBottom: 14 }}>
          <div style={{ fontFamily: COND, fontSize: 18, fontWeight: 700, color: allGood ? '#22c55e' : '#f59e0b' }}>
            {allGood ? 'Everything is running normally' : `${total || 1} thing${(total || 1) > 1 ? 's' : ''} need${(total || 1) > 1 ? '' : 's'} attention`}
          </div>
          {degraded && <div style={{ fontFamily: MONO, fontSize: 11, color: '#fca5a5', marginTop: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>System check: {health.status}. {(health.issues || []).map(i => typeof i === 'object' ? (i.msg || i.severity || JSON.stringify(i)) : i).join(' · ')}</div>}
        </div>
      )}

      {/* Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
        <button className="td-tile" onClick={() => onOpen('crons')}>
          <div className="td-num" style={{ color: failed.length ? '#ef4444' : '#22c55e' }}>{jobs ? failed.length : '–'}</div><div className="td-lbl">Jobs failing</div>
        </button>
        <button className="td-tile" onClick={() => onOpen('crons')}>
          <div className="td-num" style={{ color: overdue.length ? '#f97316' : '#22c55e' }}>{jobs ? overdue.length : '–'}</div><div className="td-lbl">Jobs overdue</div>
        </button>
        <button className="td-tile" onClick={() => onOpen('crons')}>
          <div className="td-num" style={{ color: 'var(--text)' }}>{jobs ? healthy : '–'}</div><div className="td-lbl">Jobs healthy of {jobs ? active.length : '–'}</div>
        </button>
        <button className="td-tile" onClick={() => onOpen('agents')}>
          <div className="td-num" style={{ color: qc && qc.thin ? '#f59e0b' : '#22c55e' }}>{qc ? qc.thin : '–'}</div><div className="td-lbl">Short articles</div>
        </button>
        <button className="td-tile" onClick={() => onOpen('agents')}>
          <div className="td-num" style={{ color: qc && qc.badImage ? '#f59e0b' : '#22c55e' }}>{qc ? qc.badImage : '–'}</div><div className="td-lbl">Image problems</div>
        </button>
        <button className="td-tile" onClick={() => onOpen('agents')}>
          <div className="td-num" style={{ color: hidden ? '#f59e0b' : 'var(--text)' }}>{quality ? hidden : '–'}</div><div className="td-lbl">Hidden from site</div>
        </button>
      </div>

      {/* Needs attention */}
      <div className="td-h">Needs attention</div>
      {!jobs && !errs.jobs && <div className="td-card" style={{ fontFamily: MONO, fontSize: 11, color: '#6b7280' }}>Loading…</div>}
      {jobs && attention.length === 0 && <div className="td-card" style={{ fontFamily: MONO, fontSize: 11, color: '#22c55e' }}>No failing or overdue jobs.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {attention.map(j => {
          const color = j.status === 'failed' ? '#ef4444' : j.status === 'overdue' ? '#f97316' : '#f59e0b'
          const res = results[j.id]
          return (
            <div key={j.id} className="td-card" style={{ borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontFamily: COND, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{j.icon} {j.label} <span style={{ fontFamily: MONO, fontSize: 9, color, marginLeft: 6 }}>{j.status === 'never' ? 'NEVER RUN' : j.status.toUpperCase()}</span></div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: '#6b7280' }}>last run {ago(j.lastRun?.at)} · {j.schedule}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="td-btn" disabled={running[j.id]} onClick={() => runJob(j)}>{running[j.id] ? 'Running…' : '▶ Run now'}</button>
                  <button className="td-ghost" onClick={() => onOpen('crons')}>Details</button>
                </div>
              </div>
              {j.lastRun?.error && <div style={{ fontFamily: MONO, fontSize: 11, color: '#fca5a5', marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', userSelect: 'text' }}>{j.lastRun.error}</div>}
              {res && <div style={{ fontFamily: MONO, fontSize: 11, marginTop: 8, color: res.ok ? '#22c55e' : '#f87171', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{res.ok ? '✓ ' : '✕ '}{res.msg}</div>}
            </div>
          )
        })}
        {qIssues > 0 && (
          <div className="td-card" style={{ borderLeft: '3px solid #f59e0b', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontFamily: COND, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Content quality</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: '#6b7280' }}>{qc.thin} short article{qc.thin === 1 ? '' : 's'} · {qc.badImage} image problem{qc.badImage === 1 ? '' : 's'}</div>
            </div>
            <button className="td-btn" onClick={() => onOpen('agents')}>Review</button>
          </div>
        )}
      </div>

      {/* Jump */}
      <div className="td-h">Jump to</div>
      <div style={{ fontFamily: MONO, fontSize: 10, color: '#6b7280', marginBottom: 10 }}>Tip: press <span style={{ color: 'var(--gold)' }}>⌘K</span> or <span style={{ color: 'var(--gold)' }}>/</span> to search every panel.</div>
      {(jumpGroups || []).map(g => (
        <div key={g.id} style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>{g.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 6 }}>
            {g.panels.map(p => <button key={p.id} className="td-jump" onClick={() => onOpen(p.id)}><span style={{ width: 18, textAlign: 'center' }}>{p.icon}</span>{p.label}</button>)}
          </div>
        </div>
      ))}
    </div>
  )
}
