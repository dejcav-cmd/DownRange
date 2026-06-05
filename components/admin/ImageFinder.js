'use client'
import { useState, useRef } from 'react'

const S = `
.ifdr-shell { display:flex; flex-direction:column; gap:0; }
.ifdr-search-bar { display:flex; gap:10px; align-items:stretch; margin-bottom:20px; }
.ifdr-input { flex:1; background:var(--bg3); border:1px solid var(--border); color:var(--text);
  font-family:'IBM Plex Mono',monospace; font-size:13px; padding:10px 14px; outline:none;
  transition:border-color .15s; }
.ifdr-input:focus { border-color:var(--gold); }
.ifdr-source-toggle { display:flex; gap:0; }
.ifdr-src-btn { background:var(--bg3); border:1px solid var(--border); color:#6b7280;
  font-family:'IBM Plex Mono',monospace; font-size:10px; padding:0 12px; cursor:pointer;
  letter-spacing:.06em; transition:all .15s; white-space:nowrap; border-left:none; }
.ifdr-src-btn:first-child { border-left:1px solid var(--border); }
.ifdr-src-btn.active { background:rgba(200,146,42,.12); border-color:var(--gold); color:var(--gold); }
.ifdr-go-btn { background:var(--gold); color:#000; border:none;
  font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:15px;
  letter-spacing:.08em; padding:0 28px; cursor:pointer; transition:opacity .15s; white-space:nowrap; }
.ifdr-go-btn:disabled { opacity:.45; cursor:not-allowed; }
.ifdr-meta { font-family:'IBM Plex Mono',monospace; font-size:10px; color:#4b5563; margin-bottom:14px; min-height:16px; }
.ifdr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; }
.ifdr-card { background:var(--bg2); border:1px solid var(--border); overflow:hidden;
  cursor:pointer; transition:all .15s; position:relative; }
.ifdr-card:hover { border-color:var(--gold); transform:translateY(-2px);
  box-shadow:0 4px 20px rgba(200,146,42,.18); }
.ifdr-card-img { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; background:#0a0a0c; }
.ifdr-card-foot { padding:8px 10px; display:flex; justify-content:space-between; align-items:center; gap:8px; }
.ifdr-card-info { font-family:'IBM Plex Mono',monospace; font-size:9px; color:#4b5563; }
.ifdr-card-copy { background:none; border:1px solid var(--border); color:#9ca3af;
  font-family:'IBM Plex Mono',monospace; font-size:9px; padding:3px 9px; cursor:pointer;
  transition:all .15s; }
.ifdr-card-copy:hover { border-color:var(--gold); color:var(--gold); }
.ifdr-card-copy.copied { border-color:#22c55e; color:#22c55e; }
.ifdr-card-preview { position:absolute; inset:0; background:rgba(0,0,0,.8);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
  opacity:0; transition:opacity .15s; pointer-events:none; }
.ifdr-card:hover .ifdr-card-preview { opacity:1; pointer-events:auto; }
.ifdr-card-open { background:var(--gold); color:#000; border:none;
  font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13px;
  letter-spacing:.06em; padding:7px 18px; cursor:pointer; }
.ifdr-empty { padding:60px 20px; text-align:center;
  font-family:'IBM Plex Mono',monospace; font-size:12px; color:#374151; }
.ifdr-spinner { display:inline-block; width:18px; height:18px;
  border:2px solid rgba(200,146,42,.3); border-top-color:var(--gold);
  border-radius:50%; animation:ifdr-spin .7s linear infinite; vertical-align:middle; margin-right:8px; }
@keyframes ifdr-spin { to { transform:rotate(360deg) } }
.ifdr-tag { display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:8px;
  padding:1px 5px; background:rgba(200,146,42,.1); border:1px solid rgba(200,146,42,.25);
  color:#C8922A; letter-spacing:.04em; margin-right:3px; }
.ifdr-toast { position:fixed; bottom:24px; right:24px; background:var(--bg2);
  border:1px solid #22c55e; color:#22c55e; font-family:'IBM Plex Mono',monospace;
  font-size:11px; padding:10px 18px; z-index:9999; animation:ifdr-fadein .2s ease; }
@keyframes ifdr-fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
`

const SOURCES = [
  { id: 'all',     label: 'ALL' },
  { id: 'pexels',  label: 'PEXELS' },
  { id: 'pixabay', label: 'PIXABAY' },
]

export default function ImageFinder({ adminKey }) {
  const [query,    setQuery]    = useState('')
  const [source,   setSource]   = useState('all')
  const [loading,  setLoading]  = useState(false)
  const [results,  setResults]  = useState(null)
  const [usedQuery,setUsedQuery]= useState('')
  const [error,    setError]    = useState('')
  const [copied,   setCopied]   = useState(null)
  const [toast,    setToast]    = useState('')
  const inputRef = useRef(null)

  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  async function doSearch(e) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const res = await fetch('/api/admin/image-finder', {
        method: 'POST',
        headers: H,
        body: JSON.stringify({ query: q, source }),
      })
      const d = await res.json()
      if (d.ok) {
        setResults(d.results || [])
        setUsedQuery(d.query || q)
      } else {
        setError(d.error || 'Search failed')
      }
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  function copyUrl(url) {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(url)
      setToast('URL copied to clipboard')
      setTimeout(() => setCopied(null), 2000)
      setTimeout(() => setToast(''), 2500)
    })
  }

  function handleKey(e) {
    if (e.key === 'Enter') doSearch()
  }

  return (
    <div className="ifdr-shell">
      <style>{S}</style>

      <div className="panel-title">Image Finder</div>
      <div className="panel-sub">
        Search Pexels, Pixabay, and the web for images. Type any keyword — gun model, topic, scene — and browse results.<br/>
        Click any image to open full-size · Copy URL to use in any article or release.
      </div>

      {/* Search bar */}
      <form className="ifdr-search-bar" onSubmit={doSearch}>
        <input
          ref={inputRef}
          className="ifdr-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="e.g.  glock 19  ·  ar-15 range  ·  concealed carry holster  ·  ammunition"
          autoFocus
        />
        <div className="ifdr-source-toggle">
          {SOURCES.map(s => (
            <button
              key={s.id}
              type="button"
              className={`ifdr-src-btn${source === s.id ? ' active' : ''}`}
              onClick={() => setSource(s.id)}
            >{s.label}</button>
          ))}
        </div>
        <button className="ifdr-go-btn" type="submit" disabled={loading || !query.trim()}>
          {loading ? <><span className="ifdr-spinner"/>SEARCHING</> : 'SEARCH →'}
        </button>
      </form>

      {/* Meta line */}
      <div className="ifdr-meta">
        {loading && <><span className="ifdr-spinner"/>Searching {source === 'all' ? 'Pexels + Pixabay' : source}…</>}
        {!loading && results && (
          <>{results.length} result{results.length !== 1 ? 's' : ''} for <span style={{color:'var(--gold)'}}>"{usedQuery}"</span> · {source === 'all' ? 'All sources' : source}</>
        )}
        {error && <span style={{color:'#f87171'}}>❌ {error}</span>}
      </div>

      {/* Results grid */}
      {!loading && results && results.length === 0 && (
        <div className="ifdr-empty">
          No results for "{usedQuery}".<br/>
          <span style={{color:'#C8922A',marginTop:8,display:'block'}}>
            Try a different keyword or check that PEXELS_API_KEY / PIXABAY_API_KEY are set in Vercel.
          </span>
        </div>
      )}

      {!loading && results && results.length > 0 && (
        <div className="ifdr-grid">
          {results.map((img, idx) => (
            <div key={idx} className="ifdr-card">
              <img
                className="ifdr-card-img"
                src={img.thumb || img.url}
                alt=""
                loading="lazy"
                onError={e => { e.target.style.opacity = '.3' }}
              />

              {/* Hover overlay */}
              <div className="ifdr-card-preview">
                <button className="ifdr-card-open" onClick={() => window.open(img.largeUrl || img.url, '_blank')}>
                  OPEN FULL SIZE ↗
                </button>
                <button
                  className={`ifdr-card-copy${copied === (img.largeUrl||img.url) ? ' copied' : ''}`}
                  style={{pointerEvents:'auto'}}
                  onClick={() => copyUrl(img.largeUrl || img.url)}
                >
                  {copied === (img.largeUrl||img.url) ? '✓ COPIED' : 'COPY URL'}
                </button>
              </div>

              <div className="ifdr-card-foot">
                <div className="ifdr-card-info">
                  <span className="ifdr-tag">{img.source}</span>
                  {img.author && <span style={{marginLeft:3}}>{img.author}</span>}
                </div>
                <button
                  className={`ifdr-card-copy${copied === (img.largeUrl||img.url) ? ' copied' : ''}`}
                  onClick={() => copyUrl(img.largeUrl || img.url)}
                >
                  {copied === (img.largeUrl||img.url) ? '✓' : 'COPY URL'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && results === null && (
        <div className="ifdr-empty">
          <div style={{fontSize:32,marginBottom:12}}>🔍</div>
          Type a keyword above and hit <strong style={{color:'var(--gold)'}}>SEARCH</strong> to find images.<br/>
          <span style={{fontSize:10,color:'#374151',marginTop:8,display:'block'}}>
            Sources: Pexels · Pixabay · Toggle source filter to narrow results
          </span>
        </div>
      )}

      {toast && <div className="ifdr-toast">✓ {toast}</div>}
    </div>
  )
}
