'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

const AQ_S = `
.aq-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:8px 18px;cursor:pointer;transition:opacity .15s}
.aq-btn:hover:not(:disabled){opacity:.85}.aq-btn:disabled{opacity:.4;cursor:not-allowed}
.aq-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:6px 12px;cursor:pointer;transition:all .15s;white-space:nowrap}
.aq-ghost:hover{border-color:var(--gold);color:var(--gold)}
.aq-ghost.danger{color:#ef4444;border-color:rgba(239,68,68,.3)}
.aq-ghost.danger:hover{border-color:#ef4444}
.aq-ghost.snooze{color:#f59e0b;border-color:rgba(245,158,11,.3)}
.aq-ghost.snooze:hover{border-color:#f59e0b}
.aq-ghost.approve{color:#22c55e;border-color:rgba(34,197,94,.3)}
.aq-ghost.approve:hover{border-color:#22c55e;background:rgba(34,197,94,.08)}
.aq-input{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 12px;outline:none;width:100%;box-sizing:border-box}
.aq-input:focus{border-color:var(--gold)}
.aq-select{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:6px 10px;outline:none;cursor:pointer}
.aq-select:focus{border-color:var(--gold)}
.aq-textarea{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 12px;outline:none;width:100%;box-sizing:border-box;resize:vertical}
.aq-textarea:focus{border-color:var(--gold)}
.aq-card{background:var(--bg2);border:1px solid var(--border)}
.aq-card.selected{border-color:var(--gold);box-shadow:0 0 0 1px var(--gold)}
.aq-badge{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 7px;text-transform:uppercase;border-radius:2px}
.aq-tab{background:none;border:none;border-bottom:2px solid transparent;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:9px 16px;cursor:pointer;color:var(--text-dim);transition:all .15s;white-space:nowrap}
.aq-tab.on{color:var(--gold);border-bottom-color:var(--gold)}
.aq-tab:hover:not(.on){color:var(--text)}
.aq-overlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
.aq-modal{background:#0A0B0C;border:1px solid var(--border);border-top:3px solid var(--gold);width:100%;max-width:780px;max-height:94vh;overflow-y:auto;padding:24px}
.aq-split{display:grid;grid-template-columns:380px 1fr;gap:0;height:calc(100vh - 280px);min-height:400px}
.aq-list{overflow-y:auto;border-right:1px solid var(--border)}
.aq-preview-pane{overflow-y:auto;padding:0}
.aq-list-item{padding:14px 16px;border-bottom:1px solid rgba(30,41,59,.5);cursor:pointer;transition:background .1s}
.aq-list-item:hover{background:rgba(200,146,42,.04)}
.aq-list-item.selected{background:rgba(200,146,42,.08);border-left:3px solid var(--gold)}
.aq-list-item.selected .aq-item-name{color:var(--gold)}
@keyframes aq-pulse{0%,100%{opacity:1}50%{opacity:.4}}
.aq-sending{animation:aq-pulse 1s infinite}
`

const TYPE_C = {gun_shop:'#C8922A',instructor:'#22c55e',youtuber:'#a855f7',influencer:'#ec4899',ffl_dealer:'#3b82f6',range:'#06b6d4',organization:'#f59e0b',press:'#ef4444',other:'#6b7280'}
const TYPE_L = {gun_shop:'Shop',instructor:'Instructor',youtuber:'YouTuber',influencer:'Influencer',ffl_dealer:'Dealer',range:'Range',organization:'Org/Mfr',press:'Press',other:'Other'}
const STATUS_C = {draft:'#3b82f6',approved:'#22c55e',sent:'#22c55e',skipped:'#6b7280',snoozed:'#f59e0b',replied:'#a855f7',failed:'#ef4444'}

function Bdg({t,scheme='type'}) {
  const c = scheme==='type'?(TYPE_C[t]||'#6b7280'):(STATUS_C[t]||'#6b7280')
  const l = scheme==='type'?(TYPE_L[t]||t):t
  return <span className="aq-badge" style={{background:c+'22',color:c,border:`1px solid ${c}44`}}>{l?.replace(/_/g,' ')}</span>
}

function fmt(iso) {
  if (!iso) return '—'
  const d = new Date(iso), diff = Date.now()-d.getTime()
  if (diff<3600000) return `${Math.round(diff/60000)}m ago`
  if (diff<86400000) return `${Math.round(diff/3600000)}h ago`
  return d.toLocaleDateString()
}

// ── Generate Modal ────────────────────────────────────────────────────────────
function GenerateModal({ templates, adminKey, onClose, onGenerated }) {
  const [filterType, setFilterType]   = useState('')
  const [filterState, setFilterState] = useState('')
  const [templateId, setTemplateId]   = useState('')
  const [limit, setLimit]             = useState(25)
  const [skipContacted, setSkip]      = useState(true)
  const [running, setRunning]         = useState(false)
  const [result, setResult]           = useState(null)
  const h = {'x-admin-key':adminKey||'','Content-Type':'application/json'}

  const generate = async () => {
    setRunning(true); setResult(null)
    const res = await fetch('/api/outreach/queue', {
      method:'POST', headers:h,
      body: JSON.stringify({ action:'generate', filterType:filterType||undefined, filterState:filterState||undefined, templateId:templateId||undefined, limit, skipContacted }),
    })
    const d = await res.json()
    setResult(d)
    if (d.ok) onGenerated?.()
    setRunning(false)
  }

  const TYPES = ['youtuber','gun_shop','ffl_dealer','instructor','organization','range','press','influencer','other']
  const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

  return (
    <div className="aq-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="aq-modal" style={{maxWidth:520}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--gold)',letterSpacing:'.05em'}}>Generate Draft Emails</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>

        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',lineHeight:1.8,marginBottom:20,padding:'10px 14px',background:'rgba(200,146,42,.06)',border:'1px solid rgba(200,146,42,.2)'}}>
          This will auto-draft personalized emails for your contacts. Templates are matched automatically by contact type. No emails are sent — everything goes to the approval queue first.
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
          <div>
            <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--text-dim)',letterSpacing:'.08em',textTransform:'uppercase',display:'block',marginBottom:5}}>Contact Type</label>
            <select className="aq-select" value={filterType} onChange={e=>setFilterType(e.target.value)} style={{width:'100%'}}>
              <option value="">All types</option>
              {TYPES.map(t=><option key={t} value={t}>{TYPE_L[t]||t}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--text-dim)',letterSpacing:'.08em',textTransform:'uppercase',display:'block',marginBottom:5}}>State Filter</label>
            <select className="aq-select" value={filterState} onChange={e=>setFilterState(e.target.value)} style={{width:'100%'}}>
              <option value="">All states</option>
              {STATES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--text-dim)',letterSpacing:'.08em',textTransform:'uppercase',display:'block',marginBottom:5}}>Override Template</label>
            <select className="aq-select" value={templateId} onChange={e=>setTemplateId(e.target.value)} style={{width:'100%'}}>
              <option value="">Auto-match by type</option>
              {templates.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--text-dim)',letterSpacing:'.08em',textTransform:'uppercase',display:'block',marginBottom:5}}>Max Drafts</label>
            <select className="aq-select" value={limit} onChange={e=>setLimit(Number(e.target.value))} style={{width:'100%'}}>
              {[10,25,50,100,200].map(n=><option key={n} value={n}>{n} contacts</option>)}
            </select>
          </div>
        </div>

        <label style={{display:'flex',alignItems:'center',gap:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text-dim)',marginBottom:20,cursor:'pointer'}}>
          <input type="checkbox" checked={skipContacted} onChange={e=>setSkip(e.target.checked)} />
          Skip contacts already emailed (recommended)
        </label>

        {result && (
          <div style={{padding:'12px 16px',background:result.ok?'rgba(34,197,94,.06)':'rgba(239,68,68,.06)',border:`1px solid ${result.ok?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}`,marginBottom:16,fontFamily:"'IBM Plex Mono',monospace",fontSize:12}}>
            {result.ok
              ? <span style={{color:'#22c55e'}}>✅ {result.created} drafts created · {result.skipped} skipped (already in queue or contacted)</span>
              : <span style={{color:'#f87171'}}>❌ {result.error}</span>
            }
          </div>
        )}

        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button className="aq-ghost" onClick={onClose}>Close</button>
          <button className="aq-btn" onClick={generate} disabled={running}>
            {running ? '⏳ Generating...' : '⚡ Generate Drafts'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ApprovalQueue ────────────────────────────────────────────────────────
export default function ApprovalQueue({ adminKey }) {
  const [tab, setTab]               = useState('draft')
  const [entries, setEntries]       = useState([])
  const [stats, setStats]           = useState({})
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)   // active entry _id
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showGenerate, setShowGenerate] = useState(false)
  const [templates, setTemplates]   = useState([])
  const [msg, setMsg]               = useState(null)
  const [sending, setSending]       = useState(false)
  const [editMode, setEditMode]     = useState(false)
  const [editSubject, setEditSubject] = useState('')
  const [editTid, setEditTid]       = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQ, setSearchQ]       = useState('')

  const h = {'x-admin-key':adminKey||'','Content-Type':'application/json'}
  const flash = (m,ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3500) }

  const load = useCallback(async (silent=false) => {
    if (!silent) setLoading(true)
    try {
      const [qRes, tRes] = await Promise.all([
        fetch(`/api/outreach/queue?status=${tab}&limit=100`,{headers:{'x-admin-key':adminKey||''}}),
        fetch('/api/outreach/templates',{headers:{'x-admin-key':adminKey||''}}),
      ])
      const [q, t] = await Promise.all([qRes.json(), tRes.json()])
      setEntries(q.entries||[])
      setStats(q.stats||{})
      setTemplates(t.templates||[])
      if (!selected && q.entries?.length) setSelected(q.entries[0]._id)
    } catch{}
    setLoading(false)
  }, [tab, adminKey])

  useEffect(()=>{load()},[load])
  // Auto-refresh every 30s
  useEffect(()=>{const t=setInterval(()=>load(true),30000);return()=>clearInterval(t)},[load])

  const active = entries.find(e=>e._id===selected)

  const doAction = async (action, extra={}) => {
    setSending(true)
    try {
      const res = await fetch('/api/outreach/queue',{method:'POST',headers:h,body:JSON.stringify({action,...extra})})
      const d = await res.json()
      if (d.ok) {
        if (action==='approve') flash(`✅ ${d.sent} email${d.sent!==1?'s':''} sent!`)
        else if (action==='skip') flash(`Skipped ${d.count} email${d.count!==1?'s':''}`)
        else if (action==='snooze') flash(`Snoozed — coming back in ${extra.days||7} days`)
        else if (action==='edit') flash('Changes saved')
        else if (action==='digest') flash('Digest sent to dejcav@gmail.com')
        // Remove approved/skipped/snoozed from list
        if (['approve','skip','snooze'].includes(action)) {
          const removedIds = new Set(extra.ids||[extra.id])
          setEntries(prev=>prev.filter(e=>!removedIds.has(e._id)))
          setSelectedIds(new Set())
          // Select next
          const remaining = entries.filter(e=>!removedIds.has(e._id))
          setSelected(remaining[0]?._id || null)
        }
        if (action==='edit') {
          setEditMode(false)
          load(true)
        }
      } else {
        flash(d.error||'Error',false)
      }
    } catch(e){ flash(e.message,false) }
    setSending(false)
  }

  const approveOne  = () => active && doAction('approve',{ids:[active._id]})
  const skipOne     = () => active && doAction('skip',{ids:[active._id]})
  const snoozeOne   = (days) => active && doAction('snooze',{id:active._id,days})
  const approveAll  = () => {
    const ids = selectedIds.size>0?[...selectedIds]:filtered.map(e=>e._id)
    if (!ids.length) return
    if (!confirm(`Send ${ids.length} emails? This cannot be undone.`)) return
    doAction('approve',{ids})
  }
  const skipAll     = () => {
    const ids = selectedIds.size>0?[...selectedIds]:filtered.map(e=>e._id)
    if (ids.length) doAction('skip',{ids})
  }
  const saveEdit    = () => doAction('edit',{id:active._id,subject:editSubject||undefined,templateId:editTid||undefined})

  const filtered = entries.filter(e=>{
    if (typeFilter!=='all' && e.contact?.type!==typeFilter) return false
    if (searchQ) {
      const q=searchQ.toLowerCase()
      return e.toName?.toLowerCase().includes(q)||e.toEmail?.toLowerCase().includes(q)||e.subject?.toLowerCase().includes(q)
    }
    return true
  })

  const toggleSel = (id,e) => { e.stopPropagation(); setSelectedIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n}) }
  const toggleAll = () => setSelectedIds(p=>p.size===filtered.length?new Set():new Set(filtered.map(e=>e._id)))

  const TABS = ['draft','snoozed','sent','skipped','replied']
  const TYPES = ['youtuber','gun_shop','ffl_dealer','instructor','organization','range']

  if (!adminKey) {
    return (
      <div style={{maxWidth:600}}>
        <style>{AQ_S}</style>
        <div style={{padding:'40px 32px',background:'var(--bg2)',border:'1px solid var(--border)',borderTop:'3px solid var(--gold)',textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:12}}>🔑</div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.6rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:8}}>Admin Key Required</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b',lineHeight:1.7}}>
            Enter your ADMIN_KEY in the password field in the admin header (top-right).
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:1200,height:'100%'}}>
      <style>{AQ_S}</style>

      {msg&&<div style={{position:'fixed',top:20,right:20,zIndex:2000,background:msg.ok?'#14532d':'#7f1d1d',border:`1px solid ${msg.ok?'#22c55e':'#ef4444'}`,color:msg.ok?'#4ade80':'#f87171',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:'10px 18px',boxShadow:'0 4px 20px rgba(0,0,0,.6)',borderRadius:2}}>{msg.m}</div>}
      {showGenerate&&<GenerateModal templates={templates} adminKey={adminKey} onClose={()=>setShowGenerate(false)} onGenerated={()=>{setShowGenerate(false);load()}} />}

      {/* Header */}
      <div style={{marginBottom:16}}>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
          <div>
            <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'2rem',letterSpacing:'.06em',color:'var(--gold)',margin:0,lineHeight:1}}>
              ⚡ APPROVAL QUEUE
            </h1>
            <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',margin:'4px 0 0'}}>
              Personalized drafts waiting for your review. Nothing sends without your approval.
            </p>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button className="aq-ghost" onClick={()=>doAction('digest')} disabled={sending}>📧 Email Me Queue</button>
            <button className="aq-btn" onClick={()=>setShowGenerate(true)}>⚡ Generate Drafts</button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{display:'flex',gap:12,marginTop:16,flexWrap:'wrap'}}>
          {[['Pending',stats.draft,'#3b82f6'],['Snoozed',stats.snoozed,'#f59e0b'],['Sent',stats.sent,'#22c55e'],['Replied',stats.replied,'#a855f7'],['Skipped',stats.skipped,'#6b7280']].map(([l,v,c])=>(
            <div key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:'4px 12px',background:'var(--bg2)',border:`1px solid ${c}44`}}>
              <span style={{color:'#64748b'}}>{l}: </span><span style={{color:c,fontWeight:700}}>{v||0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',marginBottom:16,overflowX:'auto',gap:0}}>
        {TABS.map(t=>(
          <button key={t} className={`aq-tab${tab===t?' on':''}`} onClick={()=>{setTab(t);setSelected(null);setSelectedIds(new Set())}}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
            {t==='draft'&&stats.draft>0&&<span style={{marginLeft:6,background:'#3b82f6',color:'#fff',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:'1px 5px',borderRadius:8}}>{stats.draft}</span>}
          </button>
        ))}
      </div>

      {/* Bulk action bar — only when items selected */}
      {selectedIds.size>0&&(
        <div style={{display:'flex',gap:8,alignItems:'center',padding:'8px 14px',background:'rgba(200,146,42,.08)',border:'1px solid rgba(200,146,42,.3)',marginBottom:12,flexWrap:'wrap'}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--gold)'}}>{selectedIds.size} selected</span>
          {tab==='draft'&&<button className="aq-ghost approve" onClick={approveAll} disabled={sending}>✅ Approve & Send All</button>}
          <button className="aq-ghost danger" onClick={skipAll} disabled={sending}>Skip All</button>
          <button className="aq-ghost" onClick={()=>setSelectedIds(new Set())}>Clear</button>
        </div>
      )}

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <input className="aq-input" placeholder="Search name, email, subject..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{width:220}} />
        <select className="aq-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
          <option value="all">All types</option>
          {TYPES.map(t=><option key={t} value={t}>{TYPE_L[t]||t}</option>)}
        </select>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>{filtered.length} shown</span>
        {tab==='draft'&&filtered.length>0&&(
          <button className="aq-ghost approve" style={{marginLeft:'auto'}} onClick={approveAll} disabled={sending}>
            {sending?<span className="aq-sending">Sending...</span>:`✅ Approve All ${filtered.length}`}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{padding:40,textAlign:'center',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b'}}>Loading queue...</div>
      ) : filtered.length===0 ? (
        <div style={{padding:'40px 32px',textAlign:'center',border:'1px solid var(--border)',background:'var(--bg2)'}}>
          <div style={{fontSize:40,marginBottom:12}}>{tab==='draft'?'✉️':'📭'}</div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--text)',letterSpacing:'.05em',marginBottom:8}}>
            {tab==='draft'?'No Drafts Yet':'Nothing here'}
          </div>
          {tab==='draft'&&<>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginBottom:6,lineHeight:1.7}}>
              To generate approval drafts you need contacts and templates loaded first.
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#94a3b8',marginBottom:20,lineHeight:1.8,maxWidth:480,margin:'0 auto 20px',padding:'12px 16px',background:'rgba(0,0,0,.3)',border:'1px solid var(--border)',textAlign:'left'}}>
              <strong style={{color:'var(--gold)'}}>Step 1:</strong> Go to the <strong>Outreach</strong> tab → hit <strong>SEED EVERYTHING</strong> (loads 140+ contacts + 10 templates)<br/>
              <strong style={{color:'var(--gold)'}}>Step 2:</strong> Come back here → hit <strong>⚡ Generate Drafts</strong><br/>
              <strong style={{color:'var(--gold)'}}>Step 3:</strong> Review each email live → hit <strong>✅ Approve &amp; Send</strong>
            </div>
            <button className="aq-btn" onClick={()=>setShowGenerate(true)}>⚡ Generate Drafts</button>
          </>}
          {tab!=='draft'&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b'}}>No entries in this status.</div>}
        </div>
      ) : (
        <div className="aq-split">
          {/* LEFT — list */}
          <div className="aq-list">
            {/* Select all row */}
            <div style={{padding:'8px 16px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8,background:'var(--bg)'}}>
              <input type="checkbox" checked={selectedIds.size===filtered.length&&filtered.length>0} onChange={toggleAll} />
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase'}}>Select all {filtered.length}</span>
            </div>
            {filtered.map(e=>(
              <div key={e._id} className={`aq-list-item${selected===e._id?' selected':''}`} onClick={()=>{setSelected(e._id);setEditMode(false)}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                  <input type="checkbox" checked={selectedIds.has(e._id)} onClick={ev=>toggleSel(e._id,ev)} onChange={()=>{}} style={{marginTop:2,flexShrink:0}} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}>
                      <span className="aq-item-name" style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}>{e.toName}</span>
                      {e.contact?.type&&<Bdg t={e.contact.type} />}
                    </div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.toEmail}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--text-dim)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',opacity:.8}}>{e.subject}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#475569',marginTop:3}}>
                      {fmt(e.draftedAt)}
                      {e.contact?.city&&` · ${e.contact.city}${e.contact.state?', '+e.contact.state:''}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — preview + actions */}
          <div className="aq-preview-pane">
            {!active ? (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#475569'}}>
                Select a draft to preview
              </div>
            ) : (
              <div>
                {/* Action toolbar */}
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',background:'var(--bg)',position:'sticky',top:0,zIndex:2}}>
                  {tab==='draft'&&<>
                    <button className="aq-btn" onClick={approveOne} disabled={sending} style={{fontSize:12,padding:'6px 16px'}}>
                      {sending?<span className="aq-sending">Sending...</span>:'✅ Approve & Send'}
                    </button>
                    <button className="aq-ghost snooze" onClick={()=>snoozeOne(7)} disabled={sending}>💤 Snooze 7d</button>
                    <button className="aq-ghost snooze" onClick={()=>snoozeOne(14)} disabled={sending}>💤 14d</button>
                    <button className="aq-ghost danger" onClick={skipOne} disabled={sending}>✕ Skip</button>
                    <button className="aq-ghost" onClick={()=>{setEditMode(!editMode);setEditSubject(active.subject);setEditTid('')}} style={{marginLeft:'auto'}}>
                      {editMode?'Cancel Edit':'✏ Edit'}
                    </button>
                  </>}
                  {tab!=='draft'&&<Bdg t={active.status} scheme="status" />}
                </div>

                {/* Edit bar */}
                {editMode&&(
                  <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',background:'rgba(200,146,42,.04)'}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',letterSpacing:'.08em',marginBottom:8}}>EDITING — changes apply to this draft only</div>
                    <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                      <div style={{flex:2,minWidth:180}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--text-dim)',marginBottom:4}}>SUBJECT</div>
                        <input className="aq-input" value={editSubject} onChange={e=>setEditSubject(e.target.value)} style={{fontSize:12}} />
                      </div>
                      <div style={{flex:1,minWidth:160}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--text-dim)',marginBottom:4}}>SWAP TEMPLATE</div>
                        <select className="aq-select" value={editTid} onChange={e=>setEditTid(e.target.value)} style={{width:'100%'}}>
                          <option value="">Keep current</option>
                          {templates.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <button className="aq-btn" onClick={saveEdit} disabled={sending} style={{fontSize:12,padding:'6px 14px'}}>Save Changes</button>
                  </div>
                )}

                {/* Contact info strip */}
                <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg2)',display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.1rem',color:'var(--text)',letterSpacing:'.03em',lineHeight:1}}>{active.toName}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--gold)',marginTop:2}}>{active.toEmail}</div>
                  </div>
                  {active.contact?.type&&<Bdg t={active.contact.type} />}
                  {active.contact?.city&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>{active.contact.city}{active.contact.state?`, ${active.contact.state}`:''}</span>}
                  {active.template&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#475569',marginLeft:'auto'}}>Template: {active.template.name}</span>}
                </div>

                {/* Subject */}
                <div style={{padding:'8px 16px',borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em'}}>SUBJECT: </span>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'var(--text)'}}>{active.subject}</span>
                </div>

                {/* Email preview */}
                {active.bodyHtml ? (
                  <iframe
                    srcDoc={active.bodyHtml}
                    style={{width:'100%',height:'calc(100vh - 420px)',minHeight:300,border:'none',display:'block'}}
                    title={`Preview: ${active.toName}`}
                  />
                ) : (
                  <div style={{padding:32,textAlign:'center',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#475569'}}>No preview available</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
