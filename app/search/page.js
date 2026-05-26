'use client'
import { useState, useEffect, useCallback } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const ALGOLIA_APP = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || 'SUIVKKC7FX'
const ALGOLIA_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

const CAT_COLORS = { breaking:'#EF4444', news:'#9CA3AF', law:'#60A5FA', industry:'#C8922A', opinion:'#C084FC', training:'#34D399' }

function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function SearchPage() {
  const [q, setQ]           = useState('')
  const [results, setRes]   = useState([])
  const [loading, setLoad]  = useState(false)
  const [cat, setCat]       = useState('all')
  const [total, setTotal]   = useState(0)
  const [ready, setReady]   = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const initial = params.get('q') || ''
      if (initial) { setQ(initial); search(initial, 'all') }
      setReady(true)
    }
  }, [])

  async function search(query, category) {
    if (!query.trim()) { setRes([]); setTotal(0); return }
    setLoad(true)
    try {
      if (!ALGOLIA_KEY) {
        // Fallback: search via our own API
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&cat=${category}`)
        const d = await res.json()
        setRes(d.results || [])
        setTotal(d.total || 0)
      } else {
        // Real Algolia search
        const indexName = category === 'all' ? 'news' : category
        const res = await fetch(`https://${ALGOLIA_APP}-dsn.algolia.net/1/indexes/${indexName}/query`, {
          method: 'POST',
          headers: { 'X-Algolia-Application-Id': ALGOLIA_APP, 'X-Algolia-API-Key': ALGOLIA_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, hitsPerPage: 20 })
        })
        const d = await res.json()
        setRes(d.hits || [])
        setTotal(d.nbHits || 0)
      }
    } catch { setRes([]); setTotal(0) }
    setLoad(false)
  }

  function handleInput(e) {
    const v = e.target.value
    setQ(v)
    clearTimeout(window._st)
    window._st = setTimeout(() => search(v, cat), 300)
  }

  const CATS = ['all','news','law','industry','breaking','training','opinion']

  return (
    <>
      <Masthead />
      <div style={{ background:'var(--bg)', minHeight:'100vh', padding:'48px 0' }}>
        <div className="container" style={{ maxWidth:800 }}>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'3rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'8px' }}>SEARCH</h1>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', marginBottom:'32px' }}>Search news, laws, reviews, releases, and encyclopedia entries</p>

          {/* Search input */}
          <div style={{ position:'relative', marginBottom:'20px' }}>
            <span style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', color:'#4B5563', fontSize:'18px' }}>⌕</span>
            <input value={q} onChange={handleInput} placeholder="Search DownRange..."
              style={{ width:'100%', background:'#111318', border:'2px solid #C8922A', color:'#F5F5F3', padding:'16px 16px 16px 48px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'16px', boxSizing:'border-box' }} />
          </div>

          {/* Category filters */}
          <div style={{ display:'flex', gap:'6px', marginBottom:'28px', flexWrap:'wrap' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => { setCat(c); search(q, c) }}
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', padding:'5px 14px', border:'1px solid var(--border)', background: cat===c ? '#C8922A20' : 'transparent', color: cat===c ? '#C8922A' : '#4B5563', cursor:'pointer', letterSpacing:'0.05em' }}>
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading && <div style={{ textAlign:'center', padding:'40px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563' }}>SEARCHING...</div>}

          {!loading && q && results.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#4B5563' }}>
              No results for "{q}". Try different keywords.
            </div>
          )}

          {!loading && total > 0 && (
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', marginBottom:'16px' }}>
              {total} results for "{q}"
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {results.map((r, i) => {
              const href = r.slug ? `/news/${r.slug}` : r.externalUrl || '#'
              const catColor = CAT_COLORS[r.category] || '#9CA3AF'
              return (
                <a key={r.objectID || i} href={href} style={{ textDecoration:'none', display:'block', background:'#111318', border:'1px solid var(--border)', padding:'16px 20px' }}>
                  {r.category && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:catColor, letterSpacing:'0.12em', display:'block', marginBottom:'6px' }}>{r.category.toUpperCase()}</span>}
                  <div style={{ fontSize:'16px', fontWeight:600, color:'#F0EDE6', lineHeight:1.35, marginBottom:'6px' }}>{r.title}</div>
                  {(r.summary || r.excerpt) && <p style={{ fontSize:'13px', color:'#6B7280', lineHeight:1.6, marginBottom:'8px' }}>{(r.summary || r.excerpt)?.slice(0,200)}</p>}
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151' }}>{r.source || 'DownRange'} · {timeAgo(r.publishedAt)}</div>
                </a>
              )
            })}
          </div>

          {!ready || (!q && !loading) && (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'5rem', color:'#1F2428', marginBottom:'16px', lineHeight:1 }}>⌕</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#4B5563' }}>Type to search all DownRange content</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
