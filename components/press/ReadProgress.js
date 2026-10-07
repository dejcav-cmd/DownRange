'use client'
import { useEffect, useState } from 'react'

export default function ReadProgress() {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const h = document.documentElement
        const max = h.scrollHeight - h.clientHeight
        setP(max > 0 ? Math.min(100, Math.max(0, (h.scrollTop / max) * 100)) : 0)
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf) }
  }, [])
  return <div aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, height: 3, width: p + '%', background: 'var(--gold)', zIndex: 10000, transition: 'width .1s linear', pointerEvents: 'none' }} />
}
