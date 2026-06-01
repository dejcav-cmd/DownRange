'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import ImageSearchModal from './ImageSearchModal'

// ── CSS ───────────────────────────────────────────────────────────────────────
const S = `
.uce-wrap{display:flex;flex-direction:column;height:calc(100vh - 120px);overflow:hidden;background:var(--bg)}
.uce-topbar{display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid var(--border);flex-wrap:wrap;align-items:center;background:var(--bg2);flex-shrink:0}
.uce-main{display:flex;flex:1;overflow:hidden;min-height:0}
.uce-list{width:290px;flex-shrink:0;border-right:1px solid var(--border);overflow-y:auto;background:var(--bg)}
.uce-detail{flex:1;overflow-y:auto;padding:20px 24px;background:var(--bg2);min-width:0}
.uce-input{background:var(--bg3,#1a1f2e);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;width:100%;box-sizing:border-box}
.uce-input:focus{border-color:var(--gold)}
.uce-ta{background:var(--bg3,#1a1f2e);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px;outline:none;width:100%;resize:vertical;line-height:1.7;box-sizing:border-box}
.uce-ta:focus{border-color:var(--gold)}
.uce-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:7px 14px;cursor:pointer;white-space:nowrap}
.uce-btn:hover{opacity:.85}
.uce-btn:disabled{opacity:.35;cursor:not-allowed}
.uce-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s;white-space:nowrap}
.uce-ghost:hover{border-color:var(--gold);color:var(--gold)}
.uce-ghost:disabled{opacity:.35;cursor:not-allowed}
.uce-del{background:none;border:1px solid rgba(239,68,68,.35);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.uce-del:hover{background:rgba(239,68,68,.1)}
.uce-row{display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s}
.uce-row:hover{background:rgba(200,146,42,.04)}
.uce-row.sel{background:rgba(200,146,42,.08);border-left:3px solid var(--gold)}
.uce-row.checked{background:rgba(200,146,42,.05)}
.uce-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
.uce-grp{margin-bottom:16px}
.uce-sep{border:none;border-top:1px solid var(--border);margin:16px 0}
.uce-msg{padding:9px 14px;margin-bottom:10px;font-family:'IBM Plex Mono',monospace;font-size:11px;border:1px solid var(--border);background:var(--bg2)}
.uce-preview-html{background:#fff;color:#111;padding:20px 28px;font-family:Georgia,serif;font-size:15px;line-height:1.8;border:1px solid var(--border);max-height:480px;overflow-y:auto}
.uce-preview-html h1,.uce-preview-html h2{font-family:Impact,sans-serif;margin:20px 0 8px;color:#1a1a2e}
.uce-preview-html p{margin:0 0 14px;text-align:justify}
.uce-preview-html ul,.uce-preview-html ol{margin:0 0 14px;padding-left:24px}
.uce-preview-html strong{color:#C8922A}
.uce-preview-html a{color:#C8922A}
.uce-tab-active{border-bottom:2px solid var(--gold)!important;color:var(--gold)!important}
`

// ── Helpers ───────────────────────────────────────────────────────────────────
function isBad(url) {
  if (!url) return true
  const bad = ['/img/photos/', '/img/pistol', '/img/rifle', '/img/law', '/img/shotgun',
    '/img/suppressor', '/img/ammo', '/img/news', '/img/gear', '/img/training',
    '/img/hunting', '/img/military', '/img/homedefense', '/img/competition']
  return bad.some(p => url.includes(p))
}

function timeAgo(d) {
  if (!d) return ''
  const ms = Date.now() - new Date(d).getTime()
  const h = Math.floor(ms / 3600000)
  if (h < 24) return h + 'h ago'
  return Math.floor(h / 24) + 'd ago'
}

function pageUrl(config, item) {
  if (!item) return null
  const slug = item.slug?.current || item._id
  if (config.urlFn) return config.urlFn(item)
  if (config.baseUrl) return config.baseUrl + '/' + slug
  return null
}

// Determines published state for any content type.
// Explicit field declarations via config.publishField override auto-detection.
//   config.publishField = { field: 'status',   publishedValue: 'published' }  → blogPost
//   config.publishField = { field: 'approved', publishedValue: true }          → newsArticle, competition
//   config.publishField = { field: 'active',   publishedValue: true }          → canada, brazil, video
// If no config.publishField, falls back to safe explicit checks (no implicit defaults).
function isPublished(item, config) {
  if (!item) return false
  const pf = config?.publishField
  if (pf) return item[pf.field] === pf.publishedValue
  // Auto-detect: check all three patterns explicitly
  if ('status' in item)   return item.status === 'published'
  if ('approved' in item) return item.approved === true
  if ('active' in item)   return item.active === true
  return false  // unknown type — default to draft, never assume live
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function UniversalContentEditor({
  adminKey,
  config,        // { label, icon, api, type, fields[], perPage, urlFn, baseUrl, lang }
}) {
  const {
    label = 'Content', icon = '◈', api, type,
    fields: FIELDS = [], perPage: PER_PAGE = 25,
    lang = 'en',
  } = config

  const [items,      setItems]      = useState([])
  const [sel,        setSel]        = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [busy,       setBusy]       = useState(false)
  const [msg,        setMsg]        = useState('')
  const [msgType,    setMsgType]    = useState('info')
  const [filter,     setFilter]     = useState('')
  const [page,       setPage]       = useState(0)
  const [checked,    setChecked]    = useState(new Set())
  const [showAdd,    setShowAdd]    = useState(false)
  const [addForm,    setAddForm]    = useState({})
  const [imgSearch,  setImgSearch]  = useState(null)
  const [detailTab,  setDetailTab]  = useState('edit')  // 'edit'|'html'|'preview'
  const [aiPrompt,   setAiPrompt]   = useState('')
  const [fieldVals,  setFieldVals]  = useState({})

  const H = { 'x-admin-key': adminKey }
  const flash = (m, t = 'info') => { setMsg(m); setMsgType(t); setTimeout(() => setMsg(''), 5000) }
  const T = txt => lang === 'pt' ? ({ Save:'Salvar', Delete:'Excluir', Cancel:'Cancelar', Loading:'Carregando...', New:'Novo', Filter:'Filtrar...', 'Write with AI':'Escrever com IA', 'Fix Image':'Corrigir Imagem', 'Lock':'Travar', 'Unlock':'Destravar', 'Publish':'Publicar', 'Unpublish':'Despublicar', 'Locked':'Travado', 'Unlocked':'Destravado', 'Edit':'Editar', 'HTML Preview':'Visualizar HTML', 'Page Preview':'Ver Página' }[txt] || txt) : txt

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = type ? '?all=1&type=' + encodeURIComponent(type) : '?all=1'
      const r = await fetch(api + qs, { headers: H })
      const d = await r.json()
      const key = config.responseKey || 'items'
      setItems(d[key] || d.items || d.posts || d.articles || d.releases || d.reviews || [])
    } catch { flash('Failed to load', 'error') } finally { setLoading(false) }
  }, [api, type, adminKey])

  useEffect(() => { load(); setSel(null); setChecked(new Set()); setPage(0) }, [load])

  // Sync field values when selection changes
  useEffect(() => {
    const item = items.find(x => x._id === sel)
    if (item) {
      const vals = {}
      FIELDS.forEach(f => { vals[f.key] = item[f.key] ?? '' })
      setFieldVals(vals)
    }
  }, [sel, items])

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async function patch(id, fields) {
    try {
      const r = await fetch(api, { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body: JSON.stringify({ action:'patch', id, fields }) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d.ok === false) {
        flash('❌ Save failed: ' + (d.error || r.status), 'error')
        return false
      }
      setItems(prev => prev.map(x => x._id === id ? {...x,...fields} : x))
      return true
    } catch (e) {
      flash('❌ Save failed: ' + e.message, 'error')
      return false
    }
  }

  async function saveField(key, value) {
    const item = items.find(x => x._id === sel)
    if (!item) return
    await patch(item._id, { [key]: value })
    flash('✅ ' + T('Save') + 'd')
  }

  async function del(id) {
    if (!confirm(lang === 'pt' ? 'Excluir este item?' : 'Delete this item?')) return
    setBusy(true)
    try {
      await fetch(api, { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body: JSON.stringify({ action:'delete', id }) })
      setSel(null)
      await load()
      flash('🗑 Deleted')
    } finally { setBusy(false) }
  }

  async function create() {
    if (!addForm.title) { flash('Title required', 'error'); return }
    setBusy(true)
    try {
      const r = await fetch(api, { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body: JSON.stringify({ action:'create', type, ...addForm }) })
      const d = await r.json()
      if (d.ok) { setShowAdd(false); setAddForm({}); await load(); flash('✅ Created') }
      else flash('❌ ' + (d.error || 'Failed'), 'error')
    } finally { setBusy(false) }
  }

  async function toggleLock(item) {
    const v = !item.editorLocked
    await patch(item._id, { editorLocked: v })
    flash(v ? '🔒 Locked — AI will skip' : '🔓 Unlocked')
  }

  async function togglePublish(item) {
    const pf    = config.publishField
    const field = pf?.field || ('status' in item ? 'status' : 'approved' in item ? 'approved' : 'active')
    const val   = field === 'status'
      ? (item.status !== 'published' ? (pf?.publishedValue || 'published') : 'draft')
      : !(item[field])
    const ok = await patch(item._id, { [field]: val })
    if (ok) {
      flash(val === 'published' || val === true ? '▶ Published' : '⏸ Set to draft')
      await load()
    }
  }

  async function bulkLock(v) {
    setBusy(true)
    for (const id of checked) await patch(id, { editorLocked: v })
    setChecked(new Set())
    setBusy(false)
    flash('✅ ' + (v ? 'Locked' : 'Unlocked') + ' ' + checked.size + ' items')
  }

  async function bulkPublish(v) {
    setBusy(true)
    const items = data.filter(d => checked.has(d._id))
    const pf    = config.publishField
    for (const item of items) {
      const field = pf?.field || ('status' in item ? 'status' : 'approved' in item ? 'approved' : 'active')
      const val   = field === 'status' ? (v ? (pf?.publishedValue || 'published') : 'draft') : v
      await patch(item._id, { [field]: val })
    }
    setChecked(new Set())
    await load()
    setBusy(false)
    flash('✅ ' + (v ? '▶ Published' : '⏸ Set to draft') + ' ' + items.length + ' items')
  }

  async function bulkDelete() {
    if (!confirm('Delete ' + checked.size + ' items?')) return
    setBusy(true)
    for (const id of checked) {
      await fetch(api, { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body: JSON.stringify({ action:'delete', id }) })
    }
    setChecked(new Set())
    await load()
    setBusy(false)
    flash('🗑 Deleted ' + checked.size + ' items')
  }

  async function fixImage(item) {
    setBusy(true); flash('⏳ Fetching real image from Pexels/Pixabay...')
    try {
      const r = await fetch(api, { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body: JSON.stringify({ action:'fix-image', id:item._id, title:item.title, type }) })
      const d = await r.json()
      if (d.ok) {
        setItems(prev => prev.map(x => x._id === item._id ? {...x, imageUrl:d.imageUrl} : x))
        if (sel === item._id) setFieldVals(prev => ({...prev, imageUrl:d.imageUrl}))
        flash('✅ Image: ' + (d.imageUrl||'').slice(0,60))
      } else flash('❌ ' + (d.error || 'No image found'), 'error')
    } finally { setBusy(false) }
  }

  async function fixAllImages() {
    setBusy(true); flash('⏳ Fixing all broken images...')
    let fixed = 0
    for (const item of items) {
      if (!isBad(item.imageUrl)) continue
      const r = await fetch(api, { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body: JSON.stringify({ action:'fix-image', id:item._id, title:item.title, type }) })
      const d = await r.json()
      if (d.ok) { fixed++; setItems(prev => prev.map(x => x._id === item._id ? {...x, imageUrl:d.imageUrl} : x)) }
      await new Promise(r => setTimeout(r, 200))
    }
    setBusy(false); flash('✅ Fixed ' + fixed + ' images')
  }

  async function aiWrite(item) {
    const topic = aiPrompt || item.title
    if (!topic) { flash('Enter a topic or title first', 'error'); return }
    setBusy(true); flash('⏳ Writing with AI...')
    try {
      const r = await fetch(api, { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body: JSON.stringify({ action:'ai-write', id:item._id, type, topic }) })
      const d = await r.json()
      if (d.ok) {
        await load()
        flash('✅ Written by AI' + (d.imageUrl ? ' + image' : ''))
      } else flash('❌ ' + (d.error || 'AI failed'), 'error')
    } finally { setBusy(false) }
  }

  // ── Filtering + pagination ────────────────────────────────────────────────
  const brokenCount = items.filter(x => isBad(x.imageUrl)).length
  const filtered = filter
    ? items.filter(x => (x.title||'').toLowerCase().includes(filter.toLowerCase()) ||
                        (x.tag||'').toLowerCase().includes(filter.toLowerCase()) ||
                        (x.status||'').toLowerCase().includes(filter.toLowerCase()))
    : items

  const pages = Math.ceil(filtered.length / PER_PAGE)
  const visible = filtered.slice(page * PER_PAGE, (page+1) * PER_PAGE)
  const selItem = items.find(x => x._id === sel)

  // ── Field renderer ────────────────────────────────────────────────────────
  function Field({ fieldCfg }) {
    const { key, label: lbl, type: ftype = 'text', opts, rows, hint } = fieldCfg
    const v = fieldVals[key] ?? ''
    const set = val => setFieldVals(prev => ({...prev, [key]: val}))
    const save = () => saveField(key, fieldVals[key])
    const locked = selItem?.editorLocked

    return (
      <div className="uce-grp">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <span className="uce-lbl">{lbl}</span>
          {hint && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>{hint}</span>}
        </div>
        {opts ? (
          <select className="uce-input" value={v} disabled={locked}
            onChange={e => { set(e.target.value); saveField(key, e.target.value) }}>
            <option value="">— select —</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ) : rows ? (
          <div style={{ position:'relative' }}>
            <textarea className="uce-ta" rows={rows} value={v} disabled={locked}
              onChange={e => set(e.target.value)} onBlur={save} />
            {!locked && (
              <button className="uce-btn" onClick={save}
                style={{ position:'absolute', bottom:8, right:8, fontSize:10, padding:'4px 10px', opacity: v === (selItem?.[key]||'') ? 0.4 : 1 }}>
                💾
              </button>
            )}
          </div>
        ) : ftype === 'url' ? (
          <div style={{ display:'flex', gap:6 }}>
            <input className="uce-input" type="url" value={v} disabled={locked} style={{ flex:1 }}
              onChange={e => set(e.target.value)} onBlur={save} />
            {v && v.startsWith('http') && (
              <a href={v} target="_blank" rel="noreferrer"
                style={{ padding:'7px 10px', border:'1px solid var(--border)', color:'var(--gold)', textDecoration:'none', fontFamily:"'IBM Plex Mono',monospace", fontSize:10 }}>↗</a>
            )}
          </div>
        ) : (
          <div style={{ display:'flex', gap:6 }}>
            <input className="uce-input" type={ftype} value={v} disabled={locked} style={{ flex:1 }}
              onChange={e => set(e.target.value)} onBlur={save} />
            {!locked && <button className="uce-btn" onClick={save} style={{ fontSize:10, padding:'6px 10px', opacity: v === (selItem?.[key]||'') ? 0.4 : 1 }}>💾</button>}
          </div>
        )}
      </div>
    )
  }

  // ── HTML preview renderer ─────────────────────────────────────────────────
  function HtmlPreview({ html, summary }) {
    const content = html || summary || ''
    if (!content) return <div style={{ padding:20, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563' }}>No content yet.</div>
    return (
      <div>
        <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>
            {content.length.toLocaleString()} chars · ~{Math.max(1,Math.round(content.replace(/<[^>]+>/g,'').split(/\s+/).length/200))} min read
          </span>
          <button className="uce-ghost" onClick={() => navigator.clipboard?.writeText(content)}>📋 Copy HTML</button>
        </div>
        {/* HTML rendered */}
        <div style={{ marginBottom:12 }}>
          <span className="uce-lbl">Rendered preview</span>
          <div className="uce-preview-html" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        {/* Raw HTML */}
        <div>
          <span className="uce-lbl">Raw HTML source</span>
          <textarea className="uce-ta" rows={12} value={content} readOnly
            style={{ fontFamily:'monospace', fontSize:10, color:'#4ade80', background:'#0d1117' }} />
        </div>
      </div>
    )
  }

  // ── Page preview ─────────────────────────────────────────────────────────
  function PagePreviewTab({ item }) {
    const url = pageUrl(config, item)
    return (
      <div>
        {url ? (
          <>
            <div style={{ marginBottom:12, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', flex:1, wordBreak:'break-all' }}>{url}</span>
              <a href={url} target="_blank" rel="noreferrer" className="uce-btn"
                style={{ fontSize:11, padding:'6px 14px' }}>Open ↗</a>
              <button className="uce-ghost" onClick={() => navigator.clipboard?.writeText(url)}>📋 Copy</button>
            </div>
            <iframe
              src={url}
              style={{ width:'100%', height:500, border:'1px solid var(--border)', background:'#fff' }}
              title="Page preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </>
        ) : (
          <div style={{ padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563' }}>
            No page URL configured for this content type.
            {item.sourceUrl && (
              <div style={{ marginTop:12 }}>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="uce-btn">View Source ↗</a>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{S}</style>
      <div className="uce-wrap">

        {/* ── TOP BAR ── */}
        <div className="uce-topbar">
          <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', marginRight:4 }}>
            {icon} {label}
          </span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563' }}>
            {items.length} items
            {brokenCount > 0 && <span style={{ color:'#ef4444', marginLeft:8 }}>· {brokenCount} broken images</span>}
          </span>

          <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap' }}>
            {config.pullFn && (
              <button className="uce-btn" onClick={() => config.pullFn(flash, load)} disabled={busy}>
                ⬇ Pull Articles
              </button>
            )}
            <button className="uce-ghost" onClick={fixAllImages} disabled={busy}>🖼 Fix All Images</button>
            {(config.extraActions||[]).map((a,i) => (
              <button key={i} className="uce-ghost" disabled={busy}
                onClick={() => a.fn(flash, load)}>{a.label}</button>
            ))}
            <button className="uce-ghost" onClick={() => setShowAdd(true)}>＋ New</button>
            <button className="uce-ghost" onClick={load} disabled={loading}>↺</button>
          </div>
        </div>

        {/* ── MESSAGE BAR ── */}
        {msg && (
          <div className="uce-msg" style={{
            color: msg.startsWith('✅') ? '#22c55e' : msg.startsWith('❌') ? '#f87171' : msg.startsWith('⏳') ? '#f59e0b' : '#94a3b8'
          }}>{msg}</div>
        )}

        {/* ── NEW ITEM FORM ── */}
        {showAdd && (
          <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'rgba(200,146,42,.04)', flexShrink:0 }}>
            <span className="uce-lbl">New {label} Item</span>
            <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
              <input className="uce-input" style={{ flex:2, minWidth:200 }} placeholder="Title *"
                value={addForm.title||''} onChange={e => setAddForm({...addForm, title:e.target.value})} />
              {FIELDS.find(f => f.key==='tag') && (
                <input className="uce-input" style={{ flex:1, minWidth:100 }} placeholder="Tag"
                  value={addForm.tag||''} onChange={e => setAddForm({...addForm, tag:e.target.value})} />
              )}
              <button className="uce-btn" onClick={create} disabled={busy}>{T('Save')}</button>
              <button className="uce-ghost" onClick={() => { setShowAdd(false); setAddForm({}) }}>{T('Cancel')}</button>
            </div>
          </div>
        )}

        {/* ── BULK ACTION BAR ── */}
        {checked.size > 0 && (
          <div style={{ padding:'8px 14px', background:'#0d1117', borderBottom:'1px solid var(--gold)', borderLeft:'4px solid var(--gold)', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flexShrink:0 }}>
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:'var(--gold)' }}>
              {checked.size} selected
            </span>
            <button className="uce-btn" onClick={() => bulkPublish(true)} disabled={busy} style={{ fontSize:10, padding:'5px 12px', background:'#14532d', borderColor:'#22c55e', color:'#22c55e' }}>▶ Publish {checked.size}</button>
            <button className="uce-ghost" onClick={() => bulkPublish(false)} disabled={busy} style={{ fontSize:10, padding:'5px 12px' }}>⏸ Unpublish {checked.size}</button>
            <button className="uce-btn" onClick={() => bulkLock(true)} disabled={busy} style={{ fontSize:10, padding:'5px 12px' }}>🔒 Lock All</button>
            <button className="uce-ghost" onClick={() => bulkLock(false)} disabled={busy}>🔓 Unlock All</button>
            <button className="uce-del" onClick={bulkDelete} disabled={busy}>🗑 Delete {checked.size}</button>
            <button onClick={() => setChecked(new Set())} style={{ marginLeft:'auto', background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>✕ Clear</button>
          </div>
        )}

        {/* ── MAIN AREA ── */}
        <div className="uce-main">

          {/* ── LIST ── */}
          <div className="uce-list">
            <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)' }}>
              <input className="uce-input" placeholder={T('Filter') + '...'} value={filter}
                onChange={e => { setFilter(e.target.value); setPage(0) }} />
            </div>

            {loading ? (
              <div style={{ padding:20, textAlign:'center', color:'#4b5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>{T('Loading')}</div>
            ) : visible.length === 0 ? (
              <div style={{ padding:20, textAlign:'center', color:'#4b5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                {filter ? 'No results' : 'Empty — click ＋ New'}
              </div>
            ) : visible.map(item => {
              const broken = isBad(item.imageUrl)
              const published = isPublished(item, config)
              return (
                <div key={item._id} className={'uce-row' + (sel===item._id?' sel':'') + (checked.has(item._id)?' checked':'')}
                  onClick={() => setSel(sel===item._id ? null : item._id)}>
                  {/* Checkbox */}
                  <div onClick={e => { e.stopPropagation(); setChecked(prev => { const n = new Set(prev); n.has(item._id)?n.delete(item._id):n.add(item._id); return n }) }}
                    style={{ paddingTop:2 }}>
                    <input type="checkbox" checked={checked.has(item._id)} readOnly
                      style={{ cursor:'pointer', accentColor:'var(--gold)', width:13, height:13 }} />
                  </div>
                  {/* Thumb */}
                  <div style={{ width:44, height:36, flexShrink:0, position:'relative' }}>
                    {item.imageUrl
                      ? <img src={item.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} onError={e => e.target.style.background='#1a0000'} />
                      : <div style={{ width:'100%', height:'100%', background:'#1a0000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⬜</div>
                    }
                    {broken && <div style={{ position:'absolute', inset:0, background:'rgba(239,68,68,.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'#f87171' }}>⚠</div>}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, fontSize:13, color:'var(--text)', lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>
                      {item.editorLocked && <span style={{ fontSize:8, color:'#C8922A', marginRight:4 }}>🔒</span>}
                      {item.title}
                    </div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {(item.tag||item.category||item.type) && <span style={{ fontSize:8, color:'#C8922A' }}>{item.tag||item.category}</span>}
                      <span style={{ fontSize:8, color: published ? '#22c55e' : '#ef4444' }}>● {published ? 'live' : 'draft'}</span>
                      {item.publishedAt && <span style={{ fontSize:8, color:'#374151' }}>{timeAgo(item.publishedAt)}</span>}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ padding:'8px 10px', borderTop:'1px solid var(--border)', display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
                <button className="uce-ghost" onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} style={{ padding:'3px 8px', fontSize:10 }}>←</button>
                {Array.from({length:Math.min(pages,8)},(_,i)=>i).map(i => (
                  <button key={i} className="uce-ghost" onClick={() => setPage(i)}
                    style={{ padding:'3px 8px', fontSize:10, borderColor: i===page ? 'var(--gold)' : undefined, color: i===page ? 'var(--gold)' : undefined }}>
                    {i+1}
                  </button>
                ))}
                <button className="uce-ghost" onClick={() => setPage(p => Math.min(pages-1,p+1))} disabled={page===pages-1} style={{ padding:'3px 8px', fontSize:10 }}>→</button>
              </div>
            )}
          </div>

          {/* ── DETAIL ── */}
          <div className="uce-detail">
            {!selItem ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#4b5563', gap:16 }}>
                <div style={{ fontSize:'3rem' }}>{icon}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>Select an item to edit</div>
                {brokenCount > 0 && (
                  <button className="uce-btn" onClick={fixAllImages} disabled={busy}>
                    🖼 Fix {brokenCount} Broken Images
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* ── HEADER ── */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, gap:12, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--text)', lineHeight:1 }}>{selItem.title}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', marginTop:3 }}>
                      {selItem._id} · {timeAgo(selItem.publishedAt)}
                      {pageUrl(config, selItem) && (
                        <a href={pageUrl(config, selItem)} target="_blank" rel="noreferrer"
                          style={{ marginLeft:8, color:'var(--gold)', textDecoration:'none' }}>
                          ↗ View Live
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {/* Lock */}
                    <button onClick={() => toggleLock(selItem)} disabled={busy}
                      className="uce-ghost"
                      style={{ borderColor: selItem.editorLocked ? 'var(--gold)' : undefined, color: selItem.editorLocked ? 'var(--gold)' : undefined }}>
                      {selItem.editorLocked ? '🔒 Locked' : '🔓 Unlocked'}
                    </button>
                    {/* Publish */}
                    {(() => {
                      const isLive = isPublished(selItem, config)
                      return (
                        <button onClick={() => togglePublish(selItem)} disabled={busy}
                          className="uce-ghost"
                          style={{ borderColor:'#22c55e', color: isLive ? '#22c55e' : '#4b5563' }}>
                          {isLive ? '▶ Live' : '⏸ Draft'}
                        </button>
                      )
                    })()}
                    {/* Fix image */}
                    <button className="uce-ghost" onClick={() => fixImage(selItem)} disabled={busy}>🖼 Image</button>
                    {/* Search image */}
                    <button className="uce-ghost" onClick={() => setImgSearch(selItem)}>🔍 Search</button>
                    {/* Delete */}
                    <button className="uce-del" onClick={() => del(selItem._id)} disabled={busy}>🗑</button>
                  </div>
                </div>

                {/* ── IMAGE STRIP ── */}
                {(selItem.imageUrl || true) && (
                  <div style={{ marginBottom:16 }}>
                    <span className="uce-lbl">Hero Image {isBad(selItem.imageUrl) && <span style={{ color:'#ef4444' }}>⚠ broken</span>}</span>
                    <div style={{ position:'relative', height:160, marginBottom:8, background:'#111' }}>
                      {selItem.imageUrl && (
                        <img src={selItem.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => { e.target.style.display='none' }} />
                      )}
                      {isBad(selItem.imageUrl) && (
                        <div style={{ position:'absolute', inset:0, background:'rgba(239,68,68,.1)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#ef4444' }}>⚠ No real image</span>
                          <button className="uce-btn" onClick={() => fixImage(selItem)} disabled={busy} style={{ fontSize:10 }}>🖼 Auto-Fix Now</button>
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                      <input className="uce-input" style={{ flex:1 }} placeholder="Paste image URL..."
                        value={fieldVals.imageUrl || selItem.imageUrl || ''}
                        onChange={e => setFieldVals(prev => ({...prev, imageUrl: e.target.value}))}
                        onBlur={() => saveField('imageUrl', fieldVals.imageUrl)} />
                      <button className="uce-ghost" onClick={() => fixImage(selItem)} disabled={busy} title="Auto-fetch from Pexels/Pixabay">Auto</button>
                      <button className="uce-ghost" onClick={() => setImgSearch(selItem)} title="Search images">Search</button>
                    </div>
                    <button className="uce-btn" disabled={busy}
                      style={{ width:'100%', fontSize:11, padding:'7px 0', opacity: fieldVals.imageUrl && fieldVals.imageUrl.startsWith('http') ? 1 : 0.4 }}
                      onClick={async () => {
                        const url = fieldVals.imageUrl || selItem.imageUrl
                        if (!url || !url.startsWith('http')) { flash('Paste an https:// URL first', 'error'); return }
                        setBusy(true); flash('⏳ Downloading image to Sanity CDN...')
                        try {
                          const r = await fetch('/api/admin/save-image-url', {
                            method:'POST', headers:{...H,'Content-Type':'application/json'},
                            body: JSON.stringify({ url, id:selItem._id, type })
                          })
                          const d = await r.json()
                          if (d.ok && d.cdnUrl) {
                            setFieldVals(prev => ({...prev, imageUrl: d.cdnUrl}))
                            setItems(prev => prev.map(x => x._id===selItem._id ? {...x, imageUrl:d.cdnUrl} : x))
                            flash('✅ Image saved to Sanity CDN: ' + d.cdnUrl.slice(0,50))
                          } else flash('❌ ' + (d.error||'Download failed'), 'error')
                        } catch(e) { flash('❌ ' + e.message, 'error') }
                        setBusy(false)
                      }}>
                      📥 Save Image to Article
                    </button>
                  </div>
                )}

                <hr className="uce-sep" />

                {/* ── TABS: Edit / HTML Preview / Page Preview ── */}
                <div style={{ display:'flex', gap:0, marginBottom:16, borderBottom:'1px solid var(--border)' }}>
                  {[
                    ['edit',    T('Edit')],
                    ['html',    T('HTML Preview')],
                    ['preview', T('Page Preview')],
                  ].map(([id, lbl]) => (
                    <button key={id} onClick={() => setDetailTab(id)}
                      style={{ background:'none', border:'none', borderBottom:'2px solid transparent', padding:'8px 14px',
                        fontFamily:"'IBM Plex Mono',monospace", fontSize:11, cursor:'pointer',
                        color: detailTab===id ? 'var(--gold)' : 'var(--text-dim)',
                        borderBottomColor: detailTab===id ? 'var(--gold)' : 'transparent' }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* ── EDIT TAB ── */}
                {detailTab === 'edit' && (
                  <div>
                    {FIELDS.map(f => <Field key={f.key} fieldCfg={f} />)}

                    {/* AI Writer section */}
                    {FIELDS.some(f => f.key === 'body' || f.key === 'detail') && (
                      <div style={{ padding:'12px', background:'rgba(200,146,42,.06)', border:'1px solid rgba(200,146,42,.2)', marginTop:8 }}>
                        <span className="uce-lbl">✦ AI Writer {lang === 'pt' ? '(Português Brasileiro)' : ''}</span>
                        <div style={{ display:'flex', gap:8, marginTop:6 }}>
                          <input className="uce-input" style={{ flex:1 }} placeholder={lang === 'pt' ? 'Tópico para escrever em português...' : 'Topic to write about...'}
                            value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                          <button className="uce-btn" onClick={() => aiWrite(selItem)} disabled={busy || !!selItem.editorLocked}>
                            🤖 {T('Write with AI')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── HTML PREVIEW TAB ── */}
                {detailTab === 'html' && (
                  <HtmlPreview html={selItem.body} summary={selItem.summary || selItem.detail} />
                )}

                {/* ── PAGE PREVIEW TAB ── */}
                {detailTab === 'preview' && (
                  <PagePreviewTab item={selItem} />
                )}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image search modal */}
      {imgSearch && (
        <ImageSearchModal
          adminKey={adminKey}
          item={imgSearch}
          onClose={() => setImgSearch(null)}
          onApply={async (imageUrl) => {
            await patch(imgSearch._id, { imageUrl })
            setItems(prev => prev.map(x => x._id === imgSearch._id ? {...x, imageUrl} : x))
            if (sel === imgSearch._id) setFieldVals(prev => ({...prev, imageUrl}))
            setImgSearch(null)
            flash('✅ Image saved')
          }}
        />
      )}
    </>
  )
}
