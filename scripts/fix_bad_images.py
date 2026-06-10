"""
Fix articles stuck with /img/photos/ local fallback images.
Clears imageUrl so image-fix cron retries with Pexels/Pixabay.
"""
import urllib.request, urllib.parse, json, os, time

SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "")
PROJECT = "vbnsqnkg"
API_BASE = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def sanity_query(q):
    url = f"{API_BASE}/query/production?query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    url = f"{API_BASE}/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(url, data=body,
          headers={"Authorization": f"Bearer {SANITY_TOKEN}", "Content-Type": "application/json"},
          method="POST")
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Target slugs with local images
TARGET_SLUGS = [
    "watson-coleman-reintroduces-hear-act-to-ban-suppressors-just-as-the-suppressor-m-da853c",
    "the-best-cartridges-for-suppressed-shooting-1fed0c",
    "virginia-bill-sponsor-attacks-prosecutors-refusing-to-enforce-his-gun-ban-e2f031",
    "vortex-hunter-constantine-collaboration-benefits-saf-s-legal-efforts-c9b513",
]

results = {}

for slug in TARGET_SLUGS:
    q = f'*[_type=="newsArticle" && slug.current=="{slug}"][0]{{_id, title, imageUrl, externalUrl}}'
    article = sanity_query(q)
    if not article:
        results[slug] = "NOT FOUND"
        continue

    img = article.get("imageUrl", "")
    results[slug] = {
        "_id": article["_id"],
        "title": article.get("title","")[:60],
        "current_imageUrl": img,
        "externalUrl": article.get("externalUrl","")[:80],
    }

    # If it's a local /img/ path, clear it so image-fix retries
    if img and img.startswith("/img/"):
        try:
            sanity_mutate([{"patch": {"id": article["_id"], "set": {"imageUrl": None}}}])
            results[slug]["action"] = "CLEARED - will retry on next image-fix run"
        except Exception as e:
            results[slug]["action"] = f"ERROR clearing: {e}"
    elif not img:
        results[slug]["action"] = "Already null - image-fix will pick it up"
    else:
        results[slug]["action"] = f"Already has real image: {img[:60]}"

# Also check deals and reviews
deal_count = sanity_query('count(*[_type=="gunDeal"])')
results["deal_count"] = deal_count

review_sample = sanity_query('*[_type=="review"][0...5]{_id,title,imageUrl,"hasHeroImage":defined(heroImage.asset),"heroImageUrl":heroImage.asset->url}')
results["review_sample"] = review_sample

output = json.dumps(results, indent=2)
print(output)
with open("scripts/diag-result.txt", "w") as f:
    f.write(output)
