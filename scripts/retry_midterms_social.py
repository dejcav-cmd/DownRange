#!/usr/bin/env python3
"""Retries a single-platform post (env PLATFORM) for the midterms blog via the site's manual social route (runs in Actions)."""
import os, json, urllib.request, urllib.error

URL = "https://www.downrangeco.com/api/social/post"
payload = {"platforms": [os.environ.get("PLATFORM","instagram")], "count": 1, "articleId": "blog-midterms-2026-second-amendment"}
req = urllib.request.Request(URL, data=json.dumps(payload).encode(), method="POST")
req.add_header("Content-Type", "application/json")
req.add_header("x-admin-key", os.environ["ADMIN_KEY"])
req.add_header("User-Agent", "Mozilla/5.0 DownRangeBot/1.0")
try:
    with urllib.request.urlopen(req, timeout=170) as r:
        out = {"status": r.status, "body": json.loads(r.read().decode())}
except urllib.error.HTTPError as e:
    out = {"status": e.code, "body": e.read().decode()[:1500]}
except Exception as e:
    out = {"error": repr(e)}
with open("midterms_social_retry.json", "w") as f:
    json.dump(out, f, indent=2)
print(json.dumps(out, indent=2)[:3000])
