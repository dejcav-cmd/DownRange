
import requests, json, os, re

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"
MUTATE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production"

def q(query):
    return requests.get(BASE, params={"query": query, "returnQuery": "false"}, headers=H, timeout=30).json()["result"]

def mutate(mutations):
    return requests.post(MUTATE, json={"mutations": mutations}, headers={**H, "Content-Type":"application/json"}, timeout=30).json()

HASH_PAT = re.compile(r'^(news|goa|ca|blog|review)-[a-f0-9]{16,}')

# Check socialPosts with bad articleSlugs  
social = q('*[_type == "socialPost"][0...500]{_id, platform, articleSlug, status, postUrl}')
bad_social = [s for s in social if HASH_PAT.match(str(s.get('articleSlug','')))]
print(f"Social posts with _id as articleSlug: {len(bad_social)}")
for s in bad_social[:5]:
    print(f"  {s.get('platform')} | {s.get('articleSlug','')[:40]} | {s.get('postUrl','')[:50]}")

# Now find the real slug for each bad socialPost's articleSlug
# The articleSlug should be the slug.current of the article, not the _id
mutations = []
for s in bad_social:
    art_id = s.get('articleSlug','')  # This is actually the _id
    # Look up the article by _id
    art = q(f'*[_id == "{art_id}"][0]{{"slug": slug.current}}')
    real_slug = art.get('slug') if art else None
    if real_slug:
        mutations.append({"patch": {"id": s['_id'], "set": {"articleSlug": real_slug}}})
        print(f"  FIX socialPost: {art_id[:30]} -> {real_slug[:40]}")
    else:
        print(f"  SKIP no article found for: {art_id[:30]}")

print(f"Fixing {len(mutations)} social posts...")
for i in range(0, len(mutations), 50):
    batch = mutations[i:i+50]
    result = mutate(batch)
    errs = sum(1 for r in result.get('results',[]) if r.get('error'))
    print(f"  Batch {i//50+1}: {len(batch)}, errors={errs}")

# Also check the admin page links in content hub
# The issue was admin used a._id - now fixed, but let's confirm those article cards
# Check articles by all types for bad slugs
all_types = q('*[_type in ["newsArticle","blogPost","canadaContent","firearmRelease"]][0...2000]{_id, _type, "slug": slug.current, title}')
bad_arts = [a for a in all_types if not a.get('slug') or HASH_PAT.match(str(a.get('slug','')))]
print(f"\nArticles with bad/null slug: {len(bad_arts)}")
for a in bad_arts[:10]:
    print(f"  {a['_type']} | slug={str(a.get('slug','NULL'))[:40]} | {a.get('title','')[:50]}")

out = {"bad_social": len(bad_social), "social_fixed": len(mutations), "bad_articles": len(bad_arts), "bad_sample": [{"type":a['_type'],"slug":str(a.get('slug',''))[:40],"title":a.get('title','')[:40]} for a in bad_arts[:10]]}
with open("agent_test_results.json", "w") as f:
    json.dump(out, f, indent=2)
print("DONE")
