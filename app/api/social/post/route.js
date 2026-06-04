export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { runSocialAgent } from '../../../../agent/social/socialAgent.js'

function auth(req) {
  const key = req.headers.get('x-admin-key')
  const cron = req.headers.get('authorization')
  return key === process.env.ADMIN_KEY || cron === 'Bearer ' + process.env.CRON_SECRET
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const result = await runSocialAgent({
      platforms:      body.platforms,
      dryRun:         body.dryRun || false,
      forceArticleId: body.articleId || null,
    })
    return Response.json(result)
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  // Cron-triggered auto-post
  try {
    const result = await runSocialAgent()
    return Response.json(result)
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
