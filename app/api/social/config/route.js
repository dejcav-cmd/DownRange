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

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const config = await sanity.fetch(`*[_type == "socialConfig"][0]`).catch(() => null)
  // Check which platform env vars are configured
  const configured = {
    twitter:   !!(process.env.ZERNIO_API_KEY && process.env.ZERNIO_TWITTER_ACCOUNT_ID), // paid ~$18/mo
    facebook:  !!(process.env.FACEBOOK_PAGE_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID),
    threads:   !!(process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID),
    bluesky:   !!(process.env.BLUESKY_HANDLE && process.env.BLUESKY_APP_PASSWORD),
    instagram: !!(process.env.INSTAGRAM_ACCESS_TOKEN),
    reddit:    !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET && process.env.REDDIT_USERNAME && process.env.REDDIT_PASSWORD),
  }
  return Response.json({ ok: true, config: config || {}, configured })
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const existing = await sanity.fetch(`*[_type == "socialConfig"][0]._id`).catch(() => null)
  let saved
  if (existing) {
    saved = await sanity.patch(existing).set(body).commit()
  } else {
    saved = await sanity.create({ _type: 'socialConfig', ...body })
  }
  return Response.json({ ok: true, config: saved })
}
