#!/usr/bin/env python3
"""Fix all Canada + Brazil images immediately via deployed API"""
import urllib.request, json, os

KEY   = os.environ.get("ADMIN_KEY","")
BASE  = "https://downrangeco.com"

for country in ["canada","brazil"]:
    print(f"Fixing {country} images...", flush=True)
    try:
        payload = json.dumps({"type": country}).encode()
        req = urllib.request.Request(f"{BASE}/api/admin/fix-images-intl",
            data=payload, method="POST",
            headers={"Content-Type":"application/json","x-admin-key":KEY})
        with urllib.request.urlopen(req, timeout=120) as r:
            d = json.loads(r.read())
            print(f"  {country}: fixed={d.get('fixed',0)} skipped={d.get('skipped',0)} failed={d.get('failed',0)}", flush=True)
    except Exception as e:
        print(f"  {country} error: {e}", flush=True)

# Also pull fresh articles for both
for endpoint, label in [
    ("/api/admin/write-canada-articles", "Canada"),
    ("/api/admin/write-brazil-articles", "Brazil"),
]:
    print(f"Pulling {label} articles...", flush=True)
    try:
        payload = json.dumps({"limit":5,"force":False}).encode()
        req = urllib.request.Request(f"{BASE}{endpoint}",
            data=payload, method="POST",
            headers={"Content-Type":"application/json","x-admin-key":KEY})
        with urllib.request.urlopen(req, timeout=180) as r:
            d = json.loads(r.read())
            created = len([x for x in d.get("results",[]) if x.get("status")=="created"])
            print(f"  {label}: {created} new articles", flush=True)
    except Exception as e:
        print(f"  {label} pull error: {e}", flush=True)

print("DONE", flush=True)
