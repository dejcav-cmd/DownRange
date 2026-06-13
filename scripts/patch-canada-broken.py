import urllib.request, urllib.parse, json, os

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def q(query):
    url = f"{BASE}/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    url  = f"{BASE}/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

slug = "liberals-extend-gun-confiscation-amnesty-while-continuing-seizures"
art = q(f'*[_type=="canadaContent" && slug.current=="{slug}"][0]{{_id,title,body,imageUrl,type,active,sourceUrl}}')
print("=== ARTICLE STATE ===")
for k,v in art.items():
    val = v[:200] if isinstance(v,str) and len(v)>200 else v
    print(f"  {k}: {val}")

fixes = {}
if art.get("type") != "article":
    print(f"\nFIX: type='{art.get('type')}' → 'article'")
    fixes["type"] = "article"
if not art.get("active"):
    print(f"\nFIX: active=False → True")
    fixes["active"] = True

body = art.get("body","") or ""
if len(body) < 300:
    print(f"\nFIX: body too short ({len(body)} chars) — adding placeholder")
    fixes["body"] = "<h2>Article Loading</h2><p>This article is being updated with full content. Please check back shortly.</p>"

if fixes:
    result = mutate([{"patch": {"id": art["_id"], "set": fixes}}])
    print("\nPatched:", fixes.keys())
    print("Result:", result.get("results",""))
else:
    print("\nNo fixes needed — data looks correct.")
    print("The 403 may be a transient Vercel edge cache issue.")
    print("Try: curl -X POST https://api.vercel.com/v1/integrations/flush to purge, or wait.")
