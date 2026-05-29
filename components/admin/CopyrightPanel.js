'use client'
import { useState, useEffect } from 'react'

const GOLD  = '#C8922A'
const MONO  = "'IBM Plex Mono',monospace"
const BEBAS = "'Bebas Neue',cursive"
const BARL  = "'Barlow Condensed',sans-serif"

const RISK_COLOR = { HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#22c55e', CLEAN:'#3b82f6' }
const RISK_BG    = { HIGH:'rgba(239,68,68,.1)', MEDIUM:'rgba(245,158,11,.08)', LOW:'rgba(34,197,94,.08)', CLEAN:'rgba(59,130,246,.08)' }

export default function CopyrightPanel({ adminKey }) {
  const H = { 'x-admin-key': adminKey }
  const [report, setReport]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [filter, setFilter]   = useState('ALL')
  const [flash, setFlash]     = useState('')

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 4000) }

  const loadLatestReport = async () => {
    setLoading(true)
    try {
      // Try to load from the cronRunStore via cron-status
      const res = await fetch('/api/cron/copyright-review', { headers: H })
      if (res.ok) {
        const d = await res.json()
        setReport(d)
      }
    } catch(e) {}
    setLoading(false)
  }

  const runReview = async () => {
    setRunning(true)
    showFlash('⏳ Running copyright review — scanning last 48 hours of articles...')
    try {
      const res = await fetch('/api/cron/copyright-review', { headers: H })
      const d = await res.json()
      setReport(d)
      showFlash(`✅ Review complete — ${d.complianceRate}% compliant, ${d.highRisk} high-risk articles found`)
    } catch(e) {
      showFlash('❌ Review failed: ' + e.message)
    }
    setRunning(false)
  }

  useEffect(() => { loadLatestReport() }, [])

  const filtered = (report?.articles || []).filter(a => {
    if (filter === 'ALL') return a.issues?.length > 0
    return a.riskLevel === filter
  })

  const compRate = report?.complianceRate ?? null
  const compColor = compRate == null ? GOLD : compRate >= 80 ? '#22c55e' : compRate >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{ padding:'0' }}>
      <style>{`
        .cp-table { width:100%; border-collapse:collapse; }
        .cp-table th { font-family:${MONO}; font-size:9px; color:#64748b; letter-spacing:.1em; text-transform:uppercase; padding:8px 12px; border-bottom:1px solid var(--border); text-align:left; background:var(--bg2); }
        .cp-table td { padding:9px 12px; border-bottom:1px solid rgba(30,41,59,.4); font-size:12px; vertical-align:top; }
        .cp-badge { display:inline-block; font-family:${MONO}; font-size:9px; font-weight:700; letter-spacing:.06em; padding:2px 7px; text-transform:uppercase; }
        .cp-btn { background:${GOLD}; color:#000; border:none; font-family:${BARL}; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:8px 18px; cursor:pointer; }
        .cp-btn:hover { opacity:.85; }
        .cp-btn:disabled { opacity:.4; cursor:not-allowed; }
        .cp-ghost { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:${MONO}; font-size:11px; padding:7px 12px; cursor:pointer; }
        .cp-ghost:hover { border-color:${GOLD}; color:${GOLD}; }
        .cp-filter { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:${MONO}; font-size:10px; padding:5px 10px; cursor:pointer; transition:all .12s; }
        .cp-filter.active { background:rgba(200,146,42,.1); border-color:${GOLD}; color:${GOLD}; }
      `}</style>

      {/* Header */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', background:'rgba(0,0,0,.2)' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:BEBAS, fontSize:'1.3rem', color:GOLD, letterSpacing:'.06em' }}>COPYRIGHT COMPLIANCE REVIEW</div>
          <div style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', marginTop:2 }}>
            Scans last 48h of articles for copyright risk signals. Runs daily at 6am UTC.
          </div>
        </div>
        {flash && (
          <div style={{ fontFamily:MONO, fontSize:11, padding:'6px 12px', border:'1px solid', borderColor: flash.startsWith('✅') ? '#22c55e' : flash.startsWith('❌') ? '#ef4444' : GOLD, color: flash.startsWith('✅') ? '#22c55e' : flash.startsWith('❌') ? '#ef4444' : GOLD, background: flash.startsWith('✅') ? 'rgba(34,197,94,.06)' : flash.startsWith('❌') ? 'rgba(239,68,68,.06)' : 'rgba(200,146,42,.06)' }}>
            {flash}
          </div>
        )}
        <button className="cp-ghost" onClick={loadLatestReport} disabled={loading}>↻ Refresh</button>
        <button className="cp-btn" onClick={runReview} disabled={running}>
          {running ? '⏳ Scanning...' : '▶ Run Review Now'}
        </button>
      </div>

      {loading && !report && (
        <div style={{ textAlign:'center', padding:60, fontFamily:MONO, fontSize:12, color:'#4b5563' }}>
          Loading latest report…
        </div>
      )}

      {report && (
        <>
          {/* Stats row */}
          <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            {/* Compliance score */}
            <div style={{ padding:'12px 20px', background:'var(--bg2)', border:'1px solid var(--border)', textAlign:'center', minWidth:100 }}>
              <div style={{ fontFamily:BEBAS, fontSize:'2.4rem', color:compColor, lineHeight:1 }}>{report.complianceRate}%</div>
              <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:2 }}>COMPLIANCE</div>
            </div>
            {[
              { val:report.scanned,    label:'Scanned',         color:'#9ca3af' },
              { val:report.clean,      label:'Clean',            color:'#22c55e' },
              { val:report.highRisk,   label:'High Risk',        color:'#ef4444' },
              { val:report.medRisk,    label:'Medium Risk',      color:'#f59e0b' },
              { val:report.lowRisk,    label:'Low Risk',         color:'#84cc16' },
              { val:report.oldStructureCount, label:'Old Structure', color:'#f97316' },
              { val:report.noAnalysisCount,   label:'No Analysis',   color:'#a78bfa' },
            ].map(s => (
              <div key={s.label} style={{ padding:'10px 16px', background:'var(--bg2)', border:'1px solid var(--border)', textAlign:'center', minWidth:80 }}>
                <div style={{ fontFamily:BEBAS, fontSize:'1.6rem', color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontFamily:MONO, fontSize:8, color:'#4b5563', marginTop:2, textTransform:'uppercase', letterSpacing:'.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Policy reminder */}
          <div style={{ margin:'16px 24px', padding:'12px 16px', background:'rgba(200,146,42,.04)', border:'1px solid rgba(200,146,42,.15)', borderLeft:'4px solid '+GOLD }}>
            <div style={{ fontFamily:BARL, fontSize:12, fontWeight:700, color:GOLD, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:8 }}>ACTIVE COPYRIGHT POLICY RULES</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'4px 24px' }}>
              {[
                'Never copy or republish articles from third-party sources',
                'No paragraph-by-paragraph rewrites of a single source',
                'Do not preserve original article structure, flow, or wording',
                'Use multiple sources whenever possible',
                'Extract facts only — not original author expression',
                'Add original DownRange analysis and commentary',
                'Clearly identify and link all original sources',
                'Article must not replace the original — readers benefit from visiting source',
                'Articles: Lead → Key Details → Why It Matters → DownRange Analysis → Source',
                'Max 400 chars of source material injected into any prompt',
              ].map((rule, i) => (
                <div key={i} style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', display:'flex', gap:6, alignItems:'flex-start' }}>
                  <span style={{ color:GOLD, flexShrink:0 }}>{i+1}.</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action needed callout */}
          {report.oldStructureCount > 0 && (
            <div style={{ margin:'0 24px 16px', padding:'12px 16px', background:'rgba(249,115,22,.06)', border:'1px solid rgba(249,115,22,.3)', borderLeft:'4px solid #f97316' }}>
              <div style={{ fontFamily:BARL, fontSize:12, fontWeight:700, color:'#f97316', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>
                ⚠ ACTION REQUIRED — {report.oldStructureCount} articles use old pre-update structure
              </div>
              <div style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', lineHeight:1.6 }}>
                These articles contain old sections (Background and Context / Industry Impact / What to Watch Next) written before the copyright policy update.
                Run Quality Rewrite or Backfill from Content Hub to regenerate them with the compliant structure.
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontFamily:MONO, fontSize:10, color:'#4b5563', marginRight:4 }}>FILTER:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
              <button key={f} className={'cp-filter' + (filter===f?' active':'')} onClick={() => setFilter(f)}>
                {f} {f==='ALL' ? `(${(report.articles||[]).filter(a=>a.issues?.length>0).length})` : f==='HIGH' ? `(${report.highRisk})` : f==='MEDIUM' ? `(${report.medRisk})` : `(${report.lowRisk})`}
              </button>
            ))}
            <div style={{ flex:1 }} />
            <span style={{ fontFamily:MONO, fontSize:10, color:'#374151' }}>
              {report.scanned} articles scanned · Last 48 hours · {report.date}
            </span>
          </div>

          {/* Articles table */}
          <div style={{ overflowX:'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:48, fontFamily:MONO, fontSize:12, color:'#22c55e' }}>
                ✅ No {filter === 'ALL' ? 'flagged' : filter.toLowerCase() + '-risk'} articles found. Compliance looking good.
              </div>
            ) : (
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Risk</th>
                    <th>Issues Found</th>
                    <th>Words</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(article => (
                    <tr key={article._id} style={{ background: article.riskLevel==='HIGH' ? 'rgba(239,68,68,.03)' : 'transparent' }}>
                      <td style={{ maxWidth:280 }}>
                        <div style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2 }}>
                          {article.title.slice(0,75)}{article.title.length > 75 ? '…' : ''}
                        </div>
                        <div style={{ fontFamily:MONO, fontSize:9, color:'#374151' }}>
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td>
                        <span className="cp-badge" style={{ background: RISK_BG[article.riskLevel]||RISK_BG.LOW, color: RISK_COLOR[article.riskLevel]||RISK_COLOR.LOW }}>
                          {article.riskLevel}
                        </span>
                        <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:3 }}>
                          Score: {article.riskScore}/100
                        </div>
                      </td>
                      <td style={{ maxWidth:300 }}>
                        {(article.issues||[]).map((issue, i) => (
                          <div key={i} style={{ fontFamily:MONO, fontSize:10, color: issue.severity==='high' ? '#ef4444' : issue.severity==='medium' ? '#f59e0b' : '#6b7280', marginBottom:3, display:'flex', gap:5 }}>
                            <span style={{ flexShrink:0 }}>{issue.severity==='high' ? '🔴' : issue.severity==='medium' ? '🟡' : '🟢'}</span>
                            <span>{issue.msg}</span>
                          </div>
                        ))}
                      </td>
                      <td style={{ fontFamily:MONO, fontSize:11, color: article.wordCount > 900 ? '#f59e0b' : '#6b7280', whiteSpace:'nowrap' }}>
                        {article.wordCount}w
                      </td>
                      <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {article.source || '—'}
                      </td>
                      <td>
                        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                          {article.slug && (
                            <a href={`/news/${article.slug}`} target="_blank" rel="noopener noreferrer">
                              <button className="cp-ghost" style={{ fontSize:9, padding:'3px 8px', width:'100%' }}>View ↗</button>
                            </a>
                          )}
                          {article.externalUrl && (
                            <a href={article.externalUrl} target="_blank" rel="noopener noreferrer">
                              <button className="cp-ghost" style={{ fontSize:9, padding:'3px 8px', width:'100%' }}>Source ↗</button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
