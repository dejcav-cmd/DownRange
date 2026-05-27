'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const S = `
.nam-wrap { font-family:'IBM Plex Mono',monospace; }
.nam-row { display:grid; grid-template-columns:80px 1fr 130px 100px 90px 44px; gap:0; align-items:center; border-bottom:1px solid var(--border); transition:background .1s; cursor:pointer; }
.nam-row:hover { background:rgba(200,146,42,.04); }
.nam-row.selected { background:rgba(200,146,42,.08); border-left:2px solid var(--gold); }
.nam-cell { padding:10px 12px; font-size:11px; color:var(--text-dim); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.nam-img { width:80px; height:50px; object-fit:cover; display:block; background:#111; }
.nam-title { font-size:12px; font-weight:600; color:var(--text); white-space:normal; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height:1.3; }
.nam-badge { display:inline-block; font-size:9px; font-weight:700; padding:2px 7px; border-radius:2px; text-transform:uppercase; letter-spacing:.06em; }
.nam-input { background:var(--bg3); border:1px solid var(--border); color:var(--text); font-family:'IBM Plex Mono',monospace; font-size:11px; padding:8px 10px; outline:none; width:100%; }
.nam-input:focus { border-color:var(--gold); }
.nam-textarea { background:var(--bg3); border:1px solid var(--border); color:var(--text); font-family:'IBM Plex Mono',monospace; font-size:11px; padding:10px; outline:none; width:100%; resize:vertical; line-height:1.7; }
.nam-textarea:focus { border-color:var(--gold); }
.nam-btn { background:var(--gold); color:#000; border:none; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:8px 16px; cursor:pointer; white-space:nowrap; }
.nam-btn:hover { opacity:.85; }
.nam-btn:disabled { opacity:.35; cursor:not-allowed; }
.nam-btn-sm { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:'IBM Plex Mono',monospace; font-size:10px; padding:5px 10px; cursor:pointer; white-space:nowrap; transition:all .15s; }
.nam-btn-sm:hover { border-color:var(--gold); color:var(--gold); }
.nam-btn-del { background:none; border:1px solid rgba(239,68,68,.35); color:#ef4444; font-family:'IBM Plex Mono',monospace; font-size:10px; padding:5px 10px; cursor:pointer; }
.nam-btn-del:hover { background:rgba(239,68,68,.1); }
.nam-btn-pub { background:#22c55e; color:#000; border:none; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:8px 16px; cursor:pointer; }
.nam-panel { border-left:1px solid var(--border); background:var(--bg); overflow-y:auto; }
.nam-sep { height:1px; background:var(--border); margin:12px 0; }
.nam-lbl { font-size:9px; color:#64748b; letter-spacing:.1em; text-transform:uppercase; margin-bottom:4px; display:block; }
`

const CAT_C = { breaking:'#ef4444', law:'#3b82f6', industry:'#C8922A', news:'#9ca3af', deals:'#22c55e', training:'#a855f7', opinion:'#f97316' }
const IMG_MAP = {
  law:      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/US_Supreme_Court_Building.jpg/1280px-US_Supreme_Court_Building.jpg',
  breaking: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/US_Supreme_Court_Building.jpg/1280px-US_Supreme_Court_Building.jpg',
  industry: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/M4A1_SOPMOD_Block_II.jpg/1280px-M4A1_SOPMOD_Block_II.jpg',
  news:     'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg',
  deals:    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg',
  training: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg',
  opinion:  'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/US_Supreme_Court_Building.jpg/1280px-US_Supreme_Court_Building.jpg',
}
const FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg'

function pickImageForArticle(title, category) {
  const t = (title||'').toLowerCase()
  if (/\bban\b|lawsuit|saf\b|nra\b|goa\b|fpc\b|court|atf\b|congress|bill\b|law\b|legislat|unconstitutional|bruen|heller/.test(t)) return IMG_MAP.law
  if (/pistol|handgun|glock|sig|concealed|carry|edc|ccw|9mm|45.acp/.test(t)) return IMG_MAP.news
  if (/ar.?15|rifle|carbine|m4\b|ak.?47|suppressor|silencer/.test(t)) return IMG_MAP.industry
  return IMG_MAP[category] || FALLBACK
}

export default function NewsArticleManager({ adminKey }) {
  const [articles,  setArticles]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [imgFilter, setImgFilter] = useState('all')  // all | broken | good
  const [page,      setPage]      = useState(0)
  const [msg,       setMsg]       = useState('')
  const [busy,      setBusy]      = useState(false)
  const [editImg,   setEditImg]   = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editBody,  setEditBody]  = useState('')
  const PER_PAGE = 50

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/articles-list', { headers: { 'x-admin-key': adminKey } })
      const d = await res.json()
      if (d.ok) setArticles(d.articles || [])
      else flash('❌ ' + d.error)
    } catch (e) { flash('❌ ' + e.message) }
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (selected) {
      const a = articles.find(x => x._id === selected)
      if (a) { setEditImg(a.imageUrl || ''); setEditTitle(a.title || ''); setEditBody(a.body || a.summary || '') }
    }
  }, [selected, articles])

  async function patchField(id, fields) {
    const res = await fetch('/api/admin/articles-list', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'patch', id, fields }),
    })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Saved') }
    else flash('❌ ' + d.error)
  }

  async function fixImage(article) {
    setBusy(true)
    const correct = pickImageForArticle(article.title, article.category)
    await patchField(article._id, { imageUrl: correct })
    setBusy(false)
  }

  async function fixAllBroken() {
    setBusy(true)
    flash('⏳ Calling patch-all endpoint — fixing ALL broken images...')
    try {
      const res = await fetch('/api/admin/patch-article', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
      })
      const d = await res.json()
      await load()
      flash('✅ ' + (d.fixed||0) + ' fixed out of ' + (d.total||0) + ' total articles')
    } catch(e) { flash('❌ ' + e.message) }
    setBusy(false)
  }

  async function aiFixImage(article) {
    setBusy(true)
    flash('⏳ Asking Claude for best image...')
    const res = await fetch('/api/admin/articles-list', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ai-image', id: article._id, title: article.title, category: article.category }),
    })
    const d = await res.json()
    if (d.ok) { setEditImg(d.imageUrl); await patchField(article._id, { imageUrl: d.imageUrl }) }
    else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function aiRewrite(article) {
    setBusy(true)
    flash('⏳ Claude is rewriting the article...')
    const res = await fetch('/api/admin/articles-list', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ai-rewrite', id: article._id, title: article.title, body: article.body, summary: article.summary }),
    })
    const d = await res.json()
    if (d.ok) { setEditBody(d.body); await load(); flash('✅ Rewritten by Claude') }
    else flash('❌ ' + d.error)
    setBusy(false)
  }

  async function toggleApprove(article) {
    await patchField(article._id, { approved: !article.approved })
  }

  async function deleteArticle(article) {
    if (!confirm('Delete "' + article.title.slice(0,60) + '"? This cannot be undone.')) return
    setBusy(true)
    const res = await fetch('/api/admin/articles-list', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id: article._id }),
    })
    const d = await res.json()
    if (d.ok) { setSelected(null); await load(); flash('🗑 Deleted') }
    else flash('❌ ' + d.error)
    setBusy(false)
  }

  function isBrokenImage(url) {
    if (!url) return true
    const trusted = ['upload.wikimedia.org', 'cdn.sanity.io', 'images.unsplash.com', 'img.youtube.com']
    return !trusted.some(d => url.includes(d))
  }

  // Filter + paginate
  const cats = ['all', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean))).sort()]
  const filtered = articles.filter(a => {
    if (catFilter !== 'all' && a.category !== catFilter) return false
    if (imgFilter === 'broken' && !isBrokenImage(a.imageUrl)) return false
    if (imgFilter === 'good'   && isBrokenImage(a.imageUrl)) return false
    if (search) {
      const s = search.toLowerCase()
      return (a.title||'').toLowerCase().includes(s) || (a.source||'').toLowerCase().includes(s)
    }
    return true
  })
  const pages = Math.ceil(filtered.length / PER_PAGE)
  const visible = filtered.slice(page * PER_PAGE, (page+1) * PER_PAGE)
  const brokenCount = articles.filter(a => isBrokenImage(a.imageUrl)).length
  const selectedArticle = articles.find(a => a._id === selected)

  return (
    <div className="nam-wrap">
      <style>{S}</style>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', letterSpacing:'.06em', lineHeight:1 }}>
            📰 News Article Manager
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginTop:3 }}>
            {articles.length} articles · <span style={{ color: brokenCount > 0 ? '#ef4444' : '#22c55e' }}>{brokenCount} broken images</span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="nam-btn-sm" onClick={load}>↺ Refresh</button>
          {brokenCount > 0 && (
            <button className="nam-btn" onClick={fixAllBroken} disabled={busy}
              style={{ background:'#ef4444', color:'#fff', fontSize:11 }}>
              🔧 Fix All {brokenCount} Broken Images
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div style={{ padding:'9px 14px', marginBottom:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
          color: msg.startsWith('✅') ? '#22c55e' : msg.startsWith('❌') ? '#f87171' : msg.startsWith('⏳') ? '#f59e0b' : '#94a3b8',
          background:'var(--bg2)', border:'1px solid var(--border)' }}>
          {msg}
        </div>
      )}

      {/* ── FILTERS ── */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
        <input className="nam-input" value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}
          placeholder="Search title or source..." style={{ width:220 }} />
        <select className="nam-input" value={catFilter} onChange={e=>{setCatFilter(e.target.value);setPage(0)}} style={{ width:130 }}>
          {cats.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
        </select>
        <select className="nam-input" value={imgFilter} onChange={e=>{setImgFilter(e.target.value);setPage(0)}} style={{ width:140 }}>
          <option value="all">All Images</option>
          <option value="broken">🔴 Broken Only</option>
          <option value="good">✅ Good Only</option>
        </select>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', marginLeft:'auto' }}>
          {filtered.length} results
        </span>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap:0, border:'1px solid var(--border)', minHeight:400 }}>

        {/* ── TABLE ── */}
        <div style={{ overflowX:'auto', overflowY:'auto', maxHeight:'calc(100vh - 320px)' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'80px 1fr 130px 100px 90px 44px', borderBottom:'2px solid var(--border)', background:'var(--bg)' }}>
            {['Image','Title / Source','Category','Date','Status',''].map((h,i) => (
              <div key={i} style={{ padding:'8px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.08em', textTransform:'uppercase', fontWeight:700 }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>Loading articles...</div>
          ) : visible.map(a => {
            const broken = isBrokenImage(a.imageUrl)
            return (
              <div key={a._id} className={'nam-row' + (selected===a._id ? ' selected' : '')} onClick={() => setSelected(selected===a._id ? null : a._id)}>
                {/* Thumb + inline fix */}
                <div style={{ position:'relative', width:80, height:50, flexShrink:0 }}>
                  {a.imageUrl
                    ? <img src={a.imageUrl} alt="" className="nam-img" onError={e => { e.target.style.background='#1a0000'; e.target.src='' }} />
                    : <div style={{ width:80, height:50, background:'#1a0000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⚠</div>
                  }
                  {broken && (
                    <button
                      onClick={e => { e.stopPropagation(); fixImage(a) }}
                      disabled={busy}
                      title="Fix image"
                      style={{ position:'absolute', bottom:2, right:2, background:'#f59e0b', border:'none', color:'#000',
                        fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, padding:'2px 4px',
                        cursor:'pointer', lineHeight:1, zIndex:1 }}>
                      FIX
                    </button>
                  )}
                </div>
                {/* Title */}
                <div className="nam-cell" style={{ overflow:'visible', whiteSpace:'normal' }}>
                  <div className="nam-title">{a.title}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', marginTop:2 }}>{a.source}</div>
                </div>
                {/* Category */}
                <div className="nam-cell">
                  <span className="nam-badge" style={{ background:(CAT_C[a.category]||'#374151')+'22', color:CAT_C[a.category]||'#9ca3af' }}>
                    {a.category}
                  </span>
                </div>
                {/* Date */}
                <div className="nam-cell" style={{ fontSize:10 }}>
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}
                </div>
                {/* Status */}
                <div className="nam-cell">
                  <span className="nam-badge" style={{ background: a.approved ? 'rgba(34,197,94,.15)' : 'rgba(100,116,139,.15)', color: a.approved ? '#22c55e' : '#64748b' }}>
                    {a.approved ? 'live' : 'hidden'}
                  </span>
                </div>
                {/* Arrow */}
                <div className="nam-cell" style={{ textAlign:'center', color: selected===a._id ? 'var(--gold)' : '#374151' }}>›</div>
              </div>
            )
          })}
        </div>

        {/* ── DETAIL PANEL ── */}
        {selectedArticle && (
          <div className="nam-panel" style={{ maxHeight:'calc(100vh - 320px)', overflowY:'auto' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg2)' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--gold)', letterSpacing:'.04em', textTransform:'uppercase' }}>
                Edit Article
              </span>
              <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:16 }}>✕</button>
            </div>

            <div style={{ padding:16 }}>

              {/* Image preview + fix */}
              <span className="nam-lbl">Hero Image</span>
              <div style={{ position:'relative', marginBottom:10 }}>
                <img src={editImg || FALLBACK} alt="" style={{ width:'100%', height:140, objectFit:'cover', display:'block', background:'#111' }}
                  onError={e => e.target.src = FALLBACK} />
                {isBrokenImage(editImg) && (
                  <div style={{ position:'absolute', inset:0, background:'rgba(239,68,68,.15)', display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#ef4444' }}>
                    ⚠ BROKEN IMAGE URL
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
                <button className="nam-btn" onClick={() => fixImage(selectedArticle)} disabled={busy}
                  style={{ background:'#f59e0b', color:'#000', fontSize:11, padding:'7px 12px' }}>
                  🔧 Auto-Fix Image
                </button>
                <button className="nam-btn-sm" onClick={() => aiFixImage(selectedArticle)} disabled={busy}>🤖 AI Pick</button>
                <button className="nam-btn-sm" onClick={() => {
                  const url = prompt('Paste new image URL:')
                  if (url) { setEditImg(url); patchField(selectedArticle._id, { imageUrl: url }) }
                }}>✎ Paste URL</button>
              </div>
              <input className="nam-input" value={editImg} onChange={e => setEditImg(e.target.value)}
                onBlur={() => { if (editImg !== selectedArticle.imageUrl) patchField(selectedArticle._id, { imageUrl: editImg }) }}
                placeholder="https://..." style={{ marginBottom:12, fontSize:10 }} />

              <div className="nam-sep" />

              {/* Title */}
              <span className="nam-lbl">Title</span>
              <input className="nam-input" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                onBlur={() => { if (editTitle !== selectedArticle.title) patchField(selectedArticle._id, { title: editTitle }) }}
                style={{ marginBottom:12 }} />

              {/* Source + Category */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                <div>
                  <span className="nam-lbl">Source</span>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'7px 10px', background:'var(--bg3)', border:'1px solid var(--border)', color:'#6b7280' }}>
                    {selectedArticle.source || '—'}
                  </div>
                </div>
                <div>
                  <span className="nam-lbl">Category</span>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'7px 10px', background:'var(--bg3)', border:'1px solid var(--border)', color: CAT_C[selectedArticle.category] || '#9ca3af' }}>
                    {selectedArticle.category || '—'}
                  </div>
                </div>
              </div>

              {/* Body preview */}
              <span className="nam-lbl">Body / Summary</span>
              <textarea className="nam-textarea" value={editBody} onChange={e => setEditBody(e.target.value)}
                onBlur={() => { if (editBody !== (selectedArticle.body || selectedArticle.summary)) patchField(selectedArticle._id, { body: editBody }) }}
                rows={8} style={{ marginBottom:8 }} />
              <button className="nam-btn-sm" onClick={() => aiRewrite(selectedArticle)} disabled={busy} style={{ marginBottom:12, width:'100%' }}>
                🤖 Rewrite with Claude
              </button>

              <div className="nam-sep" />

              {/* Actions */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <button className="nam-btn-pub" onClick={() => toggleApprove(selectedArticle)} disabled={busy} style={{ flex:1,
                  background: selectedArticle.approved ? '#374151' : '#22c55e' }}>
                  {selectedArticle.approved ? '⏸ Unpublish' : '▶ Publish'}
                </button>
                <a href={'/news/' + selectedArticle.slug} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', padding:'8px 14px', border:'1px solid var(--border)',
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', textDecoration:'none' }}>
                  View ↗
                </a>
                <button className="nam-btn-del" onClick={() => deleteArticle(selectedArticle)} disabled={busy}>
                  🗑 Delete
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── PAGINATION ── */}
      {pages > 1 && (
        <div style={{ display:'flex', gap:6, marginTop:10, alignItems:'center', flexWrap:'wrap' }}>
          <button className="nam-btn-sm" onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0}>← Prev</button>
          {Array.from({length:Math.min(pages,10)},(_,i)=>i).map(i => (
            <button key={i} className="nam-btn-sm" onClick={() => setPage(i)}
              style={{ borderColor: i===page ? 'var(--gold)' : undefined, color: i===page ? 'var(--gold)' : undefined }}>
              {i+1}
            </button>
          ))}
          <button className="nam-btn-sm" onClick={() => setPage(p => Math.min(pages-1,p+1))} disabled={page===pages-1}>Next →</button>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', marginLeft:8 }}>
            Page {page+1} of {pages} · {filtered.length} articles
          </span>
        </div>
      )}
    </div>
  )
}
