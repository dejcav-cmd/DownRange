'use client'
import React, { useState, useEffect, useCallback } from 'react'

const S = `
.ib-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:8px 18px;cursor:pointer;transition:opacity .15s}
.ib-btn:hover:not(:disabled){opacity:.85}.ib-btn:disabled{opacity:.4;cursor:not-allowed}
.ib-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:6px 12px;cursor:pointer;transition:all .15s}
.ib-ghost:hover{border-color:var(--gold);color:var(--gold)}
.ib-card{background:var(--bg2);border:1px solid var(--border)}
.ib-row{transition:background .1s;cursor:default}
.ib-row:hover{background:rgba(200,146,42,.04)}
.ib-check{width:16px;height:16px;cursor:pointer;accent-color:#C8922A}
@keyframes ib-spin{to{transform:rotate(360deg)}}
.ib-spinner{animation:ib-spin 1s linear infinite;display:inline-block;width:14px;height:14px;border:2px solid rgba(200,146,42,.3);border-top-color:var(--gold);border-radius:50%}
`

const EFFORT_C  = { 'quick-win':'#22c55e', medium:'#f59e0b', large:'#ef4444' }
const IMPACT_C  = { high:'#22c55e', medium:'#f59e0b', low:'#6b7280' }
const SEV_C     = { critical:'#ef4444', high:'#f97316', medium:'#f59e0b', low:'#6b7280' }
const CAT_C     = { content:'#3b82f6', features:'#a855f7', seo:'#22c55e', ux:'#f59e0b', bugs:'#ef4444', data:'#06b6d4', outreach:'#C8922A', monetization:'#ec4899' }
const URG_C     = { breaking:'#ef4444', timely:'#f59e0b', evergreen:'#22c55e' }

function ScoreDial({ score }) {
  const c = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'3.5rem', color:c, lineHeight:1 }}>{score}</div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#64748b', letterSpacing:'.12em' }}>/100 HEALTH</div>
    </div>
  )
}

function Bdg({ label, color, size=9 }) {
  return (
    <span style={{ display:'inline-block', background:color+'22', color, border:`1px solid ${color}44`, fontFamily:"'IBM Plex Mono',monospace", fontSize:size, fontWeight:700, letterSpacing:'.06em', padding:'2px 7px', textTransform:'uppercase', borderRadius:2 }}>
      {label}
    </span>
  )
}

function BriefingList({ briefings, selected, onSelect }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, overflowY:'auto', maxHeight:'calc(100vh - 240px)', border:'1px solid var(--border)' }}>
      {briefings.map(b => (
        <div key={b._id} onClick={()=>onSelect(b._id)}
          style={{ padding:'12px 16px', borderBottom:'1px solid rgba(30,41,59,.4)', cursor:'pointer', background:selected===b._id?'rgba(200,146,42,.08)':'transparent', borderLeft:selected===b._id?'3px solid var(--gold)':'3px solid transparent', transition:'all .1s' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text)', fontWeight:700 }}>{b.date}</div>
            {b.score!=null && <ScoreChip score={b.score} />}
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
            {b.headline || (b.status==='running'?'⏳ Running...':`${b.status}`)}
          </div>
          <div style={{ display:'flex', gap:6, marginTop:5, flexWrap:'wrap' }}>
            {b.openRecs>0 && <Bdg label={`${b.openRecs} recs`} color="#C8922A" size={8} />}
            {b.openIssues>0 && <Bdg label={`${b.openIssues} issues`} color="#ef4444" size={8} />}
            {b.gapCount>0 && <Bdg label={`${b.gapCount} gaps`} color="#3b82f6" size={8} />}
          </div>
        </div>
      ))}
    </div>
  )
}

function ScoreChip({ score }) {
  const c = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  return <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:c, lineHeight:1 }}>{score}</span>
}

function RecItem({ rec, briefingId, adminKey, onToggle }) {
  const [toggling, setToggling] = useState(false)
  const toggle = async () => {
    setToggling(true)
    await fetch('/api/admin/briefings', {
      method:'PATCH', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body: JSON.stringify({ briefingId, type:'rec', key:rec._key, value:!rec.done }),
    })
    onToggle()
    setToggling(false)
  }
  return (
    <div className="ib-row" style={{ display:'grid', gridTemplateColumns:'24px 1fr auto', gap:12, padding:'12px 16px', borderBottom:'1px solid rgba(30,41,59,.4)', opacity:rec.done?.8:1 }}>
      <input type="checkbox" className="ib-check" checked={!!rec.done} onChange={toggle} disabled={toggling} />
      <div>
        <div style={{ display:'flex', gap:6, marginBottom:4, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:rec.done?'#475569':'var(--text)', textDecoration:rec.done?'line-through':'none' }}>
            {rec.title}
          </span>
          {rec.category && <Bdg label={rec.category} color={CAT_C[rec.category]||'#6b7280'} />}
        </div>
        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', margin:'0 0 4px', lineHeight:1.65 }}>{rec.why}</p>
        {rec.howTo && <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#475569', margin:0, lineHeight:1.6, background:'rgba(0,0,0,.3)', padding:'4px 8px' }}>{rec.howTo}</p>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end', flexShrink:0 }}>
        {rec.impact && <Bdg label={rec.impact} color={IMPACT_C[rec.impact]||'#6b7280'} />}
        {rec.effort && <Bdg label={rec.effort?.replace('-',' ')} color={EFFORT_C[rec.effort]||'#6b7280'} />}
      </div>
    </div>
  )
}

function IssueItem({ issue, briefingId, adminKey, onToggle }) {
  const [toggling, setToggling] = useState(false)
  const toggle = async () => {
    setToggling(true)
    await fetch('/api/admin/briefings', {
      method:'PATCH', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body: JSON.stringify({ briefingId, type:'issue', key:issue._key, value:!issue.fixed }),
    })
    onToggle()
    setToggling(false)
  }
  return (
    <div className="ib-row" style={{ display:'grid', gridTemplateColumns:'24px auto 1fr', gap:12, padding:'10px 16px', borderBottom:'1px solid rgba(30,41,59,.4)', opacity:issue.fixed?.7:1 }}>
      <input type="checkbox" className="ib-check" checked={!!issue.fixed} onChange={toggle} disabled={toggling} />
      <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0 }}>
        <Bdg label={issue.severity} color={SEV_C[issue.severity]||'#6b7280'} />
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569' }}>{issue.page}</span>
      </div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:issue.fixed?'#475569':'var(--text-dim)', textDecoration:issue.fixed?'line-through':'none', lineHeight:1.6 }}>
        {issue.issue}
      </div>
    </div>
  )
}

export default function IntelligenceDashboard({ adminKey }) {
  const [briefings, setBriefings]   = useState([])
  const [selected, setSelected]     = useState(null)
  const [detail, setDetail]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [running, setRunning]       = useState(false)
  const [msg, setMsg]               = useState(null)
  const [filterTab, setFilterTab]   = useState('all')

  const h = { 'x-admin-key': adminKey || '' }
  const flash = (m, ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3500) }

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/briefings?limit=30', { headers: h })
      const d = await res.json()
      setBriefings(d.briefings || [])
      if (!selected && d.briefings?.[0]) setSelected(d.briefings[0]._id)
    } catch {}
    setLoading(false)
  }, [adminKey])

  const loadDetail = useCallback(async (id) => {
    if (!id) return
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/briefings?id=${id}`, { headers: h })
      const d = await res.json()
      setDetail(d.briefing)
    } catch {}
    setDetailLoading(false)
  }, [adminKey])

  useEffect(() => { loadList() }, [loadList])
  useEffect(() => { if (selected) loadDetail(selected) }, [selected, loadDetail])

  const runNow = async () => {
    setRunning(true)
    flash('Intelligence run started — this takes 2-3 minutes...')
    try {
      const res = await fetch('/api/intelligence', { method:'POST', headers: h })
      const d = await res.json()
      if (d.ok) {
        flash(`✅ Briefing complete — Score: ${d.score}/100 · ${d.recs} recs · ${d.gaps} gaps`)
        await loadList()
        setSelected(d.briefingId)
      } else {
        flash(`Error: ${d.error}`, false)
      }
    } catch (e) { flash(e.message, false) }
    setRunning(false)
  }

  const filteredRecs = detail?.recommendations?.filter(r => {
    if (filterTab === 'open')    return !r.done
    if (filterTab === 'done')    return !!r.done
    if (filterTab === 'quick')   return !r.done && r.effort === 'quick-win'
    if (filterTab === 'high')    return !r.done && r.impact === 'high'
    return true
  }) || []

  return (
    <div style={{ maxWidth: 1200 }}>
      <style>{S}</style>

      {msg && <div style={{ position:'fixed', top:20, right:20, zIndex:2000, background:msg.ok?'#14532d':'#7f1d1d', border:`1px solid ${msg.ok?'#22c55e':'#ef4444'}`, color:msg.ok?'#4ade80':'#f87171', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, padding:'10px 18px', boxShadow:'0 4px 20px rgba(0,0,0,.6)', borderRadius:2 }}>{msg.m}</div>}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', letterSpacing:'.06em', color:'var(--gold)', margin:0, lineHeight:1 }}>🧠 INTELLIGENCE BRIEFINGS</h1>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', margin:'4px 0 0' }}>
            Daily midnight analysis · Competitor research · Gap identification · Recommendations tracker
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="ib-ghost" onClick={loadList}>↻ Refresh</button>
          <button className="ib-btn" onClick={runNow} disabled={running}>
            {running ? <><span className="ib-spinner" />{' '}Running...</> : '⚡ Run Now'}
          </button>
        </div>
      </div>

      {/* How it works strip */}
      <div style={{ padding:'10px 16px', background:'rgba(200,146,42,.05)', border:'1px solid rgba(200,146,42,.2)', marginBottom:20, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:1.8 }}>
        <strong style={{ color:'#C8922A' }}>Runs midnight daily. </strong>
        Searches the web for competitor moves and trending 2A topics → audits DownRange's content and data → Claude generates competitor analysis, feature recommendations, content gaps, and issues → saves here + emails digest to dejcav@gmail.com.
        Check off recommendations as you complete them.
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#64748b' }}>
          Loading briefings...
        </div>
      ) : briefings.length === 0 ? (
        <div style={{ padding:60, textAlign:'center', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🧠</div>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.05em', marginBottom:8 }}>No Briefings Yet</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginBottom:20 }}>
            The first briefing runs tonight at midnight. Hit Run Now to generate one immediately.
          </div>
          <button className="ib-btn" onClick={runNow} disabled={running}>
            {running ? 'Running...' : '⚡ Run First Briefing Now'}
          </button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16, alignItems:'start' }}>
          {/* Left: briefing list */}
          <div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>
              {briefings.length} Briefings
            </div>
            <BriefingList briefings={briefings} selected={selected} onSelect={setSelected} />
          </div>

          {/* Right: briefing detail */}
          <div>
            {detailLoading ? (
              <div style={{ padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#64748b' }}>Loading...</div>
            ) : !detail ? (
              <div style={{ padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#64748b' }}>Select a briefing</div>
            ) : (
              <div>
                {/* Score + headline */}
                <div className="ib-card" style={{ padding:'20px 24px', marginBottom:12, display:'grid', gridTemplateColumns:'auto 1fr', gap:20, alignItems:'center' }}>
                  <ScoreDial score={detail.score || 0} />
                  <div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', marginBottom:6 }}>{detail.date} · {detail.runAt ? new Date(detail.runAt).toLocaleTimeString() : ''}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:700, color:'var(--text)', lineHeight:1.3, marginBottom:8 }}>{detail.headline}</div>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', margin:0, lineHeight:1.7 }}>{detail.summary}</p>
                  </div>
                </div>

                {/* Issues */}
                {detail.issues?.length > 0 && (
                  <div className="ib-card" style={{ marginBottom:12 }}>
                    <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#ef4444', fontWeight:700, letterSpacing:'.1em' }}>
                        ⚠ ISSUES ({detail.issues.filter(i=>!i.fixed).length} open)
                      </span>
                    </div>
                    {detail.issues.map(i => (
                      <IssueItem key={i._key} issue={i} briefingId={detail._id} adminKey={adminKey} onToggle={()=>loadDetail(selected)} />
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                <div className="ib-card" style={{ marginBottom:12 }}>
                  <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', fontWeight:700, letterSpacing:'.1em' }}>
                      ⚡ RECOMMENDATIONS ({filteredRecs.length} shown)
                    </span>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {[['all','All'],['open','Open'],['quick','Quick Wins'],['high','High Impact'],['done','Done']].map(([k,l])=>(
                        <button key={k} onClick={()=>setFilterTab(k)}
                          style={{ background:filterTab===k?'var(--gold)':'none', color:filterTab===k?'#000':'var(--text-dim)', border:`1px solid ${filterTab===k?'var(--gold)':'var(--border)'}`, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'3px 8px', cursor:'pointer', fontWeight:filterTab===k?700:400 }}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {filteredRecs.length === 0 ? (
                    <div style={{ padding:20, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b' }}>
                      {filterTab === 'done' ? 'No completed recommendations yet.' : 'No recommendations matching this filter.'}
                    </div>
                  ) : filteredRecs.map(r => (
                    <RecItem key={r._key} rec={r} briefingId={detail._id} adminKey={adminKey} onToggle={()=>loadDetail(selected)} />
                  ))}
                </div>

                {/* Content gaps */}
                {detail.contentGaps?.length > 0 && (
                  <div className="ib-card" style={{ marginBottom:12 }}>
                    <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#3b82f6', fontWeight:700, letterSpacing:'.1em' }}>
                        📝 CONTENT GAPS & TRENDING ({detail.contentGaps.length})
                      </span>
                    </div>
                    {detail.contentGaps.map((g, i) => (
                      <div key={g._key || i} className="ib-row" style={{ padding:'10px 16px', borderBottom:'1px solid rgba(30,41,59,.4)', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, alignItems:'start' }}>
                        <Bdg label={g.urgency} color={URG_C[g.urgency]||'#6b7280'} />
                        <div>
                          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{g.topic}</div>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:1.65 }}>{g.angle}</div>
                        </div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', textAlign:'right', whiteSpace:'nowrap' }}>{g.volume}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Competitor findings */}
                {detail.competitorFindings?.length > 0 && (
                  <div className="ib-card" style={{ marginBottom:12 }}>
                    <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#a855f7', fontWeight:700, letterSpacing:'.1em' }}>
                        🔍 COMPETITOR INTELLIGENCE ({detail.competitorFindings.length})
                      </span>
                    </div>
                    {detail.competitorFindings.map((c, i) => (
                      <div key={c._key || i} className="ib-row" style={{ padding:'10px 16px', borderBottom:'1px solid rgba(30,41,59,.4)', display:'grid', gridTemplateColumns:'140px 1fr 1fr', gap:12, alignItems:'start' }}>
                        <div>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#C8922A', fontWeight:700, marginBottom:2 }}>{c.source}</div>
                          {c.priority && <Bdg label={c.priority} color={IMPACT_C[c.priority]||'#6b7280'} size={8} />}
                        </div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:1.65 }}>{c.finding}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.65, borderLeft:'2px solid rgba(200,146,42,.3)', paddingLeft:10 }}>{c.gap}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
