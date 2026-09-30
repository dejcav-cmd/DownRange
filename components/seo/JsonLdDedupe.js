'use client'
// Removes duplicate JSON-LD <script> nodes left behind by hydration.
//
// Next 14.2's bundled React canary does not adopt server-rendered inline
// <script> elements: it inserts its own copy and leaves the server node orphaned
// in <body>. Googlebot renders JS, so it saw every JSON-LD block twice and merged
// the copies by @id — Search Console: 'Duplicate field "brand"' and 'Review has
// multiple aggregate ratings' on release pages.
//
// Only nodes React does NOT own (no __reactFiber key) are removed, and only when an
// identical React-owned copy exists — React never touches orphans, so removing
// them can't break reconciliation on navigation.
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function isReactOwned(el) {
  return Object.keys(el).some(k => k.startsWith('__reactFiber'))
}

function dedupe() {
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
  const owned = new Set(scripts.filter(isReactOwned).map(s => s.textContent))
  for (const s of scripts) {
    if (!isReactOwned(s) && owned.has(s.textContent)) s.remove()
  }
}

export default function JsonLdDedupe() {
  const pathname = usePathname()
  useEffect(() => {
    dedupe()
    // Streaming can append page content after the first effect
    const t1 = setTimeout(dedupe, 300)
    const t2 = setTimeout(dedupe, 1500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [pathname])
  return null
}
