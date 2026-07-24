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
.sms-env-row { display: grid; grid-template-columns: 220px 1fr auto; gap: 10px; padding: 7px 0;
  border-bottom: 1px solid rgba(30,41,59,.5); align-items: center; font-size: 10px; }
.sms-stat-val { font-family: 'Bebas Neue', cursive; font-size: 2rem; line-height: 1; }
.sms-stat-lbl { font-size: 9px; color: #4b5563; letter-spacing: .08em; text-transform: uppercase; margin-top: 3px; }
.sms-divider { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
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

/* ── Log table ── */
.sms-log-wrap { background: #050809; border: 1px solid #1a2030; }
.sms-log-header { display: grid; grid-template-columns: 120px 76px 110px 1fr 60px;
  gap: 0; padding: 6px 12px; border-bottom: 1px solid #1a2030; }
.sms-log-col { font-size: 9px; color: #374151; letter-spacing: .08em; text-transform: uppercase; }
.sms-log-body { max-height: 480px; overflow-y: auto; }
.sms-log-row { display: grid; grid-template-columns: 120px 76px 110px 1fr 60px;
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
  if (r.includes('Missing'))  return <span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:9,fontWeight:700,letterSpacing:'.05em',padding:'2px 7px',background:'rgba(245,158,11,.1)',color:'#f59e0b',border:'1px solid rgba(245,158,11,.2)'}}>NO CONFIG</span>
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
  const recent = log.slice(0,20).reverse()
  if (!recent.length) return null
  return (
    <div className="sms-spark">
      {recent.map((l,i) => (
        <div key={i} className="sms-spark-bar"
          style={{height: l.sent ? 18 : 8,
            background: l.sent ? '#22c55e' :
              (l.reason?.includes('ooldown') ? '#60a5fa' : '#ef4444'),
            opacity: 0.4 + (i/recent.length)*0.6
          }} title={`${l.jobId}: ${l.sent?'sent':l.reason}`} />
      ))}
    </div>
  )
}

export default function SMSAlertsPanel({ adminKey }) {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [tab,        setTab]        = useState('all')
  const [expanded,   setExpanded]   = useState(null)
  const [autoRefresh,setAutoRefresh]= useState(true)
  const [logFilter,  setLogFilter]  = useState('')
  const timerRef = useRef(null)

  const H = { 'x-admin-key': adminKey }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const r = await fetch('/api/admin/sms-config', { headers: H })
      const d = await r.json()
      setData(d)
    } catch {}
    if (!silent) setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!autoRefresh) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => load(true), 15000)
    return () => clearInterval(timerRef.current)
  }, [autoRefresh, load])

  async function sendTest() {
    setTesting(true); setTestResult(null)
    try {
      const r = await fetch('/api/admin/test-sms', {
        method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({key:adminKey}),
      })
      setTestResult(await r.json())
    } catch (e) { setTestResult({sent:false,error:e.message}) }
    setTesting(false)
    setTimeout(() => load(true), 1500)
  }

  async function clearLog() {
    if (!confirm('Clear the alert event log? This cannot be undone.')) return
    await fetch('/api/admin/sms-config', {method:'DELETE',headers:H})
    load()
  }

  const cfg    = data?.status ?? {}
  const rawLog = data?.log ?? []

  const filteredLog = rawLog.filter(l => {
    if (logFilter && !l.jobId?.includes(logFilter) && !l.message?.includes(logFilter)) return false
    if (tab === 'sent')    return l.sent
    if (tab === 'skipped') return !l.sent && (l.reason?.includes('ooldown') || l.reason?.includes('isabled'))
    if (tab === 'failed')  return !l.sent && !l.reason?.includes('ooldown') && !l.reason?.includes('isabled') && !l.reason?.includes('Missing')
    return true
  })

  const sentCount    = rawLog.filter(l => l.sent).length
  const failedCount  = rawLog.filter(l => !l.sent && !l.reason?.includes('ooldown') && !l.reason?.includes('isabled') && !l.reason?.includes('Missing')).length
  const skippedCount = rawLog.filter(l => !l.sent && (l.reason?.includes('ooldown') || l.reason?.includes('isabled') || l.reason?.includes('Missing'))).length
  const isOk         = cfg.configured && cfg.enabled
  const lastSent     = rawLog.find(l => l.sent)
  const recentWindow = rawLog.slice(0, 50)
  const successRate  = recentWindow.length ? Math.round((recentWindow.filter(l=>l.sent).length / recentWindow.length) * 100) : null

  return (
    <div className="sms-wrap">
      <style>{S}</style>

      <div className="panel-title">Cron Alerts</div>
      <div className="panel-sub">
        Resend email alerts for critical job failures. Every send, skip, and failure is logged here.
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
                {cfg.configured
                  ? `Resend → ${cfg.alertEmail ?? '—'}`
                  : 'Add RESEND_API_KEY in Vercel'}
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
            {val:successRate!=null?`${successRate}%`:'—', lbl:'Send Rate', color:successRate>=90?'#22c55e':successRate>=50?'#f59e0b':'#ef4444'},
          ].map(({val,lbl,color})=>(
            <div key={lbl} className="sms-card" style={{padding:'10px 14px',textAlign:'center',minWidth:70}}>
              <div className="sms-stat-val" style={{color}}>{val}</div>
              <div className="sms-stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Config info ── */}
      <div className="sms-grid">
        <div>
          <div className="sms-card-title">⚙ Configuration</div>
          <div style={{background:'#070b0f',border:'1px solid #1a2030',padding:'10px 12px',marginBottom:12}}>
            <div style={{fontSize:9,color:'#4b5563',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:6}}>Vercel Env Vars</div>
            {[
              ['RESEND_API_KEY', cfg.configured],
            ].map(([k,v])=>(
              <div key={k} className="sms-env-row">
                <code style={{fontSize:9,color:v?'#C8922A':'#ef4444'}}>{k}</code>
                <span style={{fontSize:9,color:v?'#22c55e':'#ef4444'}}>{v?'✓ Set':'✕ Missing'}</span>
                {!v&&<a href="https://vercel.com/dejcav-cmd/downrangeco/settings/environment-variables" target="_blank" rel="noopener noreferrer"
                  style={{fontSize:9,color:'#C8922A',textDecoration:'none'}}>→ Add in Vercel</a>}
              </div>
            ))}
          </div>
          {[
            ['Alert email',  cfg.alertEmail ?? 'dejcav@gmail.com'],
            ['Provider',     cfg.provider   ?? 'resend'],
            ['Cooldown',     cfg.cooldownSecs ? `${cfg.cooldownSecs}s (${Math.round(cfg.cooldownSecs/60)} min)` : '—'],
            ['Alerts active',cfg.enabled ? 'true ✓' : 'false'],
          ].map(([k,v])=>(
            <div key={k} style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:8,padding:'5px 0',
              borderBottom:'1px solid rgba(30,41,59,.5)',fontSize:10}}>
              <span style={{color:'#4b5563',fontSize:9,textTransform:'uppercase',letterSpacing:'.05em'}}>{k}</span>
              <span style={{color:'#9ca3af'}}>{String(v)}</span>
            </div>
          ))}

          {!cfg.configured && (
            <div style={{marginTop:12,padding:'10px 12px',background:'rgba(239,68,68,.07)',border:'1px solid rgba(239,68,68,.2)'}}>
              <div style={{fontSize:10,color:'#ef4444',fontWeight:700,marginBottom:6}}>⚠ Alert emails cannot send until RESEND_API_KEY is set</div>
              <div style={{fontSize:10,color:'#6b7280',lineHeight:1.8}}>
                Go to <a href="https://vercel.com/dejcav-cmd/downrangeco/settings/environment-variables" target="_blank" style={{color:'#C8922A'}}>Vercel → Settings → Env Vars</a> and add:<br/>
                <code style={{display:'block',background:'#0a0f14',padding:'8px 10px',marginTop:6,fontSize:10,lineHeight:2,color:'#e5e7eb'}}>
                  RESEND_API_KEY = re_…
                </code>
                Then redeploy.
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="sms-card-title">📋 Coverage</div>
          <div style={{fontSize:10,color:'#4b5563',marginBottom:10}}>Alerts trigger after 3 consecutive failures for critical feeds.</div>
          <div style={{display:'flex',flexDirection:'column',gap:3}}>
            {[
              {job:'news',      event:'3× consecutive failures', sev:'critical'},
              {job:'laws',      event:'3× consecutive failures', sev:'critical'},
              {job:'gun-deals', event:'3× consecutive failures', sev:'critical'},
              {job:'cron-health',event:'BROKEN / DEGRADED',     sev:'high'},
            ].map(({job,event,sev})=>{
              const c = {critical:'#ef4444',high:'#f59e0b',medium:'#3b82f6'}[sev]
              return (
                <div key={job} style={{display:'grid',gridTemplateColumns:'110px 1fr 70px',gap:8,alignItems:'center',
                  padding:'5px 8px',background:'#070b0f',border:'1px solid #111'}}>
                  <code style={{fontSize:9,color:'#C8922A'}}>{job}</code>
                  <span style={{fontSize:9,color:'#4b5563'}}>{event}</span>
                  <span style={{fontSize:8,fontWeight:700,letterSpacing:'.05em',textAlign:'right',color:c,textTransform:'uppercase'}}>{sev}</span>
                </div>
              )
            })}
          </div>
          <div style={{marginTop:14,fontSize:10,color:'#374151',lineHeight:1.8}}>
            Configure via Vercel env vars. No runtime overrides — settings are read-only here.
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:24,padding:'12px 0',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)'}}>
        <button className="sms-btn"
          style={{background:cfg.configured?'#0d1a0d':'#1a1a1a',color:cfg.configured?'#22c55e':'#4b5563',
            border:`1px solid ${cfg.configured?'rgba(34,197,94,.3)':'rgba(75,85,99,.2)'}`}}
          onClick={sendTest} disabled={testing||!cfg.configured}
          title={!cfg.configured?'RESEND_API_KEY not set':undefined}>
          {testing ? <span className="sms-spin" /> : '📧'} SEND TEST EMAIL
        </button>
        <a href="/api/admin/test-sms" target="_blank" rel="noopener noreferrer" className="sms-ghost">
          🔍 Diagnostic Page
        </a>
      </div>

      {/* Test result inline */}
      {testResult && (
        <div style={{marginBottom:16,padding:'10px 14px',background:'#070b0f',
          border:`1px solid ${testResult.sent?'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`}}>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:700,
            color:testResult.sent?'#22c55e':'#ef4444',letterSpacing:'.06em'}}>
            {testResult.sent?'✓ EMAIL SENT':'✕ EMAIL FAILED'}
          </span>
          {testResult.sent
            ? <span style={{fontSize:10,color:'#6b7280',marginLeft:12}}>
                Check <strong style={{color:'#e5e7eb'}}>dejcav@gmail.com</strong> for the test alert.
              </span>
            : <span style={{fontSize:10,color:'#ef4444',marginLeft:12}}>
                {testResult.error ?? testResult.reason ?? 'Unknown error'}
              </span>
          }
        </div>
      )}

      {/* ── Alert Execution Log ── */}
      <hr className="sms-divider" />
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:0,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'.08em',
            textTransform:'uppercase',color:'#9ca3af',marginBottom:2}}>
            📋 Alert Execution Log
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
            ? 'No alert events yet. Send a test email to verify configuration.'
            : `No ${tab==='all'?'':tab} events${logFilter?` matching "${logFilter}"`:''}. ${tab==='sent'?'No emails have been delivered yet.':''}`
          }
        </div>
      ) : (
        <div className="sms-log-wrap">
          <div className="sms-log-header">
            <span className="sms-log-col">Timestamp</span>
            <span className="sms-log-col">Status</span>
            <span className="sms-log-col">Job ID</span>
            <span className="sms-log-col">Message / Reason</span>
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

                        {l.resendId && <>
                          <span className="sms-log-detail-key">Resend ID</span>
                          <span className="sms-log-detail-val"><code style={{color:'#22c55e'}}>{l.resendId}</code></span>
                        </>}

                        {l.httpStatus && <>
                          <span className="sms-log-detail-key">HTTP Status</span>
                          <span className="sms-log-detail-val" style={{color:l.httpStatus>=400?'#ef4444':'#22c55e'}}>{l.httpStatus}</span>
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
        <span>Powered by Resend · Log stored in Upstash Redis · Max 200 events</span>
        <a href="/api/admin/test-sms" target="_blank" rel="noopener noreferrer" style={{color:'#C8922A'}}>/api/admin/test-sms →</a>
      </div>
    </div>
  )
}
