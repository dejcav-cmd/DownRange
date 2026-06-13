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

# Full detailed check
doc = q(f'*[_type=="canadaContent" && slug.current=="{slug}"][0]{{_id,title,type,active,qualityReviewed,imageUrl,sourceUrl,_updatedAt,body,summary,tag,author,publishedAt}}')

if not doc:
    print("NOT FOUND IN SANITY")
else:
    body = doc.get('body') or ''
    h2s  = len(re.findall(r'<h2', body, re.I))
    words = len(re.sub(r'<[^>]+>',' ', body).split())
    
    print("=== FULL ARTICLE STATE ===")
    for k in ['_id','title','type','active','qualityReviewed','tag','author','_updatedAt']:
        print(f"  {k:20s} = {doc.get(k)}")
    print(f"  {'imageUrl':20s} = {'SET: ' + str(doc.get('imageUrl',''))[:60] if doc.get('imageUrl') else 'MISSING'}")
    print(f"  {'sourceUrl':20s} = {str(doc.get('sourceUrl',''))[:80]}")
    print(f"  {'body':20s} = {len(body)} chars, {h2s} h2s, {words} words")
    print(f"  {'summary':20s} = {str(doc.get('summary',''))[:80]}")
    print()
    
    # Check for problematic characters in body
    has_script = '<script' in body.lower()
    has_iframe  = '<iframe' in body.lower()
    has_null    = '\x00' in body
    print(f"  Body safety: script={has_script} iframe={has_iframe} null={has_null}")
    
    # Check if the title has characters that could break JSON-LD
    title = doc.get('title','')
    try:
        json.dumps(title)
        print(f"  Title JSON-safe: YES")
    except Exception as e:
        print(f"  Title JSON-safe: NO — {e}")
    
    print()
    # The issue: this article was previously deleted then recreated
    # The slug already existed before, so maybe there's a different _id with same slug
    all_with_slug = q(f'*[_type=="canadaContent" && slug.current=="{slug}"]{{_id,title,active,type,_updatedAt}}')
    print(f"Documents with this slug: {len(all_with_slug)}")
    for a in all_with_slug:
        print(f"  _id={a.get('_id')} active={a.get('active')} type={a.get('type')} updated={a.get('_updatedAt')}")
    
    # Force a clean re-patch of every field the page needs
    print()
    print("Force re-patching all page-required fields...")
    patch = {
        "type":            "article",
        "active":          True,
        "qualityReviewed": True,
        "tag":             doc.get("tag") or "NEWS",
    }
    if not doc.get("summary"):
        patch["summary"] = (body or "").replace('<h2>','').replace('</h2>','').replace('<p>','').replace('</p>','').strip()[:220]
    
    result = mutate([{"patch": {"id": doc["_id"], "set": patch}}])
    print(f"  Result: {result.get('results',[{}])[0].get('operation','?')}")
    print("Done")
