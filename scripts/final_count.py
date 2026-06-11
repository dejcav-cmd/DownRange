
import os, json, urllib.request, urllib.parse

LOG = 'scripts/diag-result.txt'
open(LOG, 'w').close()

TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
H = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}

def q(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

total   = q('count(*[_type=="gunDeal"])')
has_img = q('count(*[_type=="gunDeal" && defined(imageUrl) && imageUrl != null && imageUrl != ""])')
missing = q('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')

print(f"Total: {total}  HasImage: {has_img}  Missing: {missing}", flush=True)
with open(LOG, 'w') as f:
    f.write(f"Total: {total}  HasImage: {has_img}  Missing: {missing}\n")

# Check missing breakdown by source
missing_docs = q('''*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] { source }''')
from collections import Counter
counts = Counter(d.get("source","?") for d in missing_docs)
for src, cnt in sorted(counts.items(), key=lambda x: -x[1]):
    msg = f"  [{src}]: {cnt}"
    print(msg)
    with open(LOG, "a") as f: f.write(msg + "\n")
