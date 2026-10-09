'use client'
import { useState } from 'react'

const STATS = [['50', 'State Guides'], ['Weekly', 'Deal Drop'], ['Free', 'No Spam']]

export default function NewsletterBar() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error

  const submit = async (e) => {
    e.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section style={{ padding: '28px 0', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
      <div className="container">
        {/* Slim form row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ flex: '0 0 auto' }}>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'var(--text)', letterSpacing: '0.02em' }}>
              Weekly brief —{' '}
            </span>
            <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'var(--gold)', letterSpacing: '0.02em' }}>
              free, no spam
            </span>
          </div>

          {status === 'success' ? (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: 'var(--gold)', letterSpacing: '0.04em' }}>
              ✓ You&apos;re in — check your inbox.
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', gap: 8, flex: '1 1 280px', minWidth: 0 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: 'var(--bg2)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: 3,
                  padding: '9px 12px',
                  color: 'var(--text)',
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  flex: '0 0 auto',
                  background: 'var(--gold)',
                  color: '#09090B',
                  border: 'none',
                  borderRadius: 3,
                  padding: '9px 18px',
                  fontFamily: "'Bebas Neue',cursive",
                  fontSize: '1rem',
                  letterSpacing: '0.08em',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: status === 'loading' ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.15s',
                }}
              >
                {status === 'loading' ? '…' : 'GET THE BRIEF'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--red-bright)' }}>
              Something went wrong — try again.
            </span>
          )}
        </div>

        {/* Stat chips + social icons row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {STATS.map(([n, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.1rem', color: 'var(--gold)', lineHeight: 1 }}>{n}</span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
