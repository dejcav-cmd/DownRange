'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export default function RangesPage() {
  const [zip, setZip] = useState('')
  const [results, setResults] = useState(null)
  const [location, setLocation] = useState(null)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function search(e) {
    e.preventDefault()
    if (!zip.trim()) return
    setLoading(true)
    setError(null)
    setNotice(null)
    setResults(null)
    try {
      const res = await fetch(`/api/ranges?zip=${encodeURIComponent(zip.trim())}`)
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setResults(data.ranges || [])
      setLocation(data.location || null)
      setNotice(data.notice || null)
    } catch { setError('Connection error. Please try again.') }
    setLoading(false)
  }

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="RANGES">
        <div className="container">
          <h1 className="page-hero-title">Find a Shooting Range</h1>
          <p className="page-hero-sub">Indoor and outdoor ranges near you — sorted by distance</p>
        </div>
      </div>

      <div style={{ padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <form onSubmit={search} style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <input
              type="text" value={zip} onChange={e => setZip(e.target.value)}
              placeholder="ZIP code or city (e.g. 98006 or Bellevue WA)"
              style={{ flex: 1, minWidth: '200px', background: 'var(--input-bg, #111318)', border: '1px solid var(--border, #1F2428)', color: 'var(--text-primary, #F5F5F3)', padding: '14px 18px', fontFamily: 'monospace', fontSize: '14px' }}
            />
            <button type="submit" disabled={loading}
              style={{ background: '#C8922A', color: '#000', border: 'none', padding: '14px 28px', fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'SEARCHING...' : 'FIND RANGES →'}
            </button>
          </form>

          {error && (
            <div style={{ background: '#1A0000', border: '1px solid #7F1D1D', padding: '16px', fontFamily: 'monospace', fontSize: '13px', color: '#EF4444', marginBottom: '24px' }}>
              ✗ {error}
            </div>
          )}

          {notice && (
            <div style={{ background: '#1A0E00', border: '1px solid #C8922A40', padding: '16px', fontFamily: 'monospace', fontSize: '12px', color: '#C8922A', marginBottom: '24px' }}>
              ⚠ {notice}
            </div>
          )}

          {location && results && (
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '20px' }}>
              {results.length} RANGES NEAR {location.toUpperCase()}
            </div>
          )}

          {results && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map((r, i) => (
                <div key={r.placeId || i}
                  style={{ background: 'var(--card-bg, #111318)', border: '1px solid var(--border, #1F2428)', padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #F0EDE6)', marginBottom: '6px' }}>{r.name}</h3>
                    <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>{r.address}</p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {r.rating && (
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#C8922A' }}>
                          ★ {r.rating} {r.reviews > 0 ? `(${r.reviews})` : ''}
                        </span>
                      )}
                      {r.distance && (
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>
                          📍 {r.distance}
                        </span>
                      )}
                      {r.open !== null && (
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: r.open ? '#34D399' : '#EF4444' }}>
                          {r.open ? '● OPEN NOW' : '○ CLOSED'}
                        </span>
                      )}
                    </div>
                  </div>
                  {r.mapsUrl && (
                    <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer"
                      style={{ background: 'transparent', border: '1px solid #C8922A', color: '#C8922A', fontFamily: 'monospace', fontSize: '11px', padding: '10px 18px', textDecoration: 'none', whiteSpace: 'nowrap', display: 'block', textAlign: 'center' }}>
                      DIRECTIONS →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {!results && !loading && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#374151' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '5rem', lineHeight: 1, marginBottom: '16px', opacity: 0.15 }}>◎</div>
              <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#4B5563' }}>
                Enter a ZIP code or city name to find shooting ranges near you
              </p>
              <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#374151', marginTop: '8px' }}>
                Covers all 50 states · Sorted by distance · Updated from Google Maps
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
