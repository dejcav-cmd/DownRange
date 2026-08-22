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
result["socialConfig"] = sanity_query('*[_type == "socialConfig"][0]', SANITY_TOKEN).get("result")
result["recent_social_posts"] = sanity_query(
    '*[_type == "socialPost"] | order(_createdAt desc) [0...10]{_id, platform, status, articleTitle, postedAt, error, _createdAt}',
    SANITY_TOKEN
).get("result")
result["fierce_doc"] = sanity_query('*[_id == "blog-fierce-wingman-sbr-2026"][0]{_id, title, slug, imageUrl, status}', SANITY_TOKEN).get("result")

with open("check_social_config_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
