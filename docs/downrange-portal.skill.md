# DownRange Portal — Session Notes (July 4 2026)

## Releases Feed — v5

**File:** `agent/feeds/releases.js`

**Sources (40 total — direct manufacturer scrape, NO Google News):**

Pistols: Glock, SIG Sauer (x2), Smith & Wesson, Springfield Armory, Taurus USA,
Beretta USA, Kimber, Walther Arms, CZ-USA, CZ Firearms, HK USA, FN America,
Ruger, Canik USA, Staccato, Shadow Systems, Wilson Combat, Nighthawk Custom

Rifles/Long guns: Daniel Defense, Aero Precision, BCM, LWRC, Christensen Arms,
Savage Arms, Mossberg, Winchester, Browning, Benelli USA, Maxim Defense,
PSA, MPA (MasterPiece Arms), Tikka, Fusion Firearms (direct HTML scrape)

Suppressors/Optics: SilencerCo, Dead Air, Holosun, Trijicon, Vortex

**Architecture:**
- `isFirearmRelease(title, desc)` — requires BOTH a PRODUCT signal AND a FIREARM signal; hard-blocks SKIP signals (financials, cleaning products, editorials, promos)
- `scrapeListingPage(source)` — fetches listing page HTML, extracts `<a>` links matching `source.linkPattern`, pre-filters titles before fetching article pages
- `fetchPageContent(url)` — scrapes og:image → twitter:image → largest `<img>` (jpg/png/webp only, ≥200px, rejects SVG/logo/google/pixel)
- Claude Haiku prompt includes explicit `skip:true` instruction for non-product-launch content
- Images uploaded to Sanity CDN as `heroImage`; `imageUrl` used only as fallback

**Cron:** `45 */6 * * *` — fires at 00:45, 06:45, 12:45, 18:45 UTC

## Cleanup Routes

`/api/admin/delete-gnews-releases` — deletes all `firearmRelease` docs with `news.google.com` sourceUrl + fixes bad images. Auth: `x-admin-key: ADMIN_KEY`.

`/api/cron/fix-placeholder-images` — hourly cron. Phase 2 added: patches `firearmRelease` docs with google-logo imageUrl.

## WAF Notes

- Vercel WAF blocks direct `curl` to both `downrangeco.com` AND `down-range-indol.vercel.app` from Claude's sandbox AND from GitHub Actions runners (Azure IPs blocked)
- Sanity API (`vbnsqnkg.api.sanity.io`) IS reachable from GitHub Actions runners
- Azure blob log URLs (`productionresultssa*.blob.core.windows.net`) are NOT reachable from Claude's sandbox
- To read GH Actions output: have the workflow commit results to a file in the repo, then read via GitHub Contents API

## Image Pipeline (Releases)

Root cause of Google News logo images: Google News RSS `item.link` was a `news.google.com/rss/articles/CBMi...` redirect. `fetchPageContent` followed redirect to Google reader page whose `og:image` = Google News logo.

Fix: removed Google News entirely. All sources are now direct manufacturer pages.

## Key Known Issues Fixed

- `delete-gnews-releases.yml` was triggering on push events (caused "No jobs were run" email) — fixed to `workflow_dispatch` only
- `releases.js` DEADLINE constant removed along with Google News (it only existed to gate the Google News loop)

## Releases Feed — v7 (Two-Phase Queue)

**Architecture:**
- `scrapeReleases({backfill})` — scrape all 65 sources in batches of 8, keyword-gate, push to Redis
- `processReleases({backfill})` — pop PROCESS_BATCH=6 from Redis, per item: fetch → date check → Claude → image → save
- `WALL_CLOCK_SAFE = 250s` — checked before every article; re-queues current item if limit hit
- `runReleasesFeed()` — chains both phases (backwards compat)
- Queue keys: `dr:releases:queue` (regular) / `dr:releases:backfill` (no date cutoff)

**Cron schedule:**
```
45 6 * * 1,4   /api/agent?feed=releases&phase=scrape   (Mon+Thu 06:45 UTC)
50 6 * * 1,4   /api/cron/releases-process               (Mon+Thu 06:50 UTC)
```

**New route:** `/api/cron/releases-process` (maxDuration 300s, accepts backfill=1)

**Agent route params:**
- `?phase=scrape` → scrapeReleases()
- `?phase=process` → processReleases()
- `?backfill=1` → skips 6-month cutoff, uses BACKFILL_KEY
- No params → runReleasesFeed() (both phases)

**On-demand trigger (WAF issue):**
- Vercel WAF blocks all external callers to downrangeco.com (GH Actions, sandbox IPs)
- Fix: add VERCEL_BYPASS_SECRET to Vercel dashboard → Project → Settings → Deployment Protection → Protection Bypass for Automation
- Then add same value as VERCEL_BYPASS_SECRET in GitHub Actions secrets
- Use header: `x-vercel-protection-bypass: SECRET`
- Workflow: `.github/workflows/full-backfill-releases.yml`

**Sources:** 65 total (see releases.js header for full list)

## Deals Image Pipeline — Root Cause & Fix (July 4 2026)

**Root cause:** `scrapeOGImage()` in `app/api/cron/gun-deals/route.js` had a broken cdn-cgi URL reconstruction.

gun.deals serves `og:image` via Cloudflare transforms:
```
https://gun.deals/cdn-cgi/image/format=auto,width=800/https://gun.deals/sites/default/files/foo.jpg
https://gun.deals/cdn-cgi/image/f=auto/sites/default/files/foo.jpg
```

Old code did `origin + '/' + captureGroup` — when capture group was a full `https://` URL this produced `https://gun.deals/https://gun.deals/sites/...` (malformed). `downloadImage()` silently failed, cron stored the raw gun.deals URL in Sanity's `imageUrl` field. gun.deals CDN is hotlink-blocked by Cloudflare → broken images in browser.

**Fix in `app/api/cron/gun-deals/route.js` `scrapeOGImage()`:**
```js
const cdnCgiMatch = imgUrl.match(/\/cdn-cgi\/image\/[^\/]+\/(.+)/)
if (cdnCgiMatch) {
  const downstream = cdnCgiMatch[1]
  if (downstream.startsWith('http://') || downstream.startsWith('https://')) {
    imgUrl = downstream  // full URL — use as-is
  } else {
    imgUrl = 'https://gun.deals/' + downstream.replace(/^\//, '')
  }
}
```
Same fix applied in `scripts/scheduled_image_fix.py` `scrape_og()`.

**`scheduled_image_fix.py` expanded scope:** now queries both null imageUrl AND `string::startsWith(imageUrl, "https://gun.deals")` (not just null), batch limit 150/run.

**Backfill results (full corpus):**
- Pre-fix: 677 gun.deals hotlink URLs + 52 null = 729 broken
- Post-backfill: cdn.sanity.io 3,092→3,450 | gun.deals 677→330 | null 52→41
- 30-day targeted run after: 110 more fixed (105 CDN uploads + 5 OG fallbacks)
- Final state: ~3,560 of 3,871 total deals have stable cdn.sanity.io images

**Workflows:**
- `backfill-gundeals-images.yml` + `scripts/backfill_gundeals_images.py` — full corpus backfill (workflow_dispatch only)
- `fix-deals-images-30d.yml` + `scripts/patch_deals_30day.py` — 30-day scoped patch (workflow_dispatch only)
- `auto-fix-deal-images.yml` — existing 30-min scheduled fix (expanded to catch gun.deals URLs)

**GH Actions YAML heredoc bug (re-confirmed):** Inline Python via `run: python3 << 'PYEOF'` breaks YAML parsing — Python assignment lines (`LOG = '...'`) parse as YAML keys. GitHub strips all triggers, workflow shows filename as name, `workflow_dispatch` returns 422. Always move Python to a script file. This also causes "No jobs were run" notification emails on push-triggered workflows.

**GH Actions trigger cache:** GitHub caches trigger metadata per file path. Updating a workflow file that previously had a broken/push trigger does NOT immediately refresh — even after multiple pushes. Only reliable flush: delete the file entirely and create a new one with a different filename.
