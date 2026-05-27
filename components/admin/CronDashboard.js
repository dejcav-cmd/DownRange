'use client'
import React, { useState, useEffect, useCallback } from 'react'

const S = `
.cd-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:6px 14px;cursor:pointer;transition:opacity .15s;white-space:nowrap}
.cd-btn:hover:not(:disabled){opacity:.85}.cd-btn:disabled{opacity:.4;cursor:not-allowed}
.cd-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s;white-space:nowrap}
.cd-ghost:hover{border-color:var(--gold);color:var(--gold)}
.cd-row{border-bottom:1px solid rgba(30,41,59,.5);transition:background .1s;cursor:pointer}
.cd-row:hover{background:rgba(200,146,42,.04)}
.cd-row.expanded{background:rgba(200,146,42,.05);border-bottom:none}
.cd-badge{display:inline-flex;align-items:center;gap:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 7px;text-transform:uppercase;border-radius:2px;white-space:nowrap}
.cd-group-hdr{padding:8px 20px;background:rgba(0,0,0,.4);border-bottom:1px solid var(--border)}
.cd-input{background:#0d1117;border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:5px 9px;outline:none;width:100%;box-sizing:border-box}
.cd-input:focus{border-color:var(--gold)}
.cd-toggle{position:relative;display:inline-block;width:32px;height:17px;flex-shrink:0}
.cd-toggle input{opacity:0;width:0;height:0}
.cd-slider{position:absolute;cursor:pointer;inset:0;background:#1f2937;transition:.2s;border-radius:17px}
.cd-slider:before{position:absolute;content:'';height:11px;width:11px;left:3px;bottom:3px;background:#4b5563;transition:.2s;border-radius:50%}
.cd-toggle input:checked+.cd-slider{background:rgba(200,146,42,.3)}
.cd-toggle input:checked+.cd-slider:before{transform:translateX(15px);background:#C8922A}
.cd-log-line{display:flex;gap:8px;align-items:flex-start;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;border-bottom:1px solid rgba(30,41,59,.3);transition:background .1s}
.cd-log-line:hover{background:rgba(200,146,42,.03)}
.cd-log-line.fail{background:rgba(239,68,68,.03)}
.cd-log-line.fail:hover{background:rgba(239,68,68,.06)}
@keyframes cd-pulse{0%,100%{opacity:1}50%{opacity:.3}}
.cd-live{animation:cd-pulse 2s ease-in-out infinite}
@keyframes cd-spin{to{transform:rotate(360deg)}}
.cd-spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(200,146,42,.3);border-top-color:var(--gold);border-radius:50%;animation:cd-spin .8s linear infinite;vertical-align:middle}
`

const STATUS = {
  success: { color:'#22c55e', icon:'✓', label:'OK'        },
  warning: { color:'#f59e0b', icon:'⚠', label:'WARNING'   },
  failed:  { color:'#ef4444', icon:'✕', label:'FAILED'    },
  running: { color:'#3b82f6', icon:'◉', label:'RUNNING'   },
  overdue: { color:'#f97316', icon:'⚠', label:'OVERDUE'   },
  never:   { color:'#6b7280', icon:'○', label:'NEVER RUN' },
}

const GROUP_C = { Content:'#3b82f6', System:'#22c55e', Outreach:'#C8922A' }

function fmtMs(ms) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms/1000).toFixed(1)}s`
}

function fmtAgo(iso) {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000)    return `${Math.round(diff/1000)}s ago`
  if (diff < 3600000)  return `${Math.round(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.round(diff/3600000)}h ago`
  return `${Math.round(diff/86400000)}d ago`
}

function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' })
}

function fmtIn(iso) {
  if (!iso) return '—'
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0)        return 'now'
  if (diff < 60000)    return `${Math.round(diff/1000)}s`
  if (diff < 3600000)  return `${Math.round(diff/60000)}m`
  if (diff < 86400000) return `${Math.round(diff/3600000)}h`
  return `${Math.round(diff/86400000)}d`
}

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.never
  return (
    <span className="cd-badge" style={{ background:`${s.color}18`, color:s.color, border:`1px solid ${s.color}44` }}>
      <span>{s.icon}</span> {s.label}
    </span>
  )
}

function HistoryBar({ history }) {
  const dots = Array.from({ length: 10 }, (_, i) => {
    const r = history[9 - i]
    if (!r) return { color:'#1f2937', title:'No data', status:'none' }
    const c = r.status==='success'?'#22c55e':r.status==='warning'?'#f59e0b':r.status==='failed'?'#ef4444':'#6b7280'
    return { color:c, title:`${r.status} · ${fmtAgo(r.at)} · ${fmtMs(r.ms)}${r.error?' · '+r.error.slice(0,60):''}`, status:r.status }
  })
  return (
    <div style={{ display:'flex', gap:2, alignItems:'center' }} title="Last 10 runs (left=oldest)">
      {dots.map((d,i) => (
        <div key={i} title={d.title} style={{ width:8, height:20, background:d.color, borderRadius:1, opacity:i===9?1:.55, cursor:'default', transition:'opacity .1s' }} />
      ))}
    </div>
  )
}

// ── Alert Config Panel for a single job ───────────────────────────────────────
function AlertConfigRow({ job, config, onSave, saving }) {
  const cfg = config[job.id] || {}
  const globalEmail = config._global?.alertEmail || 'dejcav@gmail.com'
  const [enabled, setEnabled]   = useState(cfg.alertEnabled !== false)
  const [email, setEmail]       = useState(cfg.alertEmail || '')
  const [dirty, setDirty]       = useState(false)

  const handleToggle = (v) => { setEnabled(v); setDirty(true) }
  const handleEmail  = (v) => { setEmail(v);   setDirty(true) }

  const save = () => {
    onSave(job.id, { alertEnabled: enabled, alertEmail: email.trim() || null })
    setDirty(false)
  }

  return (
    <tr style={{ borderBottom:'1px solid rgba(30,41,59,.4)' }}>
      <td style={{ padding:'10px 14px', verticalAlign:'middle' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>{job.icon}</span>
          <div>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1 }}>
              {job.label}
              {job.critical && <span style={{ marginLeft:5, fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#ef4444', border:'1px solid #ef444444', padding:'0 3px' }}>CRIT</span>}
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:1 }}>{job.schedule}</div>
          </div>
        </div>
      </td>
      <td style={{ padding:'10px 14px', verticalAlign:'middle' }}>
        <label className="cd-toggle" title={enabled ? 'Alerts ON — click to disable' : 'Alerts OFF — click to enable'}>
          <input type="checkbox" checked={enabled} onChange={e=>handleToggle(e.target.checked)} />
          <span className="cd-slider" />
        </label>
      </td>
      <td style={{ padding:'10px 14px', verticalAlign:'middle', width:'40%' }}>
        {enabled && (
          <input
            className="cd-input"
            placeholder={`default: ${globalEmail}`}
            value={email}
            onChange={e=>handleEmail(e.target.value)}
            style={{ maxWidth:260 }}
          />
        )}
        {!enabled && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#374151' }}>—</span>}
      </td>
      <td style={{ padding:'10px 14px', verticalAlign:'middle' }}>
        {dirty && (
          <button className="cd-btn" style={{ fontSize:10, padding:'4px 10px' }} onClick={save} disabled={saving===job.id}>
            {saving===job.id ? <span className="cd-spin" /> : 'Save'}
          </button>
        )}
        {!dirty && cfg.alertEnabled !== undefined && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#22c55e' }}>✓ saved</span>
        )}
      </td>
    </tr>
  )
}

// ── Full log viewer for a job ──────────────────────────────────────────────────
function LogViewer({ job, onClose }) {
  const [expanded, setExpanded] = useState(null)
  const history = job.history || []

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onClose}>
      <div style={{ background:'#0A0B0C', border:'1px solid var(--border)', borderTop:'3px solid var(--gold)', width:'100%', maxWidth:760, maxHeight:'85vh', display:'flex', flexDirection:'column' }}
        onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <span style={{ fontSize:18 }}>{job.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700, color:'var(--gold)', letterSpacing:'.04em' }}>{job.label}</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', marginTop:1 }}>{job.path} · {job.schedule}</div>
          </div>
          <StatusBadge status={job.status} />
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#4b5563', cursor:'pointer', fontSize:18, padding:'0 4px', marginLeft:4 }}>✕</button>
        </div>

        {/* Stats bar */}
        <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          {[
            ['Total Runs', history.length],
            ['Success', history.filter(r=>r.status==='success').length],
            ['Failed', history.filter(r=>r.status==='failed').length],
            ['Avg Duration', history.length ? fmtMs(Math.round(history.reduce((s,r)=>s+(r.ms||0),0)/history.length)) : '—'],
            ['Success Rate', job.successRate != null ? job.successRate+'%' : '—'],
            ['Streak', job.streak || 0],
          ].map(([label, val]) => (
            <div key={label} style={{ flex:1, padding:'10px 14px', borderRight:'1px solid var(--border)', textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', lineHeight:1 }}>{val}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#374151', marginTop:2, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Desc */}
        <div style={{ padding:'10px 20px', borderBottom:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', flexShrink:0 }}>
          {job.desc}
        </div>

        {/* Log lines */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {history.length === 0 && (
            <div style={{ padding:30, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#374151' }}>
              No runs logged yet.
            </div>
          )}
          {history.map((r, i) => {
            const isFail = r.status === 'failed'
            const isOpen = expanded === i
            return (
              <React.Fragment key={i}>
                <div className={`cd-log-line${isFail?' fail':''}`}
                  onClick={() => isFail && setExpanded(isOpen ? null : i)}
                  style={{ cursor: isFail ? 'pointer' : 'default' }}>
                  {/* Status icon */}
                  <span style={{ color: r.status==='success'?'#22c55e':r.status==='warning'?'#f59e0b':'#ef4444', width:12, flexShrink:0, paddingTop:1, fontSize:11 }}>
                    {r.status==='success'?'✓':r.status==='warning'?'⚠':'✕'}
                  </span>
                  {/* Index */}
                  <span style={{ color:'#1f2937', width:22, flexShrink:0, fontSize:9 }}>#{i+1}</span>
                  {/* Time */}
                  <span style={{ color:'#374151', flexShrink:0, minWidth:130, fontSize:10 }} title={new Date(r.at).toLocaleString()}>
                    {fmtTime(r.at)}
                  </span>
                  {/* Ago */}
                  <span style={{ color:'#1f2937', flexShrink:0, width:60, fontSize:9 }}>{fmtAgo(r.at)}</span>
                  {/* Duration */}
                  <span style={{ color:'#374151', flexShrink:0, width:44, fontSize:10 }}>{r.ms > 0 ? fmtMs(r.ms) : '—'}</span>
                  {/* Trigger */}
                  <span style={{ color:'#1f2937', flexShrink:0, width:32, fontSize:9 }}>{r.trigger==='manual'?'🖱':'⏰'}</span>
                  {/* Details / Error */}
                  {!r.error && r.details && (
                    <span style={{ color:'#374151', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:10 }}>{r.details}</span>
                  )}
                  {r.error && (
                    <span style={{ color:'#fca5a5', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace: isOpen?'normal':'nowrap', fontSize:10 }}>
                      {r.error}
                    </span>
                  )}
                  {isFail && <span style={{ color:'#374151', fontSize:9, flexShrink:0, marginLeft:4 }}>{isOpen ? '▲' : '▼'}</span>}
                </div>
                {/* Expanded error detail */}
                {isOpen && isFail && (
                  <div style={{ background:'rgba(239,68,68,.06)', border:'1px solid rgba(239,68,68,.15)', margin:'0 10px 4px', padding:'10px 14px' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', marginBottom:6 }}>FULL ERROR</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#fca5a5', lineHeight:1.7, wordBreak:'break-all', whiteSpace:'pre-wrap' }}>{r.error}</div>
                    {r.details && <>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', marginTop:10, marginBottom:4 }}>DETAILS</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.7 }}>{r.details}</div>
                    </>}
                    <div style={{ marginTop:12, padding:'8px 10px', background:'rgba(200,146,42,.06)', border:'1px solid rgba(200,146,42,.2)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af' }}>
                      <span style={{ color:'#C8922A', fontWeight:700 }}>📋 Paste to Claude: </span>
                      <span>Job: {job.id} · Error: {r.error} · When: {fmtTime(r.at)}{r.details ? ' · Details: '+r.details : ''}</span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Job row ───────────────────────────────────────────────────────────────────
function JobRow({ job, onTrigger, triggering, alertConfig, onOpenLog }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = alertConfig[job.id] || {}
  const alertOn = cfg.alertEnabled !== false

  return (
    <>
      <tr className={`cd-row${expanded?' expanded':''}`} onClick={() => setExpanded(e=>!e)}>
        {/* Icon + name */}
        <td style={{ padding:'11px 16px', verticalAlign:'middle' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <span style={{ fontSize:16 }}>{job.icon}</span>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text)', lineHeight:1 }}>
                {job.label}
                {job.critical && <span style={{ marginLeft:4, fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#ef4444', border:'1px solid #ef444444', padding:'0 3px' }}>CRIT</span>}
              </div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:2 }}>{job.path}</div>
            </div>
          </div>
        </td>
        {/* Status */}
        <td style={{ padding:'11px 12px', verticalAlign:'middle' }}>
          <StatusBadge status={job.status} />
        </td>
        {/* Last run */}
        <td style={{ padding:'11px 12px', verticalAlign:'middle' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: job.lastRun?.status==='failed'?'#ef4444':'var(--text-dim)' }}>
            {job.lastRun ? (
              <span title={fmtTime(job.lastRun.at)}>{fmtAgo(job.lastRun.at)}</span>
            ) : '—'}
          </div>
          {job.lastRun?.ms > 0 && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151' }}>{fmtMs(job.lastRun.ms)}</div>}
        </td>
        {/* Next run */}
        <td style={{ padding:'11px 12px', verticalAlign:'middle' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: job.isOverdue?'#f97316':'var(--text-dim)' }}>
            {job.isOverdue ? '⚠ OVERDUE' : (job.nextRun ? `in ${fmtIn(job.nextRun)}` : '—')}
          </div>
        </td>
        {/* History */}
        <td style={{ padding:'11px 12px', verticalAlign:'middle' }}>
          <HistoryBar history={job.history || []} />
        </td>
        {/* Rate */}
        <td style={{ padding:'11px 12px', verticalAlign:'middle' }}>
          {job.successRate != null && (
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: job.successRate===100?'#22c55e':job.successRate>=70?'#f59e0b':'#ef4444' }}>
              {job.successRate}%
            </span>
          )}
          {job.streak > 0 && (
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:1 }}>🔥{job.streak}</div>
          )}
        </td>
        {/* Alert indicator */}
        <td style={{ padding:'11px 12px', verticalAlign:'middle' }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color: alertOn?'#22c55e':'#374151' }}>
            {alertOn ? '🔔' : '🔕'}
          </span>
        </td>
        {/* Actions */}
        <td style={{ padding:'11px 12px', verticalAlign:'middle' }} onClick={e=>e.stopPropagation()}>
          <div style={{ display:'flex', gap:5 }}>
            <button className="cd-ghost" style={{ fontSize:9, padding:'3px 7px' }}
              onClick={()=>onOpenLog(job)}>
              📋 Logs
            </button>
            <button className="cd-btn" style={{ fontSize:9, padding:'4px 9px' }}
              onClick={()=>onTrigger(job.id)} disabled={triggering===job.id}>
              {triggering===job.id ? <span className="cd-spin" /> : '▶'}
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded inline summary */}
      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding:0 }}>
            <div style={{ background:'rgba(0,0,0,.25)', borderBottom:'1px solid var(--border)', padding:'12px 20px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', letterSpacing:'.1em', marginBottom:4 }}>DESCRIPTION</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', lineHeight:1.7 }}>{job.desc}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', letterSpacing:'.1em', marginBottom:4 }}>SCHEDULE</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)' }}>{job.scheduleLabel}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:2 }}>{job.schedule}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#C8922A', marginTop:4 }}>
                  Next: {job.nextRun ? fmtIn(job.nextRun) : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', letterSpacing:'.1em', marginBottom:4 }}>LAST RUN</div>
                {job.lastRun ? (
                  <>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: job.lastRun.status==='failed'?'#f87171':'#22c55e' }}>
                      {job.lastRun.status.toUpperCase()} · {fmtMs(job.lastRun.ms)}
                    </div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:2 }}>{fmtTime(job.lastRun.at)}</div>
                    {job.lastRun.error && (
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#fca5a5', marginTop:4, lineHeight:1.5 }}>{job.lastRun.error.slice(0,120)}</div>
                    )}
                    {job.lastRun.details && !job.lastRun.error && (
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:4 }}>{job.lastRun.details.slice(0,100)}</div>
                    )}
                  </>
                ) : <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#374151' }}>Never run</div>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Failure row (extracted to satisfy hooks rules) ────────────────────────────
function FailureRow({ r, allJobs, setLogJob }) {
  const [open, setOpen] = useState(false)
  const debugStr = `Job: ${r.jobId}\nError: ${r.error}\nWhen: ${fmtTime(r.at)}\nDuration: ${fmtMs(r.ms)}${r.details?'\nDetails: '+r.details:''}`
  const copyDebug = () => {
    try { navigator.clipboard.writeText(debugStr) } catch {
      const el = document.createElement('textarea'); el.value = debugStr
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
  }
  return (
    <div>
      <div className="cd-log-line fail" onClick={()=>setOpen(o=>!o)} style={{ cursor:'pointer', padding:'8px 14px' }}>
        <span style={{ color:'#ef4444', fontSize:11, flexShrink:0 }}>✕</span>
        <span style={{ fontSize:13, flexShrink:0 }}>{r.icon}</span>
        <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'#f87171', flexShrink:0, minWidth:160 }}>{r.jobLabel}</span>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', flexShrink:0, minWidth:120 }}>{fmtTime(r.at)}</span>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', flexShrink:0, width:44 }}>{fmtMs(r.ms)}</span>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#fca5a5', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace: open?'normal':'nowrap' }}>
          {r.error}
        </span>
        <span style={{ color:'#374151', fontSize:9, flexShrink:0 }}>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <div style={{ background:'rgba(239,68,68,.05)', borderTop:'1px solid rgba(239,68,68,.1)', padding:'12px 14px 14px 42px' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#fca5a5', lineHeight:1.7, wordBreak:'break-all', whiteSpace:'pre-wrap', marginBottom:10 }}>
            {r.error}
          </div>
          {r.details && (
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', marginBottom:10 }}>
              <span style={{ color:'#374151' }}>Details: </span>{r.details}
            </div>
          )}
          <div style={{ padding:'8px 10px', background:'rgba(200,146,42,.06)', border:'1px solid rgba(200,146,42,.2)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', marginBottom:8 }}>
            <div style={{ color:'#C8922A', fontWeight:700, marginBottom:4 }}>📋 Paste to Claude:</div>
            <pre style={{ margin:0, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', whiteSpace:'pre-wrap', wordBreak:'break-all' }}>{debugStr}</pre>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="cd-ghost" style={{ fontSize:9, padding:'3px 8px' }} onClick={copyDebug}>
              📋 Copy
            </button>
            <button className="cd-ghost" style={{ fontSize:9, padding:'3px 8px' }}
              onClick={()=>{ const j = allJobs.find(jj=>jj.id===r.jobId); if(j) setLogJob(j) }}>
              View full log
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CronDashboard({ adminKey }) {
  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [triggering, setTrigger]      = useState(null)
  const [trigResult, setTrigResult]   = useState(null)
  const [autoRefresh, setAuto]        = useState(true)
  const [lastRefresh, setLastRef]     = useState(null)
  const [filterGroup, setGroup]       = useState('All')
  const [tab, setTab]                 = useState('jobs')      // jobs | alerts | settings
  const [logJob, setLogJob]           = useState(null)
  const [alertConfig, setAlertConfig] = useState({})
  const [savingAlert, setSavingAlert] = useState(null)
  const [globalEmail, setGlobalEmail] = useState('')
  const [globalDirty, setGlobalDirty] = useState(false)
  const [saved, setSaved]             = useState(false)

  const h = { 'x-admin-key': adminKey || '' }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [statusRes, cfgRes] = await Promise.all([
        fetch('/api/admin/cron-status', { headers: h }),
        fetch('/api/admin/alert-config', { headers: h }),
      ])
      const d   = await statusRes.json()
      if (d.ok) { setData(d); setLastRef(new Date()) }
      if (cfgRes.ok) {
        const c = await cfgRes.json()
        if (c.ok) {
          setAlertConfig(c.config || {})
          setGlobalEmail(c.config?._global?.alertEmail || '')
        }
      }
    } catch {}
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(() => load(true), 15000)
    return () => clearInterval(t)
  }, [autoRefresh, load])

  const trigger = async (jobId) => {
    setTrigger(jobId); setTrigResult(null)
    try {
      const res = await fetch('/api/admin/cron-status?trigger=true', {
        method:'POST', headers:{ ...h, 'Content-Type':'application/json' },
        body: JSON.stringify({ jobId }),
      })
      const d = await res.json()
      setTrigResult({ jobId, ok:d.ok, ms:d.ms, error:d.error, response:d.response })
      load(true)
    } catch (e) { setTrigResult({ jobId, ok:false, error:e.message }) }
    setTrigger(null)
  }

  const saveJobAlert = async (jobId, cfg) => {
    setSavingAlert(jobId)
    const newCfg = { ...alertConfig, [jobId]: { ...(alertConfig[jobId]||{}), ...cfg } }
    try {
      await fetch('/api/admin/alert-config', {
        method:'POST', headers:{ ...h, 'Content-Type':'application/json' },
        body: JSON.stringify({ config: newCfg }),
      })
      setAlertConfig(newCfg)
    } catch {}
    setSavingAlert(null)
  }

  const saveGlobalEmail = async () => {
    const newCfg = { ...alertConfig, _global: { alertEmail: globalEmail.trim() } }
    try {
      await fetch('/api/admin/alert-config', {
        method:'POST', headers:{ ...h, 'Content-Type':'application/json' },
        body: JSON.stringify({ config: newCfg }),
      })
      setAlertConfig(newCfg)
      setGlobalDirty(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
  }

  const groups   = ['All', 'Content', 'System', 'Outreach']
  const allJobs  = data?.jobs || []
  const jobs     = allJobs.filter(j => filterGroup==='All' || j.group===filterGroup)
  const failingJobs = allJobs.filter(j => j.status==='failed' || j.status==='overdue')
  const sum      = data?.summary || {}

  // All failure entries across all jobs for the failures log
  const recentFailures = allJobs
    .flatMap(j => (j.history||[]).filter(r=>r.status==='failed').map(r=>({ ...r, jobId:j.id, jobLabel:j.label, icon:j.icon })))
    .sort((a,b) => new Date(b.at) - new Date(a.at))
    .slice(0, 20)

  return (
    <div style={{ maxWidth:1200 }}>
      <style>{S}</style>
      {logJob && <LogViewer job={logJob} onClose={()=>setLogJob(null)} />}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.9rem', letterSpacing:'.06em', color:'var(--gold)', margin:0, lineHeight:1 }}>
            ⚙ CRON MISSION CONTROL
          </h1>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', margin:'4px 0 0' }}>
            {allJobs.length} jobs · auto-refresh 15s
            {lastRefresh && <span style={{ marginLeft:8, color:'#374151' }}>updated {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <label style={{ display:'flex', alignItems:'center', gap:5, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', cursor:'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e=>setAuto(e.target.checked)} />
            Auto-refresh
          </label>
          <button className="cd-ghost" onClick={()=>load()}>↻ Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:16 }}>
        {[
          ['jobs', '⏱ Jobs', allJobs.length],
          ['failures', `🔴 Failures`, failingJobs.length],
          ['alerts', '🔔 Alert Config', null],
          ['settings', '⚙ Settings', null],
        ].map(([id, label, count]) => (
          <button key={id} onClick={()=>setTab(id)}
            style={{ background:'none', border:'none', borderBottom:`2px solid ${tab===id?'var(--gold)':'transparent'}`,
              fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:'.05em',
              textTransform:'uppercase', padding:'8px 18px', cursor:'pointer',
              color:tab===id?'var(--gold)':'var(--text-dim)', transition:'all .15s', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
            {label}
            {count != null && count > 0 && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                background: id==='failures' ? 'rgba(239,68,68,.15)' : 'rgba(200,146,42,.15)',
                color: id==='failures' ? '#ef4444' : '#C8922A',
                border: `1px solid ${id==='failures'?'rgba(239,68,68,.3)':'rgba(200,146,42,.3)'}`,
                padding:'0 5px', borderRadius:2 }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Trigger result toast */}
      {trigResult && (
        <div style={{ marginBottom:14, padding:'10px 16px', background:trigResult.ok?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)', border:`1px solid ${trigResult.ok?'#22c55e':'#ef4444'}`, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ color:trigResult.ok?'#22c55e':'#ef4444', fontWeight:700 }}>
            {trigResult.ok ? '✓ RUN COMPLETE' : '✕ RUN FAILED'}
          </span>
          <span style={{ color:'#64748b' }}>{trigResult.jobId}</span>
          {trigResult.ms > 0 && <span style={{ color:'#475569' }}>{fmtMs(trigResult.ms)}</span>}
          {trigResult.error && <span style={{ color:'#f87171', flex:1 }}>{trigResult.error}</span>}
          {trigResult.response && <span style={{ color:'#374151', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{trigResult.response}</span>}
          <button onClick={()=>setTrigResult(null)} style={{ background:'none',border:'none',color:'#475569',cursor:'pointer',marginLeft:'auto' }}>✕</button>
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#64748b' }}>Loading cron status...</div>
      ) : (
        <>
          {/* ══════════ JOBS TAB ══════════ */}
          {tab === 'jobs' && (
            <>
              {/* Summary stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:8, marginBottom:14 }}>
                {[
                  ['Total',        sum.total,       '#C8922A'],
                  ['Healthy',      sum.healthy,     '#22c55e'],
                  ['Failing',      sum.failing,     '#ef4444'],
                  ['Never Run',    sum.never,       '#6b7280'],
                  ['Crit Failing', sum.critFailing, '#ef4444'],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background:'var(--bg2)', border:`1px solid ${v&&l!=='Never Run'&&l!=='Total'&&v>0?c+'44':'var(--border)'}`, padding:'12px 14px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color: v>0&&l==='Failing'?c:v>0&&l==='Crit Failing'?c:c, lineHeight:1 }}>{v ?? '—'}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#374151', marginTop:2, textTransform:'uppercase', letterSpacing:'.06em' }}>{l}</div>
                  </div>
                ))}
                {data?.env && (
                  <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'12px 14px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color: Object.values(data.env).every(Boolean)?'#22c55e':'#f97316', lineHeight:1 }}>
                      {Object.values(data.env).filter(Boolean).length}/{Object.keys(data.env).length}
                    </div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#374151', marginTop:2, textTransform:'uppercase', letterSpacing:'.06em' }}>ENV VARS</div>
                  </div>
                )}
              </div>

              {/* Active failures banner */}
              {failingJobs.length > 0 && (
                <div style={{ marginBottom:12, border:'1px solid rgba(239,68,68,.35)', background:'rgba(239,68,68,.04)', padding:'10px 16px', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:'#ef4444', flexShrink:0 }}>
                    🔴 {failingJobs.length} JOB{failingJobs.length>1?'S':''} FAILING
                  </span>
                  {failingJobs.map(j => (
                    <span key={j.id} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#f87171', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', padding:'2px 8px', cursor:'pointer' }}
                      onClick={()=>setLogJob(j)}>
                      {j.icon} {j.label} {j.lastRun?.error ? '· '+j.lastRun.error.slice(0,40) : ''}
                    </span>
                  ))}
                  <button className="cd-ghost" style={{ fontSize:9, padding:'2px 8px', marginLeft:'auto' }} onClick={()=>setTab('failures')}>
                    View all failures →
                  </button>
                </div>
              )}

              {/* Group filter */}
              <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:0 }}>
                {groups.map(g => (
                  <button key={g} onClick={()=>setGroup(g)}
                    style={{ background:'none', border:'none', borderBottom:`2px solid ${filterGroup===g?'var(--gold)':'transparent'}`,
                      fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'.05em',
                      textTransform:'uppercase', padding:'7px 14px', cursor:'pointer',
                      color:filterGroup===g?'var(--gold)':'var(--text-dim)', transition:'all .15s', whiteSpace:'nowrap' }}>
                    {g}
                    {g !== 'All' && <span style={{ marginLeft:4, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151' }}>
                      {allJobs.filter(j=>j.group===g).length}
                    </span>}
                  </button>
                ))}
              </div>

              {/* Jobs table */}
              <div style={{ overflowX:'auto', border:'1px solid var(--border)', borderTop:'none' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:780 }}>
                  <thead>
                    <tr style={{ background:'rgba(0,0,0,.4)' }}>
                      {['Job','Status','Last Run','Next Run','History','Rate','🔔',''].map(h => (
                        <th key={h} style={{ padding:'7px 12px', textAlign:'left', fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#374151', letterSpacing:'.1em', textTransform:'uppercase', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filterGroup === 'All'
                      ? ['Content','System','Outreach'].map(group => {
                          const gJobs = jobs.filter(j=>j.group===group)
                          if (!gJobs.length) return null
                          return (
                            <React.Fragment key={group}>
                              <tr>
                                <td colSpan={8} className="cd-group-hdr">
                                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:GROUP_C[group]||'#C8922A', letterSpacing:'.12em', textTransform:'uppercase' }}>
                                    ▸ {group} ({gJobs.length})
                                  </span>
                                </td>
                              </tr>
                              {gJobs.map(job => (
                                <JobRow key={job.id} job={job} onTrigger={trigger} triggering={triggering}
                                  alertConfig={alertConfig} onOpenLog={setLogJob} />
                              ))}
                            </React.Fragment>
                          )
                        })
                      : jobs.map(job => (
                          <JobRow key={job.id} job={job} onTrigger={trigger} triggering={triggering}
                            alertConfig={alertConfig} onOpenLog={setLogJob} />
                        ))
                    }
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div style={{ marginTop:10, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#1f2937', letterSpacing:'.06em' }}>LEGEND:</span>
                {Object.entries(STATUS).map(([k,v]) => (
                  <span key={k} style={{ display:'flex', alignItems:'center', gap:3, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:v.color }}>
                    {v.icon} {v.label}
                  </span>
                ))}
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#1f2937' }}>History = last 10 (oldest→newest). Click 📋 Logs for full history.</span>
              </div>
            </>
          )}

          {/* ══════════ FAILURES TAB ══════════ */}
          {tab === 'failures' && (
            <>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', marginBottom:12 }}>
                Last 20 failures across all jobs · click a row to expand error detail
              </div>

              {recentFailures.length === 0 ? (
                <div style={{ padding:40, textAlign:'center', border:'1px solid var(--border)', background:'var(--bg2)' }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'#22c55e', marginBottom:4 }}>✓</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#22c55e' }}>No failures in recent history</div>
                </div>
              ) : (
                <div style={{ border:'1px solid var(--border)' }}>
                  {recentFailures.map((r, i) => (
                    <FailureRow key={i} r={r} allJobs={allJobs} setLogJob={setLogJob} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══════════ ALERT CONFIG TAB ══════════ */}
          {tab === 'alerts' && (
            <>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', marginBottom:14 }}>
                Configure per-job alert email addresses. Toggle alerts on/off per job. Leave email blank to use the global default.
              </div>

              {/* Global email setting */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'16px 20px', marginBottom:16 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', marginBottom:8 }}>
                  GLOBAL ALERT EMAIL — used when no per-job override is set
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center', maxWidth:420 }}>
                  <input className="cd-input" placeholder="dejcav@gmail.com" value={globalEmail}
                    onChange={e=>{setGlobalEmail(e.target.value);setGlobalDirty(true)}} />
                  <button className="cd-btn" style={{ fontSize:10, padding:'5px 14px', flexShrink:0 }}
                    onClick={saveGlobalEmail} disabled={!globalDirty}>
                    Save
                  </button>
                  {saved && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#22c55e' }}>✓ saved</span>}
                </div>
              </div>

              {/* Per-job table */}
              <div style={{ border:'1px solid var(--border)', overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:580 }}>
                  <thead>
                    <tr style={{ background:'rgba(0,0,0,.4)' }}>
                      {['Job','Alerts','Alert Email (leave blank for global)',''].map(h => (
                        <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#374151', letterSpacing:'.1em', textTransform:'uppercase', borderBottom:'1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allJobs.map(job => (
                      <AlertConfigRow key={job.id} job={job} config={alertConfig}
                        onSave={saveJobAlert} saving={savingAlert} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', lineHeight:1.8 }}>
                Alerts fire on first failure per job. Suppressed for 2h after first alert to avoid spam. Resets on recovery.
                Email format: includes error message, last 5 run history, troubleshooting checklist, and a paste-to-Claude debug block.
              </div>
            </>
          )}

          {/* ══════════ SETTINGS TAB ══════════ */}
          {tab === 'settings' && (
            <>
              {/* Env var health */}
              {data?.env && (
                <div style={{ border:'1px solid var(--border)', marginBottom:16 }}>
                  <div style={{ padding:'8px 16px', borderBottom:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase', fontWeight:700 }}>
                    Environment Variables
                  </div>
                  {Object.entries(data.env).map(([k, set]) => (
                    <div key={k} style={{ padding:'8px 16px', borderBottom:'1px solid rgba(30,41,59,.3)', display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ color: set?'#22c55e':'#ef4444', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, flexShrink:0 }}>
                        {set ? '✓' : '✕'}
                      </span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color: set?'var(--text)':'#f87171', flex:1 }}>{k}</span>
                      {!set && (
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#ef4444', background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.2)', padding:'2px 8px' }}>
                          NOT SET
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Vercel link */}
              <div style={{ padding:'14px 16px', background:'var(--bg2)', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', display:'flex', alignItems:'center', gap:12 }}>
                <span>To set missing env vars:</span>
                <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer"
                  style={{ color:'var(--gold)', textDecoration:'none', fontWeight:700 }}>
                  Vercel Dashboard → Project → Settings → Environment Variables →
                </a>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
