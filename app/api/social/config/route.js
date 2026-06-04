export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

function parseConfig(raw) {
  if (!raw) return {}
  // Deserialize platforms_config from JSON string
  const config = { ...raw }
  if (config.platforms_config_json) {
    try { config.platforms_config = JSON.parse(config.platforms_config_json) } catch {}
    delete config.platforms_config_json
  }
  return config
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const raw = await sanity.fetch(`*[_type == "socialConfig"][0]`).catch(() => null)
  const config = parseConfig(raw)
  const configured = {
    twitter:   !!(process.env.ZERNIO_API_KEY && process.env.ZERNIO_TWITTER_ACCOUNT_ID),
    facebook:  !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
    threads:   !!(process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID),
    bluesky:   !!(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD),
    instagram: !!(process.env.INSTAGRAM_ACCESS_TOKEN),
    reddit:    !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD),
  }
  return Response.json({ ok: true, config, configured })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  // Strip Sanity internal fields — never send these in a patch
  const { _id, _type, _rev, _createdAt, _updatedAt, platforms_config, ...rest } = body

  // Serialize platforms_config to JSON string for storage
  const patch = {
    ...rest,
    ...(platforms_config ? { platforms_config_json: JSON.stringify(platforms_config) } : {}),
  }

  const existing = await sanity.fetch(`*[_type == "socialConfig"][0]._id`).catch(() => null)
  let saved
  if (existing) {
    saved = await sanity.patch(existing).set(patch).commit()
  } else {
    saved = await sanity.create({ _type: 'socialConfig', ...patch })
  }

  return Response.json({ ok: true, config: parseConfig(saved) })
}
