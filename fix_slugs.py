import requests, json, os, re

T = os.environ["SANITY_TOKEN"]
ADMIN_KEY = os.environ.get("ADMIN_KEY", "")
H = {"Authorization": "Bearer " + T, "Content-Type": "application/json"}
BASE_QUERY = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
BASE_MUTATE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production"

def q(query):
    r = requests.get(BASE_QUERY, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30)
    return r.json()["result"]

def mutate(mutations):
    r = requests.post(BASE_MUTATE, json={"mutations": mutations}, headers=H, timeout=30)
    return r.json()

def is_hash_slug(slug):
    return bool(re.match(r"^[a-z]+-[a-f0-9]{20,}$", slug or ""))

def build_slug(title, _id):
    raw = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")[:80]
    suffix = re.sub(r"^[a-z]+-", "", _id or "")[:6] or "fixed"
    return f"{raw}-{suffix}" if raw else f"article-{suffix}"

print("=== SCANNING FOR HASH-SLUG ARTICLES ===")
articles = q("""*[_type == "newsArticle" && defined(slug.current) && editorLocked != true] | order(_createdAt desc) [0...500] {_id, title, sourceTitle, "slugCurrent": slug.current}""")
bad = [a for a in articles if is_hash_slug(a.get("slugCurrent", ""))]
print(f"Found {len(bad)} hash-slug articles out of {len(articles)} checked")

fixed = 0
results = []
for art in bad:
    new_slug = build_slug(art.get("title") or art.get("sourceTitle"), art["_id"])
    try:
        mutate([{"patch": {"id": art["_id"], "set": {"slug": {"_type": "slug", "current": new_slug}}}}])
        print(f"  FIXED: {art['_id']} -> {new_slug}")
        results.append({"_id": art["_id"], "old": art["slugCurrent"], "new": new_slug, "ok": True})
        fixed += 1
    except Exception as e:
        print(f"  ERROR: {art['_id']}: {e}")
        results.append({"_id": art["_id"], "old": art["slugCurrent"], "error": str(e), "ok": False})

print(f"Fixed {fixed}/{len(bad)} hash-slug articles")

# Rewrite the specific broken article
BAD_ID = "news-eed497e6be7af0dc1180944d6c718f95"
print(f"\n=== CHECKING {BAD_ID} ===")
art = q(f"""*[_type=="newsArticle" && _id=="{BAD_ID}"][0]{{_id,title,slug,externalUrl,source}}""")
if art:
    print(f"  Title: {art.get('title', 'MISSING')}")
    print(f"  Slug: {art.get('slug', {}).get('current', 'MISSING')}")
    print(f"  Source: {art.get('source', '?')} / {art.get('externalUrl', '?')[:80]}")
    # Fix slug if still bad
    current_slug = art.get("slug", {}).get("current", "")
    if is_hash_slug(current_slug):
        new_slug = build_slug(art.get("title"), art["_id"])
        mutate([{"patch": {"id": BAD_ID, "set": {"slug": {"_type": "slug", "current": new_slug}}}}])
        print(f"  FIXED slug: {current_slug} -> {new_slug}")
        results.append({"_id": BAD_ID, "old": current_slug, "new": new_slug, "ok": True})
    else:
        print(f"  Slug OK: {current_slug}")
else:
    print(f"  Article not found in Sanity")

# Trigger AI rewrite via backfill API
if ADMIN_KEY:
    print(f"\n=== TRIGGERING REWRITE OF {BAD_ID} ===")
    try:
        r = requests.post("https://downrangeco.com/api/admin/backfill-articles",
            json={"types": ["newsArticle"], "singleId": BAD_ID, "force": True},
            headers={"x-admin-key": ADMIN_KEY}, timeout=120)
        print("Rewrite:", r.text[:300])
    except Exception as e:
        print(f"Rewrite error: {e}")

# Save results
with open("fix_results.json", "w") as f:
    json.dump({"total_checked": len(articles), "total_found": len(bad), "total_fixed": fixed, "results": results}, f, indent=2)
print(f"\nDone. Saved {len(results)} results to fix_results.json")
