'use client'
import { useState, useEffect, useCallback } from 'react'

const CATEGORIES = [
  { value:'',            label:'All Categories' },
  { value:'pistol',      label:'Pistol / Handgun' },
  { value:'rifle',       label:'Rifle / Carbine' },
  { value:'shotgun',     label:'Shotgun' },
  { value:'suppressor',  label:'Suppressor / NFA' },
  { value:'ammo',        label:'Ammunition' },
  { value:'law',         label:'Law / 2A / Legal' },
  { value:'training',    label:'Training / Range' },
  { value:'competition', label:'Competition' },
  { value:'hunting',     label:'Hunting' },
  { value:'gear',        label:'Gear / Accessories' },
  { value:'homedefense', label:'Home Defense' },
  { value:'news',        label:'Industry / News' },
]

const CAT_COLORS = {
  pistol:'#3b82f6', rifle:'#22c55e', shotgun:'#f59e0b', suppressor:'#8b5cf6',
  ammo:'#ef4444', law:'#C8922A', training:'#06b6d4', competition:'#ec4899',
  hunting:'#84cc16', gear:'#6b7280', homedefense:'#f97316', news:'#64748b',
}

const S = `
.ir-shell { display:flex; flex-direction:column; gap:0; height:100%; }
.ir-topbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; padding-bottom:16px; border-bottom:1px solid var(--border); margin-bottom:16px; }
.ir-stats { font-family:'IBM Plex Mono',monospace; font-size:10px; color:#4b5563; }
.ir-filter { background:var(--bg3); border:1px solid var(--border); color:var(--text); font-family:'IBM Plex Mono',monospace; font-size:11px; padding:6px 10px; cursor:pointer; }
.ir-filter.active { border-color:var(--gold); color:var(--gold); }
.ir-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; overflow-y:auto; padding-bottom:20px; }
.ir-card { background:var(--bg2); border:1px solid var(--border); overflow:hidden; cursor:pointer; transition:all .15s; position:relative; }
.ir-card:hover { border-color:var(--gold); transform:translateY(-2px); box-shadow:0 4px 20px rgba(200,146,42,.15); }
.ir-card.selected { border-color:var(--gold); border-width:2px; }
.ir-img { width:100%; height:180px; object-fit:cover; display:block; background:#0a0a0c; }
.ir-meta { padding:8px 10px; }
.ir-cat-pill { display:inline-block; font-size:8px; font-family:'IBM Plex Mono',monospace; padding:2px 6px; border-radius:2px; text-transform:uppercase; letter-spacing:.06em; margin-bottom:4px; font-weight:700; }
.ir-title { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:var(--text); line-height:1.3; margin-bottom:3px; }
.ir-source { font-family:'IBM Plex Mono',monospace; font-size:8px; color:#4b5563; }
.ir-usage { position:absolute; top:6px; right:6px; background:rgba(0,0,0,.7); font-family:'IBM Plex Mono',monospace; font-size:9px; color:#6b7280; padding:2px 5px; }
.ir-btn { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:'IBM Plex Mono',monospace; font-size:10px; padding:6px 12px; cursor:pointer; transition:all .15s; }
.ir-btn:hover { border-color:var(--gold); color:var(--gold); }
.ir-btn-primary { background:var(--gold); color:#000; border:none; font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13px; letter-spacing:.06em; text-transform:uppercase; padding:8px 16px; cursor:pointer; }
.ir-btn-danger { background:none; border:1px solid rgba(239,68,68,.4); color:#ef4444; font-family:'IBM Plex Mono',monospace; font-size:10px; padding:5px 10px; cursor:pointer; }
.ir-empty { padding:60px; text-align:center; font-family:'IBM Plex Mono',monospace; font-size:12px; color:#374151; }
.ir-msg { font-family:'IBM Plex Mono',monospace; font-size:11px; padding:8px 12px; border:1px solid; margin-bottom:12px; }
.ir-msg.ok  { color:#22c55e; border-color:rgba(34,197,94,.3); background:rgba(34,197,94,.06); }
.ir-msg.err { color:#f87171; border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.06); }
.ir-msg.info{ color:#C8922A; border-color:rgba(200,146,42,.3); background:rgba(200,146,42,.06); }
.ir-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.7); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
.ir-modal { background:var(--bg2); border:1px solid var(--border); width:100%; max-width:500px; padding:24px; }
`

export default function ImageRepository({ adminKey }) {
  const [images,   setImages]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [busy,     setBusy]     = useState(false)
  const [msg,      setMsg]      = useState({ text:'', type:'info' })
  const [filter,   setFilter]   = useState('')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)
  const [modal,    setModal]    = useState(null) // 'add' | 'assign' | 'config'
  const [addForm,  setAddForm]  = useState({ title:'', category:'pistol', url:'', tags:'', source:'' })

  // Seed config — persisted to localStorage
  const [seedLimit,   setSeedLimit]   = useState(() => { try { return parseInt(localStorage.getItem('dr_img_seed_limit') || '200') } catch { return 200 } })
  const [seedForce,   setSeedForce]   = useState(false)
  const [seedCat,     setSeedCat]     = useState('')

  function saveSeedConfig(limit) {
    try { localStorage.setItem('dr_img_seed_limit', String(limit)) } catch {}
    setSeedLimit(limit)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter ? `/api/admin/image-repo?category=${filter}&limit=200` : `/api/admin/image-repo?limit=200`
      const r = await fetch(url)
      const d = await r.json()
      if (d.ok) setImages(d.images || [])
    } catch(e) { flash('❌ ' + e.message, 'err') }
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [load])

  function flash(text, type = 'info') {
    setMsg({ text, type: text.startsWith('✅')?'ok':text.startsWith('❌')?'err':'info' })
    if (!text.startsWith('⏳')) setTimeout(() => setMsg({ text:'', type:'info' }), 6000)
  }

  async function seedRepo(category = null) {
    setBusy(true)
    flash(`⏳ Seeding up to ${seedLimit} images — downloading & uploading to Sanity CDN...`)
    try {
      const body = { force: seedForce, limit: seedLimit }
      if (category || seedCat) body.category = category || seedCat
      const r = await fetch('/api/admin/seed-image-repo', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (d.ok) {
        flash(`✅ Seeded ${d.seeded} images · ${d.skipped} already existed · ${d.failed} failed (of ${d.total} total)`, 'ok')
        await load()
      } else flash('❌ ' + (d.error || 'Failed'), 'err')
    } catch(e) { flash('❌ ' + e.message, 'err') }
    setBusy(false)
  }

  async function addImage() {
    if (!addForm.url || !addForm.title) return flash('❌ Title and URL required', 'err')
    setBusy(true)
    try {
      const r = await fetch('/api/admin/image-repo', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          title: addForm.title,
          category: addForm.category,
          cdnUrl: addForm.url,
          tags: addForm.tags.split(',').map(t=>t.trim()).filter(Boolean),
          source: addForm.source,
        }),
      })
      const d = await r.json()
      if (d.ok) { flash('✅ Image added to repository', 'ok'); setModal(null); setAddForm({ title:'',category:'pistol',url:'',tags:'',source:'' }); await load() }
      else flash('❌ ' + (d.error || 'Failed'), 'err')
    } catch(e) { flash('❌ ' + e.message, 'err') }
    setBusy(false)
  }

  async function deleteImage(img) {
    if (!confirm(`Delete "${img.title}"?`)) return
    setBusy(true)
    try {
      const r = await fetch('/api/admin/image-repo', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', imageId: img._id }),
      })
      const d = await r.json()
      if (d.ok) { flash('✅ Deleted', 'ok'); await load() }
    } catch(e) { flash('❌ ' + e.message, 'err') }
    setBusy(false)
  }

  const visible = images.filter(img => {
    if (!search) return true
    const q = search.toLowerCase()
    return img.title?.toLowerCase().includes(q) || img.tags?.some(t => t.includes(q)) || img.category?.includes(q)
  })

  const catCounts = images.reduce((acc, img) => { acc[img.category] = (acc[img.category]||0)+1; return acc }, {})

  return (
    <div className="ir-shell">
      <style>{S}</style>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', letterSpacing:'.06em', lineHeight:1, marginBottom:4 }}>
          📸 Image Repository
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563' }}>
          {images.length} images · Click any image to use it · Stored on Sanity CDN
        </div>
      </div>

      {msg.text && <div className={`ir-msg ${msg.type}`}>{msg.text}</div>}

      {/* Top bar */}
      <div className="ir-topbar">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search images..."
          style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'6px 10px', width:180, outline:'none' }} />
        <button className="ir-btn-primary" onClick={() => seedRepo()} disabled={busy}>
          ⬇ Seed {seedLimit} Images
        </button>
        <button className="ir-btn" onClick={() => setModal('config')} disabled={busy}>⚙ Seed Config</button>
        <button className="ir-btn" onClick={() => setModal('add')} disabled={busy}>+ Add Image</button>
        <button className="ir-btn" onClick={load}>↺ Refresh</button>
        <div style={{ marginLeft:'auto', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#374151' }}>
          {Object.entries(catCounts).map(([cat,n]) => (
            <span key={cat} style={{ marginLeft:8, color: CAT_COLORS[cat] || '#4b5563' }}>{cat}:{n}</span>
          ))}
        </div>
      </div>

      {/* Seed config inline strip */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10, padding:'8px 12px', background:'rgba(200,146,42,.04)', border:'1px solid rgba(200,146,42,.15)', flexWrap:'wrap' }}>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', letterSpacing:'.08em', flexShrink:0 }}>SEED CONFIG</span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b' }}>Limit:</span>
          <select value={seedLimit} onChange={e => saveSeedConfig(Number(e.target.value))}
            style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'3px 6px', outline:'none' }}>
            {[25,50,75,100,150,200].map(n => <option key={n} value={n}>{n} images</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b' }}>Category:</span>
          <select value={seedCat} onChange={e => setSeedCat(e.target.value)}
            style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'3px 6px', outline:'none' }}>
            <option value="">All</option>
            {CATEGORIES.filter(c=>c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <label style={{ display:'flex', alignItems:'center', gap:5, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', cursor:'pointer' }}>
          <input type="checkbox" checked={seedForce} onChange={e => setSeedForce(e.target.checked)} />
          Force re-seed (overwrite existing)
        </label>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginLeft:'auto' }}>
          Pool: 200 curated public domain images
        </span>
      </div>

      {/* Category filters */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {CATEGORIES.map(cat => (
          <button key={cat.value} className={`ir-filter${filter===cat.value?' active':''}`}
            onClick={() => setFilter(cat.value)} style={{ fontSize:9, padding:'4px 10px' }}>
            {cat.label} {cat.value && catCounts[cat.value] ? `(${catCounts[cat.value]})` : ''}
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      {loading ? (
        <div className="ir-empty">Loading image repository...</div>
      ) : visible.length === 0 ? (
        <div className="ir-empty">
          <div style={{ marginBottom:12 }}>No images yet.</div>
          <button className="ir-btn-primary" onClick={() => seedRepo()} disabled={busy}>
            ⬇ Seed {seedLimit} Images Now
          </button>
          <div style={{ marginTop:8, fontSize:10, color:'#374151' }}>Downloads up to 200 curated 2A firearm images to Sanity CDN</div>
        </div>
      ) : (
        <div className="ir-grid">
          {visible.map(img => {
            const imgUrl = img.cdnUrl || img.imageUrl || '/img/photos/news.jpg'
            const color  = CAT_COLORS[img.category] || '#4b5563'
            return (
              <div key={img._id} className={`ir-card${selected?._id===img._id?' selected':''}`}
                onClick={() => setSelected(selected?._id===img._id ? null : img)}>
                <img src={imgUrl} alt={img.alt||img.title} className="ir-img"
                  onError={e => { e.target.src='/img/photos/news.jpg' }} />
                <div className="ir-meta">
                  <div className="ir-cat-pill" style={{ background:`${color}22`, color }}>{img.category}</div>
                  <div className="ir-title">{img.title}</div>
                  <div className="ir-source">{img.source}</div>
                  {img.tags?.length > 0 && (
                    <div style={{ marginTop:4, display:'flex', gap:3, flexWrap:'wrap' }}>
                      {img.tags.slice(0,4).map(t => (
                        <span key={t} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7, padding:'1px 4px', background:'rgba(255,255,255,.04)', color:'#4b5563' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                {img.usageCount > 0 && <div className="ir-usage">Used {img.usageCount}×</div>}
                {selected?._id === img._id && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(200,146,42,.15)', border:'2px solid var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8 }}>
                    <button className="ir-btn-primary" style={{ fontSize:11, padding:'6px 14px' }} onClick={e=>{ e.stopPropagation(); setModal('assign') }}>
                      Use This Image ✓
                    </button>
                    <button className="ir-btn-danger" style={{ fontSize:9 }} onClick={e=>{ e.stopPropagation(); deleteImage(img) }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Image Modal */}
      {modal === 'add' && (
        <div className="ir-modal-overlay" onClick={() => setModal(null)}>
          <div className="ir-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.5rem', color:'var(--gold)', letterSpacing:'.06em', marginBottom:16 }}>Add Image to Repository</div>
            {[
              { label:'Title', key:'title', ph:'Glock 17 Gen5 Pistol' },
              { label:'Image URL (cdn.sanity.io or direct)', key:'url', ph:'https://cdn.sanity.io/images/...' },
              { label:'Tags (comma-separated)', key:'tags', ph:'glock,9mm,pistol,edc' },
              { label:'Source / Credit', key:'source', ph:'Public Domain / Manufacturer' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:10 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:3 }}>{f.label}</div>
                <input className="ir-filter" value={addForm[f.key]} onChange={e=>setAddForm(p=>({...p,[f.key]:e.target.value}))}
                  placeholder={f.ph} style={{ width:'100%', padding:'7px 10px' }} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:3 }}>Category</div>
              <select className="ir-filter" value={addForm.category} onChange={e=>setAddForm(p=>({...p,category:e.target.value}))} style={{ width:'100%', padding:'7px 10px' }}>
                {CATEGORIES.filter(c=>c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="ir-btn-primary" onClick={addImage} disabled={busy}>Add to Repository</button>
              <button className="ir-btn" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Seed Config Modal */}
      {modal === 'config' && (
        <div className="ir-modal-overlay" onClick={() => setModal(null)}>
          <div className="ir-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.5rem', color:'var(--gold)', letterSpacing:'.06em', marginBottom:4 }}>⚙ Seed Configuration</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', marginBottom:20, lineHeight:1.8 }}>
              Configure how many images to pull from the 200-image pool. Settings are saved to your browser and persist across sessions.
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>Image Limit (max to seed)</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[25,50,75,100,150,200].map(n => (
                  <button key={n} onClick={() => saveSeedConfig(n)}
                    style={{ padding:'7px 16px', background:seedLimit===n?'var(--gold)':'var(--bg3)', color:seedLimit===n?'#000':'var(--text-dim)', border:`1px solid ${seedLimit===n?'var(--gold)':'var(--border)'}`, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, cursor:'pointer', transition:'all .15s' }}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{ marginTop:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--gold)' }}>
                Currently: <strong>{seedLimit} images</strong> — saved to browser
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:6 }}>Category Filter (optional)</div>
              <select value={seedCat} onChange={e => setSeedCat(e.target.value)}
                style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 12px', width:'100%', outline:'none' }}>
                <option value="">All Categories</option>
                {CATEGORIES.filter(c=>c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', cursor:'pointer' }}>
                <input type="checkbox" checked={seedForce} onChange={e => setSeedForce(e.target.checked)} />
                Force re-seed (overwrite images that already exist)
              </label>
            </div>

            <div style={{ padding:'10px 14px', background:'rgba(0,0,0,.3)', border:'1px solid var(--border)', marginBottom:16, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:2 }}>
              <div style={{ color:'var(--text-dim)', marginBottom:4, fontSize:9, letterSpacing:'.08em', textTransform:'uppercase' }}>Seed pool breakdown (200 total)</div>
              {[['Pistols','30'],['Rifles','40'],['Shotguns','15'],['Suppressors','10'],['Ammunition','20'],['Law / 2A','15'],['Training','15'],['Competition','10'],['Hunting','15'],['Gear','15'],['Home Defense','10'],['Industry','10']].map(([cat,n])=>(
                <div key={cat} style={{ display:'flex', justifyContent:'space-between', maxWidth:260 }}>
                  <span>{cat}</span><span style={{ color:'var(--gold)' }}>{n} images</span>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <button className="ir-btn-primary" onClick={() => { setModal(null); seedRepo() }} disabled={busy}>
                ⬇ Run Seed Now ({seedLimit} images)
              </button>
              <button className="ir-btn" onClick={() => setModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign to Article Modal */}
      {modal === 'assign' && selected && (
        <AssignModal image={selected} adminKey={adminKey} onClose={() => { setModal(null); setSelected(null) }} onSuccess={flash} />
      )}
    </div>
  )
}

function AssignModal({ image, adminKey, onClose, onSuccess }) {
  const [articles, setArticles] = useState([])
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [busy,     setBusy]     = useState(false)

  useEffect(() => {
    fetch(`/api/admin/articles-list?limit=50&imageFilter=svg`)
      .then(r => r.json())
      .then(d => { if (d.ok) setArticles(d.articles || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function assign(article) {
    setBusy(true)
    try {
      const r = await fetch('/api/admin/image-repo', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          articleId: article._id,
          imageId: image._id,
          imageUrl: image.cdnUrl || image.imageUrl,
        }),
      })
      const d = await r.json()
      if (d.ok) { onSuccess(`✅ Image assigned to "${article.title?.slice(0,40)}"`, 'ok'); onClose() }
      else onSuccess('❌ ' + (d.error || 'Failed'), 'err')
    } catch(e) { onSuccess('❌ ' + e.message, 'err') }
    setBusy(false)
  }

  const visible = articles.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', width:'100%', maxWidth:600, maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, alignItems:'center' }}>
          <img src={image.cdnUrl||image.imageUrl||'/img/photos/news.jpg'} style={{ width:60, height:40, objectFit:'cover', flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>Assign: {image.title}</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563' }}>Pick an article to assign this image to</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles..."
            style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'6px 10px', outline:'none' }} />
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {loading ? <div style={{ padding:20, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563' }}>Loading articles...</div>
          : visible.map(a => (
            <div key={a._id} style={{ display:'flex', gap:10, alignItems:'center', padding:'8px 16px', borderBottom:'1px solid rgba(255,255,255,.04)', cursor:'pointer', transition:'background .1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(200,146,42,.06)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <img src={a.imageUrl||'/img/photos/news.jpg'} style={{ width:48, height:32, objectFit:'cover', flexShrink:0, opacity:.6 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', marginTop:1 }}>{a.source} · {a.category}</div>
              </div>
              <button onClick={() => assign(a)} disabled={busy} style={{ background:'var(--gold)', color:'#000', border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, padding:'5px 12px', cursor:'pointer', flexShrink:0 }}>
                Assign
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
