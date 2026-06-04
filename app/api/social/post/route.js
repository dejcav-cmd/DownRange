export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { runSocialAgent } from '../../../../agent/social/socialAgent.js'

function auth(req) {
  const key  = req.headers.get('x-admin-key')
  const cron = req.headers.get('authorization')
  return key === process.env.ADMIN_KEY || cron === 'Bearer ' + process.env.CRON_SECRET
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body    = await req.json().catch(() => ({}))
    const platforms = body.platforms || ['bluesky']
    const count     = body.count ?? 2
    const dryRun    = body.dryRun ?? false

    // Run each platform sequentially
    const allResults = []
    let totalPosted  = 0
    for (const platform of platforms) {
      const result = await runSocialAgent({ platform, count, dryRun, forceArticleId: body.articleId })
      totalPosted += result.posted || 0
      allResults.push(...(result.results || []))
    }
    return Response.json({ ok: true, posted: totalPosted, total: allResults.length, results: allResults, dryRun })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
