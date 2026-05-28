'use client'
import { useState, useEffect, useCallback } from 'react'
import ImageSearchModal from './ImageSearchModal'
import { useBulkLock, BulkLockBar, RowCheckbox, HeaderCheckbox, LockToggle } from './BulkLockBar'

const S = `
.rm-wrap{font-family:'IBM Plex Mono',monospace}
.rm-row{display:grid;grid-template-columns:36px 90px 1fr 120px 80px 80px 30px;align-items:center;border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s}
.rm-row:hover{background:rgba(200,146,42,.04)}
.rm-row.sel{background:rgba(200,146,42,.08);border-left:2px solid var(--gold)}
.rm-row.checked{background:rgba(200,146,42,.05)}
.rm-img{width:90px;height:56px;object-fit:cover;display:block;background:#111}
.rm-cell{padding:10px 12px;font-size:11px;color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rm-title{font-size:12px;font-weight:600;color:var(--text);white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3}
.rm-input{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;width:100%}
.rm-input:focus{border-color:var(--gold)}
.rm-textarea{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px;outline:none;width:100%;resize:vertical;line-height:1.7}
.rm-textarea:focus{border-color:var(--gold)}
.rm-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer;white-space:nowrap}
.rm-btn:hover{opacity:.85}
.rm-btn:disabled{opacity:.35;cursor:not-allowed}
.rm-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s;white-space:nowrap}
.rm-ghost:hover{border-color:var(--gold);color:var(--gold)}
.rm-del{background:none;border:1px solid rgba(239,68,68,.35);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.rm-del:hover{background:rgba(239,68,68,.1)}
.rm-pub{background:#22c55e;color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer}
.rm-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
.rm-sep{height:1px;background:var(--border);margin:12px 0}
`

const CAT_C = {Pistol:'#C8922A',Rifle:'#22c55e',Shotgun:'#f59e0b',Revolver:'#a855f7',Suppressor:'#3b82f6',Optic:'#34d399',Accessory:'#9ca3af',Ammo:'#f97316'}
const CATS = ['Pistol','Rifle','Shotgun','Revolver','Suppressor','Optic','Accessory','Ammo']

function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') }

export default function ReleaseManager({ adminKey }) {
  const [releases, setReleases] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [sel,      setSel]      = useState(null)
  const [busy,     setBusy]     = useState(false)
  const [msg,      setMsg]      = useState('')
  const bulkLock = useBulkLock({ items:releases, setItems:setReleases, patchFn:(id,fields)=>patch(id,fields) })
  const [search,   setSearch]   = useState('')
  const [tab,      setTab]      = useState('list')  // list | add
  const [form,     setForm]     = useState({ brand:'',model:'',category:'Pistol',caliber:'',action:'',msrp:'',sourceUrl:'',imageUrl:'',summary:'',body:'' })
  const [feedRunning, setFeedRunning] = useState(false)

  const [imgSearch, setImgSearch] = useState(null) // { item } | null

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 5000) }

  async function seedReleases() {
    setBusy(true)
    flash('⏳ Seeding gun releases with AI-written articles...')
    try {
      const res = await fetch('/api/admin/seed-releases', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey }
      })
      const d = await res.json()
      if (d.ok) { flash(`✅ Seeded ${d.created} releases`); await load() }
      else flash('❌ ' + (d.error || 'Seed failed'))
    } catch(e) { flash('❌ ' + e.message) }
    setBusy(false)
  }

  async function runFeed() {
    setFeedRunning(true)
    flash('⏳ Running releases feed — pulling PRNewswire + manufacturer RSS...')
    try {
      const res = await fetch('/api/admin/cron-status?trigger=true', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: 'releases' }),
      })
      const d = await res.json()
      if (d.ok) { flash('✅ Releases feed ran — refreshing...'); await load() }
      else flash('❌ ' + (d.error || d.response || 'Feed failed'))
    } catch(e) { flash('❌ ' + e.message) }
    setFeedRunning(false)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/releases-manager', { headers:{'x-admin-key':adminKey} })
      const d = await res.json()
      if (d.ok) setReleases(d.releases||[])
      else flash('❌ '+d.error)
    } catch(e){ flash('❌ '+e.message) }
    setLoading(false)
  }, [adminKey])

  useEffect(()=>{ load() }, [load])

  const selRelease = releases.find(r=>r._id===sel)

  async function saveReleaseImage() {
    const inp = document.querySelector('.rm-img-input')
    if (inp && inp.value && selRelease) {
      await patch(selRelease._id, { imageUrl: inp.value })
      flash('💾 Image saved')
    }
  }

  async function patch(id, fields) {
    const res = await fetch('/api/admin/releases-manager',{
      method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body: JSON.stringify({action:'patch',id,fields}),
    })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Saved') }
    else flash('❌ '+d.error)
  }

  async function aiRewrite(release) {
    setBusy(true); flash('⏳ Claude is writing a full article...')
    const res = await fetch('/api/admin/releases-manager',{
      method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body: JSON.stringify({action:'ai-rewrite',id:release._id,brand:release.brand,model:release.model,category:release.category,caliber:release.caliber,msrp:release.msrp,summary:release.summary,sourceUrl:release.sourceUrl,specs:release.specs}),
    })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Article written by Claude') }
    else flash('❌ '+d.error)
    setBusy(false)
  }

  async function rewriteAll() {
    setBusy(true)
    const missing = releases.filter(r=>!r.body)
    flash('⏳ Writing '+missing.length+' articles...')
    for (const r of missing) {
      await fetch('/api/admin/releases-manager',{
        method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
        body: JSON.stringify({action:'ai-rewrite',id:r._id,brand:r.brand,model:r.model,category:r.category,caliber:r.caliber,msrp:r.msrp,summary:r.summary,sourceUrl:r.sourceUrl,specs:r.specs}),
      })
    }
    await load()
    flash('✅ All '+missing.length+' articles written')
    setBusy(false)
  }

  async function deleteRelease(r) {
    if (!confirm('Delete '+r.brand+' '+r.model+'?')) return
    setBusy(true)
    const res = await fetch('/api/admin/releases-manager',{
      method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body: JSON.stringify({action:'delete',id:r._id}),
    })
    const d = await res.json()
    if (d.ok) { setSel(null); await load(); flash('🗑 Deleted') }
    else flash('❌ '+d.error)
    setBusy(false)
  }

  async function addRelease() {
    if (!form.brand||!form.model) { flash('❌ Brand and Model required'); return }
    setBusy(true)
    const res = await fetch('/api/admin/releases-manager',{
      method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
      body: JSON.stringify({action:'create', ...form,
        slug: slugify(form.brand+'-'+form.model),
        msrp: form.msrp ? parseFloat(form.msrp) : null,
      }),
    })
    const d = await res.json()
    if (d.ok) { setTab('list'); setForm({brand:'',model:'',category:'Pistol',caliber:'',action:'',msrp:'',sourceUrl:'',imageUrl:'',summary:'',body:''}); await load(); flash('✅ Release added') }
    else flash('❌ '+d.error)
    setBusy(false)
  }

  const filtered = releases.filter(r => !search || (r.brand+' '+r.model).toLowerCase().includes(search.toLowerCase()))
  const missingBody = releases.filter(r=>!r.body).length

  return (
    <div className="rm-wrap">
      <style>{S}</style>

      {/* ── HEADER ── */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'2rem',color:'var(--gold)',letterSpacing:'.06em',lineHeight:1}}>◈ Release Manager</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginTop:3}}>
            {releases.length} releases · <span style={{color:missingBody>0?'#f59e0b':'#22c55e'}}>{missingBody} missing article body</span>
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {missingBody > 0 && <button className="rm-btn" onClick={rewriteAll} disabled={busy}>✦ Write All {missingBody} Articles</button>}
          <button className="rm-btn" onClick={seedReleases} disabled={busy || feedRunning} style={{background:'var(--gold)',color:'#000'}}>
            📥 Seed Releases
          </button>
          <button className="rm-btn" onClick={runFeed} disabled={feedRunning || busy} style={{background:'#3b82f6',color:'#fff'}}>
            {feedRunning ? '⏳ Running...' : '▶ Run Releases Feed'}
          </button>
          <button className="rm-ghost" onClick={()=>setTab(tab==='add'?'list':'add')}>{tab==='add'?'← Back':'+ Add Release'}</button>
          <button className="rm-ghost" onClick={load}>↺ Refresh</button>
        </div>
      </div>

      {msg && <div style={{padding:'9px 14px',marginBottom:12,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:msg.startsWith('✅')?'#22c55e':msg.startsWith('❌')?'#f87171':'#f59e0b',background:'var(--bg2)',border:'1px solid var(--border)'}}>{msg}</div>}

      {/* ── ADD FORM ── */}
      {tab === 'add' && (
        <div style={{background:'rgba(200,146,42,.05)',border:'1px solid rgba(200,146,42,.25)',padding:'20px 24px',marginBottom:20}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:'var(--gold)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:16}}>New Firearm Release</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            {[['Brand','brand'],['Model','model'],['Caliber','caliber'],['Action Type','action'],['MSRP ($)','msrp'],['Available Date','availableDate']].map(([l,k])=>(
              <div key={k}><span className="rm-lbl">{l}</span><input className="rm-input" value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} /></div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'140px 1fr',gap:12,marginBottom:12}}>
            <div><span className="rm-lbl">Category</span>
              <select className="rm-input" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><span className="rm-lbl">Manufacturer Source URL</span><input className="rm-input" value={form.sourceUrl||''} onChange={e=>setForm(p=>({...p,sourceUrl:e.target.value}))} placeholder="https://..." /></div>
          </div>
          <div style={{marginBottom:12}}><span className="rm-lbl">Image URL</span><input className="rm-input" value={form.imageUrl||''} onChange={e=>setForm(p=>({...p,imageUrl:e.target.value}))} placeholder="https://..." /></div>
          <div style={{marginBottom:16}}><span className="rm-lbl">Summary (1-2 sentences)</span><textarea className="rm-textarea" rows={3} value={form.summary||''} onChange={e=>setForm(p=>({...p,summary:e.target.value}))} /></div>
          <button className="rm-btn" onClick={addRelease} disabled={busy}>Add Release</button>
        </div>
      )}

      {/* ── LIST + DETAIL ── */}
      {tab === 'list' && (
        <div>
          <div style={{marginBottom:10,display:'flex',gap:8}}>
            <input className="rm-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search brand or model..." style={{width:240}} />
          </div>

          <div style={{display:'grid',gridTemplateColumns:sel?'1fr 420px':'1fr',gap:0,border:'1px solid var(--border)',minHeight:400}}>
            {/* Table */}
            <div style={{overflowY:'auto',maxHeight:'calc(100vh - 300px)'}}>
              {/* Header */}
              <div style={{display:'grid',gridTemplateColumns:'90px 1fr 120px 80px 80px 44px',background:'var(--bg)',borderBottom:'2px solid var(--border)'}}>
                {['Image','Brand / Model','Category','MSRP','Status',''].map((h,i)=>(
                  <div key={i} style={{padding:'8px 12px',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:700}}>{h}</div>
                ))}
              </div>

              {loading ? (
                <div style={{padding:40,textAlign:'center',color:'#4b5563',fontSize:12}}>Loading releases...</div>
              ) : filtered.length === 0 ? (
                <div style={{padding:48,textAlign:'center'}}>
                  <div style={{fontSize:32,marginBottom:12}}>🔫</div>
                  <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.4rem',color:'var(--text)',letterSpacing:'.05em',marginBottom:8}}>No Gun Releases Yet</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#4b5563',marginBottom:20,lineHeight:1.8}}>
                    Seed 10 curated releases with AI-written articles, or run the live feed to pull from manufacturer RSS.
                  </div>
                  <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
                    <button className="rm-btn" onClick={seedReleases} disabled={busy} style={{background:'var(--gold)',color:'#000'}}>
                      📥 Seed Releases (10 guns)
                    </button>
                    <button className="rm-btn" onClick={runFeed} disabled={feedRunning} style={{background:'#3b82f6',color:'#fff'}}>
                      {feedRunning ? '⏳ Running...' : '▶ Run Live Feed'}
                    </button>
                    <button className="rm-ghost" onClick={()=>setTab('add')}>+ Add Manually</button>
                  </div>
                </div>
              ) : (<>
                <BulkLockBar checkedIds={bulkLock.checkedIds} bulkSaving={bulkLock.bulkSaving} onLock={()=>bulkLock.bulkSetLock(true,flash)} onUnlock={()=>bulkLock.bulkSetLock(false,flash)} onClear={bulkLock.clearChecked} />
                <div style={{display:'grid',gridTemplateColumns:'36px 90px 1fr 120px 80px 80px 30px',borderBottom:'2px solid var(--border)',background:'var(--bg)',position:'sticky',top:0,zIndex:5}}>
                  <HeaderCheckbox visibleItems={filtered} isAllChecked={bulkLock.isAllChecked} isIndeterminate={bulkLock.isIndeterminate} toggleCheckAll={bulkLock.toggleCheckAll} />
                  {['Image','Gun','Category','Cal.','Status',''].map((h,i)=>(
                    <div key={i} style={{padding:'7px 10px',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:700}}>{h}</div>
                  ))}
                </div>
                {filtered.map(r => (
                <div key={r._id} className={'rm-row'+(sel===r._id?' sel':'')+(bulkLock.checkedIds.has(r._id)?' checked':'')} onClick={()=>setSel(sel===r._id?null:r._id)}><RowCheckbox id={r._id} checkedIds={bulkLock.checkedIds} toggleCheck={bulkLock.toggleCheck} />
                  <div style={{position:'relative',width:90,height:56,flexShrink:0}}>
                    {r.imageUrl
                      ? <img src={r.imageUrl} alt="" className="rm-img" onError={e=>{e.target.style.display='none'}} />
                      : <div style={{width:90,height:56,background:'#111',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#374151'}}>◈</div>
                    }
                    {!r.body && <div style={{position:'absolute',top:2,right:2,width:8,height:8,borderRadius:'50%',background:'#f59e0b'}} title="No article body" />}
                  </div>
                  <div className="rm-cell" style={{overflow:'visible',whiteSpace:'normal'}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#C8922A',marginBottom:2}}>{r.brand}</div>
                    <div className="rm-title">{r.model||r.title}</div>
                    {r.caliber && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginTop:1}}>{r.caliber}</div>}
                  </div>
                  <div className="rm-cell">
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,padding:'2px 7px',background:(CAT_C[r.category]||'#374151')+'22',color:CAT_C[r.category]||'#9ca3af',textTransform:'uppercase',letterSpacing:'.06em'}}>
                      {r.category}
                    </span>
                  </div>
                  <div className="rm-cell" style={{fontSize:12,fontWeight:700,color:'#C8922A'}}>{r.msrp?'$'+Number(r.msrp).toLocaleString():'—'}</div>
                  <div className="rm-cell">
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,padding:'2px 7px',background:r.approved?'rgba(34,197,94,.15)':'rgba(100,116,139,.15)',color:r.approved?'#22c55e':'#64748b'}}>
                      {r.approved?'live':'draft'}
                    </span>
                  </div>
                  <div className="rm-cell" style={{textAlign:'center',color:sel===r._id?'var(--gold)':'#374151'}}>›</div>
                </div>
              ))}
            </>)}
            </div>

            {/* Detail Panel */}
            {selRelease && (
              <div style={{borderLeft:'1px solid var(--border)',background:'var(--bg)',overflowY:'auto',maxHeight:'calc(100vh - 300px)'}}>
                <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg2)'}}>
                  <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--gold)',letterSpacing:'.04em',textTransform:'uppercase'}}>Edit Release</span>
                  <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:16}}>✕</button>
                </div>

                <div style={{padding:16}}>
                  {/* Image */}
                  <span className="rm-lbl">Image</span>
                  <div style={{marginBottom:8,position:'relative'}}>
                    <img src={selRelease.imageUrl||''} alt="" style={{width:'100%',height:140,objectFit:'cover',background:'#111',display:'block'}}
                      onError={e=>{e.target.style.background='#1a0000'}} />
                  </div>
                  <div style={{display:'flex',gap:6,marginBottom:8,flexWrap:'wrap'}}>
                    <button className="rm-btn" style={{fontSize:10,padding:'6px 12px',background:'#3b82f6',color:'#fff',border:'none'}}
                      disabled={busy} onClick={async ()=>{
                        setBusy(true); flash('⏳ Fetching real image...')
                        try {
                          const res = await fetch('/api/admin/fetch-image', {
                            method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
                            body: JSON.stringify({ id:selRelease._id, type:'firearmRelease', title:`${selRelease.brand} ${selRelease.model}`, category:selRelease.category, sourceUrl:selRelease.sourceUrl||'' })
                          })
                          const d = await res.json()
                          if (d.ok) {
                            setReleases(prev => prev.map(r => r._id === selRelease._id ? { ...r, imageUrl: d.imageUrl } : r))
                            flash(`✅ ${d.source==='og:image'?'OG image fetched':'Photo assigned'} — saved`)
                          } else flash('❌ ' + (d.error||'Error'))
                        } catch(e){ flash('❌ '+e.message) }
                        setBusy(false)
                      }}>🖼 Fetch Real Image</button>
                    <button className="rm-ghost" style={{fontSize:9}} onClick={()=>{
                      const url=prompt('Image URL:'); if(url) patch(selRelease._id,{imageUrl:url})
                    }}>✎ Paste URL</button>
                    <button className="rm-ghost" style={{fontSize:9,background:'#8b5cf6',color:'#fff',border:'none'}} onClick={()=>setImgSearch(selRelease)}>🔍 Search Images</button>
                    <button className="rm-ghost" disabled={busy}
                      style={{fontSize:9,background:'var(--gold)',color:'#000',border:'none'}}
                      onClick={saveReleaseImage}>
                      💾 Save Image
                    </button>
                  </div>
                  <input className="rm-input rm-img-input" defaultValue={selRelease.imageUrl||''} style={{marginBottom:12,fontSize:10}}
                    onBlur={e=>{ if(e.target.value!==selRelease.imageUrl) patch(selRelease._id,{imageUrl:e.target.value}) }} />

                  <div className="rm-sep" />

                  {/* Core fields */}
                  {[['Brand','brand'],['Model','model'],['Caliber','caliber'],['Action','action'],['MSRP ($)','msrp']].map(([l,k])=>(
                    <div key={k} style={{marginBottom:10}}>
                      <span className="rm-lbl">{l}</span>
                      <input className="rm-input" defaultValue={selRelease[k]||''} onBlur={e=>{if(String(e.target.value)!==String(selRelease[k]||'')) patch(selRelease._id,{[k]: k==='msrp'?parseFloat(e.target.value)||null : e.target.value})}} />
                    </div>
                  ))}

                  <div style={{marginBottom:10}}>
                    <span className="rm-lbl">Category</span>
                    <select className="rm-input" defaultValue={selRelease.category||'Pistol'} onBlur={e=>patch(selRelease._id,{category:e.target.value})}>
                      {CATS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>

                  <div style={{marginBottom:10}}>
                    <span className="rm-lbl">Manufacturer Source URL</span>
                    <input className="rm-input" defaultValue={selRelease.sourceUrl||''} onBlur={e=>{if(e.target.value!==selRelease.sourceUrl) patch(selRelease._id,{sourceUrl:e.target.value})}} placeholder="https://..." />
                  </div>

                  <div style={{marginBottom:10}}>
                    <span className="rm-lbl">Summary</span>
                    <textarea className="rm-textarea" rows={3} defaultValue={selRelease.summary||''} onBlur={e=>{if(e.target.value!==selRelease.summary) patch(selRelease._id,{summary:e.target.value})}} />
                  </div>

                  <div style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span className="rm-lbl" style={{margin:0}}>Article Body {!selRelease.body&&<span style={{color:'#f59e0b'}}>(missing)</span>}</span>
                      <button className="rm-ghost" style={{fontSize:9,padding:'3px 8px'}} onClick={()=>aiRewrite(selRelease)} disabled={busy}>🤖 AI Write</button>
                    </div>
                    <textarea className="rm-textarea" rows={10} defaultValue={selRelease.body||''} onBlur={e=>{if(e.target.value!==selRelease.body) patch(selRelease._id,{body:e.target.value})}} placeholder="Full article HTML..." />
                  </div>

                  <div className="rm-sep" />

                  {/* Actions */}
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    <button className="rm-pub" onClick={()=>patch(selRelease._id,{approved:!selRelease.approved})} disabled={busy} style={{flex:1,background:selRelease.approved?'#374151':'#22c55e'}}>
                      {selRelease.approved?'⏸ Unpublish':'▶ Publish'}
                    </button>
                    <a href={'/releases/'+(selRelease.slug?.current||'')} target="_blank" rel="noreferrer"
                      style={{display:'flex',alignItems:'center',padding:'8px 14px',border:'1px solid var(--border)',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',textDecoration:'none'}}>
                      View ↗
                    </a>
                    {selRelease.sourceUrl && (
                      <a href={selRelease.sourceUrl} target="_blank" rel="noreferrer"
                        style={{display:'flex',alignItems:'center',padding:'8px 14px',border:'1px solid rgba(200,146,42,.4)',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',textDecoration:'none'}}>
                        Source ↗
                      </a>
                    )}
                    <button className="rm-del" onClick={()=>deleteRelease(selRelease)} disabled={busy}>🗑</button>
                  </div>
                  {/* Lock flag */}
                  <div style={{marginTop:10,padding:'10px 14px',background:selRelease.editorLocked?'rgba(200,146,42,.08)':'rgba(100,116,139,.06)',border:`2px solid ${selRelease.editorLocked?'#C8922A':'var(--border)'}`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                      <div>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:selRelease.editorLocked?'#C8922A':'#6b7280'}}>{selRelease.editorLocked?'🔒 LOCKED — AI cannot modify':'🔓 UNLOCKED — AI may update'}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginTop:1}}>Lock to freeze this release. No cron or AI changes.</div>
                      </div>
                      <button onClick={async()=>{
                        const v=!selRelease.editorLocked
                        await patch(selRelease._id,{editorLocked:v})
                        setReleases(prev=>prev.map(r=>r._id===selRelease._id?{...r,editorLocked:v}:r))
                        flash(v?'🔒 Release locked':'🔓 Release unlocked')
                      }} disabled={busy} style={{fontFamily:"'Bebas Neue',cursive",fontSize:'0.85rem',letterSpacing:'.06em',padding:'6px 14px',border:'none',cursor:'pointer',background:selRelease.editorLocked?'#C8922A':'#374151',color:selRelease.editorLocked?'#000':'#9ca3af',whiteSpace:'nowrap'}}>
                        {selRelease.editorLocked?'🔓 Unlock':'🔒 Lock'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    {/* ── Image Search Modal ── */}
    {imgSearch && (
      <ImageSearchModal
        adminKey={adminKey}
        item={imgSearch}
        onApply={(imageUrl) => {
          setReleases(prev => prev.map(r => r._id === imgSearch._id ? { ...r, imageUrl } : r))
          setImgSearch(null)
        }}
        onClose={() => setImgSearch(null)}
      />
    )}
    </div>
  )
}
