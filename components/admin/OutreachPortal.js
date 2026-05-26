'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = `
.op-btn { background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:8px 18px;cursor:pointer;transition:opacity 0.15s; }
.op-btn:hover:not(:disabled){opacity:0.85} .op-btn:disabled{opacity:0.4;cursor:not-allowed}
.op-btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:7px 13px;cursor:pointer;transition:border-color 0.15s,color 0.15s}
.op-btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.op-btn-danger{background:#ef4444;color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;padding:6px 14px;cursor:pointer}
.op-btn-sm{padding:5px 12px;font-size:12px}
.op-input{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 12px;outline:none;width:100%;box-sizing:border-box}
.op-input:focus{border-color:var(--gold)}
.op-select{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:7px 10px;outline:none;cursor:pointer}
.op-select:focus{border-color:var(--gold)}
.op-textarea{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:10px 12px;outline:none;width:100%;box-sizing:border-box;resize:vertical}
.op-textarea:focus{border-color:var(--gold)}
.op-label{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;display:block;margin-bottom:5px}
.op-card{background:var(--bg2);border:1px solid var(--border);padding:16px 20px}
.op-table{width:100%;border-collapse:collapse}
.op-table th{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;padding:10px 12px;border-bottom:1px solid var(--border);text-align:left;white-space:nowrap;background:var(--bg2)}
.op-table td{padding:10px 12px;border-bottom:1px solid rgba(30,41,59,0.4);font-size:13px;vertical-align:middle}
.op-table tr:hover td{background:rgba(200,146,42,0.04)}
.op-badge{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:0.06em;padding:2px 7px;text-transform:uppercase}
.op-tab-btn{background:none;border:none;border-bottom:2px solid transparent;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:10px 16px;cursor:pointer;color:var(--text-dim);transition:all 0.15s;white-space:nowrap}
.op-tab-btn.active{color:var(--gold);border-bottom-color:var(--gold)}
.op-tab-btn:hover:not(.active){color:var(--text)}
.op-stat{background:var(--bg2);border:1px solid var(--border);padding:16px 20px;text-align:center}
.op-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px}
.op-modal{background:#0A0B0C;border:1px solid var(--border);border-top:3px solid var(--gold);width:100%;max-width:640px;max-height:90vh;overflow-y:auto;padding:28px}
`

// ── Type badge colors ─────────────────────────────────────────────────────────
const TYPE_COLORS = {
  gun_shop:     '#C8922A', instructor: '#22c55e', youtuber: '#a855f7',
  influencer:   '#ec4899', ffl_dealer: '#3b82f6', range:     '#06b6d4',
  organization: '#f59e0b', press:      '#ef4444', other:     '#6b7280',
}
const TYPE_LABELS = {
  gun_shop:'Gun Shop', instructor:'Instructor', youtuber:'YouTuber',
  influencer:'Influencer', ffl_dealer:'FFL Dealer', range:'Range',
  organization:'Organization', press:'Press', other:'Other',
}
const STATUS_COLORS = { active:'#22c55e', unsubscribed:'#f59e0b', bounced:'#ef4444', do_not_contact:'#ef4444', pending:'#3b82f6' }

function TypeBadge({ type }) {
  return <span className="op-badge" style={{ background:(TYPE_COLORS[type]||'#6b7280')+'22', color:TYPE_COLORS[type]||'#6b7280', border:`1px solid ${TYPE_COLORS[type]||'#6b7280'}44` }}>{TYPE_LABELS[type]||type}</span>
}
function StatusBadge({ status }) {
  const c = STATUS_COLORS[status]||'#6b7280'
  return <span className="op-badge" style={{ background:c+'22', color:c, border:`1px solid ${c}44` }}>{status?.replace('_',' ')}</span>
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="op-stat">
      <div style={{ fontSize:28, marginBottom:4 }}>{icon}</div>
      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:color||'var(--text)', lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', marginTop:4, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
      {sub && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', marginTop:2 }}>{sub}</div>}
    </div>
  )
}

// ── Section Header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
      <div>
        <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', letterSpacing:'0.05em', color:'var(--gold)', margin:0, lineHeight:1 }}>{title}</h2>
        {sub && <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', margin:'4px 0 0' }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Contact Edit Modal ────────────────────────────────────────────────────────
function ContactModal({ contact, onSave, onClose }) {
  const [form, setForm] = useState(contact || { type:'gun_shop', status:'active', country:'USA' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    onSave(form)
    setSaving(false)
  }

  return (
    <div className="op-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="op-modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.05em' }}>
            {contact?._id ? 'Edit Contact' : 'Add Contact'}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-dim)', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[['Name / Business Name','name',true],['First Name','firstName',false]].map(([lbl,key,req])=>(
            <div key={key} style={{ gridColumn: key==='name' ? '1/-1' : undefined }}>
              <label className="op-label">{lbl}{req?' *':''}</label>
              <input className="op-input" value={form[key]||''} onChange={e=>set(key,e.target.value)} />
            </div>
          ))}

          <div>
            <label className="op-label">Type *</label>
            <select className="op-select" value={form.type||'gun_shop'} onChange={e=>set('type',e.target.value)} style={{ width:'100%' }}>
              {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="op-label">Status</label>
            <select className="op-select" value={form.status||'active'} onChange={e=>set('status',e.target.value)} style={{ width:'100%' }}>
              {['active','unsubscribed','bounced','do_not_contact','pending'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {[['Email','email'],['Phone','phone'],['City','city'],['State','state'],['ZIP','zip'],['Website','website'],['YouTube URL','youtubeUrl'],['Instagram','instagram'],['Twitter/X','twitter'],['FFL License','fflLicense'],['NRA Instructor ID','nraInstructorId']].map(([lbl,key])=>(
            <div key={key}>
              <label className="op-label">{lbl}</label>
              <input className="op-input" value={form[key]||''} onChange={e=>set(key,e.target.value)} />
            </div>
          ))}

          <div style={{ gridColumn:'1/-1' }}>
            <label className="op-label">Notes</label>
            <textarea className="op-textarea" rows={2} value={form.notes||''} onChange={e=>set('notes',e.target.value)} />
          </div>

          <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:8 }}>
            <input type="checkbox" id="embedPerm" checked={!!form.emailPermission} onChange={e=>set('emailPermission',e.target.checked)} />
            <label htmlFor="embedPerm" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)' }}>YouTube embed permission granted</label>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button className="op-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="op-btn" onClick={save} disabled={saving}>{saving?'Saving...':'Save Contact'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Template Editor Modal ─────────────────────────────────────────────────────
function TemplateModal({ template, onSave, onClose }) {
  const [form, setForm] = useState(template || { type:'gun_shop', isActive:true })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const VARS = ['{{firstName}}','{{businessName}}','{{channelName}}','{{state}}','{{city}}','{{cityState}}','{{youtubeUrl}}','{{subscribers}}','{{portalUrl}}','{{unsubscribeUrl}}']

  return (
    <div className="op-modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="op-modal" style={{ maxWidth:760 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.05em' }}>
            {template?._id ? 'Edit Template' : 'New Template'}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-dim)', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="op-label">Template Name *</label>
            <input className="op-input" value={form.name||''} onChange={e=>set('name',e.target.value)} />
          </div>
          <div>
            <label className="op-label">Type</label>
            <select className="op-select" value={form.type||'gun_shop'} onChange={e=>set('type',e.target.value)} style={{ width:'100%' }}>
              {['gun_shop','instructor','youtuber','influencer','ffl_dealer','range','organization','press','follow_up','generic'].map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="op-label">Preview Text (inbox snippet)</label>
            <input className="op-input" value={form.previewText||''} onChange={e=>set('previewText',e.target.value)} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="op-label">Subject Line *</label>
            <input className="op-input" value={form.subject||''} onChange={e=>set('subject',e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
            <label className="op-label" style={{ margin:0 }}>Email Body (HTML) *</label>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {VARS.map(v=>(
                <button key={v} onClick={()=>set('body',(form.body||'')+v)}
                  style={{ background:'rgba(200,146,42,0.12)', border:'1px solid rgba(200,146,42,0.3)', color:'#C8922A', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'2px 6px', cursor:'pointer' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <textarea className="op-textarea" rows={14} value={form.body||''} onChange={e=>set('body',e.target.value)} style={{ fontFamily:'monospace', fontSize:12 }} />
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
          <button className="op-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="op-btn" onClick={()=>{setSaving(true);onSave(form)}} disabled={saving}>{saving?'Saving...':'Save Template'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Campaign Modal ────────────────────────────────────────────────────────────
function CampaignModal({ campaign, templates, onSave, onClose }) {
  const [form, setForm] = useState(campaign || { status:'draft', fromName:'DJ Cavalcanti — DownRange', fromEmail:'dj@downrangeco.com', replyTo:'dj@downrangeco.com' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  return (
    <div className="op-modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="op-modal">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.05em' }}>
            {campaign?._id ? 'Edit Campaign' : 'New Campaign'}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text-dim)', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="op-label">Campaign Name *</label>
            <input className="op-input" value={form.name||''} onChange={e=>set('name',e.target.value)} />
          </div>
          <div>
            <label className="op-label">Type</label>
            <select className="op-select" value={form.type||''} onChange={e=>set('type',e.target.value)} style={{ width:'100%' }}>
              {['launch_announcement','youtube_permission','shop_partnership','instructor_network','press_outreach','follow_up','newsletter_invite'].map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="op-label">Template</label>
            <select className="op-select" value={form.template?._id||form.templateId||''} onChange={e=>set('templateId',e.target.value)} style={{ width:'100%' }}>
              <option value="">— Select template —</option>
              {templates.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="op-label">From Name</label>
            <input className="op-input" value={form.fromName||''} onChange={e=>set('fromName',e.target.value)} />
          </div>
          <div>
            <label className="op-label">From Email</label>
            <input className="op-input" value={form.fromEmail||''} onChange={e=>set('fromEmail',e.target.value)} />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="op-label">Target Contact Types (leave blank for all)</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
              {Object.entries(TYPE_LABELS).map(([k,v])=>(
                <label key={k} style={{ display:'flex', alignItems:'center', gap:4, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', cursor:'pointer' }}>
                  <input type="checkbox"
                    checked={(form.targetTypes||[]).includes(k)}
                    onChange={e=>{
                      const cur = form.targetTypes||[]
                      set('targetTypes', e.target.checked ? [...cur,k] : cur.filter(x=>x!==k))
                    }} />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label className="op-label">Notes</label>
            <textarea className="op-textarea" rows={2} value={form.notes||''} onChange={e=>set('notes',e.target.value)} />
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
          <button className="op-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="op-btn" onClick={()=>onSave(form)}>Save Campaign</button>
        </div>
      </div>
    </div>
  )
}

// ── Main OutreachPortal ───────────────────────────────────────────────────────
export default function OutreachPortal({ adminKey }) {
  const [tab, setTab]             = useState('contacts')
  const [contacts, setContacts]   = useState([])
  const [templates, setTemplates] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [msg, setMsg]             = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Filters
  const [filterType, setFilterType]     = useState('all')
  const [filterStatus, setFilterStatus] = useState('active')
  const [searchQ, setSearchQ]           = useState('')

  // Modals
  const [editContact, setEditContact]   = useState(null)
  const [editTemplate, setEditTemplate] = useState(null)
  const [editCampaign, setEditCampaign] = useState(null)

  // Scraper state
  const [scrapeSource, setScrapeSource] = useState('ffl')
  const [scrapeState, setScrapeState]   = useState('WA')
  const [scrapeRunning, setScrapeRunning] = useState(false)
  const [scrapeResult, setScrapeResult] = useState(null)

  // Send state
  const [sendCampaignId, setSendCampaignId] = useState('')
  const [sendRunning, setSendRunning]       = useState(false)
  const [sendResult, setSendResult]         = useState(null)
  const [previewHtml, setPreviewHtml]       = useState(null)

  // Import state
  const fileRef = useRef(null)
  const [importType, setImportType]     = useState('gun_shop')
  const [importRunning, setImportRunning] = useState(false)
  const [importResult, setImportResult] = useState(null)

  const h = { 'x-admin-key': adminKey || '' }
  const flash = (m, ok=true) => { setMsg({ m, ok }); setTimeout(()=>setMsg(null), 3500) }

  // ── Loaders ─────────────────────────────────────────────────────────────────
  const loadContacts = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/outreach/contacts?limit=500&status=${filterStatus}`
      if (filterType !== 'all') url += `&type=${filterType}`
      if (searchQ) url += `&search=${encodeURIComponent(searchQ)}`
      const res = await fetch(url, { headers: h })
      const d = await res.json()
      setContacts(d.contacts || [])
      setStats(d.stats || null)
    } catch {}
    setLoading(false)
  }, [filterType, filterStatus, searchQ, adminKey])

  const loadTemplates = useCallback(async () => {
    const res = await fetch('/api/outreach/templates', { headers: h })
    const d = await res.json()
    setTemplates(d.templates || [])
  }, [adminKey])

  const loadCampaigns = useCallback(async () => {
    const res = await fetch('/api/outreach/campaigns', { headers: h })
    const d = await res.json()
    setCampaigns(d.campaigns || [])
  }, [adminKey])

  useEffect(() => { loadContacts() }, [loadContacts])
  useEffect(() => { loadTemplates(); loadCampaigns() }, [adminKey])

  // ── Contact actions ──────────────────────────────────────────────────────────
  const saveContact = async (form) => {
    const isEdit = !!form._id
    const res = await fetch('/api/outreach/contacts', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? form : [form]),
    })
    const d = await res.json()
    if (d.ok) { flash(isEdit ? 'Contact updated' : 'Contact added'); setEditContact(null); loadContacts() }
    else flash(d.error || 'Error', false)
  }

  const deleteContacts = async (ids) => {
    if (!confirm(`Delete ${ids.length} contact(s)?`)) return
    await fetch('/api/outreach/contacts', { method:'DELETE', headers:{ ...h,'Content-Type':'application/json' }, body:JSON.stringify({ ids }) })
    flash(`Deleted ${ids.length} contacts`)
    setSelectedIds(new Set())
    loadContacts()
  }

  // ── Template actions ─────────────────────────────────────────────────────────
  const saveTemplate = async (form) => {
    const isEdit = !!form._id
    const res = await fetch('/api/outreach/templates', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.ok) { flash('Template saved'); setEditTemplate(null); loadTemplates() }
    else flash(d.error || 'Error', false)
  }

  const deleteTemplate = async (id) => {
    if (!confirm('Delete template?')) return
    await fetch('/api/outreach/templates', { method:'DELETE', headers:{...h,'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    flash('Deleted'); loadTemplates()
  }

  const seedTemplates = async () => {
    const res = await fetch('/api/outreach/templates/seed', { method:'POST', headers:h })
    const d = await res.json()
    if (d.ok) { flash(`Seeded ${d.created} templates (${d.skipped} already existed)`); loadTemplates() }
  }

  // ── Campaign actions ─────────────────────────────────────────────────────────
  const saveCampaign = async (form) => {
    const isEdit = !!form._id
    // Resolve template ref
    if (form.templateId) {
      form.template = { _type:'reference', _ref: form.templateId }
      delete form.templateId
    }
    const res = await fetch('/api/outreach/campaigns', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.ok) { flash('Campaign saved'); setEditCampaign(null); loadCampaigns() }
    else flash(d.error || 'Error', false)
  }

  // ── Scraper ──────────────────────────────────────────────────────────────────
  const runScrape = async (save = false) => {
    setScrapeRunning(true); setScrapeResult(null)
    try {
      const res = await fetch('/api/outreach/scrape', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: scrapeSource, params: { state: scrapeState, limit: 100 }, saveToDatabase: save }),
      })
      const d = await res.json()
      setScrapeResult(d)
      if (save && d.ok) { flash(`Saved ${d.saved?.created || 0} contacts`); loadContacts() }
    } catch (e) { setScrapeResult({ error: e.message }) }
    setScrapeRunning(false)
  }

  // ── CSV Import ───────────────────────────────────────────────────────────────
  const runImport = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return flash('No file selected', false)
    setImportRunning(true); setImportResult(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', importType)
    fd.append('source', 'csv_import')
    const res = await fetch('/api/outreach/import', { method:'POST', headers:h, body:fd })
    const d = await res.json()
    setImportResult(d)
    if (d.ok) { flash(`Imported ${d.created} contacts`); loadContacts() }
    setImportRunning(false)
  }

  // ── Send campaign ────────────────────────────────────────────────────────────
  const sendCampaign = async (dryRun = false) => {
    if (!sendCampaignId) return flash('Select a campaign first', false)
    setSendRunning(true); setSendResult(null)
    const contactIds = selectedIds.size > 0 ? [...selectedIds] : undefined
    const res = await fetch('/api/outreach/send', {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: sendCampaignId, contactIds, dryRun }),
    })
    const d = await res.json()
    setSendResult(d)
    if (d.ok && !dryRun) { flash(`Sent ${d.sent} emails`); loadContacts(); loadCampaigns() }
    setSendRunning(false)
  }

  const previewCampaign = async () => {
    if (!sendCampaignId || selectedIds.size === 0) return flash('Select a campaign and one contact to preview', false)
    const contactId = [...selectedIds][0]
    const res = await fetch('/api/outreach/send', {
      method: 'POST',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: sendCampaignId, previewOnly: true, previewContactId: contactId }),
    })
    const d = await res.json()
    if (d.ok) setPreviewHtml(d.html)
    else flash(d.error || 'Preview failed', false)
  }

  // ── Filtered contacts ────────────────────────────────────────────────────────
  const displayed = contacts.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) ||
             c.city?.toLowerCase().includes(q) || c.state?.toLowerCase().includes(q)
    }
    return true
  })

  const toggleSelect = (id) => setSelectedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => setSelectedIds(prev => prev.size === displayed.length ? new Set() : new Set(displayed.map(c=>c._id)))

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:1100 }}>
      <style>{S}</style>

      {msg && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:2000, background:msg.ok?'#14532d':'#7f1d1d', border:`1px solid ${msg.ok?'#22c55e':'#ef4444'}`, color:msg.ok?'#4ade80':'#f87171', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, padding:'10px 18px', borderRadius:4, boxShadow:'0 4px 20px rgba(0,0,0,0.6)' }}>
          {msg.m}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.2rem', letterSpacing:'0.06em', color:'var(--gold)', margin:0, lineHeight:1 }}>📬 OUTREACH PORTAL</h1>
        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', margin:'4px 0 0' }}>
          Contact management · Email campaigns · Templates · Scrapers — all in one place
        </p>
      </div>

      {/* Stats row */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:24 }}>
          <StatCard label="Total Contacts" value={stats.total}       icon="👥" color="var(--gold)" />
          <StatCard label="Active"          value={stats.active}      icon="✅" color="#22c55e" />
          <StatCard label="With Email"      value={stats.withEmail}   icon="📧" color="#3b82f6" />
          <StatCard label="YouTubers"       value={stats.youtubers}   icon="▶"  color="#a855f7" />
          <StatCard label="Gun Shops"       value={stats.shops}       icon="🏪" color="#C8922A" />
          <StatCard label="Instructors"     value={stats.instructors} icon="🎯" color="#22c55e" />
          <StatCard label="FFL Dealers"     value={stats.dealers}     icon="🔑" color="#3b82f6" />
          <StatCard label="YT Permitted"    value={stats.permitted}   icon="✓"  color="#f59e0b" />
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24, overflowX:'auto', gap:0 }}>
        {[['contacts','👥 Contacts'],['send','📤 Send Campaign'],['campaigns','📋 Campaigns'],['templates','✉️ Templates'],['scrape','🔍 Scrape'],['import','📥 CSV Import']].map(([k,l])=>(
          <button key={k} className={`op-tab-btn${tab===k?' active':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* ── CONTACTS TAB ─── */}
      {tab==='contacts' && (
        <div>
          <SectionHeader
            title="Contact List"
            sub={`${displayed.length} shown · ${selectedIds.size} selected`}
            action={
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {selectedIds.size > 0 && <>
                  <button className="op-btn-ghost op-btn-sm" onClick={()=>deleteContacts([...selectedIds])}>Delete Selected</button>
                </>}
                <button className="op-btn op-btn-sm" onClick={()=>setEditContact({})}>+ Add Contact</button>
              </div>
            }
          />

          {/* Filters */}
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <input className="op-input" placeholder="Search name, email, city..." value={searchQ}
              onChange={e=>{setSearchQ(e.target.value)}} style={{ width:220 }} />
            <select className="op-select" value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
            <select className="op-select" value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);loadContacts()}}>
              {['active','unsubscribed','bounced','do_not_contact','pending'].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <button className="op-btn-ghost op-btn-sm" onClick={loadContacts}>↻ Refresh</button>
          </div>

          {loading ? (
            <div style={{ padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#64748b' }}>Loading contacts...</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table className="op-table">
                <thead>
                  <tr>
                    <th style={{ width:30 }}><input type="checkbox" checked={selectedIds.size===displayed.length&&displayed.length>0} onChange={toggleAll} /></th>
                    <th>Name</th><th>Type</th><th>Email</th><th>Location</th><th>Source</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'#64748b', fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
                      No contacts yet. Use Scrape or CSV Import to build your list.
                    </td></tr>
                  )}
                  {displayed.map(c => (
                    <tr key={c._id}>
                      <td><input type="checkbox" checked={selectedIds.has(c._id)} onChange={()=>toggleSelect(c._id)} /></td>
                      <td>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.name}</div>
                        {c.youtubeUrl && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#a855f7' }}>
                          {c.subscribers ? `${(c.subscribers/1000).toFixed(0)}K subs` : 'YouTube'}
                        </div>}
                      </td>
                      <td><TypeBadge type={c.type} /></td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:c.email?'var(--text)':'#475569' }}>
                        {c.email || '—'}
                        {c.emailPermission && <span style={{ marginLeft:6, color:'#22c55e', fontSize:10 }}>✓ permitted</span>}
                      </td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#94a3b8', whiteSpace:'nowrap' }}>
                        {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b' }}>{c.source?.replace('_',' ')}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="op-btn-ghost op-btn-sm" onClick={()=>setEditContact(c)}>Edit</button>
                          <button className="op-btn-ghost op-btn-sm" onClick={()=>deleteContacts([c._id])} style={{ color:'#ef4444', borderColor:'#ef4444' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SEND TAB ─── */}
      {tab==='send' && (
        <div>
          <SectionHeader title="Send Campaign" sub="Select a campaign and recipients, preview, then send." />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <div className="op-card" style={{ marginBottom:16 }}>
                <label className="op-label">Select Campaign *</label>
                <select className="op-select" value={sendCampaignId} onChange={e=>setSendCampaignId(e.target.value)} style={{ width:'100%', marginBottom:12 }}>
                  <option value="">— Choose campaign —</option>
                  {campaigns.map(c=><option key={c._id} value={c._id}>{c.name} ({c.status})</option>)}
                </select>

                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', marginBottom:12 }}>
                  Recipients: {selectedIds.size > 0 ? `${selectedIds.size} selected contacts` : 'All contacts matching campaign target filters'}
                </div>

                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button className="op-btn-ghost op-btn-sm" onClick={previewCampaign}>👁 Preview (1 contact)</button>
                  <button className="op-btn-ghost op-btn-sm" onClick={()=>sendCampaign(true)} disabled={sendRunning}>🧪 Dry Run</button>
                  <button className="op-btn" onClick={()=>sendCampaign(false)} disabled={sendRunning}>
                    {sendRunning ? 'Sending...' : '🚀 Send Now'}
                  </button>
                </div>
              </div>

              {sendResult && (
                <div className="op-card" style={{ borderLeft:`3px solid ${sendResult.ok?'#22c55e':'#ef4444'}` }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', color:sendResult.ok?'#22c55e':'#ef4444', marginBottom:8 }}>
                    {sendResult.dryRun ? 'DRY RUN COMPLETE' : sendResult.ok ? 'SEND COMPLETE' : 'SEND FAILED'}
                  </div>
                  {sendResult.ok && (
                    <div style={{ display:'flex', gap:16 }}>
                      {[['Sent',sendResult.sent,'#22c55e'],['Failed',sendResult.failed,'#ef4444'],['Skipped',sendResult.skipped,'#f59e0b']].map(([l,v,c])=>(
                        <div key={l} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                          <span style={{ color:'#64748b' }}>{l}: </span><span style={{ color:c, fontWeight:700 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {sendResult.errors?.length > 0 && (
                    <div style={{ marginTop:8 }}>
                      {sendResult.errors.slice(0,5).map((e,i)=>(
                        <div key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#f87171' }}>{e.email}: {e.error}</div>
                      ))}
                    </div>
                  )}
                  {sendResult.error && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#f87171' }}>{sendResult.error}</div>}
                </div>
              )}
            </div>

            {/* Recipient selector — reuse contact list */}
            <div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', marginBottom:8 }}>
                OPTIONAL: Select specific recipients from your contact list. Leave none selected to use campaign target filters.
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <input className="op-input" placeholder="Search contacts..." value={searchQ} onChange={e=>setSearchQ(e.target.value)} style={{ flex:1 }} />
                <select className="op-select" value={filterType} onChange={e=>setFilterType(e.target.value)}>
                  <option value="all">All types</option>
                  {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div style={{ maxHeight:360, overflowY:'auto', border:'1px solid var(--border)' }}>
                {displayed.slice(0,200).map(c=>(
                  <div key={c._id} onClick={()=>toggleSelect(c._id)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderBottom:'1px solid rgba(30,41,59,0.3)', cursor:'pointer', background:selectedIds.has(c._id)?'rgba(200,146,42,0.08)':'transparent' }}>
                    <input type="checkbox" checked={selectedIds.has(c._id)} onChange={()=>toggleSelect(c._id)} onClick={e=>e.stopPropagation()} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b' }}>{c.email || 'no email'}</div>
                    </div>
                    <TypeBadge type={c.type} />
                  </div>
                ))}
              </div>
              {selectedIds.size > 0 && (
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--gold)', marginTop:6 }}>
                  {selectedIds.size} contacts selected
                </div>
              )}
            </div>
          </div>

          {/* Email preview iframe */}
          {previewHtml && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', color:'var(--gold)', letterSpacing:'0.05em' }}>EMAIL PREVIEW</div>
                <button className="op-btn-ghost op-btn-sm" onClick={()=>setPreviewHtml(null)}>✕ Close</button>
              </div>
              <iframe srcDoc={previewHtml} style={{ width:'100%', height:600, border:'1px solid var(--border)', borderRadius:2 }} title="Email Preview" />
            </div>
          )}
        </div>
      )}

      {/* ── CAMPAIGNS TAB ─── */}
      {tab==='campaigns' && (
        <div>
          <SectionHeader
            title="Campaigns"
            sub={`${campaigns.length} campaigns`}
            action={<button className="op-btn op-btn-sm" onClick={()=>setEditCampaign({})}>+ New Campaign</button>}
          />
          {campaigns.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#64748b' }}>No campaigns yet.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {campaigns.map(c=>(
                <div key={c._id} className="op-card" style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:16, alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{c.name}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b' }}>
                      {c.type?.replace(/_/g,' ')} · Template: {c.template?.name || 'none'} · Created: {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                    {c.stats && (
                      <div style={{ display:'flex', gap:12, marginTop:6 }}>
                        {[['Sent',c.stats.sent,'#e5e7eb'],['Opened',c.stats.opened,'#22c55e'],['Clicked',c.stats.clicked,'#3b82f6'],['Bounced',c.stats.bounced,'#ef4444']].map(([l,v,col])=>(
                          <span key={l} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:col }}>{l}: {v||0}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={c.status} />
                  <button className="op-btn-ghost op-btn-sm" onClick={()=>{setSendCampaignId(c._id);setTab('send')}}>Send</button>
                  <button className="op-btn-ghost op-btn-sm" onClick={()=>setEditCampaign(c)}>Edit</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATES TAB ─── */}
      {tab==='templates' && (
        <div>
          <SectionHeader
            title="Email Templates"
            sub="Personalized with {{variables}} — click to insert"
            action={
              <div style={{ display:'flex', gap:8 }}>
                <button className="op-btn-ghost op-btn-sm" onClick={seedTemplates}>Seed Default Templates</button>
                <button className="op-btn op-btn-sm" onClick={()=>setEditTemplate({})}>+ New Template</button>
              </div>
            }
          />
          {templates.length === 0 ? (
            <div style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#64748b', marginBottom:12 }}>No templates yet.</div>
              <button className="op-btn" onClick={seedTemplates}>Seed Default Templates (5 ready-to-use)</button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>
              {templates.map(t=>(
                <div key={t._id} className="op-card" style={{ borderLeft:`3px solid ${TYPE_COLORS[t.type]||'var(--gold)'}` }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{t.name}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', marginBottom:8 }}>
                    Type: {t.type} · {t.isActive ? '✅ active' : '⏸ inactive'}
                  </div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', marginBottom:12, background:'var(--bg)', padding:'6px 10px', borderRadius:2 }}>
                    Subject: {t.subject}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button className="op-btn-ghost op-btn-sm" onClick={()=>setEditTemplate(t)}>Edit</button>
                    <button className="op-btn-ghost op-btn-sm" style={{ color:'#ef4444', borderColor:'#ef4444' }} onClick={()=>deleteTemplate(t._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SCRAPE TAB ─── */}
      {tab==='scrape' && (
        <div>
          <SectionHeader title="Contact Scrapers" sub="Pull contacts from FFL database, NRA instructor directory, or YouTube." />

          <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>
            <div>
              <div className="op-card" style={{ marginBottom:16 }}>
                <label className="op-label">Data Source</label>
                <select className="op-select" value={scrapeSource} onChange={e=>setScrapeSource(e.target.value)} style={{ width:'100%', marginBottom:12 }}>
                  <option value="ffl">ATF FFL Database (Gun Shops & Dealers)</option>
                  <option value="nra">NRA Instructor Finder</option>
                  <option value="youtube">YouTube Channel Enricher</option>
                </select>

                <label className="op-label">State Filter</label>
                <select className="op-select" value={scrapeState} onChange={e=>setScrapeState(e.target.value)} style={{ width:'100%', marginBottom:16 }}>
                  {['','AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'].map(s=>(
                    <option key={s} value={s}>{s || 'All States'}</option>
                  ))}
                </select>

                <div style={{ display:'flex', gap:8 }}>
                  <button className="op-btn-ghost op-btn-sm" onClick={()=>runScrape(false)} disabled={scrapeRunning}>Preview</button>
                  <button className="op-btn op-btn-sm" onClick={()=>runScrape(true)} disabled={scrapeRunning}>
                    {scrapeRunning ? 'Scraping...' : 'Scrape & Save'}
                  </button>
                </div>
              </div>

              <div className="op-card" style={{ background:'rgba(200,146,42,0.04)', borderColor:'rgba(200,146,42,0.2)' }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'0.9rem', color:'var(--gold)', letterSpacing:'0.05em', marginBottom:8 }}>POPULAR YOUTUBE TARGETS</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:2 }}>
                  {['Paul Harrell','Garand Thumb','Forgotten Weapons','hickok45','Military Arms Channel','Lucky Gunner','MrGunsNGear','Yankee Marshal','Sootch00','Warrior Poet Society','Pew Pew Tactical','Colion Noir'].map(name => (
                    <div key={name}>· {name}</div>
                  ))}
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', marginTop:8 }}>
                  Add these manually or use the YouTube enricher with their channel handles.
                </div>
              </div>
            </div>

            <div>
              {scrapeResult && (
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', color:'var(--gold)', letterSpacing:'0.05em', marginBottom:12 }}>
                    SCRAPE RESULTS — {scrapeResult.count || 0} CONTACTS
                    {scrapeResult.saved && <span style={{ color:'#22c55e', marginLeft:12 }}>· Saved {scrapeResult.saved.created} new</span>}
                  </div>
                  {scrapeResult.note && (
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#f59e0b', padding:'8px 12px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', marginBottom:12 }}>
                      ⚠ {scrapeResult.note}
                    </div>
                  )}
                  <div style={{ maxHeight:480, overflowY:'auto', border:'1px solid var(--border)' }}>
                    <table className="op-table">
                      <thead><tr><th>Name</th><th>Type</th><th>Location</th><th>Source</th></tr></thead>
                      <tbody>
                        {(scrapeResult.contacts||[]).slice(0,100).map((c,i)=>(
                          <tr key={i}>
                            <td style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:600 }}>{c.name}</td>
                            <td><TypeBadge type={c.type} /></td>
                            <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#94a3b8' }}>{[c.city,c.state].filter(Boolean).join(', ')}</td>
                            <td style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b' }}>{c.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {!scrapeResult && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#475569' }}>
                  Select a source and click Preview or Scrape & Save
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── IMPORT TAB ─── */}
      {tab==='import' && (
        <div>
          <SectionHeader title="CSV Import" sub="Import contacts from any CSV. Columns are auto-detected." />

          <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>
            <div className="op-card">
              <label className="op-label">CSV File *</label>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', marginBottom:12, display:'block', width:'100%' }} />

              <label className="op-label">Default Contact Type</label>
              <select className="op-select" value={importType} onChange={e=>setImportType(e.target.value)} style={{ width:'100%', marginBottom:16 }}>
                {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>

              <button className="op-btn" onClick={runImport} disabled={importRunning} style={{ width:'100%' }}>
                {importRunning ? 'Importing...' : '📥 Import CSV'}
              </button>

              {importResult && (
                <div style={{ marginTop:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                  <div style={{ color:importResult.ok?'#22c55e':'#ef4444', fontWeight:700, marginBottom:6 }}>
                    {importResult.ok ? '✅ Import complete' : '❌ Import failed'}
                  </div>
                  {importResult.ok && (
                    <div style={{ color:'#94a3b8' }}>
                      Created: <span style={{ color:'#22c55e' }}>{importResult.created}</span> ·
                      Skipped (dupes): <span style={{ color:'#f59e0b' }}>{importResult.skipped}</span>
                    </div>
                  )}
                  {importResult.error && <div style={{ color:'#f87171' }}>{importResult.error}</div>}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', color:'var(--gold)', letterSpacing:'0.05em', marginBottom:12 }}>COLUMN MAPPING</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', lineHeight:2 }}>
                Auto-detected columns (any header variation works):
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginTop:8 }}>
                {[
                  ['name / business name / company','Name'],
                  ['first name / firstname / fname','First Name'],
                  ['email / email address','Email'],
                  ['phone / telephone','Phone'],
                  ['city','City'],
                  ['state / st','State'],
                  ['zip / zip code','ZIP'],
                  ['website / url','Website'],
                  ['youtube / youtube url','YouTube'],
                  ['subscribers / subs','Subscriber Count'],
                  ['ffl / ffl license','FFL License'],
                  ['instagram / ig','Instagram'],
                  ['twitter / x','Twitter/X'],
                  ['notes / comments','Notes'],
                ].map(([k,v])=>(
                  <div key={k} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'4px 8px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
                    <span style={{ color:'#64748b' }}>{k}</span><br/>
                    <span style={{ color:'var(--gold)' }}>→ {v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {editContact && <ContactModal contact={editContact._id ? editContact : null} onSave={saveContact} onClose={()=>setEditContact(null)} />}
      {editTemplate && <TemplateModal template={editTemplate._id ? editTemplate : null} onSave={saveTemplate} onClose={()=>setEditTemplate(null)} />}
      {editCampaign && <CampaignModal campaign={editCampaign._id ? editCampaign : null} templates={templates} onSave={saveCampaign} onClose={()=>setEditCampaign(null)} />}
    </div>
  )
}
