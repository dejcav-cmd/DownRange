
import requests, json, os

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30).json()["result"]

# Check exact articles from the broken URLs
ids = [
    "news-e5b5f674295e9bb381c563ddf7862e37",
    "news-87bc8a8e196d20438e21db8c4046dec1",
    "news-b6d0591cb28f7e2653ae5f4d53c80665",
    "news-6f39119ae9c09dd46d7370c4398c7b88",
]
for _id in ids:
    # Check by _id
    by_id = q(f'*[_id == "{_id}"][0]{{_id, _type, title, "slug": slug.current}}')
    # Check by slug.current (maybe slug = _id string)
    by_slug = q(f'*[slug.current == "{_id}"][0]{{_id, _type, title, "slug": slug.current}}')
    print(f"ID={_id[:20]}")
    print(f"  by_id:   {json.dumps(by_id)}")
    print(f"  by_slug: {json.dumps(by_slug)}")

# Count total articles
total = q('count(*[_type == "newsArticle"])')
print(f"\nTotal newsArticles: {total}")

# Check what the news/[slug] page does - it looks up by slug.current
# If slug.current == _id, then /news/_id would work
# But these 404 -- meaning slug.current != _id AND the article doesn't exist by slug=_id

# Check total with broken slugs - load in pages
import re
HASH = re.compile(r'^[a-z]+-[a-f0-9]{32}$')
all_broken = []
for offset in range(0, 5000, 1000):
    batch = q(f'*[_type == "newsArticle"][{offset}...{offset+1000}]{{"slug": slug.current, "_id": _id}}')
    broken = [a for a in batch if HASH.match(str(a.get('slug','')))]
    all_broken.extend(broken)
    print(f"Offset {offset}: {len(batch)} fetched, {len(broken)} broken")
    if len(batch) < 1000:
        break

print(f"Total broken slugs: {len(all_broken)}")

with open("fix_results.json", "w") as f:
    json.dump({"total": total, "broken_scan": len(all_broken), 
               "sample_broken": all_broken[:5]}, f, indent=2)
