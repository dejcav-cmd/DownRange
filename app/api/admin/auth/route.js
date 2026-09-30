export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'

export async function POST(req) {
  const { password } = await req.json().catch(() => ({}))

  if (!password) {
    return Response.json({ ok: false, error: 'Password required' }, { status: 400 })
  }

  const adminKey = process.env.ADMIN_KEY || ''

  if (!adminKey) {
    return Response.json({ ok: false, error: 'ADMIN_KEY not configured in Vercel' }, { status: 500 })
  }

  if (password !== adminKey) {
    // Slight delay to prevent brute force
    await new Promise(r => setTimeout(r, 800))
    return Response.json({ ok: false, error: 'Invalid password' }, { status: 401 })
  }

  // Set a secure httpOnly session cookie
  const cookieStore = await cookies()
  cookieStore.set('dr_admin_session', adminKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return Response.json({ ok: true, adminKey })
}

// ── GET: verify the caller's admin credentials ─────────────────────────────────
// Used by the admin shell on load. Accepts the x-admin-key header or the httpOnly
// dr_admin_session cookie set at login. If the header key is stale but the session
// cookie is valid, returns the current key so the client can repair localStorage
// (a stale stored key made every Content panel 401 and show "0 items").
export async function GET(req) {
  const adminKey = process.env.ADMIN_KEY || ''
  if (!adminKey) return Response.json({ ok: false, error: 'ADMIN_KEY not configured' }, { status: 500 })
  const header = req.headers.get('x-admin-key') || ''
  if (header && header === adminKey) return Response.json({ ok: true, via: 'key' })
  const cookieStore = await cookies()
  const session = cookieStore.get('dr_admin_session')?.value || ''
  if (session && session === adminKey) {
    return Response.json({ ok: true, via: 'session', adminKey, repaired: !!header })
  }
  return Response.json({ ok: false, error: header ? 'Admin key rejected' : 'Not signed in' }, { status: 401 })
}
