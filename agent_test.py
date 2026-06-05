
import requests, json, os, re

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
MUTATE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30).json()["result"]

def mutate(mutations):
    return requests.post(MUTATE, json={"mutations": mutations}, headers={**H, "Content-Type":"application/json"}, timeout=30).json()

def make_slug(title, _id):
    s = (title or '').lower()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')[:80]
    suffix = re.sub(r'[^a-f0-9]', '', _id)[:6]
    return f"{s}-{suffix}" if s else f"article-{suffix}"

# Find ALL articles with null slug.current across ALL types
all_bad = q('*[_type in ["newsArticle","blogPost","canadaContent","firearmRelease","review","huntingContent","prepContent","brazilContent"] && !defined(slug.current)][0...500]{_id, _type, title, "slug_obj": slug}')
print(f"Total with null slug.current: {len(all_bad)}")

# Get existing slugs
existing_slugs = set(s.get('slug','') for s in q('*[defined(slug.current)][0...5000]{"slug": slug.current}') if s.get('slug'))
print(f"Existing slugs loaded: {len(existing_slugs)}")

mutations = []
for a in all_bad:
    title = a.get('title','')
    new_slug = make_slug(title, a['_id'])
    base = new_slug
    counter = 2
    while new_slug in existing_slugs:
        new_slug = f"{base}-{counter}"; counter += 1
    existing_slugs.add(new_slug)
    mutations.append({"patch": {"id": a["_id"], "set": {"slug": {"_type": "slug", "current": new_slug}}}})
    print(f"  {a['_type']} | {a['_id'][:20]} -> {new_slug[:40]}")

print(f"\nApplying {len(mutations)} fixes...")
errors = 0
for i in range(0, len(mutations), 50):
    batch = mutations[i:i+50]
    result = mutate(batch)
    errs = sum(1 for r in result.get("results",[]) if r.get("error"))
    errors += errs
    print(f"  Batch {i//50+1}: {len(batch)} patched, errors={errs}")

# Final verification
remaining = q('count(*[_type in ["newsArticle","blogPost","canadaContent","firearmRelease"] && !defined(slug.current)])')
print(f"\nRemaining null slugs: {remaining}")

out = {"fixed": len(mutations), "errors": errors, "remaining_null": remaining}
with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
print("DONE")
