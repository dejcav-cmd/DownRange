import urllib.request, urllib.parse, json, os

TOKEN = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(query)}&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

missing = q('count(*[_type=="gunDeal" && approved==true && (!defined(imageUrl) || imageUrl == "" || imageUrl == null)])')
total   = q('count(*[_type=="gunDeal" && approved==true])')
recent_missing = q('*[_type=="gunDeal" && approved==true && (!defined(imageUrl) || imageUrl == "" || imageUrl == null)] | order(publishedAt desc)[0...5]{_id, title, externalUrl, source}')

print(f"Missing images: {missing}/{total} deals")
print("Sample missing:")
for d in (recent_missing or []):
    print(f"  {d.get('source','?')} | {d.get('title','?')[:60]}")
    print(f"    {d.get('externalUrl','?')[:70]}")
