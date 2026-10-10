export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { runSocialAgent } from '../../../../../agent/social/socialAgent.js'
import { createClient }   from '@sanity/client'
import { withCronReport } from '../../../../../lib/withCronReport'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

const DEFAULT_PLATFORMS = ['facebook', 'instagram', 'twitter', 'threads', 'bluesky', 'reddit']

function auth(req) {
  const key  = req.headers.get('x-admin-key')
  const cron = req.headers.get('authorization')
  return key === process.env.ADMIN_KEY || cron === 'Bearer ' + process.env.CRON_SECRET
}

// Timed social posting. A blog post or news article with `socialScheduleAt` set is held out of the
// regular social crons (see fetchCandidates) and posted here, to every listed platform, once that
// time has passed. `socialScheduleDone` is set BEFORE posting so a slow run can never double-post.
async function _GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const due = await sanity.fetch(
    `*[_type in ["blogPost","newsArticle"] && defined(socialScheduleAt) && socialScheduleAt <= now()
       && socialScheduleDone != true && !(_id in path("drafts.**"))]{
      _id, title, "slug": slug.current, socialSchedulePlatforms
    }`
  ).catch(() => [])

  if (!due.length) return Response.json({ ok: true, due: 0 })

  const out = []
  for (const doc of due) {
    await sanity.patch(doc._id).set({ socialScheduleDone: true, socialScheduleStartedAt: new Date().toISOString() }).commit()
    const platforms = (doc.socialSchedulePlatforms && doc.socialSchedulePlatforms.length) ? doc.socialSchedulePlatforms : DEFAULT_PLATFORMS
    const results = []
    for (const platform of platforms) {
      const r = await runSocialAgent({ platform, count: 1, forceArticleId: doc._id }).catch(e => ({ ok: false, error: e.message }))
      results.push({ platform, posted: r.posted || 0, error: r.error || r.results?.[0]?.error || null })
    }
    out.push({ slug: doc.slug, results })
  }
  return Response.json({ ok: true, due: due.length, out })
}

export const GET = withCronReport('social-scheduled', _GET)
