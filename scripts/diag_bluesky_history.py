#!/usr/bin/env python3
"""Lists recent Bluesky socialPost outcomes (runs in Actions)."""
import os, json, urllib.parse, urllib.request
T = os.environ.get("SANITY_API_TOKEN", "").strip()
if T.startswith("ST="):
    T = T[3:]
q = '*[_type=="socialPost" && platform=="bluesky"] | order(_createdAt desc)[0...15]{status,error,_createdAt,articleSlug}'
req = urllib.request.Request("https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(q))
req.add_header("Authorization", "Bearer " + T)
r = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
open("bluesky_history.json", "w").write(json.dumps(r, indent=2))
print(json.dumps(r, indent=2)[:4000])
