'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const RADIUS_OPTIONS = [10, 25, 50, 75, 100]
const TYPE_OPTIONS = [
  { val:'all', label:'All Ranges', icon:'◎' },
  { val:'indoor', label:'Indoor Only', icon:'🏢' },
  { val:'outdoor', label:'Outdoor Only', icon:'🌲' },
]
const SORT_OPTIONS = [
  { val:'distance', label:'Nearest' },
  { val:'rating', label:'Top Rated' },
  { val:'name', label:'A–Z' },
]

function Stars({ rating }) {
  if (!rating) return null
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    <span style={{ color:'#C8922A', fontSize:'13px' }}>
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(5 - full - (half ? 1 : 0))}
      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', marginLeft:'4px' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

function FeaturePill({ text }) {
  return (
    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', background:'#16191F', border:'1px solid var(--border)', padding:'2px 7px', whiteSpace:'nowrap' }}>
      {text}
    </span>
  )
}

export default function RangesPage() {
  const [query, setQuery]     = useState('')
  const [radius, setRadius]   = useState(25)
  const [type, setType]       = useState('all')
  const [sortBy, setSortBy]   = useState('distance')
  const [results, setResults] = useState(null)
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [selected, setSelected] = useState(null)

  function sortResults(arr, by) {
    return [...arr].sort((a,b) => {
      if (by === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (by === 'name') return (a.name || '').localeCompare(b.name || '')
      return (a.distance || 999) - (b.distance || 999)
    })
  }

  async function search(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(null); setResults(null); setSelected(null)
    try {
      const res = await fetch(`/api/ranges?zip=${encodeURIComponent(query)}&radius=${radius}&type=${type}`)
      const d = await res.json()
      if (d.error) { setError(d.error); setLoading(false); return }
      setMeta(d)
      setResults(sortResults(d.ranges || [], sortBy))
    } catch { setError('Connection error. Please try again.') }
    setLoading(false)
  }

  function handleSort(val) {
    setSortBy(val)
    if (results) setResults(sortResults(results, val))
  }

  const sourceLabel = meta?.sources
    ? [
        meta.sources.curated > 0 && `${meta.sources.curated} curated`,
        meta.sources.google > 0 && `${meta.sources.google} Google`,
        meta.sources.osm > 0 && `${meta.sources.osm} OpenStreetMap`,
      ].filter(Boolean).join(' · ')
    : null

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="RANGES">
        <div className="container">
          <h1 className="page-hero-title">Shooting Range Finder</h1>
          <p className="page-hero-sub">Curated database · OpenStreetMap · Google Places · All in one search</p>
        </div>
      </div>

      <div style={{ padding:'28px 0', background:'var(--bg)', minHeight:'80vh' }}>
        <div className="container">

          {/* Search panel */}
          <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px', marginBottom:'24px' }}>
            <form onSubmit={search}>
              {/* Main search row */}
              <div style={{ display:'flex', gap:'10px', marginBottom:'18px' }}>
                <input
                  value={query} onChange={e=>setQuery(e.target.value)}
                  placeholder="ZIP code or city name — e.g. 98006, Bellevue WA, Austin TX"
                  style={{ flex:1, background:'#0D1117', border:'1px solid #C8922A', color:'#F5F5F3', padding:'13px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'14px' }}
                />
                <button type="submit" disabled={loading}
                  style={{ background:'#C8922A', color:'#000', border:'none', padding:'13px 28px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:900, fontSize:'14px', cursor:'pointer', letterSpacing:'0.05em', opacity:loading?0.7:1, whiteSpace:'nowrap' }}>
                  {loading ? 'SEARCHING...' : 'FIND RANGES →'}
                </button>
              </div>

              {/* Filter row */}
              <div style={{ display:'flex', gap:'24px', flexWrap:'wrap', alignItems:'flex-start' }}>
                {/* Radius */}
                <div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', letterSpacing:'0.1em', marginBottom:'8px' }}>SEARCH RADIUS</div>
                  <div style={{ display:'flex', gap:'4px' }}>
                    {RADIUS_OPTIONS.map(r => (
                      <button key={r} type="button" onClick={() => setRadius(r)}
                        style={{ background:radius===r?'#C8922A20':'transparent', border:`1px solid ${radius===r?'#C8922A':'#1F2428'}`, color:radius===r?'#C8922A':'#4B5563', padding:'6px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer', transition:'all 0.15s' }}>
                        {r} mi
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', letterSpacing:'0.1em', marginBottom:'8px' }}>RANGE TYPE</div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {TYPE_OPTIONS.map(t => (
                      <label key={t.val} style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', padding:'6px 12px', border:`1px solid ${type===t.val?'#C8922A':'#1F2428'}`, background:type===t.val?'#C8922A20':'transparent', transition:'all 0.15s' }}>
                        <input type="radio" name="rtype" checked={type===t.val} onChange={()=>setType(t.val)} style={{ accentColor:'#C8922A', margin:0 }} />
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:type===t.val?'#C8922A':'#4B5563' }}>{t.icon} {t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', letterSpacing:'0.1em', marginBottom:'8px' }}>SORT BY</div>
                  <div style={{ display:'flex', gap:'4px' }}>
                    {SORT_OPTIONS.map(s => (
                      <button key={s.val} type="button" onClick={()=>handleSort(s.val)}
                        style={{ background:sortBy===s.val?'#C8922A20':'transparent', border:`1px solid ${sortBy===s.val?'#C8922A':'#1F2428'}`, color:sortBy===s.val?'#C8922A':'#4B5563', padding:'6px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer', transition:'all 0.15s' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:'#1A0000', border:'1px solid #7F1D1D', padding:'16px 20px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#EF4444', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>✗ {error}</span>
              {meta?.mapsSearchUrl && (
                <a href={meta.mapsSearchUrl} target="_blank" rel="noreferrer" style={{ color:'#60A5FA', fontSize:'12px', textDecoration:'none', flexShrink:0 }}>Search Google Maps ↗</a>
              )}
            </div>
          )}

          {/* Results header */}
          {results && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', flexWrap:'wrap', gap:'8px' }}>
              <div>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#C8922A', fontWeight:700 }}>
                  {results.length} RANGES
                </span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563' }}>
                  {' '}within {radius} miles of {meta?.location?.split(',')[0] || query}
                </span>
              </div>
              <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
                {sourceLabel && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151' }}>Sources: {sourceLabel}</span>}
                {meta?.mapsSearchUrl && (
                  <a href={meta.mapsSearchUrl} target="_blank" rel="noreferrer"
                    style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#60A5FA', textDecoration:'none', border:'1px solid var(--border)', padding:'4px 10px' }}>
                    Open in Google Maps ↗
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Results + detail panel */}
          {results && results.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:selected?'1fr 360px':'1fr', gap:'16px', alignItems:'start' }}>

              {/* List */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {results.map((r, i) => {
                  const isSel = selected?.name === r.name
                  const typeColor = r.type === 'Indoor' ? '#60A5FA' : r.type === 'Outdoor' ? '#34D399' : '#9CA3AF'
                  return (
                    <div key={r.name + i}
                      onClick={() => setSelected(isSel ? null : r)}
                      style={{ background:isSel?'#16191F':'#111318', border:`1px solid ${isSel?'#C8922A':'#1F2428'}`, padding:'16px 20px', cursor:'pointer', transition:'all 0.15s' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'12px', alignItems:'start' }}>
                        <div>
                          {/* Badges */}
                          <div style={{ display:'flex', gap:'6px', marginBottom:'7px', flexWrap:'wrap', alignItems:'center' }}>
                            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', fontWeight:700 }}>{r.distance} mi</span>
                            {r.type && (
                              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:typeColor, background:`${typeColor}15`, padding:'2px 7px' }}>{r.type?.toUpperCase()}</span>
                            )}
                            {r.open === true && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34D399' }}>● OPEN</span>}
                            {r.open === false && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#EF4444' }}>○ CLOSED</span>}
                            {i === 0 && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#34D399', background:'#001A0A', padding:'1px 7px' }}>NEAREST</span>}
                            {r.rating >= 4.7 && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#FBBF24', background:'#1A1000', padding:'1px 7px' }}>TOP RATED</span>}
                            {r.source === 'curated' && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#C8922A', background:'#1A0E00', padding:'1px 7px' }}>✓ VERIFIED</span>}
                          </div>

                          <h3 style={{ fontSize:'16px', fontWeight:700, color:'#F0EDE6', marginBottom:'4px', lineHeight:1.3 }}>{r.name}</h3>
                          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', marginBottom:'8px' }}>{r.address}</p>

                          {/* Rating */}
                          {r.rating && (
                            <div style={{ marginBottom:'8px' }}>
                              <Stars rating={r.rating} />
                              {r.reviews && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151', marginLeft:'6px' }}>({r.reviews.toLocaleString()})</span>}
                            </div>
                          )}

                          {/* Features */}
                          {r.features?.length > 0 && (
                            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                              {r.features.map(f => <FeaturePill key={f} text={f} />)}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', flexDirection:'column', gap:'6px', flexShrink:0 }}>
                          {(r.mapsUrl || (r.lat && r.lng)) && (
                            <a href={r.mapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`}
                              target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                              style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', border:'1px solid #C8922A', padding:'6px 14px', textDecoration:'none', display:'block', textAlign:'center', whiteSpace:'nowrap' }}>
                              DIRECTIONS ↗
                            </a>
                          )}
                          {r.website && (
                            <a href={r.website} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                              style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6B7280', border:'1px solid var(--border)', padding:'5px 14px', textDecoration:'none', display:'block', textAlign:'center' }}>
                              WEBSITE ↗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Detail panel */}
              {selected && (
                <div style={{ background:'#111318', border:'1px solid #C8922A', padding:'24px', position:'sticky', top:'80px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'10px' }}>RANGE DETAILS</div>
                  <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.5rem', color:'#F0EDE6', letterSpacing:'0.03em', marginBottom:'5px', lineHeight:1.2 }}>{selected.name}</h2>
                  {selected.rating && <div style={{ marginBottom:'10px' }}><Stars rating={selected.rating} /></div>}
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', marginBottom:'16px', lineHeight:1.6 }}>{selected.address}</p>

                  {/* Details */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                    {[
                      selected.type && ['Type', selected.type],
                      selected.distance && ['Distance', `${selected.distance} miles`],
                      selected.hours && ['Hours', selected.hours],
                      selected.phone && ['Phone', selected.phone],
                      selected.open !== undefined && selected.open !== null && ['Status', selected.open ? '● Open Now' : '○ Closed'],
                    ].filter(Boolean).map(([k,v]) => (
                      <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563' }}>{k}</span>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#D1D5DB', textAlign:'right', maxWidth:'200px' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  {selected.features?.length > 0 && (
                    <div style={{ marginTop:'12px' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginBottom:'8px' }}>AMENITIES</div>
                      <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                        {selected.features.map(f => <FeaturePill key={f} text={f} />)}
                      </div>
                    </div>
                  )}

                  {/* CTAs */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'16px' }}>
                    <a href={selected.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(selected.name + ' ' + (selected.address || ''))}`}
                      target="_blank" rel="noreferrer"
                      style={{ background:'#C8922A', color:'#000', padding:'12px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'12px', textDecoration:'none', display:'block', textAlign:'center' }}>
                      GET DIRECTIONS ↗
                    </a>
                    {selected.website && (
                      <a href={selected.website} target="_blank" rel="noreferrer"
                        style={{ background:'transparent', color:'#C8922A', border:'1px solid #C8922A', padding:'10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', textDecoration:'none', display:'block', textAlign:'center' }}>
                        VISIT WEBSITE ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No results */}
          {results && results.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px', background:'#111318', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'12px', opacity:0.3 }}>◎</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#4B5563', marginBottom:'16px' }}>
                No ranges found within {radius} miles. Try increasing the radius or searching a different area.
              </p>
              {meta?.mapsSearchUrl && (
                <a href={meta.mapsSearchUrl} target="_blank" rel="noreferrer"
                  style={{ background:'#C8922A', color:'#000', padding:'10px 24px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'12px', textDecoration:'none', display:'inline-block' }}>
                  SEARCH ON GOOGLE MAPS ↗
                </a>
              )}
            </div>
          )}

          {/* Empty state */}
          {!results && !loading && (
            <div style={{ textAlign:'center', padding:'80px 0' }}>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'6rem', color:'#1F2428', lineHeight:1, marginBottom:'16px' }}>◎</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'14px', color:'#4B5563', marginBottom:'8px' }}>Enter a ZIP code or city to find shooting ranges</p>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151', lineHeight:1.8 }}>
                Sources: Curated database · OpenStreetMap (free) · Google Places (when configured)<br/>
                Covers all 50 states · Indoor & outdoor · Sorted by distance, rating, or name
              </p>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
