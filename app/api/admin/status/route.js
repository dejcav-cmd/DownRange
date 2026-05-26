export const dynamic = 'force-dynamic'
/**
 * GET /api/admin/status
 * Returns env var health check (no secrets exposed) and last Sanity article timestamp.
 * No auth required — only shows boolean presence of vars, never values.
 */
import { client } from '../../../../sanity/lib/client'

export async function GET() {
  const envCheck = {
    CRON_SECRET:                   !!process.env.CRON_SECRET,
    SANITY_API_TOKEN:              !!process.env.SANITY_API_TOKEN,
    NEXT_PUBLIC_SANITY_PROJECT_ID: !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    ANTHROPIC_API_KEY:             !!process.env.ANTHROPIC_API_KEY,
    RESEND_API_KEY:                !!process.env.RESEND_API_KEY,
    YOUTUBE_API_KEY:               !!process.env.YOUTUBE_API_KEY,
    GOOGLE_PLACES_API_KEY:         !!process.env.GOOGLE_PLACES_API_KEY,
    NEWSAPI_KEY:                   !!process.env.NEWSAPI_KEY,
    ALGOLIA_APP_ID:                !!process.env.ALGOLIA_APP_ID,
  }

  let latestArticle = null
  let sanityError   = null
  let articleCount  = 0
  try {
    const result = await client.fetch(`
      *[_type == "newsArticle"] | order(publishedAt desc) [0] {
        title, publishedAt, _createdAt
      }
    `)
    latestArticle = result
    const count = await client.fetch(`count(*[_type == "newsArticle"])`)
    articleCount = count
  } catch (err) {
    sanityError = err.message
  }

  const missingCritical = Object.entries(envCheck)
    .filter(([k, v]) => !v && ['CRON_SECRET','SANITY_API_TOKEN','NEXT_PUBLIC_SANITY_PROJECT_ID'].includes(k))
    .map(([k]) => k)

  return Response.json({
    ok: missingCritical.length === 0,
    timestamp: new Date().toISOString(),
    envVars: envCheck,
    missingCritical,
    sanity: {
      connected: !sanityError,
      error: sanityError,
      articleCount,
      latestArticle,
    },
    cronAuth: envCheck.CRON_SECRET
      ? 'CRON_SECRET is set — cron jobs should authenticate correctly'
      : 'CRON_SECRET is MISSING — all cron jobs will return 401 Unauthorized',
  })
}
