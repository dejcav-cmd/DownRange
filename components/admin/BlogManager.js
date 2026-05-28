'use client'
import { useState, useEffect, useCallback } from 'react'

const BLOG_CATS = ['home-defense','safety','ammunition','beginner','maintenance','legal','carry','training','general','industry','gear','reviews']

const S = `
.bm-input{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;width:100%;box-sizing:border-box}
.bm-input:focus{border-color:var(--gold)}
.bm-ta{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px;outline:none;width:100%;resize:vertical;line-height:1.8;box-sizing:border-box}
.bm-ta:focus{border-color:var(--gold)}
.bm-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer;white-space:nowrap}
.bm-btn:hover{opacity:.85}
.bm-btn:disabled{opacity:.35;cursor:not-allowed}
.bm-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s;white-space:nowrap}
.bm-ghost:hover{border-color:var(--gold);color:var(--gold)}
.bm-pub{background:#22c55e;color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:7px 14px;cursor:pointer;white-space:nowrap}
.bm-del{background:none;border:1px solid rgba(239,68,68,.35);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.bm-del:hover{background:rgba(239,68,68,.1)}
.bm-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
.bm-sep{height:1px;background:var(--border);margin:12px 0}
.bm-tab{background:none;border:none;border-bottom:2px solid transparent;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 14px;cursor:pointer;color:var(--text-dim);transition:all .15s;white-space:nowrap}
.bm-tab.active{color:var(--gold);border-bottom-color:var(--gold)}
`

export default function BlogManager({ adminKey, setMsg: parentMsg }) {
  const [posts,    setPosts]   = useState([])
  const [loading,  setLoading] = useState(true)
  const [sel,      setSel]     = useState(null)
  const [busy,     setBusy]    = useState(false)
  const [msg,      setMsg]     = useState('')
  const [search,   setSearch]  = useState('')
  const [mode,     setMode]    = useState('list') // list | add
  const [editView, setEditView]= useState('edit') // edit | preview
  const [editDraft,setEditDraft]=useState({})
  const [addForm,  setAddForm] = useState({ title:'',category:'general',excerpt:'',articleBody:'',imageUrl:'',readTime:'',author:'' })

  const H = { 'x-admin-key': adminKey }
  const flash = m => {
    setMsg(m)
    if (parentMsg) parentMsg(m)
    setTimeout(()=>setMsg(''),5000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/blog-posts', { headers: H })
      const d = await r.json()
      if (d.ok) setPosts(d.posts || [])
      else flash('❌ ' + d.error)
    } catch(e) { flash('❌ ' + e.message) }
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  const selPost = posts.find(p => p._id === sel)

  useEffect(() => {
    if (selPost) {
      setEditDraft({
        title:    selPost.title || '',
        category: selPost.category || 'general',
        excerpt:  selPost.excerpt || '',
        body:     selPost.body || '',
        imageUrl: selPost.imageUrl || '',
        readTime: selPost.readTime || '',
        author:   selPost.author || '',
        status:   selPost.status || 'draft',
      })
      setEditView('edit')
    }
  }, [sel])

  async function patch(id, fields) {
    const res = await fetch('/api/admin/blog-posts', {
      method:'POST', headers:{...H,'Content-Type':'application/json'},
      body: JSON.stringify({ action:'patch', id, fields }),
    })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Saved') }
    else flash('❌ ' + d.error)
  }

  async function saveEditDraft() {
    if (!selPost) return
    setBusy(true)
    await patch(selPost._id, {
      title:    editDraft.title,
      category: editDraft.category,
      excerpt:  editDraft.excerpt,
      body:     editDraft.body,
      imageUrl: editDraft.imageUrl,
      readTime: editDraft.readTime,
      author:   editDraft.author,
    })
    setBusy(false)
  }

  async function togglePublish(post) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    await patch(post._id, { status: newStatus, publishedAt: newStatus==='published' ? new Date().toISOString() : null })
  }

  async function del(id) {
    if (!confirm('Delete this post permanently?')) return
    setBusy(true)
    const res = await fetch('/api/admin/blog-posts', {
      method:'POST', headers:{...H,'Content-Type':'application/json'},
      body: JSON.stringify({ action:'delete', id }),
    })
    const d = await res.json()
    if (d.ok) { setSel(null); await load(); flash('🗑 Deleted') }
    else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function aiWrite(id, title, category) {
    setBusy(true); flash('⏳ Claude is writing the article...')
    const res = await fetch('/api/admin/blog-posts', {
      method:'POST', headers:{...H,'Content-Type':'application/json'},
      body: JSON.stringify({ action:'ai-write', id, title, category }),
    })
    const d = await res.json()
    if (d.ok) {
      setEditDraft(p => ({
        ...p,
        body:    d.body    || p.body,
        excerpt: d.excerpt || p.excerpt,
        readTime:d.readTime || p.readTime,
      }))
      await load()
      flash('✅ Written by Claude — review and save')
    } else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function aiWriteAll() {
    setBusy(true)
    const missing = posts.filter(p => !p.body)
    flash(`⏳ Writing ${missing.length} articles with AI...`)
    try {
      const r = await fetch('/api/admin/write-blog-articles', { method:'POST', headers: H })
      const d = await r.json().catch(()=>({error:'Empty response'}))
      await load()
      flash(d.ok ? '✅ ' + (d.message || `${missing.length} articles written`) : '❌ ' + (d.error||'Error'))
    } catch(e) { flash('❌ ' + e.message) }
    setBusy(false)
  }

  async function createPost() {
    if (!addForm.title) { flash('❌ Title required'); return }
    setBusy(true)
    const res = await fetch('/api/admin/blog-posts', {
      method:'POST', headers:{...H,'Content-Type':'application/json'},
      body: JSON.stringify({ action:'create', ...addForm }),
    })
    const d = await res.json()
    if (d.ok) {
      setMode('list')
      setAddForm({ title:'',category:'general',excerpt:'',articleBody:'',imageUrl:'',readTime:'',author:'' })
      await load()
      flash('✅ Post created')
      if (d.post?._id) setSel(d.post._id)
    } else flash('❌ ' + d.error)
    setBusy(false)
  }

  const filtered = posts.filter(p => !search || (p.title||'').toLowerCase().includes(search.toLowerCase()))
  const missingBody = posts.filter(p => !p.body).length

  // Preview HTML
  const previewHtml = selPost ? `
    <html><head><style>
      body{font-family:Georgia,serif;max-width:720px;margin:32px auto;padding:0 20px;color:#111;line-height:1.8;font-size:16px}
      h1{font-size:2.2rem;margin-bottom:8px;line-height:1.2}
      h2{font-size:1.4rem;margin:28px 0 10px;color:#1a1a1a;border-bottom:2px solid #C8922A;padding-bottom:6px}
      h3{font-size:1.15rem;margin:20px 0 6px}
      .meta{font-size:13px;color:#666;margin-bottom:20px;display:flex;gap:16px;flex-wrap:wrap;border-bottom:1px solid #e5e7eb;padding-bottom:12px}
      .cat{background:#C8922A22;color:#C8922A;padding:2px 8px;border-radius:3px;font-weight:700;font-size:12px}
      img{width:100%;max-height:400px;object-fit:cover;border-radius:8px;margin-bottom:24px}
      p{margin:0 0 16px}ul,ol{padding-left:24px;margin-bottom:16px}li{margin-bottom:4px}
      strong{font-weight:700}
    </style></head><body>
      ${editDraft.imageUrl ? `<img src="${editDraft.imageUrl}" alt="">` : ''}
      <h1>${editDraft.title || selPost.title}</h1>
      <div class="meta">
        <span class="cat">${editDraft.category}</span>
        ${editDraft.readTime ? `<span>⏱ ${editDraft.readTime} read</span>` : ''}
        ${editDraft.author ? `<span>By ${editDraft.author}</span>` : ''}
      </div>
      ${editDraft.excerpt ? `<p style="font-size:1.1rem;color:#555;font-style:italic;margin-bottom:24px">${editDraft.excerpt}</p>` : ''}
      ${editDraft.body || '<p style="color:#999">No content yet. Write article or use AI Write.</p>'}
    </body></html>
  ` : ''

  return (
    <div>
      <style>{S}</style>

      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'2rem',color:'var(--gold)',letterSpacing:'.06em',lineHeight:1}}>✍ Blog Manager</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginTop:3}}>
            {posts.length} posts · {missingBody > 0 && <span style={{color:'#f59e0b'}}>{missingBody} missing body · </span>}drafts need approval before going live
          </div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <a href="/blog" target="_blank" rel="noreferrer" className="bm-ghost" style={{textDecoration:'none',fontSize:10}}>View Blog ↗</a>
          <button className="bm-btn" onClick={aiWriteAll} disabled={busy}>
            {posts.length === 0 ? '✦ Generate Blog Posts' : (missingBody > 0 ? `✦ AI Write All (${missingBody})` : '✦ Write More Posts')}
          </button>
          <button className="bm-ghost" onClick={()=>{setMode(mode==='add'?'list':'add');setSel(null)}}>{mode==='add'?'← List':'+ New Post'}</button>
          <button className="bm-ghost" onClick={load}>↺ Refresh</button>
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
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,fontWeight:700,color:'var(--gold)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:16}}>New Blog Post</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
            <div style={{gridColumn:'1/-1'}}><span className="bm-lbl">Title *</span><input className="bm-input" value={addForm.title||''} onChange={e=>setAddForm(p=>({...p,title:e.target.value}))} /></div>
            <div>
              <span className="bm-lbl">Category</span>
              <select className="bm-input" value={addForm.category||'general'} onChange={e=>setAddForm(p=>({...p,category:e.target.value}))}>
                {BLOG_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div><span className="bm-lbl">Read Time (e.g. "8 min")</span><input className="bm-input" value={addForm.readTime||''} onChange={e=>setAddForm(p=>({...p,readTime:e.target.value}))} placeholder="8 min" /></div>
            <div><span className="bm-lbl">Author</span><input className="bm-input" value={addForm.author||''} onChange={e=>setAddForm(p=>({...p,author:e.target.value}))} placeholder="DownRange Editorial" /></div>
            <div><span className="bm-lbl">Hero Image URL</span><input className="bm-input" value={addForm.imageUrl||''} onChange={e=>setAddForm(p=>({...p,imageUrl:e.target.value}))} placeholder="/img/photos/pistol.jpg" /></div>
          </div>
          <div style={{marginBottom:12}}><span className="bm-lbl">Excerpt (SEO summary)</span><textarea className="bm-ta" rows={2} value={addForm.excerpt||''} onChange={e=>setAddForm(p=>({...p,excerpt:e.target.value}))} /></div>
          <div style={{marginBottom:16}}><span className="bm-lbl">Article Body (HTML — leave blank to AI-write after creating)</span><textarea className="bm-ta" rows={8} value={addForm.articleBody||''} onChange={e=>setAddForm(p=>({...p,articleBody:e.target.value}))} placeholder="<p>...</p>" /></div>
          <div style={{display:'flex',gap:8}}><button className="bm-btn" onClick={createPost} disabled={busy}>Create Post</button><button className="bm-ghost" onClick={()=>setMode('list')}>Cancel</button></div>
        </div>
      )}

      {/* List + detail */}
      {mode === 'list' && (
        <>
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
            <input className="bm-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts..." style={{width:220}} />
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#4b5563',marginLeft:'auto'}}>{filtered.length} posts</span>
          </div>

          <div style={{display:'grid',gridTemplateColumns:sel?'1fr 480px':'1fr',gap:0,border:'1px solid var(--border)',minHeight:400}}>
            {/* Table */}
            <div style={{overflowY:'auto',maxHeight:'calc(100vh - 300px)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 110px 80px 70px 40px',borderBottom:'2px solid var(--border)',background:'var(--bg)'}}>
                {['Title','Category','Status','Date',''].map((h,i)=>(
                  <div key={i} style={{padding:'8px 12px',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase',fontWeight:700}}>{h}</div>
                ))}
              </div>
              {loading ? (
                <div style={{padding:40,textAlign:'center',color:'#4b5563',fontSize:12}}>Loading posts...</div>
              ) : filtered.length === 0 ? (
                <div style={{padding:40,textAlign:'center',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#4b5563'}}>
                  No posts yet. Click "+ New Post" or "AI Write All" to generate.
                </div>
              ) : filtered.map(p => (
                <div key={p._id} onClick={()=>setSel(sel===p._id?null:p._id)}
                  style={{display:'grid',gridTemplateColumns:'1fr 110px 80px 70px 40px',alignItems:'center',borderBottom:'1px solid var(--border)',cursor:'pointer',transition:'background .1s',
                    background:sel===p._id?'rgba(200,146,42,.08)':'transparent',borderLeft:sel===p._id?'2px solid var(--gold)':'2px solid transparent'}}>
                  <div style={{padding:'10px 12px',overflow:'hidden'}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</div>
                    <div style={{display:'flex',gap:6,marginTop:2,alignItems:'center'}}>
                      {p.slug?.current && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563'}}>/blog/{p.slug.current}</span>}
                      {!p.body && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'#f59e0b',padding:'1px 4px',background:'rgba(245,158,11,.1)'}}>NO BODY</span>}
                    </div>
                  </div>
                  <div style={{padding:'10px 12px'}}>
                    {p.category && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:'2px 6px',background:'rgba(200,146,42,.1)',color:'#C8922A'}}>{p.category}</span>}
                  </div>
                  <div style={{padding:'10px 12px'}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:p.status==='published'?'#22c55e':'#6b7280'}}>
                      {p.status==='published'?'● Live':'○ Draft'}
                    </span>
                  </div>
                  <div style={{padding:'10px 12px',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#4b5563'}}>
                    {p.publishedAt?.slice(0,10)||'—'}
                  </div>
                  <div style={{padding:'10px 12px',textAlign:'center',color:sel===p._id?'var(--gold)':'#374151'}}>›</div>
                </div>
              ))}
            </div>

            {/* Detail panel */}
            {selPost && (
              <div style={{borderLeft:'1px solid var(--border)',background:'var(--bg)',overflow:'hidden',display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 300px)'}}>
                {/* Panel header */}
                <div style={{padding:'10px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg2)',flexShrink:0}}>
                  <div style={{display:'flex',gap:0,border:'1px solid var(--border)',overflow:'hidden'}}>
                    {['edit','preview'].map(v=>(
                      <button key={v} className="bm-tab" style={{borderBottom:`2px solid ${editView===v?'var(--gold)':'transparent'}`,color:editView===v?'var(--gold)':'var(--text-dim)'}} onClick={()=>setEditView(v)}>
                        {v==='edit'?'✏ Edit':'👁 Preview'}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {editView==='edit' && <button className="bm-btn" style={{fontSize:10,padding:'5px 14px'}} onClick={saveEditDraft} disabled={busy}>💾 Save</button>}
                    <button className="bm-ghost" style={{fontSize:9}} onClick={()=>aiWrite(selPost._id, editDraft.title, editDraft.category)} disabled={busy}>🤖 AI Write</button>
                    <button className="bm-pub" style={{background:selPost.status==='published'?'#374151':'#22c55e',fontSize:10}} onClick={()=>togglePublish(selPost)} disabled={busy}>
                      {selPost.status==='published'?'Unpublish':'Publish'}
                    </button>
                    <button className="bm-del" onClick={()=>del(selPost._id)} disabled={busy}>🗑</button>
                    <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:16}}>✕</button>
                  </div>
                </div>

                {/* Edit view */}
                {editView==='edit' && (
                  <div style={{flex:1,overflowY:'auto',padding:14}}>
                    {editDraft.imageUrl && (
                      <img src={editDraft.imageUrl} alt="" style={{width:'100%',height:100,objectFit:'cover',display:'block',background:'#111',marginBottom:6}} onError={e=>{e.target.style.display='none'}} />
                    )}
                    <div style={{display:'flex',gap:6,marginBottom:10}}>
                      <button style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:11,letterSpacing:'.05em',padding:'5px 12px',background:'#3b82f6',color:'#fff',border:'none',cursor:'pointer'}}
                        disabled={busy} onClick={async ()=>{
                          setBusy(true); flash('⏳ Fetching real image...')
                          try {
                            const res = await fetch('/api/admin/fetch-image', {
                              method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
                              body: JSON.stringify({ id:editDraft._id, type:'blogPost', title:editDraft.title, category:editDraft.category||'general' })
                            })
                            const d = await res.json()
                            if (d.ok) {
                              setEditDraft(p=>({...p,imageUrl:d.imageUrl}))
                              setPosts(prev => prev.map(p => p._id === editDraft._id ? { ...p, imageUrl: d.imageUrl } : p))
                              flash(`✅ ${d.source==='og:image'?'OG image fetched':'Photo assigned'} — saved`)
                            } else flash('❌ ' + (d.error||'Error'))
                          } catch(e){ flash('❌ '+e.message) }
                          setBusy(false)
                        }}>🖼 Fetch Real Image</button>
                    </div>

                    <div style={{marginBottom:10}}>
                      <span className="bm-lbl">Title</span>
                      <input className="bm-input" value={editDraft.title||''} onChange={e=>setEditDraft(p=>({...p,title:e.target.value}))} />
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                      <div>
                        <span className="bm-lbl">Category</span>
                        <select className="bm-input" value={editDraft.category||'general'} onChange={e=>setEditDraft(p=>({...p,category:e.target.value}))}>
                          {BLOG_CATS.map(c=><option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="bm-lbl">Read Time</span>
                        <input className="bm-input" value={editDraft.readTime||''} onChange={e=>setEditDraft(p=>({...p,readTime:e.target.value}))} placeholder="8 min" />
                      </div>
                      <div>
                        <span className="bm-lbl">Author</span>
                        <input className="bm-input" value={editDraft.author||''} onChange={e=>setEditDraft(p=>({...p,author:e.target.value}))} />
                      </div>
                      <div>
                        <span className="bm-lbl">Image URL</span>
                        <input className="bm-input" value={editDraft.imageUrl||''} onChange={e=>setEditDraft(p=>({...p,imageUrl:e.target.value}))} />
                      </div>
                    </div>

                    <div style={{marginBottom:10}}>
                      <span className="bm-lbl">Excerpt</span>
                      <textarea className="bm-ta" rows={2} value={editDraft.excerpt||''} onChange={e=>setEditDraft(p=>({...p,excerpt:e.target.value}))} />
                    </div>

                    <div style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                        <span className="bm-lbl" style={{margin:0}}>Article Body (HTML) {!editDraft.body&&<span style={{color:'#f59e0b'}}>(empty)</span>}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#475569'}}>{(editDraft.body||'').length} chars</span>
                      </div>
                      <textarea className="bm-ta" rows={16} value={editDraft.body||''} onChange={e=>setEditDraft(p=>({...p,body:e.target.value}))} placeholder="<p>Article content here...</p>" />
                    </div>

                    <div className="bm-sep" />
                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button className="bm-btn" onClick={saveEditDraft} disabled={busy} style={{flex:1}}>💾 Save All Changes</button>
                      {selPost.slug?.current && <a href={`/blog/${selPost.slug.current}`} target="_blank" rel="noreferrer" className="bm-ghost" style={{textDecoration:'none',fontSize:10}}>View ↗</a>}
                      <button className="bm-del" onClick={()=>del(selPost._id)} disabled={busy}>🗑 Delete</button>
                    </div>
                  </div>
                )}

                {/* Preview view */}
                {editView==='preview' && (
                  <iframe srcDoc={previewHtml} style={{flex:1,width:'100%',border:'none',background:'#fff'}} title="Post Preview" />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
