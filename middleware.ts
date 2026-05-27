import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Only /admin (exact path) requires auth — everything else is public
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl

  // Always allow these through — never redirect
  const alwaysPublic = [
    '/admin-login',
    '/api/',
    '/_next/',
    '/favicon',
  ]
  if (alwaysPublic.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Protect only the exact /admin route
  if (isAdminRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.redirect(new URL('/admin-login', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Protect all /admin sub-routes and /admin-login
    '/admin(.*)',
    '/admin-login(.*)',
  ],
}
