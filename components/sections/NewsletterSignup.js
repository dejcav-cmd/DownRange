'use client'
import { useState } from 'react'

export default function NewsletterSignup({ variant = 'full' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'

  async function handleSubmit(e) {
    if (typeof window !== 'undefined' && window.gtag) window.gtag('event', 'newsletter_signup', { method: 'form' })
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setStatus(data.success ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (variant === 'compact') {
    return (
      <div style={{ padding: '24px', background: '#0D1117', border: '1px solid #C8922A30' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#C8922A', marginBottom: '6px', letterSpacing: '0.05em' }}>
          STAY LOCKED IN
        </div>
        <p style={{ fontSize: '12px', color: '#4B5563', marginBottom: '12px', lineHeight: 1.5 }}>
          Daily briefings. Breaking alerts. No spam.
        </p>
        {status === 'success' ? (
          <div style={{ color: '#34D399', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px' }}>✓ You're in. You'll start receiving our newsletters soon.</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" required
              style={{ flex: 1, background: '#111318', border: '1px solid var(--border)', color: '#E8E6E1', padding: '8px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', minWidth: 0 }} />
            <button type="submit" disabled={status==='loading'}
              style={{ background: '#C8922A', color: '#000', border: 'none', padding: '8px 14px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {status === 'loading' ? '...' : 'JOIN →'}
            </button>
          </form>
        )}
        {status === 'error' && <div style={{ color: '#EF4444', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', marginTop: '6px' }}>Something went wrong. Try again.</div>}
      </div>
    )
  }

  // Full variant
  return (
    <section style={{ background: 'linear-gradient(135deg, #0D1117 0%, #111318 50%, #0D0A00 100%)', border: '1px solid #C8922A40', padding: '60px 0', margin: '48px 0' }}>
      <div className="container">
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#C8922A', letterSpacing: '0.2em', marginBottom: '16px' }}>
            FREE DAILY INTELLIGENCE BRIEF
          </div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 6vw, 4rem)', color: '#F5F5F3', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '16px' }}>
            STAY LOCKED IN
          </h2>
          <p style={{ fontSize: '16px', color: '#6B7280', marginBottom: '36px', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 36px' }}>
            Breaking law changes. New releases. Ammo price alerts. Every morning at 7am — straight to your inbox. No noise. No spam.
          </p>

          {status === 'success' ? (
            <div style={{ padding: '20px 32px', background: '#001A0A', border: '1px solid #166534', display: 'inline-block' }}>
              <span style={{ color: '#34D399', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '0.05em' }}>
                ✓ YOU'RE IN. FIRST BRIEF HITS TOMORROW 7AM.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0', maxWidth: '480px', margin: '0 auto', flexWrap: 'wrap' }}>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email address" required
                style={{ flex: 1, minWidth: '240px', background: '#111318', border: '2px solid #1F2428', borderRight: 'none', color: '#E8E6E1', padding: '14px 20px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '14px' }} />
              <button type="submit" disabled={status==='loading'}
                style={{ background: '#C8922A', color: '#000', border: '2px solid #C8922A', padding: '14px 28px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                {status === 'loading' ? 'SENDING...' : 'GET THE DAILY →'}
              </button>
            </form>
          )}
          {status === 'error' && <div style={{ color: '#EF4444', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', marginTop: '12px' }}>Something went wrong. Try again.</div>}

          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
            {['Breaking alerts within minutes','Law changes before they affect you','Ammo price drops in your caliber'].map(t=>(
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#C8922A', fontSize: '12px' }}>◆</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#4B5563' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
