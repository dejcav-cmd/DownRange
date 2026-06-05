
import requests, json, os, re

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
MUTATE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30).json()["result"]

# Find ALL articles with broken slugs (hash ID pattern)
# Patterns: news-{hex32}, goa-{hex32}, ca-{hex32}, blog-{hex32}
broken = q('''*[_type in ["newsArticle","blogPost","canadaContent"] && defined(slug.current) && (
  slug.current matches "news-[a-f0-9]{20,}" ||
  slug.current matches "goa-[a-f0-9]{20,}" ||
  slug.current matches "ca-[a-f0-9]{20,}" ||
  slug.current matches "blog-[a-f0-9]{20,}"
)][0...200]{_id, _type, title, "slug": slug.current, sourceTitle, externalUrl}''')

print(f"Found {len(broken)} broken articles")
for a in broken[:10]:
    print(f"  {a['_type']} | {a.get('slug','')[:40]} | {a.get('title','')[:50]}")

out = {"broken_count": len(broken), "broken_sample": broken[:5], "all_broken": broken}
with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
print("Saved")
