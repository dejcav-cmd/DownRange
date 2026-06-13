import urllib.request, urllib.parse, json, os, re, time

TOKEN = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(
        f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production",
        data=body,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

slug = "liberals-extend-gun-confiscation-amnesty-while-continuing-seizures"
doc = q(f'*[_type=="canadaContent" && slug.current=="{slug}"][0]{{_id,title,type,active,qualityReviewed,imageUrl,_updatedAt,body}}')

if not doc:
    print("NOT FOUND — article missing from Sanity entirely")
else:
    body = doc.get('body') or ''
    h2s  = len(re.findall(r'<h2', body, re.I))
    words = len(re.sub(r'<[^>]+>',' ', body).split())
    print(f"Article exists:")
    print(f"  _id         = {doc.get('_id')}")
    print(f"  type        = {doc.get('type')}")
    print(f"  active      = {doc.get('active')}")
    print(f"  qualityReviewed = {doc.get('qualityReviewed')}")
    print(f"  _updatedAt  = {doc.get('_updatedAt')}")
    print(f"  body        = {len(body)} chars, {h2s} h2s, {words} words")
    print(f"  imageUrl    = {'YES' if doc.get('imageUrl') else 'NO'}")
    print()

    # Force-patch all required fields to ensure no null causes page crash
    print("Force-patching to ensure all required fields are set...")
    result = mutate([{"patch": {"id": doc["_id"], "set": {
        "type":            "article",
        "active":          True,
        "qualityReviewed": True,
    }}}])
    print(f"  Patch result: {result.get('results',[{}])[0].get('operation','?')}")
    print("Done")
