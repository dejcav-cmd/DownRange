'use client'
import { useState, useCallback } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const RADIUS_OPTIONS = [5, 10, 15, 25, 50]
const TYPE_OPTIONS = [
  { val:'all', label:'All Ranges' },
  { val:'indoor', label:'Indoor Only' },
  { val:'outdoor', label:'Outdoor Only' },
]
const SORT_OPTIONS = [
  { val:'distance', label:'Nearest First' },
  { val:'rating', label:'Highest Rated' },
  { val:'reviews', label:'Most Reviewed' },
]

function StarRating({ rating }) {
  if (!rating) return null
  const stars = Math.round(rating)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
      <span style={{ color:'#C8922A', fontSize:'12px' }}>{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</span>
      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A' }}>{rating.toFixed(1)}</span>
    </div>
  )
}

export default function RangesPage() {
  const [query, setQuery]       = useState('')
  const [radius, setRadius]     = useState(25)
  const [rangeType, setType]    = useState('all')
  const [sortBy, setSortBy]     = useState('distance')
  const [results, setResults]   = useState(null)
  const [location, setLoc]      = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [notice, setNotice]     = useState(null)
  const [mapCenter, setMapCenter] = useState(null)
  const [selected, setSelected]   = useState(null)

  async function search(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(null); setNotice(null); setResults(null); setSelected(null)
    try {
      const res = await fetch(`/api/ranges?zip=${encodeURIComponent(query.trim())}&radius=${radius}&type=${rangeType}`)
      const d = await res.json()
      if (d.error) { setError(d.error); setLoading(false); return }
      setNotice(d.notice || null)
      const sorted = sortRanges(d.ranges || [], sortBy)
      setResults(sorted)
      setLoc(d.location || null)
      if (d.lat && d.lng) setMapCenter({ lat: d.lat, lng: d.lng })
    } catch { setError('Connection error. Please try again.') }
    setLoading(false)
  }

  function sortRanges(arr, by) {
    return [...arr].sort((a, b) => {
      if (by === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (by === 'reviews') return (b.reviews || 0) - (a.reviews || 0)
      return a.distance - b.distance
    })
  }

  function handleSortChange(val) {
    setSortBy(val)
    if (results) setResults(sortRanges(results, val))
  }

  const R = selected || null

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="RANGES">
        <div className="container">
          <h1 className="page-hero-title">Range Finder</h1>
          <p className="page-hero-sub">Find shooting ranges near you · Indoor & outdoor · Sorted by distance, rating, or reviews</p>
        </div>
      </div>

      <div style={{ padding:'24px 0' }}>
        <div className="container">

          {/* Search form */}
          <form onSubmit={search} style={{ background:'#111318', border:'1px solid #1F2428', padding:'20px 24px', marginBottom:'24px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 180px 160px 160px auto', gap:'12px', alignItems:'end' }}>

              {/* ZIP/City input */}
              <div>
                <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>LOCATION</label>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ZIP code or city (e.g. 98006, Bellevue WA)"
                  style={{ width:'100%', background:'#0D1117', border:'1px solid #1F2428', color:'#F5F5F3', padding:'12px 14px', fontFamily:'monospace', fontSize:'13px', boxSizing:'border-box' }} />
              </div>

              {/* Radius selector */}
              <div>
                <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>RADIUS</label>
                <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                  {RADIUS_OPTIONS.map(r => (
                    <button key={r} type="button" onClick={() => setRadius(r)}
                      style={{ flex:1, background: radius===r ? '#C8922A20' : '#0D1117', border:`1px solid ${radius===r ? '#C8922A' : '#1F2428'}`, color: radius===r ? '#C8922A' : '#4B5563', padding:'10px 4px', fontFamily:'monospace', fontSize:'10px', cursor:'pointer' }}>
                      {r}mi
                    </button>
                  ))}
                </div>
              </div>

              {/* Type filter */}
              <div>
                <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>TYPE</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  {TYPE_OPTIONS.map(t => (
                    <label key={t.val} style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer' }}>
                      <input type="radio" name="rtype" value={t.val} checked={rangeType===t.val} onChange={() => setType(t.val)}
                        style={{ accentColor:'#C8922A' }} />
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color: rangeType===t.val ? '#C8922A' : '#4B5563' }}>{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>SORT BY</label>
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  {SORT_OPTIONS.map(s => (
                    <label key={s.val} style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer' }}>
                      <input type="radio" name="rsort" value={s.val} checked={sortBy===s.val} onChange={() => handleSortChange(s.val)}
                        style={{ accentColor:'#C8922A' }} />
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color: sortBy===s.val ? '#C8922A' : '#4B5563' }}>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ background:'#C8922A', color:'#000', border:'none', padding:'12px 20px', fontFamily:'monospace', fontWeight:700, fontSize:'13px', cursor:'pointer', opacity:loading?0.6:1, whiteSpace:'nowrap', alignSelf:'flex-end' }}>
                {loading ? '...' : 'FIND →'}
              </button>
            </div>
          </form>

          {/* Status messages */}
          {error && <div style={{ background:'#1A0000', border:'1px solid #7F1D1D', padding:'14px 18px', fontFamily:'monospace', fontSize:'13px', color:'#EF4444', marginBottom:'16px' }}>✗ {error}</div>}
          {notice && <div style={{ background:'#1A0E00', border:'1px solid #C8922A40', padding:'14px 18px', fontFamily:'monospace', fontSize:'12px', color:'#C8922A', marginBottom:'16px' }}>⚠ {notice}</div>}

          {/* Results header */}
          {results && (
            <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>{results.length} RANGES WITHIN {radius} MILES OF {location?.toUpperCase()}</span>
              <span style={{ color:'#4B5563' }}>Sorted by {sortBy}</span>
            </div>
          )}

          {/* Results grid */}
          {results && results.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap:'16px' }}>

              {/* List */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {results.map((r, i) => (
                  <div key={r.placeId || i}
                    onClick={() => setSelected(selected?.placeId === r.placeId ? null : r)}
                    style={{ background: selected?.placeId===r.placeId ? '#16191F' : '#111318', border:`1px solid ${selected?.placeId===r.placeId ? '#C8922A' : '#1F2428'}`, padding:'16px 20px', cursor:'pointer', display:'grid', gridTemplateColumns:'1fr auto', gap:'16px', alignItems:'center', transition:'all 0.15s' }}>
                    <div>
                      {/* Distance badge */}
                      <div style={{ display:'flex', gap:'8px', marginBottom:'6px', alignItems:'center', flexWrap:'wrap' }}>
                        <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A', fontWeight:700 }}>
                          {r.distance} mi
                        </span>
                        {r.open !== null && (
                          <span style={{ fontFamily:'monospace', fontSize:'10px', color: r.open ? '#34D399' : '#EF4444' }}>
                            {r.open ? '● OPEN' : '○ CLOSED'}
                          </span>
                        )}
                        {i === 0 && <span style={{ fontFamily:'monospace', fontSize:'8px', color:'#34D399', background:'#001A0A', padding:'1px 6px' }}>NEAREST</span>}
                        {r.rating >= 4.5 && <span style={{ fontFamily:'monospace', fontSize:'8px', color:'#FBBF24', background:'#1A1000', padding:'1px 6px' }}>TOP RATED</span>}
                      </div>
                      <h3 style={{ fontSize:'15px', fontWeight:700, color:'#F0EDE6', marginBottom:'4px', lineHeight:1.3 }}>{r.name}</h3>
                      <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', marginBottom:'8px' }}>{r.address}</p>
                      <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                        <StarRating rating={r.rating} />
                        {r.reviews > 0 && <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#374151' }}>({r.reviews} reviews)</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 }}>
                      <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                        style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A', border:'1px solid #C8922A', padding:'6px 14px', textDecoration:'none', display:'block', textAlign:'center' }}>
                        DIRECTIONS ↗
                      </a>
                      <button onClick={(e) => { e.stopPropagation(); setSelected(selected?.placeId===r.placeId?null:r) }}
                        style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', border:'1px solid #1F2428', padding:'5px 10px', background:'transparent', cursor:'pointer' }}>
                        {selected?.placeId===r.placeId ? 'COLLAPSE' : 'DETAILS'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detail panel */}
              {selected && (
                <div style={{ background:'#111318', border:'1px solid #C8922A', padding:'24px', position:'sticky', top:'80px', alignSelf:'flex-start' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'12px' }}>RANGE DETAILS</div>
                  <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#F0EDE6', letterSpacing:'0.03em', marginBottom:'6px' }}>{selected.name}</h2>
                  <p style={{ fontFamily:'monospace', fontSize:'12px', color:'#4B5563', marginBottom:'16px' }}>{selected.address}</p>

                  <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
                    {[
                      ['Distance', `${selected.distance} miles from ${query}`],
                      ['Rating', selected.rating ? `${selected.rating}/5 (${selected.reviews} reviews)` : 'No rating yet'],
                      ['Status', selected.open === true ? '● Open Now' : selected.open === false ? '○ Closed' : 'Hours unknown'],
                    ].map(([k,v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #1F2428' }}>
                        <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563' }}>{k}</span>
                        <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#D1D5DB', textAlign:'right' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    <a href={selected.mapsUrl} target="_blank" rel="noopener noreferrer"
                      style={{ background:'#C8922A', color:'#000', border:'none', padding:'12px', fontFamily:'monospace', fontWeight:700, fontSize:'12px', textDecoration:'none', display:'block', textAlign:'center' }}>
                      OPEN IN GOOGLE MAPS ↗
                    </a>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.name + ' ' + selected.address)}`} target="_blank" rel="noopener noreferrer"
                      style={{ background:'transparent', color:'#C8922A', border:'1px solid #C8922A', padding:'10px', fontFamily:'monospace', fontSize:'12px', textDecoration:'none', display:'block', textAlign:'center' }}>
                      GET DIRECTIONS ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {results && results.length === 0 && !notice && (
            <div style={{ textAlign:'center', padding:'60px', fontFamily:'monospace', color:'#4B5563' }}>
              <div style={{ fontSize:'3rem', marginBottom:'12px', opacity:0.2 }}>◎</div>
              No ranges found within {radius} miles. Try increasing the radius or searching a nearby city.
            </div>
          )}

          {!results && !loading && (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'5rem', color:'#1F2428', lineHeight:1, marginBottom:'16px' }}>◎</div>
              <p style={{ fontFamily:'monospace', fontSize:'13px', color:'#4B5563', marginBottom:'8px' }}>Enter a ZIP code or city to find shooting ranges near you</p>
              <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#374151' }}>Set radius · Filter by indoor/outdoor · Sort by distance or rating</p>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
