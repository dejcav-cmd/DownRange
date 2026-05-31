#!/usr/bin/env python3
"""Seed initial Brazil articles via deployed API"""
import urllib.request, json, os, time

ADMIN_KEY   = os.environ.get("ADMIN_KEY","")
CRON_SECRET = os.environ.get("CRON_SECRET","")
BASE_URL    = "https://downrangeco.com"

auth = f"Bearer {CRON_SECRET}" if CRON_SECRET else ""
key  = ADMIN_KEY

print("Seeding Brazil articles...", flush=True)
payload = json.dumps({"limit": 10, "force": False}).encode()
req = urllib.request.Request(
    f"{BASE_URL}/api/admin/write-brazil-articles",
    data=payload, method="POST",
    headers={
        "Content-Type": "application/json",
        "x-admin-key": key,
        "authorization": auth,
    }
)
try:
    with urllib.request.urlopen(req, timeout=280) as r:
        data = json.loads(r.read())
        results = data.get("results", [])
        print(f"Total results: {len(results)}", flush=True)
        for res in results:
            status = res.get("status","?")
            title  = res.get("title","")[:60]
            img    = res.get("imageUrl","no image")[:60]
            print(f"  [{status}] {title}", flush=True)
            if status == "created":
                print(f"         img: {img}", flush=True)
except Exception as e:
    print(f"ERROR: {e}", flush=True)

print("\nSeeding Canada articles...", flush=True)
payload2 = json.dumps({"limit": 5, "force": False}).encode()
req2 = urllib.request.Request(
    f"{BASE_URL}/api/admin/write-canada-articles",
    data=payload2, method="POST",
    headers={"Content-Type":"application/json","x-admin-key":key,"authorization":auth}
)
try:
    with urllib.request.urlopen(req2, timeout=280) as r2:
        data2 = json.loads(r2.read())
        results2 = data2.get("results", [])
        print(f"Canada results: {len(results2)}", flush=True)
        for res in results2:
            print(f"  [{res.get('status')}] {res.get('title','')[:60]}", flush=True)
except Exception as e:
    print(f"Canada ERROR: {e}", flush=True)

print("DONE", flush=True)
