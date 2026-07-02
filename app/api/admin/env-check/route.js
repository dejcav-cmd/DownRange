export const dynamic = 'force-dynamic'

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// ── Every env var used anywhere in the codebase ────────────────────────────
const ALL_VARS = [

  // ── CRITICAL — app breaks without these ──────────────────────────────────
  {
    key: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
    group: 'Sanity CMS',
    critical: true,
    desc: 'Sanity project ID. All CMS reads fail without this.',
    howTo: 'sanity.io → your project → Settings → API → Project ID',
  },
  {
    key: 'SANITY_API_TOKEN',
    group: 'Sanity CMS',
    critical: true,
    desc: 'Sanity write token. Cron jobs cannot save articles without this.',
    howTo: 'sanity.io → your project → Settings → API → Tokens → Add Editor token',
  },
  {
    key: 'ANTHROPIC_API_KEY',
    group: 'AI',
    critical: true,
    desc: 'Claude API key. Article rewrites, intelligence briefings, outreach drafts all fail without this.',
    howTo: 'console.anthropic.com → API Keys → Create Key',
  },
  {
    key: 'ADMIN_KEY',
    group: 'Auth',
    critical: true,
    desc: 'Admin portal password. Set to any strong secret — this is what you type to log in.',
    howTo: 'Set to any strong secret string (e.g. a random 32-char password)',
  },
  {
    key: 'RESEND_API_KEY',
    group: 'Email',
    critical: true,
    desc: 'Resend email API. Outreach emails, newsletter, system alerts all fail without this.',
    howTo: 'resend.com → API Keys → Create API Key',
  },

  // ── CRITICAL — Clerk auth ─────────────────────────────────────────────────
  {
    key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    group: 'Auth (Clerk)',
    critical: true,
    desc: 'Clerk publishable key. Admin login page needs this for Google + email/password auth.',
    howTo: 'clerk.com → your app → API Keys → Publishable Key (starts with pk_live_...)',
  },
  {
    key: 'CLERK_SECRET_KEY',
    group: 'Auth (Clerk)',
    critical: true,
    desc: 'Clerk secret key. Server-side auth verification fails without this.',
    howTo: 'clerk.com → your app → API Keys → Secret Key (starts with sk_live_...)',
  },

  // ── HIGH PRIORITY — major features degrade ───────────────────────────────
  {
    key: 'CRON_SECRET',
    group: 'Cron Jobs',
    critical: false,
    priority: 'high',
    desc: 'Secures all 15 cron job endpoints. Without it anyone can trigger them.',
    howTo: 'Set to any strong random string. Must match what Vercel sends in cron Authorization header.',
    note: '⚠ WARNING: Setting CRON_SECRET breaks admin UI routes — use ADMIN_KEY for those instead.',
  },
  {
    key: 'UPSTASH_REDIS_REST_URL',
    group: 'Redis / Caching',
    critical: false,
    priority: 'high',
    desc: 'Upstash Redis URL. Pull log, cron run history, and rate limiting fall back to memory without this.',
    howTo: 'upstash.com → Create Database → REST API → UPSTASH_REDIS_REST_URL',
  },
  {
    key: 'UPSTASH_REDIS_REST_TOKEN',
    group: 'Redis / Caching',
    critical: false,
    priority: 'high',
    desc: 'Upstash Redis auth token. Required with UPSTASH_REDIS_REST_URL.',
    howTo: 'upstash.com → your database → REST API → UPSTASH_REDIS_REST_TOKEN',
  },

  // ── MEDIUM — content sources ──────────────────────────────────────────────
  {
    key: 'NEWSAPI_KEY',
    group: 'News Sources',
    critical: false,
    priority: 'medium',
    desc: 'NewsAPI.org. Adds major outlet articles to news feed. Falls back to RSS-only without it.',
    howTo: 'newsapi.org → Get API Key (free tier: 100 req/day)',
  },
  {
    key: 'GNEWS_KEY',
    group: 'News Sources',
    critical: false,
    priority: 'medium',
    desc: 'GNews API. Adds additional news articles. Optional fallback source.',
    howTo: 'gnews.io → Get API Key (free tier: 100 req/day)',
  },
  {
    key: 'LEGISCAN_KEY',
    group: 'News Sources',
    critical: false,
    priority: 'medium',
    desc: 'LegiScan API. Powers state legislation feed. Without it laws feed uses Congress.gov only.',
    howTo: 'legiscan.com → API → Register for free key',
  },
  {
    key: 'CONGRESS_GOV_KEY',
    group: 'News Sources',
    critical: false,
    priority: 'medium',
    desc: 'Congress.gov API key. Federal bill tracking. Public but limited without a key.',
    howTo: 'api.congress.gov → Request API Key (free)',
  },
  {
    key: 'YOUTUBE_API_KEY',
    group: 'News Sources',
    critical: false,
    priority: 'medium',
    desc: 'YouTube Data API v3. Live video feed. Falls back to RSS-only without it.',
    howTo: 'console.cloud.google.com → Enable YouTube Data API v3 → Create API Key',
  },

  // ── MEDIUM — search ───────────────────────────────────────────────────────
  {
    key: 'ALGOLIA_APP_ID',
    group: 'Search (Algolia)',
    critical: false,
    priority: 'medium',
    desc: 'Algolia App ID. Site search fails without this + keys.',
    howTo: 'algolia.com → your app → Settings → API Keys → Application ID',
  },
  {
    key: 'ALGOLIA_ADMIN_KEY',
    group: 'Search (Algolia)',
    critical: false,
    priority: 'medium',
    desc: 'Algolia Admin API Key. Required for indexing new articles.',
    howTo: 'algolia.com → your app → Settings → API Keys → Admin API Key',
  },
  {
    key: 'NEXT_PUBLIC_ALGOLIA_APP_ID',
    group: 'Search (Algolia)',
    critical: false,
    priority: 'medium',
    desc: 'Algolia App ID (client-side). Same value as ALGOLIA_APP_ID but exposed to browser.',
    howTo: 'Same value as ALGOLIA_APP_ID',
  },
  {
    key: 'NEXT_PUBLIC_ALGOLIA_SEARCH_KEY',
    group: 'Search (Algolia)',
    critical: false,
    priority: 'medium',
    desc: 'Algolia Search-Only API Key (public). Used in the browser for the search bar.',
    howTo: 'algolia.com → your app → Settings → API Keys → Search-Only API Key',
  },

  // ── LOW — optional enhancements ───────────────────────────────────────────
  {
    key: 'GOOGLE_PLACES_API_KEY',
    group: 'Google APIs',
    critical: false,
    priority: 'low',
    desc: 'Google Places API. Powers live range search. Map shows without it but no live lookups.',
    howTo: 'console.cloud.google.com → Enable Places API → Create restricted API Key',
  },
  {
    key: 'DISCORD_WEBHOOK_URL',
    group: 'Notifications',
    critical: false,
    priority: 'low',
    desc: 'Discord webhook for cron job alerts and breaking news pings.',
    howTo: 'Discord server → channel settings → Integrations → Webhooks → New Webhook',
  },
  {
    key: 'DISCORD_BREAKING_WEBHOOK',
    group: 'Notifications',
    critical: false,
    priority: 'low',
    desc: 'Separate Discord webhook for breaking news alerts specifically.',
    howTo: 'Same as DISCORD_WEBHOOK_URL but point to a different channel',
  },
  {
    key: 'DISCORD_ERRORS_WEBHOOK',
    group: 'Notifications',
    critical: false,
    priority: 'low',
    desc: 'Discord webhook for error alerts. Separate channel from general alerts.',
    howTo: 'Point to a #errors Discord channel webhook',
  },
  {
    key: 'MAILERLITE_API_KEY',
    group: 'Email',
    critical: true,
    priority: 'high',
    desc: 'MailerLite v2 API key for subscriber list management (subscribe, unsubscribe, newsletter send).',
    howTo: 'connect.mailerlite.com → Integrations → API → Create token',
  },
  {
    key: 'MAILERLITE_GROUP_ID',
    group: 'Email',
    critical: false,
    priority: 'high',
    desc: 'MailerLite group ID for the DownRange subscriber list.',
    howTo: 'connect.mailerlite.com → Subscribers → Groups → copy the group ID',
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    group: 'Configuration',
    critical: false,
    priority: 'low',
    desc: 'Full site URL. Used for absolute URLs in emails and OG tags.',
    howTo: 'Set to: https://www.downrangeco.com',
  },
  {
    key: 'REVALIDATE_SECRET',
    group: 'Configuration',
    critical: false,
    priority: 'low',
    desc: 'ISR cache revalidation secret. Used to bust Next.js page cache after content updates.',
    howTo: 'Set to any strong random string',
  },
  {
    key: 'SANITY_WEBHOOK_SECRET',
    group: 'Sanity CMS',
    critical: false,
    priority: 'low',
    desc: 'Sanity webhook signature verification. Optional but recommended.',
    howTo: 'sanity.io → your project → API → Webhooks → set a secret',
  },
  {
    key: 'GOOGLE_SITE_VERIFICATION',
    group: 'SEO',
    critical: false,
    priority: 'low',
    desc: 'Google Search Console verification meta tag value.',
    howTo: 'search.google.com/search-console → Add property → HTML tag method → copy the content value',
  },
]

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = ALL_VARS.map(v => ({
    ...v,
    set: !!process.env[v.key],
    // Hint at value format (first 4 chars only, never expose full value)
    hint: process.env[v.key]
      ? process.env[v.key].slice(0, 4) + '****'
      : null,
  }))

  const groups = {}
  for (const v of results) {
    if (!groups[v.group]) groups[v.group] = []
    groups[v.group].push(v)
  }

  const summary = {
    total:    results.length,
    set:      results.filter(v => v.set).length,
    missing:  results.filter(v => !v.set).length,
    critMissing:   results.filter(v => v.critical && !v.set).map(v => v.key),
    highMissing:   results.filter(v => !v.critical && v.priority === 'high' && !v.set).map(v => v.key),
    medMissing:    results.filter(v => v.priority === 'medium' && !v.set).map(v => v.key),
  }

  return Response.json({ ok: true, summary, groups, vars: results })
}
