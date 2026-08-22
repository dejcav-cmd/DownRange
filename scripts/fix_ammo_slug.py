#!/usr/bin/env python3
import os, json, urllib.request

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]
MUTATE_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/production"

payload = {
    "mutations": [
        {"patch": {"id": "blog-dj-topic-8", "set": {"slug": {"_type": "slug", "current": "dj-ammo-pricing-tariffs-2026"}}}}
    ]
}
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(MUTATE_URL, data=data, method="POST")
req.add_header("Content-Type", "application/json")
req.add_header("Authorization", f"Bearer {SANITY_TOKEN}")
with urllib.request.urlopen(req, timeout=30) as resp:
    result = json.loads(resp.read().decode("utf-8"))

with open("fix_ammo_slug_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
