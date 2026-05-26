'use client'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Fires a GA4 page_view on every client-side route change.
 * Next.js App Router doesn't fire full page reloads — GA4 needs this nudge.
 * Must be wrapped in <Suspense> because useSearchParams() requires it.
 */
function Tracker() {
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.gtag) return

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')

    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_path:  url,
      page_title: document.title,
    })
  }, [pathname, searchParams])

  return null
}

export default function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  )
}
