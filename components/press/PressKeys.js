'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Desktop nicety: left/right arrow keys step through newer/older pages.
export default function PressKeys({ newer, older }) {
  const router = useRouter()
  useEffect(() => {
    const onKey = e => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft' && newer) router.push(newer)
      if (e.key === 'ArrowRight' && older) router.push(older)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [newer, older, router])
  return null
}
