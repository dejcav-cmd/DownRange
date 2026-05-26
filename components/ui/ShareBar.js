'use client'
import { useState } from 'react'

export default function ShareBar({ title, slug }) {
  const [copied, setCopied] = useState(false)
  const url = `https://downrangeco.com/news/${slug}`

  function copy() {
    if (typeof navigator !== 'undefined') navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.68rem', color: '#4B5563', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>SHARE:</span>
      <button onClick={copy}
        style={{ color: copied ? '#34D399' : '#4B5563', background: 'none', border: '1px solid var(--border)', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', padding: '4px 10px', cursor: 'pointer', transition: 'color 0.2s, border-color 0.2s' }}>
        {copied ? '✓ COPIED' : 'COPY LINK'}
      </button>
      {[
        { label: 'X / TWITTER', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
        { label: 'FACEBOOK',    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
        { label: 'SIGNAL',      href: `https://signal.me/#p=${encodeURIComponent(url)}` },
      ].map(s => (
        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
          style={{ color: '#4B5563', textDecoration: 'none', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', padding: '4px 10px', border: '1px solid var(--border)' }}>
          {s.label}
        </a>
      ))}
    </div>
  )
}
