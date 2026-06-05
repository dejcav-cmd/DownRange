
import requests, json, os

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30).json()["result"]

# Check what slug field looks like when fetched as object vs current
# The fetchArticlesPaginated query fetches `slug` (not `slug.current`)
sample = q('*[_type == "newsArticle" && approved == true] | order(_createdAt desc)[0...5]{_id, title, slug, "slug_current": slug.current}')
print("Sample articles - slug object vs slug.current:")
for a in sample:
    print(f"  _id: {a['_id'][:30]}")
    print(f"  slug obj: {json.dumps(a.get('slug'))}")
    print(f"  slug.current: {a.get('slug_current','')}")
    print()

# The news page GROQ query is:
# *[...] { _id, title, slug, excerpt, ... }
# This fetches `slug` as an object: {"_type": "slug", "current": "real-slug"}
# NewsCard does: article.slug?.current  -- works fine
# 
# BUT: what if some articles were created with slug as a STRING not an object?
# Check for that
string_slugs = q('*[_type == "newsArticle" && defined(slug) && slug._type != "slug"][0...10]{_id, title, slug}')
print(f"Articles with non-object slug: {len(string_slugs)}")
for a in string_slugs[:5]:
    print(f"  {a['_id'][:30]} | slug={json.dumps(a.get('slug'))}")

with open("fix_results.json", "w") as f:
    json.dump({"sample": sample, "string_slugs": string_slugs}, f, indent=2)
