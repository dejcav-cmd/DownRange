import urllib.request, urllib.parse, json, os, re

TOKEN = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["result"]

slug = "liberals-extend-gun-confiscation-amnesty-while-continuing-seizures"
doc = q(f'*[_type=="canadaContent" && slug.current=="{slug}"][0]{{_id,title,type,active,qualityReviewed,imageUrl,slug,publishedAt,body}}')

if not doc:
    print("NOT FOUND — article does not exist in Sanity")
    # Search for anything close
    close = q('*[_type=="canadaContent" && title match "Liberals*Amnesty*"] | order(publishedAt desc) [0...5] {_id,title,slug,active,type,body}')
    print(f"Similar articles: {len(close)}")
    for a in close:
        body = a.get('body') or ''
        print(f"  slug={a.get('slug',{}).get('current','')} active={a.get('active')} type={a.get('type')} body={len(body)}chars title={a.get('title','')[:60]}")
else:
    body = doc.get('body') or ''
    print(f"FOUND: {doc.get('title','')[:70]}")
    print(f"  type={doc.get('type')} active={doc.get('active')} qualityReviewed={doc.get('qualityReviewed')}")
    print(f"  imageUrl={'YES' if doc.get('imageUrl') else 'NO'}")
    print(f"  body={len(body)} chars")
    # Check body structure
    h2s = len(re.findall(r'<h2', body, re.I))
    words = len(re.sub(r'<[^>]+>',' ',body).split())
    print(f"  body h2={h2s} words={words}")
    print(f"  body preview: {body[:300]}")
