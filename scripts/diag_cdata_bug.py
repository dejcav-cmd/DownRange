#!/usr/bin/env python3
import os, json, re, urllib.request, urllib.parse

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

# 1. Find the exact article in Sanity
r = sanity_query(
    '*[_type=="newsArticle" && title match "Colorado Sheriffs*"][0]{_id, title, summary, excerpt, description, body, source, externalUrl, editorLocked, qualityReviewed, publishedAt}',
    SANITY_TOKEN
)
result["article"] = r.get("result")

# 2. Scan ALL newsArticle docs for CDATA leakage — how widespread is this?
r2 = sanity_query(
    'count(*[_type=="newsArticle" && (summary match "*CDATA*" || excerpt match "*CDATA*" || body match "*CDATA*")])',
    SANITY_TOKEN
)
result["cdata_affected_count"] = r2.get("result")

r3 = sanity_query(
    '*[_type=="newsArticle" && (summary match "*CDATA*" || excerpt match "*CDATA*" || body match "*CDATA*")][0...15]{_id, title, source, "summarySnippet": summary[0..80]}',
    SANITY_TOKEN
)
result["cdata_affected_sample"] = r3.get("result")

with open("diag_cdata_bug_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2)[:3000])
