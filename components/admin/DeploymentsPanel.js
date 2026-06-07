'use client'
import { useState, useEffect, useCallback } from 'react'

const S = {
  wrap:    { padding:'0 0 24px' },
  hero:    { padding:'16px', marginBottom:16, border:'1px solid', borderRadius:2 },
  heroLbl: { fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:6 },
  heroState:{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', letterSpacing:'.06em' },
  heroMeta:{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, marginTop:4 },
  statGrid:{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 },
  statBox: { background:'var(--card)', border:'1px solid var(--border)', padding:'12px 10px', textAlign:'center' },
  statVal: { fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--gold)', lineHeight:1 },
  statLbl: { fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--text-dim)', marginTop:2, textTransform:'uppercase', letterSpacing:'.08em' },
  card:    { background:'var(--card)', border:'1px solid var(--border)', padding:'14px', marginBottom:8 },
  row:     { display:'flex', alignItems:'center', gap:8, marginBottom:6 },
  pill:    { fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:2 },
  mono:    { fontFamily:"'IBM Plex Mono',monospace", fontSize:10 },
  mono9:   { fontFamily:"'IBM Plex Mono',monospace", fontSize:9 },
  btn:     { background:'var(--gold)', color:'#000', border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', padding:'6px 14px', cursor:'pointer' },
  btnOut:  { background:'none', border:'1px solid var(--border)', color:'var(--text-dim)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'5px 10px', cursor:'pointer' },
  logBox:  { background:'#000', border:'1px solid #333', padding:'10px 12px', maxHeight:320, overflowY:'auto', marginTop:10, fontFamily:"'IBM Plex Mono',monospace", fontSize:8, lineHeight:1.7, whiteSpace:'pre-wrap' },
  empty:   { textAlign:'center', padding:'40px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)' },
}

function stateColor(s='') {
  const u = s.toUpperCase()
  if (u==='READY')   return { color:'#22c55e', border:'rgba(34,197,94,.3)',  bg:'rgba(34,197,94,.08)' }
  if (u==='ERROR'||u==='FAILED'||u==='CANCELED') return { color:'#ef4444', border:'rgba(239,68,68,.3)', bg:'rgba(239,68,68,.08)' }
  if (u==='BUILDING'||u==='INITIALIZING'||u==='QUEUED') return { color:'#f59e0b', border:'rgba(245,158,11,.3)', bg:'rgba(245,158,11,.08)' }
  return { color:'#6b7280', border:'rgba(107,114,128,.3)', bg:'rgba(107,114,128,.08)' }
}
function fmtAgo(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return s+'s ago'
  if (s < 3600) return Math.floor(s/60)+'m ago'
  if (s < 86400) return Math.floor(s/3600)+'h ago'
  return Math.floor(s/86400)+'d ago'
}
function fmtDur(sec) {
  if (!sec) return ''
  if (sec < 60) return sec+'s'
  return Math.floor(sec/60)+'m '+( sec%60)+'s'
}

export default function DeploymentsPanel({ adminKey }) {
  const [deps, setDeps]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [noToken, setNoToken]   = useState(false)
  const [error, setError]       = useState(null)
  const [logs, setLogs]         = useState({})      // depId → lines[]|'loading'|'error'
  const [redeploying, setRed]   = useState({})

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/admin/deployments?limit=20', { headers:{ 'x-admin-key': adminKey } })
      const d = await r.json()
      if (d.noToken) { setNoToken(true); setLoading(false); return }
      if (!d.ok) { setError(d.error||'Failed'); setLoading(false); return }
      setDeps(d.deployments||[])
    } catch(e) { setError(e.message) }
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  const fetchLogs = async (depId) => {
    if (logs[depId] === 'loading') return
    if (logs[depId]) { setLogs(p=>({...p, [depId]: null})); return }  // toggle
    setLogs(p=>({...p, [depId]: 'loading'}))
    try {
      const r = await fetch(`/api/admin/deployments?id=${depId}&logs=true`, { headers:{ 'x-admin-key': adminKey } })
      const d = await r.json()
      setLogs(p=>({...p, [depId]: d.ok ? (d.logs||[]) : 'error'}))
    } catch { setLogs(p=>({...p, [depId]: 'error'})) }
  }

  const redeploy = async (depId) => {
    setRed(p=>({...p, [depId]: true}))
    try {
      const r = await fetch('/api/admin/deployments', {
        method:'POST', headers:{ 'x-admin-key': adminKey, 'Content-Type':'application/json' },
        body: JSON.stringify({ action:'redeploy', depId })
      })
      const d = await r.json()
      if (d.ok) { setTimeout(load, 2000) }
      else alert('Redeploy failed: '+(d.error||'Unknown'))
    } catch(e) { alert('Error: '+e.message) }
    setRed(p=>({...p, [depId]: false}))
  }

  if (loading) return <div style={S.empty}><span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>◈</span> Loading deployments…</div>

  if (noToken) return (
    <div style={{padding:16, background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.3)', borderRadius:2}}>
      <div style={{...S.mono, color:'#f59e0b', marginBottom:8, fontWeight:700}}>⚠ VERCEL_TOKEN not configured</div>
      <div style={{...S.mono9, color:'var(--text-dim)', lineHeight:1.7}}>
        1. Go to <strong>vercel.com/account/tokens</strong><br/>
        2. Create Token → copy the value<br/>
        3. Vercel → Project → Settings → Env Vars<br/>
        4. Add <code>VERCEL_TOKEN</code> = your token<br/>
        5. Redeploy for it to take effect
      </div>
    </div>
  )

  if (error) return <div style={S.empty}>Error: {error}</div>
  if (!deps.length) return <div style={S.empty}>No deployments found</div>

  const latest   = deps[0]
  const sc       = stateColor(latest?.state)
  const ready    = deps.filter(d=>d.state==='READY').length
  const errored  = deps.filter(d=>d.state==='ERROR'||d.state==='FAILED').length

  return (
    <div style={S.wrap}>
      <button style={{...S.btn, marginBottom:16, width:'100%'}} onClick={load}>↻ Refresh</button>

      {/* Latest hero */}
      <div style={{...S.hero, background:sc.bg, borderColor:sc.border}}>
        <div style={S.heroLbl}>Latest Deployment</div>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
          <span style={{...S.pill, background:sc.bg, color:sc.color, border:'1px solid '+sc.border}}>{latest?.state||'?'}</span>
          <span style={{...S.mono9, color:'var(--gold)'}}>{latest?.commit||''} {latest?.branch?'· '+latest.branch:''}</span>
          <span style={{...S.mono9, color:'var(--text-dim)', marginLeft:'auto'}}>{fmtAgo(latest?.createdAt)}</span>
        </div>
        {latest?.source && <div style={{...S.mono9, color:'var(--text-dim)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{latest.source}</div>}
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          {latest?.duration && <span style={{...S.mono9, color:'var(--text-dim)'}}>⏱ {fmtDur(latest.duration)}</span>}
          {latest?.url && <a href={latest.url} target="_blank" rel="noreferrer" style={{...S.mono9, color:'var(--gold)'}}>↗ Open</a>}
          {latest?.inspectUrl && <a href={latest.inspectUrl} target="_blank" rel="noreferrer" style={{...S.mono9, color:'var(--gold)'}}>🔍 Inspect</a>}
          <button style={S.btnOut} onClick={()=>fetchLogs(latest?.id)}>
            {logs[latest?.id] === 'loading' ? '⏳' : logs[latest?.id] ? '× Hide Log' : '📋 Build Log'}
          </button>
          <button style={{...S.btn, padding:'5px 12px', fontSize:11}} onClick={()=>redeploy(latest?.id)} disabled={redeploying[latest?.id]}>
            {redeploying[latest?.id] ? '⏳' : '↺ Redeploy'}
          </button>
        </div>
        {logs[latest?.id] && logs[latest?.id] !== 'loading' && renderLog(logs[latest.id])}
      </div>

      {/* Stats */}
      <div style={S.statGrid}>
        <div style={S.statBox}><div style={S.statVal}>{deps.length}</div><div style={S.statLbl}>Total</div></div>
        <div style={S.statBox}><div style={{...S.statVal, color:'#22c55e'}}>{ready}</div><div style={S.statLbl}>Ready</div></div>
        <div style={S.statBox}><div style={{...S.statVal, color:'#ef4444'}}>{errored}</div><div style={S.statLbl}>Errors</div></div>
      </div>

      {/* Full list */}
      <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-dim)', marginBottom:8}}>All Deployments</div>
      {deps.map(dep => {
        const c = stateColor(dep.state)
        return (
          <div key={dep.id} style={S.card}>
            <div style={S.row}>
              <span style={{...S.pill, background:c.bg, color:c.color, border:'1px solid '+c.border}}>{dep.state||'?'}</span>
              <span style={{...S.mono9, color:'var(--gold)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{dep.commit||''} {dep.branch?'· '+dep.branch:''}</span>
              <span style={{...S.mono9, color:'var(--text-dim)', flexShrink:0}}>{fmtAgo(dep.createdAt)}</span>
            </div>
            {dep.source && <div style={{...S.mono9, color:'var(--text-dim)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{dep.source}</div>}
            <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
              {dep.duration && <span style={{...S.mono9, color:'var(--text-dim)'}}>⏱ {fmtDur(dep.duration)}</span>}
              {dep.url && <a href={dep.url} target="_blank" rel="noreferrer" style={{...S.mono9, color:'var(--gold)'}}>↗ Open</a>}
              <button style={S.btnOut} onClick={()=>fetchLogs(dep.id)}>
                {logs[dep.id]==='loading'?'⏳':logs[dep.id]?'× Log':'📋 Log'}
              </button>
              <button style={{...S.btn, padding:'4px 10px', fontSize:10}} onClick={()=>redeploy(dep.id)} disabled={redeploying[dep.id]}>
                {redeploying[dep.id]?'⏳':'↺'}
              </button>
            </div>
            {logs[dep.id] && logs[dep.id]!=='loading' && renderLog(logs[dep.id])}
          </div>
        )
      })}
    </div>
  )
}

function renderLog(lines) {
  if (lines === 'error') return <div style={{...S.mono9, color:'#ef4444', marginTop:8}}>Failed to load logs</div>
  if (!lines.length) return <div style={{...S.mono9, color:'#6b7280', marginTop:8}}>No log output</div>
  return (
    <div style={S.logBox}>
      {lines.map((l, i) => (
        <span key={i} style={{
          color: l.type==='stderr'?'#fc8181': l.type==='command'?'#f6c90e': l.type==='delimiter'?'#68d391':'#a0aec0',
          display:'block'
        }}>{l.text}</span>
      ))}
    </div>
  )
}
