
import requests, json, os, re

T = os.environ["SANITY_TOKEN"]
H = {"Authorization": "Bearer " + T}
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production"

def q(query, params=None):
    p = {"query": query, "returnQuery": "false"}
    if params:
        for k,v in params.items():
            p[f"${k}"] = json.dumps(v)
    r = requests.get(BASE, params=p, headers=H, timeout=30)
    return r.json()["result"]

# Look up the exact broken article
bad_slug = "goa-c7f32d4e8dd10832c66d424782eb9c20"
art = q(f'*[slug.current == "{bad_slug}"][0]{{_id, _type, title, "slug": slug.current, sourceTitle, externalUrl, _createdAt}}')
print("By slug:", json.dumps(art, indent=2))

# Also check if there's any article with _id containing that hash
art2 = q(f'*[_id == "goa-c7f32d4e8dd10832c66d424782eb9c20"][0]{{_id, _type, title, "slug": slug.current}}')
print("By _id:", json.dumps(art2, indent=2))

# Check ALL articles - look at slug patterns
all_slugs = q('*[_type in ["newsArticle","blogPost","canadaContent","firearmRelease","goa"]] | order(_createdAt desc)[0...20]{"slug": slug.current, _type, _id}')
print("\nAll types + slugs sample:")
for a in all_slugs:
    print(f"  {a.get('_type','?'):20} | {str(a.get('slug','NONE'))[:50]}")

# Check if "goa" is a type
types = q('array::unique(*[]._type)')
print("\nAll doc types:", types)

with open("agent_test_results.json", "w") as f:
    json.dump({"bad_by_slug": art, "bad_by_id": art2, "types": types}, f, indent=2)
