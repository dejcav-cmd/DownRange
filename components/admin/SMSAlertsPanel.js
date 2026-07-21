'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

const S = `
.sms-wrap { font-family: 'IBM Plex Mono', monospace; }
.sms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
@media (max-width: 700px) { .sms-grid { grid-template-columns: 1fr; } }
.sms-card { background: var(--bg2); border: 1px solid var(--border); padding: 16px 18px; }
.sms-card-title { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; color: #6b7280; margin-bottom: 12px; }
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
.sms-stat-val { font-family: 'Bebas Neue', cursive; font-size: 2rem; line-height: 1; }
.sms-stat-lbl { font-size: 9px; color: #4b5563; letter-spacing: .08em; text-transform: uppercase; margin-top: 3px; }
.sms-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

/* ── Log table ── */
.sms-log-wrap { background: #050809; border: 1px solid #1a2030; }
.sms-log-header { display: grid; grid-template-columns: 120px 76px 110px 1fr 70px 60px;
  gap: 0; padding: 6px 12px; border-bottom: 1px solid #1a2030; }
.sms-log-col { font-size: 9px; color: #374151; letter-spacing: .08em; text-transform: uppercase; }
.sms-log-body { max-height: 480px; overflow-y: auto; }
.sms-log-row { display: grid; grid-template-columns: 120px 76px 110px 1fr 70px 60px;
  gap: 0; padding: 7px 12px; border-bottom: 1px solid #0a0f14;
  cursor: pointer; transition: background .1s; align-items: center; }
.sms-log-row:hover { background: #0d1117; }
.sms-log-row.expanded { background: #0d1117; border-bottom: none; }
.sms-log-detail { background: #060a0f; border-bottom: 1px solid #1a2030;
  padding: 10px 14px 12px 14px; font-size: 10px; line-height: 1.8; }
.sms-log-detail-grid { display: grid; grid-template-columns: 130px 1fr; gap: 4px 12px; }
.sms-log-detail-key { color: #374151; font-size: 9px; letter-spacing: .06em; text-transform: uppercase; }
.sms-log-detail-val { color: #9ca3af; word-break: break-all; }

/* ── Filter tabs ── */
.sms-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 0; }
.sms-tab { font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; padding: 8px 16px; cursor: pointer; border: none;
  background: none; color: #4b5563; border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: all .15s; display: flex; align-items: center; gap: 6px; }
.sms-tab:hover { color: var(--text); }
.sms-tab.active { color: var(--gold); border-bottom-color: var(--gold); }
.sms-tab-count { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 1px 5px;
  border-radius: 2px; background: var(--bg2); }

/* ── Live indicator ── */
@keyframes sms-pulse { 0%,100%{opacity:1}50%{opacity:.3} }
.sms-live { display: inline-block; width: 6px; height: 6px; border-radius: 50%;
  background: #22c55e; animation: sms-pulse 2s ease-in-out infinite; margin-right: 5px; }
@keyframes sms-spin { to{transform:rotate(360deg)} }
.sms-spin { display: inline-block; width: 10px; height: 10px; border: 2px solid rgba(200,146,42,.3);
  border-top-color: var(--gold); border-radius: 50%; animation: sms-spin .8s linear infinite; vertical-align: middle; }

/* ── Mini spark ── */
.sms-spark { display: flex; gap: 2px; align-items: flex-end; height: 20px; }
.sms-spark-bar { width: 6px; border-radius: 1px; min-height: 2px; }
`

const CRITICAL_JOB_OPTIONS = [
  'news','sanity','cron-health','gun-deals','social-twitter',
  'social-facebook','blog-writer','quality-rewrite','releases',
]

function StatusBadge({ sent, reason }) {
  if (sent) return (
    <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,letterSpacing:'.05em',
      padding:'2px 7px',background:'rgba(34,197,94,.12)',color:'#22c55e',border:'1px solid rgba(34,197,94,.2)'}}>
      ✓ SENT
    </span>
  )
  const r = reason ?? ''
  if (r.includes('isabled'))  return <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,letterSpacing:'.05em',padding:'2px 7px',background:'rgba(107,114,128,.1)',color:'#6b7280',border:'1px solid rgba(107,114,128,.2)'}}>DISABLED</span>
  if (r.includes('ooldown'))  return <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,letterSpacing:'.05em',padding:'2px 7px',background:'rgba(59,130,246,.1)',color:'#60a5fa',border:'1px solid rgba(59,130,246,.2)'}}>COOLDOWN</span>
  if (r.includes('uiet'))     return <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,letterSpacing:'.05em',padding:'2px 7px',background:'rgba(139,92,246,.1)',color:'#a78bfa',border:'1px solid rgba(139,92,246,.2)'}}>QUIET HRS</span>
  if (r.includes('isabled') || r.includes('Missing')) return <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,letterSpacing:'.05em',padding:'2px 7px',background:'rgba(245,158,11,.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.2)'}}>NO CONFIG</span>
  return <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,letterSpacing:'.05em',padding:'2px 7px',background:'rgba(239,68,68,.12)',color:'#ef4444',border:'1px solid rgba(239,68,68,.2)'}}>✕ FAILED</span>
}

function fmtAge(iso) {
  if (!iso) return '—'
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 1)    return 'just now'
  if (m < 60)   return `${m}m ago`
  if (m < 1440) return `${Math.floor(m/60)}h ago`
  return `${Math.floor(m/1440)}d ago`
}
function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})
}

function Spark({ log }) {
  // last 20 events as bars
  const recent = log.slice(0,20).reverse()
  if (!recent.length) return null
  return (
    <div className="sms-spark">
      {recent.map((l,i) => (
        <div key={i} className="sms-spark-bar"
          style={{height: l.sent ? 18 : 8,
            background: l.sent ? '#22c55e' :
              (l.reason?.includes('ooldown') ? '#60a5fa' :
               l.reason?.includes('uiet')   ? '#a78bfa' : '#ef4444'),
            opacity: 0.4 + (i/recent.length)*0.6
          }} title={`${l.jobId}: ${l.sent?'sent':l.reason}`} />
      ))}
    </div>
  )
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
  const [tab,        setTab]        = useState('all')     // all | sent | skipped | failed
  const [expanded,   setExpanded]   = useState(null)      // log entry id
  const [autoRefresh,setAutoRefresh]= useState(true)
  const [logFilter,  setLogFilter]  = useState('')        // job search filter
  const timerRef = useRef(null)

  const [form, setForm] = useState({
    enabled: true, cooldownSecs: 900, quietStart: 23, quietEnd: 7,
    criticalJobs: ['news','sanity','cron-health'],
  })

  const H = { 'x-admin-key': adminKey }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const r = await fetch('/api/admin/sms-config', { headers: H })
      const d = await r.json()
      setData(d)
      const src = d.override ?? {}
      setForm(f => ({
        enabled:      src.enabled      ?? d.status?.enabled      ?? true,
        cooldownSecs: src.cooldownSecs ?? d.status?.cooldownSecs ?? 900,
        quietStart:   src.quietStart   ?? d.status?.quietStart   ?? 23,
        quietEnd:     src.quietEnd     ?? d.status?.quietEnd     ?? 7,
        criticalJobs: src.criticalJobs ?? d.status?.criticalJobs ?? ['news','sanity','cron-health'],
      }))
    } catch {}
    if (!silent) setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 15s
  useEffect(() => {
    if (!autoRefresh) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => load(true), 15000)
    return () => clearInterval(timerRef.current)
  }, [autoRefresh, load])

  async function save() {
    setSaving(true); setSaveMsg(null)
    try {
      const r = await fetch('/api/admin/sms-config', {
        method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify(form),
      })
      const d = await r.json()
      setSaveMsg(d.ok ? '✓ Saved' : '✕ Failed')
      await load()
    } catch { setSaveMsg('✕ Network error') }
    setSaving(false)
    setTimeout(() => setSaveMsg(null), 3000)
  }

  async function sendTest() {
    setTesting(true); setTestResult(null)
    try {
      const r = await fetch('/api/admin/test-sms', {
        method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({key:adminKey}),
      })
      setTestResult(await r.json())
    } catch (e) { setTestResult({sent:false,error:e.message}) }
    setTesting(false)
    setTimeout(() => load(true), 1500) // reload log to show the test event
  }

  async function clearLog() {
    if (!confirm('Clear the SMS event log? This cannot be undone.')) return
    await fetch('/api/admin/sms-config?what=log', {method:'DELETE',headers:H})
    load()
  }

  async function resetOverride() {
    if (!confirm('Reset all admin overrides? Config will fall back to Vercel env vars.')) return
    await fetch('/api/admin/sms-config?what=config', {method:'DELETE',headers:H})
    load()
  }

  function toggleJob(job) {
    setForm(f => ({...f,
      criticalJobs: f.criticalJobs.includes(job) ? f.criticalJobs.filter(j=>j!==job) : [...f.criticalJobs,job]
    }))
  }
  function addCustomJob() {
    const j = newJob.trim(); if (!j) return
    if (!form.criticalJobs.includes(j)) setForm(f=>({...f,criticalJobs:[...f.criticalJobs,j]}))
    setNewJob(''); setShowNewJob(false)
  }

  const cfg = data?.status ?? {}
  const rawLog = data?.log ?? []

  // Filter pipeline
  const filteredLog = rawLog.filter(l => {
    if (logFilter && !l.jobId?.includes(logFilter) && !l.message?.includes(logFilter)) return false
    if (tab === 'sent')    return l.sent
    if (tab === 'skipped') return !l.sent && (l.reason?.includes('ooldown') || l.reason?.includes('uiet') || l.reason?.includes('isabled'))
    if (tab === 'failed')  return !l.sent && !l.reason?.includes('ooldown') && !l.reason?.includes('uiet') && !l.reason?.includes('isabled')
    return true
  })

  const sentCount    = rawLog.filter(l => l.sent).length
  const failedCount  = rawLog.filter(l => !l.sent && !l.reason?.includes('ooldown') && !l.reason?.includes('uiet') && !l.reason?.includes('isabled') && !l.reason?.includes('Missing')).length
  const skippedCount = rawLog.filter(l => !l.sent && (l.reason?.includes('ooldown') || l.reason?.includes('uiet') || l.reason?.includes('isabled') || l.reason?.includes('Missing'))).length
  const isOk = cfg.configured && cfg.enabled
  const lastSent = rawLog.find(l => l.sent)

  // Success rate sparkline data
  const recentWindow = rawLog.slice(0, 50)
  const successRate  = recentWindow.length ? Math.round((recentWindow.filter(l=>l.sent).length / recentWindow.length) * 100) : null

  return (
    <div className="sms-wrap">
      <style>{S}</style>

      <div className="panel-title">SMS Alerts</div>
      <div className="panel-sub">
        Twilio-powered SMS for critical job failures and health events. Every send, skip, and failure is logged here.
      </div>

      {/* ── Top status bar ── */}
      {!loading && (
        <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'stretch'}}>

          {/* Status card */}
          <div className="sms-card" style={{padding:'12px 16px',display:'flex',gap:12,alignItems:'center',flex:'1 1 200px'}}>
            <span style={{fontSize:24,lineHeight:1}}>{isOk?'🟢':cfg.configured&&!cfg.enabled?'🟡':'🔴'}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'.06em',
                color:isOk?'#22c55e':cfg.configured?'#f59e0b':'#ef4444'}}>
                {isOk?'OPERATIONAL':cfg.configured?'DISABLED':'NOT CONFIGURED'}
              </div>
              <div style={{fontSize:10,color:'#4b5563',marginTop:2}}>
                {cfg.configured?`${cfg.from ?? '—'} → ${cfg.to ?? '—'}`:'Add TWILIO_* env vars in Vercel'}
              </div>
              {lastSent && <div style={{fontSize:9,color:'#374151',marginTop:3}}>Last sent: {fmtAge(lastSent.ts)}</div>}
            </div>
            <Spark log={rawLog} />
          </div>

          {/* Stats */}
          {[
            {val:rawLog.length,    lbl:'Total Events',  color:'#C8922A'},
            {val:sentCount,        lbl:'Sent',           color:'#22c55e'},
            {val:failedCount,      lbl:'Failed',         color:failedCount>0?'#ef4444':'#4b5563'},
            {val:skippedCount,     lbl:'Skipped',        color:'#60a5fa'},
            {val:successRate!=null?`${successRate}%`:'—', lbl:'Send Rate',   color:successRate>=90?'#22c55e':successRate>=50?'#f59e0b':'#ef4444'},
          ].map(({val,lbl,color})=>(
            <div key={lbl} className="sms-card" style={{padding:'10px 14px',textAlign:'center',minWidth:70}}>
              <div className="sms-stat-val" style={{color}}>{val}</div>
              <div className="sms-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Config + Settings grid ── */}
      <div className="sms-grid">
        {/* Left: behaviour */}
        <div>
          <div className="sms-card-title">⚙ Behaviour</div>

          <div className="sms-row" style={{marginBottom:16}}>
            <label className="sms-toggle">
              <input type="checkbox" checked={form.enabled} onChange={e=>setForm(f=>({...f,enabled:e.target.checked}))} />
              <span className="sms-slider" />
            </label>
            <div>
              <div style={{fontSize:12,color:form.enabled?'#22c55e':'#6b7280',fontWeight:600}}>
                {form.enabled?'Alerts Enabled':'Alerts Disabled'}
              </div>
              <div style={{fontSize:10,color:'#4b5563',marginTop:2}}>Master kill-switch</div>
            </div>
          </div>

          <label className="sms-label">Cooldown (seconds per job)</label>
          <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
            <input type="number" min="60" max="86400" step="60" className="sms-input" style={{width:90}}
              value={form.cooldownSecs} onChange={e=>setForm(f=>({...f,cooldownSecs:parseInt(e.target.value)||900}))} />
            <span style={{fontSize:10,color:'#4b5563'}}>{Math.round(form.cooldownSecs/60)} min between repeat SMS per job</span>
          </div>

          <label className="sms-label">Quiet Hours (UTC)</label>
          <div style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
            <select className="sms-select" style={{width:68}} value={form.quietStart}
              onChange={e=>setForm(f=>({...f,quietStart:parseInt(e.target.value)}))}>
              {Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
            </select>
            <span style={{color:'#4b5563',fontSize:12}}>to</span>
            <select className="sms-select" style={{width:68}} value={form.quietEnd}
              onChange={e=>setForm(f=>({...f,quietEnd:parseInt(e.target.value)}))}>
              {Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,'0')}:00</option>)}
            </select>
          </div>
          <div style={{fontSize:10,color:'#374151',background:'rgba(200,146,42,.06)',border:'1px solid rgba(200,146,42,.12)',padding:'5px 9px',marginBottom:12}}>
            {form.quietStart}:00–{form.quietEnd}:00 UTC = ~{((form.quietStart-7+24)%24)}pm–{((form.quietEnd-7+24)%24)}am PT · Critical jobs always fire
          </div>

          {/* Env var status */}
          <div style={{background:'#070b0f',border:'1px solid #1a2030',padding:'10px 12px'}}>
            <div style={{fontSize:9,color:'#4b5563',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:6}}>Vercel Env Vars</div>
            {[
              ['TWILIO_ACCOUNT_SID', cfg.sidSet],
              ['TWILIO_AUTH_TOKEN',  cfg.tokenSet],
              ['TWILIO_FROM_NUMBER', !!cfg.from],
              ['ALERT_PHONE_NUMBER', !!cfg.to],
            ].map(([k,v])=>(
              <div key={k} className="sms-env-row">
                <code style={{fontSize:9,color:v?'#C8922A':'#ef4444'}}>{k}</code>
                <span style={{fontSize:9,color:v?'#22c55e':'#ef4444'}}>{v?'✓ Set':'✕ Missing'}</span>
                {!v&&<a href="https://vercel.com/dejcav-cmd/downrangeco/settings/environment-variables" target="_blank" rel="noopener noreferrer"
                  style={{fontSize:9,color:'#C8922A',textDecoration:'none'}}>→ Add in Vercel</a>}
              </div>
            ))}
          </div>
          {!cfg.configured && (
            <div style={{marginTop:12,padding:'10px 12px',background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.2)'}}>
              <div style={{fontSize:10,color:'#ef4444',fontWeight:700,marginBottom:6}}>⚠ SMS cannot send until credentials are added</div>
              <div style={{fontSize:10,color:'#6b7280',lineHeight:1.8}}>
                1. Go to <a href="https://console.twilio.com" target="_blank" style={{color:'#C8922A'}}>console.twilio.com</a> → get SID + Auth Token<br/>
                2. <a href="https://vercel.com/dejcav-cmd/downrangeco/settings/environment-variables" target="_blank" style={{color:'#C8922A'}}>Vercel → downrangeco → Settings → Env Vars</a> → add:<br/>
                <code style={{display:'block',background:'#0a0f14',padding:'8px 10px',marginTop:6,fontSize:10,lineHeight:2,color:'#e5e7eb'}}>
                  TWILIO_ACCOUNT_SID = AC…<br/>
                  TWILIO_AUTH_TOKEN  = (from Twilio Console)<br/>
                  TWILIO_FROM_NUMBER = +12062036281<br/>
                  ALERT_PHONE_NUMBER = +12066016076
                </code>
                3. Redeploy (Vercel → Deployments → ⋯ → Redeploy)
              </div>
            </div>
          )}
        </div>

        {/* Right: critical jobs */}
        <div>
          <div className="sms-card-title">🚨 Critical Jobs — bypass quiet hours</div>
          <div style={{fontSize:10,color:'#4b5563',marginBottom:10}}>Click to remove. These jobs always fire SMS regardless of quiet hours.</div>
          <div style={{marginBottom:12}}>
            {form.criticalJobs.map(j=>(
              <span key={j} className="sms-chip" onClick={()=>toggleJob(j)} title="Click to remove">{j} ×</span>
            ))}
            {!showNewJob
              ? <span className="sms-chip-add" onClick={()=>setShowNewJob(true)}>+ add</span>
              : <span style={{display:'inline-flex',gap:5,alignItems:'center',margin:2}}>
                  <input autoFocus className="sms-input" style={{width:120,padding:'3px 8px',fontSize:11}}
                    placeholder="job-id" value={newJob}
                    onChange={e=>setNewJob(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter')addCustomJob();if(e.key==='Escape')setShowNewJob(false)}} />
                  <button className="sms-btn" style={{padding:'3px 10px',fontSize:10}} onClick={addCustomJob}>+</button>
                </span>
            }
          </div>
          <div style={{fontSize:10,color:'#374151',marginBottom:8}}>Quick-add:</div>
          <div style={{marginBottom:16}}>
            {CRITICAL_JOB_OPTIONS.filter(j=>!form.criticalJobs.includes(j)).map(j=>(
              <span key={j} className="sms-chip-add" onClick={()=>toggleJob(j)}>{j}</span>
            ))}
          </div>

          {/* Alert coverage */}
          <div style={{fontSize:9,color:'#4b5563',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:8}}>Coverage Map</div>
          <div style={{display:'flex',flexDirection:'column',gap:3}}>
            {[
              {job:'cron-health',  event:'BROKEN/DEGRADED',         sev:'critical'},
              {job:'news',         event:'3× consecutive failures',  sev:'critical'},
              {job:'gun-deals',    event:'Deals cron error',         sev:'high'},
              {job:'blog-writer',  event:'AI write failure',         sev:'medium'},
              {job:'releases',     event:'Scraper failure',          sev:'medium'},
              {job:'sanity',       event:'CMS write failure',        sev:'critical'},
            ].map(({job,event,sev})=>{
              const isCrit = form.criticalJobs.includes(job)
              const c = {critical:'#ef4444',high:'#f59e0b',medium:'#3b82f6'}[sev]
              return (
                <div key={job} onClick={()=>toggleJob(job)}
                  style={{display:'grid',gridTemplateColumns:'110px 1fr 70px',gap:8,alignItems:'center',
                    padding:'5px 8px',background:'#070b0f',border:`1px solid ${isCrit?'rgba(200,146,42,.2)':'#111'}`,
                    cursor:'pointer',transition:'border-color .15s'}}>
                  <code style={{fontSize:9,color:'#C8922A'}}>{job}</code>
                  <span style={{fontSize:9,color:'#4b5563'}}>{event}</span>
                  <span style={{fontSize:8,fontWeight:700,letterSpacing:'.05em',textAlign:'right',
                    color:isCrit?'#C8922A':c,textTransform:'uppercase'}}>
                    {isCrit?'🚨 critical':sev}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:24,padding:'12px 0',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <button className="sms-btn" onClick={save} disabled={saving}>
          {saving ? <span className="sms-spin" /> : '💾'} SAVE CONFIG
        </button>
        <button className="sms-btn"
          style={{background:cfg.configured?'#0d1a0d':'#1a1a1a',color:cfg.configured?'#22c55e':'#4b5563',
            border:`1px solid ${cfg.configured?'rgba(34,197,94,.3)':'rgba(75,85,99,.2)'}`}}
          onClick={sendTest} disabled={testing||!cfg.configured}
          title={!cfg.configured?'Twilio not configured':undefined}>
          {testing ? <span className="sms-spin" /> : '📱'} SEND TEST SMS
        </button>
        <a href="/api/admin/test-sms" target="_blank" rel="noopener noreferrer" className="sms-ghost">
          🔍 Diagnostic Page
        </a>
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          {saveMsg && <span style={{fontSize:11,color:saveMsg.startsWith('✓')?'#22c55e':'#ef4444'}}>{saveMsg}</span>}
          <button className="sms-ghost danger" onClick={resetOverride} style={{fontSize:9}}>↺ Reset overrides</button>
        </div>
      </div>

      {/* Test result inline */}
      {testResult && (
        <div style={{marginBottom:16,padding:'10px 14px',background:'#070b0f',
          border:`1px solid ${testResult.sent?'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`}}>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:700,
            color:testResult.sent?'#22c55e':'#ef4444',letterSpacing:'.06em'}}>
            {testResult.sent?'✓ SMS SENT':'✕ SMS FAILED'}
          </span>
          {testResult.sent
            ? <span style={{fontSize:10,color:'#6b7280',marginLeft:12}}>
                SID: <code style={{color:'#C8922A'}}>{testResult.sid}</code> · {testResult.status} · {testResult.ms}ms
              </span>
            : <span style={{fontSize:10,color:'#ef4444',marginLeft:12}}>
                {testResult.error ?? testResult.reason} {testResult.httpStatus?`(HTTP ${testResult.httpStatus})`:''}
              </span>
          }
        </div>
      )}

      {/* ── SMS Execution Log ── */}
      <hr className="sms-divider" />
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:0,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'.08em',
            textTransform:'uppercase',color:'#9ca3af',marginBottom:2}}>
            📋 SMS Execution Log
          </div>
          <div style={{fontSize:10,color:'#374151'}}>
            Every send attempt — delivered, skipped, and failed
            {rawLog.length > 0 && <span style={{color:'#4b5563'}}> · {rawLog.length} events in buffer</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <label style={{display:'flex',gap:6,alignItems:'center',cursor:'pointer',fontSize:10,color:'#4b5563'}}>
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)}
              style={{accentColor:'#C8922A'}} />
            {autoRefresh && <span className="sms-live" />}
            auto-refresh 15s
          </label>
          <button className="sms-ghost" onClick={()=>load(false)}>↻ Refresh</button>
          <button className="sms-ghost danger" onClick={clearLog}>🗑 Clear log</button>
        </div>
      </div>

      {/* Filter row */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
        borderBottom:'1px solid var(--border)',marginTop:12,flexWrap:'wrap',gap:8}}>
        <div className="sms-tabs">
          {[
            {id:'all',     label:'All',     count:rawLog.length},
            {id:'sent',    label:'Sent',    count:sentCount,    color:'#22c55e'},
            {id:'failed',  label:'Failed',  count:failedCount,  color:'#ef4444'},
            {id:'skipped', label:'Skipped', count:skippedCount, color:'#60a5fa'},
          ].map(t=>(
            <button key={t.id} className={`sms-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>
              {t.label}
              <span className="sms-tab-count" style={{color:tab===t.id?(t.color||'var(--gold)'):'#4b5563'}}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <input className="sms-input" style={{width:160,padding:'4px 8px',fontSize:10,marginBottom:1}}
          placeholder="filter by job..." value={logFilter}
          onChange={e=>setLogFilter(e.target.value)} />
      </div>

      {loading ? (
        <div style={{padding:60,textAlign:'center',fontSize:12,color:'#4b5563',display:'flex',gap:8,alignItems:'center',justifyContent:'center'}}>
          <span className="sms-spin" /> Loading log...
        </div>
      ) : filteredLog.length === 0 ? (
        <div style={{padding:60,textAlign:'center',fontSize:12,color:'#374151',background:'#050809',border:'1px solid #1a2030'}}>
          {rawLog.length === 0
            ? 'No SMS events yet. Send a test to verify configuration.'
            : `No ${tab==='all'?'':tab} events${logFilter?` matching "${logFilter}"`:''}. ${tab==='sent'?'No messages have been delivered yet.':''}`
          }
        </div>
      ) : (
        <div className="sms-log-wrap">
          <div className="sms-log-header">
            <span className="sms-log-col">Timestamp</span>
            <span className="sms-log-col">Status</span>
            <span className="sms-log-col">Job ID</span>
            <span className="sms-log-col">Message / Reason</span>
            <span className="sms-log-col">Latency</span>
            <span className="sms-log-col">Details</span>
          </div>
          <div className="sms-log-body">
            {filteredLog.map((l,i) => {
              const isExp = expanded === l.id
              return (
                <React.Fragment key={l.id ?? i}>
                  <div className={`sms-log-row${isExp?' expanded':''}`}
                    onClick={()=>setExpanded(isExp?null:l.id)}>
                    <span style={{fontSize:9,color:'#4b5563'}} title={fmtTime(l.ts)}>{fmtAge(l.ts)}</span>
                    <StatusBadge sent={l.sent} reason={l.reason} />
                    <code style={{fontSize:9,color:'#C8922A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.jobId ?? '—'}</code>
                    <span style={{fontSize:10,color:l.sent?'#9ca3af':'#6b7280',
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                      title={l.sent?l.message:(l.reason??l.message)}>
                      {l.sent ? l.message : (l.reason ?? l.message)}
                    </span>
                    <span style={{fontSize:9,color:'#374151'}}>{l.ms ? `${l.ms}ms` : '—'}</span>
                    <span style={{fontSize:9,color:'#374151',textAlign:'right'}}>{isExp?'▲':'▼'}</span>
                  </div>
                  {isExp && (
                    <div className="sms-log-detail">
                      <div className="sms-log-detail-grid">
                        <span className="sms-log-detail-key">Timestamp</span>
                        <span className="sms-log-detail-val">{fmtTime(l.ts)}</span>

                        <span className="sms-log-detail-key">Job ID</span>
                        <span className="sms-log-detail-val"><code style={{color:'#C8922A'}}>{l.jobId ?? '—'}</code></span>

                        <span className="sms-log-detail-key">Outcome</span>
                        <span className="sms-log-detail-val"><StatusBadge sent={l.sent} reason={l.reason} /></span>

                        <span className="sms-log-detail-key">Full Message</span>
                        <span className="sms-log-detail-val" style={{color:'#e5e7eb',whiteSpace:'pre-wrap'}}>{l.message ?? '—'}</span>

                        {!l.sent && l.reason && <>
                          <span className="sms-log-detail-key">Skip / Fail Reason</span>
                          <span className="sms-log-detail-val" style={{color:'#ef4444'}}>{l.reason}</span>
                        </>}

                        {l.twilioSid && <>
                          <span className="sms-log-detail-key">Twilio SID</span>
                          <span className="sms-log-detail-val"><code style={{color:'#22c55e'}}>{l.twilioSid}</code></span>
                        </>}

                        {l.twilioStatus && <>
                          <span className="sms-log-detail-key">Twilio Status</span>
                          <span className="sms-log-detail-val">{l.twilioStatus}</span>
                        </>}

                        {l.httpStatus && <>
                          <span className="sms-log-detail-key">HTTP Status</span>
                          <span className="sms-log-detail-val" style={{color:l.httpStatus>=400?'#ef4444':'#22c55e'}}>{l.httpStatus}</span>
                        </>}

                        {l.errCode && <>
                          <span className="sms-log-detail-key">Twilio Error Code</span>
                          <span className="sms-log-detail-val" style={{color:'#ef4444'}}>
                            {l.errCode}
                            {l.errCode===30034&&' — Toll-free verification required'}
                            {l.errCode===21608&&' — Number not verified in Twilio console'}
                            {l.errCode===21211&&' — Invalid "To" phone number'}
                          </span>
                        </>}

                        {l.ms && <>
                          <span className="sms-log-detail-key">Latency</span>
                          <span className="sms-log-detail-val">{l.ms}ms</span>
                        </>}

                        <span className="sms-log-detail-key">Event ID</span>
                        <span className="sms-log-detail-val" style={{color:'#374151',fontSize:9}}>{l.id ?? '—'}</span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}

      <div style={{marginTop:12,fontSize:10,color:'#374151',lineHeight:1.9,borderTop:'1px solid var(--border)',paddingTop:10,display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
        <span>Powered by Twilio · Log stored in Upstash Redis · Max 200 events</span>
        <a href="/api/admin/test-sms" target="_blank" rel="noopener noreferrer" style={{color:'#C8922A'}}>/api/admin/test-sms →</a>
      </div>
    </div>
  )
}
