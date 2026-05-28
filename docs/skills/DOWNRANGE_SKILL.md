---
name: downrange
description: DownRange firearms portal development skill. Use this for ALL work on the DownRange Next.js project (downrangeco.com, github.com/dejcav-cmd/DownRange). Covers code, deploy, architecture, content, agents, admin, and data sources. Trigger whenever DJ mentions DownRange, the firearms portal, downrangeco.com, or any component/page/agent by name.
---

# DownRange Development Skill

## Project Identity

- **Repo:** github.com/dejcav-cmd/DownRange
- **Stack:** Next.js 14 App Router, Sanity v3, Clerk auth, Resend email, Algolia search, Vercel Pro
- **Live domain:** downrangeco.com
- **Design:** Dark theme (`#09090B` bg), gold `#C8922A`, fonts: Bebas Neue (display) / IBM Plex Mono (mono) / Barlow Condensed (UI)
- **DESIGN_SYSTEM.md** in repo root — read before touching any UI

---

## Deploy Workflow (MANDATORY — every session)

```bash
cd /home/claude/DownRange
git config user.email "dj@downrangeco.com"
git config user.name "DJ Cavalcanti"
git remote set-url origin "https://dejcav-cmd:{GITHUB_PAT}@github.com/dejcav-cmd/DownRange.git"
# ... make changes, then:
git add -A && git commit -m "description"
git push origin main
```

**After every push — check deployment:**
```bash
# Get latest deployment
curl -s -H "Authorization: token {GITHUB_PAT}" \
  "https://api.github.com/repos/dejcav-cmd/DownRange/deployments?per_page=1" | python3 -c "
import json,sys; d=json.load(sys.stdin)[0]; print(d['sha'][:10], d['environment'], d['created_at'])"

# Get deployment status
DEPLOY_ID=$(curl -s -H "Authorization: token {GITHUB_PAT}" \
  "https://api.github.com/repos/dejcav-cmd/DownRange/deployments?per_page=1" | \
  python3 -c "import json,sys; print(json.load(sys.stdin)[0]['id'])")
curl -s -H "Authorization: token {GITHUB_PAT}" \
  "https://api.github.com/repos/dejcav-cmd/DownRange/deployments/${DEPLOY_ID}/statuses?per_page=1" | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['state'], d[0].get('description','')) if d else print('pending')"
```

Expected: `state: success`, `Deployment has completed`. Vercel auto-deploys on every `main` push — no manual trigger needed.

Note: `x-deny-reason: host_not_allowed` from curl to downrangeco.com is the **sandbox egress block** — not a real error. Use GitHub deployments API to verify.

---

## Critical Rules (build-breaking if violated)

1. **Apostrophes in JSX single-quote strings** → crash. Always use double-quote JSX attribute strings.
2. **`import axios` in App Router** → empty 500. Use native `fetch()` instead.
3. **Nested backticks in API routes** → SWC parse error. Use `array.join('')`.
4. **GROQ `!contains()` on strings** → 500. Use `length(body) < 500` instead.
5. **`const adminKey` as both prop and inner declaration** → build error. Remove inner.
6. **`ClerkProvider` unconditional without keys** → site crash. Use `ClerkWrapper` with key check.
7. **`'use client'`** must be at the top of its own file — never mid-file, never in server components.
8. **No event handlers in server components** — extract to `PageClient.js` with a server wrapper `page.js`.
9. **`force-dynamic`** required on all API routes.
10. **`.npmrc`** has `legacy-peer-deps=true` — always use `--legacy-peer-deps` for installs.
11. **NEVER hardcode hex colors** — always use CSS vars from DESIGN_SYSTEM.md.
12. **NEVER create a nested `layout.js`** — only one root layout.

---

## Page Pattern (Learn Style — applied to all content pages)

Every content page follows this structure:

```jsx
// 1. Hero section
<div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)',
  padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
  {/* radial-gradient accent, watermark text, badge pills, Bebas Neue h1 */}
</div>

// 2. Sticky tab bar
<div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)',
  position:'sticky', top:'60px', zIndex:20 }}>
  {/* tabs with gold bottom-border on active */}
</div>

// 3. Content — featured mosaic + grid
// Featured: gridTemplateColumns: '2fr 1fr 1fr', gap:3
// Grid: gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap:3
// Cards: full-bleed image 260px, gradient overlay, content at bottom
// Hover: translateY(-2px) + border → category color
```

Applied to: News, Laws, Reviews, Guns, Outdoors (Hunting), Deals.

---

## Image Cards

```jsx
// Full-bleed image card
<div style={{ height:'260px', position:'relative', overflow:'hidden' }}>
  <img className="learn-card-img" style={{ transition:'transform 0.4s ease' }} />
  <div style={{ position:'absolute', inset:0,
    background:'linear-gradient(to top, rgba(9,9,11,0.93) 0%, transparent 100%)' }} />
  {/* content at bottom */}
</div>
// CSS: .learn-card-img:hover { transform: scale(1.04); }
```

Featured card uses height `440px`, grid card uses `260px`. Mosaic: featured is `2fr`, two stacked cards fill `1fr 1fr` in `gridColumn: 2 / span 2`.

---

## Admin Page

**Location:** `app/admin/page.js` (~1,400 lines)  
**Auth:** `dr_admin_key` in localStorage, `x-admin-key` header on API routes  
**Sections (sidebar):** Content / Publishing / Intelligence / System / Outreach / Media / Settings  
**Sub-tabs include:**
- `mission` — 🛰 Mission Control: 60+ source catalog
- `dashboard` — stats overview
- `feeds` — AI agent controls
- `keys` — API key reference with GET KEY links
- `channels`, `deals`, `ranges`, `newsletter`, `identity`, `alerts` — all fully inline (no Sanity Studio redirects)

### Admin tab rendering pattern:
```jsx
{tab==='mission' && <MissionControl secret={secret} setMsg={setMsg} />}
{tab==='feeds'   && ( ... )}
```

---

## AI Agent Systems

### `agent/utils.js` — Core utilities

**`rewriteWithClaude(item)`** — Full article rewrite:
- Model: `claude-sonnet-4-20250514`, `max_tokens: 2000`
- Returns JSON: `{ summary, body (HTML), category, urgencyScore, tags, relatedStates, isBreaking }`
- `body` = 4-6 paragraphs: lede → background → 2A impact → what to watch
- Strip JSON fences before `JSON.parse()`

**`enrichLawWithClaude(bill)`** — Legal brief:
- Returns: `{ summary (4-6 sentences with Bruen analysis), impact (HIGH/MED/LOW), analysis }`
- Skip gracefully if `ANTHROPIC_API_KEY` missing

### `agent/feeds/news.js`
- Stores `body` field from `rewriteWithClaude` into Sanity `newsArticle` doc
- Article detail page renders `body` via `dangerouslySetInnerHTML`

### `agent/feeds/laws.js`
- Calls `enrichLawWithClaude` on every federal + state bill before publishing
- 400ms sleep between enrichments to avoid rate limits

---

## Cron Jobs (17 total — `vercel.json`)

| Job | Schedule | Description |
|-----|----------|-------------|
| news | `*/15 * * * *` | AI news fetch + rewrite |
| market | `*/30 * * * *` | Ammo market data |
| cron-health | `*/30 * * * *` | Health check |
| fetch-article-images | `*/30 * * * *` | og:image from source URLs |
| releases | `0 * * * *` | PRNewswire + manufacturer releases |
| laws | `0 */2 * * *` | Congress.gov + LegiScan + Claude enrich |
| goa | `0 */2 * * *` | GOA WP JSON API + RSS fallback |
| video | `0 */4 * * *` | YouTube channel feed |
| state | `0 8 * * *` | 50-state news |
| site_health | `0 8,14,20 * * *` | Site health check |
| intelligence | `0 5 * * *` | Midnight intel briefing (Claude) |
| nics | `0 10 1 * *` | FBI NICS monthly CSV |
| newsletter | `0 7 * * *` | Weekly digest |
| queue_digest | `0 13 * * *` | Outreach queue digest |
| prn_releases | `0 12 * * *` | PRNewswire releases |
| fix-images | `0 12-23,0-3 * * *` | Article image repair |
| backfill-articles | `0 12-23,0-3 * * *` | Article backfill |

---

## Data Sources (Mission Control catalog)

### Tier 1 — Free, zero config
- GLOCK, SIG Sauer, Ruger, Springfield, CZ, Walther, Mossberg → HTML scrape press pages
- **Daniel Defense** → has real Atom RSS at `https://danieldefense.com/blogs/news.atom`
- r/gundeals → `https://old.reddit.com/r/gundeals/hot.json?limit=50&raw_json=1`
- ATF RSS, NRA-ILA RSS, GOA RSS, SAF RSS, SCOTUSblog RSS, Duke Firearms Law RSS
- FBI NICS CSV → GitHub Data Liberation Project pipeline

### Tier 2 — Free API key required
| Key | Source | URL |
|-----|--------|-----|
| `YOUTUBE_API_KEY` | YouTube Data API v3 | console.cloud.google.com |
| `CONGRESS_GOV_KEY` | Congress.gov bills | api.congress.gov/sign-up/ |
| `LEGISCAN_KEY` | LegiScan 50-state | legiscan.com/legiscan |
| `NEWSAPI_KEY` | NewsAPI.org | newsapi.org/register |
| `GNEWS_KEY` | GNews API | gnews.io/#register |
| `GOOGLE_PLACES_API_KEY` | Google Places (Ranges) | console.cloud.google.com |

### Tier 3 — Paid
- GunBroker REST API (`api.gunbroker.com`) — dev key from support
- gun.deals Dealer API — paid subscription
- AmmoSeek XML feed — retailer agreement

### SEC EDGAR (free, no key)
- Ruger (RGR) CIK: `0000095029`
- S&W Brands (SWBI) CIK: `0001585583`
- Vista Outdoor (VSTO) CIK: `0001616862`
- RSS pattern: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={CIK}&type=8-K&output=atom`

---

## Deals Page

**`app/deals/page.js`** — `'use client'`, Amazon-style product grid

**Card anatomy:**
- 180px image area: Reddit `preview.resolutions` → `thumbnail` → gradient placeholder
- gun.deals images: `enclosure url` attr → `<img src>` in description HTML
- Price: extracted with `/\$[\d,]+(?:\.\d{2})?/` — displayed in Bebas Neue gold
- Flair: from Reddit `link_flair_text`; gun.deals infers from title keywords
- Score badge: color-coded (red 1k+, orange 500+, gold 200+)
- `sendGAEvent('event', 'deal_click', {...})` on every click

**`app/api/deals/route.js`:**
- Source 1: `old.reddit.com/r/gundeals/hot.json` + `new.json` (deduped)
- Source 2: `gun.deals/feed/snap` → `/feed` fallback
- Source 3: `ammoland.com/feed/` — always locked to deals, never news
- MrGunsNGear removed

---

## Google Analytics 4

**Implementation:** `@next/third-parties/google` `GoogleAnalytics` component

```jsx
// app/layout.js
import { GoogleAnalytics } from '@next/third-parties/google'
import PageViewTracker from '../components/ui/PageViewTracker'
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ''

// in <body>:
{GA_ID && <GoogleAnalytics gaId={GA_ID} />}
{GA_ID && <PageViewTracker />}
```

**`components/ui/PageViewTracker.js`** — fires `gtag('config', GA_ID, { page_path })` on every pathname/searchParams change. Must be wrapped in `<Suspense>`.

**`lib/analytics.js`** — custom event helpers (all use `sendGAEvent` from `@next/third-parties/google`):
- `trackDealClick(deal)` — `deal_click` with flair/source/domain/price/score
- `trackArticleView(article)` — `article_view`
- `trackReviewView(review)` — `review_view`
- `trackLawClick(bill)` — `law_click`
- `trackSearch(query, resultCount)` — `search`
- `trackFilter(page, type, value)` — `filter_use`
- `trackStateView(abbr)` — `state_view`
- `trackAIQuery(tool, length)` — `ai_query`

**Env var:** Add `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` in Vercel → Settings → Environment Variables.

---

## Image System

- Self-hosted SVGs in `/public/img/`: `pistol.svg`, `rifle.svg`, `law.svg`, `shotgun.svg`, `suppressor.svg`, `ammo.svg`, `news.svg`
- **NEVER use Wikimedia or Unsplash** (egress blocked in sandbox — will work in prod but breaks testing)
- 3-layer fallback: og:image from source → Sanity CDN → `/img/*.svg`
- Trusted image sources: `/img/`, `cdn.sanity.io`, `img.youtube.com`
- `pickImage()` in agents: law/ban/SAF → law.svg, pistol/glock → pistol.svg, rifle/AR → rifle.svg

---

## AI Cost Routing (`lib/aiRouter.js`)

| Tier | Model | Cost/M tokens | Used for |
|------|-------|--------------|---------|
| nano | GLM-4.5 Air | $0.14 | news/backfill |
| cheap | GLM-4.7 | ~$0.28 | laws |
| mid | Claude Haiku | ~$0.25 | releases/outreach/canada |
| smart | Claude Sonnet | ~$3.00 | intel/blog |

Env overrides: `AI_CHAIN`, `AI_CHAIN_INTEL`, `AI_CHAIN_ARTICLE`, etc.  
Requires `GLM_API_KEY` in Vercel for nano/cheap tiers.  
Saves ~$1,065/month vs all-Sonnet.

---

## Articles

- **Length:** 900–1100 words mandatory
- **Structure:** 5 h2 sections: opener, Background+Context, What This Means for Gun Owners, Industry Impact, What to Watch Next + DownRange Bottom Line
- **Sanity field:** `body` type `text` (HTML string)
- **Backfill API:** POST `/api/admin/backfill-articles`
- **CSS:** `.dr-article-body` with Bebas Neue h2 + gold border-left

## Writing Style

No: "comprehensive", "dive into", "cutting-edge", "robust", "leverage", "seamlessly", "empower", "game-changer", padded intros, AI-sounding phrases.  
Yes: Direct sentences, specific details (names, case numbers, bill numbers, states), active voice. Write like someone who carries daily and reads 2A case law.

---

## Outreach System

- `/api/outreach/queue` — generate/approve/skip/snooze/edit/digest
- `/api/outreach/send/direct` — single contact send
- `/api/outreach/send/preview` — iframe live preview
- `/api/outreach/history` — send log
- Approval flow: auto-draft → live iframe preview → approve → Resend send
- Template variable: `pressUrl={{pressUrl}}` — must be in all templates
- Seeds: 40+ holster cos, 70+ manufacturers, 30+ dealers

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Claude AI rewrites + intel | ✅ |
| `SANITY_API_TOKEN` | Sanity CMS write access | ✅ |
| `RESEND_API_KEY` | Email (outreach + alerts) | ✅ |
| `CRON_SECRET` | Cron job auth | ✅ |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 | Add G-XXXXXXXX |
| `YOUTUBE_API_KEY` | Video feed | Tier 2 |
| `CONGRESS_GOV_KEY` | Federal legislation | Tier 2 |
| `LEGISCAN_KEY` | State legislation | Tier 2 |
| `NEWSAPI_KEY` | NewsAPI.org | Tier 2 |
| `GLM_API_KEY` | GLM AI models (cost saving) | For nano/cheap |
| `GOOGLE_PLACES_API_KEY` | Range finder | Optional |
| `DISCORD_WEBHOOK_URL` | Agent status notifications | Optional |
| `DISCORD_ERRORS_WEBHOOK` | Error alerts | Optional |
| `DISCORD_BREAKING_WEBHOOK` | Breaking news alerts | Optional |

---

## Key File Locations

```
app/
  layout.js          — Root layout, GA4, PageViewTracker
  admin/page.js      — Full admin (~1,400 lines), all tabs inline
  deals/page.js      — Amazon-style deal grid ('use client')
  api/deals/route.js — Deals API (Reddit + gun.deals + AmmoLand)
  news/page.js       — News with sticky tabs
  laws/page.js       — Laws with sticky tabs + full summaries
  reviews/page.js    — Reviews with image card mosaic
  guns/page.js       — Firearms encyclopedia
  hunting/page.js    — Outdoors hub (Hunting/Precision/Training/Preparedness)
agent/
  utils.js           — rewriteWithClaude, enrichLawWithClaude, publishToSanity
  feeds/news.js      — News agent (body field stored)
  feeds/laws.js      — Laws agent (Claude enrichment)
components/
  layout/Masthead.js — Nav (Laws+News: direct links, no dropdown)
  ui/PageViewTracker.js — SPA page view tracking
lib/
  analytics.js       — GA4 custom event helpers
  aiRouter.js        — Tiered AI cost routing
  aiClient.js        — callAI({prompt, useCase, maxTokens})
docs/
  deploy.md          — GitHub PAT workflow (token in Claude memory)
  skills/DOWNRANGE_SKILL.md — This file
```
