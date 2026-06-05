
import requests, json, os

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30).json()["result"]

broken_ids = [
    "news-e5b5f674295e9bb381c563ddf7862e37",
    "news-87bc8a8e196d20438e21db8c4046dec1",
    "news-b6d0591cb28f7e2653ae5f4d53c80665",
    "news-6f39119ae9c09dd46d7370c4398c7b88",
]

results = {}
for bid in broken_ids:
    # Check if social posts reference these
    social = q(f'*[_type == "socialPost" && (articleSlug == "{bid}" || postUrl match "*{bid}*")][0...5]{{_id, platform, articleSlug, postUrl, status}}')
    print(f"\n{bid}:")
    print(f"  Social posts referencing: {len(social)}")
    for s in social:
        print(f"    {s.get('platform')} | slug={s.get('articleSlug','')} | url={s.get('postUrl','')[:60]}")
    results[bid] = {"social_refs": len(social), "social": social}

# Count total social posts with broken slugs  
import re
HASH = re.compile(r'^(news|goa|ca|blog)-[a-f0-9]{32}$')
all_social = q('*[_type == "socialPost"][0...1000]{_id, platform, articleSlug, postUrl, status}')
bad_social = [s for s in all_social if HASH.match(str(s.get('articleSlug','')))]
print(f"\nTotal social posts with hash-ID articleSlugs: {len(bad_social)}")
print(f"Total social posts: {len(all_social)}")
for s in bad_social[:5]:
    print(f"  {s.get('platform')} | {s.get('articleSlug','')[:40]} | {s.get('status')} | {s.get('postUrl','')[:50]}")

with open("fix_results.json", "w") as f:
    json.dump({"bad_social_count": len(bad_social), "bad_social_sample": bad_social[:10], "total_social": len(all_social)}, f, indent=2)
