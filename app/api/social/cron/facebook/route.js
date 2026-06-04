export const dynamic   = 'force-dynamic'
export const maxDuration = 120

import { runSocialAgent } from '../../../../../agent/social/socialAgent.js'
import { createClient }   from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const key  = req.headers.get('x-admin-key')
  const cron = req.headers.get('authorization')
  return key === process.env.ADMIN_KEY || cron === 'Bearer ' + process.env.CRON_SECRET
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  // Load per-platform count from config
  const config = await sanity.fetch(`*[_type == "socialConfig"][0]{"count": platforms_config.facebook.postsPerRun}`).catch(() => null)
  const count  = config?.count ?? 1
  const result = await runSocialAgent({ platform: 'facebook', count }).catch(e => ({ ok: false, error: e.message }))
  return Response.json(result)
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body   = await req.json().catch(() => ({}))
  const result = await runSocialAgent({ platform: 'facebook', count: body.count ?? 2, dryRun: body.dryRun ?? false }).catch(e => ({ ok: false, error: e.message }))
  return Response.json(result)
}
