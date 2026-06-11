
import os, json, urllib.request, urllib.parse

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

# Get ALL distinct sources
all_docs = q('*[_type=="gunDeal"]{_id, source, externalUrl}')
from collections import Counter
sources = Counter(d.get("source","NULL") for d in all_docs)
log(f"Total: {len(all_docs)}")
log("\n=== ALL SOURCES ===")
for src, cnt in sorted(sources.items(), key=lambda x: -x[1]):
    log(f"  {src}: {cnt}")

# Check for any reddit URLs in externalUrl
reddit_url = [d for d in all_docs if "reddit.com" in (d.get("externalUrl") or "")]
log(f"\n=== DOCS WITH reddit.com in externalUrl: {len(reddit_url)} ===")
for d in reddit_url[:10]:
    log(f"  {d['_id']} [{d.get('source','')}] {d.get('externalUrl','')[:80]}")

log("\nDONE")
