'use client'
import { useRef, useState, useEffect, useCallback } from 'react'

// Manual scroll-snap rail: native swipe on touch, arrow buttons on desktop, keyboard reachable. No autoplay.
export default function Rail({ label, children }) {
  const ref = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [update])

  const go = dir => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <div className="hr-wrap">
      <button type="button" className="hr-arrow hr-prev" onClick={() => go(-1)} disabled={atStart} aria-label={'Scroll ' + label + ' back'}>‹</button>
      <div className="hr-rail" ref={ref} role="region" aria-label={label} tabIndex={0}>
        {children}
      </div>
      <button type="button" className="hr-arrow hr-next" onClick={() => go(1)} disabled={atEnd} aria-label={'Scroll ' + label + ' forward'}>›</button>
    </div>
  )
}
