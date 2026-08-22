#!/usr/bin/env python3
import os, json, urllib.request, urllib.parse

SANITY_PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "vbnsqnkg")
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "").strip()
if SANITY_TOKEN.startswith("ST="):
    SANITY_TOKEN = SANITY_TOKEN[3:]
QUERY_URL = f"https://{SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/production"

def sanity_query(groq, params, token):
    q = urllib.parse.quote(groq)
    extra = "".join(f"&${k}={urllib.parse.quote(json.dumps(v))}" for k, v in params.items())
    url = f"{QUERY_URL}?query={q}{extra}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

result = {}

# 1. Total published count, no category filter
result["total_published"] = sanity_query(
    'count(*[_type == "blogPost" && (status == "published" || published == true)])',
    {}, SANITY_TOKEN
)

# 2. Total published count for OPINION category
result["opinion_published"] = sanity_query(
    'count(*[_type == "blogPost" && (status == "published" || published == true) && upper(category) == $cat])',
    {"cat": "OPINION"}, SANITY_TOKEN
)

# 3. Exact production query mirror: category=null, page=1, no search, sort=newest
result["default_page1"] = sanity_query(
    '''{
      "posts": *[_type == "blogPost" && (status == "published" || published == true) ]
        | order(coalesce(featured, false) desc, _createdAt desc) [$offset...$end] {
          _id, title, category, status, published, publishedAt, _createdAt, featured
        },
      "total": count(*[_type == "blogPost" && (status == "published" || published == true) ])
    }''',
    {"offset": 0, "end": 12}, SANITY_TOKEN
)

# 4. What does offset/end look like with NaN (simulating page=undefined bug)?
try:
    result["nan_offset_test"] = sanity_query(
        '*[_type == "blogPost" && (status == "published" || published == true)] | order(_createdAt desc) [$offset...$end] {_id, title}',
        {"offset": None, "end": None}, SANITY_TOKEN
    )
except Exception as e:
    result["nan_offset_test"] = {"error": str(e)}

with open("diag_blog_regression_result.json", "w") as f:
    json.dump(result, f, indent=2)
print(json.dumps(result, indent=2)[:4000])
