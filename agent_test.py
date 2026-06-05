
import requests, json, os, re

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
MUTATE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production"

def q(query):
    r = requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30)
    return r.json()["result"]

def mutate(mutations):
    r = requests.post(MUTATE, json={"mutations": mutations}, headers={**H, "Content-Type":"application/json"}, timeout=30)
    return r.json()

def make_slug(title):
    s = title.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s[:96]

# Get all newsArticles - those with null slug.current AND check if _id looks like hash
all_arts = q('*[_type == "newsArticle"][0...2000]{_id, title, sourceTitle, "slug": slug.current, "has_slug": defined(slug.current)}')
print(f"Total newsArticles: {len(all_arts)}")

# Find articles where slug is null or empty
null_slug = [a for a in all_arts if not a.get('slug')]
print(f"Articles with null/empty slug: {len(null_slug)}")

# Get existing slugs to avoid conflicts
existing = set(a.get('slug','') for a in all_arts if a.get('slug'))
print(f"Existing valid slugs: {len(existing)}")

mutations = []
fixed_log = []
for a in null_slug:
    title = a.get('title') or a.get('sourceTitle', '')
    if not title:
        print(f"  SKIP no title: {a['_id'][:30]}")
        continue
    new_slug = make_slug(title)
    base_slug = new_slug
    counter = 2
    while new_slug in existing:
        new_slug = f"{base_slug}-{counter}"
        counter += 1
    existing.add(new_slug)
    mutations.append({"patch": {"id": a["_id"], "set": {"slug": {"_type": "slug", "current": new_slug}}}})
    fixed_log.append({"id": a["_id"][:20], "new_slug": new_slug[:50], "title": title[:50]})
    print(f"  FIX: {a['_id'][:30]} -> {new_slug[:40]}")

print(f"\nApplying {len(mutations)} slug fixes...")
errors = 0
for i in range(0, len(mutations), 50):
    batch = mutations[i:i+50]
    result = mutate(batch)
    batch_errors = sum(1 for r in result.get("results",[]) if r.get("error"))
    errors += batch_errors
    print(f"  Batch {i//50+1}: {len(batch)} patched, {batch_errors} errors")

out = {"null_slug_count": len(null_slug), "fixed": len(mutations), "errors": errors, "log": fixed_log[:20]}
with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
print(f"DONE: fixed={len(mutations)} errors={errors}")
