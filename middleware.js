import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes — no auth required
const isPublicRoute = createRouteMatcher([
  '/(.*)',          // All pages are public by default
  '/api/webhook(.*)', // Webhooks must be public
  '/studio(.*)',    // Studio uses Sanity auth
])

export default clerkMiddleware((auth, req) => {
  // All routes public for now — add protections per route as needed
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
