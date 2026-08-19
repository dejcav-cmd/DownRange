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

  // Load config — platforms_config is stored as JSON string in Sanity
  const raw = await sanity.fetch(`*[_type == "socialConfig"][0]{platforms_config_json}`).catch(() => null)
  let platformCfg = {}
  if (raw?.platforms_config_json) {
    try { platformCfg = JSON.parse(raw.platforms_config_json) } catch {}
  }

  const cfg = platformCfg['facebook'] || {}

  // Only run if this platform is explicitly enabled in the scheduler
  if (!cfg.enabled) {
    return Response.json({ ok: true, skipped: true, reason: 'facebook is not enabled in the scheduler' })
  }

  const count  = cfg.postsPerRun ?? 1
  const result = await runSocialAgent({ platform: 'facebook', count }).catch(e => ({ ok: false, error: e.message }))
  return Response.json(result)
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body   = await req.json().catch(() => ({}))
  const result = await runSocialAgent({ platform: 'facebook', count: body.count ?? 2, dryRun: body.dryRun ?? false }).catch(e => ({ ok: false, error: e.message }))
  return Response.json(result)
}


