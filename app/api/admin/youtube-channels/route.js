import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const k = req.headers.get('x-admin-key')
  return k && k === process.env.ADMIN_KEY
}

const CONFIG_ID = 'youtube-channel-config'

// Fetch channels from Sanity (stored as a singleton config doc)
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const doc = await sanity.fetch(
      '*[_id == $id][0]{ channels }',
      { id: CONFIG_ID }
    )
    return Response.json({ ok: true, channels: doc?.channels || [] })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { action, channels, channel } = body

    // Save full channel list
    if (action === 'save') {
      await sanity
        .createOrReplace({
          _id:      CONFIG_ID,
          _type:    'siteConfig',
          channels: channels || [],
        })
      return Response.json({ ok: true })
    }

    // Add single channel
    if (action === 'add') {
      const doc = await sanity.fetch('*[_id == $id][0]', { id: CONFIG_ID })
      const existing = doc?.channels || []
      const updated = [...existing, { ...channel, id: 'ch' + Date.now(), active: true }]
      await sanity.createOrReplace({ _id: CONFIG_ID, _type: 'siteConfig', channels: updated })
      return Response.json({ ok: true, channels: updated })
    }

    // Toggle active
    if (action === 'toggle') {
      const { id } = body
      const doc = await sanity.fetch('*[_id == $id][0]', { id: CONFIG_ID })
      const updated = (doc?.channels || []).map(c => c.id === id ? { ...c, active: !c.active } : c)
      await sanity.createOrReplace({ _id: CONFIG_ID, _type: 'siteConfig', channels: updated })
      return Response.json({ ok: true, channels: updated })
    }

    // Remove channel
    if (action === 'remove') {
      const { id } = body
      const doc = await sanity.fetch('*[_id == $id][0]', { id: CONFIG_ID })
      const updated = (doc?.channels || []).filter(c => c.id !== id)
      await sanity.createOrReplace({ _id: CONFIG_ID, _type: 'siteConfig', channels: updated })
      return Response.json({ ok: true, channels: updated })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
