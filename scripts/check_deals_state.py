import os, json, urllib.request, urllib.parse, re

LOG = 'scripts/diag-result.txt'
def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f:
        f.write(msg + '\n')

open(LOG, 'w').close()

TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
H = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}

def q(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

# Counts
total   = q('count(*[_type=="gunDeal"])')
has_img = q('count(*[_type=="gunDeal" && defined(imageUrl) && imageUrl != null && imageUrl != ""])')
missing = q('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')
log(f"Total: {total}  HasImage: {has_img}  Missing: {missing}")

# Sample actual imageUrl values
log("\n--- Sample imageUrls (first 8) ---")
samples = q('*[_type=="gunDeal" && defined(imageUrl)][0..7]{_id, imageUrl}')
for s in samples:
    log(f"  {s['_id']}: {s.get('imageUrl','')[:100]}")

# Check if any contain /api/img-proxy (they shouldn't — proxy is in API layer)
proxy_stored = q('count(*[_type=="gunDeal" && string::startsWith(imageUrl, "/api/img-proxy")])')
log(f"\nDocs with proxy URL stored: {proxy_stored}")

# Check a sample of missing ones
log("\n--- Sample MISSING imageUrl (first 5) ---")
missing_docs = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")][0..4]{_id, externalUrl, source}')
for d in missing_docs:
    log(f"  {d['_id']} [{d.get('source','')}] {d.get('externalUrl','')[:70]}")

# Test proxy route on a known gun.deals image URL
log("\n--- Testing /api/img-proxy on prod ---")
sample_img = q('*[_type=="gunDeal" && defined(imageUrl) && string::startsWith(imageUrl, "https://gun.deals")][0]{imageUrl}')
if sample_img:
    img_url = sample_img.get('imageUrl', '')
    log(f"Test URL: {img_url[:100]}")
    proxy_url = f"https://downrangeco.com/api/img-proxy?url={urllib.parse.quote(img_url)}"
    try:
        req = urllib.request.Request(proxy_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            ct = r.headers.get('content-type', '')
            log(f"Proxy HTTP {r.status}, Content-Type: {ct}, Length: {r.headers.get('content-length','?')}")
    except Exception as e:
        log(f"Proxy error: {e}")
else:
    log("No gun.deals imageUrl found to test")

log("\nDONE")
