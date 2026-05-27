# DownRange Project Skill

## Project Identity
- **Repo:** github.com/dejcav-cmd/DownRange (branch: main, auto-deploys to Vercel)
- **Domain:** downrangeco.com | Vercel project: down-range-indol
- **Stack:** Next.js 14, Sanity v3, Clerk, Resend, Algolia, Upstash Redis, Vercel Pro
- **Design:** Dark theme, gold #C8922A, Bebas Neue / IBM Plex Mono / Barlow Condensed
- **Git push:** `https://dejcav-cmd:[GITHUB_TOKEN_IN_VERCEL]@github.com/dejcav-cmd/DownRange.git`
- **Git author:** DJ Cavalcanti (dj@downrangeco.com)

---

## CRITICAL BUILD RULES — Violating any of these breaks the build

1. **Never use `import axios`** in App Router API routes — axios causes empty 500 crashes. Use native `fetch` only.
2. **Never nest template literals** inside other template literals in API routes — SWC parser crashes. Use `array.join('\n')` or string concatenation.
3. **Never use GROQ `!contains(field, value)`** on string fields — throws a silent 500. Use `length(body) < 500` instead.
4. **Never declare `const adminKey`** inside a function that already has `adminKey` as a prop — duplicate declaration build error.
5. **Never use `import axios`** — see rule 1. Always native fetch.
6. **Apostrophes in single-quoted JSX strings** crash the build — always use double quotes for JSX strings containing apostrophes.
7. **`'use client'` must be the first line** of its own file — never appended mid-file, never in server components.
8. **`ClerkProvider` unconditional** in layout crashes without keys — use the `ClerkWrapper` conditional component.
9. **All API routes need** `export const dynamic = 'force-dynamic'`
10. **`.npmrc`** must have `legacy-peer-deps=true`

---

## Auth System

- **Admin login:** `downrangeco.com/admin-login` — Clerk SignIn (email/password + Google)
- **Middleware:** `middleware.ts` — protects `/admin`, redirects to `/admin-login` if no Clerk session
- **Admin key:** stored in `localStorage` as `dr_admin_key`. Configure in Admin → Settings tab (🔑 Admin Key section)
- **API auth:** all admin routes accept `x-admin-key` header matching `ADMIN_KEY` env var
- **Sign out:** button in admin header top-right

---

## Image System

Every article **must** have an `imageUrl`. The system works in two layers:

**At write time** (`agent/feeds/news.js`):
- `pickImage(title, category)` assigns a Wikimedia image when RSS has no image
- Patterns: `glock/pistol/handgun` → Glock17.jpg | `rifle/AR-15` → M4.jpg | `law/court/congress/ban/SAF/NRA/lawsuit` → SupremeCourt.jpg

**At render time** (`app/news/[slug]/page.js`):
- `getArticleFallback(article)` checks title keywords and returns appropriate Unsplash URL
- Same keyword patterns as above

**Fix missing images:**
- Admin → Content tab → **🖼 Patch All Missing Images** button
- Hits `/api/admin/patch-article` which queries Sanity and bulk-patches all articles missing `imageUrl`

---

## Backfill System

**Endpoint:** `POST /api/admin/backfill-articles?batch=5&force=false`

**Auth:** `x-admin-key` header

**Key implementation rules:**
- NO template literals — use `array.join('\n')` for the Claude prompt
- NO `!contains()` in GROQ — use `length(body) < 500`
- NO `axios` — use native `fetch`
- Top-level `try/catch` ensures errors always return JSON not empty 500
- Default batch size: 5 (conservative to avoid timeouts)
- maxDuration: 60s (Vercel Pro limit for API routes)

**Diagnose button** in admin Content tab runs `/api/admin/backfill-test` — checks env vars, Sanity connection, and Anthropic API in sequence.

---

## Writing Style (ALL generated content)

**Voice:** Write as DJ Cavalcanti — carries daily, reads 2A case law, based in Washington State.

**BANNED WORDS:** comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, shed light on, it remains to be seen, stakeholders, holistic, takeaway, unpack, explore

**BANNED PATTERNS:**
- Padded openings ("In a significant development...")
- Passive voice when active works
- Empty transitions (Furthermore, Additionally, Moreover)
- Hedging phrases (may potentially, could possibly, appears to suggest)

**GOOD:** "The ATF reversed course on pistol braces Thursday, rescinding the rule that reclassified millions of pistols as short-barreled rifles."
**BAD:** "In a significant development with far-reaching implications for the firearms community..."

**Article structure (900-1100 words):**
1. `<h2>` title + opening paragraph (hard news, 120-150 words)
2. `<h2>Background and Context</h2>` (130-160 words)
3. `<h2>What This Means for Gun Owners</h2>` (130-160 words)
4. `<h2>Industry Impact</h2>` (110-140 words)
5. `<h2>What to Watch Next</h2>` (110-140 words)
6. `<p><strong>DownRange Bottom Line:</strong></p>` (2-3 sentences, direct opinion)

---

## Admin Tabs

`dashboard, mission, feeds, content, alerts, channels, rss, deals, ranges, newsletter, seo, identity, openclaw, keys, blog, schedule, pulllog, outreach, intel, crons, envcheck, sysalerts, cronhealth, settings`

- `outreach` — includes Approval Queue as second sub-tab (not separate)
- `intel` → IntelligenceDashboard
- `crons` → CronDashboard (15 jobs, history bars)
- `envcheck` → EnvChecker (all 30+ env vars with setup instructions)
- `settings` → includes 🔑 Admin Key config section

---

## Cron Jobs (15 total)

`news(*/15), market(*/30), releases(0 *), laws(0 */2), video(0 */4), state(0 8), site_health(0 8,14,20), intelligence(0 5), nics(0 10 1), newsletter(0 7), queue_digest(0 13), prn_releases(0 12)`

All report via `lib/cronReporter.js` → `/api/admin/cron-status` (Redis).

---

## Outreach System

- `/api/outreach/queue` — generate/approve/skip/snooze/edit/digest
- `/api/outreach/send/direct` — single contact send via Resend
- `/api/outreach/send/preview` — iframe preview
- Seeds: manufacturers (70+), dealers (30+), holsters (40+), YouTubers, templates (10)
- Approval flow: auto-draft → live preview → approve → sends from dj@downrangeco.com via Resend

---

## Key Environment Variables

| Var | Purpose |
|-----|---------|
| `ADMIN_KEY` | Admin portal password |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk auth (starts pk_live_) |
| `CLERK_SECRET_KEY` | Clerk server-side (starts sk_live_) |
| `ANTHROPIC_API_KEY` | Claude API for article writing |
| `SANITY_API_TOKEN` | Sanity write access |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project (vbnsqnkg) |
| `RESEND_API_KEY` | Email sending |
| `UPSTASH_REDIS_REST_URL` | Redis for cron history |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth |

Check all vars: Admin → 🔧 Env Variables tab

---

## Session History (May 26 2026)

Built: Lists tab with editable contact tables, Approval Queue merged into Outreach portal, Clerk DNS (5 CNAMEs on Cloudflare verified), admin login with email/password, ClerkWrapper conditional provider, admin key Settings config, 🔍 Diagnose button for backfill, backfill v4 rewrite (no axios, no template literals, proper error handling), image fallback system (pickImage in news agent + patch-article endpoint), breaking ticker 2x faster, env var audit dashboard.

Fixed: redirect loop from bad middleware, empty 500 from axios import, SWC parse error from nested backticks, GROQ !contains() crash, duplicate const adminKey build error, ClerkProvider crash without keys, missing images on all articles.
