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

---

## AvantLink Affiliate Verification (hard-won — read before touching AvantLink)

**The single most important rule: get the EXACT snippet from the applicant's AvantLink email/dashboard BEFORE writing any code. Do not reconstruct it.**

The verification snippet is NOT `?mode=js&application_id=XXXX`. That form has no auth token and will ALWAYS fail verification with "Unable to locate authentication information in the confirmation file." The real snippet contains a unique per-application token:
```
<script type="text/javascript" src="http://classic.avantlink.com/affiliate_app_confirm.php?mode=js&authResponse=<40-char-hex-token>"></script>
```
The `authResponse` token is only visible behind the "Install this JavaScript tag" link in the applicant's application email — it is not in the email body and cannot be guessed. Ask the applicant to paste the exact tag (or screenshot it if copy drops it) before doing anything else. Four sessions were wasted debugging placement when the real problem was the wrong URL form the whole time.

**Where to place it:** the `app/avantlink-verify/route.js` GET handler returns RAW verbatim HTML via `NextResponse` — no React, no `&`→`&amp;` encoding, no async/execution mangling. This is the correct home for the snippet. Put the exact tag in the `<head>` there.

**Why the homepage does NOT work:** the homepage is React/Next. Two failure modes were confirmed live:
1. A plain JSX `<script src="...&...">` renders the `&` as `&amp;` in the HTML source.
2. A `<script>` injected via `dangerouslySetInnerHTML` (hidden div) appears in source but browsers NEVER execute innerHTML-injected scripts — so AvantLink's executing verifier finds no written token.
Do not try to force verification through the React homepage. Use the dedicated `/avantlink-verify` route.

**Applied-URL / trailing-slash gotcha:** using box #2 ("change the URL") on the AvantLink error page overwrites the official applied URL (confirmed via the follow-up email showing the new URL). AvantLink then appends filenames to and checks that exact URL. Note `/avantlink-verify/` (trailing slash) 308-redirects to `/avantlink-verify` under default `trailingSlash:false`; browsers/JS-executing crawlers follow it fine, but if AvantLink reports "cannot reach URL," eliminate the redirect (don't flip global `trailingSlash`; scope it).

**Mixed content:** AvantLink's snippet is `http://` but the site is `https://`. Place it verbatim as they provide it (that's what their verifier expects). If a strict browser check blocks it, swap to `https://` with the SAME token and re-verify.

**Verification links (from the error page):**
- JS method: `.../affiliate_app_confirm.php?mode=verify-js&application_id=<id>`
- File method: `.../affiliate_app_confirm.php?mode=verify-file&application_id=<id>`
- Re-send instructions email: `.../affiliate_app_confirm.php?mode=send-instructions&application_id=<id>`
The error page's "click here to confirm again" sometimes routes back to the JS method even if the prior error was file-method — read which `mode=` the link uses.

**Verifying our own placement (site is behind Vercel WAF, sandbox gets 403):** use the `avantlink-check.yml` workflow (runs from Azure IP) → `scripts/avantlink_check.sh` curls the live URL and greps for `authResponse=<token>`; commit result back via `git push` in the workflow (NOT the Contents API PUT — that fails on new-file creation with empty sha). Read the committed `scripts/avantlink_check_result.txt`. Confirm the token string is present with a literal `&` and the URL returns 200 (after any redirect) before telling the applicant to click verify.

**"Confirmed" ≠ "Approved":** passing ownership verification only queues the application for manual staff review (a few days). That review judges the actual site — the same bar (low traffic, must look like a real active business) that can reject. Do not treat confirmation as done.

**Sequence that works:**
1. Get the exact `authResponse` snippet from the applicant (paste or screenshot).
2. Put it verbatim in `app/avantlink-verify/route.js` `<head>`.
3. Commit, push, confirm Vercel deploy success.
4. Run `avantlink-check.yml`; confirm the token is live at the applied URL from an outside IP.
5. Applicant clicks the `mode=verify-js` link.
6. On success, AvantLink says the tag can be deleted; clean up leftover snippets (e.g. any dead `application_id` tag in `app/page.js`) and the debug workflow.

**Fallback if automated verification keeps failing:** email `affiliateapps@avantlink.com` with Application ID, applied URL, applied email, and a screenshot of the placed tag for manual human confirmation. This is an AvantLink-sanctioned path, not a hack.

## gun-deals Cron — Transient Cloudflare Block Pattern

**Confirmed incidents:** July 14, 2026 and July 16, 2026.

**Fingerprint:**
- Duration: ~263ms (way too short to have fetched anything)
- Error: `gun.deals: all RSS URLs failed`
- Pattern: single isolated failure surrounded by successful runs

**Diagnosis:** Transient Cloudflare block on gun.deals RSS endpoints. Not a code bug. gun.deals uses Cloudflare Bot Fight Mode; occasionally a cold Vercel Lambda hits a challenge and fails fast.

**Action required:** None for isolated single-run failures — self-healing (next scheduled run succeeds automatically).

**Escalation trigger:** 3+ consecutive failures → implement Jina proxy RSS fallback (`r.jina.ai/https://gun.deals/feed`) as the primary fetch path with direct RSS as fallback. Not yet implemented as of July 2026.

**Do NOT:**
- Roll back code
- Change cron schedule
- Open a bug ticket

Only act if failures cluster (3+ in a row).
