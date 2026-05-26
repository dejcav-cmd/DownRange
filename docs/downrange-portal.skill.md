# DownRange Portal — Development Skill File
Last updated: May 26, 2026

## Project Overview
Next.js 14.2 firearms intelligence portal. downrangeco.com.
Repo: github.com/dejcav-cmd/DownRange (branch: main)
Vercel project: down-range-indol
Git push: https://dejcav-cmd:[GITHUB_TOKEN]@github.com/dejcav-cmd/DownRange.git
Author: DJ Cavalcanti (dj@downrangeco.com)

## Stack
- Next.js 14.2.29 App Router
- Sanity v3 (projectId: vbnsqnkg, dataset: production)
- Clerk (auth), Resend (email), Algolia (search), Upstash Redis (pull log)
- Vercel Pro (auto-deploy on push to main)
- Anthropic Claude API (article rewriting, agent)

## Design System
- Dark theme: background #09090B, gold #C8922A
- Fonts: Bebas Neue (headlines), IBM Plex Mono (code/meta), Barlow Condensed (subheads), IBM Plex Sans (body)
- NEVER hardcode hex colors — use var(--gold), var(--border), var(--background)
- NEVER use bare 'monospace' — always 'IBM Plex Mono', monospace
- Patterns: .page-hero, .dr-card, .container, .sidebar-layout

## Critical Rules
1. 'use client' MUST be at the top of its own file — never mid-file, never in server components
2. Client component pages needing metadata: split into page.js (server wrapper) + PageClient.js
3. No event handlers in server components (no onClick, onMouseEnter etc.)
4. All API routes need: export const dynamic = 'force-dynamic'
5. Admin UI routes: use ADMIN_KEY only (NOT CRON_SECRET — it IS set in Vercel and will reject)
6. Always use double quotes for JSX strings containing apostrophes
7. Build-verify after every change: npm run build must show 125/125 pages
8. Never create a nested layout.js — root layout covers all 43+ pages

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
1. Sanity (persistent): /api/admin/fix-images — OG extraction from source URL, then keyword-matched fallback
2. NewsCard (client): resolveImage() always returns fallback, onError swaps broken images
3. Article page (server): getArticleFallback() server-side keyword matcher

## SEO Requirements (every new page)
- Export metadata with title, description, alternates.canonical
- OG: type='article' for articles, og:url, og:image
- Twitter: card='summary_large_image'
- News articles: JSON-LD NewsArticle schema
- Blog posts: JSON-LD BlogPosting schema
- Never skip canonical URL
- Sitemap at app/sitemap.js — add new pages to statics array

## Mobile (styles/mobile.css)
- All mobile fixes live in styles/mobile.css — NEVER touch page files for mobile
- Tab bar: 5 tabs (Home, News, Market, Search, Learn)
- Bottom nav: fixed, 54px tall, glass morphism background
- Touch targets: min 44-48px
- Swipe-to-close on nav drawer

## Key API Routes
- /api/news-feed — latest articles for live refresh
- /api/breaking-alerts — self-polling ticker (3 sources: dedicated alerts, urgency≥7, latest)
- /api/youtube — YouTube RSS feeds (no API key needed), 8 firearms channels
- /api/admin/backfill-articles — rewrites articles missing bodies (ADMIN_KEY auth)
- /api/admin/fix-images — fixes missing images, OG extraction (ADMIN_KEY auth)
- /api/admin/run — triggers feed agent manually
- /api/pull-log — Upstash Redis pull log

## Live Components
- BreakingTicker: self-polls /api/breaking-alerts every 3 min
- LiveNewsGrid: polls /api/news-feed every 5 min (home page)
- LiveNewsRefresher: polls /api/news-feed every 2 min (news page)
- PageViewTracker: fires gtag on every route change

## Blog (/blog)
- 5 articles by DJ Cavalcanti at /blog/[slug]
- Topics: suppressors, micro-compacts, tariffs, Bruen battles, red dot carry
- Author: DJ Cavalcanti, Founder DownRange, Washington State
- No submenu in nav — direct link only
- JSON-LD BlogPosting schema on each article

## Vercel Functions (maxDuration: 300)
- agent/run, backfill-articles, fix-images, site-health

## Environment Variables (Vercel)
Set: SANITY_API_TOKEN, ANTHROPIC_API_KEY, CRON_SECRET, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, NEXT_PUBLIC_GA_ID (=G-KDGZX3CLEC), NEXT_PUBLIC_SANITY_PROJECT_ID
Pending: GOOGLE_PLACES_API_KEY, YOUTUBE_API_KEY, CONGRESS_GOV_KEY, NEWSAPI_KEY, GNEWS_KEY, LEGISCAN_KEY, IPINFO_TOKEN, WEATHER_API_KEY, RESEND_API_KEY, ALGOLIA keys

## Known Bug Patterns
- Apostrophes in single-quoted strings = build crash → use double quotes
- 'use client' mid-file = build crash → own file always
- CRON_SECRET set = admin UI routes reject → ADMIN_KEY only
- GA env var conditional = empty at build → hardcode ID
- Sanity Portable Text vs HTML mismatch → body field is type 'text'
