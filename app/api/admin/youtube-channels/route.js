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

// Upsert helper — works even if doc doesn't exist yet
async function upsertChannels(channels) {
  // Try patch first; if doc missing, create it
  try {
    await sanity.createIfNotExists({ _id: CONFIG_ID, _type: 'videoChannelConfig', channels: [] })
    await sanity.patch(CONFIG_ID).set({ channels }).commit()
  } catch (e) {
    throw new Error('Sanity upsert failed: ' + e.message)
  }
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const doc = await sanity.fetch('*[_id == $id][0]{ channels }', { id: CONFIG_ID })
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

    if (action === 'save') {
      const prev = await sanity.fetch('*[_id == $id][0]{channels}', { id: CONFIG_ID })
      const prevMap = Object.fromEntries((prev?.channels || []).map(c => [c.id, c.active !== false]))
      await upsertChannels(channels || [])

      // Sync video active state for any channels whose active flag changed
      for (const ch of (channels || [])) {
        const wasActive = prevMap[ch.id] ?? true
        const isActive  = ch.active !== false
        if (wasActive === isActive) continue
        // Find the channelId (the YouTube channel ID used in video docs)
        const ytId = ch.channelId || ch.id
        const name = ch.name
        // Get all videos for this channel
        const vids = await sanity.fetch(
          `*[_type == "video" && (channelId == $ytId || channelName == $name)]{_id}`,
          { ytId, name }
        )
        if (!vids.length) continue
        const mutations = vids.map(v => ({ patch: { id: v._id, set: { active: isActive } } }))
        // Batch in 100s
        for (let i = 0; i < mutations.length; i += 100) {
          await sanity.mutate(mutations.slice(i, i + 100))
        }
        console.log(`[channels] ${isActive ? 'Activated' : 'Deactivated'} ${vids.length} videos for ${name}`)
      }

      return Response.json({ ok: true })
    }

    if (action === 'add') {
      const doc = await sanity.fetch('*[_id == $id][0]', { id: CONFIG_ID })
      const existing = doc?.channels || []
      const updated = [...existing, { ...channel, id: 'ch' + Date.now(), active: true }]
      await upsertChannels(updated)
      return Response.json({ ok: true, channels: updated })
    }

    if (action === 'toggle') {
      const { id } = body
      const doc = await sanity.fetch('*[_id == $id][0]', { id: CONFIG_ID })
      const updated = (doc?.channels || []).map(c => c.id === id ? { ...c, active: !c.active } : c)
      await upsertChannels(updated)
      return Response.json({ ok: true, channels: updated })
    }

    if (action === 'remove') {
      const { id } = body
      const doc = await sanity.fetch('*[_id == $id][0]', { id: CONFIG_ID })
      const updated = (doc?.channels || []).filter(c => c.id !== id)
      await upsertChannels(updated)
      return Response.json({ ok: true, channels: updated })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
