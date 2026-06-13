#!/usr/bin/env python3
"""
fix-canada-articles.py
Fixes two issues with Canada RSS-ingested articles:
  1. Missing images  — fetches real OG image from sourceUrl and uploads to Sanity CDN
  2. Bad slugs       — "canada-gun-rights-news-week-of-2026-june-08" style digests
                       get renamed to "canada-<url-path-slug>" derived from sourceUrl

Usage:
  SANITY_TOKEN=xxx python3 scripts/fix-canada-articles.py          # dry run
  SANITY_TOKEN=xxx python3 scripts/fix-canada-articles.py --apply  # real mutations
"""
import json, urllib.request, urllib.parse, os, sys, re, time

TOKEN   = os.environ.get("SANITY_TOKEN", "").replace("ST=", "")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
DRY_RUN = "--apply" not in sys.argv

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        url += "&" + urllib.parse.urlencode({f"${k}": json.dumps(v) for k, v in params.items()})
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def fetch_og_image(page_url):
    """Fetch OG image from a page URL."""
    try:
        req = urllib.request.Request(page_url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; DownRange/1.0)",
            "Accept": "text/html,application/xhtml+xml",
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read(80000).decode("utf-8", errors="ignore")
        # Try og:image first
        m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
        if not m:
            m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html, re.I)
        if m:
            return m.group(1).strip()
    except Exception as e:
        print(f"    OG fetch error: {e}")
    return None

def upload_to_sanity(image_url, label):
    """Download image and upload to Sanity CDN. Returns CDN URL or None."""
    try:
        req = urllib.request.Request(image_url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; DownRange/1.0)",
            "Referer": "https://downrangeco.com",
        })
        with urllib.request.urlopen(req, timeout=12) as r:
            buf = r.read()
            content_type = r.headers.get("Content-Type", "image/jpeg")
        if len(buf) < 5000:
            return None  # skip tiny/placeholder
        ext = "png" if "png" in content_type else "webp" if "webp" in content_type else "jpg"
        filename = f"{label}-{int(time.time())}.{ext}"
        upload_url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={filename}"
        up_req = urllib.request.Request(upload_url, data=buf, method="POST", headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": content_type,
        })
        with urllib.request.urlopen(up_req, timeout=30) as r:
            data = json.loads(r.read())
        return data.get("document", {}).get("url") or data.get("url")
    except Exception as e:
        print(f"    Upload error: {e}")
    return None

def canada_slug_from_url(source_url, title):
    """Derive a clean slug from source URL, prefixed with 'canada-'."""
    try:
        parsed = urllib.parse.urlparse(source_url)
        segments = [s for s in parsed.path.split("/") if s]
        last = segments[-1] if segments else ""
        # Strip date prefix like "2026-06-08-"
        cleaned = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", last)
        cleaned = re.sub(r"\.html?$", "", cleaned)
        if len(cleaned) > 8:
            base = cleaned if cleaned.startswith("canada-") else "canada-" + cleaned
            return base[:96]
    except:
        pass
    # Fallback: strip "week of" digest patterns from title
    stripped = re.sub(r":\s*week\s+of\s+\d{4}\s+\w+\s+\d+", "", title, flags=re.I)
    stripped = re.sub(r"\s*[-–]\s*\w+\s*$", "", stripped).strip()
    base = re.sub(r"[^a-z0-9]+", "-", stripped.lower()).strip("-")[:80]
    return base if base.startswith("canada-") else "canada-" + base

def is_digest_article(slug, title):
    """Return True if this is a weekly digest round-up — should be deleted, not renamed.
    TheGunBlog.ca publishes weekly round-ups titled 'Canada Gun Rights News: Week of YYYY Month DD'
    whose URL path also reflects the digest title. These are not individual articles.
    """
    if not slug and not title:
        return False
    if re.search(r"week-of-\d{4}", slug or ""):
        return True
    if re.search(r"week\s+of\s+\d{4}", title or "", re.I):
        return True
    if re.search(r"gun.rights.news.*week", title or "", re.I):
        return True
    return False

# Keep is_bad_slug as alias for backward compat
def is_bad_slug(slug, title):
    return is_digest_article(slug, title)

# ── Main ──────────────────────────────────────────────────────────────────────
print(f"{'[DRY RUN] ' if DRY_RUN else '[LIVE] '}Scanning canadaContent articles...\n")

# Fetch all RSS-ingested Canada articles (autoGenerated=true)
docs = sanity_query(
    '*[_type=="canadaContent" && autoGenerated == true] | order(publishedAt desc) [0...200]'
    '{ _id, title, slug, imageUrl, sourceUrl, publishedAt }'
)
print(f"Found {len(docs)} auto-generated Canada articles\n")

needs_image  = [d for d in docs if not d.get("imageUrl")]
bad_slug_docs = [d for d in docs if is_bad_slug(d.get("slug", {}).get("current", ""), d.get("title", ""))]

print(f"Missing images:  {len(needs_image)}")
print(f"Bad slugs:       {len(bad_slug_docs)}")
print()

fixed_images = 0
fixed_slugs  = 0
failed       = 0

# ── Fix images ────────────────────────────────────────────────────────────────
print("── Fixing missing images ──────────────────────────────────────────")
for doc in needs_image:
    title      = doc.get("title", "")[:60]
    source_url = doc.get("sourceUrl") or doc.get("externalUrl")
    if not source_url:
        print(f"  SKIP (no sourceUrl): {title}")
        continue

    print(f"  Fetching image for: {title}")
    og_url = fetch_og_image(source_url)
    if not og_url:
        print(f"    No OG image found")
        failed += 1
        time.sleep(0.5)
        continue

    print(f"    OG: {og_url[:80]}")
    if not DRY_RUN:
        cdn_url = upload_to_sanity(og_url, "ca-img")
        if cdn_url:
            sanity_mutate([{"patch": {"id": doc["_id"], "set": {"imageUrl": cdn_url}}}])
            print(f"    ✓ Uploaded to CDN")
            fixed_images += 1
        else:
            # Fallback: store direct OG URL (better than placeholder)
            sanity_mutate([{"patch": {"id": doc["_id"], "set": {"imageUrl": og_url}}}])
            print(f"    ~ Stored direct URL (CDN upload failed)")
            fixed_images += 1
    else:
        print(f"    [DRY RUN] Would upload and set imageUrl")
        fixed_images += 1
    time.sleep(0.8)

print()
print("── Deleting weekly digest articles ────────────────────────────────")
print("   (TheGunBlog 'Week of YYYY' round-ups are not individual articles)")
for doc in bad_slug_docs:
    title    = doc.get("title", "")
    old_slug = doc.get("slug", {}).get("current", "")
    print(f"  DELETE: {title[:70]}")
    print(f"          slug: {old_slug}")
    if not DRY_RUN:
        try:
            sanity_mutate([{"delete": {"id": doc["_id"]}}])
            print(f"    ✓ Deleted")
            fixed_slugs += 1
        except Exception as e:
            print(f"    ✗ Failed: {e}")
            failed += 1
    else:
        print(f"    [DRY RUN] Would delete")
        fixed_slugs += 1
    time.sleep(0.2)

print()
print("─" * 60)
print(f"Missing images found:  {len(needs_image)}")
print(f"Bad slugs found:       {len(bad_slug_docs)}")
print(f"Images fixed:          {fixed_images}")
print(f"Slugs fixed:           {fixed_slugs}")
print(f"Failed:                {failed}")
print(f"Mode:                  {'DRY RUN — pass --apply to commit' if DRY_RUN else 'LIVE'}")
print("─" * 60)
