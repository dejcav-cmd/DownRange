'use client'
import { useState, useEffect, useCallback } from 'react'
import ImageSearchModal from './ImageSearchModal'
import { useBulkLock, BulkLockBar, LockToggle } from './BulkLockBar'

const TYPES = [
  { key:'law',      label:'Federal Laws',    icon:'⚖' },
  { key:'province', label:'Provinces',       icon:'🗺' },
  { key:'article',  label:'Articles',        icon:'✍' },
  { key:'ammo',     label:'Ammo Prices',     icon:'◎' },
  { key:'alert',    label:'Alert Banners',   icon:'🔴' },
  { key:'stat',     label:'Key Stats',       icon:'📊' },
]

const IMPACTS = ['CRITICAL','HIGH','MED','LOW','REQUIRED','IN FORCE']
const RATINGS = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D']
const AVAIL   = ['High','Moderate','Low']
const TRENDS  = ['up','flat','down']

const S = `
.cm-input{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;width:100%}
.cm-input:focus{border-color:var(--gold)}
.cm-ta{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px;outline:none;width:100%;resize:vertical;line-height:1.7}
.cm-ta:focus{border-color:var(--gold)}
.cm-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer}
.cm-btn:hover{opacity:.85}
.cm-btn:disabled{opacity:.35;cursor:not-allowed}
.cm-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s}
.cm-ghost:hover{border-color:var(--gold);color:var(--gold)}
.cm-del{background:none;border:1px solid rgba(239,68,68,.35);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.cm-row{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-bottom:1px solid var(--border);background:var(--bg2);transition:background .1s;cursor:pointer}
.cm-row:hover{background:rgba(200,146,42,.04)}
.cm-row.sel{background:rgba(200,146,42,.08);border-left:2px solid var(--gold)}
.cm-row.checked{background:rgba(200,146,42,.05)}
.cm-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
`

export default function CanadaManager({ adminKey }) {
  const [activeType, setActiveType] = useState('law')
  const [items,      setItems]      = useState([])
  const [sel,        setSel]        = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [busy,       setBusy]       = useState(false)
  const [msg,        setMsg]        = useState('')
  const [showAdd,    setShowAdd]    = useState(false)
  const [form,       setForm]       = useState({})
  const [aiTopic,    setAiTopic]    = useState('')

  const [imgSearch, setImgSearch] = useState(null) // { item } | null

  const H = { 'x-admin-key': adminKey }
  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/canada?all=1&type=' + activeType, { headers: H })
      const d = await res.json()
      setItems(d.items || [])
    } catch {}
    setLoading(false)
  }, [activeType, adminKey])

  useEffect(() => { load(); setSel(null); setShowAdd(false) }, [load])

  const selItem = items.find(i => i._id === sel)

  async function save(id, fields) {
    const res = await fetch('/api/canada', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'patch', id, fields }) })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Saved') }
    else flash('❌ ' + d.error)
  }

  async function del(id) {
    if (!confirm('Delete this item?')) return
    setBusy(true)
    const res = await fetch('/api/canada', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }) })
    const d = await res.json()
    if (d.ok) { setSel(null); await load(); flash('🗑 Deleted') }
    else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function create() {
    if (!form.title) { flash('❌ Title required'); return }
    setBusy(true)
    const res = await fetch('/api/canada', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', type: activeType, ...form }) })
    const d = await res.json()
    if (d.ok) { setShowAdd(false); setForm({}); await load(); flash('✅ Created') }
    else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function fixImage(id, title) {
    setBusy(true); flash('⏳ Searching Pexels/Pixabay...')
    try {
      const r = await fetch('/api/canada', { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body:JSON.stringify({action:'fix-image',id,title,type:activeType}) })
      const d = await r.json()
      if (d.ok) { await load(); flash('✅ Image: ' + d.imageUrl.slice(0,50)) }
      else flash('❌ ' + (d.error||'Not found'))
    } finally { setBusy(false) }
  }

  async function fixAllImages() {
    setBusy(true); flash('⏳ Fixing all Canada images...')
    try {
      const r = await fetch('/api/admin/fix-images-intl', { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body:JSON.stringify({type:'canada'}) })
      const d = await r.json()
      flash('✅ Images fixed: ' + (d.fixed||0))
      await load()
    } catch { flash('❌ Error fixing images') } finally { setBusy(false) }
  }

  async function pullArticles() {
    setBusy(true); flash('⏳ Writing Canada articles with AI + real images...')
    try {
      const r = await fetch('/api/admin/write-canada-articles', { method:'POST', headers:{...H,'Content-Type':'application/json'},
        body:JSON.stringify({limit:5,force:false}) })
      const d = await r.json()
      const created = (d.results||[]).filter(x=>x.status==='created').length
      const skipped = (d.results||[]).filter(x=>x.status==='skipped').length
      flash('✅ ' + created + ' created · ' + skipped + ' already exist')
      if (activeType === 'article') await load()
    } finally { setBusy(false) }
  }

  async function aiWrite(id) {
    if (!aiTopic) { flash('❌ Enter a topic first'); return }
    setBusy(true); flash('⏳ Claude is writing...')
    const res = await fetch('/api/canada', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ai-write', id, topic: aiTopic, type: activeType }) })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Written by Claude') }
    else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function seedFromStatic() {
    setBusy(true); flash('⏳ Seeding static data to Sanity...')
    // Import the static data and send to seed endpoint
    const res = await fetch('/api/canada/seed', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' } })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Seeded ' + d.created + ' items') }
    else flash('❌ ' + (d.error || 'Seed failed'))
    setBusy(false)
  }

  function Field({ label, field, item, type = 'text', options = null, rows = null }) {
    const val = item?.[field] || ''
    return (
      <div style={{ marginBottom: 10 }}>
        <span className="cm-lbl">{label}</span>
        {options ? (
          <select className="cm-input" defaultValue={val} onBlur={e => { if (e.target.value !== val) save(item._id, { [field]: e.target.value }) }}>
            <option value="">—</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : rows ? (
          <textarea className="cm-ta" rows={rows} defaultValue={val} onBlur={e => { if (e.target.value !== val) save(item._id, { [field]: e.target.value }) }} />
        ) : (
          <input className="cm-input" type={type} defaultValue={val} onBlur={e => { if (e.target.value !== String(val)) save(item._id, { [field]: type === 'number' ? parseFloat(e.target.value) || null : e.target.value }) }} />
        )}
      </div>
    )
  }

  const typeConf = TYPES.find(t => t.key === activeType)

  return (
    <div>
      <style>{S}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '2rem', color: 'var(--gold)', letterSpacing: '.06em', lineHeight: 1 }}>🇨🇦 Canada Manager</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#64748b', marginTop: 3 }}>Manage all content on the Canada page. Changes go live within 30 minutes.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="cm-ghost" onClick={seedFromStatic} disabled={busy}>📥 Seed Static Data</button>
          <button className="cm-ghost" onClick={async () => {
            setBusy(true); flash('⏳ Writing Canada articles with AI...')
            const res = await fetch('/api/admin/write-canada-articles', { method:'POST', headers:{...H} })
            const d = await res.json()
            if (d.ok) { flash('✅ ' + (d.message || 'Canada articles written')); load() }
            else flash('❌ ' + (d.error||'Error'))
            setBusy(false)
          }} disabled={busy}>🤖 AI Write Articles</button>
          <button className="cm-btn" onClick={() => setShowAdd(!showAdd)} disabled={busy}>+ Add {typeConf?.label.slice(0,-1)}</button>
        </div>
      </div>

      {msg && <div style={{ padding: '9px 14px', marginBottom: 12, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: msg.startsWith('✅') ? '#22c55e' : msg.startsWith('❌') ? '#f87171' : '#f59e0b', background: 'var(--bg2)', border: '1px solid var(--border)' }}>{msg}</div>}

      {/* Type tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {TYPES.map(t => (
          <button key={t.key} onClick={() => setActiveType(t.key)}
            style={{ background: 'none', border: 'none', borderBottom: `2px solid ${activeType === t.key ? 'var(--gold)' : 'transparent'}`, color: activeType === t.key ? 'var(--gold)' : 'var(--text-dim)', padding: '10px 16px', cursor: 'pointer', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: '.04em', transition: 'all .15s', whiteSpace: 'nowrap' }}>
            {t.icon} {t.label} {items.length > 0 && activeType === t.key ? `(${items.length})` : ''}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: 'rgba(200,146,42,.05)', border: '1px solid rgba(200,146,42,.25)', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--gold)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>New {typeConf?.label.slice(0,-1)}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><span className="cm-lbl">Title / Name *</span><input className="cm-input" value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            {activeType === 'law' && <><div><span className="cm-lbl">Impact</span><select className="cm-input" value={form.impact||''} onChange={e=>setForm(p=>({...p,impact:e.target.value}))}><option>—</option>{IMPACTS.map(i=><option key={i}>{i}</option>)}</select></div></>}
            {activeType === 'province' && <><div><span className="cm-lbl">Abbreviation</span><input className="cm-input" value={form.abbr||''} onChange={e=>setForm(p=>({...p,abbr:e.target.value}))} placeholder="AB" /></div><div><span className="cm-lbl">Rating</span><select className="cm-input" value={form.rating||''} onChange={e=>setForm(p=>({...p,rating:e.target.value}))}><option>—</option>{RATINGS.map(r=><option key={r}>{r}</option>)}</select></div></>}
            {activeType === 'ammo' && <><div><span className="cm-lbl">CAD Price</span><input className="cm-input" value={form.cadPrice||''} onChange={e=>setForm(p=>({...p,cadPrice:e.target.value}))} placeholder="C$0.42/rd" /></div></>}
          </div>
          <div style={{ marginBottom: 10 }}><span className="cm-lbl">Summary</span><textarea className="cm-ta" rows={3} value={form.summary || ''} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} /></div>
          {activeType === 'law' && <div style={{ marginBottom: 10 }}><span className="cm-lbl">Source URL</span><input className="cm-input" value={form.sourceUrl || ''} onChange={e => setForm(p => ({ ...p, sourceUrl: e.target.value }))} /></div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="cm-btn" onClick={create} disabled={busy}>Create</button>
            <button className="cm-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* List + Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selItem ? '1fr 420px' : '1fr', gap: 0, border: '1px solid var(--border)', minHeight: 300 }}>
        {/* List */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 350px)' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#4b5563' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#4b5563' }}>
              No {typeConf?.label} yet. Click "Seed Static Data" to import the default content, or add items manually.
            </div>
          ) : (<>
          <BulkLockBar checkedIds={bulkLock.checkedIds} bulkSaving={bulkLock.bulkSaving} onLock={()=>bulkLock.bulkSetLock(true)} onUnlock={()=>bulkLock.bulkSetLock(false)} onClear={bulkLock.clearChecked} />
          {items.map(item => (
            <div key={item._id} className={'cm-row' + (sel === item._id ? ' sel' : '') + (bulkLock.checkedIds.has(item._id) ? ' checked' : '')} onClick={() => setSel(sel === item._id ? null : item._id)}>
              <div style={{flexShrink:0,paddingRight:6}} onClick={e=>bulkLock.toggleCheck(item._id,e)}><input type="checkbox" checked={bulkLock.checkedIds.has(item._id)} onChange={()=>{}} style={{cursor:'pointer',accentColor:'var(--gold)',width:14,height:14}} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                  {item.abbr ? `[${item.abbr}] ` : ''}{item.title}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.impact && <span style={{ color: item.impact === 'CRITICAL' ? '#ef4444' : item.impact === 'HIGH' ? '#f97316' : '#f59e0b', marginRight: 8 }}>{item.impact}</span>}
                  {item.rating && <span style={{ color: '#C8922A', marginRight: 8 }}>{item.rating}</span>}
                  {item.cadPrice && <span style={{ color: '#C8922A', marginRight: 8 }}>{item.cadPrice}</span>}
                  {(item.summary || '').slice(0, 80)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize:9, padding:'2px 6px', background: item.active ? 'rgba(34,197,94,.15)' : 'rgba(100,116,139,.15)', color: item.active ? '#22c55e' : '#64748b' }}>{item.active ? 'on' : 'off'}</span>
                <LockToggle locked={item.editorLocked} onToggle={async(e)=>{ if(e)e.stopPropagation(); const v=!item.editorLocked; await fetch('/api/canada',{method:'POST',headers:H,body:JSON.stringify({action:'patch',id:item._id,fields:{editorLocked:v}})}); setItems(prev=>prev.map(x=>x._id===item._id?{...x,editorLocked:v}:x)) }} />
                <span style={{ color: sel === item._id ? 'var(--gold)' : '#374151', fontSize: 12 }}>›</span>
              </div>
            </div>
          ))}
          </>)}
        </div>

        {/* Detail panel */}
        {selItem && (
          <div style={{ borderLeft: '1px solid var(--border)', overflowY: 'auto', maxHeight: 'calc(100vh - 350px)', background: 'var(--bg)' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg2)' }}>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--gold)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Edit</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {selItem.sourceUrl && (
                  <a href={selItem.sourceUrl} target="_blank" rel="noreferrer"
                    style={{padding:'4px 10px',border:'1px solid rgba(200,146,42,.4)',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',textDecoration:'none'}}>
                    Source ↗
                  </a>
                )}
                <button onClick={() => save(selItem._id, { active: !selItem.active })} className="cm-ghost" style={{ fontSize: 9 }}>{selItem.active ? 'Hide' : 'Show'}</button>
                <button onClick={() => del(selItem._id)} className="cm-del">🗑</button>
                <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>✕</button>
              </div>
            </div>

            <div style={{ padding: 14 }}>
              <Field label="Title" field="title" item={selItem} />

              {activeType === 'law' && <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="Impact" field="impact" item={selItem} options={IMPACTS} />
                  <Field label="Effective Date" field="effectiveDate" item={selItem} />
                </div>
                <Field label="Status" field="status" item={selItem} />
                <Field label="Summary" field="summary" item={selItem} rows={3} />
                <Field label="Full Detail" field="detail" item={selItem} rows={6} />
                <Field label="Source URL" field="sourceUrl" item={selItem} />
              </>}

              {activeType === 'province' && <>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                  <Field label="Abbr" field="abbr" item={selItem} />
                  <Field label="Rating" field="rating" item={selItem} options={RATINGS} />
                </div>
                <Field label="Summary" field="summary" item={selItem} rows={4} />
                <div style={{ marginBottom: 10 }}>
                  <span className="cm-lbl">Highlights (one per line)</span>
                  <textarea className="cm-ta" rows={5} defaultValue={(selItem.highlights || []).join('\n')}
                    onBlur={e => {
                      const h = e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                      save(selItem._id, { highlights: h })
                    }} />
                </div>
              </>}

              {activeType === 'article' && <>
                <Field label="Tag (LAW/GUIDE/POLICY)" field="tag" item={selItem} />
                <Field label="Read Time" field="readMins" item={selItem} />
                <Field label="Author" field="author" item={selItem} />
                <Field label="Image URL" field="imageUrl" item={selItem} />
                <div style={{display:'flex',gap:6,marginBottom:8}}>
                  <button style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:11,letterSpacing:'.05em',padding:'5px 12px',background:'#3b82f6',color:'#fff',border:'none',cursor:busy?'default':'pointer',opacity:busy?.5:1}}
                    disabled={busy} onClick={async ()=>{
                      setBusy(true); flash('⏳ Fetching real image...')
                      try {
                        const res = await fetch('/api/admin/fetch-image', {
                          method:'POST', headers:{...H},
                          body: JSON.stringify({ id:selItem._id, type:'canadaContent', title:selItem.title, category:'law' })
                        })
                        const d = await res.json()
                        if (d.ok) { save(selItem._id, { imageUrl: d.imageUrl }); flash(`✅ Photo assigned — ${d.imageUrl.slice(0,50)}`) }
                        else flash('❌ ' + (d.error||'Error'))
                      } catch(e){ flash('❌ '+e.message) }
                      setBusy(false)
                    }}>🖼 Fetch Real Image</button>
                </div>
                <Field label="Summary" field="summary" item={selItem} rows={2} />
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span className="cm-lbl" style={{ margin: 0 }}>Article Body (HTML)</span>
                  </div>
                  <textarea className="cm-ta" rows={10} defaultValue={selItem.body || ''}
                    onBlur={e => { if (e.target.value !== selItem.body) save(selItem._id, { body: e.target.value }) }} />
                </div>
                {/* AI Write */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <input className="cm-input" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="AI topic (e.g. 'Bill C-71 enhanced background checks')..." style={{ flex: 1 }} />
                  <button className="cm-ghost" onClick={() => aiWrite(selItem._id)} disabled={busy} style={{ flexShrink: 0 }}>🤖 AI Write</button>
                </div>
              </>}

              {activeType === 'ammo' && <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="CAD Price" field="cadPrice" item={selItem} />
                  <Field label="USD Equivalent" field="usdEquiv" item={selItem} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Field label="Availability" field="availability" item={selItem} options={AVAIL} />
                  <Field label="Trend" field="trend" item={selItem} options={TRENDS} />
                </div>
                <Field label="Notes" field="note" item={selItem} rows={2} />
              </>}

              {activeType === 'alert' && <>
                <Field label="Alert Text" field="summary" item={selItem} rows={2} />
                <Field label="Link URL" field="sourceUrl" item={selItem} />
                <Field label="Color (hex)" field="color" item={selItem} />
              </>}

              {activeType === 'stat' && <>
                <Field label="Value" field="value" item={selItem} />
                <Field label="Color (hex)" field="color" item={selItem} />
              </>}

              <div style={{ marginTop: 10 }}>
                <Field label="Sort Order (lower = first)" field="order" item={selItem} type="number" />
              </div>
            </div>
          </div>
        )}
      </div>

    {/* ── Image Search Modal ── */}
    {imgSearch && (
      <ImageSearchModal
        adminKey={adminKey}
        item={imgSearch}
        onApply={(imageUrl) => {
          // Update the item in local state
          setImgSearch(null)
        }}
        onClose={() => setImgSearch(null)}
      />
    )}
    </div>
  )
}
