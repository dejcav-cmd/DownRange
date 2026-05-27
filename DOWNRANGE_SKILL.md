---
name: downrange-portal
description: "Use this skill for ALL work on the DownRange firearms portal (downrangeco.com, github.com/dejcav-cmd/DownRange). Read before writing any code, creating any file, or running any command for this project. Contains critical build rules, architecture, file paths, and patterns that prevent common errors."
---

# DownRange Portal — Complete Skill Document

## Project Identity
- **Domain:** downrangeco.com | **Repo:** github.com/dejcav-cmd/DownRange
- **Vercel project:** down-range-indol | **Branch:** main (auto-deploys)
- **Stack:** Next.js 14, Sanity v3 (project: vbnsqnkg, dataset: production), Clerk, Resend, Algolia, Upstash Redis, Vercel Pro
- **Git push:** `https://dejcav-cmd:[GH_TOKEN]@github.com/dejcav-cmd/DownRange.git`
- **Git author:** DJ Cavalcanti (dj@downrangeco.com)
- **Sanity project ID:** vbnsqnkg

## Design System
- **Colors:** Gold `#C8922A`, BG `#09090B`, Card BG `#111318`, Text `#F0EDE6`, Border `#1e293b`
- **Fonts:** Bebas Neue (headings), IBM Plex Mono (mono/labels), Barlow Condensed (UI)
- **NEVER** hardcode hex values — use CSS vars: `var(--gold)`, `var(--bg)`, `var(--border)`
- **NEVER** use bare monospace — always specify `'IBM Plex Mono', monospace`
- Pattern: `.page-hero` + `.dr-card` + `var(--border)` on all new pages

## CRITICAL BUILD RULES — Violating these breaks the build
1. **No `import axios`** in App Router API routes — use native `fetch()`
2. **No nested template literals** in API routes — use `array.join('')`
3. **No GROQ `!contains()`** on strings — use `length(body) < 500`
4. **Apostrophes in JSX** — never in single-quote strings; use double quotes around JSX attributes
5. **`'use client'`** must be the FIRST LINE of its own file; never mid-file or in server components
6. **`ClerkProvider` unconditional** = site crash — always wrap in `ClerkWrapper.js` with key check
7. **All API routes** need `export const dynamic = 'force-dynamic'`
8. **`.npmrc`** must have `legacy-peer-deps=true`
9. **Agent files** are ESM — `agent/package.json` has `{ "type": "module" }`. Use `import/export` not `require`
10. **No event handlers in server components** — wrap in `'use client'` component
11. **Client pages needing metadata** — use server `page.js` wrapper + `PageClient.js` pattern
12. **Build-verify after every edit** — check `node --check` before committing

## Image System — CRITICAL
- **Self-hosted SVGs** in `/public/img/` served from Vercel CDN at `/img/xxx.svg`
- **NEVER use Wikimedia or Unsplash URLs** — both are 403-blocked by the egress proxy
- **Files:** `pistol.svg`, `rifle.svg`, `law.svg`, `shotgun.svg`, `suppressor.svg`, `ammo.svg`, `news.svg`
- **Trusted domains:** `['/img/', 'cdn.sanity.io', 'img.youtube.com', 'i.ytimg.com']`
- **`pickImage(title, category)`** in `agent/feeds/news.js` assigns correct SVG based on keywords
- **`/api/admin/patch-article`** POST — fixes all Sanity imageUrls in bulk (Admin → Content → Fix All Images)
- **`publishToSanity()`** in `agent/utils.js` — uses `createIfNotExists` + `patch` to preserve good imageUrls

## Admin Page Architecture
- **File:** `app/admin/page.js` (~929 lines)
- **Layout:** Fixed topbar (52px) + sidebar (200px) + sub-tab bar + scrollable panel
- **Shell:** `margin-top:52px; height:calc(100vh - 52px)` — no position:fixed on sidebar
- **7 sections:** Content, Publishing, Intelligence, System, Outreach, Media, Settings
- **Auth:** Admin key in `localStorage` as `dr_admin_key`; all API routes check `x-admin-key` header
- **Clerk:** `/admin` protected via `middleware.ts`

## Content Sections (Sub-tabs)
| Section | Sub-tabs |
|---|---|
| Content | News Articles, Gun Releases, Blog, Reviews, Canada, Competitions |
| Publishing | Schedule, Breaking Alerts, Newsletter, SEO |
| Intelligence | Briefings, Pull Log, Deals Feed, Feed Agent |
| System | Overview, Cron Jobs, Alerts, RSS Sources, Ranges DB |
| Outreach | Campaigns |
| Media | Video Manager, Channels |
| Settings | AI Models, Cost Center, API Keys, Identity, Env Vars |

## AI Cost System
- **Router:** `lib/aiRouter.js` — tiered cost routing with fallback chains
- **Tiers:** `nano`=GLM-4.5 Air ($0.14/M), `cheap`=GLM-4.7, `mid`=Claude Haiku, `smart`=Claude Sonnet
- **Use case map:** news/backfill→nano, laws→cheap, releases/outreach→mid, intel/blog→smart
- **Env overrides:** `AI_CHAIN`, `AI_CHAIN_INTEL`, `AI_CHAIN_ARTICLE`, etc. set in Vercel
- **Cost savings:** ~$1,065/month vs all-Sonnet baseline
- **Client:** `lib/aiClient.js` — `callAI({ prompt, useCase, maxTokens })`

## Cron Jobs (16 total in vercel.json)
| Schedule | Feed | Notes |
|---|---|---|
| `*/15 * * * *` | news | RSS + NewsAPI + GNews → AI rewrite |
| `*/30 * * * *` | market | Ammo prices |
| `0 * * * *` | releases | PRNewswire + manufacturer RSS |
| `0 */2 * * *` | laws | Congress.gov + LegiScan |
| `0 */2 * * *` | goa | Gun Owners of America press center |
| `0 */4 * * *` | video | YouTube API |
| `0 8 * * *` | state | 50-state profiles |
| `0 5 * * *` | intelligence | Daily briefing + email |
| `0 7 * * *` | newsletter | Weekly digest |
| `0 12-23,0-3 * * *` | backfill-articles | Article body generation |
| `0 12-23,0-3 * * *` | fix-images | Auto-fix broken imageUrls |
| `*/30 * * * *` | cron-health | Health check |

## News Agent Feed Sources (agent/feeds/news.js)
- The Firearm Blog, TTAG, Guns.com, NRA-ILA, ATF, SAF, Bearing Arms, AmmoLand
- TheGunFeed, Concealed Nation, American Rifleman, r/guns, r/firearms
- GOA (gunowners.org/feed), GOA Press (category/press/feed)
- Canadian: TheGunBlog.ca, NFA Canada, CSSA
- NewsAPI (`NEWSAPI_KEY`) + GNews (`GNEWS_KEY`)
- `MAX_ITEMS=20`, `ITEMS_PER_FEED=5`, `CONCURRENCY=3`
- Input trimmed to 1500 chars, output capped at 1200 tokens

## GOA Feed (agent/feeds/goa.js) — NEW
- Source: https://www.gunowners.org/press-center/
- Primary: WordPress REST API (`/wp-json/wp/v2/posts?categories_name=press-center`)
- Fallback: RSS feed parsing
- Cron: every 2 hours (`0 */2 * * *`)
- Category: `law` | Image: `/img/law.svg`
- Tags: `['GOA', '2A', 'gun-rights', 'legislation']`
- Sanity `_id` prefix: `goa-`

## Key File Paths
```
app/admin/page.js                          — Admin CMS (929 lines)
app/news/[slug]/page.js                    — Article page + SSR fallbacks
app/api/agent/route.js                     — All feed triggers (switch on ?feed=)
app/api/admin/patch-article/route.js       — Bulk imageUrl fixer
app/api/admin/ai-status/route.js           — Live key + routing check
app/api/admin/ai-costs/route.js            — Cost tracking dashboard
lib/aiRouter.js                            — Tiered AI cost router
lib/aiClient.js                            — callAI() / callAIText()
lib/cronReporter.js                        — Cron result logging to Redis
agent/utils.js                             — publishToSanity, rewriteWithClaude, etc.
agent/feeds/news.js                        — Main news feed (15 sources)
agent/feeds/goa.js                         — GOA press center feed
agent/feeds/laws.js                        — Legislation feed
agent/feeds/releases.js                    — Gun releases feed
agent/package.json                         — { "type": "module" } — ESM only
components/ui/NewsCard.js                  — 'use client', resolveImage, getFallbackImage
components/ui/ArticleHeroImage.js          — <img> with onError fallback
components/ui/LiveNewsGrid.js              — Home page live grid
components/admin/NewsArticleManager.js     — Article management UI
components/admin/AIProviderSettings.js     — AI chain builder + live status
components/admin/AICostDashboard.js        — Spend tracking UI
public/img/                                — Self-hosted SVG images (7 files)
```

## Outreach System
- Routes: `/api/outreach/queue`, `/api/outreach/send/direct`, `/api/outreach/send/preview`, `/api/outreach/history`
- Contacts: `/api/outreach/manufacturers`, `/api/outreach/dealers`, `/api/outreach/holsters`
- Flow: auto-draft → approval queue → live preview → send via Resend
- Variable: `{{pressUrl}}` in all templates

## Writing Style Rules
- Sounds like a gun owner who carries daily and reads 2A case law
- NO: "comprehensive", "dive into", "cutting-edge", "robust", "leverage", "seamlessly", "empower", "game-changer"
- Direct sentences, specific details, active voice, no padded intros
- Article structure: 900-1100 words, 5 h2 sections: opener → Background+Context → What This Means for Gun Owners → Industry Impact → What to Watch Next + DownRange Bottom Line

## Sanity Schema Types
`newsArticle`, `blogPost`, `review`, `release`, `legislation`, `breakingAlert`, `dailyBriefing`, `canadaContent`, `competition`, `stateProfile`

## Key ENV Variables
| Var | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude AI |
| `SANITY_API_TOKEN` | Sanity writes |
| `RESEND_API_KEY` | Email |
| `CRON_SECRET` | Cron auth |
| `GLM_API_KEY` | Z.ai GLM (cost savings) |
| `ADMIN_KEY` | Admin API auth |
| `UPSTASH_REDIS_REST_URL/TOKEN` | Cron history |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | vbnsqnkg |

## Deploy Process
```bash
git add -A
git commit -m "description"
git push https://dejcav-cmd:[GH_TOKEN]@github.com/dejcav-cmd/DownRange.git main
# Vercel auto-deploys ~45 seconds after push
```
