'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

const S = `
.cd-wrap{font-family:'IBM Plex Mono',monospace}
.cd-topbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.cd-stat{background:var(--bg2);border:1px solid var(--border);padding:10px 18px;min-width:80px;text-align:center}
.cd-stat-val{font-family:'Bebas Neue',cursive;font-size:1.8rem;line-height:1}
.cd-stat-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;margin-top:3px}
.cd-table{width:100%;border-collapse:collapse}
.cd-th{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#4b5563;padding:8px 12px;border-bottom:1px solid var(--border);text-align:left;white-space:nowrap}
.cd-row{border-bottom:1px solid rgba(30,41,59,.5);cursor:pointer;transition:background .1s}
.cd-row:hover{background:rgba(200,146,42,.04)}
.cd-row.open{background:rgba(200,146,42,.06);border-bottom:none}
.cd-td{padding:10px 12px;vertical-align:middle;font-size:11px}
.cd-badge{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 7px;text-transform:uppercase;border-radius:2px;white-space:nowrap}
.cd-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;padding:5px 12px;cursor:pointer;white-space:nowrap;transition:opacity .15s}
.cd-btn:hover:not(:disabled){opacity:.85}
.cd-btn:disabled{opacity:.4;cursor:not-allowed}
.cd-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:4px 10px;cursor:pointer;transition:all .15s}
.cd-ghost:hover{border-color:var(--gold);color:var(--gold)}
.cd-log{background:#070b0f;border:1px solid #1f2937;padding:0;max-height:320px;overflow-y:auto}
.cd-log-row{display:grid;grid-template-columns:140px 70px 60px 1fr;gap:0;border-bottom:1px solid #0d1117;padding:5px 12px;font-size:10px;transition:background .1s;align-items:center}
.cd-log-row:hover{background:#0d1117}
.cd-log-row.fail{background:rgba(239,68,68,.04)}
.cd-log-row.fail:hover{background:rgba(239,68,68,.08)}
.cd-bar-wrap{display:flex;gap:2px;align-items:center}
.cd-bar{width:10px;border-radius:1px;transition:height .2s}
@keyframes cd-pulse{0%,100%{opacity:1}50%{opacity:.3}}
.cd-live{animation:cd-pulse 2s ease-in-out infinite}
@keyframes cd-spin{to{transform:rotate(360deg)}}
.cd-spin{display:inline-block;width:10px;height:10px;border:2px solid rgba(200,146,42,.3);border-top-color:var(--gold);border-radius:50%;animation:cd-spin .8s linear infinite;vertical-align:middle;margin-right:4px}
.cd-group-hdr{padding:6px 12px;background:rgba(0,0,0,.5);border-bottom:1px solid var(--border);font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:8px}
.cd-detail{background:#070b0f;border-bottom:2px solid rgba(200,146,42,.15)}
.cd-tail{background:#050809;border:1px solid #1a2030;padding:12px;font-size:10px;line-height:1.8;max-height:200px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;color:#94a3b8}
.cd-empty{padding:60px;text-align:center;color:#374151;font-size:12px}
`

const ST = {
  success: { color:'#22c55e', bg:'rgba(34,197,94,.12)',  icon:'✓', label:'OK'        },
  warning: { color:'#f59e0b', bg:'rgba(245,158,11,.12)', icon:'⚠', label:'WARNING'   },
  failed:  { color:'#ef4444', bg:'rgba(239,68,68,.12)',  icon:'✕', label:'FAILED'    },
  running: { color:'#3b82f6', bg:'rgba(59,130,246,.12)', icon:'◉', label:'RUNNING'   },
  overdue: { color:'#f97316', bg:'rgba(249,115,22,.12)', icon:'⚠', label:'OVERDUE'   },
  never:   { color:'#6b7280', bg:'rgba(107,114,128,.1)', icon:'○', label:'NEVER RUN' },
}

const GC = { Content:'#3b82f6', System:'#22c55e', Outreach:'#C8922A' }

function fmtMs(ms) {
  if (!ms && ms !== 0) return '—'
  if (ms < 1000)  return `${ms}ms`
  if (ms < 60000) return `${(ms/1000).toFixed(1)}s`
  return `${(ms/60000).toFixed(1)}m`
}
function fmtAge(iso) {
  if (!iso) return 'never'
  const m = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m/60)}h ago`
  return `${Math.floor(m/1440)}d ago`
}
function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })
}

function StatusBadge({ status }) {
  const s = ST[status] || ST.never
  return (
    <span className="cd-badge" style={{ background:s.bg, color:s.color, border:`1px solid ${s.color}33` }}>
      {s.icon} {s.label}
    </span>
  )
}

function HistoryBars({ history, max=15 }) {
  const bars = history.slice(0, max)
  return (
    <div className="cd-bar-wrap">
      {bars.map((r, i) => {
        const c = r.status === 'success' ? '#22c55e' : r.status === 'failed' ? '#ef4444' : '#f59e0b'
        const h = Math.max(6, Math.min(22, r.ms ? Math.log10(r.ms + 1) * 8 : 8))
        return <div key={i} className="cd-bar" style={{ height:h, background:c, opacity: 0.7 + (i/max)*0.3 }} title={`${r.status} · ${fmtMs(r.ms)} · ${fmtTime(r.at)}`} />
      })}
      {bars.length === 0 && <span style={{color:'#374151',fontSize:9}}>no runs yet</span>}
    </div>
  )
}

function parseCountChips(details = '') {
  // Parse patterns like "8 published", "5 rewrote", "3 skipped", "0 failed"
  const chips = []
  const patterns = [
    { re: /(\d+)\s+published/i,      label: 'published', color: '#22c55e' },
    { re: /(\d+)\s+(?:AI-rewritten|ai.rewritten)/i, label: 'AI rewritten', color: '#a78bfa' },
    { re: /(\d+)\s+rewrote/i,        label: 'rewrote',   color: '#a78bfa' },
    { re: /(\d+)\s+(?:of\s+)?\d*\s*fetched/i, label: 'fetched',  color: '#60a5fa' },
    { re: /(\d+)\s+saved/i,          label: 'saved',     color: '#22c55e' },
    { re: /(\d+)\s+(?:already\s+)?ok/i, label: 'ok',     color: '#22c55e' },
    { re: /(\d+)\s+skipped/i,        label: 'skipped',   color: '#6b7280' },
    { re: /(\d+)\s+(?:OG|og)\s*(?:fetched|images?)/i, label: 'OG imgs', color: '#60a5fa' },
    { re: /(\d+)\s+(?:photo\s*)?fallback/i, label: 'fallback', color: '#f59e0b' },
    { re: /(\d+)\s+failed/i,         label: 'failed',    color: '#ef4444' },
    { re: /(\d+)\s+dupes?\s+skipped/i, label: 'dupes',   color: '#374151' },
    { re: /(\d+)\s+(?:raw|unprocessed)/i, label: 'raw',  color: '#4b5563' },
  ]
  for (const { re, label, color } of patterns) {
    const m = details.match(re)
    if (m) {
      const n = parseInt(m[1])
      if (n > 0 || label === 'failed') chips.push({ n, label, color })
    }
  }
  return chips
}

function LogRow({ run }) {
  const s    = ST[run.status] || ST.never
  const ts   = fmtTime(run.at)
  const chips = parseCountChips(run.details || '')
  return (
    <div className={`cd-log-row${run.status==='failed'?' fail':''}`}>
      <span style={{ color:'#64748b', flexShrink:0 }}>{ts}</span>
      <span className="cd-badge" style={{ background:s.bg, color:s.color, fontSize:9, flexShrink:0 }}>{s.icon} {run.status}</span>
      <span style={{ color:'#94a3b8', flexShrink:0 }}>{fmtMs(run.ms)}</span>
      <span style={{ color: run.error ? '#f87171' : '#64748b', overflow:'hidden', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
        {run.trigger === 'manual' && <span style={{color:'#C8922A',fontSize:9,border:'1px solid rgba(200,146,42,.3)',padding:'0 4px',flexShrink:0}}>[MANUAL]</span>}
        {run.error ? (
          <span style={{color:'#f87171'}}>✕ {run.error.slice(0,120)}</span>
        ) : chips.length > 0 ? (
          <>
            {chips.map((c, i) => (
              <span key={i} style={{
                fontSize:9, fontWeight:700, padding:'1px 6px',
                background:`${c.color}18`, color:c.color,
                border:`1px solid ${c.color}44`, borderRadius:2, flexShrink:0,
              }}>{c.n} {c.label}</span>
            ))}
            {/* Show remainder of details not captured in chips */}
            {run.details && !chips.length && (
              <span style={{color:'#4b5563',fontSize:10}}>{run.details}</span>
            )}
          </>
        ) : (
          <span style={{color:'#4b5563',fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {(run.details || '').slice(0, 120)}
          </span>
        )}
      </span>
    </div>
  )
}

export default function CronDashboard({ adminKey }) {
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [openJob,     setOpenJob]     = useState(null)
  const [triggering,  setTriggering]  = useState({})
  const [trigResults, setTrigResults] = useState({})
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [filterGroup, setFilterGroup] = useState('All')
  const [filterStatus,setFilterStatus]= useState('All')
  const [lastFetched, setLastFetched] = useState(null)
  const H = { 'x-admin-key': adminKey, 'Content-Type':'application/json' }

  const load = useCallback(async (silent=false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/cron-status', { headers: H })
      const d   = await res.json()
      if (d.ok) { setData(d); setLastFetched(new Date()) }
    } catch {}
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(() => load(true), 10000)  // 10s refresh
    return () => clearInterval(t)
  }, [autoRefresh, load])

  const trigger = async (jobId) => {
    setTriggering(t => ({...t, [jobId]: true}))
    setTrigResults(r => ({...r, [jobId]: null}))
    try {
      const res = await fetch('/api/admin/cron-status?trigger=true', {
        method: 'POST', headers: H, body: JSON.stringify({ jobId })
      })
      const d = await res.json()
      setTrigResults(r => ({...r, [jobId]: d}))
      setTimeout(() => load(true), 2000)
    } catch (e) {
      setTrigResults(r => ({...r, [jobId]: { ok:false, error:e.message }}))
    }
    setTriggering(t => ({...t, [jobId]: false}))
  }

  if (loading && !data) return (
    <div className="cd-empty"><div className="cd-spin" />Loading cron data...</div>
  )

  const jobs     = data?.jobs || []
  const groups   = ['Content', 'System', 'Outreach']
  const failing  = jobs.filter(j => j.status === 'failed' || j.status === 'overdue')
  const running  = jobs.filter(j => j.status === 'running')
  const healthy  = jobs.filter(j => j.status === 'success')
  const neverRun = jobs.filter(j => j.status === 'never')

  const filtered = jobs.filter(j => {
    if (filterGroup  !== 'All' && j.group  !== filterGroup)  return false
    if (filterStatus !== 'All' && j.status !== filterStatus) return false
    return true
  })

  return (
    <div className="cd-wrap">
      <style>{S}</style>

      {/* ── Top bar ── */}
      <div className="cd-topbar">
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--gold)',letterSpacing:'.05em',lineHeight:1}}>
            🛰 CRON MISSION CONTROL
          </div>
          <div style={{fontSize:10,color:'#4b5563',marginTop:3}}>
            {jobs.length} jobs · {lastFetched ? `refreshed ${fmtAge(lastFetched.toISOString())}` : ''} ·{' '}
            <span className={autoRefresh ? 'cd-live' : ''} style={{color: autoRefresh ? '#22c55e' : '#6b7280'}}>
              {autoRefresh ? '● LIVE' : '○ paused'}
            </span>
          </div>
        </div>

        {/* Stats */}
        {[
          { val:failing.length,  label:'FAILING',   color: failing.length  ? '#ef4444' : '#22c55e' },
          { val:running.length,  label:'RUNNING',   color: running.length  ? '#3b82f6' : '#4b5563' },
          { val:healthy.length,  label:'HEALTHY',   color: '#22c55e' },
          { val:neverRun.length, label:'NEVER RUN', color: neverRun.length ? '#f59e0b' : '#4b5563' },
        ].map(s => (
          <div key={s.label} className="cd-stat">
            <div className="cd-stat-val" style={{color:s.color}}>{s.val}</div>
            <div className="cd-stat-lbl">{s.label}</div>
          </div>
        ))}

        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <button className="cd-ghost" onClick={()=>load()} disabled={loading}>
            {loading ? <><span className="cd-spin"/>Refreshing</> : '↺ Refresh'}
          </button>
          <button className="cd-ghost"
            onClick={()=>setAutoRefresh(a=>!a)}
            style={{color: autoRefresh?'#22c55e':'#6b7280', borderColor: autoRefresh?'#22c55e':'var(--border)'}}>
            {autoRefresh ? '⏸ Pause' : '▶ Auto'}
          </button>
        </div>
      </div>

      {/* ── Failing banner ── */}
      {failing.length > 0 && (
        <div style={{marginBottom:16,padding:'12px 16px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.3)',display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{color:'#ef4444',fontWeight:700,fontSize:11}}>🚨 {failing.length} job{failing.length>1?'s':''} need attention</span>
          {failing.map(j => (
            <span key={j.id} style={{fontSize:10,color:'#f87171',background:'rgba(239,68,68,.12)',padding:'2px 8px',border:'1px solid rgba(239,68,68,.3)'}}>
              {j.icon} {j.label}
            </span>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16,alignItems:'center'}}>
        <span style={{fontSize:10,color:'#6b7280'}}>Group:</span>
        {['All',...groups].map(g => (
          <button key={g} className="cd-ghost"
            onClick={()=>setFilterGroup(g)}
            style={{
              color: filterGroup===g ? '#000' : (GC[g]||'#6b7280'),
              background: filterGroup===g ? (GC[g]||'var(--gold)') : 'transparent',
              borderColor: GC[g]||'var(--border)',
              fontSize:10,
            }}>
            {g}
            {g !== 'All' && <span style={{opacity:.6,marginLeft:4}}>{jobs.filter(j=>j.group===g).length}</span>}
          </button>
        ))}
        <span style={{fontSize:10,color:'#6b7280',marginLeft:8}}>Status:</span>
        {['All','failed','overdue','success','never'].map(s => (
          <button key={s} className="cd-ghost"
            onClick={()=>setFilterStatus(s)}
            style={{
              color: filterStatus===s ? '#000' : (ST[s]?.color||'#6b7280'),
              background: filterStatus===s ? (ST[s]?.color||'var(--gold)') : 'transparent',
              fontSize:10,
            }}>
            {s}
          </button>
        ))}
        <span style={{marginLeft:'auto',fontSize:10,color:'#4b5563'}}>{filtered.length} jobs shown</span>
      </div>

      {/* ── Job table ── */}
      {groups.filter(g => filterGroup === 'All' || filterGroup === g).map(group => {
        const groupJobs = filtered.filter(j => j.group === group)
        if (!groupJobs.length) return null
        return (
          <div key={group} style={{marginBottom:24,border:'1px solid var(--border)'}}>
            <div className="cd-group-hdr" style={{color:GC[group]}}>
              <span style={{color:GC[group]}}>{group}</span>
              <span style={{color:'#4b5563',fontWeight:400,fontSize:10,fontFamily:"'IBM Plex Mono',monospace"}}>
                {groupJobs.filter(j=>j.status==='success').length}/{groupJobs.length} healthy
              </span>
            </div>
            <table className="cd-table">
              <thead>
                <tr>
                  <th className="cd-th" style={{width:220}}>Job</th>
                  <th className="cd-th" style={{width:90}}>Status</th>
                  <th className="cd-th" style={{width:80}}>Last Run</th>
                  <th className="cd-th" style={{width:60}}>Duration</th>
                  <th className="cd-th" style={{width:60}}>Success</th>
                  <th className="cd-th">History (last 15)</th>
                  <th className="cd-th" style={{width:80}}>Schedule</th>
                  <th className="cd-th" style={{width:80}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupJobs.map(job => {
                  const isOpen  = openJob === job.id
                  const isTriggering = triggering[job.id]
                  const tResult = trigResults[job.id]
                  const lastRun = job.lastRun
                  return (
                    <React.Fragment key={job.id}>
                      <tr className={`cd-row${isOpen?' open':''}`}
                        onClick={() => setOpenJob(isOpen ? null : job.id)}>
                        <td className="cd-td">
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{fontSize:14}}>{job.icon}</span>
                            <div>
                              <div style={{color:'var(--text)',fontSize:11,fontWeight:600,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:'.04em'}}>{job.label}</div>
                              <div style={{color:'#374151',fontSize:9,marginTop:1}}>{job.id}</div>
                            </div>
                            {job.critical && <span style={{color:'#ef4444',fontSize:8,border:'1px solid rgba(239,68,68,.4)',padding:'1px 4px',marginLeft:4}}>CRITICAL</span>}
                          </div>
                        </td>
                        <td className="cd-td"><StatusBadge status={job.status}/></td>
                        <td className="cd-td" style={{color:'#6b7280',fontSize:10,whiteSpace:'nowrap'}}>{fmtAge(lastRun?.at)}</td>
                        <td className="cd-td" style={{color:'#94a3b8',fontSize:10}}>{fmtMs(lastRun?.ms)}</td>
                        <td className="cd-td" style={{color: job.rate==null?'#374151': job.rate>=90?'#22c55e': job.rate>=70?'#f59e0b':'#ef4444', fontSize:11,fontWeight:700}}>
                          {job.rate != null ? `${job.rate}%` : '—'}
                          {job.streak > 1 && <span style={{color:'#22c55e',fontSize:9,marginLeft:4}}>🔥{job.streak}</span>}
                        </td>
                        <td className="cd-td"><HistoryBars history={job.history} /></td>
                        <td className="cd-td" style={{color:'#374151',fontSize:9}}>{job.schedule}</td>
                        <td className="cd-td" onClick={e=>e.stopPropagation()}>
                          <button className="cd-btn" onClick={()=>trigger(job.id)} disabled={isTriggering} style={{fontSize:10,padding:'4px 10px'}}>
                            {isTriggering ? <><span className="cd-spin"/>Running</> : '▶ Run'}
                          </button>
                        </td>
                      </tr>

                      {/* ── Detail panel ── */}
                      {isOpen && (
                        <tr className="cd-detail">
                          <td colSpan={8} style={{padding:'0 0 8px 0'}}>
                            <div style={{padding:'14px 16px 6px',display:'flex',gap:24,flexWrap:'wrap',alignItems:'flex-start',borderBottom:'1px solid #1f2937'}}>
                              <div style={{flex:1,minWidth:260}}>
                                <div style={{fontSize:10,color:'#4b5563',marginBottom:4,letterSpacing:'.08em'}}>DESCRIPTION</div>
                                <div style={{fontSize:11,color:'#94a3b8',lineHeight:1.7}}>{job.desc}</div>
                              </div>
                              <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
                                {lastRun && [
                                  { l:'Last run',   v: fmtTime(lastRun.at) },
                                  { l:'Duration',   v: fmtMs(lastRun.ms) },
                                  { l:'Trigger',    v: lastRun.trigger || 'cron' },
                                  { l:'Total runs', v: job.history.length + (job.history.length === 20 ? '+' : '') },
                                ].map(i => (
                                  <div key={i.l}>
                                    <div style={{fontSize:9,color:'#4b5563',letterSpacing:'.08em'}}>{i.l}</div>
                                    <div style={{fontSize:11,color:'var(--text)',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700}}>{i.v}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Trigger result */}
                            {tResult && (
                              <div style={{margin:'8px 16px',padding:'8px 12px',background:tResult.ok?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)',border:`1px solid ${tResult.ok?'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`,fontSize:10,fontFamily:"'IBM Plex Mono',monospace"}}>
                                {tResult.ok
                                  ? <span style={{color:'#4ade80'}}>✓ Triggered in {fmtMs(tResult.ms)} — {(tResult.response||'').slice(0,200)}</span>
                                  : <span style={{color:'#f87171'}}>✕ {tResult.error || `HTTP ${tResult.status}`}</span>}
                              </div>
                            )}

                            {/* Last run tail log */}
                            {lastRun && (
                              <div style={{margin:'8px 16px 0'}}>
                                <div style={{fontSize:9,color:'#4b5563',marginBottom:6,letterSpacing:'.08em'}}>LAST RUN OUTPUT</div>
                                <div className="cd-tail">
                                  {[
                                    `[${fmtTime(lastRun.at)}] ${lastRun.status.toUpperCase()} in ${fmtMs(lastRun.ms)}`,
                                    lastRun.trigger === 'manual' ? '[MANUAL TRIGGER]' : '[CRON]',
                                    lastRun.details ? `\n${lastRun.details}` : '\n(no details recorded)',
                                    lastRun.error   ? `\nERROR: ${lastRun.error}` : '',
                                  ].filter(Boolean).join('\n')}
                                </div>
                              </div>
                            )}

                            {/* Run log */}
                            <div style={{margin:'12px 16px 0'}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                                <div style={{fontSize:9,color:'#4b5563',letterSpacing:'.08em'}}>RUN LOG (last {job.history.length} runs)</div>
                                <div style={{fontSize:9,color:'#374151',fontFamily:"'IBM Plex Mono',monospace"}}>TIME · STATUS · DURATION · ITEMS PULLED</div>
                              </div>
                              <div className="cd-log">
                                {job.history.length === 0 ? (
                                  <div style={{padding:'20px',textAlign:'center',color:'#374151',fontSize:11}}>No runs recorded yet. Click ▶ Run to trigger manually.</div>
                                ) : (
                                  job.history.map((r, i) => <LogRow key={i} run={r} />)
                                )}
                              </div>
                            </div>

                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div className="cd-empty">No jobs match the current filter.</div>
      )}
    </div>
  )
}
