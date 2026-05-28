'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const TYPE_COLORS = {
  News:'#9ca3af', Laws:'#60a5fa', Blog:'#c084fc',
  Reviews:'#f59e0b', Releases:'#C8922A', 'State Laws':'#22c55e',
}
const TYPE_ICONS = {
  News:'📰', Laws:'⚖', Blog:'✍', Reviews:'★', Releases:'🔫', 'State Laws':'🗺',
}
const ALL_TYPES = ['all','newsArticle','legislation','review','firearmRelease','blogPost','stateProfile']
const TYPE_LABELS = {
  all:'All',newsArticle:'News',legislation:'Laws',
  review:'Reviews',firearmRelease:'Releases',blogPost:'Blog',stateProfile:'State Laws',
}

function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now()-new Date(d))/60000)
  if (m<2) return 'just now'
  if (m<60) return `${m}m ago`
  const h = Math.floor(m/60); if (h<24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function SearchPage() {
  const [q, setQ]           = useState('')
  const [results, setRes]   = useState([])
  const [loading, setLoad]  = useState(false)
  const [type, setType]     = useState('all')
  const [total, setTotal]   = useState(0)
  const [searched, setSearched] = useState('')
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const initial = params.get('q') || ''
      if (initial) { setQ(initial); doSearch(initial, 'all') }
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  const doSearch = useCallback(async (query, t) => {
    if (!query?.trim() || query.length < 2) { setRes([]); setTotal(0); return }
    setLoad(true)
    try {
      const typeParam = t && t !== 'all' ? `&type=${t}` : ''
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=40${typeParam}`)
      const d = await res.json()
      setRes(d.results || [])
      setTotal(d.total || 0)
      setSearched(query)
    } catch { setRes([]); setTotal(0) }
    setLoad(false)
  }, [])

  function onChange(e) {
    const v = e.target.value; setQ(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v, type), 280)
  }

  function onTypeChange(t) {
    setType(t)
    if (q) doSearch(q, t)
  }

  function onSubmit(e) { e.preventDefault(); doSearch(q, type) }

  const mono   = "'IBM Plex Mono',monospace"
  const bebas  = "'Bebas Neue',cursive"
  const barlow = "'Barlow Condensed',sans-serif"

  // Group results by type
  const grouped = {}
  results.forEach(r => {
    const tl = r._typeLabel || 'Other'
    if (!grouped[tl]) grouped[tl] = []
    grouped[tl].push(r)
  })

  return (
    <>
      <Masthead />
      <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
        {/* Search hero */}
        <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'40px 0 28px' }}>
          <div className="container" style={{ maxWidth:760 }}>
            <h1 style={{ fontFamily:bebas, fontSize:'clamp(2rem,5vw,3rem)', color:'#C8922A', letterSpacing:'.04em', marginBottom:4 }}>
              Search DownRange
            </h1>
            <p style={{ fontFamily:mono, fontSize:11, color:'#6b7280', marginBottom:20 }}>
              News · Laws · Reviews · Releases · Blog · State profiles — all searchable
            </p>
            <form onSubmit={onSubmit} style={{ display:'flex', gap:0 }}>
              <div style={{ display:'flex', alignItems:'center', flex:1, background:'var(--bg)', border:'1px solid var(--border)', borderRight:'none' }}>
                <span style={{ padding:'0 12px', color:'#C8922A', fontSize:18 }}>⌕</span>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={onChange}
                  placeholder="Search firearms, laws, reviews, releases…"
                  style={{ flex:1, background:'none', border:'none', outline:'none', color:'var(--text)', fontFamily:mono, fontSize:12, padding:'12px 0' }}
                />
                {q && <button type="button" onClick={()=>{setQ('');setRes([]);setTotal(0)}} style={{background:'none',border:'none',color:'#6b7280',cursor:'pointer',padding:'0 12px',fontSize:14}}>✕</button>}
              </div>
              <button type="submit" style={{ background:'var(--gold)', color:'#000', border:'none', fontFamily:barlow, fontSize:14, fontWeight:700, letterSpacing:'.08em', padding:'12px 24px', cursor:'pointer', flexShrink:0 }}>
                {loading ? '…' : 'SEARCH'}
              </button>
            </form>

            {/* Type filter */}
            <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
              {ALL_TYPES.map(t => (
                <button key={t} onClick={() => onTypeChange(t)}
                  style={{ fontFamily:mono, fontSize:9, padding:'4px 10px', border:'1px solid var(--border)', cursor:'pointer',
                    background: type===t ? 'var(--gold)' : 'transparent',
                    color: type===t ? '#000' : '#9ca3af', fontWeight: type===t ? 700 : 400 }}>
                  {TYPE_ICONS[TYPE_LABELS[t]] || ''} {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div style={{ padding:'32px 0' }}>
          <div className="container" style={{ maxWidth:760 }}>
            {searched && !loading && (
              <div style={{ fontFamily:mono, fontSize:11, color:'#6b7280', marginBottom:20 }}>
                {total === 0 ? `No results for "${searched}"` : `${total} result${total!==1?'s':''} for "${searched}"`}
              </div>
            )}
            {loading && (
              <div style={{ padding:'40px', textAlign:'center', fontFamily:mono, fontSize:12, color:'#6b7280' }}>Searching…</div>
            )}

            {/* Grouped results */}
            {Object.entries(grouped).map(([typeLabel, items]) => (
              <div key={typeLabel} style={{ marginBottom:32 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:14 }}>{TYPE_ICONS[typeLabel] || '◈'}</span>
                  <span style={{ fontFamily:barlow, fontSize:14, fontWeight:700, color:TYPE_COLORS[typeLabel]||'#9ca3af', letterSpacing:'.04em' }}>{typeLabel.toUpperCase()}</span>
                  <span style={{ fontFamily:mono, fontSize:9, color:'#4b5563', marginLeft:'auto' }}>{items.length} result{items.length!==1?'s':''}</span>
                </div>
                {items.map(r => (
                  <Link key={r._id} href={r._href}
                    style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,.04)', textDecoration:'none' }}>
                    {r.imageUrl && (
                      <img src={r.imageUrl.startsWith('/')?r.imageUrl:r.imageUrl} alt=""
                        style={{ width:64, height:48, objectFit:'cover', flexShrink:0, background:'#111' }}
                        onError={e=>{e.target.style.display='none'}} />
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:barlow, fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:3 }}>
                        {r.title}
                      </div>
                      {r.summary && (
                        <div style={{ fontFamily:mono, fontSize:10, color:'#6b7280', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                          {r.summary}
                        </div>
                      )}
                      <div style={{ display:'flex', gap:8, marginTop:4, alignItems:'center' }}>
                        {r.category && <span style={{ fontFamily:mono, fontSize:8, padding:'1px 5px', background:'rgba(200,146,42,.1)', color:'#C8922A' }}>{r.category}</span>}
                        {r.state && <span style={{ fontFamily:mono, fontSize:8, color:'#6b7280' }}>{r.state}</span>}
                        {r.publishedAt && <span style={{ fontFamily:mono, fontSize:8, color:'#4b5563', marginLeft:'auto' }}>{timeAgo(r.publishedAt)}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}

            {!loading && total === 0 && searched && (
              <div style={{ padding:'60px 0', textAlign:'center' }}>
                <div style={{ fontFamily:bebas, fontSize:'2rem', color:'#374151', marginBottom:8 }}>No Results</div>
                <div style={{ fontFamily:mono, fontSize:11, color:'#6b7280' }}>Try different keywords or check spelling</div>
              </div>
            )}

            {!searched && !loading && (
              <div style={{ padding:'60px 0', textAlign:'center' }}>
                <div style={{ fontFamily:mono, fontSize:11, color:'#4b5563', lineHeight:2 }}>
                  Search across news articles, laws, gun reviews, new releases, blog posts, and state profiles.<br/>
                  Results are ranked by relevance — title matches appear first.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
