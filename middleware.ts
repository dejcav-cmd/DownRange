import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const hasClerk = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder' &&
  process.env.CLERK_SECRET_KEY &&
  process.env.CLERK_SECRET_KEY !== 'sk_test_placeholder'
)

// ── Password session middleware (no Clerk) ────────────────────────────────────
function passwordMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect /admin routes, not /admin-login or /api/admin/auth
  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin-login') &&
    !pathname.startsWith('/api/admin/auth')
  ) {
    const session = req.cookies.get('dr_admin_session')?.value
    const adminKey = process.env.ADMIN_KEY || ''

    if (!adminKey || session !== adminKey) {
      const loginUrl = new URL('/admin-login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// Export — Clerk when configured, password gate otherwise
let middleware: (req: NextRequest) => Promise<NextResponse> | NextResponse

if (hasClerk) {
  const { clerkMiddleware, createRouteMatcher } = require('@clerk/nextjs/server')
  const isAdminRoute = createRouteMatcher(['/admin((?!/login).*)'])

  middleware = clerkMiddleware(async (auth: any, req: NextRequest) => {
    if (isAdminRoute(req) && !req.nextUrl.pathname.startsWith('/admin-login')) {
      const { userId } = await auth()
      if (!userId) {
        const loginUrl = new URL('/admin-login', req.url)
        return NextResponse.redirect(loginUrl)
      }
    }
    return NextResponse.next()
  })
} else {
  middleware = passwordMiddleware
}

export default middleware

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
