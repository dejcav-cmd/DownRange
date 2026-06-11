'use client'
import React, { useState, useEffect, useCallback } from 'react'

const S = `
.sms-wrap { font-family: 'IBM Plex Mono', monospace; }
.sms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
@media (max-width: 700px) { .sms-grid { grid-template-columns: 1fr; } }
.sms-card { background: var(--bg2); border: 1px solid var(--border); padding: 16px 18px; }
.sms-card-title { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; display: flex;
  align-items: center; gap: 8px; }
.sms-label { font-size: 10px; color: #6b7280; letter-spacing: .06em; text-transform: uppercase;
  margin-bottom: 4px; display: block; }
.sms-input { width: 100%; background: #0d1117; border: 1px solid var(--border); color: var(--text);
  font-family: 'IBM Plex Mono', monospace; font-size: 12px; padding: 8px 10px; outline: none;
  transition: border-color .15s; }
.sms-input:focus { border-color: var(--gold); }
.sms-select { width: 100%; background: #0d1117; border: 1px solid var(--border); color: var(--text);
  font-family: 'IBM Plex Mono', monospace; font-size: 12px; padding: 8px 10px; outline: none; cursor: pointer; }
.sms-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
.sms-toggle { position: relative; width: 42px; height: 22px; flex-shrink: 0; cursor: pointer; }
.sms-toggle input { opacity: 0; width: 0; height: 0; }
.sms-slider { position: absolute; inset: 0; background: #1f2937; border-radius: 2px; transition: .2s; }
.sms-slider:before { content: ''; position: absolute; width: 18px; height: 18px; left: 2px; bottom: 2px;
  background: #4b5563; border-radius: 1px; transition: .2s; }
.sms-toggle input:checked + .sms-slider { background: rgba(200,146,42,.25); }
.sms-toggle input:checked + .sms-slider:before { transform: translateX(20px); background: var(--gold); }
.sms-btn { background: var(--gold); color: #000; border: none; font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: .08em; padding: 9px 20px; cursor: pointer;
  text-transform: uppercase; transition: opacity .15s; white-space: nowrap; }
.sms-btn:hover:not(:disabled) { opacity: .85; }
.sms-btn:disabled { opacity: .4; cursor: not-allowed; }
.sms-ghost { background: none; border: 1px solid var(--border); color: var(--text-dim);
  font-family: 'IBM Plex Mono', monospace; font-size: 10px; padding: 7px 14px; cursor: pointer;
  transition: all .15s; white-space: nowrap; }
.sms-ghost:hover { border-color: var(--gold); color: var(--gold); }
.sms-ghost.danger:hover { border-color: #ef4444; color: #ef4444; }
.sms-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 700;
  letter-spacing: .06em; padding: 2px 8px; text-transform: uppercase; white-space: nowrap; }
.sms-log { background: #050809; border: 1px solid #1a2030; max-height: 340px; overflow-y: auto; }
.sms-log-row { display: grid; grid-template-columns: 130px 70px 80px 1fr; gap: 0;
  border-bottom: 1px solid #0d1117; padding: 5px 12px; font-size: 10px; align-items: center; }
.sms-log-row:hover { background: #0d1117; }
.sms-stat { text-align: center; }
.sms-stat-val { font-family: 'Bebas Neue', cursive; font-size: 2rem; line-height: 1; color: var(--gold); }
.sms-stat-lbl { font-size: 9px; color: #4b5563; letter-spacing: .08em; text-transform: uppercase; margin-top: 3px; }
.sms-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
.sms-chip { display: inline-flex; align-items: center; gap: 4px; background: rgba(200,146,42,.1);
  border: 1px solid rgba(200,146,42,.3); color: var(--gold); font-size: 10px; padding: 2px 8px;
  margin: 2px; cursor: pointer; transition: all .15s; }
.sms-chip:hover { background: rgba(239,68,68,.1); border-color: #ef4444; color: #ef4444; }
.sms-chip-add { display: inline-flex; align-items: center; gap: 4px; background: none;
  border: 1px dashed var(--border); color: #4b5563; font-size: 10px; padding: 2px 8px; margin: 2px;
  cursor: pointer; transition: all .15s; }
.sms-chip-add:hover { border-color: var(--gold); color: var(--gold); }
.sms-env-row { display: grid; grid-template-columns: 220px 1fr auto; gap: 10px; padding: 7px 0;
  border-bottom: 1px solid rgba(30,41,59,.5); align-items: center; font-size: 10px; }
@keyframes sms-flash { 0%,100%{opacity:1}50%{opacity:.4} }
.sms-saving { animation: sms-flash .7s ease-in-out infinite; color: var(--gold); }
`

const CRITICAL_JOB_OPTIONS = [
  'news', 'sanity', 'cron-health', 'gun-deals', 'social-twitter',
  'social-facebook', 'blog-writer', 'quality-rewrite', 'releases',
]

function Badge({ sent, reason }) {
  if (sent)   return <span className="sms-badge" style={{background:'rgba(34,197,94,.12)',color:'#22c55e',border:'1px solid rgba(34,197,94,.2)'}}>✓ SENT</span>
  if (reason === 'disabled') return <span className="sms-badge" style={{background:'rgba(107,114,128,.1)',color:'#6b7280',border:'1px solid rgba(107,114,128,.2)'}}>DISABLED</span>
  if (reason?.includes('ooldown')) return <span className="sms-badge" style={{background:'rgba(59,130,246,.1)',color:'#60a5fa',border:'1px solid rgba(59,130,246,.2)'}}>COOLDOWN</span>
  if (reason?.includes('uiet'))    return <span className="sms-badge" style={{background:'rgba(139,92,246,.1)',color:'#a78bfa',border:'1px solid rgba(139,92,246,.2)'}}>QUIET HRS</span>
  return <span className="sms-badge" style={{background:'rgba(239,68,68,.12)',color:'#ef4444',border:'1px solid rgba(239,68,68,.2)'}}>✕ FAILED</span>
}

function fmtAge(iso) {
  if (!iso) return '—'
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  if (m < 1440)return `${Math.floor(m/60)}h ago`
  return `${Math.floor(m/1440)}d ago`
}

function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12: false })
}

export default function SMSAlertsPanel({ adminKey }) {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saveMsg,    setSaveMsg]    = useState(null)
  const [newJob,     setNewJob]     = useState('')
  const [showNewJob, setShowNewJob] = useState(false)

  // Form state — starts from override or falls back to env defaults
  const [form, setForm] = useState({
    enabled:      true,
    cooldownSecs: 900,
    quietStart:   23,
    quietEnd:     7,
    criticalJobs: ['news', 'sanity', 'cron-health'],
  })

  const H = { 'x-admin-key': adminKey }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/sms-config', { headers: H })
      const d = await r.json()
      setData(d)
      // Merge override on top of env defaults
      const src = d.override ?? {}
      setForm(f => ({
        enabled:      src.enabled      ?? d.status?.enabled      ?? true,
        cooldownSecs: src.cooldownSecs ?? d.status?.cooldownSecs ?? 900,
        quietStart:   src.quietStart   ?? d.status?.quietStart   ?? 23,
        quietEnd:     src.quietEnd     ?? d.status?.quietEnd     ?? 7,
        criticalJobs: src.criticalJobs ?? d.status?.criticalJobs ?? ['news','sanity','cron-health'],
      }))
    } catch {}
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  async function save() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const r = await fetch('/api/admin/sms-config', {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      setSaveMsg(d.ok ? '✓ Saved to Redis' : '✕ Save failed')
      await load()
    } catch { setSaveMsg('✕ Network error') }
    setSaving(false)
    setTimeout(() => setSaveMsg(null), 3000)
  }

  async function sendTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const r = await fetch('/api/admin/test-sms', {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey }),
      })
      const d = await r.json()
      setTestResult(d)
    } catch (e) { setTestResult({ sent: false, error: e.message }) }
    setTesting(false)
  }

  async function clearLog() {
    if (!confirm('Clear the SMS event log?')) return
    await fetch('/api/admin/sms-config?what=log', { method: 'DELETE', headers: H })
    load()
  }

  async function resetOverride() {
    if (!confirm('Reset all overrides to env-var defaults?')) return
    await fetch('/api/admin/sms-config?what=config', { method: 'DELETE', headers: H })
    load()
  }

  function toggleJob(job) {
    setForm(f => ({
      ...f,
      criticalJobs: f.criticalJobs.includes(job)
        ? f.criticalJobs.filter(j => j !== job)
        : [...f.criticalJobs, job],
    }))
  }

  function addCustomJob() {
    const j = newJob.trim()
    if (!j) return
    if (!form.criticalJobs.includes(j)) setForm(f => ({ ...f, criticalJobs: [...f.criticalJobs, j] }))
    setNewJob('')
    setShowNewJob(false)
  }

  const cfg     = data?.status ?? {}
  const log     = data?.log    ?? []
  const sentLog = log.filter(l => l.sent)
  const skipLog = log.filter(l => !l.sent)
  const isOk    = cfg.configured && cfg.enabled

  return (
    <div className="sms-wrap">
      <style>{S}</style>

      <div className="panel-title">SMS Alert Configuration</div>
      <div className="panel-sub">
        Twilio-powered SMS alerts for critical job failures, site health events, and manual test pings.
      </div>

      {/* ── Status strip ── */}
      {!loading && (
        <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
          <div className="sms-card" style={{padding:'10px 16px',display:'flex',gap:12,alignItems:'center',flex:1,minWidth:200}}>
            <span style={{fontSize:22}}>{isOk ? '🟢' : cfg.configured && !cfg.enabled ? '🟡' : '🔴'}</span>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'.06em',color: isOk ? '#22c55e' : cfg.configured ? '#f59e0b' : '#ef4444'}}>
                {isOk ? 'OPERATIONAL' : cfg.configured ? 'DISABLED' : 'NOT CONFIGURED'}
              </div>
              <div style={{fontSize:10,color:'#4b5563',marginTop:2}}>
                {cfg.configured ? `From: ${cfg.from ?? '—'} → To: ${cfg.to ?? '—'}` : 'Add TWILIO_* env vars in Vercel'}
              </div>
            </div>
          </div>
          <div className="sms-card sms-stat" style={{padding:'10px 16px'}}>
            <div className="sms-stat-val">{sentLog.length}</div>
            <div className="sms-stat-lbl">Sent</div>
          </div>
          <div className="sms-card sms-stat" style={{padding:'10px 16px'}}>
            <div className="sms-stat-val" style={{color: skipLog.length > 0 ? '#f59e0b' : '#4b5563'}}>{skipLog.length}</div>
            <div className="sms-stat-lbl">Skipped</div>
          </div>
          <div className="sms-card sms-stat" style={{padding:'10px 16px'}}>
            <div className="sms-stat-val" style={{color: cfg.cooldownSecs >= 900 ? '#22c55e' : '#f59e0b'}}>{Math.round((cfg.cooldownSecs ?? 900) / 60)}<span style={{fontSize:'1rem',color:'#4b5563'}}>m</span></div>
            <div className="sms-stat-lbl">Cooldown</div>
          </div>
        </div>
      )}

      {/* ── Config grid ── */}
      <div className="sms-grid">
        {/* Left: behaviour settings */}
        <div>
          <div className="sms-card-title">⚙ Behaviour</div>

          {/* Master toggle */}
          <div className="sms-row" style={{marginBottom:16}}>
            <label className="sms-toggle">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({...f,enabled:e.target.checked}))} />
              <span className="sms-slider" />
            </label>
            <div>
              <div style={{fontSize:12,color: form.enabled ? '#22c55e' : '#6b7280',fontWeight:600}}>
                {form.enabled ? 'Alerts Enabled' : 'Alerts Disabled'}
              </div>
              <div style={{fontSize:10,color:'#4b5563',marginTop:2}}>Master kill-switch for all SMS alerts</div>
            </div>
          </div>

          {/* Cooldown */}
          <label className="sms-label">Alert Cooldown (seconds)</label>
          <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
            <input
              type="number" min="60" max="86400" step="60"
              className="sms-input" style={{width:100}}
              value={form.cooldownSecs}
              onChange={e => setForm(f => ({...f, cooldownSecs: parseInt(e.target.value)||900}))}
            />
            <span style={{fontSize:10,color:'#4b5563'}}>= {Math.round(form.cooldownSecs/60)} min between repeat SMS per job</span>
          </div>

          {/* Quiet hours */}
          <label className="sms-label">Quiet Hours (UTC) — non-critical jobs silenced</label>
          <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
            <select className="sms-select" style={{width:70}} value={form.quietStart}
              onChange={e => setForm(f => ({...f, quietStart: parseInt(e.target.value)}))}>
              {Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
            </select>
            <span style={{color:'#4b5563',fontSize:12}}>to</span>
            <select className="sms-select" style={{width:70}} value={form.quietEnd}
              onChange={e => setForm(f => ({...f, quietEnd: parseInt(e.target.value)}))}>
              {Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
            </select>
            <span style={{fontSize:10,color:'#4b5563'}}>(wraps midnight OK)</span>
          </div>
          <div style={{fontSize:10,color:'#374151',background:'rgba(200,146,42,.06)',border:'1px solid rgba(200,146,42,.12)',padding:'6px 10px',marginBottom:12}}>
            11pm–7am UTC = 4pm–midnight PT · Critical jobs always fire regardless of quiet hours
          </div>
        </div>

        {/* Right: critical jobs */}
        <div>
          <div className="sms-card-title">🚨 Critical Jobs — bypass quiet hours</div>
          <div style={{fontSize:10,color:'#4b5563',marginBottom:10}}>
            These jobs will always send SMS even during quiet hours. Click a chip to remove.
          </div>

          <div style={{marginBottom:12}}>
            {form.criticalJobs.map(j => (
              <span key={j} className="sms-chip" onClick={() => toggleJob(j)} title="Click to remove">
                {j} ×
              </span>
            ))}
            {!showNewJob
              ? <span className="sms-chip-add" onClick={() => setShowNewJob(true)}>+ add job</span>
              : <div style={{display:'inline-flex',gap:6,alignItems:'center',margin:'2px'}}>
                  <input
                    autoFocus className="sms-input" style={{width:130,padding:'3px 8px',fontSize:11}}
                    placeholder="job-id" value={newJob}
                    onChange={e => setNewJob(e.target.value)}
                    onKeyDown={e => { if(e.key==='Enter') addCustomJob(); if(e.key==='Escape') setShowNewJob(false) }}
                  />
                  <button className="sms-btn" style={{padding:'3px 10px',fontSize:10}} onClick={addCustomJob}>+</button>
                </div>
            }
          </div>

          <div style={{fontSize:10,color:'#374151',marginBottom:8}}>Quick-add from common jobs:</div>
          <div>
            {CRITICAL_JOB_OPTIONS.filter(j => !form.criticalJobs.includes(j)).map(j => (
              <span key={j} className="sms-chip-add" onClick={() => toggleJob(j)}>{j}</span>
            ))}
          </div>

          {/* Env var hint */}
          <div style={{marginTop:16,background:'#070b0f',border:'1px solid #1a2030',padding:'10px 12px'}}>
            <div style={{fontSize:9,color:'#4b5563',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:6}}>Vercel Env Vars Required</div>
            {[
              ['TWILIO_ACCOUNT_SID',  cfg.sidSet],
              ['TWILIO_AUTH_TOKEN',   cfg.tokenSet],
              ['TWILIO_FROM_NUMBER',  !!cfg.from],
              ['ALERT_PHONE_NUMBER',  !!cfg.to],
            ].map(([k, v]) => (
              <div key={k} className="sms-env-row">
                <code style={{fontSize:9,color: v ? '#C8922A' : '#ef4444'}}>{k}</code>
                <span style={{fontSize:9,color: v ? '#22c55e' : '#ef4444'}}>{v ? '✓ Set' : '✕ Missing'}</span>
                {!v && <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" style={{fontSize:9,color:'#C8922A',textDecoration:'none'}}>→ Vercel</a>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:24}}>
        <button className="sms-btn" onClick={save} disabled={saving}>
          {saving ? '...' : '💾 SAVE CONFIG'}
        </button>
        <button className="sms-btn" style={{background:'#1a2a1a',color:'#22c55e',border:'1px solid #22c55e33'}}
          onClick={sendTest} disabled={testing || !cfg.configured}>
          {testing ? '...' : '📱 SEND TEST SMS'}
        </button>
        <a href="/api/admin/test-sms" target="_blank" rel="noopener noreferrer" className="sms-ghost">
          🔍 Full Diagnostic
        </a>
        <button className="sms-ghost danger" onClick={resetOverride} style={{marginLeft:'auto'}}>
          ↺ Reset to defaults
        </button>
        {saveMsg && <span style={{fontSize:11,color: saveMsg.startsWith('✓') ? '#22c55e' : '#ef4444'}}>{saveMsg}</span>}
      </div>

      {/* ── Test result ── */}
      {testResult && (
        <div className="sms-card" style={{marginBottom:20,borderColor: testResult.sent ? '#22c55e44' : '#ef444444'}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:700,letterSpacing:'.06em',color: testResult.sent ? '#22c55e' : '#ef4444',marginBottom:6}}>
            {testResult.sent ? '✓ TEST SMS SENT' : '✕ TEST SMS FAILED'}
          </div>
          {testResult.sent
            ? <div style={{fontSize:10,color:'#9ca3af'}}>SID: <code style={{color:'#C8922A'}}>{testResult.sid}</code> · Status: {testResult.status} · {testResult.ms}ms</div>
            : <div style={{fontSize:10,color:'#ef4444'}}>{testResult.error ?? testResult.reason ?? 'Unknown error'} {testResult.httpStatus ? `(HTTP ${testResult.httpStatus})` : ''}</div>
          }
        </div>
      )}

      {/* ── Alert coverage map ── */}
      <hr className="sms-divider" />
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#4b5563',marginBottom:12}}>
        🗺 Alert Coverage — Critical Jobs & Trigger Conditions
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:8,marginBottom:20}}>
        {[
          { job: 'cron-health',       event: 'BROKEN or DEGRADED status',    severity: 'critical', freq: 'every 30min' },
          { job: 'news',              event: '3 consecutive feed failures',   severity: 'critical', freq: 'every 15min' },
          { job: 'gun-deals',         event: 'Deals cron error',              severity: 'high',     freq: 'every hour'  },
          { job: 'social-twitter',    event: 'Post queue failure',            severity: 'medium',   freq: 'daily 1pm UTC'},
          { job: 'blog-writer',       event: 'AI write failure',              severity: 'medium',   freq: 'Mon/Wed/Fri' },
          { job: 'quality-rewrite',   event: 'Rewrite job error',             severity: 'low',      freq: 'every hour'  },
          { job: 'releases',          event: 'Release scraper failure',       severity: 'medium',   freq: 'every hour'  },
          { job: 'sanity',            event: 'Sanity write failure',          severity: 'critical', freq: 'per-job'     },
        ].map(({ job, event, severity, freq }) => {
          const isCritical = form.criticalJobs.includes(job)
          const colors = { critical:'#ef4444', high:'#f59e0b', medium:'#3b82f6', low:'#6b7280' }
          const color  = colors[severity] ?? '#6b7280'
          return (
            <div key={job} style={{background:'#070b0f',border:`1px solid ${isCritical ? 'rgba(200,146,42,.2)' : 'rgba(30,41,59,.8)'}`,padding:'8px 12px',cursor:'pointer'}}
              onClick={() => toggleJob(job)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <code style={{fontSize:10,color:'#C8922A'}}>{job}</code>
                <span style={{fontSize:8,fontWeight:700,letterSpacing:'.06em',padding:'1px 5px',background:`${color}22`,color,textTransform:'uppercase'}}>{severity}</span>
              </div>
              <div style={{fontSize:10,color:'#6b7280',marginBottom:4}}>{event}</div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:9,color:'#374151'}}>{freq}</span>
                <span style={{fontSize:9,color: isCritical ? '#C8922A' : '#374151',fontWeight: isCritical ? 700 : 400}}>
                  {isCritical ? '🚨 critical' : 'quiet-aware'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── SMS Log ── */}
      <hr className="sms-divider" />
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',color:'#4b5563'}}>
          📋 SMS Event Log
        </div>
        <span style={{fontSize:10,color:'#374151'}}>{log.length} events</span>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className="sms-ghost" onClick={load}>↻ Refresh</button>
          <button className="sms-ghost danger" onClick={clearLog}>🗑 Clear</button>
        </div>
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',fontSize:12,color:'#4b5563'}}>Loading...</div>
      ) : log.length === 0 ? (
        <div style={{padding:40,textAlign:'center',fontSize:12,color:'#374151'}}>No SMS events yet. Send a test to verify configuration.</div>
      ) : (
        <div className="sms-log">
          <div className="sms-log-row" style={{borderBottom:'1px solid var(--border)',paddingBottom:6,paddingTop:6}}>
            <span style={{fontSize:9,color:'#374151',letterSpacing:'.06em',textTransform:'uppercase'}}>Time</span>
            <span style={{fontSize:9,color:'#374151',letterSpacing:'.06em',textTransform:'uppercase'}}>Status</span>
            <span style={{fontSize:9,color:'#374151',letterSpacing:'.06em',textTransform:'uppercase'}}>Job</span>
            <span style={{fontSize:9,color:'#374151',letterSpacing:'.06em',textTransform:'uppercase'}}>Message / Reason</span>
          </div>
          {log.map((l, i) => (
            <div key={i} className="sms-log-row" style={!l.sent ? {background:'rgba(239,68,68,.02)'} : {}}>
              <span style={{fontSize:9,color:'#374151'}}>{fmtAge(l.ts)}</span>
              <Badge sent={l.sent} reason={l.reason} />
              <code style={{fontSize:9,color:'#C8922A'}}>{l.jobId ?? '—'}</code>
              <span style={{fontSize:10,color: l.sent ? '#9ca3af' : '#6b7280',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {l.sent ? l.message : (l.reason ?? l.message)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:14,fontSize:10,color:'#374151',lineHeight:1.9,borderTop:'1px solid var(--border)',paddingTop:12}}>
        Powered by Twilio · Overrides stored in Upstash Redis · Env defaults: <code style={{color:'#C8922A'}}>TWILIO_*</code> · Diagnostic: <a href="/api/admin/test-sms" target="_blank" rel="noopener noreferrer" style={{color:'#C8922A'}}>/api/admin/test-sms</a>
      </div>
    </div>
  )
}
