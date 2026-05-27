import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const isAdminRoute = createRouteMatcher(['/admin'])

// Routes that are always public — NEVER redirect these
const isPublicRoute = createRouteMatcher([
  '/',
  '/admin-login(.*)',
  '/api/admin/auth(.*)',
  '/api/(.*)',
  '/news(.*)',
  '/laws(.*)',
  '/learn(.*)',
  '/reviews(.*)',
  '/releases(.*)',
  '/market(.*)',
  '/video(.*)',
  '/state-hub(.*)',
  '/state-news(.*)',
  '/hunting(.*)',
  '/training(.*)',
  '/precision(.*)',
  '/preparedness(.*)',
  '/safe-storage(.*)',
  '/carry-insurance(.*)',
  '/ranges(.*)',
  '/ffl-finder(.*)',
  '/nfa-tracker(.*)',
  '/guns(.*)',
  '/ammo(.*)',
  '/holsters(.*)',
  '/compare(.*)',
  '/deals(.*)',
  '/search(.*)',
  '/blog(.*)',
  '/about(.*)',
  '/press(.*)',
  '/contact(.*)',
  '/contribute(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/widget(.*)',
  '/value-estimator(.*)',
  '/canada(.*)',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Never touch public routes
  if (isPublicRoute(req)) return NextResponse.next()

  // Protect /admin — redirect to login if not signed in
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
    // Match everything except static files
    '/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)',
  ],
}
