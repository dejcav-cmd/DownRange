'use client'
import { useState, useEffect, useCallback } from 'react'
import { useBulkLock, BulkLockBar, RowCheckbox, LockToggle } from './BulkLockBar'

const CATS     = ['Pistol','Rifle','Shotgun','Optic','Suppressor','Accessory','Ammo']
const VERDICTS = ['Best in Class','Highly Recommended','Recommended','Good Value','Average','Skip It']
const CAT_C    = {Pistol:'#C8922A',Rifle:'#22c55e',Shotgun:'#f59e0b',Optic:'#34d399',Suppressor:'#a855f7',Accessory:'#9ca3af',Ammo:'#ef4444'}
const VERDICT_C = {'Best in Class':'#22c55e','Highly Recommended':'#22c55e','Recommended':'#C8922A','Good Value':'#f59e0b','Average':'#94a3b8','Skip It':'#ef4444'}

const S = `
.rv-input{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;width:100%;box-sizing:border-box}
.rv-input:focus{border-color:var(--gold)}
.rv-ta{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px;outline:none;width:100%;resize:vertical;line-height:1.7;box-sizing:border-box}
.rv-ta:focus{border-color:var(--gold)}
.rv-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer;white-space:nowrap}
.rv-btn:hover{opacity:.85}
.rv-btn:disabled{opacity:.35;cursor:not-allowed}
.rv-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s;white-space:nowrap}
.rv-ghost:hover{border-color:var(--gold);color:var(--gold)}
.rv-del{background:none;border:1px solid rgba(239,68,68,.35);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.rv-del:hover{background:rgba(239,68,68,.1)}
.rv-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
.rv-sep{height:1px;background:var(--border);margin:12px 0}
.rv-row{display:grid;grid-template-columns:36px 70px 1fr 100px 60px 100px 30px;align-items:center;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s}
.rv-row:hover{background:rgba(200,146,42,.04)}
.rv-row.sel{background:rgba(200,146,42,.08);border-left:2px solid var(--gold)}
.rv-row.checked{background:rgba(200,146,42,.05)}
.rv-cell{padding:9px 12px;font-size:11px;color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rv-score-ring{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',cursive;font-size:1.1rem;font-weight:700;flex-shrink:0}
.rv-tab-btn{background:none;border:none;border-bottom:2px solid transparent;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 14px;cursor:pointer;color:var(--text-dim);transition:all .15s;white-space:nowrap}
.rv-tab-btn.active{color:var(--gold);border-bottom-color:var(--gold)}
`

function scoreColor(s) {
  if (!s) return '#374151'
  if (s >= 9) return '#22c55e'
  if (s >= 7) return '#C8922A'
  if (s >= 5) return '#f59e0b'
  return '#ef4444'
}

export default function ReviewManager({ adminKey }) {
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [sel,      setSel]      = useState(null)
  const [busy,     setBusy]     = useState(false)
  const [msg,      setMsg]      = useState('')
  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''),5000) }
  const bulkLock = useBulkLock({ items:reviews, setItems:setReviews, patchFn:(id,fields)=>patch(id,fields) })
  const [search,   setSearch]   = useState('')
  const [catFilter,setCatFilter]= useState('all')
  const [mode,     setMode]     = useState('list') // list | add
  const [editView, setEditView] = useState('edit') // edit | preview
  const [form,     setForm]     = useState({ title:'',brand:'',model:'',caliber:'',category:'Pistol',score:'',verdict:'',summary:'',articleBody:'',msrp:'',imageUrl:'',pros:'',cons:'' })
  const [editDraft,setEditDraft]= useState({})

  const H = { 'x-admin-key': adminKey }
  const flash = m => { setMsg(m); setTimeout(()=>setMsg(''),5000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews-manager', { headers: H })
      const d = await res.json()
      if (d.ok) setReviews(d.reviews || [])
      else flash('❌ ' + d.error)
    } catch(e) { flash('❌ ' + e.message) }
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  const selReview = reviews.find(r => r._id === sel)

  // Sync edit draft when selection changes
  useEffect(() => {
    if (selReview) {
      setEditDraft({
        title:       selReview.title || '',
        brand:       selReview.brand || '',
        model:       selReview.model || '',
        caliber:     selReview.caliber || '',
        category:    selReview.category || 'Pistol',
        score:       selReview.score != null ? String(selReview.score) : '',
        verdict:     selReview.verdict || '',
        summary:     selReview.summary || '',
        body:        selReview.body || '',
        msrp:        selReview.msrp != null ? String(selReview.msrp) : '',
        imageUrl:    selReview.heroImage?.asset?.url || '',
        pros:        (selReview.pros || []).join('\n'),
        cons:        (selReview.cons || []).join('\n'),
        testRounds:  selReview.testRounds != null ? String(selReview.testRounds) : '',
        featured:    selReview.featured || false,
      })
      setEditView('edit')
    }
  }, [sel])

  async function patch(id, fields) {
    const res = await fetch('/api/admin/reviews-manager', {
      method: 'POST', headers: {...H,'Content-Type':'application/json'},
      body: JSON.stringify({ action:'patch', id, fields }),
    })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Saved') }
    else flash('❌ ' + d.error)
  }

  async function saveEditDraft() {
    if (!selReview) return
    setBusy(true)
    const fields = {
      title:      editDraft.title,
      brand:      editDraft.brand,
      model:      editDraft.model,
      caliber:    editDraft.caliber,
      category:   editDraft.category,
      score:      editDraft.score ? parseFloat(editDraft.score) : null,
      verdict:    editDraft.verdict,
      summary:    editDraft.summary,
      body:       editDraft.body,
      msrp:       editDraft.msrp ? parseFloat(editDraft.msrp) : null,
      pros:       editDraft.pros.split('\n').map(s=>s.trim()).filter(Boolean),
      cons:       editDraft.cons.split('\n').map(s=>s.trim()).filter(Boolean),
      testRounds: editDraft.testRounds ? parseInt(editDraft.testRounds) : null,
      featured:   editDraft.featured,
    }
    await patch(selReview._id, fields)
    setBusy(false)
  }

  async function aiWrite() {
    if (!selReview) return
    setBusy(true); flash('⏳ Claude is writing the review...')
    const res = await fetch('/api/admin/reviews-manager', {
      method:'POST', headers:{...H,'Content-Type':'application/json'},
      body: JSON.stringify({
        action:'ai-write', id:selReview._id,
        title:selReview.title, brand:selReview.brand, model:selReview.model,
        caliber:selReview.caliber, category:selReview.category, summary:selReview.summary,
      }),
    })
    const d = await res.json()
    if (d.ok) {
      setEditDraft(p => ({
        ...p,
        body:    d.body    || p.body,
        pros:    (d.pros   || []).join('\n') || p.pros,
        cons:    (d.cons   || []).join('\n') || p.cons,
        verdict: d.verdict || p.verdict,
        summary: d.summary || p.summary,
      }))
      await load()
      flash('✅ Written by Claude — review and save')
    } else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function del(id) {
    if (!confirm('Delete this review permanently?')) return
    setBusy(true)
    const res = await fetch('/api/admin/reviews-manager', {
      method:'POST', headers:{...H,'Content-Type':'application/json'},
      body: JSON.stringify({ action:'delete', id }),
    })
    const d = await res.json()
    if (d.ok) { setSel(null); await load(); flash('🗑 Deleted') }
    else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function create() {
    if (!form.title || !form.brand || !form.model) { flash('❌ Title, brand and model required'); return }
    setBusy(true)
    const res = await fetch('/api/admin/reviews-manager', {
      method:'POST', headers:{...H,'Content-Type':'application/json'},
      body: JSON.stringify({
        action:'create', title:form.title, brand:form.brand, model:form.model,
        caliber:form.caliber, category:form.category,
        score:form.score?parseFloat(form.score):null,
        verdict:form.verdict, summary:form.summary,
        body:form.articleBody, msrp:form.msrp?parseFloat(form.msrp):null,
        imageUrl:form.imageUrl,
        pros:form.pros.split('\n').map(s=>s.trim()).filter(Boolean),
        cons:form.cons.split('\n').map(s=>s.trim()).filter(Boolean),
      }),
    })
    const d = await res.json()
    if (d.ok) {
      setMode('list'); setForm({title:'',brand:'',model:'',caliber:'',category:'Pistol',score:'',verdict:'',summary:'',articleBody:'',msrp:'',imageUrl:'',pros:'',cons:''})
      await load(); flash('✅ Review created')
      if (d.review?._id) setSel(d.review._id)
    } else flash('❌ ' + d.error)
    setBusy(false)
  }

  const filtered = reviews.filter(r => {
    if (catFilter !== 'all' && r.category !== catFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (r.title||'').toLowerCase().includes(q) || (r.brand||'').toLowerCase().includes(q) || (r.model||'').toLowerCase().includes(q)
    }
    return true
  })

  // Build preview HTML
  const previewHtml = selReview ? `
    <html><head><style>
      body{font-family:Georgia,serif;max-width:700px;margin:32px auto;padding:0 20px;color:#111;line-height:1.8;font-size:16px}
      h1{font-size:2rem;margin-bottom:8px}h2{font-size:1.3rem;margin:24px 0 8px;color:#1a1a1a}
      .score{display:inline-block;width:64px;height:64px;border-radius:50%;background:${scoreColor(selReview.score)};color:#fff;font-size:1.8rem;font-weight:700;text-align:center;line-height:64px;margin-bottom:12px}
      .verdict{display:inline-block;padding:4px 14px;background:${VERDICT_C[selReview.verdict]||'#C8922A'}22;color:${VERDICT_C[selReview.verdict]||'#C8922A'};font-weight:700;border-radius:4px;margin-left:10px;font-size:14px}
      .meta{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;background:#f8f8f8;padding:16px;border-radius:8px;margin-bottom:24px}
      .meta-item label{font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;display:block}
      .meta-item span{font-weight:700;color:#111}
      .pros-cons{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0}
      .pros h3{color:#22c55e}.cons h3{color:#ef4444}
      ul{padding-left:20px}li{margin-bottom:4px}
      img{width:100%;max-height:360px;object-fit:cover;border-radius:8px;margin-bottom:24px}
    </style></head><body>
      ${selReview.heroImage?.asset?.url ? `<img src="${selReview.heroImage.asset.url}" alt="${selReview.title}">` : ''}
      <h1>${selReview.title || ''}</h1>
      <div>
        ${selReview.score != null ? `<span class="score">${selReview.score}</span>` : ''}
        ${selReview.verdict ? `<span class="verdict">${selReview.verdict}</span>` : ''}
      </div>
      <p style="color:#555;font-size:1.05rem;margin:12px 0 24px">${selReview.summary || ''}</p>
      <div class="meta">
        ${[['Brand',selReview.brand],['Model',selReview.model],['Caliber',selReview.caliber],['Category',selReview.category],['MSRP',selReview.msrp?`$${selReview.msrp}`:null],['Rounds Tested',selReview.testRounds]].filter(([,v])=>v).map(([l,v])=>`<div class="meta-item"><label>${l}</label><span>${v}</span></div>`).join('')}
      </div>
      <div class="pros-cons">
        <div class="pros"><h3>✓ Pros</h3><ul>${(selReview.pros||[]).map(p=>`<li>${p}</li>`).join('')}</ul></div>
        <div class="cons"><h3>✗ Cons</h3><ul>${(selReview.cons||[]).map(c=>`<li>${c}</li>`).join('')}</ul></div>
      </div>
      ${selReview.body || ''}
    </body></html>
  ` : ''

  return (
    <div>
      <style>{S}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'2rem',color:'var(--gold)',letterSpacing:'.06em',lineHeight:1}}>★ Review Manager</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginTop:3}}>
            {reviews.length} reviews · Field-tested, documented
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <a href="/reviews" target="_blank" rel="noreferrer" className="rv-ghost" style={{textDecoration:'none',fontSize:10}}>View Reviews ↗</a>
          <button className="rv-ghost" onClick={()=>{setMode(mode==='add'?'list':'add');setSel(null)}}>{mode==='add'?'← List':'+ New Review'}</button>
          <button className="rv-ghost" onClick={load}>↺ Refresh</button>
        </div>
      </div>

      {msg && (
        <div style={{padding:'9px 14px',marginBottom:12,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,
          color:msg.startsWith('✅')?'#22c55e':msg.startsWith('❌')?'#f87171':'#f59e0b',
          background:'var(--bg2)',border:'1px solid var(--border)'}}>
          {msg}
        </div>
      )}

      {/* Create form */}
      {mode === 'add' && (
        <div style={{background:'rgba(200,146,42,.05)',border:'1px solid rgba(200,146,42,.25)',padding:'20px 24px',marginBottom:20}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:'var(--gold)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:16}}>New Review</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            {[['Review Title *','title'],['Brand *','brand'],['Model *','model'],['Caliber','caliber'],['MSRP ($)','msrp'],['Image URL','imageUrl']].map(([l,k])=>(
              <div key={k} style={{gridColumn:k==='title'?'1/-1':undefined}}>
                <span className="rv-lbl">{l}</span>
                <input className="rv-input" value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} />
              </div>
            ))}
            <div>
              <span className="rv-lbl">Category</span>
              <select className="rv-input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <span className="rv-lbl">Score (0-10)</span>
              <input className="rv-input" type="number" min="0" max="10" step="0.1" value={form.score||''} onChange={e=>setForm(p=>({...p,score:e.target.value}))} />
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <span className="rv-lbl">Verdict</span>
              <select className="rv-input" value={form.verdict||''} onChange={e=>setForm(p=>({...p,verdict:e.target.value}))}>
                <option value="">— Select —</option>
                {VERDICTS.map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:12}}><span className="rv-lbl">Summary (2 sentences)</span><textarea className="rv-ta" rows={2} value={form.summary||''} onChange={e=>setForm(p=>({...p,summary:e.target.value}))} /></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div><span className="rv-lbl">Pros (one per line)</span><textarea className="rv-ta" rows={4} value={form.pros||''} onChange={e=>setForm(p=>({...p,pros:e.target.value}))} placeholder={"Reliable action\nExcellent trigger\nGreat value"} /></div>
            <div><span className="rv-lbl">Cons (one per line)</span><textarea className="rv-ta" rows={4} value={form.cons||''} onChange={e=>setForm(p=>({...p,cons:e.target.value}))} placeholder={"Grip texture rough\nNo optics cut"} /></div>
          </div>
          <div style={{marginBottom:16}}><span className="rv-lbl">Full Review Body (HTML)</span><textarea className="rv-ta" rows={8} value={form.articleBody||''} onChange={e=>setForm(p=>({...p,articleBody:e.target.value}))} placeholder="<p>Full review HTML...</p>" /></div>
          <div style={{display:'flex',gap:8}}><button className="rv-btn" onClick={create} disabled={busy}>Create Review</button><button className="rv-ghost" onClick={()=>setMode('list')}>Cancel</button></div>
        </div>
      )}

      {/* List + detail */}
      {mode === 'list' && (
        <>
          {/* Filters */}
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
            <input className="rv-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reviews..." style={{width:200}} />
            <select className="rv-input" value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{width:130}}>
              <option value="all">All Categories</option>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#4b5563',marginLeft:'auto'}}>{filtered.length} reviews</span>
          </div>

          <div style={{display:'grid',gridTemplateColumns:sel?'1fr 460px':'1fr',gap:0,border:'1px solid var(--border)',minHeight:400}}>
            {/* Table */}
            <div style={{overflowY:'auto',maxHeight:'calc(100vh - 300px)'}}>
              {/* Header */}
              <div style={{display:'grid',gridTemplateColumns:'70px 1fr 100px 60px 100px 36px',borderBottom:'2px solid var(--border)',background:'var(--bg)'}}>
                {['Score','Title / Firearm','Category','MSRP','Verdict',''].map((h,i)=>(
                  <div key={i} style={{padding:'8px 12px',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:700}}>{h}</div>
                ))}
              </div>
              {loading ? (
                <div style={{padding:40,textAlign:'center',color:'#4b5563',fontSize:12}}>Loading reviews...</div>
              ) : filtered.length === 0 ? (
                <div style={{padding:48,textAlign:'center'}}>
                  <div style={{fontSize:32,marginBottom:12}}>★</div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--text)',letterSpacing:'.05em',marginBottom:8}}>No Reviews Yet</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#4b5563',marginBottom:20,lineHeight:1.8}}>
                    Add a gun or gear review. Once added, use the 🤖 AI Write button to generate the full review body.
                  </div>
                  <button className="rv-btn" onClick={()=>setMode('add')} style={{background:'var(--gold)',color:'#000',border:'none',fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'.06em',padding:'8px 20px',cursor:'pointer'}}>
                    + Add First Review
                  </button>
                </div>
              ) : (<>
                <BulkLockBar checkedIds={bulkLock.checkedIds} bulkSaving={bulkLock.bulkSaving} onLock={()=>bulkLock.bulkSetLock(true,flash)} onUnlock={()=>bulkLock.bulkSetLock(false,flash)} onClear={bulkLock.clearChecked} />
                {filtered.map(r => (
                <div key={r._id} className={'rv-row'+(sel===r._id?' sel':'')+(bulkLock.checkedIds.has(r._id)?' checked':'')} onClick={()=>setSel(sel===r._id?null:r._id)}>
                  <RowCheckbox id={r._id} checkedIds={bulkLock.checkedIds} toggleCheck={bulkLock.toggleCheck} />
                  <div className="rv-cell" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div className="rv-score-ring" style={{background:scoreColor(r.score)+'22',color:scoreColor(r.score),border:`2px solid ${scoreColor(r.score)}`}}>
                      {r.score != null ? r.score : '—'}
                    </div>
                  </div>
                  <div className="rv-cell" style={{overflow:'visible',whiteSpace:'normal'}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--text)',marginBottom:1}}>{r.title}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#C8922A'}}>{r.brand} {r.model}</div>
                    {r.caliber && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563'}}>{r.caliber}</div>}
                  </div>
                  <div className="rv-cell">
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,padding:'2px 6px',background:(CAT_C[r.category]||'#374151')+'22',color:CAT_C[r.category]||'#9ca3af'}}>{r.category}</span>
                  </div>
                  <div className="rv-cell" style={{fontSize:11,color:'#C8922A',fontWeight:700}}>{r.msrp?`$${Number(r.msrp).toLocaleString()}`:'—'}</div>
                  <div className="rv-cell">
                    {r.verdict && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:VERDICT_C[r.verdict]||'#9ca3af',padding:'2px 5px',background:(VERDICT_C[r.verdict]||'#9ca3af')+'15'}}>{r.verdict}</span>}
                  </div>
                  <div className="rv-cell" style={{textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center'}}><LockToggle locked={r.editorLocked} onToggle={async()=>{ await patch(r._id,{editorLocked:!r.editorLocked}); setReviews(prev=>prev.map(x=>x._id===r._id?{...x,editorLocked:!x.editorLocked}:x)); flash(r.editorLocked?'🔓 Unlocked':'🔒 Locked') }} /></div>
                </div>
              ))}
            </div>

            {/* Detail / edit panel */}
            {selReview && (
              <div style={{borderLeft:'1px solid var(--border)',background:'var(--bg)',overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 300px)'}}>
                {/* Panel header */}
                <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg2)',flexShrink:0}}>
                  <div style={{display:'flex',gap:0,border:'1px solid var(--border)',overflow:'hidden'}}>
                    {['edit','preview'].map(v=>(
                      <button key={v} className="rv-tab-btn" onClick={()=>setEditView(v)} style={{borderBottom:`2px solid ${editView===v?'var(--gold)':'transparent'}`,color:editView===v?'var(--gold)':'var(--text-dim)'}}>
                        {v==='edit'?'✏ Edit':'👁 Preview'}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {editView==='edit' && <button className="rv-btn" style={{fontSize:10,padding:'5px 14px'}} onClick={saveEditDraft} disabled={busy}>💾 Save</button>}
                    <button className="rv-ghost" style={{fontSize:9}} onClick={()=>aiWrite()} disabled={busy}>🤖 AI Write</button>
                    <button className="rv-del" onClick={()=>del(selReview._id)} disabled={busy}>🗑</button>
                    <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:16}}>✕</button>
                  </div>
                </div>

                {/* Edit view */}
                {editView === 'edit' && (
                  <div style={{flex:1,overflowY:'auto',padding:14}}>

                    {/* Hero image */}
                    {(selReview.heroImage?.asset?.url || editDraft.imageUrl) && (
                      <img src={selReview.heroImage?.asset?.url || editDraft.imageUrl} alt=""
                        style={{width:'100%',height:120,objectFit:'cover',display:'block',background:'#111',marginBottom:6}}
                        onError={e=>{e.target.style.display='none'}} />
                    )}
                    <div style={{display:'flex',gap:6,marginBottom:10}}>
                      <button style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:11,letterSpacing:'.05em',padding:'5px 12px',background:'#3b82f6',color:'#fff',border:'none',cursor:busy?'default':'pointer',opacity:busy?.5:1}}
                        disabled={busy} onClick={async ()=>{
                          setBusy(true); flash('⏳ Fetching real image...')
                          try {
                            const res = await fetch('/api/admin/fetch-image', {
                              method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
                              body: JSON.stringify({ id:selReview._id, type:'review', title:`${selReview.brand} ${selReview.model}`, category:selReview.category })
                            })
                            const d = await res.json()
                            if (d.ok) { setEditDraft(p=>({...p,imageUrl:d.imageUrl})); flash(`✅ ${d.source==='og:image'?'OG image fetched':'Photo assigned'} — ${d.imageUrl.slice(0,50)}`) }
                            else flash('❌ ' + (d.error||'Error'))
                          } catch(e){ flash('❌ '+e.message) }
                          setBusy(false)
                        }}>🖼 Fetch Real Image</button>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                      {[['Title','title'],['Brand','brand'],['Model','model'],['Caliber','caliber']].map(([l,k])=>(
                        <div key={k} style={{gridColumn:k==='title'?'1/-1':undefined}}>
                          <span className="rv-lbl">{l}</span>
                          <input className="rv-input" value={editDraft[k]||''} onChange={e=>setEditDraft(p=>({...p,[k]:e.target.value}))} />
                        </div>
                      ))}
                      <div>
                        <span className="rv-lbl">Category</span>
                        <select className="rv-input" value={editDraft.category||'Pistol'} onChange={e=>setEditDraft(p=>({...p,category:e.target.value}))}>
                          {CATS.map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="rv-lbl">Score (0-10)</span>
                        <input className="rv-input" type="number" min="0" max="10" step="0.1" value={editDraft.score||''} onChange={e=>setEditDraft(p=>({...p,score:e.target.value}))} />
                      </div>
                      <div style={{gridColumn:'1/-1'}}>
                        <span className="rv-lbl">Verdict</span>
                        <select className="rv-input" value={editDraft.verdict||''} onChange={e=>setEditDraft(p=>({...p,verdict:e.target.value}))}>
                          <option value="">—</option>
                          {VERDICTS.map(v=><option key={v}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="rv-lbl">MSRP ($)</span>
                        <input className="rv-input" type="number" value={editDraft.msrp||''} onChange={e=>setEditDraft(p=>({...p,msrp:e.target.value}))} />
                      </div>
                      <div>
                        <span className="rv-lbl">Rounds Tested</span>
                        <input className="rv-input" type="number" value={editDraft.testRounds||''} onChange={e=>setEditDraft(p=>({...p,testRounds:e.target.value}))} />
                      </div>
                    </div>

                    <div style={{marginBottom:10}}>
                      <span className="rv-lbl">Summary</span>
                      <textarea className="rv-ta" rows={2} value={editDraft.summary||''} onChange={e=>setEditDraft(p=>({...p,summary:e.target.value}))} />
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                      <div>
                        <span className="rv-lbl">Pros (one per line)</span>
                        <textarea className="rv-ta" rows={5} value={editDraft.pros||''} onChange={e=>setEditDraft(p=>({...p,pros:e.target.value}))} />
                      </div>
                      <div>
                        <span className="rv-lbl">Cons (one per line)</span>
                        <textarea className="rv-ta" rows={5} value={editDraft.cons||''} onChange={e=>setEditDraft(p=>({...p,cons:e.target.value}))} />
                      </div>
                    </div>

                    <div style={{marginBottom:10}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                        <span className="rv-lbl" style={{margin:0}}>Full Review Body (HTML) {!editDraft.body&&<span style={{color:'#f59e0b'}}>(empty)</span>}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#475569'}}>{(editDraft.body||'').length} chars</span>
                      </div>
                      <textarea className="rv-ta" rows={12} value={editDraft.body||''} onChange={e=>setEditDraft(p=>({...p,body:e.target.value}))} placeholder="<p>Full review content...</p>" />
                    </div>

                    <div style={{marginBottom:10}}>
                      <span className="rv-lbl">Image URL</span>
                      <input className="rv-input" value={editDraft.imageUrl||''} onChange={e=>setEditDraft(p=>({...p,imageUrl:e.target.value}))} />
                    </div>

                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                      <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}>
                        <input type="checkbox" checked={!!editDraft.featured} onChange={e=>setEditDraft(p=>({...p,featured:e.target.checked}))} />
                        Featured review (shown on homepage)
                      </label>
                    </div>

                    <div className="rv-sep" />
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button className="rv-btn" onClick={saveEditDraft} disabled={busy} style={{flex:1}}>💾 Save All Changes</button>
                      <a href={`/reviews/${selReview.slug?.current||''}`} target="_blank" rel="noreferrer" className="rv-ghost" style={{textDecoration:'none',fontSize:10}}>View ↗</a>
                      <button className="rv-del" onClick={()=>del(selReview._id)} disabled={busy}>🗑 Delete</button>
                    </div>
                  </div>
                )}

                {/* Preview view */}
                {editView === 'preview' && (
                  <iframe srcDoc={previewHtml} style={{flex:1,width:'100%',border:'none',background:'#fff'}} title="Review Preview" />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
