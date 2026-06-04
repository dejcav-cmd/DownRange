'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''

export default function FFLFinder() {
  const [zip, setZip] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(null)

  async function search(e) {
    e.preventDefault()
    if (!zip.trim()) return
    setLoading(true); setError(null); setResults(null); setLocation(null)
    try {
      const res = await fetch(`/api/ffl?zip=${encodeURIComponent(zip.trim())}`)
      const d = await res.json()
      if (d.error && !d.dealers?.length) {
        setError(d.error)
      } else {
        setResults(d.dealers || [])
        setLocation(d.location || zip)
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const TYPE_LABELS = { '01':'Dealer','02':'Pawnbroker','03':'Collector','06':'Manufacturer(Ammo)','07':'Manufacturer','08':'Importer','09':'Dealer(Destructive)','10':'Importer(Destructive)','11':'Manufacturer(Destructive)' }

  return (
    <>

      <Masthead />
      <div className="page-hero" data-title="FFL">
        <div className="container">
          <h1 className="page-hero-title">FFL Dealer Finder</h1>
          <p className="page-hero-sub">Find licensed firearms dealers near you · 60,000+ dealers nationwide · ATF database</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container" style={{ maxWidth:800 }}>
          <form onSubmit={search} style={{ display:'flex', gap:'12px', marginBottom:'32px', flexWrap:'wrap' }}>
            <input type="text" value={zip} onChange={e=>setZip(e.target.value)} placeholder="ZIP code or city, state"
              style={{ flex:1, minWidth:'200px', background:'#111318', border:'1px solid var(--border)', color:'#F5F5F3', padding:'14px 18px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'14px' }} />
            <button type="submit" disabled={loading}
              style={{ background:'#C8922A', color:'#000', border:'none', padding:'14px 28px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'14px', cursor:'pointer' }}>
              {loading ? 'SEARCHING...' : 'FIND FFLs →'}
            </button>
          </form>

          {error && (
            <div style={{ background:'#1A0000', border:'1px solid #7F1D1D', padding:'16px 20px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#EF4444', marginBottom:'20px', lineHeight:1.7 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>✗ Search Error</div>
              <div>{error}</div>
              {error.includes('GOOGLE_PLACES_API_KEY') && (
                <div style={{ marginTop:8, color:'#9CA3AF' }}>
                  Add GOOGLE_PLACES_API_KEY to Vercel → Project → Settings → Environment Variables, then redeploy.
                </div>
              )}
              {error.includes('Places API') && (
                <div style={{ marginTop:8, color:'#9CA3AF' }}>
                  Enable "Places API" in Google Cloud Console → APIs & Services → Enabled APIs.
                </div>
              )}
            </div>
          )}

          {results && results.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px', color:'#4B5563', fontFamily:"'IBM Plex Mono',monospace" }}>No FFLs found near {zip}. Try a nearby city.</div>
          )}

          {results && results.length > 0 && (
            <>
              {mapsKey && (
                <div style={{ marginBottom: 16, border: '1px solid var(--border)', overflow: 'hidden', height: 300 }}>
                  <iframe
                    width="100%" height="300" style={{ border: 0, display: 'block' }}
                    loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
                    src={"https://www.google.com/maps/embed/v1/search?key=" + mapsKey + "&q=FFL+gun+dealer+near+" + encodeURIComponent(zip) + "&zoom=11"}
                  />
                </div>
              )}
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'16px' }}>
                {results.length} LICENSED DEALERS NEAR {(location || zip).toUpperCase()}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {results.map((d,i) => (
                  <div key={i} style={{ background:'#111318', border:'1px solid var(--border)', padding:'16px 20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px' }}>
                      <div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', fontWeight:700, color:'#F0EDE6', marginBottom:'4px' }}>{d.name}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6B7280', marginBottom:'6px' }}>{d.address}, {d.city}, {d.state} {d.zip}</div>
                        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A', background:'#1A0E00', padding:'2px 8px', border:'1px solid #C8922A30' }}>{TYPE_LABELS[d.type] || `Type ${d.type}`}</span>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563' }}>License: {d.license}</span>
                          {d.phone && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563' }}>{d.phone}</span>}
                          {d.rating && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A' }}>★ {d.rating} ({d.reviews})</span>}
                          {d.open === true && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#22C55E' }}>● Open Now</span>}
                          {d.open === false && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#EF4444' }}>● Closed</span>}
                        </div>
                      </div>
                      <a href={`https://www.google.com/maps/search/${encodeURIComponent(d.name+' '+d.address+' '+d.city)}`} target="_blank" rel="noreferrer"
                        style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', border:'1px solid #C8922A', padding:'6px 14px', textDecoration:'none', flexShrink:0, whiteSpace:'nowrap' }}>
                        MAP →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!results && !loading && (
            <div style={{ textAlign:'center', padding:'80px 0', color:'#374151' }}>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'4rem', color:'#1F2428', marginBottom:'16px', lineHeight:1 }}>◈</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#4B5563' }}>Enter a ZIP code to find licensed FFL dealers near you</p>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151', marginTop:'8px' }}>Data from ATF Federal Firearms Licensee database · 60,000+ dealers</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
