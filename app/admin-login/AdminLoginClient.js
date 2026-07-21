'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #09090B; }

  .login-wrap {
    min-height: 100vh;
    background: #09090B;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    font-family: 'IBM Plex Mono', monospace;
  }

  .login-logo {
    text-align: center;
    margin-bottom: 32px;
  }

  .login-logo h1 {
    font-family: 'Bebas Neue', cursive;
    font-size: 3rem;
    color: #C8922A;
    letter-spacing: 0.12em;
    line-height: 1;
  }

  .login-logo p {
    font-size: 10px;
    color: #374151;
    letter-spacing: 0.25em;
    margin-top: 4px;
    text-transform: uppercase;
  }

  .login-card {
    background: #0A0B0C;
    border: 1px solid #1F2428;
    border-top: 3px solid #C8922A;
    width: 100%;
    max-width: 420px;
    padding: 32px;
    /* Contain any child that tries to overflow */
    overflow: hidden;
  }

  /* Force Clerk's rendered root + card to stay inside our card */
  .login-card > div,
  .login-card [data-clerk-component],
  .login-card .cl-rootBox,
  .login-card .cl-card,
  .login-card .cl-signIn-root {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  /* Clerk inner form elements — full width */
  .login-card .cl-formFieldInput,
  .login-card .cl-formButtonPrimary,
  .login-card .cl-socialButtonsBlockButton {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .login-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: #F0EDE6;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .login-sub {
    font-size: 10px;
    color: #4B5563;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .login-label {
    display: block;
    font-size: 10px;
    color: #6B7280;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .login-input {
    width: 100%;
    background: #111318;
    border: 1px solid #1F2428;
    color: #F0EDE6;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    padding: 11px 14px;
    outline: none;
    transition: border-color 0.15s;
    margin-bottom: 16px;
  }

  .login-input:focus { border-color: #C8922A; }

  .login-btn {
    width: 100%;
    background: #C8922A;
    color: #000;
    border: none;
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 12px;
    cursor: pointer;
    transition: opacity 0.15s;
    margin-top: 4px;
  }

  .login-btn:hover { opacity: 0.85; }
  .login-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .login-error {
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.3);
    color: #F87171;
    font-size: 11px;
    padding: 10px 12px;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .login-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
  }

  .login-divider-line {
    flex: 1;
    height: 1px;
    background: #1F2428;
  }

  .login-divider-text {
    font-size: 10px;
    color: #374151;
    letter-spacing: 0.06em;
  }

  .login-google-btn {
    width: 100%;
    background: #111318;
    border: 1px solid #1F2428;
    color: #F0EDE6;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    padding: 11px 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: border-color 0.15s;
  }

  .login-google-btn:hover { border-color: #C8922A; }

  .login-footer {
    margin-top: 24px;
    font-size: 10px;
    color: #374151;
    text-align: center;
    line-height: 1.8;
  }
`

// Password gate — works without any external service
function PasswordGate() {
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const d = await res.json()
      if (d.ok) {
        // Store admin key for outreach portal
        localStorage.setItem('dr_admin_key', d.adminKey || password)
        router.push('/admin')
      } else {
        setError('Wrong password. Check your ADMIN_KEY in Vercel.')
      }
    } catch {
      setError('Connection error. Try again.')
    }
    setLoading(false)
  }

  return (
    <>
      <div className="login-title">Admin Access</div>
      <div className="login-sub">Enter your admin password to continue.</div>
      {error && <div className="login-error">{error}</div>}
      <form onSubmit={submit}>
        <label className="login-label">Password</label>
        <input
          type="password"
          className="login-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter admin password"
          autoFocus
        />
        <button type="submit" className="login-btn" disabled={loading || !password}>
          {loading ? 'Verifying...' : 'Sign In →'}
        </button>
      </form>
      <div className="login-footer">
        Password = your ADMIN_KEY in Vercel env vars.<br/>
        <a href="mailto:dj@downrangeco.com" style={{color:'#C8922A',textDecoration:'none'}}>dj@downrangeco.com</a>
      </div>
    </>
  )
}

// Full Clerk UI — loads dynamically only when keys exist
function ClerkLogin() {
  const [SignIn, setSignIn] = useState(null)

  useEffect(() => {
    import('@clerk/nextjs').then(m => setSignIn(() => m.SignIn))
  }, [])

  if (!SignIn) return (
    <div style={{color:'#C8922A',fontFamily:'IBM Plex Mono, monospace',fontSize:12,textAlign:'center',padding:'40px 0'}}>
      Loading...
    </div>
  )

  return (
    <SignIn
      fallbackRedirectUrl="/admin"
      forceRedirectUrl="/admin"
      signUpUrl="/admin-login"
      appearance={{
        layout: { logoPlacement: 'none' },
        variables: {
          colorPrimary: '#C8922A',
          colorBackground: '#0A0B0C',
          colorInputBackground: '#111318',
          colorInputText: '#F0EDE6',
          colorText: '#F0EDE6',
          colorTextSecondary: '#6B7280',
          colorNeutral: '#1F2428',
          fontFamily: 'IBM Plex Mono, monospace',
          borderRadius: '2px',
        },
        elements: {
          rootBox:  { width: '100%', maxWidth: '100%', minWidth: 0 },
          card:     { width: '100%', maxWidth: '100%', minWidth: 0, background: 'transparent', boxShadow: 'none', border: 'none', padding: 0, margin: 0 },
          main:     { width: '100%' },
          headerTitle:    { display: 'none' },
          headerSubtitle: { display: 'none' },
          socialButtonsBlockButton: {
            width: '100%',
            background: '#111318',
            border: '1px solid #1F2428',
            color: '#F0EDE6',
          },
          formFieldInput: {
            width: '100%',
            background: '#111318',
            border: '1px solid #1F2428',
            color: '#F0EDE6',
            fontFamily: 'IBM Plex Mono, monospace',
          },
          formButtonPrimary: {
            width: '100%',
            background: '#C8922A',
            color: '#000',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          },
          dividerLine:    { background: '#1F2428' },
          dividerText:    { color: '#374151' },
          footerActionText: { color: '#4B5563' },
          footerActionLink: { color: '#C8922A' },
        },
      }}
    />
  )
}

export default function AdminLoginClient() {
  const hasClerk = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder'
  )

  return (
    <>
      <style>{STYLE}</style>
      <div className="login-wrap">
        <div className="login-logo">
          <h1>DOWNRANGE</h1>
          <p>Admin Console</p>
        </div>

        <div className="login-card">
          {hasClerk ? <ClerkLogin /> : <PasswordGate />}
        </div>

        <div className="login-footer">
          Access restricted to authorized users only.
        </div>
      </div>
    </>
  )
}
