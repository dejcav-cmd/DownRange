# DownRange Portal — Development Skill File
Last updated: 2026-06-29 (stable commit: 9f4600f)

## Project Overview
Next.js 14.2 firearms intelligence portal. downrangeco.com.
Repo: github.com/dejcav-cmd/DownRange (branch: main)
Vercel project: down-range-indol
Git push: https://dejcav-cmd:[GITHUB_TOKEN]@github.com/dejcav-cmd/DownRange.git
Author: DJ Cavalcanti (dj@downrangeco.com)

## Stack
- Next.js 14.2.29 App Router
- Sanity v3 (projectId: vbnsqnkg, dataset: production)
- Clerk (auth), Resend (email, lazy init), Algolia (search, lazy init), Upstash Redis (pull log + cronReporter fallback)
- Vercel Pro (auto-deploy on push to main, maxDuration: 300s)
- Anthropic Claude API + AI cost router lib/ai-router.js (never call model directly)
- .npmrc MUST have legacy-peer-deps=true — Clerk 6.12.0 peer dep conflicts

## Design System
- Dark theme: background #09090B, gold #C8922A
- Fonts: Bebas Neue (headlines), IBM Plex Mono (code/meta), Barlow Condensed (subheads), IBM Plex Sans (body)
- NEVER hardcode hex colors — use var(--gold), var(--border), var(--bg), var(--bg2), var(--text), var(--text-muted), var(--text-dim)
- NEVER use bare 'monospace' — always "'IBM Plex Mono', monospace"
- Patterns: .page-hero, .dr-card, .dr-card-accent, .dr-section, .dr-section-title, .container, .dr-grid-2/3/4/auto
- All component classes documented in DESIGN_SYSTEM.md in repo root

## Critical Rules
1. 'use client' MUST be at the top of its own file — never mid-file, never in server components
2. Client component pages needing metadata: split into page.js (server wrapper) + PageClient.js
3. No event handlers in server components (no onClick, onMouseEnter etc.)
4. All API routes need: export const dynamic = 'force-dynamic'
5. Admin UI routes: use ADMIN_KEY only (NOT CRON_SECRET)
6. Always use double quotes for JSX strings containing apostrophes — caused 3 separate build failures
7. Build-verify after every change: npm run build must show 125/125 pages
8. Never create a nested layout.js — root layout covers all pages
9. BreakingTicker is MANDATORY on all public pages. Server components: fetchBreakingAlerts prop. Client components: alerts={[]}. Suppress on /admin routes.
10. Seed data pattern: every page must have const display = live.length > 0 ? live : SEED_DATA
11. useCdn: false on ALL slug/detail pages — useCdn: true causes 403 on Canada/Brazil article pages
12. @sanity/client NEVER imported in 'use client' components — server components or API routes only
13. newsArticle uses export default; ALL other schemas use export const (named). Mixing crashes schema registry
14. newsArticle status: uses defined(slug.current) && defined(publishedAt) — no status field. Do NOT add status guard
15. blogPost status: uses status == "published" — this schema HAS a status field
16. Writing style: must sound like a real gun owner. BANNED: comprehensive, robust, leverage, seamlessly, empower, game-changer
17. Image sourcing: NEVER hotlink Unsplash/Pexels. All images: OG scrape -> Sanity CDN upload -> pickPhoto fallback
18. AmmoLand RSS is cat:'deals' — LOCKED. Never appears in news feed, only in /deals

## Cron System — CRITICAL RULES

### Mandatory for every cron route:
Every cron route MUST call reportCronRun in BOTH success and failure paths.
Any cron without it shows as NEVER RUN in Mission Control — even if it executes fine.

import { reportCronRun } from '@/lib/cronReporter'

const t0 = Date.now()
try {
  // ... work ...
  await reportCronRun('job-name', { status: 'success', ms: Date.now() - t0 })
  return NextResponse.json({ ok: true })
} catch (err) {
  await reportCronRun('job-name', { status: 'failed', ms: Date.now() - t0, error: err.message })
  return NextResponse.json({ error: err.message }, { status: 500 })
}

### Schedule sync rule:
Every new cron MUST be in BOTH:
1. vercel.json crons array (what actually runs)
2. ALL_JOBS array in app/api/admin/cron-status/route.js (what dashboard monitors)
Schedule strings MUST match exactly. Mismatch = false OVERDUE alerts.

### Vercel cron auth check (both paths required):
const isVercel = req.headers.get('x-vercel-cron') === '1'
const isAuth = req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
if (!isVercel && !isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

### Releases feed — PRESERVE 240s deadline guard:
agent/feeds/releases.js queries 50+ Google News brand searches x 8s AbortSignal.timeout = 400s+.
Without the deadline guard, Vercel kills the function (300s maxDuration) before reportCronRun fires.
The deadlineMs parameter in fetchAllGoogleNews(deadlineMs) is NOT dead code — keep it.

### Mission Control status:
- HEALTHY — ran within interval x 2.5
- OVERDUE — last run > interval x 2.5 ago (check vercel.json vs ALL_JOBS schedule match)
- FAILING — last reportCronRun had status: 'failed'
- NEVER RUN — no cronRun doc in Sanity (reportCronRun was never called)

### Active cron schedules (vercel.json is source of truth):
/api/agent?feed=news              */15 * * * *
/api/agent?feed=laws              0 */2 * * *
/api/agent?feed=releases          45 */6 * * *
/api/agent?feed=market            */30 * * * *
/api/agent?feed=video             0 */4 * * *
/api/agent?feed=state             0 8 * * *
/api/agent?feed=canada            10 */12 * * *
/api/agent?feed=brazil            20 */12 * * *
/api/quality-rewrite              10 */6 * * *
/api/newsletter                   0 7 * * *
/api/nics                         0 10 1 * *
/api/cron/gun-deals               5 * * * *
/api/cron/sitemap                 0 2 * * *
/api/cron/carry-insurance         0 6 * * 1
/api/cron/fix-placeholder-images  0 * * * *
/api/admin/cron-health            */30 * * * *

Stagger all new crons >=2 min from existing schedules to prevent Sanity API burst.

## Ballistics Calculator
- Location: app/ballistics/page.js (server, metadata + JSON-LD) + app/ballistics/BallisticsCalc.js ('use client')
- G1 engine, forward Euler 0.5ft steps, Bryan Litz drag table (7-zone), lag-rule wind drift
- BC conversion: bc_slug = bc_lb_in2 * 7000 / (32.174 * 144)
- 38 caliber presets, 9 categories via select/optgroup (NOT button grid)
- CAT_ORDER: ['Rimfire','Pistol','Intermediate','Hunting','Precision','PRC','Magnum','Specialty','Custom']
- PRC family: 6.5 PRC 143gr ELD-X (bc:0.623), 7mm PRC 175gr ELD-X (bc:0.689), .300 PRC 225gr ELD-M (bc:0.777), .338 PRC 270gr ELD-M (bc:0.796)
- Compare mode: toggle shows dual Load A/B inputs, dual SVG trajectory lines (gold/blue dashed), B columns + Delta Path column in table

## SEO Architecture
- app/sitemap.js — nightly regen via /api/cron/sitemap at 2am UTC
- State hub URLs MUST use 2-letter codes: US_STATE_CODES array ['AL','AK',...] -> /state-hub/AL
  NEVER full state names — the route uses STATE_NAMES = { AL:'Alabama' }, not path matching
  Using full names ('ALABAMA') caused all 50 state law pages to be invisible to Google crawlers
- All 50+ static pages registered in STATIC_PAGES array in sitemap.js
- Sanity fetches: single Promise.all([articles, blogPosts, releases]) — no sequential awaits

JSON-LD patterns by page type:
- Tool/calculator pages -> SoftwareApplication or WebApplication + BreadcrumbList
- FAQ pages -> FAQPage + BreadcrumbList (eligible for FAQ rich results in SERPs)
- Data/reference pages -> Dataset + BreadcrumbList
- Inject before Masthead: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

Pages with JSON-LD (as of 9f4600f):
/ballistics (SoftwareApplication), /ranges (WebApplication), /nfa-tracker (WebApplication + FAQPage),
/carry-insurance (FAQPage), /laws (Dataset), /market (WebPage)

## AI Cost Router (lib/ai-router.js)
Never call AI model directly. Always route through lib/ai-router.js by useCase:
- bulk-rewrite    -> GLM-4.5 Air       (high-volume article rewrites, 4x/day)
- classification  -> GLM-4.5 nano      (feed classification, topic tagging)
- enrichment      -> GLM-4.7           (quality enrichment, summaries)
- validation      -> claude-haiku      (gun releases validation, 41 manufacturer sources)
- generation      -> claude-sonnet     (blog generation, complex outputs)

## GA4 — MANDATORY
- GA_ID = G-KDGZX3CLEC
- Hardcoded in app/layout.js via next/script (strategy="afterInteractive")
- Two scripts: gtag/js loader + inline init
- PageViewTracker.js fires on every SPA route change
- NEVER use env var conditional (bakes empty at build time)
- NEVER add GA to individual pages — root layout covers everything
- NEVER create nested layout.js that bypasses root

## Articles — MANDATORY FORMAT
- 900-1100 words minimum, non-negotiable
- 5 h2 sections: opener, Background & Context, What This Means for Gun Owners, Industry & Market Impact, What to Watch Next
- DownRange Bottom Line paragraph
- max_tokens: 4000, input content: 3000 chars
- Sanity body field = type 'text' (HTML string, NOT Portable Text)
- Backfill: POST /api/admin/backfill-articles

## Image System (3 layers)
1. Sanity (persistent): /api/admin/fix-images — OG extraction from source URL, keyword-matched fallback
2. NewsCard (client): resolveImage() always returns fallback, onError swaps broken images
   resolveImage MUST stay inline in NewsCard — cannot import from server module (build crash)
3. Article page (server): getArticleFallback() server-side keyword matcher

## Deploy Workflow
# Fresh clone
git clone https://github.com/dejcav-cmd/DownRange.git /tmp/DownRange
cd /tmp/DownRange
git config user.email "dj@downrangeco.com"
git config user.name "DJ Cavalcanti"
git remote set-url origin "https://dejcav-cmd:[PAT]@github.com/dejcav-cmd/DownRange.git"

# If sandbox already has /tmp/DownRange with prior session changes:
git stash && git pull --rebase && git stash pop

# Backup before major changes:
git tag backup-pre-FEATURE-$(date +%Y%m%d-%H%M%S) main && git push origin --tags

# If push rejected (auto-commit cron ran while we were working):
git pull --rebase && git push origin main

## Mobile (styles/mobile.css)
- All mobile fixes live in styles/mobile.css — NEVER touch page files for mobile
- Tab bar: 5 tabs (Home, News, Market, Search, Learn)
- Bottom nav: fixed, 54px tall, glass morphism background
- Touch targets: min 44-48px

## Key API Routes
- /api/news-feed — latest articles for live refresh
- /api/breaking-alerts — self-polling ticker (3 sources: dedicated alerts, urgency>=7, latest)
- /api/youtube — YouTube RSS feeds (no API key needed), 8 firearms channels
- /api/admin/backfill-articles — rewrites articles missing bodies (ADMIN_KEY auth)
- /api/admin/fix-images — fixes missing images, OG extraction (ADMIN_KEY auth)
- /api/admin/run — triggers feed agent manually
- /api/admin/cron-status — Mission Control dashboard data (ALL_JOBS registry here)
- /api/pull-log — Upstash Redis pull log

## Sanity Schemas
| Schema       | Export         | Status field |
|---|---|---|
| newsArticle  | export default | None: defined(slug.current) && defined(publishedAt) |
| blogPost     | export const   | status == "published" |
| gunDeal      | export const   | — |
| gunRelease   | export const   | — |
| lawEntry     | export const   | — |
| imageAsset   | export const   | — |

## Admin System (/admin)
7 sections: Content, Publishing, Intelligence, System (Mission Control), Outreach (CRM/Zoho/Resend), Media, Settings
Mission Control at /admin — shows all cron jobs from ALL_JOBS in app/api/admin/cron-status/route.js
Mobile PWA at /admin-app/ — vanilla JS, 9 screens

## Social Media Automation
- Bluesky: 300 graphemes
- Twitter/X: 280 characters
- Facebook: 63,206 characters

## International Pipelines
- Canada: app/canada/page.js — client component, 6 sub-tabs. useCdn: false on all fetches
- Brazil: +20min offset from Canada cron. useCdn: false (403 bug was useCdn: true)
- 300-char minimum body guard on both pipelines before saving to Sanity

## Environment Variables
Set in Vercel: SANITY_API_TOKEN, ANTHROPIC_API_KEY, CRON_SECRET, ADMIN_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEXT_PUBLIC_GA_ID (G-KDGZX3CLEC), NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
Pending: GOOGLE_PLACES_API_KEY, YOUTUBE_API_KEY, CONGRESS_GOV_KEY, NEWSAPI_KEY, GNEWS_KEY, LEGISCAN_KEY, IPINFO_TOKEN, WEATHER_API_KEY, RESEND_API_KEY, ALGOLIA keys

## Known Bug Patterns
- Apostrophes in single-quoted JSX strings = build crash -> use double quotes or escape
- 'use client' mid-file = build crash -> own file always
- CRON_SECRET for admin UI routes -> rejected; use ADMIN_KEY
- GA env var conditional = empty at build -> hardcode ID
- Sanity Portable Text vs HTML mismatch -> body field is type 'text'
- useCdn: true on slug/detail pages -> 403 on Canada/Brazil fetches
- @sanity/client in 'use client' = build crash -> server components only
- vercel.json schedule != ALL_JOBS schedule -> false OVERDUE in Mission Control
- State hub sitemap with full names ('alabama') -> 404 at runtime (route uses 2-letter codes)
- Google verification meta || '' -> blank meta tag emitted (use || undefined)
- sed with special chars in replacement string -> use Python str.replace() instead
- Cron route with no reportCronRun -> shows NEVER RUN in dashboard even if executing
