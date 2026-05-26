'use client'
import { useState, useEffect, useRef } from 'react'

const FIELDS = [
  { name: 'name',    label: 'Name',         type: 'text',  required: true,  placeholder: 'Your name' },
  { name: 'email',   label: 'Email',        type: 'email', required: true,  placeholder: 'your@email.com' },
  { name: 'phone',   label: 'Phone',        type: 'tel',   required: false, placeholder: 'Optional' },
]

export default function FeedbackModal({ isOpen, onClose }) {
  const [form, setForm]       = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const overlayRef            = useRef(null)
  const firstInputRef         = useRef(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', email: '', phone: '', message: '' })
      setError('')
      setSuccess(false)
      setLoading(false)
      setTimeout(() => firstInputRef.current?.focus(), 80)
    }
  }, [isOpen])

  // Trap escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2200)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <style>{`
        .fb-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: fb-fade-in 0.15s ease;
        }
        @keyframes fb-fade-in { from { opacity: 0 } to { opacity: 1 } }
        .fb-modal {
          background: #0A0B0C;
          border: 1px solid var(--border);
          border-top: 3px solid var(--gold);
          width: 100%;
          max-width: 480px;
          padding: 32px;
          position: relative;
          animation: fb-slide-up 0.18s ease;
          box-shadow: 0 24px 80px rgba(0,0,0,0.9);
        }
        @keyframes fb-slide-up { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .fb-close {
          position: absolute; top: 14px; right: 16px;
          background: none; border: none; cursor: pointer;
          color: var(--text-dim); font-size: 18px; line-height: 1;
          padding: 4px 8px;
          transition: color 0.15s;
        }
        .fb-close:hover { color: var(--text); }
        .fb-title {
          font-family: 'Bebas Neue', cursive;
          font-size: 26px;
          color: var(--gold);
          letter-spacing: 0.08em;
          margin: 0 0 4px;
        }
        .fb-subtitle {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.04em;
          margin: 0 0 24px;
        }
        .fb-field {
          margin-bottom: 14px;
        }
        .fb-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .fb-label span { color: var(--gold); margin-left: 2px; }
        .fb-input {
          width: 100%;
          box-sizing: border-box;
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          padding: 10px 12px;
          outline: none;
          transition: border-color 0.15s;
          border-radius: 0;
          -webkit-appearance: none;
        }
        .fb-input:focus { border-color: var(--gold); }
        .fb-input::placeholder { color: var(--text-dim); }
        .fb-textarea {
          width: 100%;
          box-sizing: border-box;
          background: var(--bg2);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          padding: 10px 12px;
          outline: none;
          resize: vertical;
          min-height: 110px;
          transition: border-color 0.15s;
          border-radius: 0;
          -webkit-appearance: none;
        }
        .fb-textarea:focus { border-color: var(--gold); }
        .fb-textarea::placeholder { color: var(--text-dim); }
        .fb-error {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #ef4444;
          margin: 0 0 14px;
          padding: 8px 12px;
          background: rgba(239,68,68,0.08);
          border-left: 2px solid #ef4444;
        }
        .fb-btn {
          width: 100%;
          background: var(--gold);
          color: #09090B;
          border: none;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          margin-top: 6px;
        }
        .fb-btn:hover:not(:disabled) { opacity: 0.88; }
        .fb-btn:active:not(:disabled) { transform: scale(0.99); }
        .fb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .fb-success {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 24px 0 8px;
          text-align: center;
        }
        .fb-success-icon {
          font-size: 36px;
        }
        .fb-success-title {
          font-family: 'Bebas Neue', cursive;
          font-size: 24px;
          color: var(--gold);
          letter-spacing: 0.08em;
        }
        .fb-success-msg {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: var(--text-dim);
          line-height: 1.6;
        }
        .fb-chars {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
          text-align: right;
          margin-top: 4px;
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fb-overlay"
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fb-title"
      >
        <div className="fb-modal">
          <button className="fb-close" onClick={onClose} aria-label="Close feedback">✕</button>

          {success ? (
            <div className="fb-success">
              <div className="fb-success-icon">◎</div>
              <div className="fb-success-title">Feedback Received</div>
              <div className="fb-success-msg">
                Thanks for taking the time to reach out.<br />
                We read every submission.
              </div>
            </div>
          ) : (
            <>
              <h2 className="fb-title" id="fb-title">Send Feedback</h2>
              <p className="fb-subtitle">Help us improve DownRange</p>

              {error && <div className="fb-error">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                {FIELDS.map((field, i) => (
                  <div className="fb-field" key={field.name}>
                    <label className="fb-label" htmlFor={`fb-${field.name}`}>
                      {field.label}{field.required && <span>*</span>}
                    </label>
                    <input
                      ref={i === 0 ? firstInputRef : null}
                      id={`fb-${field.name}`}
                      className="fb-input"
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      required={field.required}
                      autoComplete={field.name === 'email' ? 'email' : field.name === 'name' ? 'name' : 'tel'}
                    />
                  </div>
                ))}

                <div className="fb-field">
                  <label className="fb-label" htmlFor="fb-message">
                    Message<span>*</span>
                  </label>
                  <textarea
                    id="fb-message"
                    className="fb-textarea"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us what you think, what's missing, or what could be better..."
                    required
                    maxLength={2000}
                  />
                  <div className="fb-chars">{form.message.length} / 2000</div>
                </div>

                <button
                  type="submit"
                  className="fb-btn"
                  disabled={loading}
                >
                  {loading ? 'SENDING...' : 'SEND FEEDBACK'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
