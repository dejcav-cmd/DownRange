export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { runSocialAgent } from '../../../../agent/social/socialAgent.js'
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

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body      = await req.json().catch(() => ({}))
    const platforms = body.platforms || ['bluesky']
    const count     = body.count ?? 2
    const dryRun    = body.dryRun ?? false

    // RETRY mode: look up the article from the failed socialPost doc
    let forceArticleId = body.articleId || null
    if (body.retryDocId && !forceArticleId) {
      const failedDoc = await sanity.fetch(
        `*[_type == "socialPost" && _id == $id][0]{ articleSlug, platform }`,
        { id: body.retryDocId }
      ).catch(() => null)
      if (failedDoc?.articleSlug) {
        // Find the newsArticle or blogPost by slug
        const article = await sanity.fetch(
          `*[((_type == "newsArticle" || _type == "blogPost") && slug.current == $slug)][0]{ _id }`,
          { slug: failedDoc.articleSlug }
        ).catch(() => null)
        if (article?._id) forceArticleId = article._id
      }
    }

    const allResults = []
    let totalPosted  = 0
    for (const platform of platforms) {
      const result = await runSocialAgent({ platform, count, dryRun, forceArticleId })
      totalPosted += result.posted || 0
      allResults.push(...(result.results || []))
    }
    return Response.json({ ok: true, posted: totalPosted, total: allResults.length, results: allResults, dryRun })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
