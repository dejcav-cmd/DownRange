import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const sanity = createClient({
  projectId: 'vbnsqnkg', dataset: 'production',
  apiVersion: '2024-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false,
})

export async function POST(req) {
  if (req.headers.get('x-admin-key') !== process.env.ADMIN_KEY)
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  // 1. Expire all giveaways with endDate in the past
  const expired = await sanity.fetch(
    `*[_type=="giveaway" && active==true && defined(endDate) && endDate < $today]{_id, title, endDate}`,
    { today }
  )

  if (expired.length > 0) {
    await sanity.mutate(expired.map(g => ({ patch: { id: g._id, set: { active: false } } })))
  }

  // 2. Fetch current active count
  const active = await sanity.fetch(
    `count(*[_type=="giveaway" && active==true])`, {}
  )

  return NextResponse.json({
    ok: true,
    today,
    expired: expired.length,
    expiredItems: expired.map(g => ({ id: g._id, title: g.title?.slice(0, 60), endDate: g.endDate })),
    activeRemaining: active,
  })
}
