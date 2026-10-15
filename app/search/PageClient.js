'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const TYPE_COLORS = {
  News:'#9ca3af', Laws:'#60a5fa', Blog:'#c084fc',
  'Press Releases':'#C8922A', 'State Laws':'#22c55e', Deals:'#22c55e',
}
const TYPE_ICONS = {
  News:'📰', Laws:'⚖', Blog:'✍', 'Press Releases':'🏭', 'State Laws':'🗺', Deals:'🏷',
}
const ALL_TYPES = ['all','newsArticle','legislation','pressRelease','blogPost','stateProfile','gunDeal']
const TYPE_LABELS = {
  all:'All',newsArticle:'News',legislation:'Laws',
  pressRelease:'Press Releases',blogPost:'Blog',stateProfile:'State Laws',gunDeal:'Deals',
}
const SORTS = [['relevance','Best match'],['newest','Newest first'],['oldest','Oldest first']]
const WHENS = [['0','Any time'],['1','Past 24 hours'],['7','Past week'],['30','Past month'],['365','Past year']]

function fullDate(d) {
  if (!d) return ''
  const t = new Date(d); if (isNaN(t)) return ''
  return t.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}
function monthLabel(d) {
  const t = new Date(d); if (!d || isNaN(t)) return 'Undated'
  return t.toLocaleDateString('en-US', { month:'long', year:'numeric' })
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
  const [sort, setSortState] = useState('relevance')
  const [days, setDaysState] = useState('0')
  const inputRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const initial = params.get('q') || ''
      const t0 = TYPE_LABELS[params.get('type')] ? params.get('type') : 'all'
      const s0 = SORTS.some(x => x[0] === params.get('sort')) ? params.get('sort') : 'relevance'
      const d0 = WHENS.some(x => x[0] === params.get('days')) ? params.get('days') : '0'
      setType(t0); setSortState(s0); setDaysState(d0)
      if (initial) { setQ(initial); doSearch(initial, t0, s0, d0) }
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [])

  const doSearch = useCallback(async (query, t, s = 'relevance', d = '0') => {
    if (!query?.trim() || query.length < 2) { setRes([]); setTotal(0); return }
    setLoad(true)
    try {
      const typeParam = t && t !== 'all' ? `&type=${t}` : ''
      const sortParam = s !== 'relevance' ? `&sort=${s}` : ''
      const daysParam = d !== '0' ? `&days=${d}` : ''
      // keep the URL shareable
      const u = new URLSearchParams({ q: query })
      if (t && t !== 'all') u.set('type', t)
      if (s !== 'relevance') u.set('sort', s)
      if (d !== '0') u.set('days', d)
      try { window.history.replaceState(null, '', '/search?' + u.toString()) } catch {}
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=40${typeParam}${sortParam}${daysParam}`)
      const data = await res.json()
      setRes(data.results || [])
      setTotal(data.total || 0)
      setSearched(query)
    } catch { setRes([]); setTotal(0) }
    setLoad(false)
  }, [])

  function onChange(e) {
    const v = e.target.value; setQ(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(v, type, sort, days), 280)
  }

  function onTypeChange(t) {
    setType(t)
    if (q) doSearch(q, t, sort, days)
  }
  function onSortChange(v) { setSortState(v); if (q) doSearch(q, type, v, days) }
  function onDaysChange(v) { setDaysState(v); if (q) doSearch(q, type, sort, v) }

  function onSubmit(e) { e.preventDefault(); doSearch(q, type, sort, days) }

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

  // Date sorts show one timeline grouped by month; best-match keeps grouping by type.
  const byDate = sort !== 'relevance'
  let groups = Object.entries(grouped)
  if (byDate) {
    const m = new Map()
    results.forEach(r => {
      const k = monthLabel(r._date || r.publishedAt)
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(r)
    })
    groups = [...m.entries()]
  }

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
              News · Laws · Press releases · Blog · Deals · State profiles — all searchable
            </p>
            <form onSubmit={onSubmit} style={{ display:'flex', gap:0 }}>
              <div style={{ display:'flex', alignItems:'center', flex:1, background:'var(--bg)', border:'1px solid var(--border)', borderRight:'none' }}>
                <span style={{ padding:'0 12px', color:'#C8922A', fontSize:18 }}>⌕</span>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={onChange}
                  placeholder="Search firearms, laws, press releases, deals…"
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

            {/* Sort + date range */}
            <div style={{ display:'flex', gap:14, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:mono, fontSize:10, color:'#6b7280' }}>
                SORT
                <select value={sort} onChange={e => onSortChange(e.target.value)}
                  style={{ fontFamily:mono, fontSize:11, padding:'8px 10px', minHeight:40, background:'var(--bg)', color:'var(--text)', border:'1px solid var(--border)' }}>
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:mono, fontSize:10, color:'#6b7280' }}>
                DATE
                <select value={days} onChange={e => onDaysChange(e.target.value)}
                  style={{ fontFamily:mono, fontSize:11, padding:'8px 10px', minHeight:40, background:'var(--bg)', color:'var(--text)', border:'1px solid var(--border)' }}>
                  {WHENS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
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
            {groups.map(([typeLabel, items]) => (
              <div key={typeLabel} style={{ marginBottom:32 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, paddingBottom:6, borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:14 }}>{TYPE_ICONS[typeLabel] || '📅'}</span>
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
                        {byDate && r._typeLabel && <span style={{ fontFamily:mono, fontSize:8, padding:'1px 5px', border:'1px solid var(--border)', color:TYPE_COLORS[r._typeLabel]||'#9ca3af' }}>{r._typeLabel}</span>}
                        {r.category && <span style={{ fontFamily:mono, fontSize:8, padding:'1px 5px', background:'rgba(200,146,42,.1)', color:'#C8922A' }}>{r.category}</span>}
                        {r.state && <span style={{ fontFamily:mono, fontSize:8, color:'#6b7280' }}>{r.state}</span>}
                        {(r._date || r.publishedAt) && <span style={{ fontFamily:mono, fontSize:9, color:'#6b7280', marginLeft:'auto' }}>{fullDate(r._date || r.publishedAt)} · {timeAgo(r._date || r.publishedAt)}</span>}
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
                  Search across news articles, laws, manufacturer press releases, blog posts, deals, and state profiles.<br/>
                  Sort by best match or by date, and narrow to the past day, week, month or year.
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
