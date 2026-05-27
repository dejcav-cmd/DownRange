import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CLERK_PUB  = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
const CLERK_SEC  = process.env.CLERK_SECRET_KEY || ''
const ADMIN_KEY  = process.env.ADMIN_KEY || ''

const hasClerk = !!(
  CLERK_PUB && CLERK_PUB !== 'pk_test_placeholder' &&
  CLERK_SEC && CLERK_SEC !== 'sk_test_placeholder'
)

function isProtected(pathname: string) {
  return (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin-login') &&
    !pathname.startsWith('/admin/sign-in')
  )
}

// Password-cookie middleware (no Clerk)
function passwordGuard(req: NextRequest) {
  if (!isProtected(req.nextUrl.pathname)) return NextResponse.next()
  const session = req.cookies.get('dr_admin_session')?.value
  if (!ADMIN_KEY || session !== ADMIN_KEY) {
    return NextResponse.redirect(new URL('/admin-login', req.url))
  }
  return NextResponse.next()
}

export default hasClerk
  ? async function middleware(req: NextRequest) {
      // Dynamically import Clerk only when keys exist
      const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server')
      const isAdmin = createRouteMatcher(['/admin((?!/login).*)'])
      return clerkMiddleware(async (auth: any, request: NextRequest) => {
        if (isAdmin(request)) {
          const { userId } = await auth()
          if (!userId) return NextResponse.redirect(new URL('/admin-login', request.url))
        }
        return NextResponse.next()
      })(req, {} as any)
    }
  : passwordGuard

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
