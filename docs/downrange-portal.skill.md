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

## Session 2026-08-22/23 — Facebook + Instagram auto-posting fully live

Built and shipped end-to-end auto-posting of new blog posts, news, gun releases,
and gun reviews to both the DownRange Facebook Page and Instagram
(@downrangeconews). Both platforms are confirmed live with real posts. This
took a long debugging arc — the notes below exist so the next session doesn't
repeat it.

### What's live now

- `agent/social/socialAgent.js` — `postFacebook()` and `postInstagram()`, both
  wired into `dispatch()`. Content pool (`fetchCandidates()`) pulls from
  `newsArticle`, `blogPost` (status==published), `firearmRelease`
  (approved==true), and `review` (defined publishedAt) — all four content
  types flow through the same pipeline with per-type URL routing
  (`/news`, `/blog`, `/releases`, `/reviews`) and per-type AI prompt framing.
- `app/api/social/cron/facebook/route.js` and `.../instagram/route.js` — GET
  (real cron, gated on `socialConfig.platforms_config_json.<platform>.enabled`)
  and POST (manual trigger, supports `dryRun`, bypasses the enabled gate —
  useful for testing without flipping the live switch).
- `vercel.json` crons: facebook `*/10 * * * *`, instagram `5-55/10 * * * *`
  (offset 5 min so they don't compete for the same top-ranked article in the
  same tick).
- Dedup is per-platform (`socialPost` docs with `status=='posted'`, matched on
  `platform + articleSlug`), so Facebook and Instagram each get their own
  independent posting history and won't skip an article just because the
  other platform already posted it.
- Hashtags: `HASHTAG_POOLS` + `pickHashtags(category, platform)` — larger
  per-category pools (including review categories: pistol/rifle/shotgun/
  optic/suppressor/accessory/ammo) with random rotation, so posts aren't
  identical every time. Instagram gets 8 tags, other platforms get 4 — IG's
  algorithm rewards tag volume, FB/Twitter don't.
- UTM tracking: every article link now carries
  `?utm_source=<platform>&utm_medium=social&utm_campaign=auto_post`. Doesn't
  help Instagram captions specifically (see below) — the IG *bio* link needs
  its own UTM tag set manually in the Instagram app, which is outside what
  this repo can automate.
- Social icons (`components/ui/SocialIcons.js`, used by both `Masthead.js` and
  `Footer.js`): full SVG icon set for all 7 platforms (was a mix of emoji and
  text glyphs before — the Instagram camera emoji in particular looked out of
  place). All use `currentColor` so the existing per-platform tint/border/hover
  styling still works. `socialConfig.socialLinks` in Sanity now has `facebook`
  and `instagram` URLs set alongside the pre-existing `bluesky`/`twitter`.
- Facebook Page has no vanity username yet, so its link is
  `https://www.facebook.com/1142984005570525` — update if DJ sets one via Page
  Settings → Username.

### The actual root causes (read this before touching Facebook/IG posting again)

**Three separate, unrelated bugs, not one.** Each looked like it could explain
the whole failure, and fixing it alone didn't fix the symptom — don't stop at
the first plausible cause:

1. **Code bug:** `postFacebook`/`postInstagram` were sending
   `Content-Type: application/json` with a JSON body to Graph API's `/feed` and
   `/photos` endpoints. Graph API does not reliably parse a JSON body for these
   endpoints — `access_token` silently fails to be read from it, and Facebook
   returns a **generic, misleading `(#200) publish_actions... deprecated`
   error** that has nothing to do with the actual cause. Fix: form-encoded
   body via `new URLSearchParams(...)`, not `JSON.stringify`. This error text
   will reappear if anyone ever "cleans up" the fetch calls back to JSON —
   don't.

2. **Facebook-side gap #1 — System User token ≠ Page token.** Generating a
   token from Business Settings → System Users → Generate Token gives a token
   typed `SYSTEM_USER` (confirmed via `debug_token`), not `PAGE`. Its `/me`
   identity resolves to the System User itself ("DownRange Automation"), not
   the Page. Using it directly against `/{pageId}/feed` fails with the same
   misleading `(#200)` error even though `debug_token` shows all the right
   scopes. **The fix is the same trick used for a personal user token:** call
   `GET /me/accounts` with the raw token — it returns the Page's own derived
   `access_token`, and *that* is what actually works for posting as the Page.
   `debug_token` on the derived token then correctly shows `type: PAGE` and
   `/me` resolves to the Page itself. Scripted in
   `scripts/facebook_token_setup.py` (resolves either a USER or already-PAGE
   token via `/me/accounts`, sets `FACEBOOK_PAGE_ACCESS_TOKEN` +
   `FACEBOOK_PAGE_ID` as GitHub secrets automatically).

3. **Facebook-side gap #2 — Page must be a Business Portfolio asset, not just
   Page-admin-accessible.** A Facebook Page you administer via your personal
   account is NOT automatically a Business Portfolio asset. The System User
   can only be assigned Pages that the Business itself owns. Symptom: `/me/
   accounts` on the System User token returns `{"data": []}` — empty — even
   though the token is valid and correctly scoped. Fix: Business Settings →
   Accounts → **Pages** → Add → Add a Page (not "Request access") → search and
   add the Page. Only then does it show up to be assigned to the System User
   under System Users → [user] → Assigned Assets, and only then does `/me/
   accounts` return it.

4. **Meta App Dashboard gotcha (recurring, applies to both Facebook Pages and
   Instagram permissions):** `pages_manage_posts` / `pages_read_engagement` /
   `instagram_basic` / `instagram_content_publish` do not appear as selectable
   permissions in Graph API Explorer's picker, or in the System User's
   "Generate Token" screen, until the app has the matching **Use Case** added
   under App Dashboard → Use Cases → Add Use Case:
   - Pages: **"Manage everything on your Page"**
   - Instagram: **"Manage messaging & content on Instagram"**
   Adding permissions to an *already-added* use case happens from the app's
   **Dashboard** (home) screen, not from the Use Cases list screen — the two
   look similar and it's easy to end up on the wrong one. No formal Meta App
   Review was needed for either — Standard/Development access was sufficient
   throughout, since DJ is both the app admin and the account owner.

5. **Instagram-specific: Page ↔ Instagram link is separate from Business
   Portfolio asset assignment.** Adding the Instagram account under Business
   Settings → Accounts → Instagram Accounts (so the System User can be
   assigned to it) does NOT automatically link it to the Facebook Page. Graph
   API's standard resolution path (`GET /{pageId}?fields=
   instagram_business_account`) depends on that Page-level link, which is
   configured separately — from the Instagram app itself (Settings → Account →
   linked/connected accounts → choose the Facebook Page), not from Business
   Settings. Symptom before this was linked: the field come back completely
   absent from the Page object (not null — absent).

**Diagnostic pattern worth reusing:** when a Graph API write silently fails
with a permissions-flavored error but everything upstream (`debug_token`,
scopes, asset assignment) checks out, test with a bare `requests.post(...,
data={...})` from a GitHub Actions runner *before* touching any app code —
isolates whether it's the token/account state or the code. Every fix in this
session was confirmed this way before being wired into `socialAgent.js`.

### Testing pattern for Instagram specifically

Unlike Facebook, a published Instagram post **cannot be deleted via the Graph
API** — there's no delete endpoint for content published through Content
Publishing. Never run a full container→publish test with throwaway content.
The safe pattern:
1. Test container creation + status poll only (`POST /{ig-user-id}/media`,
   then poll `GET /{container-id}?fields=status_code` until `FINISHED`) —
   confirms the whole chain works without publishing anything. An unpublished
   container simply expires on its own (~24h).
2. Only call `/media_publish` once that's confirmed, and only with real,
   already-published article content — never a "please disregard" test
   string, since it can't be taken back down.

### Cron monitoring — deliberately NOT wired in

Facebook/Instagram cron routes are not added to `cron-status`/`cron-health`'s
job lists. Neither route writes a `cronRun` Sanity document the way the
content-ingest crons do, so adding them would just produce permanent false
OVERDUE alerts — same category of issue documented above for other jobs. If
real monitoring is wanted later, it needs `cronRun` logging added to both
routes first, then entries in all three sync files (`vercel.json`,
`cron-status/route.js`, `cron-health/route.js`).

### Key secrets (GitHub Actions + Vercel, both needed — separate stores)

- `FACEBOOK_PAGE_ACCESS_TOKEN` / `FACEBOOK_PAGE_ID` — derived Page token (see
  above), never expires (`expires_at: 0`).
- `INSTAGRAM_ACCESS_TOKEN` / `INSTAGRAM_BUSINESS_ACCOUNT_ID` — for Instagram,
  the *raw* System User token works directly for posting (no `/me/accounts`
  derivation needed, unlike Facebook) once the Page↔IG link and Business
  Portfolio asset assignment are both in place. IG Business Account ID:
  `17841433323046880`.
- Adding/changing a Vercel env var does not retroactively apply to an
  already-running deployment — needs a fresh deploy (an empty/no-op commit
  works fine as a forcing function) before testing.

## GitHub Push PAT (Sept 2026)

The classic PAT (stored in memory as `DOWNRANGE_GH_PAT`) clones/fetches only — push requires a separate fine-grained PAT.

Neither token value is stored here — GitHub secret scanning blocks any push that introduces a recognizable token string into this repo, even in docs. Look up the current fine-grained PAT via memory or by searching past Claude chat history for "fine-grained PAT" before starting push work.

Use: `git remote set-url origin "https://x-access-token:{PAT}@github.com/dejcav-cmd/DownRange.git"` before `git push`.

Has a built-in expiration — if push starts returning "Bad credentials," it's rotated. Check recent chats for the latest value before asking DJ.

## quality-rewrite backlog bug (Sept 3 2026) — fixed

Article Intelligence showed a growing pile of NEWS articles with score 0 /
"missing body" / 0 words at the top of the list (newest first).

Two stacked root causes:
1. `quality-rewrite` was scheduled `0 3 * * *` (1x/day, 15-item batch cap)
   while news ingestion runs every 2h and intentionally publishes ~15-20%
   of articles with `body: null` (skips AI enrichment on low-value
   categories to cut cost — see comment in `agent/feeds/news.js` around
   the ENRICHMENT GATE). Daily production of bodyless articles (~40-70)
   outpaced daily backfill capacity (~15). Fixed: schedule is now
   `20 */2 * * *`, synced across `vercel.json` / `cron-status/route.js` /
   `cron-health/route.js`.
2. Deeper bug: `quality-rewrite`'s news query ordered by `publishedAt desc`
   (RSS source's original date, not ingestion time) and only fetched the
   top 30. Any article with an older `publishedAt` got permanently pushed
   out of that window by newer articles — invisible to the cron forever,
   regardless of run frequency. Confirmed via diagnostic: manually
   triggering the cron 4x hit "queue empty" every time despite 26 articles
   missing body site-wide — the query genuinely never saw them.
   Fixed in `app/api/cron/quality-rewrite/route.js`: added a second,
   independent query targeting `!defined(body) || length(body) < 100`
   directly, ordered `_createdAt asc` (oldest first, FIFO), merged into
   the candidate pool deduped by `_id`. Guarantees eventual drain
   regardless of `publishedAt` age.

Lesson: when a "top N by [date field] desc" query is used as a recurring
work queue, anything that falls out of the window is silently starved
forever — increasing run frequency alone does NOT fix that, since the
window itself never grows to include the straggler. Any future
backfill/cleanup cron built the same way should get a dedicated
unbounded/backlog-draining query, not just a tighter schedule.

Diagnostic pattern used: Sanity's API isn't in the sandbox's allowed
egress domains, so verification ran through a one-off GitHub Actions
workflow (python script + Contents API push back to repo — git push from
within Actions kept failing even with `permissions: contents: write` set,
Contents API PUT worked reliably). Workflow/script files removed after
the fix was confirmed; this note is the durable record.

## Instagram/social posts using vector images instead of article photos (Sept 3 2026) — fixed

Reported via screenshot: an Instagram post showed a flat vector illustration
(scales of justice + gavel icon) instead of a real article photo.

Root cause was in `agent/social/socialAgent.js`, not the news ingestion
pipeline. Two separate fallback paths both pointed at local files —
`/img/photos/law.jpg`, `rifle.jpg`, `news.jpg` — which turned out to NOT be
photos at all despite the "photos" directory name:
  - `law.jpg` = flat scales-of-justice/gavel icon illustration (the exact
    image from the bug report)
  - `rifle.jpg` = flat firearm silhouette diagram
  - `news.jpg` = a website UI mockup screenshot

1. `getImage()` used these as the fallback whenever `article.imageUrl` was
   empty. Fixed: now does a live Pexels/Pixabay photo search (reusing
   `searchForImage` from `agent/utils.js`, same function news ingestion
   uses) instead, returning null (skip posting) if no real photo exists.
2. `postInstagram()`'s aspect-ratio safety check (Instagram requires
   0.8–1.91 ratio, detected via Sanity CDN's `-{width}x{height}.{ext}`
   filename convention) ALSO substituted these same files whenever the
   ratio was confirmed bad OR — critically — whenever it couldn't be
   confirmed at all, which is the case for any external URL not hosted on
   Sanity's CDN, including raw Pexels/Pixabay results from fix #1's live
   search. This path could silently undo fix #1. Fixed: confirmed-bad
   ratio now skips the post with a clear error; unconfirmable ratio now
   trusts the real image and lets Instagram's own validation catch genuine
   problems (retried next cron cycle via the existing failed-post retry
   path) instead of ever substituting a placeholder.

Also investigated (as a possible contributing cause, defense in depth):
`fetchAndUploadOgImage()` in `agent/utils.js` only filtered candidate
OG-scraped images by file extension and pixel dimensions — a PNG-rendered
vector illustration from a source site would pass every check. Added
`isPhotographicImage()`, a Claude-vision binary classifier (photo vs.
illustration), gating the OG-image upload path. A pixel-color-variety
heuristic was tried first and rejected: dark/moody product photography
(common in this niche) has similarly low color variety to flat vector art
and got false-positive-rejected in testing (ammo.jpg, homedefense.jpg,
suppressor.jpg — note suppressor.jpg turned out to ALSO be a vector
diagram, not a real photo, on inspection). Fails open on any API error so
a transient hiccup never blocks a legitimate photo.

Verified live via a dry-run of the actual Instagram cron route
(`POST /api/social/cron/instagram` with `dryRun: true`) — all 5 candidate
articles, including law/policy content that previously would have hit the
broken fallback, showed real Sanity CDN image URLs with valid embedded
dimensions and in-range aspect ratios. None fell back to the vector files.

NOT fixed (explicitly out of scope, flagged for later): the same
`/img/photos/{law,rifle,news}.jpg` files are referenced across dozens of
other components and routes site-wide (NewsCard, ReleaseCard, IntlArticleCard,
blog/news/canada/brazil pages, many admin fix-image routes,
`app/api/admin/fix-images/route.js`'s own `BAD_URLS` list oddly already
contains these same paths as "bad" while other code still points to them
as fallbacks). Worth a dedicated site-wide sweep at some point — real
photos need to replace the whole `/img/photos/` category-fallback set, not
just be avoided in the social pipeline.
