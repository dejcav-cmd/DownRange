'use client'
import { useState, useEffect, useCallback } from 'react'

const GOLD  = '#C8922A'
const MONO  = "'IBM Plex Mono',monospace"
const BEBAS = "'Bebas Neue',cursive"
const BARL  = "'Barlow Condensed',sans-serif"

const RISK_COLOR = { HIGH:'#ef4444', MEDIUM:'#f59e0b', LOW:'#22c55e', CLEAN:'#3b82f6' }
const RISK_BG    = { HIGH:'rgba(239,68,68,.12)', MEDIUM:'rgba(245,158,11,.1)', LOW:'rgba(34,197,94,.1)', CLEAN:'rgba(59,130,246,.1)' }

const TYPES = [
  { key:'newsArticle',    label:'News',     icon:'📰' },
  { key:'blogPost',       label:'Blog',     icon:'✍️' },
  { key:'firearmRelease', label:'Releases', icon:'🔫' },
  { key:'review',         label:'Reviews',  icon:'⭐' },
]

export default function CopyrightPanel({ adminKey }) {
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  const [articles, setArticles]       = useState([])   // ALL scanned articles
  const [scanning, setScanning]       = useState(false)
  const [scanDate, setScanDate]       = useState('')
  const [stats, setStats]             = useState(null)
  const [riskFilter, setRiskFilter]   = useState('ALL')
  const [typeFilter, setTypeFilter]   = useState('ALL')
  const [rewriting, setRewriting]     = useState({})   // { [_id]: true }
  const [rwStatus, setRwStatus]       = useState({})   // { [_id]: 'success'|'error' }
  const [bulkProgress, setBulkProgress] = useState(null)
  const [flash, setFlash]             = useState({ msg:'', type:'info' })

  const showFlash = (msg, type='info', dur=6000) => {
    setFlash({ msg, type })
    setTimeout(() => setFlash({ msg:'', type:'info' }), dur)
  }

  // ── Scan ──────────────────────────────────────────────────────────────────
  const runScan = useCallback(async () => {
    setScanning(true)
    showFlash('Scanning all articles…', 'info', 30000)
    try {
      const res = await fetch('/api/cron/copyright-review?full=1', { headers: H })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const d = await res.json()
      const all = d.articles || []
      setArticles(all)
      setScanDate(d.date || '')
      setStats({
        scanned: d.scanned || all.length,
        high:    d.highRisk || 0,
        med:     d.medRisk  || 0,
        low:     d.lowRisk  || 0,
        clean:   d.clean    || 0,
        rate:    d.complianceRate || 0,
      })
      showFlash(`Scan complete — ${all.length} articles · ${d.complianceRate}% compliant · ${d.highRisk} high-risk`, 'ok')
    } catch(e) {
      showFlash('Scan failed: ' + e.message, 'err')
    }
    setScanning(false)
  }, [adminKey])

  useEffect(() => { runScan() }, [])

  // ── Single rewrite ────────────────────────────────────────────────────────
  const rewriteOne = async (article) => {
    setRewriting(r => ({ ...r, [article._id]: true }))
    showFlash(`Rewriting: ${article.title.slice(0,60)}…`, 'info', 20000)
    try {
      const res = await fetch('/api/admin/quality-rewrite-single', {
        method: 'POST', headers: H,
        body: JSON.stringify({ id: article._id, type: article._type || 'newsArticle' }),
      })
      const d = await res.json()
      if (d.ok) {
        setRwStatus(r => ({ ...r, [article._id]: 'success' }))
        showFlash(`✅ Rewritten: ${article.title.slice(0,60)}`, 'ok')
      } else {
        setRwStatus(r => ({ ...r, [article._id]: 'error' }))
        showFlash(`❌ Failed: ${d.error || 'unknown'}`, 'err')
      }
    } catch(e) {
      setRwStatus(r => ({ ...r, [article._id]: 'error' }))
      showFlash('❌ Error: ' + e.message, 'err')
    }
    setRewriting(r => ({ ...r, [article._id]: false }))
  }

  // ── Bulk rewrite ──────────────────────────────────────────────────────────
  const rewriteBulk = async (list, label) => {
    if (!list.length) return
    setBulkProgress({ done: 0, total: list.length, label, current: '' })
    for (let i = 0; i < list.length; i++) {
      setBulkProgress({ done: i, total: list.length, label, current: list[i].title?.slice(0,55) || '' })
      await rewriteOne(list[i])
      await new Promise(r => setTimeout(r, 700))
    }
    setBulkProgress(null)
    showFlash(`✅ Bulk complete — ${list.length} ${label} articles rewritten`, 'ok')
  }

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = articles.filter(a => {
    const byRisk = riskFilter === 'ALL'   ? true
                 : riskFilter === 'CLEAN' ? (a.issues?.length === 0)
                 : a.riskLevel === riskFilter
    const byType = typeFilter === 'ALL'   ? true
                 : (a._type || 'newsArticle') === typeFilter
    return byRisk && byType
  })

  const byRisk = (level) => articles.filter(a => a.riskLevel === level)
  const highList  = byRisk('HIGH')
  const medList   = byRisk('MEDIUM')
  const lowList   = byRisk('LOW')
  const cleanList = articles.filter(a => a.issues?.length === 0)

  const compColor = !stats ? GOLD : stats.rate >= 80 ? '#22c55e' : stats.rate >= 60 ? '#f59e0b' : '#ef4444'

  const flashBg    = flash.type==='ok'  ? 'rgba(34,197,94,.08)'   : flash.type==='err' ? 'rgba(239,68,68,.08)'   : 'rgba(245,158,11,.06)'
  const flashBord  = flash.type==='ok'  ? 'rgba(34,197,94,.25)'   : flash.type==='err' ? 'rgba(239,68,68,.25)'   : 'rgba(245,158,11,.2)'
  const flashColor = flash.type==='ok'  ? '#22c55e'               : flash.type==='err' ? '#ef4444'               : '#f59e0b'

  return (
    <div>
      <style>{`
        .cp-tbl { width:100%; border-collapse:collapse; }
        .cp-tbl th { font-family:${MONO}; font-size:9px; color:#64748b; letter-spacing:.1em; text-transform:uppercase; padding:9px 12px; border-bottom:2px solid var(--border); text-align:left; background:rgba(0,0,0,.25); white-space:nowrap; }
        .cp-tbl td { padding:9px 12px; border-bottom:1px solid rgba(255,255,255,.04); vertical-align:middle; }
        .cp-tbl tbody tr:hover td { background:rgba(255,255,255,.025); }
        .badge { display:inline-block; font-family:${MONO}; font-size:9px; font-weight:700; letter-spacing:.07em; padding:2px 8px; text-transform:uppercase; border-radius:2px; }
        .rw-btn { border:1px solid; font-family:${BARL}; font-size:12px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; padding:5px 12px; cursor:pointer; white-space:nowrap; transition:all .12s; width:100%; }
        .rw-idle    { background:rgba(200,146,42,.1);  color:${GOLD};    border-color:rgba(200,146,42,.35); }
        .rw-idle:hover { background:rgba(200,146,42,.22); }
        .rw-running { background:rgba(245,158,11,.08); color:#f59e0b;   border-color:rgba(245,158,11,.3); cursor:wait; }
        .rw-success { background:rgba(34,197,94,.08);  color:#22c55e;   border-color:rgba(34,197,94,.3);  cursor:default; }
        .rw-error   { background:rgba(239,68,68,.08);  color:#ef4444;   border-color:rgba(239,68,68,.3); }
        .view-btn { display:block; background:none; border:1px solid var(--border); color:#6b7280; font-family:${MONO}; font-size:9px; padding:3px 8px; cursor:pointer; width:100%; text-align:center; margin-top:4px; transition:all .12s; }
        .view-btn:hover { border-color:${GOLD}; color:${GOLD}; }
        .flt-btn { background:none; border:1px solid var(--border); color:#6b7280; font-family:${MONO}; font-size:10px; padding:5px 11px; cursor:pointer; transition:all .12s; }
        .flt-btn:hover { border-color:${GOLD}; color:${GOLD}; }
        .flt-btn.on { background:rgba(200,146,42,.1); border-color:${GOLD}; color:${GOLD}; }
        .bulk-btn { border:none; font-family:${BARL}; font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase; padding:7px 14px; cursor:pointer; transition:opacity .12s; white-space:nowrap; }
        .bulk-btn:disabled { opacity:.35; cursor:not-allowed; }
      `}</style>

      {/* Flash bar */}
      {flash.msg && (
        <div style={{ padding:'9px 24px', background:flashBg, borderBottom:`1px solid ${flashBord}`, fontFamily:MONO, fontSize:11, color:flashColor }}>
          {flash.msg}
        </div>
      )}

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
          <div style={{ height:3, background:'rgba(200,146,42,.15)', overflow:'hidden' }}>
            <div style={{ height:'100%', background:GOLD, width:`${Math.round((bulkProgress.done/bulkProgress.total)*100)}%`, transition:'width .4s ease' }} />
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap', background:'rgba(0,0,0,.2)' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:BEBAS, fontSize:'1.25rem', color:GOLD, letterSpacing:'.06em' }}>COPYRIGHT COMPLIANCE</div>
          <div style={{ fontFamily:MONO, fontSize:10, color:'#4b5563', marginTop:1 }}>Full scan across all content types · runs daily 6am UTC</div>
        </div>
        {stats && (
          <div style={{ textAlign:'center', padding:'5px 14px', background:'rgba(0,0,0,.3)', border:`1px solid ${compColor}33` }}>
            <div style={{ fontFamily:BEBAS, fontSize:'1.6rem', color:compColor, lineHeight:1 }}>{stats.rate}%</div>
            <div style={{ fontFamily:MONO, fontSize:8, color:'#4b5563', letterSpacing:'.08em' }}>COMPLIANT</div>
          </div>
        )}
        <button className="bulk-btn" style={{ background:GOLD, color:'#000' }} onClick={runScan} disabled={scanning || !!bulkProgress}>
          {scanning ? '⏳ SCANNING…' : '🔍 SCAN ALL'}
        </button>
      </div>

      {/* Stats + bulk action buttons */}
      {stats && (
        <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          {[
            { label:'Scanned', val:stats.scanned, color:'#9ca3af', list:null },
            { label:'HIGH',    val:stats.high,    color:'#ef4444', list:highList },
            { label:'MEDIUM',  val:stats.med,     color:'#f59e0b', list:medList },
            { label:'LOW',     val:stats.low,     color:'#22c55e', list:lowList },
            { label:'CLEAN',   val:stats.clean,   color:'#3b82f6', list:cleanList },
          ].map(({ label, val, color, list }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'rgba(0,0,0,.2)', border:'1px solid var(--border)' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:BEBAS, fontSize:'1.3rem', color, lineHeight:1 }}>{val}</div>
                <div style={{ fontFamily:MONO, fontSize:8, color:'#4b5563', letterSpacing:'.07em' }}>{label}</div>
              </div>
              {list && list.length > 0 && label !== 'CLEAN' && (
                <button className="bulk-btn"
                  style={{ background: label==='HIGH'?'rgba(239,68,68,.15)':label==='MEDIUM'?'rgba(245,158,11,.12)':'rgba(34,197,94,.1)', color, border:`1px solid ${color}44`, fontSize:10, padding:'4px 9px' }}
                  disabled={!!bulkProgress || scanning}
                  onClick={() => rewriteBulk(list, label)}>
                  ✍ FIX ALL
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {articles.length > 0 && (
        <div style={{ padding:'10px 24px', borderBottom:'1px solid var(--border)', display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', background:'rgba(0,0,0,.1)' }}>
          <span style={{ fontFamily:MONO, fontSize:10, color:'#374151', marginRight:4 }}>RISK:</span>
          {[['ALL', articles.length, '#9ca3af'], ['HIGH', stats?.high||0, '#ef4444'], ['MEDIUM', stats?.med||0, '#f59e0b'], ['LOW', stats?.low||0, '#22c55e'], ['CLEAN', stats?.clean||0, '#3b82f6']].map(([f,count,col]) => (
            <button key={f} className={'flt-btn'+(riskFilter===f?' on':'')} onClick={() => setRiskFilter(f)}
              style={riskFilter===f?{borderColor:col,color:col}:{}}>{f} ({count})</button>
          ))}
          <span style={{ fontFamily:MONO, fontSize:10, color:'#374151', marginLeft:8, marginRight:4 }}>TYPE:</span>
          {[['ALL','All'], ...TYPES.map(t=>[t.key,t.icon+' '+t.label])].map(([k,l]) => (
            <button key={k} className={'flt-btn'+(typeFilter===k?' on':'')} onClick={() => setTypeFilter(k)}>{l}</button>
          ))}
          <span style={{ fontFamily:MONO, fontSize:10, color:'#374151', marginLeft:'auto' }}>
            {filtered.length} articles · {scanDate}
          </span>
        </div>
      )}

      {/* Table */}
      {scanning && articles.length === 0 ? (
        <div style={{ padding:48, textAlign:'center', fontFamily:MONO, fontSize:12, color:'#f59e0b' }}>⏳ Scanning…</div>
      ) : articles.length === 0 ? (
        <div style={{ padding:48, textAlign:'center', fontFamily:MONO, fontSize:12, color:'#4b5563' }}>No scan data yet. Click SCAN ALL.</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', fontFamily:MONO, fontSize:12, color:'#22c55e' }}>✅ No articles in this filter.</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table className="cp-tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Article</th>
                <th>Type</th>
                <th>Risk</th>
                <th>Issues</th>
                <th>Words</th>
                <th>Source</th>
                <th style={{ minWidth:130 }}>Rewrite</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, idx) => {
                const isRW  = !!rewriting[a._id]
                const state = rwStatus[a._id]
                const cls   = isRW ? 'rw-running' : state==='success' ? 'rw-success' : state==='error' ? 'rw-error' : 'rw-idle'
                const lbl   = isRW ? '⏳ REWRITING…' : state==='success' ? '✅ DONE' : state==='error' ? '❌ RETRY' : '✍️ REWRITE'

                return (
                  <tr key={a._id}>
                    <td style={{ fontFamily:MONO, fontSize:10, color:'#374151', textAlign:'center', width:32 }}>{idx+1}</td>

                    <td style={{ maxWidth:300 }}>
                      <a href={`/news/${a.slug}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily:BARL, fontSize:13, fontWeight:700, color:'var(--text)', textDecoration:'none', lineHeight:1.3, display:'block' }}>
                        {a.title?.slice(0,75)}{(a.title?.length||0)>75?'…':''}
                      </a>
                      <div style={{ fontFamily:MONO, fontSize:9, color:'#374151', marginTop:2 }}>
                        {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}
                        {a.externalUrl && (
                          <a href={a.externalUrl} target="_blank" rel="noopener noreferrer"
                            style={{ color:GOLD, marginLeft:8, textDecoration:'none' }}>src ↗</a>
                        )}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontFamily:MONO, fontSize:9, color:'#6b7280', border:'1px solid var(--border)', padding:'2px 5px' }}>
                        {TYPES.find(t=>t.key===(a._type||'newsArticle'))?.icon||'📄'}
                      </span>
                    </td>

                    <td>
                      <span className="badge" style={{ background:RISK_BG[a.riskLevel]||RISK_BG.LOW, color:RISK_COLOR[a.riskLevel]||RISK_COLOR.LOW }}>
                        {a.riskLevel||'LOW'}
                      </span>
                      <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:2 }}>{a.riskScore}/100</div>
                    </td>

                    <td style={{ maxWidth:240 }}>
                      {!a.issues?.length ? (
                        <span style={{ fontFamily:MONO, fontSize:10, color:'#22c55e' }}>✅ clean</span>
                      ) : (
                        <>
                          {a.issues.slice(0,2).map((iss,i) => (
                            <div key={i} style={{ fontFamily:MONO, fontSize:10, color:iss.severity==='high'?'#ef4444':'#f59e0b', marginBottom:2, lineHeight:1.3 }}>
                              {iss.severity==='high'?'🔴':'🟡'} {iss.msg?.slice(0,55)}{(iss.msg?.length||0)>55?'…':''}
                            </div>
                          ))}
                          {a.issues.length>2 && <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563' }}>+{a.issues.length-2} more</div>}
                        </>
                      )}
                    </td>

                    <td style={{ fontFamily:MONO, fontSize:11, color:a.wordCount>900?'#f59e0b':'#6b7280', whiteSpace:'nowrap' }}>
                      {a.wordCount||0}w
                    </td>

                    <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {a.source||'—'}
                    </td>

                    <td>
                      <button className={'rw-btn '+cls} disabled={isRW||state==='success'} onClick={() => rewriteOne(a)}>
                        {lbl}
                      </button>
                      {a.slug && (
                        <a href={`/news/${a.slug}`} target="_blank" rel="noopener noreferrer">
                          <button className="view-btn">VIEW ↗</button>
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
    </div>
  )
}
