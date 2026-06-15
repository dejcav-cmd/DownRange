'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  const prefillEmail = searchParams.get('email') || ''

  const [email, setEmail] = useState(prefillEmail)
  const [status, setStatus] = useState(success ? 'done' : error ? 'error' : 'idle')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setLoading(true)
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
    }}>
      {/* Logo */}
      <Link href="/">
        <img
          src="/img/logo.png"
          alt="DownRange"
          style={{ height: '60px', marginBottom: '48px', display: 'block' }}
        />
      </Link>

      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: '#1a1a1a',
        borderTop: '3px solid #c8922a',
        padding: '48px 40px',
      }}>
        {status === 'done' ? (
          <>
            <p style={{ margin: '0 0 8px', fontSize: '11px', letterSpacing: '2px', color: '#c8922a', textTransform: 'uppercase', fontWeight: 700 }}>
              CONFIRMED
            </p>
            <h1 style={{ margin: '0 0 20px', fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, textTransform: 'uppercase', fontFamily: '"Arial Black", Arial, sans-serif' }}>
              You're unsubscribed.
            </h1>
            <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#999', lineHeight: 1.8 }}>
              {prefillEmail || email} has been removed from the DownRange mailing list. You won't receive any further emails from us.
            </p>
            <p style={{ margin: '0 0 32px', fontSize: '13px', color: '#666', lineHeight: 1.7 }}>
              Changed your mind? You can re-subscribe from the home page at any time.
            </p>
            <Link href="/" style={{
              display: 'inline-block',
              background: '#c8922a',
              color: '#000',
              padding: '12px 32px',
              textDecoration: 'none',
              fontWeight: 900,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontSize: '12px',
              fontFamily: '"Arial Black", Arial, sans-serif',
            }}>
              BACK TO DOWNRANGE
            </Link>
          </>
        ) : status === 'error' ? (
          <>
            <p style={{ margin: '0 0 8px', fontSize: '11px', letterSpacing: '2px', color: '#ef4444', textTransform: 'uppercase', fontWeight: 700 }}>
              ERROR
            </p>
            <h1 style={{ margin: '0 0 20px', fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, textTransform: 'uppercase', fontFamily: '"Arial Black", Arial, sans-serif' }}>
              Something went wrong.
            </h1>
            <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#999', lineHeight: 1.8 }}>
              We couldn't process your request. Please try again or contact us at{' '}
              <a href="mailto:dj@downrangeco.com" style={{ color: '#c8922a', textDecoration: 'none' }}>dj@downrangeco.com</a>.
            </p>
            <button onClick={() => setStatus('idle')} style={{
              background: '#c8922a', color: '#000', border: 'none', padding: '12px 32px',
              fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '12px',
              cursor: 'pointer', fontFamily: '"Arial Black", Arial, sans-serif',
            }}>
              TRY AGAIN
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 8px', fontSize: '11px', letterSpacing: '2px', color: '#c8922a', textTransform: 'uppercase', fontWeight: 700 }}>
              MAILING LIST
            </p>
            <h1 style={{ margin: '0 0 20px', fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, textTransform: 'uppercase', fontFamily: '"Arial Black", Arial, sans-serif' }}>
              Unsubscribe
            </h1>
            <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#999', lineHeight: 1.8 }}>
              Enter your email address below to unsubscribe from the DownRange newsletter.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 16px',
                  background: '#111',
                  border: '1px solid #333',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'block',
                  width: '100%',
                  background: loading ? '#555' : '#c8922a',
                  color: '#000',
                  border: 'none',
                  padding: '14px',
                  fontWeight: 900,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  fontSize: '13px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: '"Arial Black", Arial, sans-serif',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? 'PROCESSING...' : 'UNSUBSCRIBE'}
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{ marginTop: '32px', fontSize: '11px', color: '#444', fontFamily: '"Courier New", monospace', letterSpacing: '1px' }}>
        DownRange Co. &middot; Second Amendment Intelligence Platform
      </p>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666', fontFamily: 'monospace' }}>Loading...</p>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
