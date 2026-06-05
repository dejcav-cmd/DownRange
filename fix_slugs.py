
import requests, json, os, re

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
MUTATE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production"

def q(query):
    r = requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30)
    return r.json()["result"]

def mutate(mutations):
    r = requests.post(MUTATE, json={"mutations": mutations}, 
                      headers={**H, "Content-Type": "application/json"}, timeout=30)
    return r.json()

# Fetch ALL articles - check every single one
print("Loading all articles...")
all_arts = []
offset = 0
while True:
    batch = q(f'*[_type == "newsArticle"][{offset}...{offset+2000}]{{_id, title, sourceTitle, "slug": slug.current}}')
    all_arts.extend(batch)
    print(f"  Loaded {len(all_arts)} so far...")
    if len(batch) < 2000:
        break
    offset += 2000

print(f"Total articles: {len(all_arts)}")

# Find articles where slug.current IS the _id (e.g. "news-abc123...")
# Pattern: starts with type prefix + 32-char hex
HASH_PAT = re.compile(r'^[a-z]+-[a-f0-9]{32}$')
broken = [a for a in all_arts if HASH_PAT.match(str(a.get('slug', '')))]
print(f"Articles with _id as slug: {len(broken)}")
for a in broken[:5]:
    print(f"  {a.get('slug','')} | {a.get('title','')[:50]}")

# Build real slugs from titles
def make_slug(title, _id):
    s = (title or '').lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')[:80]
    # Use last 6 chars of the hex portion as suffix
    suffix = _id.split('-')[-1][:6] if len(_id) > 8 else _id[-6:]
    return (s + '-' + suffix) if s else ('article-' + suffix)

# Get all existing good slugs to avoid conflicts
good_slugs = set(a.get('slug','') for a in all_arts if a.get('slug') and not HASH_PAT.match(str(a.get('slug',''))))
print(f"Good existing slugs: {len(good_slugs)}")

mutations = []
for a in broken:
    title = a.get('title') or a.get('sourceTitle', '')
    new_slug = make_slug(title, a['_id'])
    base = new_slug
    counter = 2
    while new_slug in good_slugs:
        new_slug = f"{base}-{counter}"; counter += 1
    good_slugs.add(new_slug)
    mutations.append({
        "patch": {
            "id": a["_id"],
            "set": {"slug": {"_type": "slug", "current": new_slug}}
        }
    })

print(f"Fixing {len(mutations)} articles...")
total_errors = 0
for i in range(0, len(mutations), 100):
    batch = mutations[i:i+100]
    result = mutate(batch)
    errs = sum(1 for r in result.get("results", []) if r.get("error"))
    total_errors += errs
    print(f"  Batch {i//100+1}/{(len(mutations)+99)//100}: {len(batch)} patched, {errs} errors")

print(f"DONE. Fixed={len(mutations)} errors={total_errors}")

# Verify: count remaining broken
remaining = [a for a in q(f'*[_type == "newsArticle"][0...2000]{{"slug": slug.current}}') 
             if HASH_PAT.match(str(a.get('slug','')))]
print(f"Remaining broken: {len(remaining)}")

with open("fix_results.json", "w") as f:
    json.dump({"broken_found": len(broken), "fixed": len(mutations), 
               "errors": total_errors, "remaining": len(remaining)}, f, indent=2)
