# DOWNRANGE — America's Firearms Intelligence Hub

> Live. Loaded. Lawful.

**downrangeco.com** — The most comprehensive 2A news, law tracking, market data, and reviews platform in the country.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| CMS | Sanity v3 (headless) |
| Auth | Clerk (passwordless) |
| Email | Resend |
| Search | Algolia |
| Cache | Upstash Redis |
| Agent | Node.js + Claude API |
| Hosting | Vercel (Pro — cron jobs required) |
| Database | Supabase PostgreSQL (ammo price history) |

---

## Quick Start

### 1. Clone and install
```bash
git clone https://github.com/yourorg/downrange.git
cd downrange
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Fill in all values — see .env.example for descriptions
```

### 3. Set up Sanity project
```bash
npx sanity init
# Use your project ID from https://sanity.io/manage
```

### 4. Seed initial data
```bash
npm run seed:states   # Loads all 50 state profiles
npm run seed:ammo     # Loads baseline ammo prices
```

### 5. Run dev server
```bash
npm run dev           # Next.js at localhost:3000
```

### 6. Run Sanity Studio
Visit: `http://localhost:3000/studio`

### 7. Start the agent
```bash
npm run agent         # Runs all feed crons locally
```

---

## API Keys You Need

| Service | Where to Get | Cost |
|---------|-------------|------|
| NewsAPI | newsapi.org | $449/mo (or use RSS only = free) |
| GNews | gnews.io | $9/mo |
| Congress.gov | api.congress.gov | Free |
| LegiScan | legiscan.com/legiscan-api | $20-50/mo |
| GunBroker | developer.gunbroker.com | Free (business terms for production) |
| YouTube Data API | console.cloud.google.com | Free (10k units/day) |
| Sanity | sanity.io | $15/mo (Growth) |
| Clerk | clerk.com | Free up to 10k MAU |
| Resend | resend.com | Free up to 3k/mo |
| Algolia | algolia.com | Free up to 10k records |
| Upstash Redis | upstash.com | Free tier available |
| Anthropic | anthropic.com | ~$30/mo at scale |

**Estimated monthly cost:** ~$573/mo full stack | ~$130/mo lean (no NewsAPI)

---

## Project Structure

```
downrange/
├── app/
│   ├── layout.js                    # Root layout
│   ├── studio/[[...tool]]/page.jsx  # Sanity Studio at /studio
│   └── site/
│       ├── page.js                  # Homepage
│       ├── news/page.js             # News feed
│       ├── news/[slug]/page.js      # Article detail
│       ├── laws/page.js             # Laws & Legislation
│       ├── reviews/page.js          # Reviews
│       ├── reviews/[slug]/page.js   # Review detail
│       ├── releases/page.js         # New Releases
│       ├── state-hub/page.js        # State Hub
│       ├── state-hub/[state]/page.js# State detail
│       ├── market/page.js           # Market Watch
│       ├── video/page.js            # Video Hub
│       ├── search/page.js           # Search
│       └── about/page.js            # About
├── app/api/
│   ├── agent/route.js               # Vercel cron trigger
│   ├── algolia-sync/route.js        # Sanity → Algolia webhook
│   ├── newsletter/route.js          # Subscribe + daily digest
│   ├── nics/route.js                # FBI NICS data fetcher
│   ├── revalidate/route.js          # ISR revalidation
│   └── webhook/route.js             # Sanity webhook handler
├── agent/
│   ├── index.js                     # Cron orchestrator
│   ├── utils.js                     # Claude, Discord, Sanity helpers
│   └── feeds/
│       ├── news.js                  # NewsAPI + GNews + RSS
│       ├── laws.js                  # Congress.gov + LegiScan
│       ├── releases.js              # GunBroker + manufacturer RSS
│       ├── market.js                # AmmoSeek + Reddit
│       ├── video.js                 # YouTube Data API
│       └── state.js                 # LegiScan state bills
├── components/
│   ├── layout/BreakingTicker.js     # Red ticker bar
│   ├── layout/Masthead.js           # Nav header
│   ├── layout/StatsBar.js           # Gold stats bar
│   ├── layout/Footer.js             # Site footer
│   ├── sections/StateHub.js         # Interactive state selector
│   └── ui/NewsCard.js               # News card component
├── sanity/
│   ├── lib/client.js                # Sanity client + GROQ queries
│   └── schemas/                     # All document type schemas
├── scripts/
│   ├── seed-states.js               # Seed 50 state profiles
│   └── seed-ammo.js                 # Seed ammo baselines
├── styles/globals.css               # Design tokens + global styles
├── middleware.js                    # Clerk auth middleware
├── sanity.config.js                 # Sanity Studio config
├── sanity.cli.js                    # Sanity CLI config
├── tailwind.config.js               # Tailwind design system
├── vercel.json                      # Cron job schedules
└── .env.example                     # All required env vars
```

---

## Vercel Deployment

1. Push to GitHub
2. Import to Vercel
3. Add all env vars from `.env.example`
4. Deploy — cron jobs activate automatically on Pro plan

**Required Vercel plan:** Pro ($20/mo) — free tier doesn't support cron jobs

---

## Sanity Webhooks

Configure in Sanity project settings → API → Webhooks:

| Trigger | URL | Secret Header |
|---------|-----|---------------|
| Document published | `https://downrangeco.com/api/algolia-sync` | `x-sanity-webhook-secret` |
| Document published | `https://downrangeco.com/api/revalidate` | `x-revalidate-secret` |

---

## Discord Setup

1. Create private Discord server
2. Create 3 channels: `#agent-status`, `#errors`, `#breaking-alerts`
3. Create webhook for each channel
4. Add webhook URLs to `.env.local`

---

## License

Proprietary — DownRange / DJ — 2026
