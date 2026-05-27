'use client'
import React, { useState, useEffect, useCallback } from 'react'

const S = `
.cd-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:6px 14px;cursor:pointer;transition:opacity .15s;white-space:nowrap}
.cd-btn:hover:not(:disabled){opacity:.85}.cd-btn:disabled{opacity:.4;cursor:not-allowed}
.cd-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s;white-space:nowrap}
.cd-ghost:hover{border-color:var(--gold);color:var(--gold)}
.cd-row{border-bottom:1px solid rgba(30,41,59,.5);transition:background .1s}
.cd-row:hover{background:rgba(200,146,42,.03)}
.cd-row.expanded{background:rgba(200,146,42,.05);border-bottom:none}
.cd-detail{background:rgba(0,0,0,.3);border-bottom:1px solid rgba(30,41,59,.5);padding:16px 20px}
.cd-badge{display:inline-flex;align-items:center;gap:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 7px;text-transform:uppercase;border-radius:2px;white-space:nowrap}
.cd-group-hdr{padding:8px 20px;background:rgba(0,0,0,.4);border-bottom:1px solid var(--border)}
@keyframes cd-pulse{0%,100%{opacity:1}50%{opacity:.3}}
.cd-live{animation:cd-pulse 2s ease-in-out infinite}
@keyframes cd-spin{to{transform:rotate(360deg)}}
.cd-spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(200,146,42,.3);border-top-color:var(--gold);border-radius:50%;animation:cd-spin .8s linear infinite;vertical-align:middle}
`

const STATUS = {
  success: { color:'#22c55e', icon:'✓', label:'OK'       },
  failed:  { color:'#ef4444', icon:'✕', label:'FAILED'   },
  running: { color:'#3b82f6', icon:'◉', label:'RUNNING'  },
  overdue: { color:'#f97316', icon:'⚠', label:'OVERDUE'  },
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
    const r = history[i]
    if (!r) return { color:'#1f2937', title:'No data' }
    const c = r.status==='success'?'#22c55e':r.status==='failed'?'#ef4444':'#f59e0b'
    return { color:c, title:`${r.status} · ${fmtAgo(r.at)} · ${fmtMs(r.ms)}` }
  }).reverse()
  return (
    <div style={{ display:'flex', gap:2, alignItems:'center' }}>
      {dots.map((d,i) => (
        <div key={i} title={d.title} style={{ width:8, height:16, background:d.color, borderRadius:1, opacity:i<dots.length-1?.5:.9, cursor:'default' }} />
      ))}
    </div>
  )
}

function StreakBadge({ streak }) {
  if (!streak) return null
  const c = streak >= 10 ? '#22c55e' : streak >= 5 ? '#f59e0b' : '#6b7280'
  return (
    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:c, border:`1px solid ${c}44`, padding:'1px 5px' }}>
      🔥 {streak}
    </span>
  )
}

function JobRow({ job, onTrigger, triggering }) {
  const [expanded, setExpanded] = useState(false)
  const s = STATUS[job.status] || STATUS.never

  return (
    <>
      <tr className={`cd-row${expanded?' expanded':''}`} onClick={()=>setExpanded(e=>!e)} style={{ cursor:'pointer' }}>
        {/* Icon + name */}
        <td style={{ padding:'12px 20px', verticalAlign:'middle' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>{job.icon}</span>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', lineHeight:1 }}>
                {job.label}
                {job.critical && <span style={{ marginLeft:5, fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#ef4444', border:'1px solid #ef444444', padding:'0 4px' }}>CRIT</span>}
              </div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', marginTop:2 }}>{job.path}</div>
            </div>
          </div>
        </td>
        {/* Status */}
        <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
          <StatusBadge status={job.status} />
        </td>
        {/* Schedule */}
        <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)' }}>{job.scheduleLabel}</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', marginTop:1 }}>
            {job.schedule}
          </div>
        </td>
        {/* Last run */}
        <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: job.lastRun?.status==='failed'?'#ef4444':'var(--text-dim)' }}>
            {job.lastRun ? (
                <span title={new Date(job.lastRun.at).toLocaleString()}>
                  {fmtAgo(job.lastRun.at)}
                  {job.lastRun.details && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#374151',marginLeft:6}}>{job.lastRun.details.slice(0,40)}</span>}
                </span>
              ) : '—'}
          </div>
          {job.lastRun?.ms && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569' }}>{fmtMs(job.lastRun.ms)}</div>}
        </td>
        {/* Next run */}
        <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: job.isOverdue?'#f97316':'var(--text-dim)' }}>
            {job.isOverdue ? '⚠ OVERDUE' : (job.nextRun ? `in ${fmtIn(job.nextRun)}` : '—')}
          </div>
        </td>
        {/* History bar */}
        <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
          <HistoryBar history={job.history || []} />
        </td>
        {/* Success rate + streak */}
        <td style={{ padding:'12px 16px', verticalAlign:'middle' }}>
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            {job.successRate != null && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: job.successRate===100?'#22c55e':job.successRate>=70?'#f59e0b':'#ef4444' }}>
                {job.successRate}%
              </span>
            )}
            <StreakBadge streak={job.streak} />
          </div>
        </td>
        {/* Trigger button */}
        <td style={{ padding:'12px 16px', verticalAlign:'middle' }} onClick={e=>e.stopPropagation()}>
          <button className="cd-btn" onClick={()=>onTrigger(job.id)} disabled={triggering===job.id} style={{ fontSize:10, padding:'4px 10px' }}>
            {triggering===job.id ? <span className="cd-spin" /> : '▶ Run'}
          </button>
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr>
          <td colSpan={8} style={{ padding:0 }}>
            <div className="cd-detail">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', marginBottom:6 }}>DESCRIPTION</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.65 }}>{job.desc}</div>
                </div>
                <div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', marginBottom:6 }}>EXECUTION LOG — LAST 20 RUNS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:0, border:'1px solid var(--border)' }}>
                    {(job.history || []).slice(0,20).map((r,i) => (
                      <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
                        padding:'5px 8px', background:i%2===0?'rgba(0,0,0,.2)':'rgba(0,0,0,.05)',
                        borderBottom: i < Math.min(job.history.length,20)-1 ? '1px solid rgba(30,41,59,.4)' : 'none' }}>
                        <span style={{ color: r.status==='success'?'#22c55e':r.status==='warning'?'#f59e0b':'#ef4444', width:10, flexShrink:0, paddingTop:1 }}>
                          {r.status==='success'?'✓':r.status==='warning'?'⚠':'✕'}
                        </span>
                        <span style={{ color:'#475569', flexShrink:0, minWidth:72 }}>{fmtAgo(r.at)}</span>
                        <span style={{ color:'#374151', flexShrink:0, minWidth:38 }}>{r.ms>0?fmtMs(r.ms):'—'}</span>
                        <span style={{ color:'#4b5563', flexShrink:0, width:36 }}>{r.trigger==='manual'?'🖱 man':'⏰ auto'}</span>
                        {r.details && !r.error && <span style={{ color:'#6b7280', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.details}</span>}
                        {r.error && <span style={{ color:'#fca5a5', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{'✗ '+r.error}</span>}
                      </div>
                    ))}
                    {(!job.history || job.history.length === 0) && (
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#374151', padding:'8px 10px' }}>No executions logged yet. Will appear after next run.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function CronDashboard({ adminKey }) {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [triggering, setTrigger]  = useState(null)
  const [trigResult, setTrigResult] = useState(null)
  const [autoRefresh, setAuto]    = useState(true)
  const [lastRefresh, setLastRef] = useState(null)
  const [filterGroup, setGroup]   = useState('All')

  const h = { 'x-admin-key': adminKey || '' }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/cron-status', { headers: h })
      const d   = await res.json()
      if (d.ok) { setData(d); setLastRef(new Date()) }
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
      setTrigResult({ jobId, ok:d.ok, status:d.status, ms:d.ms, error:d.error, response:d.response })
      load(true)
    } catch (e) { setTrigResult({ jobId, ok:false, error:e.message }) }
    setTrigger(null)
  }

  const groups = ['All', 'Content', 'System', 'Outreach']
  const jobs   = data?.jobs?.filter(j => filterGroup==='All' || j.group===filterGroup) || []
  const grouped = groups.slice(1).reduce((acc, g) => {
    acc[g] = jobs.filter(j => j.group === g)
    return acc
  }, {})

  const sum = data?.summary || {}

  return (
    <div style={{ maxWidth:1200 }}>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', letterSpacing:'.06em', color:'var(--gold)', margin:0, lineHeight:1 }}>
            ⚙ CRON MISSION CONTROL
          </h1>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', margin:'4px 0 0' }}>
            {data?.jobs?.length || 0} jobs · auto-refresh every 15s
            {lastRefresh && <span style={{ marginLeft:8, color:'#374151' }}>last update: {lastRefresh.toLocaleTimeString()}</span>}
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

      {/* Trigger result toast */}
      {trigResult && (
        <div style={{ marginBottom:16, padding:'10px 16px', background:trigResult.ok?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)', border:`1px solid ${trigResult.ok?'#22c55e':'#ef4444'}`, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, display:'flex', gap:12, alignItems:'center' }}>
          <span style={{ color:trigResult.ok?'#22c55e':'#ef4444', fontWeight:700 }}>
            {trigResult.ok ? '✓ RUN COMPLETE' : '✕ RUN FAILED'}
          </span>
          <span style={{ color:'#64748b' }}>{trigResult.jobId}</span>
          {trigResult.ms && <span style={{ color:'#475569' }}>{fmtMs(trigResult.ms)}</span>}
          {trigResult.error && <span style={{ color:'#f87171', flex:1 }}>{trigResult.error}</span>}
          {trigResult.response && <span style={{ color:'#374151', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{trigResult.response}</span>}
          <button onClick={()=>setTrigResult(null)} style={{ background:'none',border:'none',color:'#475569',cursor:'pointer',marginLeft:'auto' }}>✕</button>
        </div>
      )}

      {loading && !data ? (
        <div style={{ padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#64748b' }}>Loading cron status...</div>
      ) : (
        <>
          {/* ── FAILURE ALERT PANEL ── */}
          {data?.jobs?.filter(j => j.status === 'failed' || j.status === 'overdue').length > 0 && (
            <div style={{ marginBottom:20, border:'1px solid rgba(239,68,68,.4)', background:'rgba(239,68,68,.06)' }}>
              <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(239,68,68,.2)', display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:'#ef4444', letterSpacing:'.06em' }}>
                  🔴 {data.jobs.filter(j=>j.status==='failed'||j.status==='overdue').length} JOB{data.jobs.filter(j=>j.status==='failed'||j.status==='overdue').length>1?'S':''} FAILING
                </span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b' }}>
                  Email alert sent to dejcav@gmail.com
                </span>
              </div>
              {data.jobs.filter(j=>j.status==='failed'||j.status==='overdue').map(job => (
                <div key={job.id} style={{ padding:'10px 16px', borderBottom:'1px solid rgba(239,68,68,.1)', display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:'#f87171', flexShrink:0 }}>{job.icon} {job.label}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#ef4444', flexShrink:0 }}>
                    {(STATUS[job.status]||STATUS.never).label}
                  </span>
                  {job.lastRun?.error && (
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#fca5a5', flex:1 }}>{job.lastRun.error}</span>
                  )}
                  {job.lastRun?.at && (
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', flexShrink:0 }}>last: {relTime(job.lastRun.at)}</span>
                  )}
                  <button className="cd-ghost" style={{ fontSize:9, padding:'3px 8px' }}
                    onClick={() => setExpanded(job.id)}>
                    Details
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── RECENT FAILURES LOG ── */}
          {(() => {
            const allFails = (data?.jobs || []).flatMap(j =>
              (j.history || []).filter(r => r.status === 'failed').map(r => ({ ...r, jobId:j.id, jobLabel:j.label, icon:j.icon }))
            ).sort((a,b) => new Date(b.at) - new Date(a.at)).slice(0, 5)
            if (!allFails.length) return null
            return (
              <div style={{ marginBottom:20, border:'1px solid var(--border)', background:'var(--bg2)' }}>
                <div style={{ padding:'8px 16px', borderBottom:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', fontWeight:700 }}>
                  Recent Failures
                </div>
                {allFails.map((r, i) => (
                  <div key={i} style={{ padding:'8px 16px', borderBottom:'1px solid rgba(30,41,59,.4)', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#f87171', flexShrink:0 }}>{r.icon} {r.jobLabel}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', flexShrink:0 }}>{new Date(r.at).toLocaleString()}</span>
                    {r.error && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#fca5a5', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.error}</span>}
                    {r.ms > 0 && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', flexShrink:0 }}>{fmtMs(r.ms)}</span>}
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10, marginBottom:20 }}>
            {[
              ['Total Jobs',    sum.total,      '#C8922A'],
              ['Healthy',       sum.healthy,    '#22c55e'],
              ['Failing',       sum.failing,    '#ef4444'],
              ['Never Run',     sum.never,      '#6b7280'],
              ['Crit Failing',  sum.critFailing,'#ef4444'],
            ].map(([l,v,c]) => (
              <div key={l} style={{ background:'var(--bg2)', border:`1px solid ${c}33`, padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:c, lineHeight:1 }}>{v ?? '—'}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', marginTop:2, textTransform:'uppercase', letterSpacing:'.06em' }}>{l}</div>
              </div>
            ))}
            {/* Env health */}
            {data?.env && (
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'14px 16px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color: Object.values(data.env).every(Boolean)?'#22c55e':'#f97316', lineHeight:1 }}>
                  {Object.values(data.env).filter(Boolean).length}/{Object.keys(data.env).length}
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', marginTop:2, textTransform:'uppercase', letterSpacing:'.06em' }}>ENV VARS SET</div>
              </div>
            )}
          </div>

          {/* Env var detail */}
          {data?.env && Object.values(data.env).some(v => !v) && (
            <div style={{ padding:'10px 16px', background:'rgba(249,115,22,.06)', border:'1px solid rgba(249,115,22,.25)', marginBottom:16, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#f97316', fontWeight:700 }}>⚠ MISSING ENV VARS:</span>
              {Object.entries(data.env).filter(([,v])=>!v).map(([k]) => (
                <span key={k} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, background:'rgba(239,68,68,.1)', color:'#f87171', padding:'1px 6px', border:'1px solid rgba(239,68,68,.2)' }}>{k}</span>
              ))}
            </div>
          )}

          {/* Group filter tabs */}
          <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:0 }}>
            {groups.map(g => (
              <button key={g} onClick={()=>setGroup(g)}
                style={{ background:'none', border:'none', borderBottom:`2px solid ${filterGroup===g?'var(--gold)':'transparent'}`, fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', padding:'8px 16px', cursor:'pointer', color:filterGroup===g?'var(--gold)':'var(--text-dim)', transition:'all .15s', whiteSpace:'nowrap' }}>
                {g}
                {g !== 'All' && <span style={{ marginLeft:5, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569' }}>
                  {data?.jobs?.filter(j=>j.group===g).length}
                </span>}
              </button>
            ))}
          </div>

          {/* Jobs table */}
          <div style={{ overflowX:'auto', border:'1px solid var(--border)', borderTop:'none' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead>
                <tr style={{ background:'var(--bg2)' }}>
                  {['Job','Status','Schedule','Last Run','Next Run','History (10)','Rate',''].map(h => (
                    <th key={h} style={{ padding:'8px 16px', textAlign:'left', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', letterSpacing:'.08em', textTransform:'uppercase', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filterGroup === 'All'
                  ? Object.entries(grouped).map(([group, groupJobs]) => groupJobs.length > 0 ? (
                    <React.Fragment key={group}>
                      <tr>
                        <td colSpan={8} className="cd-group-hdr">
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:GROUP_C[group]||'#C8922A', letterSpacing:'.12em', textTransform:'uppercase' }}>
                            ▸ {group} ({groupJobs.length})
                          </span>
                        </td>
                      </tr>
                      {groupJobs.map(job => <JobRow key={job.id} job={job} onTrigger={trigger} triggering={triggering} />)}
                    </React.Fragment>
                  ) : null)
                  : jobs.map(job => <JobRow key={job.id} job={job} onTrigger={trigger} triggering={triggering} />)
                }
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{ marginTop:12, display:'flex', gap:14, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', letterSpacing:'.06em' }}>LEGEND:</span>
            {Object.entries(STATUS).map(([k,v]) => (
              <span key={k} style={{ display:'flex', alignItems:'center', gap:4, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:v.color }}>
                <span>{v.icon}</span> {v.label}
              </span>
            ))}
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151' }}>History bars = last 10 runs (oldest left)</span>
          </div>
        </>
      )}
    </div>
  )
}
