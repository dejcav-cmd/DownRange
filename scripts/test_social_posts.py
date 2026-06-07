#!/usr/bin/env python3
"""Dry-run test for social post format — all platforms via /api/social/post"""
import urllib.request, json, os

ADMIN_KEY = os.environ.get("ADMIN_KEY", "")
BASE = "https://downrangeco.com"

LIMITS = {"twitter":280,"bluesky":300,"threads":500,"facebook":800,"reddit":300}
PLATFORMS = ["twitter","bluesky","threads","facebook","reddit"]

print("=== SOCIAL POST DRY-RUN TEST (via /api/social/post) ===\n")

# Hit the unified post endpoint with dryRun=true for all platforms at once
req = urllib.request.Request(
    f"{BASE}/api/social/post",
    data=json.dumps({"platforms":PLATFORMS,"count":1,"dryRun":True}).encode(),
    headers={"x-admin-key":ADMIN_KEY,"Content-Type":"application/json"})
req.method = "POST"

try:
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.loads(r.read())
    print(f"Response ok: {d.get('ok')}")
    print(f"Total results: {d.get('total',0)}")
    results_raw = d.get("results",[])
    print(f"Raw results count: {len(results_raw)}")
except Exception as e:
    print(f"ERROR calling /api/social/post: {e}")
    with open("fix_results.json","w") as f:
        json.dump({"test":"social_posts","overall":"ERROR","error":str(e)},f,indent=2)
    exit(1)

# Analyze each result
platform_results = {}
all_pass = True

for item in results_raw:
    platform = item.get("platform","?")
    content = item.get("content",item.get("text",""))
    status_api = item.get("status","?")
    
    char_count = len(content)
    limit = LIMITS.get(platform, 300)
    over = char_count > limit
    has_fa = "Full article:" in content
    has_url = "downrangeco.com" in content
    
    passed = has_fa and has_url and not over
    if not passed: all_pass = False
    
    print(f"\n--- {platform.upper()} ---")
    print(f"Content: {content}")
    print(f"Chars: {char_count}/{limit} {'OVER LIMIT!' if over else 'OK'}")
    print(f"Has \'Full article:\': {'YES' if has_fa else 'MISSING'}")
    print(f"Has portal URL: {'YES' if has_url else 'MISSING'}")
    print(f"STATUS: {'PASS' if passed else 'FAIL'}")
    
    platform_results[platform] = {
        "status": "PASS" if passed else "FAIL",
        "chars": char_count,
        "limit": limit,
        "over_limit": over,
        "has_full_article": has_fa,
        "has_url": has_url,
        "content": content
    }

print(f"\n=== OVERALL: {'ALL PASS ✓' if all_pass else 'FAILURES DETECTED ✗'} ===")

with open("fix_results.json","w") as f:
    json.dump({
        "test":"social_posts",
        "overall": "PASS" if all_pass else "FAIL",
        "platforms": platform_results
    },f,indent=2)
print("Saved to fix_results.json")
