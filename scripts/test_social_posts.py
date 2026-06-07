#!/usr/bin/env python3
"""Test social posts using CRON_SECRET for auth (more reliable than ADMIN_KEY)."""
import os, json, sys
try:
    import requests
except:
    import subprocess; subprocess.run(["pip","install","requests","-q"]); import requests

CRON_SECRET = os.environ.get("CRON_SECRET","")
BASE = "https://downrangeco.com"
LIMITS = {"twitter":280,"bluesky":300}

print("=== STEP 1: Check cron-health (no auth needed) ===")
r = requests.get(f"{BASE}/api/admin/cron-health", timeout=20)
d = r.json()
env = d.get("env", {})
print(f"Overall status: {d.get('status')}")
for key in ["ZERNIO_API_KEY","ZERNIO_TWITTER_ACCOUNT_ID","BLUESKY_HANDLE","BLUESKY_APP_PASSWORD"]:
    v = env.get(key, {})
    print(f"  {key}: {'SET ✓' if v.get('set') else 'MISSING ✗'}")

print()
print("=== STEP 2: DRY-RUN Twitter + Bluesky posts ===")

# Use CRON_SECRET via Authorization header
r2 = requests.post(
    f"{BASE}/api/social/post",
    json={"platforms":["twitter","bluesky"],"count":1,"dryRun":True},
    headers={"Authorization": f"Bearer {CRON_SECRET}"},
    timeout=120, allow_redirects=True
)
print(f"HTTP {r2.status_code} — {r2.url}")

try:
    d2 = r2.json()
except:
    print(f"Non-JSON response: {r2.text[:300]}")
    sys.exit(1)

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
    print(f"\nChars: {chars}/{limit} ({'OVER!' if over else 'OK'})")
    print(f"Has 'Full article:': {'YES ✓' if has_fa else 'MISSING ✗'}")
    print(f"Portal URL: {'YES ✓' if has_url else 'MISSING ✗'}")
    print(f"STATUS: {'PASS ✓' if passed else 'FAIL ✗'}")
    platform_results[platform] = {
        "status":"PASS" if passed else "FAIL",
        "chars":chars,"limit":limit,"over_limit":over,
        "has_full_article":has_fa,"has_url":has_url,"content":content
    }

if not results_raw:
    print(f"\nNO RESULTS. Full response: {json.dumps(d2)[:600]}")
    all_pass = False

print(f"\n{'='*50}")
print(f"OVERALL: {'ALL PASS ✓' if all_pass else 'FAIL ✗'}")
print(f"{'='*50}")

with open("fix_results.json","w") as f:
    json.dump({"test":"social_twitter_bluesky","overall":"PASS" if all_pass else "FAIL",
               "platforms":platform_results,"raw":d2},f,indent=2)
print("Saved to fix_results.json")
