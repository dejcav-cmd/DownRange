'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

/**
 * SectionSearch — reusable per-section search bar
 * Props:
 *   type       - Sanity _type string (e.g. 'newsArticle', 'legislation')
 *   placeholder - input placeholder text
 *   defaultValue - initial search value (from URL params)
 *   paramName  - URL search param name (default 'q')
 *   onSearch   - optional callback(q) for server-side navigation mode
 */
export default function SectionSearch({ type, placeholder = 'Search…', defaultValue = '', paramName = 'q', compact = false }) {
  const [q, setQ]             = useState(defaultValue)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const [focused, setFocused] = useState(0)
  const inputRef = useRef(null)
  const wrapRef  = useRef(null)
  const timerRef = useRef(null)
  const router   = useRouter()
  const pathname = usePathname()

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doSearch = useCallback(async (query) => {
    if (!query || query.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const url = type
        ? `/api/search?q=${encodeURIComponent(query)}&type=${type}&limit=8`
        : `/api/search?q=${encodeURIComponent(query)}&limit=8`
      const res = await fetch(url)
      const d = await res.json()
      setResults(d.results || [])
      setOpen(true)
      setFocused(0)
    } catch { setResults([]) }
    setLoading(false)
  }, [type])

  function onChange(e) {
    const v = e.target.value
    setQ(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v), 250)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f+1, results.length)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f-1, 0)) }
    if (e.key === 'Escape')    { setOpen(false) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (focused < results.length && results[focused]) {
        router.push(results[focused]._href)
        setOpen(false)
      } else {
        // Navigate with URL param for server-side filtering
        const params = new URLSearchParams(window.location.search)
        if (q) params.set(paramName, q); else params.delete(paramName)
        params.delete('page')  // reset to page 1
        router.push(`${pathname}?${params.toString()}`)
        setOpen(false)
      }
    }
  }

  function submitSearch(e) {
    e?.preventDefault()
    const params = new URLSearchParams(window.location.search)
    if (q) params.set(paramName, q); else params.delete(paramName)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  function clear() {
    setQ(''); setResults([]); setOpen(false)
    const params = new URLSearchParams(window.location.search)
    params.delete(paramName); params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const mono   = "'IBM Plex Mono',monospace"
  const barlow = "'Barlow Condensed',sans-serif"
  const TYPE_ICONS = { newsArticle:'📰', legislation:'⚖', blogPost:'✍', review:'★', firearmRelease:'🔫', stateProfile:'🗺' }

  return (
    <div ref={wrapRef} style={{ position:'relative' }}>
      <form onSubmit={submitSearch} style={{ display:'flex', alignItems:'center', gap:0 }}>
        <div style={{
          display:'flex', alignItems:'center', flex:1,
          background:'var(--bg)', border:'1px solid var(--border)',
          borderRight:'none',
        }}>
          <span style={{ padding:'0 8px', color:'#6b7280', fontSize:13 }}>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={() => q.length >= 2 && results.length && setOpen(true)}
            placeholder={placeholder}
            style={{
              flex:1, background:'none', border:'none', outline:'none',
              color:'var(--text)', fontFamily:mono, fontSize:11,
              padding: compact ? '6px 0' : '8px 0',
            }}
          />
          {q && (
            <button type="button" onClick={clear}
              style={{ background:'none', border:'none', color:'#6b7280', cursor:'pointer', padding:'0 8px', fontSize:12 }}>
              ✕
            </button>
          )}
        </div>
        <button type="submit"
          style={{
            background:'var(--gold)', color:'#000', border:'none', cursor:'pointer',
            fontFamily:barlow, fontSize:12, fontWeight:700, letterSpacing:'.06em',
            padding: compact ? '6px 14px' : '8px 18px', flexShrink:0,
          }}>
          SEARCH
        </button>
      </form>

      {/* Live dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:100,
          background:'#111318', border:'1px solid var(--border)', borderTop:'none',
          maxHeight:320, overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,.6)',
        }}>
          {results.map((r, i) => (
            <Link key={r._id} href={r._href}
              onClick={() => setOpen(false)}
              style={{
                display:'flex', gap:10, padding:'9px 14px', textDecoration:'none',
                borderBottom:'1px solid rgba(255,255,255,.04)',
                background: i === focused ? 'rgba(200,146,42,.08)' : 'transparent',
                borderLeft: i === focused ? '2px solid #C8922A' : '2px solid transparent',
              }}
              onMouseEnter={() => setFocused(i)}>
              <span style={{ fontSize:13, opacity:.7, flexShrink:0 }}>{TYPE_ICONS[r._type] || '◈'}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:barlow, fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {r.title}
                </div>
                {r.summary && (
                  <div style={{ fontFamily:mono, fontSize:9, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>
                    {(r.summary||'').slice(0,80)}
                  </div>
                )}
              </div>
            </Link>
          ))}
          <button onClick={submitSearch}
            style={{ width:'100%', padding:'9px', background:'rgba(200,146,42,.04)', border:'none', borderTop:'1px solid var(--border)', color:'#C8922A', fontFamily:mono, fontSize:10, cursor:'pointer', textAlign:'center' }}>
            See all results for "{q}" →
          </button>
        </div>
      )}
      {loading && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, padding:'10px', background:'#111318', border:'1px solid var(--border)', fontFamily:mono, fontSize:10, color:'#6b7280', textAlign:'center' }}>
          Searching…
        </div>
      )}
    </div>
  )
}
