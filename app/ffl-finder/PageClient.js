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
    if (typeof window !== 'undefined' && window.gtag) window.gtag('event', 'tool_used', { tool: 'ffl_finder', query: zip })
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
      {/* ── SEO Content Block ── */}
      <div style={{ background:'#09090B', borderTop:'1px solid #1F2428', padding:'48px 0' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px' }}>
          <h2 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>UNDERSTANDING FFL DEALERS AND TRANSFERS</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px', marginBottom:'32px' }}>
            <div>
              <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', fontWeight:700, color:'#F0EDE6', marginBottom:'10px', letterSpacing:'0.04em' }}>WHY YOU NEED AN FFL</h3>
              <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'14px', color:'#9CA3AF', lineHeight:1.8, margin:0 }}>
                Federal law (18 U.S.C. § 922) requires all commercial firearm sales and interstate transfers to go through a licensed Federal Firearms Licensee. When you purchase a firearm online, the seller ships to an FFL in your state. The dealer runs your NICS background check, completes ATF Form 4473, and releases the gun to you after approval — typically within minutes, though some states impose additional waiting periods.
              </p>
            </div>
            <div>
              <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', fontWeight:700, color:'#F0EDE6', marginBottom:'10px', letterSpacing:'0.04em' }}>FFL LICENSE TYPES</h3>
              <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'14px', color:'#9CA3AF', lineHeight:1.8, margin:0 }}>
                The ATF issues 11 FFL license types. Type 01 (Dealer) is the most common — these are your standard gun shops. Type 07 (Manufacturer) dealers can also transfer. Class III / SOT dealers hold Special Occupational Taxpayer status on top of their FFL, authorizing them to transfer NFA items: suppressors, short-barreled rifles, machine guns, and destructive devices. Confirm NFA capability before shipping any NFA item.
              </p>
            </div>
          </div>
          <div style={{ background:'#111318', border:'1px solid #1F2428', padding:'20px 24px', marginBottom:'24px' }}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'#F0EDE6', marginBottom:'10px', letterSpacing:'0.04em' }}>WHAT TO EXPECT AT AN FFL TRANSFER</h3>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'14px', color:'#9CA3AF', lineHeight:1.8, margin:0 }}>
              Bring a valid, government-issued photo ID (driver&apos;s license or passport). You&apos;ll complete ATF Form 4473, which the dealer submits for a NICS background check. The check typically takes minutes; a &apos;proceed&apos; result means you can take the gun. A &apos;delay&apos; gives the FBI up to 3 business days to complete the check. Transfer fees range from $15 to $75 depending on the dealer — always confirm the fee before having a gun shipped.
            </p>
          </div>
          <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13px', color:'#6B7280', lineHeight:1.7, margin:0 }}>
            FFL data sourced from the ATF Federal Firearms Licensee database. For state-specific carry and purchase laws, visit the <a href="/state-hub" style={{ color:'#C8922A', textDecoration:'none' }}>State Hub</a>. Track NFA suppressor and SBR wait times on the <a href="/nfa-tracker" style={{ color:'#C8922A', textDecoration:'none' }}>NFA Tracker</a>.
          </p>
        </div>
      </div>

      <Footer />
    </>
  )
}
