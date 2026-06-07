---
name: downrange-portal
description: "Use this skill for ALL work on the DownRange firearms portal (downrangeco.com, github.com/dejcav-cmd/DownRange). Read before writing any code, creating any file, or running any command for this project."
---

# DownRange Portal — Complete Reference

## Identity
- **Domain:** downrangeco.com | **Repo:** github.com/dejcav-cmd/DownRange | **Branch:** main (auto-deploys)
- **Vercel project:** down-range-indol | **Stack:** Next.js 14, Sanity v3 (vbnsqnkg), Clerk, Resend, Algolia, Upstash Redis, Vercel Pro
- **Git push:** `https://dejcav-cmd:[GH_TOKEN]@github.com/dejcav-cmd/DownRange.git`
- **Git author:** DJ Cavalcanti (dj@downrangeco.com)

## Design System
- Gold `#C8922A`, BG `#09090B`, Card BG `#111318`, Text `#F0EDE6`, Border `#1e293b`
- Fonts: Bebas Neue (headings), IBM Plex Mono (mono), Barlow Condensed (UI)
- NEVER hardcode hex — use CSS vars. NEVER bare monospace — specify full font stack.

## CRITICAL BUILD RULES
1. No `import axios` in App Router — use native `fetch()`
2. No nested template literals in API routes — use `array.join('')`
3. No GROQ `!contains()` on strings
4. Apostrophes in JSX single-quote strings = crash — use double quotes
5. `'use client'` must be FIRST LINE of its own file
6. `ClerkProvider` unconditional = crash — use `ClerkWrapper.js`
7. All API routes need `export const dynamic = 'force-dynamic'`
8. `.npmrc` must have `legacy-peer-deps=true`
9. Agent files are ESM (`agent/package.json` has `{ "type": "module" }`)
10. No event handlers in server components
11. Client pages needing metadata — use server `page.js` + `PageClient.js` pattern
12. `node --check` before every commit

## Image System — 3-Layer Fallback
**NEVER use Wikimedia or Unsplash** — both 403-blocked by egress proxy on build server (claude.ai). Vercel runtime CAN reach external URLs.

**Layer 1 — Real og:images** (best)
- `fetch-article-images` cron runs every 30min on Vercel
- Fetches source article URL → extracts `og:image` → uploads to Sanity CDN
- Stores `cdn.sanity.io` URL as `imageUrl` in Sanity

**Layer 2 — Image Repository** (fallback)
- Sanity schema: `imageAsset` — 50 curated public-domain/US-military firearm images
- Stored permanently on `cdn.sanity.io`
- Admin: **Media → 📸 Image Library** — gallery with filter, assign, add
- `patch-article` pulls from repo by category before falling back to SVG

**Layer 3 — Self-hosted SVGs** (last resort)
- `/public/img/` — `pistol.svg`, `rifle.svg`, `law.svg`, `shotgun.svg`, `suppressor.svg`, `ammo.svg`, `news.svg`
- Served from Vercel CDN at `/img/xxx.svg`
- Trusted domains: `['/img/', 'cdn.sanity.io', 'img.youtube.com', 'i.ytimg.com']`

## Admin Architecture
- **File:** `app/admin/page.js` (~929 lines)
- **Layout:** Fixed topbar 52px + sidebar 200px + sub-tabs + panel. Shell = `margin-top:52px; height:calc(100vh-52px)`. No position:sticky/fixed on sidebar — pure flexbox.
- **7 sections × sub-tabs:**

| Section | Sub-tabs |
|---|---|
| 📰 Content | News Articles, Gun Releases, Blog, Reviews, Canada, Competitions |
| 📅 Publishing | Schedule, Breaking Alerts, Newsletter, SEO |
| 🧠 Intelligence | Briefings, Pull Log, Deals Feed, Feed Agent |
| ⚙ System | Overview, Cron Jobs, Alerts, RSS Sources, Ranges DB |
| 📬 Outreach | Campaigns |
| ▶ Media | Video Manager, Channels, 📸 Image Library |
| ⚙ Settings | AI Models, Cost Center, API Keys, Identity, Env Vars |

- **Auth:** `dr_admin_key` in localStorage. All admin API routes check `x-admin-key` header.

## AI Cost System
- **Router:** `lib/aiRouter.js` — tiered routing with fallback chains
- **Tiers:** `nano`=GLM-4.5 Air ($0.14/M), `cheap`=GLM-4.7, `mid`=Claude Haiku, `smart`=Claude Sonnet
- **Map:** news/backfill/market→nano, laws/goa→cheap, releases/outreach/canada→mid, intel/blog→smart
- **Env overrides:** `AI_CHAIN`, `AI_CHAIN_INTEL`, `AI_CHAIN_ARTICLE`, etc. (set in Vercel)
- **`lib/aiClient.js`:** `callAI({ prompt, useCase, maxTokens })`
- **Savings:** ~$1,065/month vs all-Sonnet

## Cron Jobs (17 total)
| Schedule | Feed/Route |
|---|---|
| `*/15 * * * *` | `/api/agent?feed=news` |
| `*/30 * * * *` | `/api/agent?feed=market` |
| `*/30 * * * *` | `/api/admin/fetch-article-images` |
| `*/30 * * * *` | `/api/admin/cron-health` |
| `0 * * * *` | `/api/agent?feed=releases` |
| `0 */2 * * *` | `/api/agent?feed=laws` |
| `0 */2 * * *` | `/api/agent?feed=goa` |
| `0 */4 * * *` | `/api/agent?feed=video` |
| `0 5 * * *` | `/api/intelligence` |
| `0 7 * * *` | `/api/newsletter` |
| `0 8 * * *` | `/api/agent?feed=state` |
| `0 8,14,20 * * *` | `/api/site-health` |
| `0 10 1 * *` | `/api/nics` |
| `0 12 * * *` | `/api/cron/releases` |
| `0 13 * * *` | `/api/outreach/queue/digest` |
| `0 12-23,0-3 * * *` | `/api/admin/fix-images` |
| `0 12-23,0-3 * * *` | `/api/admin/backfill-articles` |

## Key File Paths
```
app/admin/page.js                           Admin CMS (929 lines, 7-section)
app/news/[slug]/page.js                     Article page
app/api/agent/route.js                      All feed triggers
app/api/admin/patch-article/route.js        Bulk imageUrl fixer (uses repo first)
app/api/admin/fetch-article-images/route.js og:image fetch → Sanity CDN upload
app/api/admin/seed-image-repo/route.js      Seed 50 curated images to Sanity CDN
app/api/admin/image-repo/route.js           Query/assign/add/delete repo images
app/api/admin/ai-status/route.js            Live key + routing check
app/api/admin/ai-costs/route.js             Cost tracking
lib/aiRouter.js                             Tiered AI cost router
lib/aiClient.js                             callAI() / callAIText()
lib/cronReporter.js                         Cron result logging
agent/utils.js                              publishToSanity, rewriteWithClaude, fetchAndUploadOgImage
agent/feeds/news.js                         Main news feed (MAX_ITEMS=20)
agent/feeds/goa.js                          GOA press center (WP JSON API + RSS fallback)
agent/feeds/laws.js                         Legislation feed
agent/feeds/releases.js                     Gun releases feed
agent/package.json                          { "type": "module" } — ESM only
components/ui/NewsCard.js                   'use client', resolveImage, getFallbackImage
components/ui/ArticleHeroImage.js           <img> with onError fallback
components/admin/NewsArticleManager.js      Article mgmt + 📷 Fetch Real Images buttons
components/admin/ImageRepository.js         Gallery UI with filter/assign/seed
components/admin/AIProviderSettings.js      AI chain builder + live status
components/admin/AICostDashboard.js         Spend tracking UI
sanity/schemas/imageAsset.js                Image repo schema
public/img/                                 7 self-hosted SVG fallbacks
```

## Feed Sources (news agent)
RSS: The Firearm Blog, TTAG, Guns.com, NRA-ILA, ATF, SAF, Bearing Arms, AmmoLand, TheGunFeed, Concealed Nation, American Rifleman, r/guns, r/firearms, GOA, GOA Press
Canadian: TheGunBlog.ca, NFA Canada, CSSA
APIs: NewsAPI (`NEWSAPI_KEY`), GNews (`GNEWS_KEY`)
Agent settings: `MAX_ITEMS=20`, `ITEMS_PER_FEED=5`, `CONCURRENCY=3`, input 1500 chars, output 1200 tokens

## GOA Feed (agent/feeds/goa.js)
- Source: gunowners.org/press-center
- Primary: WP REST API `/wp-json/wp/v2/posts?categories_name=press-center`
- Fallback: RSS parsing
- Category: `law` | Image: `/img/law.svg` | Tags: `['GOA','2A','gun-rights','legislation']`
- Sanity `_id` prefix: `goa-`

## Writing Style
No: "comprehensive", "dive into", "cutting-edge", "robust", "leverage", "seamlessly", "empower", "game-changer". Direct sentences, specific details, active voice, sounds like a gun owner who carries daily and reads 2A case law. Articles: 900-1100 words, 5 h2 sections.

## Key ENV Variables
`ANTHROPIC_API_KEY`, `SANITY_API_TOKEN`, `RESEND_API_KEY`, `CRON_SECRET`, `GLM_API_KEY`, `ADMIN_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN`, `NEXT_PUBLIC_SANITY_PROJECT_ID`=vbnsqnkg

## Deploy
```bash
git add -A && git commit -m "description"
git push https://dejcav-cmd:[GH_TOKEN]@github.com/dejcav-cmd/DownRange.git main
# Vercel auto-deploys ~45s after push
```

## Latest State (May 27 2026)
- Latest commit: acf486f
- Admin: 7-section sidebar, 929 lines, enterprise CMS layout
- Images: 3-layer system live, og:image cron running every 30min
- AI: tiered router live, GLM_API_KEY set in Vercel
- GOA feed: live, every 2h
- Image repo: built, needs seeding (Admin → Media → Image Library → Seed All)

## June 2026 Updates — Critical Fixes & New Systems

### Vercel Cron Limit (CRITICAL)
- Vercel Pro plan: **40 cron max**. vercel.json was at 61 → DEGRADED status. Pruned to 40.
- Every new cron must check count first. Remove low-priority crons before adding new ones.
- cron-health returns `status: 'HEALTHY'|'DEGRADED'|'BROKEN'|'WARNING'` (NOT 'ok').

### Hash-Slug Bug — Fixed Permanently
- Root cause: old publishToSanity code set `slug.current = doc._id` ('news-{32hex}').
- Fix 1: `agent/utils.js` — `isHashSlug()` guard in `publishToSanity()`. Fires on EVERY write.
- Fix 2: `/api/cron/fix-slugs` route — daily 4am scan of all newsArticles, patches bad slugs.
- Fix 3: `fix_slugs.py` script — manual trigger via fix-broken-slugs GH Actions workflow.
- Pattern: `/^[a-z]+-[a-f0-9]{20,}$/` = hash slug. Build from title: `title-slug-hash[:6]`.
- For new sources: the guard in publishToSanity catches ALL sources automatically.

### No-Body Articles — Root Cause & Fix
- Articles arriving with no body = AI rewrite failing silently or skipping rewrite path.
- Check `rewriteWithClaude()` in `agent/utils.js` — if ANTHROPIC_API_KEY missing, returns null.
- GLM fallback must exist for every rewrite path. Never publish without body validation.
- Add: `if (!ai?.body || ai.body.length < 200) skip or retry`. Never publish empty body.
- Copyright policy: input capped at 400 chars of source. Must rewrite facts only, not words.

### Mobile PWA (/admin-app) — v7 Complete
- **Auth**: `POST /api/admin/auth {password}` — NEVER use ai-status (LLM timeout).
- **Key**: localStorage `dr_admin_key`, sent as `x-admin-key` header.
- **Status**: newsArticle+firearmRelease have NO status field → derive from `publishedAt && slug.current`. blogPost has explicit `status` field.
- **cron-health**: No auth required. Returns `status: 'HEALTHY'|'DEGRADED'|'BROKEN'|'WARNING'`.
- **API shapes**: articles-list→{articles,total}; blog-posts→{posts}; releases-manager→{releases}; outreach/contacts→{contacts,count}; outreach/queue→{entries}; outreach/history→{logs}; cron-status→{jobs[{id,label,schedule,group,status,lastRun,history}]}; videos-manager→{videos}; youtube-channels→{channels}.
- **Deployments panel**: `/api/admin/deployments` (GET list/detail/logs, POST redeploy). Requires `VERCEL_TOKEN` in Vercel env vars. Uses v3 NDJSON logs endpoint with `Accept: application/x-ndjson`.
- **System screen**: Deployments row is wired → `renderDeployments()`. Health banner checks `HEALTHY||ok`.
- **All panels confirmed**: hub, canada, brazil, competitions, deals, schedule, rss (live with pause/resume), social analytics, cost center, site settings, alert config, portal report, backup, lock-all, market brief, briefings, state laws, copyright, pull log, image search (Pexels+Pixabay).
- **Image search in articles**: Each article card has 🔍 Search Img → opens scoped image search drawer. Tap to apply image directly to article in Sanity.
- **Parity rule**: Every new feature must be built in BOTH web admin React component AND PWA panel.

### Web Admin — New Panels Added (June 2026)
- System → **Deployments** tab: `DeploymentsPanel.js` component. Full build log, redeploy, inspect.
- Content Agents → **🔗 Fix Hash Slugs** button → `/api/cron/fix-slugs?limit=500`.
- All panels have parity with PWA. New features ship to both simultaneously.

### Env Vars — Confirmed Set in Vercel (June 2026)
SET: ADMIN_KEY, ANTHROPIC_API_KEY, CRON_SECRET, SANITY_API_TOKEN, NEXT_PUBLIC_SANITY_PROJECT_ID, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, GLM_API_KEY, PEXELS_API_KEY, PIXABAY_API_KEY, RESEND_API_KEY, GH_PAT, NEWSAPI_KEY, GNEWS_KEY, LEGISCAN_KEY, CONGRESS_GOV_KEY, CONTACT_EMAIL

MISSING (priority): VERCEL_TOKEN (deployments panel), YOUTUBE_API_KEY, RESEND_AUDIENCE_ID, ALGOLIA_APP_ID+ALGOLIA_ADMIN_KEY, DISCORD_WEBHOOK_URL, GITHUB_TOKEN+GITHUB_BACKUP_REPO, INDEXNOW_KEY, social platform tokens (ZERNIO, BLUESKY, FACEBOOK, THREADS, REDDIT, INSTAGRAM)

### GitHub Actions — Workflow Dispatch Gotcha
- After modifying a workflow file, GitHub caches the OLD trigger metadata for ~3-5 minutes.
- Dispatching immediately after a push returns 422 "Workflow does not have workflow_dispatch trigger".
- Solution: wait 3-5 min after file modification before dispatching, OR use a different unmodified workflow.
- Workflow log downloads (job logs) redirect to Azure blob storage — requires special redirect handling.
- AGENT_SECRET GitHub secret = ADMIN_KEY value for live API calls from workflows.

## Latest State (June 7 2026)
- Latest commit: b76fdc2e (Deployments panel + Fix Hash Slugs agent)
- Admin: System → Deployments tab live. All 40+ panels in both web admin and PWA.
- PWA: v7, fully complete — all sections open, no "Open Admin →" fallbacks.
- Crons: 40 active (Vercel Pro limit). news(*/15), laws(0 */2), fix-slugs(0 4 * * *).
- Slug bug: fixed with guard + daily cron. No hash-slug articles in production.
- New keys live: NEWSAPI_KEY, GNEWS_KEY, LEGISCAN_KEY, CONGRESS_GOV_KEY, CONTACT_EMAIL.
