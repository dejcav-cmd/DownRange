'use client'
import { useState, useEffect, useCallback } from 'react'

const CSS = `
.ism-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,.96);
  display: flex; flex-direction: column;
  animation: ism-in .15s ease;
}
@keyframes ism-in { from{opacity:0;transform:scale(.98)} to{opacity:1;transform:none} }
.ism-header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 24px; border-bottom: 1px solid #222;
  flex-shrink: 0;
}
.ism-title {
  font-family: 'Bebas Neue',cursive; font-size: 1.5rem;
  color: var(--gold); letter-spacing: .08em; flex-shrink: 0;
}
.ism-search-row {
  display: flex; gap: 8px; flex: 1; align-items: center;
}
.ism-input {
  flex: 1; background: #111; border: 1px solid #333; color: #e5e7eb;
  font-family: 'IBM Plex Mono',monospace; font-size: 13px;
  padding: 10px 14px; outline: none; transition: border-color .15s;
}
.ism-input:focus { border-color: var(--gold); }
.ism-src { display: flex; }
.ism-src-btn {
  background: #111; border: 1px solid #333; border-left: none;
  color: #6b7280; font-family: 'IBM Plex Mono',monospace; font-size: 10px;
  padding: 0 14px; cursor: pointer; transition: all .15s; white-space: nowrap;
}
.ism-src-btn:first-child { border-left: 1px solid #333; }
.ism-src-btn.on { background: rgba(200,146,42,.12); border-color: var(--gold); color: var(--gold); }
.ism-go {
  background: var(--gold); color: #000; border: none;
  font-family: 'Barlow Condensed',sans-serif; font-weight: 700; font-size: 15px;
  letter-spacing: .08em; padding: 0 28px; height: 42px; cursor: pointer;
}
.ism-go:disabled { opacity: .4; cursor: not-allowed; }
.ism-close {
  background: none; border: 1px solid #333; color: #9ca3af;
  font-size: 20px; width: 42px; height: 42px; cursor: pointer; flex-shrink: 0;
  transition: all .15s;
}
.ism-close:hover { border-color: #ef4444; color: #ef4444; }
.ism-meta {
  padding: 8px 24px; font-family: 'IBM Plex Mono',monospace; font-size: 10px;
  color: #4b5563; border-bottom: 1px solid #111; flex-shrink: 0; min-height: 32px;
  display: flex; align-items: center; gap: 8px;
}
.ism-body {
  flex: 1; overflow-y: auto; padding: 24px;
}
.ism-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
}
.ism-card {
  border: 2px solid #222; overflow: hidden; cursor: pointer;
  transition: all .15s; position: relative; background: #111;
}
.ism-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(200,146,42,.2); }
.ism-card img {
  width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block;
}
.ism-card-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,.0);
  display: flex; align-items: center; justify-content: center;
  transition: background .15s; pointer-events: none;
}
.ism-card:hover .ism-card-overlay { background: rgba(0,0,0,.5); pointer-events: auto; }
.ism-apply-btn {
  background: var(--gold); color: #000; border: none;
  font-family: 'Barlow Condensed',sans-serif; font-weight: 700; font-size: 18px;
  letter-spacing: .08em; padding: 12px 32px; cursor: pointer;
  opacity: 0; transform: scale(.9); transition: all .15s;
}
.ism-card:hover .ism-apply-btn { opacity: 1; transform: scale(1); }
.ism-card-foot {
  padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid #1a1a1a;
}
.ism-badge {
  font-family: 'IBM Plex Mono',monospace; font-size: 9px; color: #4b5563;
  background: rgba(200,146,42,.08); border: 1px solid rgba(200,146,42,.2);
  color: var(--gold); padding: 1px 6px; letter-spacing: .04em;
}
.ism-author { font-family: 'IBM Plex Mono',monospace; font-size: 9px; color: #374151; }
.ism-spinner {
  display: inline-block; width: 14px; height: 14px;
  border: 2px solid rgba(200,146,42,.3); border-top-color: var(--gold);
  border-radius: 50%; animation: ism-spin .7s linear infinite;
}
@keyframes ism-spin { to { transform: rotate(360deg) } }
.ism-applying-veil {
  position: absolute; inset: 0; background: rgba(200,146,42,.35);
  display: flex; align-items: center; justify-content: center;
  font-family: 'IBM Plex Mono',monospace; font-size: 12px; color: #fff;
}
.ism-empty {
  grid-column: 1/-1; text-align: center; padding: 80px 20px;
  font-family: 'IBM Plex Mono',monospace; font-size: 12px; color: #374151;
}
`

export default function ImageSearchModal({
  adminKey, item, onApply, onClose,
  apiPath = '/api/admin/image-finder',
  initialQuery = '',
}) {
  const [query,   setQuery]   = useState(initialQuery || item?.title || '')
  const [src,     setSrc]     = useState('all')
  const [busy,    setBusy]    = useState(false)
  const [results, setResults] = useState(null)
  const [applying,setApplying]= useState(null)
  const [error,   setError]   = useState('')

  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  const doSearch = useCallback(async (q, s) => {
    const qq = (q ?? query).trim()
    const ss = s ?? src
    if (!qq) return
    setBusy(true); setError(''); setResults(null)
    try {
      const res = await fetch('/api/admin/image-finder', {
        method: 'POST', headers: H,
        body: JSON.stringify({ query: qq, source: ss }),
      })
      const d = await res.json()
      if (d.ok) setResults(d.results || [])
      else setError(d.error || 'Search failed')
    } catch(e) { setError(e.message) }
    setBusy(false)
  }, [query, src])

  // Auto-search on open
  useEffect(() => { if (query.trim()) doSearch(query, src) }, [])

  // Escape to close
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  async function applyImage(url) {
    setApplying(url)
    try {
      if (apiPath === '/api/admin/image-finder') {
        // Direct apply — just pass the URL back
        onApply(url)
        onClose()
        return
      }
      const res = await fetch(apiPath, {
        method: 'POST', headers: H,
        body: JSON.stringify({ action: 'apply', id: item?._id, imageUrl: url }),
      })
      const d = await res.json()
      if (d.ok) { onApply(url); onClose() }
      else setError(d.error || 'Failed to apply')
    } catch(e) { setError(e.message) }
    setApplying(null)
  }

  return (
    <div className="ism-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="ism-header">
        <div className="ism-title">🔍 FIND IMAGE</div>
        <div className="ism-search-row">
          <input
            className="ism-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(query, src)}
            placeholder="Type keyword — gun model, topic, scene…"
            autoFocus
          />
          <div className="ism-src">
            {['all','pexels','pixabay'].map(s => (
              <button key={s} className={`ism-src-btn${src===s?' on':''}`}
                onClick={() => { setSrc(s); if (query.trim()) doSearch(query, s) }}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="ism-go" disabled={busy || !query.trim()}
            onClick={() => doSearch(query, src)}>
            {busy ? <span className="ism-spinner"/> : 'GO'}
          </button>
        </div>
        <button className="ism-close" onClick={onClose}>✕</button>
      </div>

      {/* Meta bar */}
      <div className="ism-meta">
        {busy && <><span className="ism-spinner"/> Searching {src === 'all' ? 'Pexels + Pixabay' : src}…</>}
        {!busy && results && <><span style={{color:'var(--gold)'}}>{results.length}</span> results · click any image to apply</>}
        {error && <span style={{color:'#f87171'}}>❌ {error}</span>}
        {item?.title && <span style={{marginLeft:'auto',color:'#374151',maxWidth:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</span>}
      </div>

      {/* Grid */}
      <div className="ism-body">
        <div className="ism-grid">
          {!busy && results && results.length === 0 && (
            <div className="ism-empty">
              No results for that keyword.<br/>
              <span style={{color:'var(--gold)',marginTop:8,display:'block'}}>Try a different term or check PEXELS_API_KEY / PIXABAY_API_KEY in Vercel.</span>
            </div>
          )}

          {!busy && results && results.map((img, i) => (
            <div key={i} className="ism-card" onClick={() => !applying && applyImage(img.largeUrl || img.url)}>
              <img
                src={img.thumb || img.url}
                alt=""
                loading="lazy"
                onError={e => { e.target.style.opacity = '.2' }}
              />
              <div className="ism-card-overlay">
                <button className="ism-apply-btn" onClick={e => { e.stopPropagation(); applyImage(img.largeUrl || img.url) }}>
                  ✓ USE THIS IMAGE
                </button>
              </div>
              {applying === (img.largeUrl || img.url) && (
                <div className="ism-applying-veil">Applying…</div>
              )}
              <div className="ism-card-foot">
                <span className="ism-badge">{img.source}</span>
                {img.author && <span className="ism-author">{img.author}</span>}
              </div>
            </div>
          ))}

          {!busy && !results && (
            <div className="ism-empty">
              <div style={{fontSize:40,marginBottom:12}}>🖼</div>
              Type a keyword and hit GO to search.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
