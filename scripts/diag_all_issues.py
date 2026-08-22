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

result = {}

# 1. All blogPost categories
result["blogPost_categories"] = sanity_query(
    '*[_type == "blogPost"]{_id, title, category, status, published, "bodyStart": body[0..12]}',
    SANITY_TOKEN
)

# 2. blogPost docs with garbage fences at start of body
result["blogPost_fences"] = sanity_query(
    '*[_type == "blogPost" && defined(body) && (body match "```*" )]{_id, title, "bodyStart": body[0..30], status, published, editorLocked}',
    SANITY_TOKEN
)

# 3. All brazilContent docs (check for English contamination + fences)
result["brazil_all"] = sanity_query(
    '*[_type == "brazilContent"]{_id, title, slug, "bodyStart": body[0..40], active, publishedAt} | order(publishedAt desc)',
    SANITY_TOKEN
)

with open("diag_all_issues_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2)[:3000])
