#!/usr/bin/env python3
"""Dry-run test for social post format using requests (follows redirects)."""
import os, json, sys

# Use requests which follows redirects properly
try:
    import requests
except ImportError:
    import subprocess
    subprocess.run(["pip","install","requests","-q"])
    import requests

ADMIN_KEY = os.environ.get("ADMIN_KEY","")
BASE = "https://downrangeco.com"
LIMITS = {"twitter":280,"bluesky":300,"threads":500,"facebook":800,"reddit":300}
PLATFORMS = ["twitter","bluesky","threads","facebook","reddit"]

print("=== SOCIAL POST DRY-RUN TEST ===\n")

try:
    resp = requests.post(
        f"{BASE}/api/social/post",
        json={"platforms":PLATFORMS,"count":1,"dryRun":True},
        headers={"x-admin-key":ADMIN_KEY},
        timeout=120,
        allow_redirects=True
    )
    print(f"HTTP {resp.status_code} — {resp.url}")
    d = resp.json()
    print(f"ok={d.get('ok')} total={d.get('total',0)}")
except Exception as e:
    print(f"FATAL ERROR: {e}")
    with open("fix_results.json","w") as f:
        json.dump({"test":"social_posts","overall":"ERROR","error":str(e)},f,indent=2)
    sys.exit(1)

results_raw = d.get("results",[])
platform_results = {}
all_pass = True

for item in results_raw:
    platform = item.get("platform","?")
    content = item.get("content",item.get("text",""))
    char_count = len(content)
    limit = LIMITS.get(platform,300)
    over = char_count > limit
    has_fa = "Full article:" in content
    has_url = "downrangeco.com" in content
    passed = has_fa and has_url and not over
    if not passed: all_pass = False
    
    print(f"\n--- {platform.upper()} ---")
    print(f"Content:\n{content}")
    print(f"\nChars: {char_count}/{limit} ({'OVER' if over else 'OK'})")
    print(f"Full article: {'YES' if has_fa else 'MISSING'}")
    print(f"Portal URL:   {'YES' if has_url else 'MISSING'}")
    print(f"STATUS: {'PASS' if passed else 'FAIL'}")
    
    platform_results[platform] = {
        "status":"PASS" if passed else "FAIL",
        "chars":char_count,"limit":limit,
        "over_limit":over,"has_full_article":has_fa,"has_url":has_url,
        "content":content
    }

if not results_raw:
    print(f"NO RESULTS. Response: {json.dumps(d)[:500]}")
    all_pass = False

print(f"\n=== OVERALL: {'ALL PASS' if all_pass else 'FAILURES DETECTED'} ===")
with open("fix_results.json","w") as f:
    json.dump({"test":"social_posts","overall":"PASS" if all_pass else "FAIL","platforms":platform_results},f,indent=2)
