import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// The separate mobile admin was retired; /admin is now one responsive app.
export async function GET(req) {
  return NextResponse.redirect(new URL('/admin', req.url), 308)
}
