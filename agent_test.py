
import requests, json, os, re

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
MUTATE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production"

def q(query):
    r = requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30)
    return r.json()["result"]

def mutate(mutations):
    r = requests.post(MUTATE, json={"mutations": mutations}, headers={**H, "Content-Type": "application/json"}, timeout=30)
    return r.json()

# Fetch all articles and filter by slug pattern in Python
all_arts = q('*[_type in ["newsArticle","blogPost","canadaContent"] && defined(slug.current)][0...2000]{_id, _type, title, "slug": slug.current, sourceTitle, externalUrl}')
print(f"Total fetched: {len(all_arts)}")

# Broken = slug looks like: news-abc123def, goa-abc123def, ca-abc123def, etc.
HASH_PAT = re.compile(r'^[a-z]+-[a-f0-9]{20,}$')
broken = [a for a in all_arts if HASH_PAT.match(a.get('slug',''))]
print(f"Broken slugs: {len(broken)}")

# Fix each: generate a real slug from title
def make_slug(title):
    import re
    s = title.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s[:96]

# Check for slug conflicts before fixing
existing_slugs = set(a.get('slug','') for a in all_arts)

fixed = 0
skipped = 0
mutations = []
for a in broken:
    title = a.get('title') or a.get('sourceTitle','')
    if not title:
        print(f"  SKIP (no title): {a['_id'][:20]}")
        skipped += 1
        continue
    new_slug = make_slug(title)
    # Ensure uniqueness
    base = new_slug
    counter = 2
    while new_slug in existing_slugs:
        new_slug = f"{base}-{counter}"
        counter += 1
    existing_slugs.add(new_slug)
    mutations.append({"patch": {"id": a['_id'], "set": {"slug": {"_type": "slug", "current": new_slug}}}})
    print(f"  FIX: {a.get('slug','')[:35]} -> {new_slug[:35]}")
    fixed += 1

print(f"\nFixing {fixed} articles (skipping {skipped})...")

# Apply in batches of 100
BATCH = 100
for i in range(0, len(mutations), BATCH):
    batch = mutations[i:i+BATCH]
    result = mutate(batch)
    errs = result.get('results', [])
    err_count = sum(1 for r in errs if r.get('error'))
    print(f"  Batch {i//BATCH+1}: {len(batch)} mutations, {err_count} errors")

out = {"broken": len(broken), "fixed": fixed, "skipped": skipped, "sample": [{"old": a.get('slug',''), "title": a.get('title','')[:50]} for a in broken[:10]]}
with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
print("DONE")
