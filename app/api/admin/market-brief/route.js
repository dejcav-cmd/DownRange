export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

function auth(req) {
  const key = req.headers.get('x-admin-key')
  return key === ADMIN_KEY
}

export async function PATCH(req) {
  if (!auth(req)) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const { id, data } = await req.json()
  if (!id || !data) return NextResponse.json({ error:'Missing id or data' }, { status:400 })

  // Convert bullets from newline-separated string back to array
  const bullets = typeof data.bullets === 'string'
    ? data.bullets.split('\n').map(b => b.trim()).filter(Boolean)
    : (data.bullets || [])

  await sanity.patch(id).set({
    title:       data.title?.trim(),
    summary:     data.summary?.trim(),
    bullets,
    signal:      data.signal,
    signalReason:data.signalReason?.trim(),
  }).commit()

  return NextResponse.json({ ok: true })
}

export async function DELETE(req) {
  if (!auth(req)) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error:'Missing id' }, { status:400 })
  await sanity.delete(id)
  return NextResponse.json({ ok: true })
}
