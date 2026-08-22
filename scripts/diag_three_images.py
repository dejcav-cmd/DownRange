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

slugs = ["suppressor-revolution-2026", "red-dot-carry-guide-2026", "bruen-standard-state-battles-2026"]
result = {}
for slug in slugs:
    r = sanity_query(f'*[_type=="blogPost" && slug.current == "{slug}"][0]{{_id, title, slug, imageUrl, category, status}}', SANITY_TOKEN)
    result[slug] = r.get("result")

with open("diag_three_images_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
