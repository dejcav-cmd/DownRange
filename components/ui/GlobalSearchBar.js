'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TYPE_COLORS = {
  News: '#9ca3af', Laws: '#60a5fa', Blog: '#c084fc',
  Reviews: '#f59e0b', Releases: '#C8922A', 'State Laws': '#22c55e',
}
const TYPE_ICONS = {
  News: '📰', Laws: '⚖', Blog: '✍', Reviews: '★', Releases: '🔫', 'State Laws': '🗺',
}

function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 2) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function GlobalSearchBar() {
  const [open, setOpen]       = useState(false)
  const [q, setQ]             = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(0)
  const inputRef  = useRef(null)
  const panelRef  = useRef(null)
  const timerRef  = useRef(null)
  const router    = useRouter()

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') { setOpen(false); setQ(''); setResults([]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close on outside click
  useEffect(() => {
    function onDown(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false); setQ(''); setResults([])
      }
    }
    if (open) document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const doSearch = useCallback(async (query) => {
    if (!query || query.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=12`)
      const d = await res.json()
      setResults(d.results || [])
      setFocused(0)
    } catch { setResults([]) }
    setLoading(false)
  }, [])

  function onChange(e) {
    const v = e.target.value
    setQ(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v), 220)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f+1, results.length-1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f-1, 0)) }
    if (e.key === 'Enter') {
      if (results[focused]) { router.push(results[focused]._href); close() }
      else if (q) { router.push(`/search?q=${encodeURIComponent(q)}`); close() }
    }
  }

  function close() { setOpen(false); setQ(''); setResults([]) }

  const mono  = "'IBM Plex Mono',monospace"
  const barlow= "'Barlow Condensed',sans-serif"
  const bebas = "'Bebas Neue',cursive"

  if (!open) return (
    <button
      onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 30) }}
      title="Search (⌘K)"
      style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid rgba(200,146,42,0.4)', color:'#ffffff', padding:'5px 10px', cursor:'pointer', fontFamily:mono, fontSize:10 }}>
      <span style={{color:'#C8922A'}}>⌕</span> <span style={{color:'#ffffff'}}>Search</span>
      <span style={{opacity:.4,fontSize:9,marginLeft:2,color:'#ffffff'}}>⌘K</span>
    </button>
  )

  return (
    <div ref={panelRef} style={{ position:'relative', zIndex:200 }}>
      {/* Input — fixed width 195px, never expands layout */}
      <div style={{ display:'flex', alignItems:'center', gap:6, background:'#111318', border:'1px solid #C8922A', padding:'4px 10px', width:195, boxSizing:'border-box' }}>
        <span style={{ color:'#C8922A', fontSize:14, flexShrink:0 }}>⌕</span>
        <input
          ref={inputRef}
          value={q}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="Search DownRange…"
          autoFocus
          style={{ background:'none', border:'none', outline:'none', color:'#ffffff', fontFamily:mono, fontSize:11, flex:1, minWidth:0, width:'100%' }}
        />
        {loading && <span style={{ fontSize:10, color:'#9ca3af', animation:'spin 1s linear infinite', flexShrink:0 }}>↻</span>}
        <button onClick={close} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', fontSize:12, padding:'0 2px', flexShrink:0 }}>✕</button>
      </div>

      {/* Results dropdown — anchored right, never wider than viewport */}
      {(results.length > 0 || (q.length >= 2 && !loading)) && (
        <div style={{
          position:'fixed',
          top: panelRef.current ? panelRef.current.getBoundingClientRect().bottom + 2 : 'auto',
          right: 16,
          width: Math.min(420, (typeof window !== 'undefined' ? window.innerWidth : 420) - 32),
          background:'#111318', border:'1px solid var(--border)',
          maxHeight:420, overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,.7)',
          zIndex:9999,
        }}>
          {results.length === 0 && (
            <div style={{ padding:'20px 16px', fontFamily:mono, fontSize:11, color:'#6b7280', textAlign:'center' }}>
              No results for <span style={{color:'#C8922A'}}>"{q}"</span>
            </div>
          )}
          {results.map((r, i) => (
            <Link key={r._id} href={r._href} onClick={close}
              style={{
                display:'flex', gap:10, padding:'10px 14px', textDecoration:'none',
                borderBottom:'1px solid rgba(255,255,255,.04)',
                background: i === focused ? 'rgba(200,146,42,.08)' : 'transparent',
                borderLeft: i === focused ? '2px solid #C8922A' : '2px solid transparent',
              }}
              onMouseEnter={() => setFocused(i)}>
              <span style={{ flexShrink:0, fontSize:14, opacity:.7, marginTop:1 }}>{TYPE_ICONS[r._typeLabel] || '◈'}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:barlow, fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.title}
                </div>
                {r.summary && (
                  <div style={{ fontFamily:mono, fontSize:9, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>
                    {(r.summary||'').slice(0,90)}
                  </div>
                )}
              </div>
              <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                <span style={{ fontFamily:mono, fontSize:8, padding:'2px 6px', background:`${TYPE_COLORS[r._typeLabel]}20`, color:TYPE_COLORS[r._typeLabel]||'#9ca3af' }}>
                  {r._typeLabel}
                </span>
                {r.publishedAt && <span style={{ fontFamily:mono, fontSize:8, color:'#4b5563' }}>{timeAgo(r.publishedAt)}</span>}
              </div>
            </Link>
          ))}
          {results.length > 0 && (
            <Link href={`/search?q=${encodeURIComponent(q)}`} onClick={close}
              style={{ display:'flex', justifyContent:'center', padding:'10px', fontFamily:mono, fontSize:10, color:'#C8922A', textDecoration:'none', borderTop:'1px solid var(--border)', background:'rgba(200,146,42,.04)' }}>
              See all results for "{q}" →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
