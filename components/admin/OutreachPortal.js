'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

const S = `
.op-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:8px 18px;cursor:pointer;transition:opacity .15s}
.op-btn:hover:not(:disabled){opacity:.85}.op-btn:disabled{opacity:.4;cursor:not-allowed}
.op-btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:7px 13px;cursor:pointer;transition:all .15s}
.op-btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.op-btn-sm{padding:5px 11px;font-size:11px}
.op-btn-red{background:#ef4444;color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;padding:5px 12px;cursor:pointer}
.op-input{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 12px;outline:none;width:100%;box-sizing:border-box;transition:border-color .15s}
.op-input:focus{border-color:var(--gold)}
.op-select{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:7px 10px;outline:none;cursor:pointer;transition:border-color .15s}
.op-select:focus{border-color:var(--gold)}
.op-textarea{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:10px 12px;outline:none;width:100%;box-sizing:border-box;resize:vertical;transition:border-color .15s}
.op-textarea:focus{border-color:var(--gold)}
.op-label{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:.08em;text-transform:uppercase;display:block;margin-bottom:5px}
.op-card{background:var(--bg2);border:1px solid var(--border);padding:16px 20px}
.op-table{width:100%;border-collapse:collapse}
.op-table th{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#64748b;letter-spacing:.08em;text-transform:uppercase;padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;white-space:nowrap;background:var(--bg2);position:sticky;top:0;z-index:1}
.op-table td{padding:9px 12px;border-bottom:1px solid rgba(30,41,59,.4);vertical-align:middle}
.op-table tr:hover td{background:rgba(200,146,42,.04)}
.op-badge{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 7px;text-transform:uppercase;border-radius:2px}
.op-tab{background:none;border:none;border-bottom:2px solid transparent;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:10px 16px;cursor:pointer;color:var(--text-dim);transition:all .15s;white-space:nowrap}
.op-tab.active{color:var(--gold);border-bottom-color:var(--gold)}
.op-tab:hover:not(.active){color:var(--text)}
.op-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.op-modal{background:#0A0B0C;border:1px solid var(--border);border-top:3px solid var(--gold);width:100%;max-width:680px;max-height:92vh;overflow-y:auto;padding:28px}
.op-modal-wide{max-width:900px}
.op-row-hover:hover{background:rgba(200,146,42,.05);cursor:pointer}
.op-timeline-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:4px}
.op-send-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:6px 14px;cursor:pointer;white-space:nowrap;transition:opacity .15s}
.op-send-btn:hover{opacity:.85}
.op-send-btn:disabled{opacity:.4;cursor:not-allowed}
`

const TYPE_C = {gun_shop:'#C8922A',instructor:'#22c55e',youtuber:'#a855f7',influencer:'#ec4899',ffl_dealer:'#3b82f6',range:'#06b6d4',organization:'#f59e0b',press:'#ef4444',other:'#6b7280'}
const TYPE_L = {gun_shop:'Gun Shop',instructor:'Instructor',youtuber:'YouTuber',influencer:'Influencer',ffl_dealer:'FFL Dealer',range:'Range',organization:'Organization / Manufacturer',press:'Press',other:'Other'}
const STATUS_C = {active:'#22c55e',unsubscribed:'#f59e0b',bounced:'#ef4444',do_not_contact:'#ef4444',pending:'#3b82f6'}
const SEND_C = {sent:'#3b82f6',delivered:'#22c55e',opened:'#a855f7',clicked:'#f59e0b',replied:'#22c55e',bounced:'#ef4444',failed:'#ef4444',queued:'#64748b'}

const Bdg = ({type,scheme='type'}) => {
  const c = scheme==='type' ? (TYPE_C[type]||'#6b7280') : scheme==='status' ? (STATUS_C[type]||'#6b7280') : (SEND_C[type]||'#6b7280')
  const l = scheme==='type' ? (TYPE_L[type]||type) : type
  return <span className="op-badge" style={{background:c+'22',color:c,border:`1px solid ${c}44`}}>{l?.replace(/_/g,' ')}</span>
}

const fmt = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 3600000) return `${Math.round(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.round(diff/3600000)}h ago`
  if (diff < 604800000) return `${Math.round(diff/86400000)}d ago`
  return d.toLocaleDateString()
}

// ── Single-contact send modal ─────────────────────────────────────────────────
function SendModal({ contact, templates, adminKey, onClose, onSent }) {
  const [tid, setTid]         = useState('')
  const [html, setHtml]       = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [err, setErr]         = useState('')
  const h = {'x-admin-key':adminKey||'','Content-Type':'application/json'}

  // Auto-select first template matching contact type
  useEffect(() => {
    const match = templates.find(t => t.type === contact.type || t.type === 'generic')
    if (match) setTid(match._id)
  }, [templates, contact.type])

  const preview = async (id) => {
    if (!id) return
    setLoading(true); setHtml(''); setErr('')
    // Need a campaign for preview — use template directly via quick-preview endpoint
    try {
      const res = await fetch('/api/outreach/send/preview', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ templateId: id, contactId: contact._id }),
      })
      const d = await res.json()
      if (d.ok) { setHtml(d.html); setSubject(d.subject) }
      else setErr(d.error || 'Preview failed')
    } catch(e) { setErr(e.message) }
    setLoading(false)
  }

  useEffect(() => { if (tid) preview(tid) }, [tid])

  const send = async () => {
    setSending(true); setErr('')
    try {
      const res = await fetch('/api/outreach/send/direct', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ templateId: tid, contactId: contact._id }),
      })
      const d = await res.json()
      if (d.ok) { setSent(true); onSent?.() }
      else setErr(d.error || 'Send failed')
    } catch(e) { setErr(e.message) }
    setSending(false)
  }

  return (
    <div className="op-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="op-modal op-modal-wide">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--gold)',letterSpacing:'.05em',lineHeight:1}}>
              Send Email to {contact.name}
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginTop:3}}>
              {contact.email} · <Bdg type={contact.type} />
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>

        {sent ? (
          <div style={{textAlign:'center',padding:'40px 0'}}>
            <div style={{fontSize:48,marginBottom:12}}>✅</div>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'#22c55e',letterSpacing:'.05em'}}>Email Sent</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b',marginTop:8}}>
              Delivered to {contact.email}
            </div>
            <button className="op-btn-ghost" onClick={onClose} style={{marginTop:20}}>Close</button>
          </div>
        ) : (
          <>
            <div style={{display:'flex',gap:12,alignItems:'flex-end',marginBottom:16,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:220}}>
                <label className="op-label">Template</label>
                <select className="op-select" value={tid} onChange={e=>setTid(e.target.value)} style={{width:'100%'}}>
                  <option value="">— choose —</option>
                  {templates.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              {subject && (
                <div style={{flex:2,minWidth:200}}>
                  <label className="op-label">Subject preview</label>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'var(--text-dim)',padding:'8px 12px',background:'var(--bg)',border:'1px solid var(--border)'}}>{subject}</div>
                </div>
              )}
            </div>

            {err && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#f87171',padding:'8px 12px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',marginBottom:12}}>{err}</div>}

            {loading && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b',padding:20,textAlign:'center'}}>Generating preview...</div>}

            {html && !loading && (
              <div style={{marginBottom:16}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',marginBottom:6,letterSpacing:'.06em'}}>LIVE PREVIEW — PERSONALIZED FOR {contact.name?.toUpperCase()}</div>
                <iframe srcDoc={html} style={{width:'100%',height:480,border:'1px solid var(--border)'}} title="Preview" />
              </div>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="op-btn-ghost" onClick={onClose}>Cancel</button>
              <button className="op-btn-ghost op-btn-sm" onClick={()=>preview(tid)} disabled={loading||!tid}>↻ Refresh Preview</button>
              <button className="op-btn" onClick={send} disabled={sending||!tid||!html}>
                {sending ? 'Sending...' : `Send to ${contact.firstName||contact.name?.split(' ')[0]||contact.name}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Contact detail / timeline modal ──────────────────────────────────────────
function ContactDetail({ contact, templates, adminKey, onClose, onEdit, onRefresh }) {
  const [logs, setLogs]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showSend, setShowSend] = useState(false)
  const h = {'x-admin-key':adminKey||''}

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/outreach/history?contactId=${contact._id}`, {headers:h})
    const d = await res.json()
    setLogs(d.logs||[])
    setLoading(false)
  }

  useEffect(()=>{load()},[contact._id])

  const markStatus = async (logId, status) => {
    await fetch('/api/outreach/history', {method:'PATCH',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({id:logId,status})})
    load()
  }

  return (
    <div className="op-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="op-modal op-modal-wide">
        {showSend && (
          <SendModal contact={contact} templates={templates} adminKey={adminKey}
            onClose={()=>setShowSend(false)}
            onSent={()=>{setShowSend(false);load();onRefresh?.()}} />
        )}

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.6rem',color:'var(--gold)',letterSpacing:'.05em',lineHeight:1}}>{contact.name}</div>
            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:6,flexWrap:'wrap'}}>
              <Bdg type={contact.type} />
              <Bdg type={contact.status} scheme="status" />
              {contact.state && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>{contact.city ? `${contact.city}, ` : ''}{contact.state}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:18,cursor:'pointer',flexShrink:0}}>✕</button>
        </div>

        {/* Contact info grid */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20,padding:'14px 16px',background:'var(--bg)',border:'1px solid var(--border)'}}>
          {[
            ['Email', contact.email, true],
            ['Phone', contact.phone, false],
            ['Website', contact.website, false],
            ['YouTube', contact.youtubeUrl, false],
            ['Subscribers', contact.subscribers ? Number(contact.subscribers).toLocaleString() : null, false],
            ['FFL License', contact.fflLicense, false],
            ['Last Contacted', contact.lastContactedAt ? fmt(contact.lastContactedAt) : 'Never', false],
            ['Added', fmt(contact.addedAt), false],
          ].filter(([,v])=>v).map(([k,v,isPrimary])=>(
            <div key={k}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase'}}>{k} </span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:isPrimary?'var(--gold)':'var(--text-dim)'}}>{v}</span>
            </div>
          ))}
          {contact.notes && (
            <div style={{gridColumn:'1/-1'}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase'}}>Notes </span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text-dim)'}}>{contact.notes}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          <button className="op-btn op-btn-sm" onClick={()=>setShowSend(true)} disabled={!contact.email}>
            ✉ Send Email
          </button>
          <button className="op-btn-ghost op-btn-sm" onClick={onEdit}>✏ Edit Contact</button>
          {contact.youtubeUrl && (
            <a href={contact.youtubeUrl} target="_blank" rel="noreferrer"
              style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#a855f7',textDecoration:'none',padding:'5px 11px',border:'1px solid #a855f744'}}>
              ▶ View Channel
            </a>
          )}
          {contact.website && (
            <a href={contact.website} target="_blank" rel="noreferrer"
              style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',textDecoration:'none',padding:'5px 11px',border:'1px solid var(--border)'}}>
              🌐 Website
            </a>
          )}
        </div>

        {/* Send history / timeline */}
        <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1rem',color:'var(--text)',letterSpacing:'.05em',marginBottom:12}}>
          Communication History ({logs.length})
        </div>

        {loading ? (
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b',padding:'20px 0'}}>Loading history...</div>
        ) : logs.length === 0 ? (
          <div style={{padding:'24px',textAlign:'center',border:'1px solid var(--border)',background:'var(--bg)'}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b',marginBottom:10}}>No emails sent yet.</div>
            <button className="op-btn op-btn-sm" onClick={()=>setShowSend(true)} disabled={!contact.email}>Send First Email</button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:0,border:'1px solid var(--border)'}}>
            {logs.map((log,i)=>(
              <div key={log._id} style={{display:'grid',gridTemplateColumns:'auto 1fr auto',gap:12,padding:'12px 16px',borderBottom:i<logs.length-1?'1px solid rgba(30,41,59,.4)':'none',alignItems:'start'}}>
                {/* Timeline dot + line */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',paddingTop:2}}>
                  <div className="op-timeline-dot" style={{background:SEND_C[log.status]||'#64748b'}} />
                  {i<logs.length-1 && <div style={{width:1,flex:1,background:'var(--border)',marginTop:4,minHeight:20}} />}
                </div>
                {/* Content */}
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap'}}>
                    <Bdg type={log.status} scheme="send" />
                    {log.campaign?.name && <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,color:'var(--text-dim)'}}>{log.campaign.name}</span>}
                  </div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text-dim)',marginBottom:3}}>
                    Subject: {log.subject}
                  </div>
                  <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                    {log.sentAt    && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#475569'}}>Sent {fmt(log.sentAt)}</span>}
                    {log.openedAt  && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#a855f7'}}>Opened {fmt(log.openedAt)}</span>}
                    {log.clickedAt && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#f59e0b'}}>Clicked {fmt(log.clickedAt)}</span>}
                    {log.repliedAt && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#22c55e'}}>Replied {fmt(log.repliedAt)}</span>}
                    {log.error     && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#f87171'}}>Error: {log.error}</span>}
                  </div>
                </div>
                {/* Quick status update */}
                {log.status === 'sent' && (
                  <div style={{display:'flex',gap:4,flexDirection:'column',alignItems:'flex-end'}}>
                    <button className="op-btn-ghost op-btn-sm" style={{fontSize:9,padding:'2px 7px'}} onClick={()=>markStatus(log._id,'replied')}>Mark Replied</button>
                    <button className="op-btn-ghost op-btn-sm" style={{fontSize:9,padding:'2px 7px'}} onClick={()=>markStatus(log._id,'opened')}>Mark Opened</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ stats, sendStats }) {
  const items = [
    {l:'Total Contacts', v:stats?.total,       c:'var(--gold)', icon:'👥'},
    {l:'Active',         v:stats?.active,      c:'#22c55e',     icon:'✅'},
    {l:'With Email',     v:stats?.withEmail,   c:'#3b82f6',     icon:'📧'},
    {l:'YouTubers',      v:stats?.youtubers,   c:'#a855f7',     icon:'▶'},
    {l:'Shops',          v:stats?.shops,       c:'#C8922A',     icon:'🏪'},
    {l:'Instructors',    v:stats?.instructors, c:'#22c55e',     icon:'🎯'},
    {l:'Manufacturers',  v:stats?.orgs,        c:'#f59e0b',     icon:'🏭'},
    {l:'Emails Sent',    v:sendStats?.totalSent, c:'#3b82f6',   icon:'📤'},
    {l:'Replies',        v:sendStats?.replied, c:'#22c55e',     icon:'↩'},
  ]
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:8,marginBottom:20}}>
      {items.map(({l,v,c,icon})=>(
        <div key={l} style={{background:'var(--bg2)',border:'1px solid var(--border)',padding:'12px 14px',textAlign:'center'}}>
          <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.6rem',color:c,lineHeight:1}}>{v??'—'}</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',marginTop:2,textTransform:'uppercase',letterSpacing:'.06em'}}>{l}</div>
        </div>
      ))}
    </div>
  )
}

// ── Contact edit modal ────────────────────────────────────────────────────────
function ContactModal({ contact, onSave, onClose }) {
  const [form, setForm] = useState(contact || {type:'gun_shop',status:'active',country:'USA'})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <div className="op-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="op-modal">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em'}}>{contact?._id?'Edit Contact':'Add Contact'}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:18,cursor:'pointer'}}>✕</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[['Name *','name',true],['First Name','firstName',false]].map(([l,k,full])=>(
            <div key={k} style={{gridColumn:full?'1/-1':undefined}}>
              <label className="op-label">{l}</label>
              <input className="op-input" value={form[k]||''} onChange={e=>set(k,e.target.value)} />
            </div>
          ))}
          <div><label className="op-label">Type *</label>
            <select className="op-select" value={form.type||'gun_shop'} onChange={e=>set('type',e.target.value)} style={{width:'100%'}}>
              {Object.entries(TYPE_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label className="op-label">Status</label>
            <select className="op-select" value={form.status||'active'} onChange={e=>set('status',e.target.value)} style={{width:'100%'}}>
              {['active','unsubscribed','bounced','do_not_contact','pending'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {[['Email','email'],['Phone','phone'],['City','city'],['State','state'],['Website','website'],['YouTube URL','youtubeUrl'],['Instagram','instagram'],['Twitter/X','twitter'],['FFL License','fflLicense']].map(([l,k])=>(
            <div key={k}><label className="op-label">{l}</label><input className="op-input" value={form[k]||''} onChange={e=>set(k,e.target.value)} /></div>
          ))}
          <div style={{gridColumn:'1/-1'}}><label className="op-label">Notes</label><textarea className="op-textarea" rows={2} value={form.notes||''} onChange={e=>set('notes',e.target.value)} /></div>
          <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8}}>
            <input type="checkbox" id="perm" checked={!!form.emailPermission} onChange={e=>set('emailPermission',e.target.checked)} />
            <label htmlFor="perm" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text-dim)'}}>YouTube embed permission granted</label>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:18,justifyContent:'flex-end'}}>
          <button className="op-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="op-btn" onClick={()=>onSave(form)}>Save</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Portal ───────────────────────────────────────────────────────────────
export default function OutreachPortal({ adminKey }) {
  const [tab, setTab]                 = useState('contacts')
  const [contacts, setContacts]       = useState([])
  const [templates, setTemplates]     = useState([])
  const [campaigns, setCampaigns]     = useState([])
  const [stats, setStats]             = useState(null)
  const [sendStats, setSendStats]     = useState(null)
  const [historyLogs, setHistoryLogs] = useState([])
  const [loading, setLoading]         = useState(false)
  const [msg, setMsg]                 = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Modals
  const [detailContact, setDetailContact] = useState(null)
  const [editContact, setEditContact]     = useState(null)
  const [sendContact, setSendContact]     = useState(null)

  // Filters
  const [filterType, setFilterType]     = useState('all')
  const [filterStatus, setFilterStatus] = useState('active')
  const [searchQ, setSearchQ]           = useState('')

  // ── Approval Queue state ────────────────────────────────────────────────────
  const [queueEntries, setQueueEntries]     = useState([])
  const [queueStats, setQueueStats]         = useState({})
  const [queueTab, setQueueTab]             = useState('draft')
  const [queueSelected, setQueueSelected]   = useState(null)
  const [queueLoading, setQueueLoading]     = useState(false)
  const [queueSending, setQueueSending]     = useState(false)
  const [queueFilter, setQueueFilter]       = useState('all')
  const [showGenerate, setShowGenerate]     = useState(false)
  const [genFilterType, setGenFilterType]   = useState('')
  const [genFilterState, setGenFilterState] = useState('')
  const [genTemplateId, setGenTemplateId]   = useState('')
  const [genLimit, setGenLimit]             = useState(25)
  const [genSkip, setGenSkip]               = useState(true)
  const [genRunning, setGenRunning]         = useState(false)
  const [genResult, setGenResult]           = useState(null)
  const [queueEditMode, setQueueEditMode]   = useState(false)
  const [queueEditSubj, setQueueEditSubj]   = useState('')
  const [queueEditTid, setQueueEditTid]     = useState('')
  const [selectedQueueIds, setSelectedQueueIds] = useState(new Set())

  // Scraper
  const [scrapeSource, setScrapeSource] = useState('ffl')
  const [scrapeState, setScrapeState]   = useState('WA')
  const [scrapeRunning, setScrapeRunning] = useState(false)
  const [scrapeResult, setScrapeResult] = useState(null)

  // Import
  const fileRef = useRef(null)
  const [importType, setImportType]       = useState('gun_shop')
  const [importRunning, setImportRunning] = useState(false)
  const [importResult, setImportResult]   = useState(null)

  // Bulk send
  const [bulkCampaignId, setBulkCampaignId] = useState('')
  const [bulkRunning, setBulkRunning]         = useState(false)
  const [bulkResult, setBulkResult]           = useState(null)

  const h = {'x-admin-key':adminKey||''}
  const flash = (m, ok=true) => { setMsg({m,ok}); setTimeout(()=>setMsg(null),3500) }

  const loadContacts = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/outreach/contacts?limit=500&status=${filterStatus}`
      if (filterType!=='all') url+=`&type=${filterType}`
      if (searchQ) url+=`&search=${encodeURIComponent(searchQ)}`
      const res = await fetch(url,{headers:h})
      const d = await res.json()
      setContacts(d.contacts||[])
      setStats(d.stats||null)
    } catch{}
    setLoading(false)
  }, [filterType, filterStatus, searchQ, adminKey])

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/outreach/templates',{headers:h})
    const d = await res.json()
    setTemplates(d.templates||[])
  }, [adminKey])

  const loadCampaigns = useCallback(async () => {
    const res = await fetch('/api/outreach/campaigns',{headers:h})
    const d = await res.json()
    setCampaigns(d.campaigns||[])
  }, [adminKey])

  const loadSendStats = useCallback(async () => {
    const res = await fetch('/api/outreach/history?view=stats',{headers:h})
    const d = await res.json()
    setSendStats(d.stats||null)
  }, [adminKey])

  const loadHistory = useCallback(async () => {
    const res = await fetch('/api/outreach/history?limit=100',{headers:h})
    const d = await res.json()
    setHistoryLogs(d.logs||[])
  }, [adminKey])

  useEffect(()=>{loadContacts()},[loadContacts])
  useEffect(()=>{loadTemplates();loadCampaigns();loadSendStats()},[adminKey])
  useEffect(()=>{if(tab==='history')loadHistory()},[tab,adminKey])

  const loadQueue = useCallback(async (silent=false) => {
    if (!silent) setQueueLoading(true)
    try {
      const [qRes, sRes] = await Promise.all([
        fetch(`/api/outreach/queue?status=${queueTab}&limit=100`,{headers:{'x-admin-key':adminKey||''}}),
        fetch('/api/outreach/queue?status=draft&limit=1',{headers:{'x-admin-key':adminKey||''}}),
      ])
      const [q, s] = await Promise.all([qRes.json(), sRes.json()])
      setQueueEntries(q.entries||[])
      setQueueStats(q.stats||{})
    } catch{}
    setQueueLoading(false)
  }, [queueTab, adminKey])

  useEffect(()=>{ if(tab==='queue') loadQueue() },[tab, loadQueue])

  const queueAction = async (action, extra={}) => {
    setQueueSending(true)
    try {
      const res = await fetch('/api/outreach/queue',{method:'POST',headers:h,body:JSON.stringify({action,...extra})})
      const d = await res.json()
      if (d.ok) {
        if (action==='approve') flash(`✅ ${d.sent} email${d.sent!==1?'s':''} sent!`)
        else if (action==='skip') flash(`Skipped`)
        else if (action==='snooze') flash(`Snoozed ${extra.days||7} days`)
        else if (action==='edit') { flash('Saved'); setQueueEditMode(false) }
        else if (action==='digest') flash('Digest sent to dejcav@gmail.com')
        if (['approve','skip','snooze'].includes(action)) {
          const removed = new Set(extra.ids||[extra.id])
          setQueueEntries(p=>p.filter(e=>!removed.has(e._id)))
          setSelectedQueueIds(new Set())
          setQueueSelected(s => removed.has(s) ? null : s)
        }
        if (action==='edit') loadQueue(true)
      } else flash(d.error||'Error', false)
    } catch(e){ flash(e.message, false) }
    setQueueSending(false)
  }

  const generateDrafts = async () => {
    setGenRunning(true); setGenResult(null)
    const res = await fetch('/api/outreach/queue',{method:'POST',headers:h,body:JSON.stringify({
      action:'generate', filterType:genFilterType||undefined, filterState:genFilterState||undefined,
      templateId:genTemplateId||undefined, limit:genLimit, skipContacted:genSkip
    })})
    const d = await res.json()
    setGenResult(d)
    if (d.ok) { flash(`✅ ${d.created} drafts created`); loadQueue(true) }
    else flash(d.error||'Error', false)
    setGenRunning(false)
  }

  const saveContact = async (form) => {
    const isEdit = !!form._id
    const res = await fetch('/api/outreach/contacts',{method:isEdit?'PATCH':'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify(isEdit?form:[form])})
    const d = await res.json()
    if (d.ok){flash(isEdit?'Updated':'Added');setEditContact(null);setDetailContact(null);loadContacts()}
    else flash(d.error||'Error',false)
  }

  const deleteContact = async (id) => {
    if (!confirm('Delete this contact?')) return
    await fetch('/api/outreach/contacts',{method:'DELETE',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({id})})
    flash('Deleted');loadContacts()
  }

  const seedTemplates = async () => {
    const res = await fetch('/api/outreach/templates/seed',{method:'POST',headers:h})
    const d = await res.json()
    flash(`${d.templates?.created||0} templates created, ${d.templates?.updated||0} updated. ${d.contacts?.created||0} YouTubers added.`)
    loadTemplates(); loadContacts()
  }

  const seedManufacturers = async () => {
    flash('Seeding manufacturers...')
    const res = await fetch('/api/outreach/manufacturers',{method:'POST',headers:h})
    const d = await res.json()
    if (d.ok) { flash(`${d.created} manufacturers added (${d.skipped} already existed)`); loadContacts() }
    else flash(d.error||'Error',false)
  }

  const seedHolsters = async () => {
    flash('Seeding holster companies...')
    const res = await fetch('/api/outreach/holsters',{method:'POST',headers:h})
    const d = await res.json()
    if (d.ok) { flash(`${d.created} holster companies added (${d.skipped} already existed)`); loadContacts() }
    else flash(d.error||'Error',false)
  }

  const seedDealers = async () => {
    flash('Seeding dealers...')
    const res = await fetch('/api/outreach/dealers',{method:'POST',headers:h})
    const d = await res.json()
    if (d.ok) { flash(`${d.created} dealers added (${d.skipped} already existed)`); loadContacts() }
    else flash(d.error||'Error',false)
  }

  // ── Seed everything at once ──────────────────────────────────────────────────
  const seedAll = async () => {
    setLoading(true)
    flash('Seeding all lists — this takes about 60 seconds...')
    const steps = [
      { url:'/api/outreach/templates/seed', label:'Templates + YouTubers' },
      { url:'/api/outreach/manufacturers',  label:'70+ Manufacturers' },
      { url:'/api/outreach/dealers',        label:'30+ Dealers' },
      { url:'/api/outreach/holsters',       label:'40+ Holster Companies' },
    ]
    let totalCreated = 0
    for (const step of steps) {
      try {
        const res = await fetch(step.url, {method:'POST', headers:h})
        const d = await res.json()
        const n = d.created || d.templates?.created || 0
        totalCreated += n
        flash(`✓ ${step.label}: ${n} created`)
      } catch(e) {
        flash(`✗ ${step.label}: ${e.message}`, false)
      }
      await new Promise(r => setTimeout(r, 800))
    }
    flash(`🎉 Done! ${totalCreated} total records created. Loading your contacts...`)
    await loadContacts()
    await loadTemplates()
    setLoading(false)
  }

  const runScrape = async (save=false) => {
    setScrapeRunning(true); setScrapeResult(null)
    const res = await fetch('/api/outreach/scrape',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({source:scrapeSource,params:{state:scrapeState,limit:100},saveToDatabase:save})})
    const d = await res.json()
    setScrapeResult(d)
    if (save&&d.ok){flash(`Saved ${d.saved?.created||0} contacts`);loadContacts()}
    setScrapeRunning(false)
  }

  const runImport = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return flash('No file selected',false)
    setImportRunning(true); setImportResult(null)
    const fd = new FormData(); fd.append('file',file); fd.append('type',importType); fd.append('source','csv_import')
    const res = await fetch('/api/outreach/import',{method:'POST',headers:h,body:fd})
    const d = await res.json()
    setImportResult(d)
    if (d.ok){flash(`Imported ${d.created} contacts`);loadContacts()}
    setImportRunning(false)
  }

  const runBulkSend = async (dryRun=false) => {
    if (!bulkCampaignId) return flash('Select a campaign',false)
    setBulkRunning(true); setBulkResult(null)
    const ids = selectedIds.size>0?[...selectedIds]:undefined
    const res = await fetch('/api/outreach/send',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({campaignId:bulkCampaignId,contactIds:ids,dryRun})})
    const d = await res.json()
    setBulkResult(d)
    if (d.ok&&!dryRun){flash(`Sent ${d.sent} emails`);loadContacts();loadCampaigns();loadSendStats()}
    setBulkRunning(false)
  }

  // Smart suggestions
  const suggestions = contacts.filter(c => {
    if (!c.email) return false
    if (c.status !== 'active') return false
    if (!c.lastContactedAt) return true  // never contacted
    const daysSince = (Date.now()-new Date(c.lastContactedAt).getTime())/86400000
    return daysSince > 14  // 14+ days since last contact
  }).slice(0,10)

  // Filtered display
  const displayed = contacts.filter(c => {
    if (filterType!=='all' && c.type!==filterType) return false
    if (searchQ) {
      const q=searchQ.toLowerCase()
      return c.name?.toLowerCase().includes(q)||c.email?.toLowerCase().includes(q)||c.city?.toLowerCase().includes(q)||c.state?.toLowerCase().includes(q)||c.notes?.toLowerCase().includes(q)
    }
    return true
  })

  const toggleSel = (id) => setSelectedIds(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll = () => setSelectedIds(p=>p.size===displayed.length?new Set():new Set(displayed.map(c=>c._id)))

  const TABS = [
    ['contacts','👥 Contacts'],['queue','⚡ Approval Queue'],['history','📋 History'],
    ['send','📤 Bulk Send'],['templates','✉ Templates'],
    ['campaigns','🗂 Campaigns'],['scrape','🔍 Scrape'],['import','📥 Import'],
  ]

  // ── Key gate ────────────────────────────────────────────────────────────────
  if (!adminKey) {
    return (
      <div style={{maxWidth:600}}>
        <style>{S}</style>
        <div style={{padding:'40px 32px',background:'var(--bg2)',border:'1px solid var(--border)',borderTop:'3px solid var(--gold)',textAlign:'center'}}>
          <div style={{fontSize:40,marginBottom:12}}>🔑</div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.6rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:8}}>Admin Key Required</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b',marginBottom:20,lineHeight:1.7}}>
            Enter your ADMIN_KEY in the password field in the top-right of the admin header to unlock the Outreach Portal.
          </div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#475569',padding:'10px 16px',background:'rgba(0,0,0,.3)',border:'1px solid var(--border)',textAlign:'left',lineHeight:2}}>
            The ADMIN_KEY is set as a Vercel environment variable.<br/>
            Find it in: Vercel → Project → Settings → Environment Variables → ADMIN_KEY
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{maxWidth:1100}}>
      <style>{S}</style>

      {/* Flash message */}
      {msg && <div style={{position:'fixed',top:20,right:20,zIndex:2000,background:msg.ok?'#14532d':'#7f1d1d',border:`1px solid ${msg.ok?'#22c55e':'#ef4444'}`,color:msg.ok?'#4ade80':'#f87171',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:'10px 18px',boxShadow:'0 4px 20px rgba(0,0,0,.6)'}}>{msg.m}</div>}

      {/* Modals */}
      {sendContact && <SendModal contact={sendContact} templates={templates} adminKey={adminKey} onClose={()=>setSendContact(null)} onSent={()=>{setSendContact(null);loadContacts();loadSendStats()}} />}
      {detailContact && <ContactDetail contact={detailContact} templates={templates} adminKey={adminKey} onClose={()=>setDetailContact(null)} onEdit={()=>{setEditContact(detailContact);setDetailContact(null)}} onRefresh={()=>{loadContacts();loadSendStats()}} />}
      {editContact && <ContactModal contact={editContact._id?editContact:null} onSave={saveContact} onClose={()=>setEditContact(null)} />}

      {/* Header */}
      <div style={{marginBottom:20}}>
        <h1 style={{fontFamily:"'Bebas Neue',cursive",fontSize:'2rem',letterSpacing:'.06em',color:'var(--gold)',margin:0,lineHeight:1}}>📬 OUTREACH PORTAL</h1>
        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',margin:'4px 0 0'}}>
          Contact management · Individual sends · Campaign blasts · Full tracking
        </p>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} sendStats={sendStats} />

      {/* Smart suggestions banner */}
      {suggestions.length > 0 && tab==='contacts' && (
        <div style={{padding:'12px 16px',background:'rgba(200,146,42,.06)',border:'1px solid rgba(200,146,42,.2)',marginBottom:16,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',letterSpacing:'.08em',flexShrink:0}}>💡 SUGGESTIONS</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text-dim)',flex:1}}>
            {suggestions.filter(c=>!c.lastContactedAt).length} contacts never emailed · {suggestions.filter(c=>c.lastContactedAt).length} haven't heard from you in 14+ days
          </div>
          <button className="op-btn op-btn-sm" onClick={()=>{setSelectedIds(new Set(suggestions.map(c=>c._id)));setTab('send')}}>
            Queue Follow-Ups →
          </button>
        </div>
      )}

      {/* Seed buttons */}
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <button className="op-btn-ghost op-btn-sm" onClick={seedTemplates}>🌱 Seed Templates + YouTubers</button>
        <button className="op-btn-ghost op-btn-sm" onClick={seedManufacturers}>🏭 Seed 70+ Manufacturers</button>
        <button className="op-btn-ghost op-btn-sm" onClick={seedDealers}>🛒 Seed 30+ Dealers & Retailers</button>
        <button className="op-btn-ghost op-btn-sm" onClick={seedHolsters}>🔒 Seed 40+ Holster Companies</button>
      </div>

      {/* ── SETUP BANNER — shows when database is empty ── */}
      {stats && stats.total === 0 && (
        <div style={{marginBottom:20,padding:'20px 24px',background:'rgba(200,146,42,.06)',border:'2px solid rgba(200,146,42,.4)',borderRadius:2}}>
          <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:6}}>
                🚀 First Time Setup — No Contacts Yet
              </div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#94a3b8',lineHeight:1.8,marginBottom:12}}>
                Your outreach database is empty. Hit <strong style={{color:'var(--gold)'}}>Seed Everything</strong> to load:<br/>
                10 email templates · 25 YouTubers (hickok45, Garand Thumb, Colion Noir + more) · 70+ manufacturers · 30+ dealers · 40+ holster companies.<br/>
                This takes ~60 seconds. Do it once and your contact lists are ready.
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="op-btn" onClick={seedAll} disabled={loading} style={{fontSize:14,padding:'10px 24px'}}>
                  {loading ? '⏳ Seeding...' : '🚀 SEED EVERYTHING — ONE CLICK'}
                </button>
              </div>
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#475569',background:'rgba(0,0,0,.4)',padding:'12px 16px',minWidth:180}}>
              <div style={{color:'#64748b',marginBottom:6,letterSpacing:'.08em'}}>WHAT GETS LOADED</div>
              {[
                ['Templates','10 email templates'],
                ['YouTubers','25 top gun channels'],
                ['Manufacturers','70+ brands'],
                ['Dealers','30+ retailers'],
                ['Holsters','40+ companies'],
              ].map(([l,v])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',gap:12,marginBottom:2}}>
                  <span style={{color:'#64748b'}}>{l}</span>
                  <span style={{color:'var(--text-dim)'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK STATS when populated ── */}
      {stats && stats.total > 0 && (
        <div style={{marginBottom:16,padding:'10px 16px',background:'rgba(34,197,94,.05)',border:'1px solid rgba(34,197,94,.2)',display:'flex',gap:16,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#22c55e',fontWeight:700}}>✓ DATABASE LOADED</span>
          {[
            [`${stats.total} contacts`,'var(--text-dim)'],
            [`${stats.withEmail||0} with email`,'#3b82f6'],
            [`${stats.youtubers||0} YouTubers`,'#a855f7'],
            [`${stats.orgs||0} manufacturers/orgs`,'#f59e0b'],
          ].map(([l,col])=>(
            <span key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:col}}>{l}</span>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',marginBottom:24,overflowX:'auto',gap:0}}>
        {TABS.map(([k,l])=><button key={k} className={`op-tab${tab===k?' active':''}`} onClick={()=>setTab(k)}>{l}</button>)}
      </div>

      {/* ── CONTACTS ── */}
      {tab==='contacts' && (
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em'}}>
              {displayed.length} contacts {selectedIds.size>0&&`· ${selectedIds.size} selected`}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {selectedIds.size>0 && <>
                <button className="op-btn op-btn-sm" onClick={()=>setTab('send')}>✉ Email Selected</button>
                <button className="op-btn-ghost op-btn-sm" style={{color:'#ef4444',borderColor:'#ef4444'}} onClick={async()=>{if(!confirm(`Delete ${selectedIds.size}?`))return;await fetch('/api/outreach/contacts',{method:'DELETE',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({ids:[...selectedIds]})});setSelectedIds(new Set());loadContacts()}}>Delete</button>
              </>}
              <button className="op-btn op-btn-sm" onClick={()=>setEditContact({})}>+ Add</button>
            </div>
          </div>

          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            <input className="op-input" placeholder="Search..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{width:200}} />
            <select className="op-select" value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              {Object.entries(TYPE_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
            <select className="op-select" value={filterStatus} onChange={e=>{setFilterStatus(e.target.value)}}>
              {['active','unsubscribed','bounced','do_not_contact','pending'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <button className="op-btn-ghost op-btn-sm" onClick={loadContacts}>↻</button>
          </div>

          <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
            <table className="op-table">
              <thead>
                <tr>
                  <th style={{width:30}}><input type="checkbox" checked={selectedIds.size===displayed.length&&displayed.length>0} onChange={toggleAll} /></th>
                  <th>Name</th><th>Type</th><th>Email</th><th>Location</th><th>Last Contact</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length===0&&<tr><td colSpan={7} style={{textAlign:'center',padding:32,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b'}}>No contacts. Use Seed, Scrape, or Import to build your list.</td></tr>}
                {displayed.map(c=>(
                  <tr key={c._id} className="op-row-hover" onClick={()=>setDetailContact(c)}>
                    <td onClick={e=>e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(c._id)} onChange={()=>toggleSel(c._id)} /></td>
                    <td>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)'}}>{c.name}</div>
                      {c.subscribers>0&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#a855f7'}}>{(c.subscribers/1000).toFixed(0)}K subs</div>}
                    </td>
                    <td><Bdg type={c.type} /></td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:c.email?'var(--gold)':'#475569',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.email||'—'}</td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#94a3b8',whiteSpace:'nowrap'}}>{[c.city,c.state].filter(Boolean).join(', ')||'—'}</td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:!c.lastContactedAt?'#f59e0b':'#64748b',whiteSpace:'nowrap'}}>
                      {c.lastContactedAt ? fmt(c.lastContactedAt) : '⚠ Never'}
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{display:'flex',gap:4}}>
                        <button className="op-send-btn" onClick={()=>setSendContact(c)} disabled={!c.email} title={!c.email?'No email':'Send email'}>✉</button>
                        <button className="op-btn-ghost op-btn-sm" onClick={()=>setEditContact(c)}>✏</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SEND TAB ── */}
      {tab==='send' && (
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:16}}>
            Bulk Campaign Send {selectedIds.size>0&&`— ${selectedIds.size} contacts selected`}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:20}}>
            <div>
              <div className="op-card" style={{marginBottom:12}}>
                <label className="op-label">Campaign</label>
                <select className="op-select" value={bulkCampaignId} onChange={e=>setBulkCampaignId(e.target.value)} style={{width:'100%',marginBottom:12}}>
                  <option value="">— select —</option>
                  {campaigns.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',marginBottom:12}}>
                  {selectedIds.size>0?`Sending to ${selectedIds.size} selected contacts`:'Sending to all contacts matching campaign filters'}
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button className="op-btn-ghost op-btn-sm" onClick={()=>runBulkSend(true)} disabled={bulkRunning}>🧪 Dry Run</button>
                  <button className="op-btn" onClick={()=>runBulkSend(false)} disabled={bulkRunning||!bulkCampaignId}>
                    {bulkRunning?'Sending...':'🚀 Send Now'}
                  </button>
                </div>
              </div>

              {bulkResult && (
                <div className="op-card" style={{borderLeft:`3px solid ${bulkResult.ok?'#22c55e':'#ef4444'}`}}>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1rem',color:bulkResult.ok?'#22c55e':'#ef4444',marginBottom:8}}>
                    {bulkResult.dryRun?'DRY RUN':bulkResult.ok?'SENT':'FAILED'}
                  </div>
                  {bulkResult.ok&&<div style={{display:'flex',gap:16}}>
                    {[['Sent',bulkResult.sent,'#22c55e'],['Failed',bulkResult.failed,'#ef4444'],['Skipped',bulkResult.skipped,'#f59e0b']].map(([l,v,c])=>(
                      <div key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}><span style={{color:'#64748b'}}>{l}: </span><span style={{color:c,fontWeight:700}}>{v}</span></div>
                    ))}
                  </div>}
                  {bulkResult.error&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#f87171'}}>{bulkResult.error}</div>}
                </div>
              )}
            </div>

            {/* Contact picker */}
            <div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',marginBottom:8}}>Select specific recipients, or leave blank to use campaign filters</div>
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <input className="op-input" placeholder="Search..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{flex:1}} />
                <select className="op-select" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                  <option value="all">All</option>
                  {Object.entries(TYPE_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{maxHeight:400,overflowY:'auto',border:'1px solid var(--border)'}}>
                {displayed.filter(c=>c.email).slice(0,300).map(c=>(
                  <div key={c._id} onClick={()=>toggleSel(c._id)}
                    style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderBottom:'1px solid rgba(30,41,59,.3)',cursor:'pointer',background:selectedIds.has(c._id)?'rgba(200,146,42,.08)':'transparent'}}>
                    <input type="checkbox" checked={selectedIds.has(c._id)} onChange={()=>toggleSel(c._id)} onClick={e=>e.stopPropagation()} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name}</div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b'}}>{c.email}</div>
                    </div>
                    <Bdg type={c.type} />
                    {!c.lastContactedAt&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'#f59e0b'}}>NEW</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── APPROVAL QUEUE TAB ── */}
      {tab==='queue' && (
        <div>
          {/* Queue header */}
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
            <div>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.6rem',color:'var(--gold)',letterSpacing:'.06em',lineHeight:1}}>⚡ Approval Queue</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',marginTop:3}}>
                Personalized drafts waiting for your review. Nothing sends without your approval.
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button className="op-btn-ghost op-btn-sm" onClick={()=>queueAction('digest')}>📧 Email Me Queue</button>
              <button className="op-btn-ghost op-btn-sm" onClick={()=>loadQueue()}>↻ Refresh</button>
              <button className="op-btn" onClick={()=>setShowGenerate(p=>!p)}>⚡ Generate Drafts</button>
            </div>
          </div>

          {/* Queue stats strip */}
          <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
            {[['Draft',queueStats.draft,'#3b82f6'],['Snoozed',queueStats.snoozed,'#f59e0b'],['Sent',queueStats.sent,'#22c55e'],['Replied',queueStats.replied,'#a855f7'],['Skipped',queueStats.skipped,'#6b7280']].map(([l,v,col])=>(
              <div key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:'4px 12px',background:'var(--bg2)',border:`1px solid ${col}44`}}>
                <span style={{color:'#64748b'}}>{l}: </span><span style={{color:col,fontWeight:700}}>{v||0}</span>
              </div>
            ))}
          </div>

          {/* Generate drafts panel */}
          {showGenerate && (
            <div style={{marginBottom:16,padding:'16px 20px',background:'rgba(200,146,42,.06)',border:'1px solid rgba(200,146,42,.3)'}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',fontWeight:700,letterSpacing:'.08em',marginBottom:12}}>GENERATE DRAFT EMAILS</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',marginBottom:12,lineHeight:1.7}}>
                Auto-drafts personalized emails for your contacts. Templates matched by contact type automatically. Nothing sends — everything goes to the queue for your review first.
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10,marginBottom:12}}>
                <div>
                  <label className="op-label">Contact Type</label>
                  <select className="op-select" value={genFilterType} onChange={e=>setGenFilterType(e.target.value)} style={{width:'100%'}}>
                    <option value="">All types</option>
                    {Object.entries(TYPE_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="op-label">State Filter</label>
                  <select className="op-select" value={genFilterState} onChange={e=>setGenFilterState(e.target.value)} style={{width:'100%'}}>
                    <option value="">All states</option>
                    {['WA','OR','ID','CA','TX','FL','AZ','CO','MT','GA','TN','KY','OH','PA','NC','VA'].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="op-label">Template Override</label>
                  <select className="op-select" value={genTemplateId} onChange={e=>setGenTemplateId(e.target.value)} style={{width:'100%'}}>
                    <option value="">Auto-match by type</option>
                    {templates.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="op-label">Max Drafts</label>
                  <select className="op-select" value={genLimit} onChange={e=>setGenLimit(Number(e.target.value))} style={{width:'100%'}}>
                    {[10,25,50,100,200].map(n=><option key={n} value={n}>{n} contacts</option>)}
                  </select>
                </div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:8,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text-dim)',marginBottom:12,cursor:'pointer'}}>
                <input type="checkbox" checked={genSkip} onChange={e=>setGenSkip(e.target.checked)} />
                Skip contacts already emailed
              </label>
              {genResult&&(
                <div style={{marginBottom:10,padding:'8px 12px',background:genResult.ok?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)',border:`1px solid ${genResult.ok?'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:genResult.ok?'#4ade80':'#f87171'}}>
                  {genResult.ok ? `✅ ${genResult.created} drafts created · ${genResult.skipped} skipped` : `❌ ${genResult.error}`}
                </div>
              )}
              <div style={{display:'flex',gap:8}}>
                <button className="op-btn" onClick={generateDrafts} disabled={genRunning}>
                  {genRunning?'⏳ Generating...':'⚡ Generate Now'}
                </button>
                <button className="op-btn-ghost op-btn-sm" onClick={()=>setShowGenerate(false)}>Close</button>
              </div>
            </div>
          )}

          {/* Queue sub-tabs */}
          <div style={{display:'flex',gap:0,borderBottom:'1px solid var(--border)',marginBottom:12,overflowX:'auto'}}>
            {['draft','snoozed','sent','replied','skipped'].map(t=>(
              <button key={t} className={`op-tab${queueTab===t?' active':''}`} onClick={()=>{setQueueTab(t);setQueueSelected(null)}}
                style={{fontSize:12,padding:'8px 14px'}}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                {t==='draft'&&queueStats.draft>0&&<span style={{marginLeft:4,background:'#3b82f6',color:'#fff',fontFamily:"'IBM Plex Mono',monospace",fontSize:8,padding:'1px 4px',borderRadius:8}}>{queueStats.draft}</span>}
              </button>
            ))}
          </div>

          {/* Bulk actions bar */}
          {selectedQueueIds.size>0&&(
            <div style={{display:'flex',gap:8,padding:'8px 14px',background:'rgba(200,146,42,.08)',border:'1px solid rgba(200,146,42,.3)',marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--gold)'}}>{selectedQueueIds.size} selected</span>
              {queueTab==='draft'&&<button className="op-btn op-btn-sm" style={{background:'#22c55e',color:'#000'}} onClick={()=>{if(confirm(`Send ${selectedQueueIds.size} emails?`))queueAction('approve',{ids:[...selectedQueueIds]})}} disabled={queueSending}>✅ Approve All</button>}
              <button className="op-btn-ghost op-btn-sm" style={{color:'#ef4444',borderColor:'rgba(239,68,68,.3)'}} onClick={()=>queueAction('skip',{ids:[...selectedQueueIds]})} disabled={queueSending}>Skip All</button>
              <button className="op-btn-ghost op-btn-sm" onClick={()=>setSelectedQueueIds(new Set())}>Clear</button>
              {queueTab==='draft'&&<button className="op-btn op-btn-sm" style={{background:'#22c55e',color:'#000',marginLeft:'auto'}} onClick={()=>{const ids=queueEntries.map(e=>e._id);if(confirm(`Send ALL ${ids.length} emails?`))queueAction('approve',{ids})}} disabled={queueSending}>✅ Approve All {queueEntries.length}</button>}
            </div>
          )}

          {queueLoading ? (
            <div style={{padding:32,textAlign:'center',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b'}}>Loading queue...</div>
          ) : queueEntries.length===0 ? (
            <div style={{padding:'32px 24px',border:'1px solid var(--border)',background:'var(--bg2)',textAlign:'center'}}>
              <div style={{fontSize:36,marginBottom:10}}>{queueTab==='draft'?'✉️':'📭'}</div>
              <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.2rem',color:'var(--text)',letterSpacing:'.05em',marginBottom:8}}>
                {queueTab==='draft'?'No drafts yet':'Nothing here'}
              </div>
              {queueTab==='draft'&&(
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',lineHeight:1.8,maxWidth:440,margin:'0 auto 16px',padding:'12px 16px',background:'rgba(0,0,0,.3)',border:'1px solid var(--border)',textAlign:'left'}}>
                  <strong style={{color:'var(--gold)'}}>Step 1:</strong> Make sure contacts are seeded (Contacts tab shows data)<br/>
                  <strong style={{color:'var(--gold)'}}>Step 2:</strong> Make sure templates are seeded (Templates tab shows 10 templates)<br/>
                  <strong style={{color:'var(--gold)'}}>Step 3:</strong> Hit <strong>⚡ Generate Drafts</strong> above
                </div>
              )}
              {queueTab==='draft'&&<button className="op-btn op-btn-sm" onClick={()=>setShowGenerate(true)}>⚡ Generate Drafts</button>}
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:0,border:'1px solid var(--border)',height:'calc(100vh - 400px)',minHeight:400}}>
              {/* Left list */}
              <div style={{overflowY:'auto',borderRight:'1px solid var(--border)'}}>
                <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:8,background:'var(--bg)'}}>
                  <input type="checkbox" checked={selectedQueueIds.size===queueEntries.length&&queueEntries.length>0}
                    onChange={()=>setSelectedQueueIds(p=>p.size===queueEntries.length?new Set():new Set(queueEntries.map(e=>e._id)))} />
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em'}}>SELECT ALL {queueEntries.length}</span>
                </div>
                {queueEntries.map(e=>(
                  <div key={e._id}
                    onClick={()=>{setQueueSelected(e._id);setQueueEditMode(false)}}
                    style={{padding:'12px 14px',borderBottom:'1px solid rgba(30,41,59,.4)',cursor:'pointer',
                      background:queueSelected===e._id?'rgba(200,146,42,.08)':'transparent',
                      borderLeft:queueSelected===e._id?'3px solid var(--gold)':'3px solid transparent'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                      <input type="checkbox" checked={selectedQueueIds.has(e._id)}
                        onClick={ev=>ev.stopPropagation()}
                        onChange={()=>setSelectedQueueIds(p=>{const n=new Set(p);n.has(e._id)?n.delete(e._id):n.add(e._id);return n})}
                        style={{marginTop:2,flexShrink:0}} />
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',gap:6,marginBottom:3,alignItems:'center',flexWrap:'wrap'}}>
                          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:queueSelected===e._id?'var(--gold)':'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{e.toName}</span>
                          {e.contact?.type&&<Bdg type={e.contact.type} />}
                        </div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.toEmail}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#475569',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',opacity:.8}}>{e.subject}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'#374151',marginTop:2}}>
                          {e.draftedAt?`drafted ${fmt(e.draftedAt)}`:''}
                          {e.contact?.state?` · ${e.contact.state}`:''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right preview */}
              <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
                {!queueSelected ? (
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',flex:1,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#475569'}}>
                    ← Select a draft to preview
                  </div>
                ) : (() => {
                  const entry = queueEntries.find(e=>e._id===queueSelected)
                  if (!entry) return null
                  return (
                    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
                      {/* Toolbar */}
                      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',background:'var(--bg)',flexShrink:0}}>
                        {queueTab==='draft'&&<>
                          <button className="op-btn op-btn-sm" style={{background:'#22c55e',color:'#000',fontSize:11}} onClick={()=>queueAction('approve',{ids:[entry._id]})} disabled={queueSending}>
                            {queueSending?'Sending...':'✅ Approve & Send'}
                          </button>
                          <button className="op-btn-ghost op-btn-sm" style={{color:'#f59e0b',borderColor:'rgba(245,158,11,.3)',fontSize:10}} onClick={()=>queueAction('snooze',{id:entry._id,days:7})} disabled={queueSending}>💤 7d</button>
                          <button className="op-btn-ghost op-btn-sm" style={{color:'#f59e0b',borderColor:'rgba(245,158,11,.3)',fontSize:10}} onClick={()=>queueAction('snooze',{id:entry._id,days:14})} disabled={queueSending}>💤 14d</button>
                          <button className="op-btn-ghost op-btn-sm" style={{color:'#ef4444',borderColor:'rgba(239,68,68,.3)',fontSize:10}} onClick={()=>queueAction('skip',{ids:[entry._id]})} disabled={queueSending}>✕ Skip</button>
                          <button className="op-btn-ghost op-btn-sm" style={{fontSize:10,marginLeft:'auto'}} onClick={()=>{setQueueEditMode(m=>!m);setQueueEditSubj(entry.subject);setQueueEditTid('')}}>
                            {queueEditMode?'Cancel':'✏ Edit'}
                          </button>
                        </>}
                      </div>
                      {/* Edit bar */}
                      {queueEditMode&&queueTab==='draft'&&(
                        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',background:'rgba(200,146,42,.04)',flexShrink:0}}>
                          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
                            <div style={{flex:2,minWidth:160}}>
                              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--text-dim)',marginBottom:3}}>SUBJECT</div>
                              <input className="op-input" value={queueEditSubj} onChange={e=>setQueueEditSubj(e.target.value)} style={{fontSize:11}} />
                            </div>
                            <div style={{flex:1,minWidth:140}}>
                              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--text-dim)',marginBottom:3}}>SWAP TEMPLATE</div>
                              <select className="op-select" value={queueEditTid} onChange={e=>setQueueEditTid(e.target.value)} style={{width:'100%'}}>
                                <option value="">Keep current</option>
                                {templates.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
                              </select>
                            </div>
                          </div>
                          <button className="op-btn op-btn-sm" onClick={()=>queueAction('edit',{id:entry._id,subject:queueEditSubj||undefined,templateId:queueEditTid||undefined})} disabled={queueSending}>Save Changes</button>
                        </div>
                      )}
                      {/* Contact strip */}
                      <div style={{padding:'8px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg2)',display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',flexShrink:0}}>
                        <div>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',lineHeight:1}}>{entry.toName}</div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--gold)',marginTop:1}}>{entry.toEmail}</div>
                        </div>
                        {entry.contact?.type&&<Bdg type={entry.contact.type} />}
                        {entry.contact?.state&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>{entry.contact.city?`${entry.contact.city}, `:''}{entry.contact.state}</span>}
                        {entry.template&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#475569',marginLeft:'auto'}}>Template: {entry.template.name}</span>}
                      </div>
                      {/* Subject */}
                      <div style={{padding:'6px 14px',borderBottom:'1px solid var(--border)',background:'var(--bg)',flexShrink:0}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em'}}>SUBJECT: </span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text)'}}>{entry.subject}</span>
                      </div>
                      {/* Email iframe */}
                      {entry.bodyHtml ? (
                        <iframe srcDoc={entry.bodyHtml} style={{flex:1,width:'100%',border:'none',display:'block'}} title={`Preview: ${entry.toName}`} />
                      ) : (
                        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#475569'}}>No preview available</div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab==='history' && (
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:6}}>Send History</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',marginBottom:16}}>Click a row to mark as replied/opened. Contact name opens their full timeline.</div>

          {/* Send stats bar */}
          {sendStats && (
            <div style={{display:'flex',gap:16,marginBottom:16,padding:'12px 16px',background:'var(--bg2)',border:'1px solid var(--border)',flexWrap:'wrap'}}>
              {[['Total Sent',sendStats.totalSent,'#3b82f6'],['Opened',sendStats.opened,'#a855f7'],['Clicked',sendStats.clicked,'#f59e0b'],['Replied',sendStats.replied,'#22c55e'],['Bounced',sendStats.bounced,'#ef4444'],['Failed',sendStats.failed,'#ef4444'],['Last 24h',sendStats.last24h,'var(--gold)']].map(([l,v,c])=>(
                <div key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>
                  <span style={{color:'#64748b'}}>{l}: </span><span style={{color:c,fontWeight:700}}>{v||0}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{overflowX:'auto',maxHeight:'65vh',overflowY:'auto'}}>
            <table className="op-table">
              <thead>
                <tr><th>Status</th><th>Contact</th><th>Subject</th><th>Campaign</th><th>Sent</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {historyLogs.length===0&&<tr><td colSpan={6} style={{textAlign:'center',padding:32,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b'}}>No sends yet.</td></tr>}
                {historyLogs.map(log=>(
                  <tr key={log._id} className="op-row-hover">
                    <td><Bdg type={log.status} scheme="send" /></td>
                    <td>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--text)',cursor:'pointer'}} onClick={()=>log.contact&&setDetailContact(log.contact)}>
                        {log.toName||log.contact?.name||log.toEmail}
                      </div>
                      {log.contact?.type&&<div style={{marginTop:2}}><Bdg type={log.contact.type} /></div>}
                    </td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--text-dim)',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{log.subject}</td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>{log.campaign?.name||'—'}</td>
                    <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',whiteSpace:'nowrap'}}>{fmt(log.sentAt)}</td>
                    <td>
                      {log.status==='sent'&&(
                        <div style={{display:'flex',gap:4}}>
                          <button className="op-btn-ghost op-btn-sm" style={{fontSize:9}} onClick={async()=>{await fetch('/api/outreach/history',{method:'PATCH',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({id:log._id,status:'replied'})});loadHistory()}}>Replied</button>
                          <button className="op-btn-ghost op-btn-sm" style={{fontSize:9}} onClick={async()=>{await fetch('/api/outreach/history',{method:'PATCH',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({id:log._id,status:'opened'})});loadHistory()}}>Opened</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {tab==='campaigns' && (
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:16}}>Campaigns</div>
          {campaigns.length===0?<div style={{padding:40,textAlign:'center',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b'}}>No campaigns. Create one to start sending at scale.</div>:(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {campaigns.map(c=>(
                <div key={c._id} className="op-card" style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:12,alignItems:'center'}}>
                  <div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:3}}>{c.name}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b'}}>
                      {c.type?.replace(/_/g,' ')} · {c.template?.name||'no template'} · {c.createdAt?new Date(c.createdAt).toLocaleDateString():''}
                    </div>
                    {c.stats&&<div style={{display:'flex',gap:10,marginTop:6}}>
                      {[['Sent',c.stats.sent,'#e5e7eb'],['Opened',c.stats.opened,'#a855f7'],['Replied',c.stats.replied,'#22c55e'],['Bounced',c.stats.bounced,'#ef4444']].map(([l,v,col])=>(
                        <span key={l} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:col}}>{l}: {v||0}</span>
                      ))}
                    </div>}
                  </div>
                  <Bdg type={c.status} scheme="status" />
                  <button className="op-btn op-btn-sm" onClick={()=>{setBulkCampaignId(c._id);setTab('send')}}>Send →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab==='templates' && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em'}}>Email Templates</div>
            <button className="op-btn-ghost op-btn-sm" onClick={seedTemplates}>🌱 Seed / Refresh Defaults</button>
          </div>
          {templates.length===0?(
            <div style={{padding:40,textAlign:'center'}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#64748b',marginBottom:12}}>No templates yet.</div>
              <button className="op-btn" onClick={seedTemplates}>Seed Default Templates</button>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
              {templates.map(t=>(
                <div key={t._id} className="op-card" style={{borderLeft:`3px solid ${TYPE_C[t.type]||'var(--gold)'}`}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:4}}>{t.name}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',marginBottom:8}}>
                    {t.type} · {t.isActive?'✅ active':'⏸ off'}
                  </div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--text-dim)',background:'var(--bg)',padding:'6px 8px',marginBottom:8}}>
                    {t.subject}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <button className="op-btn-ghost op-btn-sm" onClick={async()=>{if(!confirm('Delete?'))return;await fetch('/api/outreach/templates',{method:'DELETE',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({id:t._id})});loadTemplates()}}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SCRAPE ── */}
      {tab==='scrape' && (
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:16}}>Contact Scrapers</div>
          <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20}}>
            <div className="op-card">
              <label className="op-label">Source</label>
              <select className="op-select" value={scrapeSource} onChange={e=>setScrapeSource(e.target.value)} style={{width:'100%',marginBottom:10}}>
                <option value="ffl">ATF FFL Database</option>
                <option value="nra">NRA Instructors</option>
                <option value="youtube">YouTube Enricher</option>
              </select>
              <label className="op-label">State</label>
              <select className="op-select" value={scrapeState} onChange={e=>setScrapeState(e.target.value)} style={{width:'100%',marginBottom:14}}>
                {['','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s=><option key={s} value={s}>{s||'All States'}</option>)}
              </select>
              <div style={{display:'flex',gap:8}}>
                <button className="op-btn-ghost op-btn-sm" onClick={()=>runScrape(false)} disabled={scrapeRunning}>Preview</button>
                <button className="op-btn op-btn-sm" onClick={()=>runScrape(true)} disabled={scrapeRunning}>{scrapeRunning?'Running...':'Scrape & Save'}</button>
              </div>
            </div>
            <div>
              {scrapeResult&&(
                <div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1rem',color:'var(--gold)',marginBottom:10}}>
                    {scrapeResult.count||0} contacts found {scrapeResult.saved&&`· ${scrapeResult.saved.created} saved`}
                  </div>
                  {scrapeResult.note&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#f59e0b',padding:'8px 12px',background:'rgba(245,158,11,.06)',border:'1px solid rgba(245,158,11,.2)',marginBottom:10}}>⚠ {scrapeResult.note}</div>}
                  <div style={{maxHeight:400,overflowY:'auto',border:'1px solid var(--border)'}}>
                    <table className="op-table"><thead><tr><th>Name</th><th>Type</th><th>Location</th></tr></thead>
                      <tbody>{(scrapeResult.contacts||[]).slice(0,100).map((c,i)=>(
                        <tr key={i}>
                          <td style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:600}}>{c.name}</td>
                          <td><Bdg type={c.type} /></td>
                          <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#94a3b8'}}>{[c.city,c.state].filter(Boolean).join(', ')}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── IMPORT ── */}
      {tab==='import' && (
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.3rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:16}}>CSV Import</div>
          <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:20}}>
            <div className="op-card">
              <label className="op-label">CSV File</label>
              <input ref={fileRef} type="file" accept=".csv" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text-dim)',display:'block',width:'100%',marginBottom:12}} />
              <label className="op-label">Default Type</label>
              <select className="op-select" value={importType} onChange={e=>setImportType(e.target.value)} style={{width:'100%',marginBottom:14}}>
                {Object.entries(TYPE_L).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
              <button className="op-btn" onClick={runImport} disabled={importRunning} style={{width:'100%'}}>{importRunning?'Importing...':'Import CSV'}</button>
              {importResult&&<div style={{marginTop:10,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:importResult.ok?'#22c55e':'#f87171'}}>
                {importResult.ok?`✅ ${importResult.created} created, ${importResult.skipped} skipped`:importResult.error}
              </div>}
            </div>
            <div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',lineHeight:2}}>Auto-detected columns:</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,marginTop:8}}>
                {[['name / business name','Name'],['first name / fname','First Name'],['email / email address','Email'],['phone / telephone','Phone'],['city','City'],['state / st','State'],['website / url','Website'],['youtube / youtube url','YouTube'],['subscribers / subs','Subscribers'],['ffl / ffl license','FFL License'],['notes / comments','Notes']].map(([k,v])=>(
                  <div key={k} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:'3px 8px',background:'var(--bg2)',border:'1px solid var(--border)'}}>
                    <span style={{color:'#64748b'}}>{k}</span> <span style={{color:'var(--gold)'}}>→ {v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
