'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const COOKIE_KEY = 'dr_nl_dismissed'
const DISMISS_DAYS = 30

function isDismissed() {
  if (typeof window === 'undefined') return false
  try {
    const val = localStorage.getItem(COOKIE_KEY)
    if (!val) return false
    return Date.now() < Number(val)
  } catch { return false }
}

function setDismissed() {
  try {
    localStorage.setItem(COOKIE_KEY, String(Date.now() + DISMISS_DAYS * 864e5))
  } catch {}
}

export default function NewsletterSlideUp() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const firedRef = useRef(false)

  const show = useCallback(() => {
    if (firedRef.current || isDismissed()) return
    firedRef.current = true
    setVisible(true)
  }, [])

  useEffect(() => {
    if (isDismissed()) return

    // Desktop: cursor leaving toward browser chrome
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) show()
    }

    // Mobile / fallback: 70% scroll depth
    const handleScroll = () => {
      const doc = document.documentElement
      const scrolled = doc.scrollTop / (doc.scrollHeight - doc.clientHeight)
      if (scrolled >= 0.7) show()
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [show])

  const dismiss = () => {
    setDismissed()
    setVisible(false)
  }

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
        setDismissed()
        setTimeout(() => setVisible(false), 2800)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (!visible) return null

  return (
    <>
      <div
        role="dialog"
        aria-label="Subscribe to DownRange newsletter"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          width: 300,
          background: 'var(--bg2)',
          border: '1px solid var(--gold)',
          borderRadius: 6,
          padding: '18px 16px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          animation: 'drSlideUp 0.28s ease',
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Dismiss newsletter signup"
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: '2px 4px',
          }}
        >×</button>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.5rem', color: 'var(--gold)', marginBottom: 6 }}>
              YOU'RE IN
            </div>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Welcome to the weekly DownRange brief. Check your inbox.
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.25rem', color: 'var(--gold)', letterSpacing: '0.04em', marginBottom: 4, paddingRight: 20 }}>
              STAY IN THE FIGHT
            </div>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.55, marginBottom: 12 }}>
              Weekly intel — deals, news, law updates. Free.
            </p>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border-mid)',
                  borderRadius: 3,
                  padding: '8px 10px',
                  color: 'var(--text)',
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 12,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  background: 'var(--gold)',
                  color: '#09090B',
                  border: 'none',
                  borderRadius: 3,
                  padding: '9px 0',
                  fontFamily: "'Bebas Neue',cursive",
                  fontSize: '1rem',
                  letterSpacing: '0.08em',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: status === 'loading' ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {status === 'loading' ? 'SENDING…' : 'GET THE BRIEF'}
              </button>
              {status === 'error' && (
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--red-bright)', margin: 0 }}>
                  Something went wrong — try again.
                </p>
              )}
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes drSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
