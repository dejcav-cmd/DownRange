'use client'
import { useState, useEffect, useCallback } from 'react'

const GOLD  = '#C8922A'
const MONO  = "'IBM Plex Mono',monospace"
const BEBAS = "'Bebas Neue',cursive"
const BARLOW= "'Barlow Condensed',sans-serif"

const RISK_COLOR = {
  HIGH:   { bg:'rgba(239,68,68,.12)',   text:'#ef4444', border:'#ef4444' },
  MEDIUM: { bg:'rgba(245,158,11,.10)',  text:'#f59e0b', border:'#f59e0b' },
  LOW:    { bg:'rgba(34,197,94,.10)',   text:'#22c55e', border:'#22c55e' },
}

const ISSUE_ICON = {
  old_structure:          '🏗',
  no_analysis:            '🔬',
  no_source:              '🔗',
  derivative_language:    '📋',
  no_source_link_in_body: '🔗',
  excessive_length:       '📏',
  duplicate_title:        '🔤',
}

const CSS = `
.cr-wrap{background:#09090B;min-height:100%}
.cr-topbar{padding:14px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#0A0B0C;position:sticky;top:0;z-index:10}
.cr-score-ring{width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0}
.cr-stats{display:flex;gap:12px;padding:16px 24px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:rgba(0,0,0,.2)}
.cr-stat{background:var(--bg2);border:1px solid var(--border);padding:14px 20px;flex:1;min-width:110px}
.cr-stat-val{font-family:${BEBAS};font-size:2rem;line-height:1}
.cr-stat-label{font-family:${MONO};font-size:9px;color:#4b5563;margin-top:2px;text-transform:uppercase;letter-spacing:.06em}
.cr-tabs{display:flex;border-bottom:1px solid var(--border);padding:0 24px;background:#0A0B0C}
.cr-tab{background:none;border:none;border-bottom:2px solid transparent;font-family:${BARLOW};font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:10px 16px;cursor:pointer;color:var(--text-dim);transition:all .12s;white-space:nowrap}
.cr-tab.active{color:${GOLD};border-bottom-color:${GOLD}}
.cr-tab:hover:not(.active){color:var(--text)}
.cr-table{width:100%;border-collapse:collapse}
.cr-table th{font-family:${MONO};font-size:9px;color:#4b5563;letter-spacing:.1em;text-transform:uppercase;padding:10px 16px;border-bottom:1px solid var(--border);text-align:left;background:var(--bg2);position:sticky;top:0;z-index:1;white-space:nowrap}
.cr-table td{padding:10px 16px;border-bottom:1px solid rgba(30,41,59,.4);font-size:12px;vertical-align:middle}
.cr-table tr:hover td{background:rgba(200,146,42,.03)}
.cr-badge{display:inline-block;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 7px;text-transform:uppercase;border-radius:2px}
.cr-btn{background:${GOLD};color:#000;border:none;font-family:${BARLOW};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:8px 16px;cursor:pointer;transition:opacity .12s;white-space:nowrap}
.cr-btn:hover{opacity:.85}
.cr-btn:disabled{opacity:.4;cursor:not-allowed}
.cr-btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:${MONO};font-size:10px;padding:6px 12px;cursor:pointer;transition:all .12s}
.cr-btn-ghost:hover{border-color:${GOLD};color:${GOLD}}
.rw-btn{border:1px solid;font-family:${BARLOW};font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:5px 10px;cursor:pointer;white-space:nowrap;transition:all .12s;width:100%;display:block;margin-bottom:3px}
.rw-idle{background:rgba(200,146,42,.1);color:${GOLD};border-color:rgba(200,146,42,.4)}
.rw-idle:hover{background:rgba(200,146,42,.22)}
.rw-running{background:rgba(245,158,11,.08);color:#f59e0b;border-color:rgba(245,158,11,.3);cursor:wait}
.rw-success{background:rgba(34,197,94,.08);color:#22c55e;border-color:rgba(34,197,94,.3);cursor:default}
.rw-error{background:rgba(239,68,68,.08);color:#ef4444;border-color:rgba(239,68,68,.3)}
.fix-all-btn{border:1px solid;font-family:${BARLOW};font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:4px 8px;cursor:pointer;white-space:nowrap;transition:opacity .12s;margin-top:4px;display:block;width:100%}
.fix-all-btn:disabled{opacity:.3;cursor:not-allowed}
.cr-policy{background:var(--bg2);border:1px solid var(--border);padding:20px 24px}
.cr-policy-item{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(30,41,59,.3)}
.cr-policy-item:last-child{border-bottom:none}
.cr-issue-chip{display:inline-flex;align-items:center;gap:4px;font-family:${MONO};font-size:9px;padding:2px 7px;border-radius:2px;margin:1px}
.cr-history-bar{height:28px;min-width:6px;border-radius:2px;cursor:default;transition:opacity .12s;position:relative}
.cr-history-bar:hover{opacity:.8}
.cr-empty{text-align:center;padding:60px 24px;font-family:${MONO};font-size:12px;color:#374151}
.cr-alert-banner{padding:12px 24px;font-family:${MONO};font-size:11px;display:flex;align-items:center;gap:10px}
`

export default function CopyrightReport({ adminKey }) {
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  const [report, setReport]     = useState(null)
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [running, setRunning]   = useState(false)
  const [tab, setTab]           = useState('overview')
  const [filter, setFilter]     = useState('ALL')
  const [search, setSearch]     = useState('')
  const [flash, setFlash]       = useState(null)
  const [rewriting, setRewriting]     = useState({})  // { [_id]: true }
  const [rwStatus, setRwStatus]       = useState({})  // { [_id]: 'success'|'error' }
  const [bulkProgress, setBulkProgress] = useState(null)
  const [page, setPage]               = useState(1)

  const loadLatest = useCallback(async () => {
    setLoading(true)
    try {
      // Load latest saved report from Sanity via cron-status
      const res = await fetch('/api/admin/cron-status', { headers: H })
      const d   = await res.json()
      const job = (d.jobs || []).find(j => j.id === 'copyright-review')
      if (job?.lastData) {
        try { setReport(JSON.parse(job.lastData)) } catch {}
      }
      // Also try to load historical reports
      const histRes = await fetch('/api/admin/copyright-history', { headers: H })
      if (histRes.ok) {
        const hd = await histRes.json()
        setHistory(hd.reports || [])
      }
    } catch (e) {}
    setLoading(false)
  }, [adminKey])

  useEffect(() => { loadLatest() }, [loadLatest])

  const runNow = async () => {
    setRunning(true)
    setFlash({ type:'info', msg:'⏳ Running copyright review — scanning articles…' })
    try {
      const res = await fetch('/api/cron/copyright-review', { headers: H })
      const d   = await res.json()
      if (d.ok) {
        setReport(d)
        setFlash({ type:'success', msg:`✅ Scan complete — ${d.complianceRate}% compliant, ${d.scanned} articles scanned` })
      } else {
        setFlash({ type:'error', msg:'❌ Scan failed: ' + (d.error || 'unknown') })
      }
    } catch (e) {
      setFlash({ type:'error', msg:'❌ ' + e.message })
    }
    setRunning(false)
  }

  // ── Single article rewrite ───────────────────────────────────────────────
  const rewriteOne = async (article) => {
    setRewriting(p => ({ ...p, [article._id]: true }))
    setFlash({ type:'info', msg:`⏳ Rewriting: ${article.title?.slice(0,60)}…` })
    try {
      const res = await fetch('/api/admin/quality-rewrite-single', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: article._id, type: article._type || 'newsArticle' }),
      })
      const d = await res.json()
      if (d.ok) {
        setRwStatus(p => ({ ...p, [article._id]: 'success' }))
        setFlash({ type:'success', msg:`✅ Rewritten: ${article.title?.slice(0,60)}` })
      } else {
        setRwStatus(p => ({ ...p, [article._id]: 'error' }))
        setFlash({ type:'error', msg:`❌ Failed: ${d.error || 'unknown'}` })
      }
    } catch(e) {
      setRwStatus(p => ({ ...p, [article._id]: 'error' }))
      setFlash({ type:'error', msg:'❌ Error: ' + e.message })
    }
    setRewriting(p => ({ ...p, [article._id]: false }))
  }

  // ── Bulk rewrite ─────────────────────────────────────────────────────────
  const rewriteBulk = async (list, label) => {
    if (!list.length) return
    setBulkProgress({ done:0, total:list.length, label, current:'' })
    for (let i = 0; i < list.length; i++) {
      setBulkProgress({ done:i, total:list.length, label, current:list[i].title?.slice(0,55)||'' })
      await rewriteOne(list[i])
      await new Promise(res => setTimeout(res, 700))
    }
    setBulkProgress(null)
    setFlash({ type:'success', msg:`✅ Done — ${list.length} ${label} articles rewritten` })
  }

  const r = report
  const complianceColor = !r ? '#374151' : r.complianceRate >= 80 ? '#22c55e' : r.complianceRate >= 60 ? '#f59e0b' : '#ef4444'

  // Filter articles
  const articles = (r?.articles || []).filter(a => {
    const matchFilter = filter === 'ALL' || a.riskLevel === filter
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // Pagination
  const PAGE_SIZE = 25
  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageArticles = articles.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const POLICY_RULES = [
    { icon:'🚫', rule:'Never copy or republish articles from third-party websites' },
    { icon:'📏', rule:'Never reproduce large portions — 400 char source limit enforced in AI prompts' },
    { icon:'🔄', rule:'No paragraph-by-paragraph rewrites of a single source article' },
    { icon:'🏗', rule:'Do not mirror the original article\'s structure, flow, or narrative' },
    { icon:'📚', rule:'Use multiple sources whenever possible for original summaries' },
    { icon:'📊', rule:'Extract and report facts — not the original author\'s expression' },
    { icon:'✍', rule:'Generate content in DownRange\'s own structure (Key Details → Why It Matters → DR Analysis)' },
    { icon:'💡', rule:'Add original analysis and commentary in the DownRange Analysis section' },
    { icon:'🔗', rule:'Clearly identify and link to original source(s) in every article' },
    { icon:'📖', rule:'The article should not replace the original — readers benefit from visiting the source' },
    { icon:'💬', rule:'Only short quotations used and properly attributed' },
    { icon:'🖼', rule:'Only licensed, public-domain, or self-hosted images (no Wikimedia/Unsplash)' },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="cr-wrap">

        {/* Topbar */}
        <div className="cr-topbar">
          {r && (
            <div className="cr-score-ring" style={{
              background: `conic-gradient(${complianceColor} ${r.complianceRate * 3.6}deg, rgba(30,41,59,.6) 0deg)`,
              boxShadow: `0 0 0 3px #09090B, 0 0 0 5px ${complianceColor}33`
            }}>
              <div style={{ background:'#09090B', width:64, height:64, borderRadius:'50%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:BEBAS, fontSize:'1.4rem', color:complianceColor, lineHeight:1 }}>{r.complianceRate}%</div>
                <div style={{ fontFamily:MONO, fontSize:7, color:'#4b5563', letterSpacing:'.06em' }}>COMPLIANT</div>
              </div>
            </div>
          )}
          <div>
            <div style={{ fontFamily:BEBAS, fontSize:'1.3rem', color:GOLD, letterSpacing:'.06em' }}>COPYRIGHT COMPLIANCE</div>
            <div style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>
              {r ? `Last run: ${r.date || 'today'} · ${r.scanned} articles scanned` : 'Daily scan at 6:00 AM UTC'}
            </div>
          </div>
          <div style={{ flex:1 }} />
          <button className="cr-btn-ghost" onClick={loadLatest} disabled={loading}>↻ Refresh</button>
          <button className="cr-btn" onClick={runNow} disabled={running}>
            {running ? '⏳ Scanning…' : '▶ Run Now'}
          </button>
        </div>

        {flash && (
          <div className="cr-alert-banner" style={{
            background: flash.type === 'error' ? 'rgba(239,68,68,.08)' : flash.type === 'success' ? 'rgba(34,197,94,.08)' : 'rgba(200,146,42,.08)',
            borderBottom: '1px solid var(--border)',
            color: flash.type === 'error' ? '#ef4444' : flash.type === 'success' ? '#22c55e' : GOLD
          }}>
            {flash.msg}
            <button className="cr-btn-ghost" style={{ marginLeft:'auto', padding:'3px 8px', fontSize:9 }} onClick={() => setFlash(null)}>✕</button>
          </div>
        )}

        {/* Stats + FIX ALL buttons */}
        {r && (
          <>
            {/* Bulk progress */}
            {bulkProgress && (
              <div style={{ padding:'10px 24px', background:'rgba(200,146,42,.05)', borderBottom:'1px solid rgba(200,146,42,.2)' }}>
                <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontFamily:MONO, fontSize:11, color:GOLD, whiteSpace:'nowrap' }}>
                    REWRITING {bulkProgress.label} — {bulkProgress.done}/{bulkProgress.total}
                  </span>
                  <span style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                    → {bulkProgress.current}
                  </span>
                </div>
                <div style={{ height:3, background:'rgba(200,146,42,.15)' }}>
                  <div style={{ height:'100%', background:GOLD, width:`${Math.round((bulkProgress.done/bulkProgress.total)*100)}%`, transition:'width .4s' }} />
                </div>
              </div>
            )}
            <div className="cr-stats">
              {[
                { val:r.scanned,           label:'Scanned',        color:'#9ca3af', list:null },
                { val:r.clean,             label:'Clean',          color:'#22c55e', list:null },
                { val:r.highRisk,          label:'High Risk',      color: r.highRisk   > 0 ? '#ef4444' : '#374151', level:'HIGH' },
                { val:r.medRisk,           label:'Med Risk',       color: r.medRisk    > 0 ? '#f59e0b' : '#374151', level:'MEDIUM' },
                { val:r.lowRisk,           label:'Low Risk',       color: r.lowRisk    > 0 ? '#22c55e' : '#374151', level:'LOW' },
                { val:r.oldStructureCount, label:'Old Structure',  color: r.oldStructureCount > 0 ? '#f97316' : '#374151', list:null },
              ].map(s => {
                const list = s.level ? (r.articles||[]).filter(a => a.riskLevel === s.level) : null
                return (
                  <div key={s.label} className="cr-stat">
                    <div className="cr-stat-val" style={{ color:s.color }}>{s.val}</div>
                    <div className="cr-stat-label">{s.label}</div>
                    {list && list.length > 0 && (
                      <button className="fix-all-btn" disabled={!!bulkProgress || running}
                        style={{ background:`${s.color}15`, color:s.color, borderColor:`${s.color}44` }}
                        onClick={() => rewriteBulk(list, s.label)}>
                        ✍ FIX ALL
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Tabs */}
        <div className="cr-tabs">
          {[
            { id:'overview',  label:'Overview' },
            { id:'articles',  label:`All Articles${r ? ` (${r.scanned})` : ''}` },
            { id:'high-risk', label:`High Risk${r?.highRisk > 0 ? ` (${r.highRisk})` : ''}`, alert: r?.highRisk > 0 },
            { id:'policy',    label:'Policy Rules' },
          ].map(t => (
            <button key={t.id} className={`cr-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.alert && <span style={{ color:'#ef4444', marginRight:4 }}>⚠</span>}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>

          {/* Overview */}
          {tab === 'overview' && (
            <div style={{ padding:24 }}>
              {!r ? (
                <div className="cr-empty">
                  {loading ? '⏳ Loading report…' : 'No report found. Click ▶ Run Now to generate the first report.'}
                </div>
              ) : (
                <>
                  {/* Top issues */}
                  {r.topIssues?.length > 0 && (
                    <div style={{ marginBottom:24 }}>
                      <div style={{ fontFamily:BEBAS, fontSize:'1rem', color:'#ef4444', letterSpacing:'.06em', marginBottom:12 }}>
                        ⚠ TOP HIGH-RISK ARTICLES — REQUIRES ATTENTION
                      </div>
                      {r.topIssues.map((item, i) => (
                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 16px', background:'rgba(239,68,68,.06)', borderLeft:'3px solid #ef4444', marginBottom:6 }}>
                          <div style={{ fontFamily:MONO, fontSize:10, color:'#ef4444', minWidth:28 }}>#{i+1}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:BARLOW, fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{item.title}</div>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:2 }}>
                              {item.issues.map((issue, j) => (
                                <span key={j} className="cr-issue-chip" style={{ background:'rgba(239,68,68,.12)', color:'#ef4444' }}>
                                  {issue.slice(0,60)}{issue.length>60?'…':''}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div style={{ fontFamily:BEBAS, fontSize:'1.2rem', color:'#ef4444', minWidth:32, textAlign:'right' }}>{item.score}</div>
                          <a href={`/news/${item.slug}`} target="_blank" rel="noopener noreferrer">
                            <button className="cr-btn-ghost" style={{ padding:'3px 8px', fontSize:10 }}>↗</button>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Issue breakdown */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
                    <div className="cr-policy">
                      <div style={{ fontFamily:BEBAS, fontSize:'1rem', color:GOLD, letterSpacing:'.06em', marginBottom:12 }}>ISSUE BREAKDOWN</div>
                      {[
                        { label:'Old Structure (pre-policy)',    val:r.oldStructureCount,  color:'#f97316', icon:'🏗' },
                        { label:'Missing DR Analysis',           val:r.noAnalysisCount,    color:'#a78bfa', icon:'🔬' },
                        { label:'High Risk Total',               val:r.highRisk,           color:'#ef4444', icon:'🔴' },
                        { label:'Medium Risk Total',             val:r.medRisk,            color:'#f59e0b', icon:'🟡' },
                        { label:'Low Risk',                      val:r.lowRisk,            color:'#22c55e', icon:'🟢' },
                        { label:'Fully Clean',                   val:r.clean,              color:'#22c55e', icon:'✅' },
                      ].map(item => (
                        <div key={item.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(30,41,59,.3)' }}>
                          <span style={{ fontSize:14 }}>{item.icon}</span>
                          <span style={{ fontFamily:MONO, fontSize:11, color:'var(--text-dim)', flex:1 }}>{item.label}</span>
                          <span style={{ fontFamily:BEBAS, fontSize:'1.2rem', color:item.color }}>{item.val}</span>
                        </div>
                      ))}
                    </div>

                    <div className="cr-policy">
                      <div style={{ fontFamily:BEBAS, fontSize:'1rem', color:GOLD, letterSpacing:'.06em', marginBottom:12 }}>DAILY SCHEDULE</div>
                      <div style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', lineHeight:1.8 }}>
                        <div style={{ padding:'6px 0', borderBottom:'1px solid rgba(30,41,59,.3)' }}>
                          ⏰ <strong style={{color:GOLD}}>Runs every day at 6:00 AM UTC</strong>
                        </div>
                        <div style={{ padding:'6px 0', borderBottom:'1px solid rgba(30,41,59,.3)' }}>
                          📋 Scans all articles from last 48 hours
                        </div>
                        <div style={{ padding:'6px 0', borderBottom:'1px solid rgba(30,41,59,.3)' }}>
                          🎲 Spot-checks 10 random articles from last 7 days
                        </div>
                        <div style={{ padding:'6px 0', borderBottom:'1px solid rgba(30,41,59,.3)' }}>
                          📧 Emails alert to dejcav@gmail.com if high-risk articles found
                        </div>
                        <div style={{ padding:'6px 0' }}>
                          💾 Saves report to Sanity for history tracking
                        </div>
                      </div>
                    </div>
                  </div>

                  {r.clean === r.scanned && r.scanned > 0 && (
                    <div style={{ padding:'16px 20px', background:'rgba(34,197,94,.08)', border:'1px solid rgba(34,197,94,.3)', fontFamily:MONO, fontSize:12, color:'#22c55e' }}>
                      ✅ All {r.scanned} scanned articles are fully compliant with the copyright policy.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Articles table */}
          {(tab === 'articles' || tab === 'high-risk') && (
            <>
              <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:10, alignItems:'center', background:'#0A0B0C' }}>
                <input
                  style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:MONO, fontSize:11, padding:'7px 12px', outline:'none', flex:1, maxWidth:280 }}
                  placeholder="Search article title…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1) }}
                />
                {['ALL','HIGH','MEDIUM','LOW'].map(f => (
                  <button key={f} className={`cr-btn-ghost${filter===f?' active':''}`}
                    style={{ fontSize:10, padding:'5px 10px', ...(filter===f ? {borderColor:GOLD, color:GOLD} : {}) }}
                    onClick={() => { setFilter(f); setPage(1) }}>
                    {f}
                  </button>
                ))}
                <span style={{ fontFamily:MONO, fontSize:10, color:'#374151' }}>{articles.length} articles</span>
              </div>

              {!r ? (
                <div className="cr-empty">No report data. Run the scanner first.</div>
              ) : (
                <div style={{ overflow:'auto' }}>
                  <table className="cr-table">
                    <thead>
                      <tr>
                        <th>Article</th>
                        <th>Risk</th>
                        <th>Score</th>
                        <th>Words</th>
                        <th>Issues</th>
                        <th>Published</th>
                        <th style={{ minWidth:130 }}>Rewrite</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.length === 0 ? (
                        <tr><td colSpan={7}><div className="cr-empty">No articles match the current filter.</div></td></tr>
                      ) : (tab === 'high-risk' ? articles.filter(a => a.riskLevel === 'HIGH') : pageArticles).map(a => {
                        const rc = RISK_COLOR[a.riskLevel] || RISK_COLOR.LOW
                        return (
                          <tr key={a._id}>
                            <td style={{ maxWidth:320 }}>
                              <div style={{ fontFamily:BARLOW, fontSize:13, fontWeight:700, color:'var(--text)' }}>{a.title}</div>
                              <div style={{ fontFamily:MONO, fontSize:9, color:'#374151', marginTop:2 }}>{a.slug}</div>
                            </td>
                            <td>
                              <span className="cr-badge" style={{ background:rc.bg, color:rc.text }}>{a.riskLevel}</span>
                            </td>
                            <td>
                              <div style={{ fontFamily:BEBAS, fontSize:'1.1rem', color:rc.text }}>{a.riskScore}</div>
                            </td>
                            <td style={{ fontFamily:MONO, fontSize:11, color:'#6b7280' }}>
                              {a.wordCount || '—'}
                            </td>
                            <td style={{ maxWidth:280 }}>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:2 }}>
                                {a.issues?.map((issue, j) => (
                                  <span key={j} className="cr-issue-chip"
                                    style={{ background:rc.bg, color:rc.text, border:`1px solid ${rc.border}33` }}>
                                    {ISSUE_ICON[issue.type] || '⚠'} {issue.severity} · {issue.msg.slice(0,40)}{issue.msg.length>40?'…':''}
                                  </span>
                                ))}
                                {(!a.issues || a.issues.length === 0) && (
                                  <span style={{ fontFamily:MONO, fontSize:9, color:'#22c55e' }}>✅ Clean</span>
                                )}
                              </div>
                            </td>
                            <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', whiteSpace:'nowrap' }}>
                              {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}
                            </td>
                            <td>
                              <button
                                className={'rw-btn ' + (rewriting[a._id] ? 'rw-running' : rwStatus[a._id]==='success' ? 'rw-success' : rwStatus[a._id]==='error' ? 'rw-error' : 'rw-idle')}
                                disabled={!!rewriting[a._id] || rwStatus[a._id]==='success'}
                                onClick={() => rewriteOne(a)}>
                                {rewriting[a._id] ? '⏳ REWRITING…' : rwStatus[a._id]==='success' ? '✅ DONE' : rwStatus[a._id]==='error' ? '❌ RETRY' : '✍️ REWRITE'}
                              </button>
                              {a.slug && (
                                <a href={`/news/${a.slug}`} target="_blank" rel="noopener noreferrer">
                                  <button className="cr-btn-ghost" style={{ padding:'3px 8px', fontSize:9, width:'100%', marginTop:2 }}>VIEW ↗</button>
                                </a>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {tab !== 'high-risk' && totalPages > 1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderTop:'1px solid var(--border)', background:'rgba(0,0,0,.15)' }}>
                  <span style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>
                    Page {safePage} of {totalPages} · {articles.length} articles
                  </span>
                  <div style={{ display:'flex', gap:4 }}>
                    <button onClick={() => setPage(1)} disabled={safePage===1} style={{ fontFamily:MONO, fontSize:10, padding:'4px 10px', background:'none', border:'1px solid var(--border)', color:safePage===1?'#374151':'#9ca3af', cursor:safePage===1?'default':'pointer' }}>«</button>
                    <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={safePage===1} style={{ fontFamily:MONO, fontSize:10, padding:'4px 10px', background:'none', border:'1px solid var(--border)', color:safePage===1?'#374151':'#9ca3af', cursor:safePage===1?'default':'pointer' }}>‹ Prev</button>
                    {Array.from({ length: Math.min(7, totalPages) }, (_,i) => {
                      const p = safePage <= 4 ? i+1 : safePage+i-3
                      if (p < 1 || p > totalPages) return null
                      return <button key={p} onClick={() => setPage(p)} style={{ fontFamily:MONO, fontSize:10, padding:'4px 10px', background:p===safePage?'rgba(200,146,42,.15)':'none', border:`1px solid ${p===safePage?GOLD:'var(--border)'}`, color:p===safePage?GOLD:'#9ca3af', cursor:'pointer' }}>{p}</button>
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={safePage===totalPages} style={{ fontFamily:MONO, fontSize:10, padding:'4px 10px', background:'none', border:'1px solid var(--border)', color:safePage===totalPages?'#374151':'#9ca3af', cursor:safePage===totalPages?'default':'pointer' }}>Next ›</button>
                    <button onClick={() => setPage(totalPages)} disabled={safePage===totalPages} style={{ fontFamily:MONO, fontSize:10, padding:'4px 10px', background:'none', border:'1px solid var(--border)', color:safePage===totalPages?'#374151':'#9ca3af', cursor:safePage===totalPages?'default':'pointer' }}>»</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Policy */}
          {tab === 'policy' && (
            <div style={{ padding:24 }}>
              <div style={{ maxWidth:800 }}>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:BEBAS, fontSize:'1.2rem', color:GOLD, letterSpacing:'.06em', marginBottom:4 }}>DOWNRANGE COPYRIGHT POLICY</div>
                  <div style={{ fontFamily:MONO, fontSize:11, color:'#6b7280' }}>Effective writing rules applied to all AI-generated content across news articles, blog posts, and releases.</div>
                </div>
                <div className="cr-policy">
                  {POLICY_RULES.map((rule, i) => (
                    <div key={i} className="cr-policy-item">
                      <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{rule.icon}</span>
                      <span style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', lineHeight:1.6 }}>
                        <strong style={{ color:'var(--text)', marginRight:4 }}>{i+1}.</strong>
                        {rule.rule}
                      </span>
                      <span style={{ fontFamily:MONO, fontSize:9, color:'#22c55e', marginLeft:'auto', whiteSpace:'nowrap' }}>✅ Active</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop:20 }}>
                  <div style={{ fontFamily:BEBAS, fontSize:'1rem', color:GOLD, letterSpacing:'.06em', marginBottom:12 }}>AI PROMPT ENFORCEMENT</div>
                  <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:16 }}>
                    {[
                      { file:'agent/utils.js → rewriteWithClaude()',         status:'✅ Updated', detail:'400 char source limit, facts-only extraction, original DR structure' },
                      { file:'api/admin/backfill-articles → VOICE block',    status:'✅ Updated', detail:'Copyright rules injected, source limit 400 chars, DR Analysis required' },
                      { file:'api/cron/quality-rewrite',                     status:'✅ Updated', detail:'Copyright rules in VOICE block, no paragraph-rewrite instruction' },
                      { file:'api/cron/copyright-review',                    status:'✅ Running', detail:'Daily 6am scan, 48h articles + 7-day sample, email digest on failures' },
                    ].map((item, i) => (
                      <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(30,41,59,.3)' }}>
                        <span style={{ fontFamily:MONO, fontSize:9, color:'#22c55e', minWidth:80 }}>{item.status}</span>
                        <div>
                          <div style={{ fontFamily:MONO, fontSize:10, color:GOLD }}>{item.file}</div>
                          <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:2 }}>{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
