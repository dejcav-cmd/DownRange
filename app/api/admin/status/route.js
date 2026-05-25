export const dynamic = 'force-dynamic'

export async function GET(req) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const keys = {
    ANTHROPIC_API_KEY:   !!process.env.ANTHROPIC_API_KEY,
    SANITY_API_TOKEN:    !!process.env.SANITY_API_TOKEN,
    RESEND_API_KEY:      !!process.env.RESEND_API_KEY,
    ALGOLIA_ADMIN_KEY:   !!process.env.ALGOLIA_ADMIN_KEY,
    YOUTUBE_API_KEY:     !!process.env.YOUTUBE_API_KEY,
    DISCORD_WEBHOOK_URL: !!process.env.DISCORD_WEBHOOK_URL,
    NEWSAPI_KEY:         !!process.env.NEWSAPI_KEY,
    GNEWS_KEY:           !!process.env.GNEWS_KEY,
    LEGISCAN_KEY:        !!process.env.LEGISCAN_KEY,
  }
  return Response.json({ keys, timestamp: new Date().toISOString() })
}
