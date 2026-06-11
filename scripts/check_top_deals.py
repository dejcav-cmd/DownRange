
import os, json, urllib.request, urllib.parse, re

LOG = 'scripts/diag-result.txt'
open(LOG, 'w').close()
def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f: f.write(msg + '\n')

TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
H = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}

def q(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

# Get newest 20 docs sorted by publishedAt desc (what the page shows)
docs = q('''*[_type=="gunDeal" && approved==true] | order(publishedAt desc) [0..19] {
    _id, title, imageUrl, source, externalUrl, _createdAt, publishedAt
}''')

log("=== TOP 20 DEALS (as shown on page) ===")
for d in docs:
    has_img = bool(d.get("imageUrl"))
    img = (d.get("imageUrl") or "NULL")[:80]
    log(f"  [{'Y' if has_img else 'N'}] [{d.get('source','')}] {(d.get('title') or '')[:55]}")
    log(f"       img: {img}")

# Count by source for missing
missing = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] {source, _id}')
from collections import Counter
by_src = Counter(d.get("source","?") for d in missing)
log(f"\n=== MISSING BY SOURCE ({len(missing)} total) ===")
for src, cnt in sorted(by_src.items(), key=lambda x: -x[1]):
    log(f"  {src}: {cnt}")

# Test proxy fetch for a specific gun.deals image that should be working
log("\n=== PROXY TEST ===")
sample = q('*[_type=="gunDeal" && defined(imageUrl) && string::startsWith(imageUrl, "https://gun.deals")][0..2]{_id, imageUrl}')
for doc in sample:
    img = doc.get("imageUrl","")
    proxy = f"/api/img-proxy?url={urllib.parse.quote(img)}"
    log(f"  stored: {img[:80]}")
    log(f"  proxy:  {proxy[:100]}")
    # Test the proxy on prod
    try:
        req = urllib.request.Request(f"https://downrangeco.com{proxy}")
        with urllib.request.urlopen(req, timeout=10) as r:
            log(f"  result: HTTP {r.status}, ct={r.headers.get('content-type','??')}, len={r.headers.get('content-length','?')}")
    except Exception as e:
        log(f"  result: ERROR {e}")

log("\nDONE")
