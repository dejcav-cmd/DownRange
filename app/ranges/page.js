'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export default function RangesPage() {
  const [zip, setZip] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function search(e) {
    e.preventDefault()
    if (!zip.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ranges?zip=${encodeURIComponent(zip)}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data.ranges || [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="RANGES">
        <div className="container">
          <h1 className="page-hero-title">Find a Shooting Range</h1>
          <p className="page-hero-sub">Indoor and outdoor ranges near you — updated from Google Places</p>
        </div>
      </div>

      <div style={{ padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <form onSubmit={search} style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
            <input type="text" value={zip} onChange={e => setZip(e.target.value)} placeholder="Enter ZIP code or city..."
              style={{ flex: 1, background: '#111318', border: '1px solid #1F2428', color: '#F5F5F3', padding: '14px 18px', fontFamily: 'monospace', fontSize: '14px' }} />
            <button type="submit" disabled={loading}
              style={{ background: '#C8922A', color: '#000', border: 'none', padding: '14px 28px', fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              {loading ? 'SEARCHING...' : 'FIND RANGES →'}
            </button>
          </form>

          {error && <div style={{ color: '#EF4444', fontFamily: 'monospace', fontSize: '13px', marginBottom: '20px' }}>Error: {error}</div>}

          {results && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#4B5563', fontFamily: 'monospace' }}>No ranges found near {zip}. Try a nearby city or ZIP.</div>
          )}

          {results && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '4px' }}>
                {results.length} RANGES NEAR {zip.toUpperCase()}
              </div>
              {results.map((r, i) => (
                <div key={i} style={{ background: '#111318', border: '1px solid #1F2428', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0EDE6', marginBottom: '6px' }}>{r.name}</h3>
                      <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>{r.address}</p>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {r.rating && <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A' }}>★ {r.rating}</span>}
                        {r.distance && <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4B5563' }}>{r.distance}</span>}
                        {r.open !== undefined && (
                          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: r.open ? '#34D399' : '#EF4444' }}>
                            {r.open ? '● OPEN NOW' : '○ CLOSED'}
                          </span>
                        )}
                      </div>
                    </div>
                    {r.mapsUrl && (
                      <a href={r.mapsUrl} target="_blank" rel="noopener noreferrer"
                        style={{ background: '#111318', border: '1px solid #C8922A', color: '#C8922A', fontFamily: 'monospace', fontSize: '11px', padding: '8px 16px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        DIRECTIONS →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!results && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', color: '#1F2428', marginBottom: '16px' }}>◎</div>
              <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#4B5563' }}>Enter your ZIP code to find ranges near you</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
