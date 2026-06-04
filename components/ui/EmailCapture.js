'use client'
import { useState } from 'react'

export default function EmailCapture({ variant = 'footer' }) {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState('idle') // idle | loading | success | error
  const [msg, setMsg]         = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setMsg('Check your inbox — welcome email on the way.')
        setEmail('')
      } else {
        setStatus('error')
        setMsg('Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setMsg('Connection error. Try again.')
    }
  }

  // ── FOOTER VARIANT ────────────────────────────────────────────────────────
  if (variant === 'footer') {
    return (
      <div style={{ background: '#111318', border: '1px solid #C8922A30', padding: '20px 24px', marginBottom: '32px' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C8922A', marginBottom: '6px' }}>
          DownRange Daily
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280', marginBottom: '14px' }}>
          Breaking 2A news, state law updates &amp; gear intel — free.
        </div>
        {status === 'success' ? (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#34D399', padding: '8px 0' }}>
            ✓ {msg}
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'loading'}
              style={{ flex: 1, background: '#09090B', border: '1px solid #1F2428', color: '#E5E5E5', padding: '8px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', outline: 'none', minWidth: 0 }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{ background: status === 'loading' ? '#8A6320' : '#C8922A', color: '#09090B', border: 'none', padding: '8px 16px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', cursor: status === 'loading' ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              {status === 'loading' ? '...' : 'SUBSCRIBE'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#EF4444', marginTop: '6px' }}>{msg}</div>
        )}
      </div>
    )
  }

  // ── ARTICLE SIDEBAR VARIANT ───────────────────────────────────────────────
  if (variant === 'sidebar') {
    return (
      <div style={{ background: '#111318', border: '1px solid #C8922A40', padding: '20px', marginTop: '8px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#C8922A', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '8px' }}>
          DOWNRANGE DAILY
        </div>
        <div style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.5, marginBottom: '14px' }}>
          Breaking 2A news direct to your inbox. Free, no spam.
        </div>
        {status === 'success' ? (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#34D399' }}>✓ {msg}</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'loading'}
              style={{ width: '100%', background: '#09090B', border: '1px solid #1F2428', color: '#E5E5E5', padding: '8px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{ width: '100%', background: status === 'loading' ? '#8A6320' : '#C8922A', color: '#09090B', border: 'none', padding: '9px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', cursor: status === 'loading' ? 'not-allowed' : 'pointer' }}
            >
              {status === 'loading' ? 'SUBSCRIBING...' : 'GET FREE INTEL'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <div style={{ fontSize: '11px', color: '#EF4444', marginTop: '6px', fontFamily: "'IBM Plex Mono', monospace" }}>{msg}</div>
        )}
      </div>
    )
  }

  // ── BANNER VARIANT (top of news page) ────────────────────────────────────
  return (
    <div style={{ background: 'linear-gradient(90deg, #111318 0%, #1a1208 100%)', borderTop: '2px solid #C8922A', borderBottom: '1px solid #1F2428', padding: '14px 0' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '0.12em', color: '#C8922A', whiteSpace: 'nowrap' }}>
          DOWNRANGE DAILY —
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280', flex: 1, minWidth: '200px' }}>
          Breaking 2A intel, CCW updates &amp; gear news. Free.
        </div>
        {status === 'success' ? (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#34D399' }}>✓ {msg}</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'loading'}
              style={{ background: '#09090B', border: '1px solid #2A2F38', color: '#E5E5E5', padding: '7px 12px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', outline: 'none', width: '200px' }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{ background: '#C8922A', color: '#09090B', border: 'none', padding: '7px 16px', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer' }}
            >
              {status === 'loading' ? '...' : 'SUBSCRIBE'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
