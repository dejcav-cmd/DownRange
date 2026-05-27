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
