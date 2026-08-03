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

## Admin Navigation — Collapsible Tree (July 2026)

**Web admin (`app/admin/page.js`):** Replaced horizontal section tabs + sub-tab strip with a collapsible sidebar tree. Sections are folders with `▶` arrow; panels are indented leaves. CSS classes: `.adm-tree-section`, `.adm-tree-hdr`, `.adm-tree-leaves`, `.adm-tree-leaf`. State: `openSections` (Set), `section`, `panel`. `toggleSection(id)` opens/closes a folder. `openPanel(sectionId, panelId)` navigates directly to a leaf. Breadcrumb bar (`adm-breadcrumb`) replaces the sub-tab strip. Topbar shows ✓ HEALTHY green pill when system is healthy.

**PWA (`public/admin-app/index.html`):** Replaced bottom nav tabs + slide-up tray with a hamburger-triggered left drawer. `buildNavTree()` lazily renders the tree on first open using `NAV_TREE` const. `_openSecs` Set tracks expanded sections. `navToPanel(secId,panelId,label)` navigates + updates breadcrumb + closes drawer. Breadcrumb bar `#pwa-breadcrumb` with `#bc-section-label` and `#bc-panel-label`. `openSheet()`/`closeSheet()` are aliases for backwards compat.

**Consolidations made:**
- Social Media (1 panel) absorbed into Outreach → "Outreach & Social"
- `sysalerts` + `smsalerts` → `UnifiedAlertsPanel` (internal tab strip)
- `copyright` + `compliance` → `LegalPanel` (internal tab strip)  
- `mailing-list` moved from Publishing to Outreach & Social
- `overview` renamed to "Mission Control"
- Settings renamed to "Config"

**NAV_TREE** in PWA mirrors web admin `NAV` const exactly (7 sections, same IDs/labels).

## Vercel Env Vars + SMS Configuration (July 2026)

### SMS via Redis override (no Vercel deploy needed)
`smsAlert.js` reads `getSMSOverrideConfig()` from Redis key `dr:sms:config` and spreads it over env var config. Phone fallbacks hardcoded: from=`+12062036281`, to=`+12066016076` (DJ).

To update SMS config without a redeploy:
```bash
curl -sL -X POST "https://downrangeco.com/api/admin/sms-config" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -H "x-vercel-protection-bypass: $VERCEL_BYPASS_SECRET" \
  -d '{"sid":"AC[TWILIO_SID_IN_GITHUB_SECRETS]","token":"...","from":"+12062036281","to":"+12066016076","enabled":true,"criticalJobs":["news","cron-health","gun-deals","sanity"]}'
```

### Vercel env vars via GitHub Actions (requires VERCEL_TOKEN secret)
```yaml
env:
  VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
run: |
  P=$(curl -sf "https://api.vercel.com/v9/projects/downrangeco" -H "Authorization: Bearer $VERCEL_TOKEN")
  PID=$(echo "$P" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  TID=$(echo "$P" | python3 -c "import sys,json; print(json.load(sys.stdin)['accountId'])")
  curl -sf -X POST "https://api.vercel.com/v10/projects/$PID/env?teamId=$TID" \
    -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
    -d '{"key":"MY_KEY","value":"myval","type":"encrypted","target":["production","preview","development"]}'
```
`VERCEL_TOKEN` is NOT currently in repo secrets (only `VERCEL_BYPASS_SECRET` is). Add it via: Vercel → Account → Settings → Tokens → Create Token → add as GitHub secret.

### Push-branch workflow pattern (when no VERCEL_TOKEN)
1. Create workflow file listening on `branches: [your-trigger-branch]`
2. Push workflow file to `main` first
3. Create trigger branch from main (so workflow file exists on it)
4. Push a new commit to the trigger branch to fire the workflow
5. **CRITICAL:** Never use inline `python3 << 'EOF'` heredocs or multiline `python3 -c "..."` in YAML — they parse as YAML keys and silently strip `workflow_dispatch` triggers. Always write Python to a temp file:
   ```yaml
   run: |
     cat > /tmp/script.py << 'PYEOF'
     import json, os
     # ... your code ...
     PYEOF
     python3 /tmp/script.py
   ```
6. Always add `-H "x-vercel-protection-bypass: $BYPASS_SECRET"` to downrangeco.com API calls from GHA


## Session 2026-08-03 — Giveaways blackout / r.jina.ai outage

**r.jina.ai is dead as a scraping transport.** It moved behind Cloudflare and now
returns a 403 "Just a moment..." interstitial to every datacenter IP (verified
from both Vercel and a GitHub Actions runner) in 15-40ms. Anything in this repo
that reaches the web through `https://r.jina.ai/` should be assumed broken until
proven otherwise. `JINA_API_KEY` does not help — the block is at Cloudflare's
edge, before auth.

Known consumers still pointing at it: `app/api/cron/web-deals/route.js`,
`app/api/cron/gun-deals/route.js`, `lib/scrapeProductImage.js`,
`app/api/admin/amazon-asin/route.js`, `app/api/admin/amazon-diag/route.js`,
several `scripts/*.py`.

**Giveaways cron — what was wrong and what changed**

Three of four sources were Jina-proxied, so all three 403'd instantly and the run
finished in 973ms. The manufacturer scraper's five URLs were all dead
independently (PSA 403, Lucky Gunner 404, Springfield 404, GOA 404, Taurus
202/empty JS shell) — removed. The parsers only spoke markdown (Jina's output),
so even swapping transport would have matched zero rows against real HTML.

Scrapers now live in `lib/giveawaySources.js`, imported by both
`app/api/cron/giveaways/route.js` and `agent/feeds/giveaways.js` (which used to
carry a second, separately-rotting copy). Rules that matter:

- `fetchPage()` = direct fetch with a browser UA first, Jina only as fallback.
  Direct returns 200 on wintheguns.com and gungiveaways.net. gunmade.com is
  Cloudflare-blocked both ways and is marked `required: false` so it cannot hold
  the blackout alarm permanently red.
- `extractLinks()` parses HTML anchors AND markdown. Keep both. A transport
  change silently zeroing out extraction is exactly how this broke.
- End date = the LATER of the first two dates after a row's link. wintheguns
  prints "$value end start", gungiveaways prints "start $value end" — taking the
  max resolves both without per-site logic. Dates >400 days out are discarded as
  bleed from a neighbouring row.
- A row with neither a prize value nor an end date is page furniture, not a
  giveaway (the WordPress footer credit was being saved as one).
- Cross-source dedup is mandatory: both aggregators wrap the same prize in their
  own tracking short-link, so URL dedup alone leaves ~30 rows duplicated. Merge
  requires same end date (+/-1 day), 2+ shared title tokens, 45% coverage of the
  shorter title, no brand conflict. The brand-mismatch veto is what stops "Win 1
  of 6 Rossi Lever Rifles" merging into "S&W Model 1854 Lever Action Rifle".
- One `normalizeUrl()` for both in-run dedup and the existing-doc check. They
  previously disagreed (dedup stripped the query string, the existing check kept
  it), so utm-tagged duplicates were re-created every run.
- `createIfNotExists` with a deterministic `_id`, never bare `create`.

**giveaway schema gotchas**

- `endDate` is `date` (bare YYYY-MM-DD), NOT `datetime`. `/giveaways` does
  `new Date(endDate + 'T23:59:59Z')`, which is Invalid Date against a full ISO
  timestamp. Never write a timestamp here.
- Omit `endDate` entirely when unknown. Do not send null.
- `prizeValue` and `sourceType: 'aggregator'` were missing from the schema and
  have been added.

**Build / tooling**

- `package-lock.json` had drifted from `package.json` on `@types/*` and
  `typescript`, so `npm ci` failed EUSAGE and the Build Check workflow never got
  past install. It had been publishing a stale `scripts/build_output.txt` from
  July 24 on every run — a green-looking workflow reporting a month-old build.
  Resynced with `npm install --package-lock-only --legacy-peer-deps`.
- `Source Health Check` workflow (dispatch-only) runs the real scrapers against
  live sites via `scripts/test_giveaway_sources.mjs` and fails if a required
  source returns 0. Run it after any scraper edit.
- Sandbox network allowlist blocks Sanity, Vercel and all scrape targets — only
  api.github.com, npm and pypi are reachable. Live verification has to go through
  a dispatch-only GitHub Actions workflow that writes results back via the
  Contents API (Azure blob log URLs are unreachable from the sandbox).

**Open**

- gun.deals product pages return 403 to BOTH direct fetch and Jina, so
  `scrapeOGImageViaJina()` in gun-deals returns null on every deal and the deals
  page is serving placeholders. The RSS feed is reachable (200, ~330KB) but
  carries NO images at all — no media:content, no media:thumbnail, no enclosure,
  no <img> in the item bodies, zero image URLs of any kind. So there is currently
  no working image source for gun-deals. Options are a different reader proxy, a
  headless-render service, or accepting placeholders until one is chosen. Do not
  substitute stock photos — a placeholder beats a wrong product image.


## Session 2026-08-03 (part 2) — junk giveaways on the live page

Symptom: `/giveaways` showing "wintheguns.com", "More Giveaways Here!", "Youth
Wildlife Art Contest" and two NRA scholarship pages as live ONGOING giveaways.

Three independent root causes, all needed fixing:

1. **The pre-rewrite scraper had no quality gate.** It saved the source's own
   homepage and nav links as prizes. Fixing the parser stopped new junk but did
   nothing about the 118 documents already in Sanity.
2. **Documents with no `endDate` were immortal.** The expiry sweep filtered on
   `g.endDate && g.endDate < today`, so a null end date never matched — and
   `/giveaways` explicitly renders `endDate == null` rows as ONGOING. A July nav
   link was still on the page in August.
3. **The cron only ever added.** It had no path that could remove anything, so
   every bug in every past version of the scraper was permanent.

**The rule that prevents recurrence:** `giveawayQualityIssue()` in
`lib/giveawaySources.js` is ONE definition applied at write time AND as a sweep
over every stored document on every run. Any future scraper bug self-heals on
the next cron. Retirement reasons:

- entry URL points back at an aggregator instead of a sponsor
- navigation / page-chrome title
- title made entirely of generic words (a doc titled just "Giveaways" survived
  the first pass because a dollar figure had bled in from a neighbouring row —
  the value/date check alone is not sufficient)
- neither a prize value nor an end date
- no end date and older than `STALE_NO_END_DATE_DAYS` (45)

Documents are deactivated, never deleted, with the reason written to
`editorNote`. The sweep also repairs stored titles (`cleanStoredTitle`) rather
than leaving old markup artifacts on the page until they expire.

**General principle for any ingest cron in this repo:** a write-time filter is
only half a fix. If the cron cannot retire what it previously wrote, bad data is
permanent. Every ingest job should re-validate its own stored documents against
the current bar on every run.

`Giveaway Audit` workflow (dispatch-only) runs the cron then reports what
survived — use it after any change to the quality gate.
