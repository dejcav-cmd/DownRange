import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const hasClerk = !!(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder' &&
  process.env.CLERK_SECRET_KEY &&
  process.env.CLERK_SECRET_KEY !== 'sk_test_placeholder'
)

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (isAdminRoute(req)) {
        const { userId } = await auth()
        if (!userId) {
          const loginUrl = new URL('/admin-login', req.url)
          return NextResponse.redirect(loginUrl)
        }
      }
      return NextResponse.next()
    })
  : function middleware() { return NextResponse.next() }

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
