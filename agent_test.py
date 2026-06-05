
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
    suffix = _id.split('-')[-1][:6] if '-' in _id else _id[:6]
    return f"{s}-{suffix}" if s else f"article-{suffix}"

# Find articles where slug.current IS the _id (article slug was incorrectly set to the document _id)
# These look like: slug="news-abc123..." or "goa-abc123..." or "ca-abc123..."
HASH_PAT = re.compile(r'^(news|goa|ca|blog)-[a-f0-9]{20,}$')

all_arts = q('*[_type == "newsArticle"][0...2000]{_id, title, sourceTitle, "slug": slug.current}')
broken_id_slugs = [a for a in all_arts if a.get('slug') and HASH_PAT.match(str(a.get('slug',''))) ]
print(f"Articles with _id-as-slug: {len(broken_id_slugs)}")
for a in broken_id_slugs[:5]:
    print(f"  _id={a['_id'][:30]} slug={a.get('slug','')[:40]} title={a.get('title','')[:40]}")

# Fix them
existing = set(a.get('slug','') for a in all_arts if a.get('slug') and not HASH_PAT.match(str(a.get('slug',''))))
mutations = []
for a in broken_id_slugs:
    title = a.get('title') or a.get('sourceTitle','')
    new_slug = make_slug(title, a['_id'])
    base_slug = new_slug
    counter = 2
    while new_slug in existing:
        new_slug = f"{base_slug}-{counter}"; counter += 1
    existing.add(new_slug)
    mutations.append({"patch": {"id": a["_id"], "set": {"slug": {"_type": "slug", "current": new_slug}}}})

print(f"Fixing {len(mutations)} articles...")
errors = 0
for i in range(0, len(mutations), 50):
    batch = mutations[i:i+50]
    result = mutate(batch)
    batch_errors = sum(1 for r in result.get("results",[]) if r.get("error"))
    errors += batch_errors
    print(f"  Batch {i//50+1}: {len(batch)} patched, {batch_errors} errors")

# Verify the specific broken article
art = q('*[_id == "goa-c7f32d4e8dd10832c66d424782eb9c20"][0]{_id, title, "slug": slug.current}')
print(f"GOA article: {json.dumps(art)}")

out = {"broken_id_slugs": len(broken_id_slugs), "fixed": len(mutations), "errors": errors}
with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
print("DONE")
