'use client'

// Safe ClerkProvider wrapper — only activates when keys are configured in Vercel.
// Without keys, renders children as-is so the site never crashes.

import { useEffect, useState } from 'react'

export default function ClerkWrapper({ children }) {
  const [ClerkProvider, setClerkProvider] = useState(null)
  const hasKeys = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder'
  )

  useEffect(() => {
    if (!hasKeys) return
    import('@clerk/nextjs').then(m => setClerkProvider(() => m.ClerkProvider))
  }, [hasKeys])

  if (!hasKeys || !ClerkProvider) return <>{children}</>
  return <ClerkProvider>{children}</ClerkProvider>
}
