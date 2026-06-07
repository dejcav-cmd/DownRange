#!/usr/bin/env python3
"""Dry-run test for social post format across all platforms."""
import urllib.request, json, os

ADMIN_KEY = os.environ.get("ADMIN_KEY", "")
BASE = "https://downrangeco.com"

PLATFORMS = ["twitter", "bluesky", "threads", "facebook", "reddit"]

LIMITS = {
    "twitter":  280,
    "bluesky":  300,   # graphemes
    "threads":  500,
    "facebook": 63206, # no real limit, use 800 soft cap
    "reddit":   300,   # title limit
}

print("=== SOCIAL POST DRY-RUN TEST ===")
print()

all_pass = True
for platform in PLATFORMS:
    print(f"--- {platform.upper()} ---")
    url = f"{BASE}/api/social/cron/{platform}"
    req = urllib.request.Request(url,
        data=json.dumps({"count": 1, "dryRun": True}).encode(),
        headers={"x-admin-key": ADMIN_KEY, "Content-Type": "application/json"})
    req.method = "POST"
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.loads(r.read())
        posts = d.get("posts", d.get("results", d.get("dryRun", [])))
        if not posts:
            print(f"  NO POSTS GENERATED: {json.dumps(d)[:200]}")
            continue
        p = posts[0] if isinstance(posts, list) else posts
        content = p.get("content", p.get("text", ""))
        char_count = len(content)
        limit = LIMITS[platform]
        over = char_count > limit
        has_full_article = "Full article:" in content
        has_portal_url = "downrangeco.com/news/" in content or "downrangeco.com/blog/" in content
        has_source = "via " in content or content  # source is optional

        print(f"  Content: {repr(content[:200])}")
        if len(content) > 200:
            print(f"  ...({len(content)} chars total)")
        print(f"  Chars: {char_count} / {limit} {'⚠ OVER LIMIT' if over else '✓ OK'}")
        print(f"  Has \'Full article:\': {'✓' if has_full_article else '✗ MISSING'}")
        print(f"  Has portal URL: {'✓' if has_portal_url else '✗ MISSING'}")
        status = "PASS" if (has_full_article and has_portal_url and not over) else "FAIL"
        print(f"  STATUS: {status}")
        if status == "FAIL": all_pass = False
    except Exception as e:
        print(f"  ERROR: {e}")
        all_pass = False
    print()

print("=== OVERALL:", "ALL PASS ✓" if all_pass else "FAILURES DETECTED ✗", "===")
