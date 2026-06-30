---
name: downrange-portal
description: "Complete development skill for DownRange (downrangeco.com), a Next.js 14 firearms intelligence portal owned by DJ Cavalcanti. Use this skill ANY TIME the user mentions DownRange, downrangeco, downrangeco.com, the firearms portal, the 2A portal, or asks to work on their Next.js site with Sanity CMS. Also trigger when the user asks about: the admin page, learning center, blog articles, deals page, news feeds, gun releases, range finder, laws page, state hub, market watch, reviews, video page, Canada page, Brazil page, OpenClaw agent, cron jobs, AI cost routing, ballistics calculator, Mission Control, cron monitoring, or any of the 40+ pages in this project. This skill contains all critical rules, file paths, design system tokens, API configurations, git/deploy workflow, and architectural patterns needed to make changes without breaking the build. MUST be consulted before editing any file in the DownRange codebase."
---

# DownRange Portal — Complete Development Skill

## Project Identity

**Name:** DownRange — America's Firearms Intelligence Hub  
**Owner:** DJ Cavalcanti (GitHub: dejcav-cmd)  
**Domain:** downrangeco.com  
**Vercel:** down-range-indol.vercel.app  
**Repo:** github.com/dejcav-cmd/DownRange  
**Latest stable commit:** 056cd00 (fix: fix-images cron → 6am, 11am, 3pm UTC)

## Stack

| Component | Details |
|-----------|---------|
| Framework | Next.js 14.2.29 (App Router, NOT Pages Router) |
| CMS | Sanity v3, project: `vbnsqnkg`, dataset: `production` |
| Auth | Clerk 6.12.0 |
| Email | Resend (lazy init required) |
| Search | Algolia (App ID: `SUIVKKC7FX`, lazy init required) |
| Hosting | Vercel Pro |
| Cache | Upstash Redis |
| AI | Claude API + `lib/aiClient.js` (NEVER call model directly — always use `callAIText({ useCase })`) |
| Local AI | Ollama + Hermes 3 + qwen3:30b-instruct on Mac Mini ("OpenClaw") |
| .npmrc | `legacy-peer-deps=true` (REQUIRED — build fails without it) |

## CRITICAL RULES — Read Before ANY Edit

1. **NewsCard is `'use client'`** — `resolveImage()` and `readingTime()` must be INLINE. Cannot import from server module.
2. **All API routes** need `export const dynamic = 'force-dynamic'`
3. **Resend and Algolia** must use lazy initialization. Build crashes if initialized at module level.
4. **`.npmrc`** must have `legacy-peer-deps=true` — Clerk 6.12.0 peer dep conflicts.
5. **Studio page** (`app/studio/[[...index]]/page.js`) uses `dynamic()` with `ssr: false`
6. **Schema exports**: `newsArticle` uses `export default`. ALL other schemas use `export const`. Mixing crashes the schema registry.
7. **NO event handlers** in server components. Add `'use client'` first.
8. **AmmoLand RSS** is `cat: 'deals'` — LOCKED. Never appears in news feed, only in `/deals`.
9. **Design system**: ALL pages use `.page-hero`, `.dr-card`, `.dr-section-title`, `var(--gold)`, `var(--border)`.
10. **Font**: NEVER `fontFamily: 'monospace'` — ALWAYS `"'IBM Plex Mono', monospace"`.
11. **No hardcoded hex colors** — use CSS vars: `var(--bg)`, `var(--bg2)`, `var(--gold)`, `var(--text)`, `var(--text-muted)`, `var(--text-dim)`, `var(--border)`.
12. **Apostrophes in JSX**: Never use `'` inside single-quoted JS strings. Caused 3 build failures.
13. **Seed data pattern**: Every page must have `const display = live.length > 0 ? live : SEED_DATA`.
14. **`useCdn: false`** on ALL slug/detail pages. `useCdn: true` causes 403 on Canada/Brazil pages.
15. **`newsArticle` status**: Uses `defined(slug.current) && defined(publishedAt)` — NOT a `status` field.
16. **`blogPost` status**: Uses `status == "published"` — this schema HAS a status field.
17. **`BreakingTicker` is mandatory** on all public pages. Server: `fetchBreakingAlerts` prop. Client: `alerts={[]}`. Suppress on `/admin`.
18. **Cron jobs**: Every new cron in BOTH `vercel.json` AND `ALL_JOBS` in `app/api/admin/cron-status/route.js`. Schedules MUST match exactly — mismatch = false OVERDUE alerts.
19. **`@sanity/client`** NEVER in `'use client'` components.
20. **Writing style**: BANNED words: comprehensive, robust, leverage, seamlessly, empower, game-changer.
21. **Image sourcing**: NEVER hotlink external images. OG scrape → Sanity CDN upload → `pickPhoto` fallback.
22. **`reportCronRun` is mandatory** on every cron route — call in BOTH success and failure paths. Without it, Mission Control shows NEVER RUN even if the cron runs.
23. **Releases feed deadline guard**: `agent/feeds/releases.js` has a 240s deadline in `fetchAllGoogleNews(deadlineMs)`. This is NOT dead code. Without it, Vercel (300s maxDuration) kills the function before `reportCronRun` fires.
24. **State hub URLs**: Must use 2-letter codes (`/state-hub/AL`). Sitemap uses `US_STATE_CODES` array. Full names caused all 50 state pages to be invisible to Google.
25. **JSON-LD**: Tool pages → `SoftwareApplication` + `BreadcrumbList`. FAQ pages → `FAQPage`. Data pages → `Dataset`. Inject before `<Masthead />`.
26. **Google verification meta**: Use `|| undefined`, NOT `|| ''`. Empty string emits a blank `<meta>` tag.
27. **Redis in ESM modules**: NEVER use `require('@upstash/redis')` inside a function — ESM modules don't support `require()`. Always use top-level `import { Redis } from '@upstash/redis'`. See `lib/pullLogger.js` for the correct lazy-init pattern.
28. **scrapeReleases.js Redis**: Uses `import { Redis as UpstashRedis }` at top, lazy-init inside `getRelRedis()`. Do not revert to `require()`.

## AI Cost Architecture — lib/aiClient.js

**NEVER call Anthropic or GLM APIs directly.** Always use:
```js
import { callAIText } from '@/lib/aiClient.js'
const result = await callAIText({ prompt, useCase: 'news', maxTokens: 1800 })
```

### DEFAULT_CHAINS — useCase → model mapping

| useCase | Primary | Fallback | Used by | Freq |
|---------|---------|----------|---------|------|
| `news` | haiku | glm-4.7 | rewriteWithClaude (news feed) | 48×/day |
| `backfill` | haiku | glm-4.7 | backfill-articles cron | 12×/day |
| `law` | glm-4.7 | haiku | GOA feed summary | 12×/day |
| `laws` | glm-4.7 | haiku | enrichLawWithClaude (NEW bills only) | ~5×/day |
| `law-assistant` | glm-4.5-air | haiku | LawAssistant Q&A (rate-limited) | ≤10/IP/day |
| `article` | haiku | sonnet↓ | giveaways, outdoors feeds | 2×/day |
| `blog` | haiku | sonnet↓ | blog-writer cron | 1×/day |
| `canada` | haiku | glm-4.7 | write-canada-articles | 2×/day |
| `brazil` | haiku | glm-4.7 | write-brazil-articles | 2×/day |
| `outreach` | haiku | sonnet↓ | outreach cron | 1×/day |
| `newsletter` | haiku | sonnet↓ | newsletter cron + drafts admin | 1×/day |
| `intel` | **sonnet ✓** | haiku | intelligence briefing synthesis (justified) | 1×/day |
| `fast` | glm-4.5-air | haiku | title rewrites, quick ops | varies |
| `default` | haiku | sonnet↓ | any unmapped useCase | — |

**sonnet↓ = fallback only, never primary.** All chains fail-open. The only justified primary Sonnet usage is `intel` (daily briefing synthesis) and `intelligence/route.js:268` (same route).

### AI Cost Optimizations Applied (June 2026)

These are locked-in architectural decisions. Do NOT revert them:

**1. quality-rewrite early-exit** (`app/api/cron/quality-rewrite/route.js`)  
After fetching docs, check if all have `qualityReviewed:true`. If so, return immediately — never call GLM. Eliminates ghost invocations when queue is empty.

**2. News enrichment gate** (`agent/feeds/news.js`)  
`HIGH_VALUE_CATS = ['law','breaking','atf','scotus']` — only these categories get AI enrichment. Deals and generic industry news (`feedCat` not in set) skip enrichment entirely. Raw RSS title + excerpt is published. backfill cron handles bodies later.

**3. Laws enrichment dedup** (`agent/feeds/laws.js`)  
`getEnrichedIds()` pre-fetches all legislation `_id`s with existing `analysis` from Sanity (TTL: 90min). All three enrichment callsites (`rssItems`, `federal`, state batches) check `enrichedIds.has(bill._id)` before calling Claude. New bills always enrich; repeat bills skip. Pre-fetch fails-open (empty set = enrich all).

**4. Releases Redis dedup** (`lib/scrapeReleases.js`)  
`dr:releases:seen` Redis set. `isDuplicate()` calls `sismember` before the Sanity query — skips both DB fetch and Claude extraction for seen URLs. `markSeen()` called after successful Sanity save. 30-day TTL.

**5. LawAssistant rate limit** (`app/api/law-assistant/route.js`)  
Upstash Redis: 10 queries/IP/calendar day. Key: `dr:law-rl:{ip}:{date}`. Warn user at query 8. Returns 429 + friendly message at limit. Fails-open if Redis unavailable.

**6. Newsletter + admin drafts** (`lib/aiClient.js`, `app/api/admin/newsletter-drafts/route.js`)  
Both use Haiku as primary. Sonnet available as fallback only.

**7. Intelligence webSearch** (`app/api/intelligence/route.js`)  
14 `webSearch()` calls/day use Haiku (web_search tool works identically on Haiku). Final synthesis at line 268 keeps Sonnet — that's the actual email DJ reads.

**8. User-facing pages** (`app/compare/[guns]/page.js`, `app/value-estimator/PageClient.js`)  
Both switched from Sonnet to Haiku. 150-word verdict and 2-sentence valuation need no flagship model.

**9. Frequency reductions** (`vercel.json`)  
news `*/15→*/30`, market `*/30→0 */2`, fix-placeholder `0 *→0 */4`, cron-health `*/30→0 *`.

**10. Duplicate blog generator removed** (`vercel.json`)  
`/api/agent?feed=blog` removed. `blog-writer` at `0 18 * * 1,3,5` is the single source. Both were using different topic pools and double-filling Sanity drafts.

### Adding a new AI call — checklist

- Use `callAIText({ prompt, useCase: 'X', maxTokens: N })` — never fetch Anthropic directly
- Pick the lowest useCase tier that produces acceptable quality
- Add early-exit / dedup guard if the call runs in a cron loop
- For any loop over Sanity docs: pre-fetch already-processed IDs, skip those
- For user-triggered endpoints: add Redis rate limiting via Upstash
- After adding: update `DEFAULT_CHAINS` in `lib/aiClient.js` with explicit entry

## Cron Schedule & Monitoring

**Source of truth: `vercel.json`** — `ALL_JOBS` in `app/api/admin/cron-status/route.js` must mirror it exactly.

Current schedule (as of commit 056cd00):

```
/api/agent?feed=news              */30 * * * *        (was */15 — reduced June 2026)
/api/agent?feed=laws              0 */2 * * *
/api/agent?feed=releases          45 */6 * * *
/api/agent?feed=market            0 */2 * * *         (was */30 — reduced June 2026)
/api/agent?feed=video             0 */4 * * *
/api/agent?feed=state             0 8 * * 0
/api/agent?feed=goa               2 */2 * * *
/api/newsletter                   0 7 * * *
/api/newsletter/send              0 7 * * 1,4
/api/intelligence                 0 1 * * *
/api/cron/blog-writer             0 18 * * 1,3,5      (agent?feed=blog removed — duplicate)
/api/cron/quality-rewrite         10 */6 * * *
/api/cron/gun-deals               5 * * * *
/api/cron/sitemap                 0 2 * * *
/api/cron/carry-insurance         0 6 * * 1
/api/cron/fix-placeholder-images  0 */4 * * *         (was 0 * — reduced June 2026)
/api/cron/market-brief            6 14 * * *
/api/cron/image-fix               15 * * * *
/api/cron/copyright-review        30 6 * * *
/api/cron/write-canada-articles   20 8 * * *
/api/cron/write-brazil-articles   40 9 * * *
/api/cron/weekly-gun-releases     0 6 * * 1,4
/api/admin/fix-images             0 6,11,15 * * *     (legacy — 3x/day for image backlog)
/api/admin/cron-health            0 * * * *            (was */30 — reduced June 2026)
/api/admin/fetch-article-images   20 */2 * * *
/api/admin/backup                 0 10 * * *
/api/site-health                  0 8 * * *
/api/nics                         0 10 1 * *
/api/nfa-wait-times               0 6 * * 1,4
```

### reportCronRun pattern (required on every cron):
```js
import { reportCronRun } from '@/lib/cronReporter'

const t0 = Date.now()
try {
  // ... cron work ...
  await reportCronRun('job-name', { status: 'success', ms: Date.now() - t0 })
  return NextResponse.json({ ok: true })
} catch (err) {
  await reportCronRun('job-name', { status: 'failed', ms: Date.now() - t0, error: err.message })
  return NextResponse.json({ error: err.message }, { status: 500 })
}
```

**Early-exit path must also call reportCronRun** — otherwise Mission Control shows NEVER RUN:
```js
if (nothingToDo) {
  await reportCronRun('job-name', { status: 'success', ms: Date.now() - t0, details: 'queue empty' })
  return NextResponse.json({ ok: true, message: 'queue empty' })
}
```

### Vercel cron auth (both paths required):
```js
const isVercel = req.headers.get('x-vercel-cron') === '1'
const isAuth = req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
if (!isVercel && !isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Mission Control status:
- **HEALTHY** — ran within interval × 2.5
- **OVERDUE** — last run > interval × 2.5 (first check vercel.json vs ALL_JOBS schedule match)
- **FAILING** — last `reportCronRun` had `status: 'failed'`
- **NEVER RUN** — no `cronRun` doc in Sanity (reportCronRun was never called by this route)

## Ballistics Calculator

**`app/ballistics/page.js`** (server, metadata + JSON-LD) + **`app/ballistics/BallisticsCalc.js`** (`'use client'`)

- G1 engine, forward Euler 0.5ft steps, Bryan Litz drag table (7-zone), lag-rule wind drift
- BC conversion: `bc_slug = bc_lb_in2 * 7000 / (32.174 * 144)`
- 38 presets, 9 categories via `<select>/<optgroup>`: `['Rimfire','Pistol','Intermediate','Hunting','Precision','PRC','Magnum','Specialty','Custom']`
- PRC family: 6.5 PRC 143gr (bc:0.623), 7mm PRC 175gr (bc:0.689), .300 PRC 225gr (bc:0.777), .338 PRC 270gr (bc:0.796)
- Compare mode: dual Load A/B inputs, dual SVG lines (gold/blue dashed), Δ Path column

## SEO

- State hub sitemap: `US_STATE_CODES` 2-letter → `/state-hub/AL`. NEVER full names.
- Sanity fetches in sitemap: single `Promise.all([articles, blogPosts, releases])`.
- 50+ static pages in sitemap including /ballistics, /learn, /ranges, /carry-insurance, /nfa-tracker, /value-estimator, /ffl-finder, /hunting, /precision, /training, /preparedness, /safe-storage, /canada, /brazil, /contact.
- JSON-LD pages (as of 9f4600f): /ballistics (SoftwareApplication), /ranges (WebApplication), /nfa-tracker (FAQPage), /carry-insurance (FAQPage), /laws (Dataset), /market (WebPage).

## Design System

CSS vars (`styles/globals.css`):
```
--bg:#09090B  --bg2:#111318  --bg3:#16191F  --bg4:#1C2028
--gold:#C8922A  --gold-light:#E5A83A  --gold-dim:#8A6320
--text:#F0EDE6  --text-muted:#9CA3AF  --text-dim:#6B7280
--border:#1F2428  --border-mid:#2A2F38
--green:#16A34A  --red-bright:#EF4444  --blue:#3B82F6
```

Typography: Bebas Neue (headlines `.t-display-*`), IBM Plex Mono (labels `.t-label-*`), IBM Plex Sans (body `.t-body-*`), Barlow Condensed (nav `.t-cond-*`).

Component classes: `.dr-card`, `.dr-card-accent`, `.dr-section`, `.dr-section-title`, `.dr-badge-gold/green/red`, `.dr-btn-primary`, `.dr-btn-outline`, `.dr-grid-2/3/4/auto`, `.dr-table`, `.dr-alert-warn`, `.dr-alert-info`.

### Page Template
```jsx
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'Title — DownRange', description: '...' }

export default async function NewPage() {
  const alerts = await fetchBreakingAlerts()
  return (
    <>
      <Masthead />
      <BreakingTicker alerts={alerts} />
      <div className="page-hero" data-title="KEYWORD">
        <div className="container">
          <h1 className="page-hero-title">Title</h1>
          <p className="page-hero-sub">Subtitle</p>
        </div>
      </div>
      <div className="dr-page"><div className="container">
        <div className="dr-section">
          <h2 className="dr-section-title">Section</h2>
        </div>
      </div></div>
      <Footer />
    </>
  )
}
```

## Deploy Workflow

```bash
git clone https://github.com/dejcav-cmd/DownRange.git /tmp/DownRange
cd /tmp/DownRange
git config user.email "dj@downrangeco.com"
git config user.name "DJ Cavalcanti"
git remote set-url origin "https://dejcav-cmd:{DOWNRANGE_GH_PAT}@github.com/dejcav-cmd/DownRange.git"

# If sandbox has leftover changes from a prior session:
git stash && git pull --rebase && git stash pop

# Backup before major changes:
git tag backup-pre-FEATURE-$(date +%Y%m%d-%H%M%S) main && git push origin --tags

# If push rejected (auto-commit cron ran while working):
git pull --rebase && git push origin main
```

**PAT**: `{DOWNRANGE_GH_PAT}` (also in memory as `DOWNRANGE_GH_PAT`).

## Sanity Schemas

| Schema | Export | Status |
|--------|--------|--------|
| `newsArticle` | `export default` | `defined(slug.current) && defined(publishedAt)` |
| `blogPost` | `export const` | `status == "published"` |
| `gunDeal/Release/lawEntry/imageAsset` | `export const` | — |

## Admin System

7-section layout at `/admin`: Content, Publishing, Intelligence, System (Mission Control at `app/api/admin/cron-status/route.js`), Outreach (CRM/Zoho/Resend), Media, Settings. Mobile PWA at `/admin-app/`.

## DJ's Working Style

- Direct, no preamble. Interpret intent from typos.
- "Surprise me" = go big. Always comprehensive.
- Execute autonomously — never ask DJ to run commands or verify manually.
- All articles: "DJ Cavalcanti, DownRange Founder."

## Known Bug Patterns

```
sed with special chars                → use Python str.replace() instead
vercel.json schedule != ALL_JOBS      → false OVERDUE in Mission Control
Cron with no reportCronRun            → shows NEVER RUN even if executing
Early-exit path missing reportCronRun → shows NEVER RUN even on success
State hub full names in sitemap       → 404 (route uses 2-letter codes)
Google verification meta || ''        → blank meta tag (use || undefined)
useCdn: true on slug pages            → 403 on Canada/Brazil fetches
@sanity/client in 'use client'        → build crash
Unescaped apostrophe in JSX string    → build crash
require() in ESM module               → runtime crash (use top-level import)
Two blog generator crons same days    → duplicate Sanity drafts (agent?feed=blog removed)
enrichment before dedup check         → pays Claude for already-stored docs (add pre-fetch guard)
useCase not in DEFAULT_CHAINS         → silent Sonnet fallback via default (add explicit entry)
```

## References

- `references/file-map.md` — complete file map (40+ pages, components, API routes)
- `references/pending.md` — unbuilt features, ENV var status, next steps
- `docs/downrange-portal.skill.md` in repo — updated each session with latest learnings
