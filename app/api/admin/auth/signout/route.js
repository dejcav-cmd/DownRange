export const dynamic = 'force-dynamic'
import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('dr_admin_session')
  return Response.json({ ok: true })
}
