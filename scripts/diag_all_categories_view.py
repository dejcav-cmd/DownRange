#!/usr/bin/env python3
import os, json, urllib.request, urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/production"

def sanity_query(groq, params, token):
    q = urllib.parse.quote(groq)
    extra = "".join(f"&${k}={urllib.parse.quote(json.dumps(v))}" for k, v in (params or {}).items())
    url = f"{QUERY_URL}?query={q}{extra}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

result = {}

# Exact production "All" query (category=null, page=1)
result["all_page1"] = sanity_query(
    '''{
      "posts": *[_type == "blogPost" && (status == "published" || published == true) ]
        | order(coalesce(featured, false) desc, _createdAt desc) [$offset...$end] {
          _id, title, category, status, published
        },
      "total": count(*[_type == "blogPost" && (status == "published" || published == true) ])
    }''',
    {"offset": 0, "end": 12}, SANITY_TOKEN
)

# Per-category counts
for cat in ["OPINION", "ANALYSIS", "LAW", "TRAINING", "MARKET", "INDUSTRY", "GEAR", "BUILDS"]:
    r = sanity_query(
        'count(*[_type == "blogPost" && (status == "published" || published == true) && upper(category) == $cat])',
        {"cat": cat}, SANITY_TOKEN
    )
    result[f"count_{cat}"] = r.get("result")

with open("diag_all_categories_view_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2))
