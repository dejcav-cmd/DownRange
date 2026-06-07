#!/usr/bin/env python3
"""Test Twitter + Bluesky social posts with newly added keys."""
import os, json, sys
try:
    import requests
except:
    import subprocess; subprocess.run(["pip","install","requests","-q"]); import requests

ADMIN_KEY = os.environ.get("ADMIN_KEY","")
BASE = "https://downrangeco.com"

print("=== STEP 1: Check which keys are now live ===")
r = requests.get(f"{BASE}/api/admin/cron-health",
    headers={"x-admin-key": ADMIN_KEY}, timeout=20)
d = r.json()
env = d.get("env", {})
print(f"Overall status: {d.get('status')}")
for key in ["ZERNIO_API_KEY","BLUESKY_HANDLE","BLUESKY_APP_PASSWORD","ZERNIO_TWITTER_ACCOUNT_ID"]:
    v = env.get(key, {})
    print(f"  {key}: {'SET' if v.get('set') else 'MISSING'}")

print()
print("=== STEP 2: DRY-RUN social posts (Twitter + Bluesky) ===")
LIMITS = {"twitter":280,"bluesky":300}

r2 = requests.post(f"{BASE}/api/social/post",
    json={"platforms":["twitter","bluesky"],"count":1,"dryRun":True},
    headers={"x-admin-key": ADMIN_KEY},
    timeout=120, allow_redirects=True)
print(f"HTTP {r2.status_code}")
d2 = r2.json()
print(f"ok={d2.get('ok')} total={d2.get('total',0)}")
results_raw = d2.get("results",[])

platform_results = {}
all_pass = True

for item in results_raw:
    platform = item.get("platform","?")
    content  = item.get("content", item.get("text",""))
    chars    = len(content)
    limit    = LIMITS.get(platform, 300)
    over     = chars > limit
    has_fa   = "Full article:" in content
    has_url  = "downrangeco.com" in content
    passed   = has_fa and has_url and not over
    if not passed: all_pass = False

    print(f"\n--- {platform.upper()} ---")
    print(f"Content:\n{content}")
    print(f"\nChars: {chars}/{limit} ({'OVER LIMIT!' if over else 'OK'})")
    print(f"Has 'Full article:': {'YES' if has_fa else 'MISSING'}")
    print(f"Has portal URL: {'YES' if has_url else 'MISSING'}")
    print(f"STATUS: {'PASS' if passed else 'FAIL'}")
    platform_results[platform] = {
        "status":"PASS" if passed else "FAIL",
        "chars":chars,"limit":limit,"over_limit":over,
        "has_full_article":has_fa,"has_url":has_url,"content":content
    }

if not results_raw:
    print(f"NO RESULTS. Response: {json.dumps(d2)[:500]}")
    # Check if platforms are still disabled
    if "skipped" in str(d2).lower() or d2.get("total",0) == 0:
        print("Platforms may still be disabled in socialConfig — need to enable them")
    all_pass = False

print(f"\n=== OVERALL: {'ALL PASS' if all_pass else 'FAIL / NO RESULTS'} ===")
with open("fix_results.json","w") as f:
    json.dump({"test":"social_twitter_bluesky","overall":"PASS" if all_pass else "FAIL",
               "platforms":platform_results,"raw_response":d2}, f, indent=2)
print("Saved to fix_results.json")
