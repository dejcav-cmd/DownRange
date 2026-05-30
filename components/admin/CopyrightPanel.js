'use client'
import { useState, useEffect, useCallback } from 'react'

const GOLD  = '#C8922A'
const MONO  = "'IBM Plex Mono',monospace"
const BEBAS = "'Bebas Neue',cursive"
const BARL  = "'Barlow Condensed',sans-serif"

const RISK_COLOR = { HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#22c55e', CLEAN:'#3b82f6' }
const RISK_BG    = { HIGH:'rgba(239,68,68,.1)', MEDIUM:'rgba(245,158,11,.08)', LOW:'rgba(34,197,94,.08)', CLEAN:'rgba(59,130,246,.08)' }

const TYPES = [
  { key:'newsArticle',    label:'News Articles',    icon:'📰' },
  { key:'blogPost',       label:'Blog Posts',       icon:'✍️' },
  { key:'firearmRelease', label:'Releases',         icon:'🔫' },
  { key:'review',         label:'Reviews',          icon:'⭐' },
]

export default function CopyrightPanel({ adminKey }) {
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }
  const [report, setReport]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [running, setRunning]     = useState(false)
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [rewriting, setRewriting] = useState({})   // { [_id]: true }
  const [rewritten, setRewritten] = useState({})   // { [_id]: 'success'|'error' }
  const [flash, setFlash]         = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const showFlash = (msg, dur=5000) => { setFlash(msg); setTimeout(() => setFlash(''), dur) }

  // ── Load full article scan ──────────────────────────────────────────────
  const runReview = useCallback(async () => {
    setRunning(true)
    showFlash('⏳ Scanning all articles for copyright risk…', 15000)
    try {
      const res = await fetch('/api/cron/copyright-review?full=1', { headers: H })
      const d = await res.json()
      setReport(d)
      setFlash(`✅ Scan complete — ${d.complianceRate}% compliant · ${d.highRisk} high-risk · ${d.medRisk} medium-risk`)
    } catch(e) {
      showFlash('❌ Scan failed: ' + e.message)
    }
    setRunning(false)
  }, [adminKey])

  useEffect(() => { runReview() }, [])

  // ── Per-article rewrite ─────────────────────────────────────────────────
  const rewriteArticle = async (article) => {
    setRewriting(r => ({ ...r, [article._id]: true }))
    showFlash(`⏳ Rewriting: ${article.title.slice(0,60)}…`, 20000)
    try {
      const res = await fetch('/api/admin/quality-rewrite-single', {
        method: 'POST',
        headers: H,
        body: JSON.stringify({ id: article._id, type: article._type || 'newsArticle' }),
      })
      const d = await res.json()
      if (d.ok) {
        setRewritten(r => ({ ...r, [article._id]: 'success' }))
        showFlash(`✅ Rewritten: ${article.title.slice(0,60)}`)
        // Remove from list after 2s
        setTimeout(() => {
          setReport(prev => prev ? { ...prev, articles: prev.articles.filter(a => a._id !== article._id), highRisk: Math.max(0,(prev.highRisk||0)-1) } : prev)
        }, 2000)
      } else {
        setRewritten(r => ({ ...r, [article._id]: 'error' }))
        showFlash(`❌ Rewrite failed: ${d.error || 'unknown error'}`)
      }
    } catch(e) {
      setRewritten(r => ({ ...r, [article._id]: 'error' }))
      showFlash('❌ Rewrite error: ' + e.message)
    }
    setRewriting(r => ({ ...r, [article._id]: false }))
  }

  const medRiskList  = filtered.filter(a => a.riskLevel === 'MEDIUM')

  // ── Bulk rewrite with live progress ────────────────────────────────────
  const [bulkProgress, setBulkProgress] = useState(null) // { done, total, current }

  const rewriteAll = async (articles, label) => {
    setBulkProgress({ done: 0, total: articles.length, current: articles[0]?.title?.slice(0,50) || '' })
    for (let i = 0; i < articles.length; i++) {
      const a = articles[i]
      setBulkProgress({ done: i, total: articles.length, current: a.title?.slice(0,50) || '' })
      await rewriteArticle(a)
      await new Promise(r => setTimeout(r, 600))
    }
    setBulkProgress(null)
    showFlash(`✅ Bulk rewrite complete — ${articles.length} ${label} articles rewritten`)
  }

  // ── Filtering ───────────────────────────────────────────────────────────
  const allArticles = report?.articles || []
  const filtered = allArticles.filter(a => {
    const riskOk = riskFilter === 'ALL' ? true : riskFilter === 'CLEAN' ? a.issues?.length === 0 : a.riskLevel === riskFilter
    const typeOk = typeFilter === 'ALL' ? true : (a._type || 'newsArticle') === typeFilter
    return riskOk && typeOk
  })

  const highRiskList = filtered.filter(a => a.riskLevel === 'HIGH')
  const highRiskAll  = (report?.articles || []).filter(a => a.riskLevel === 'HIGH')
  const medRiskAll   = (report?.articles || []).filter(a => a.riskLevel === 'MEDIUM')

  // ── Category stats ──────────────────────────────────────────────────────
    const arts = allArticles.filter(a => (a._type || 'newsArticle') === t.key)
    return {
      ...t,
      total:  arts.length,
      high:   arts.filter(a => a.riskLevel === 'HIGH').length,
      med:    arts.filter(a => a.riskLevel === 'MEDIUM').length,
      clean:  arts.filter(a => a.issues?.length === 0).length,
    }
  })

  const compRate   = report?.complianceRate ?? null
  const compColor  = compRate == null ? GOLD : compRate >= 80 ? '#22c55e' : compRate >= 60 ? '#f59e0b' : '#ef4444'
  const highRiskList = filtered.filter(a => a.riskLevel === 'HIGH')

  return (
    <div>
      <style>{`
        .cp-table { width:100%; border-collapse:collapse; }
        .cp-table th { font-family:${MONO}; font-size:9px; color:#64748b; letter-spacing:.1em; text-transform:uppercase; padding:8px 12px; border-bottom:1px solid var(--border); text-align:left; background:rgba(0,0,0,.2); position:sticky; top:0; z-index:2; }
        .cp-table td { padding:9px 12px; border-bottom:1px solid rgba(30,41,59,.35); font-size:12px; vertical-align:top; }
        .cp-table tr:hover td { background:rgba(255,255,255,.02); }
        .cp-badge { display:inline-block; font-family:${MONO}; font-size:9px; font-weight:700; letter-spacing:.06em; padding:2px 7px; text-transform:uppercase; }
        .cp-btn { background:${GOLD}; color:#000; border:none; font-family:${BARL}; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:8px 18px; cursor:pointer; transition:opacity .12s; }
        .cp-btn:hover { opacity:.85; }
        .cp-btn:disabled { opacity:.4; cursor:not-allowed; }
        .cp-ghost { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:${MONO}; font-size:10px; padding:5px 10px; cursor:pointer; transition:all .12s; white-space:nowrap; }
        .cp-ghost:hover { border-color:${GOLD}; color:${GOLD}; }
        .cp-filter { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:${MONO}; font-size:10px; padding:5px 10px; cursor:pointer; transition:all .12s; }
        .cp-filter.active { background:rgba(200,146,42,.1); border-color:${GOLD}; color:${GOLD}; }
        .cp-rewrite-btn { border:none; font-family:${BARL}; font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:5px 10px; cursor:pointer; transition:all .12s; white-space:nowrap; }
        .cp-rewrite-btn.idle { background:rgba(200,146,42,.12); color:${GOLD}; border:1px solid rgba(200,146,42,.3); }
        .cp-rewrite-btn.idle:hover { background:rgba(200,146,42,.25); }
        .cp-rewrite-btn.running { background:rgba(245,158,11,.1); color:#f59e0b; border:1px solid rgba(245,158,11,.3); cursor:wait; }
        .cp-rewrite-btn.success { background:rgba(34,197,94,.1); color:#22c55e; border:1px solid rgba(34,197,94,.3); cursor:default; }
        .cp-rewrite-btn.error { background:rgba(239,68,68,.1); color:#ef4444; border:1px solid rgba(239,68,68,.3); }
        .cat-card { background:var(--bg2); border:1px solid var(--border); padding:14px 16px; transition:border-color .12s; cursor:pointer; }
        .cat-card:hover { border-color:rgba(200,146,42,.4); }
        .cat-card.active { border-color:${GOLD}; background:rgba(200,146,42,.05); }
      `}</style>

      {/* Flash */}
      {flash && (
        <div style={{ background: flash.startsWith('✅') ? 'rgba(34,197,94,.1)' : flash.startsWith('❌') ? 'rgba(239,68,68,.1)' : 'rgba(245,158,11,.08)', border: `1px solid ${flash.startsWith('✅') ? '#22c55e33' : flash.startsWith('❌') ? '#ef444433' : '#f59e0b33'}`, padding: '10px 24px', fontFamily: MONO, fontSize: 11, color: flash.startsWith('✅') ? '#22c55e' : flash.startsWith('❌') ? '#ef4444' : '#f59e0b' }}>
          {flash}
        </div>
      )}

      {/* Bulk progress bar */}
      {bulkProgress && (
        <div style={{ background:'rgba(200,146,42,.06)', borderBottom:'2px solid rgba(200,146,42,.3)', padding:'12px 24px' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
            <div style={{ fontFamily:MONO, fontSize:11, color:GOLD }}>
              ✍️ REWRITING {bulkProgress.done}/{bulkProgress.total}
            </div>
            <div style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              → {bulkProgress.current}
            </div>
          </div>
          <div style={{ height:4, background:'rgba(200,146,42,.15)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', background:GOLD, width:`${Math.round((bulkProgress.done / bulkProgress.total) * 100)}%`, transition:'width .3s' }} />
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', background:'rgba(0,0,0,.2)' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:BEBAS, fontSize:'1.3rem', color:GOLD, letterSpacing:'.06em' }}>COPYRIGHT COMPLIANCE</div>
          <div style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', marginTop:2 }}>Full article scan — all types, all risk levels. Runs daily 6am UTC.</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {compRate != null && (
            <div style={{ textAlign:'center', padding:'6px 16px', background:'rgba(0,0,0,.3)', border:`1px solid ${compColor}44` }}>
              <div style={{ fontFamily:BEBAS, fontSize:'1.8rem', color:compColor, lineHeight:1 }}>{compRate}%</div>
              <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', letterSpacing:'.08em' }}>COMPLIANT</div>
            </div>
          )}
          <button className="cp-btn" onClick={runReview} disabled={running || !!bulkProgress}>
            {running ? '⏳ SCANNING…' : '🔍 SCAN ALL ARTICLES'}
          </button>
          {report && highRiskAll.length > 0 && (
            <button className="cp-btn" style={{ background:'#ef4444' }}
              onClick={() => rewriteAll(highRiskAll, 'HIGH-RISK')}
              disabled={running || !!bulkProgress}>
              ✍️ FIX ALL HIGH ({highRiskAll.length})
            </button>
          )}
          {report && medRiskAll.length > 0 && (
            <button className="cp-btn" style={{ background:'#d97706' }}
              onClick={() => rewriteAll(medRiskAll, 'MEDIUM-RISK')}
              disabled={running || !!bulkProgress}>
              ✍️ FIX ALL MEDIUM ({medRiskAll.length})
            </button>
          )}
        </div>
      </div>

      {!report && !running && (
        <div style={{ padding:48, textAlign:'center', fontFamily:MONO, fontSize:12, color:'#6b7280' }}>Loading scan results…</div>
      )}

      {running && !report && (
        <div style={{ padding:48, textAlign:'center', fontFamily:MONO, fontSize:12, color:'#f59e0b' }}>⏳ Scanning articles…</div>
      )}

      {report && (
        <>
          {/* Stats row */}
          <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            {[
              ['Scanned',    report.scanned,          '#9ca3af'],
              ['Clean',      report.clean,            '#22c55e'],
              ['High Risk',  report.highRisk,         '#ef4444'],
              ['Med Risk',   report.medRisk,          '#f59e0b'],
              ['Low Risk',   report.lowRisk,          '#86efac'],
              ['Old Struct', report.oldStructureCount,'#f97316'],
            ].map(([l,v,c]) => (
              <div key={l} style={{ textAlign:'center', padding:'8px 14px', background:'rgba(0,0,0,.2)', border:'1px solid var(--border)' }}>
                <div style={{ fontFamily:BEBAS, fontSize:'1.4rem', color:c, lineHeight:1 }}>{v}</div>
                <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', letterSpacing:'.06em', textTransform:'uppercase', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Category breakdown cards */}
          <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontFamily:MONO, fontSize:9, color:'#6b7280', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:10 }}>BY CONTENT TYPE</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8 }}>
              <div className={'cat-card' + (typeFilter==='ALL'?' active':'')} onClick={() => setTypeFilter('ALL')}>
                <div style={{ fontFamily:MONO, fontSize:10, color: typeFilter==='ALL' ? GOLD : '#9ca3af', marginBottom:6 }}>📋 ALL TYPES</div>
                <div style={{ fontFamily:BEBAS, fontSize:'1.5rem', color:'var(--text)', lineHeight:1 }}>{allArticles.length}</div>
                <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:4 }}>
                  <span style={{ color:'#ef4444' }}>■ {report.highRisk}H</span>{' '}
                  <span style={{ color:'#f59e0b' }}>■ {report.medRisk}M</span>{' '}
                  <span style={{ color:'#22c55e' }}>■ {report.clean}C</span>
                </div>
              </div>
              {catStats.map(t => (
                <div key={t.key} className={'cat-card' + (typeFilter===t.key?' active':'')} onClick={() => setTypeFilter(t.key)}>
                  <div style={{ fontFamily:MONO, fontSize:10, color: typeFilter===t.key ? GOLD : '#9ca3af', marginBottom:6 }}>{t.icon} {t.label.toUpperCase()}</div>
                  <div style={{ fontFamily:BEBAS, fontSize:'1.5rem', color:'var(--text)', lineHeight:1 }}>{t.total}</div>
                  <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:4 }}>
                    <span style={{ color:'#ef4444' }}>■ {t.high}H</span>{' '}
                    <span style={{ color:'#f59e0b' }}>■ {t.med}M</span>{' '}
                    <span style={{ color:'#22c55e' }}>■ {t.clean}C</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Old structure warning */}
          {report.oldStructureCount > 0 && (
            <div style={{ margin:'0', padding:'12px 24px', background:'rgba(249,115,22,.05)', borderBottom:'2px solid rgba(249,115,22,.3)' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'#f97316', letterSpacing:'.06em', textTransform:'uppercase' }}>
                    ⚠ {report.oldStructureCount} articles use pre-update structure — flagged for rewrite
                  </div>
                  <div style={{ fontFamily:MONO, fontSize:10, color:'#9ca3af', marginTop:4 }}>
                    These use old headings (Background and Context / Industry Impact / What to Watch Next) written before the copyright policy update.
                  </div>
                </div>
                <button className="cp-btn" style={{ background:'#f97316', fontSize:11 }}
                  onClick={() => { setRiskFilter('HIGH'); setTypeFilter('ALL') }}>
                  SHOW OLD STRUCTURE ARTICLES
                </button>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div style={{ padding:'10px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', background:'rgba(0,0,0,.1)' }}>
            <span style={{ fontFamily:MONO, fontSize:10, color:'#4b5563', marginRight:4 }}>RISK:</span>
            {[
              ['ALL',    filtered.length,       '#9ca3af'],
              ['HIGH',   report.highRisk,       '#ef4444'],
              ['MEDIUM', report.medRisk,        '#f59e0b'],
              ['LOW',    report.lowRisk,        '#22c55e'],
              ['CLEAN',  report.clean,          '#3b82f6'],
            ].map(([f, count, color]) => (
              <button key={f} className={'cp-filter' + (riskFilter===f?' active':'')} onClick={() => setRiskFilter(f)}
                style={{ borderColor: riskFilter===f ? color : undefined, color: riskFilter===f ? color : undefined }}>
                {f} ({count})
              </button>
            ))}
            <div style={{ flex:1 }} />
            <span style={{ fontFamily:MONO, fontSize:10, color:'#374151' }}>
              {filtered.length} articles · {report.date}
            </span>
          </div>

          {/* Articles table */}
          <div style={{ overflowX:'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:48, fontFamily:MONO, fontSize:12, color:'#22c55e' }}>
                ✅ No articles match this filter. Looking good.
              </div>
            ) : (
              <table className="cp-table">
                <thead>
                  <tr>
                    <th style={{ width:24 }}>#</th>
                    <th>Article</th>
                    <th>Type</th>
                    <th>Risk</th>
                    <th>Issues Found</th>
                    <th>Words</th>
                    <th>Source</th>
                    <th style={{ minWidth:160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((article, idx) => {
                    const isRW    = rewriting[article._id]
                    const rwState = rewritten[article._id]
                    const rwClass = isRW ? 'running' : rwState === 'success' ? 'success' : rwState === 'error' ? 'error' : 'idle'
                    const rwLabel = isRW ? '⏳ REWRITING…' : rwState === 'success' ? '✅ REWRITTEN' : rwState === 'error' ? '❌ RETRY' : '✍️ REWRITE'

                    return (
                      <tr key={article._id} style={{ background: article.riskLevel==='HIGH' ? 'rgba(239,68,68,.02)' : 'transparent' }}>
                        <td style={{ fontFamily:MONO, fontSize:10, color:'#374151', textAlign:'center' }}>{idx+1}</td>

                        {/* Title + link */}
                        <td style={{ maxWidth:280 }}>
                          <div style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
                            <div style={{ flex:1 }}>
                              <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer"
                                style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'var(--text)', textDecoration:'none', lineHeight:1.3, display:'block' }}>
                                {article.title.slice(0,80)}{article.title.length>80?'…':''}
                              </a>
                              <div style={{ fontFamily:MONO, fontSize:9, color:'#374151', marginTop:3 }}>
                                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '—'}
                                {article.externalUrl && (
                                  <a href={article.externalUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ color:GOLD, marginLeft:8, textDecoration:'none' }}>source ↗</a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td>
                          <span style={{ fontFamily:MONO, fontSize:9, color:'#6b7280', border:'1px solid var(--border)', padding:'2px 5px', letterSpacing:'.06em' }}>
                            {TYPES.find(t=>t.key===(article._type||'newsArticle'))?.icon || '📄'} {(article._type||'news').replace('Article','').replace('Post','').replace('firearm','').replace('Release','rel')}
                          </span>
                        </td>

                        {/* Risk */}
                        <td>
                          <span className="cp-badge" style={{ background:RISK_BG[article.riskLevel]||RISK_BG.LOW, color:RISK_COLOR[article.riskLevel]||RISK_COLOR.LOW }}>
                            {article.riskLevel}
                          </span>
                          <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:3 }}>{article.riskScore}/100</div>
                        </td>

                        {/* Issues */}
                        <td style={{ maxWidth:260 }}>
                          {(article.issues||[]).length === 0 ? (
                            <span style={{ fontFamily:MONO, fontSize:10, color:'#22c55e' }}>✅ clean</span>
                          ) : (
                            <>
                              {(article.issues||[]).slice(0,2).map((issue,i) => (
                                <div key={i} style={{ fontFamily:MONO, fontSize:10, color:issue.severity==='high'?'#ef4444':issue.severity==='medium'?'#f59e0b':'#6b7280', marginBottom:2, display:'flex', gap:4, lineHeight:1.3 }}>
                                  <span style={{ flexShrink:0 }}>{issue.severity==='high'?'🔴':'🟡'}</span>
                                  <span>{issue.msg.slice(0,60)}{issue.msg.length>60?'…':''}</span>
                                </div>
                              ))}
                              {article.issues.length > 2 && (
                                <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:2 }}>+{article.issues.length-2} more</div>
                              )}
                            </>
                          )}
                        </td>

                        {/* Words */}
                        <td style={{ fontFamily:MONO, fontSize:11, color:article.wordCount>900?'#f59e0b':'#6b7280', whiteSpace:'nowrap' }}>
                          {article.wordCount}w
                        </td>

                        {/* Source */}
                        <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {article.source || '—'}
                        </td>

                        {/* Actions */}
                        <td>
                          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                            {article.issues?.length > 0 && (
                              <button className={'cp-rewrite-btn ' + rwClass} disabled={isRW || rwState==='success'}
                                onClick={() => rewriteArticle(article)}>
                                {rwLabel}
                              </button>
                            )}
                            {article.slug && (
                              <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer">
                                <button className="cp-ghost" style={{ fontSize:9, padding:'3px 8px', width:'100%' }}>VIEW ↗</button>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
