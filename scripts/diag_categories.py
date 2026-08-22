#!/usr/bin/env python3
import os, json, urllib.request, urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/production"

def sanity_query(groq, token):
    url = f"{QUERY_URL}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

groq = '*[_type == "blogPost"]{_id, title, category, status, published, "bodyStart": body[0..15]}'
result = sanity_query(groq, SANITY_TOKEN)
with open("diag_categories_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
