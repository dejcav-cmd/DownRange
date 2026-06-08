'use client'
import { useState } from 'react'

/**
 * ImageSearchModal — reusable across all admin content managers
 *
 * Props:
 *   adminKey   – admin key for auth header
 *   item       – { _id, title, category } — the item to update
 *   onApply    – callback(imageUrl) called after successful apply
 *   onClose    – called to close modal
 *   apiPath    – API route path (default '/api/admin/blog-image-search')
 */
export default function ImageSearchModal({ adminKey, item, onApply, onClose, apiPath = '/api/admin/blog-image-search' }) {
  const [searching, setSearching] = useState(false)
  const [results,   setResults]   = useState(null)
  const [query,     setQuery]     = useState('')
  const [applying,  setApplying]  = useState(null)
  const [error,     setError]     = useState('')

  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  async function doSearch() {
    setSearching(true)
    setError('')
    try {
      const res = await fetch(apiPath, {
        method: 'POST', headers: H,
        body: JSON.stringify({ action: 'search', id: item._id, title: item.title || item.model || item.brand || '', category: item.category || '' }),
      })
      const d = await res.json()
      if (d.ok) {
        setResults(d.results || [])
        setQuery(d.query || '')
      } else {
        setError(d.error || 'Search failed')
      }
    } catch (e) { setError(e.message) }
    setSearching(false)
  }

  async function applyImage(imageUrl) {
    setApplying(imageUrl)
    try {
      const res = await fetch(apiPath, {
        method: 'POST', headers: H,
        body: JSON.stringify({ action: 'apply', id: item._id, imageUrl }),
      })
      const d = await res.json()
      if (d.ok) {
        onApply(imageUrl)
        onClose()
      } else setError(d.error || 'Failed to apply')
    } catch (e) { setError(e.message) }
    setApplying(null)
  }

  // Auto-search on mount
  if (results === null && !searching && !error) { doSearch() }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', width:'100%', maxWidth:900, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', letterSpacing:'.06em' }}>🔍 IMAGE SEARCH</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', marginTop:2 }}>
              {searching ? 'Searching…' : results ? results.length + ' results' : ''}
              {query && <span style={{ marginLeft:6 }}>— query: <span style={{ color:'#C8922A' }}>"{query}"</span></span>}
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:1, maxWidth:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {item.title || item.model || ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', fontSize:22, lineHeight:1, padding:4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:20 }}>
          {error && (
            <div style={{ padding:'10px 14px', marginBottom:12, background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.3)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#f87171' }}>
              ❌ {error}
              <button onClick={doSearch} style={{ marginLeft:12, background:'none', border:'1px solid #f87171', color:'#f87171', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'2px 8px', cursor:'pointer' }}>Retry</button>
            </div>
          )}

          {searching && (
            <div style={{ textAlign:'center', padding:60, fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#4b5563' }}>
              <span style={{ display:'block', fontSize:28, marginBottom:8 }}>⏳</span>
              Searching for images…
            </div>
          )}

          {!searching && results && results.length === 0 && (
            <div style={{ textAlign:'center', padding:40, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4b5563' }}>
              No external images found.{' '}
              <span style={{ color:'#C8922A' }}>Add PEXELS_API_KEY or PIXABAY_API_KEY in Vercel</span> to enable web search.
              Local DownRange photos shown below.
              <button onClick={doSearch} style={{ display:'block', margin:'12px auto 0', background:'none', border:'1px solid var(--border)', color:'var(--text-dim)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'5px 14px', cursor:'pointer' }}>↺ Try Again</button>
            </div>
          )}

          {!searching && results && results.length > 0 && (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px,1fr))', gap:12 }}>
                {results.map((img, idx) => (
                  <div key={idx}
                    onClick={() => applyImage(img.largeUrl || img.url)}
                    style={{ border:'1px solid var(--border)', overflow:'hidden', cursor:'pointer', transition:'border-color .15s', opacity: applying && applying !== (img.largeUrl||img.url) ? 0.5 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#C8922A'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ position:'relative', aspectRatio:'16/9', background:'#111', overflow:'hidden' }}>
                      <img src={img.thumb || img.url} alt=""
                        style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.9 }}
                        onError={e => { e.target.src = img.url }} />
                      {applying === (img.largeUrl||img.url) && (
                        <div style={{ position:'absolute', inset:0, background:'rgba(200,146,42,.4)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#fff' }}>Applying…</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding:'6px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>
                        {img.source}{img.author ? ' · ' + img.author : ''}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); applyImage(img.largeUrl || img.url) }}
                        disabled={!!applying}
                        style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:11, letterSpacing:'.05em', padding:'4px 12px', background:'var(--gold)', color:'#000', border:'none', cursor:'pointer' }}>
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, padding:'9px 14px', background:'rgba(0,0,0,.3)', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563' }}>
                <span style={{ color:'#C8922A', fontWeight:700, marginRight:6 }}>TIP:</span>
                Click any image to apply. Add <span style={{ color:'#C8922A' }}>PEXELS_API_KEY</span> or <span style={{ color:'#C8922A' }}>PIXABAY_API_KEY</span> in Vercel for more web results.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
