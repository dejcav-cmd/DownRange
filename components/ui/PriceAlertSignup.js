'use client'
import { useState } from 'react'

const CALIBERS = ['9mm','5.56 NATO','.223 Rem','7.62x39','6.5 Creedmoor','.308 Win','.45 ACP','.40 S&W','.380 ACP','.22 LR','.300 BLK','12 Gauge']

export default function PriceAlertSignup() {
  const [email, setEmail] = useState('')
  const [caliber, setCaliber] = useState('')
  const [threshold, setThreshold] = useState('')
  const [status, setStatus] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/price-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, caliber, threshold: parseFloat(threshold) }),
      })
      const data = await res.json()
      setStatus(data.success ? 'success' : 'error')
    } catch { setStatus('error') }
  }

  return (
    <div style={{ background: '#0D1117', border: '1px solid #C8922A30', padding: '24px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.3rem', color: '#C8922A', marginBottom: '6px', letterSpacing: '0.05em' }}>
        PRICE DROP ALERTS
      </div>
      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#4B5563', marginBottom: '16px' }}>
        Email me when ammo drops below my price target
      </p>
      {status === 'success' ? (
        <div style={{ color: '#34D399', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px' }}>✓ Alert set. You'll hear from us when {caliber} drops below ${threshold}/rd.</div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select value={caliber} onChange={e=>setCaliber(e.target.value)} required
            style={{ background: '#111318', border: '1px solid var(--border)', color: caliber ? '#F5F5F3' : '#4B5563', padding: '8px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px' }}>
            <option value="">Select caliber...</option>
            {CALIBERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#4B5563', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px' }}>$</span>
              <input type="number" value={threshold} onChange={e=>setThreshold(e.target.value)} placeholder="0.20" step="0.01" min="0.01" max="5.00" required
                style={{ width: '100%', background: '#111318', border: '1px solid var(--border)', color: '#F5F5F3', padding: '8px 10px 8px 22px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px' }} />
            </div>
            <span style={{ color: '#4B5563', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', alignSelf: 'center', whiteSpace: 'nowrap' }}>per round</span>
          </div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required
            style={{ background: '#111318', border: '1px solid var(--border)', color: '#F5F5F3', padding: '8px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px' }} />
          <button type="submit" disabled={status==='loading'}
            style={{ background: '#C8922A', color: '#000', border: 'none', padding: '10px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            {status==='loading' ? 'SETTING ALERT...' : 'SET ALERT →'}
          </button>
        </form>
      )}
    </div>
  )
}
