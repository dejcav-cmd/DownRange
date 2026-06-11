
import os, json, urllib.request, urllib.parse, time

LOG = 'scripts/diag-result.txt'
open(LOG, 'w').close()
def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f: f.write(msg + '\n')

TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
H_READ  = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}
H_WRITE = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json', 'Content-Type': 'application/json'}

def q(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H_READ)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

def mutate(mutations):
    url = f'{BASE}/mutate/production?returnDocuments=false'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers=H_WRITE, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# Find all Reddit-sourced gunDeal docs
# Sources: "GunDeals Reddit", "r/gundeals", or IDs starting with "gd-" (Reddit-origin)
reddit_docs = q('''*[_type=="gunDeal" && (
    source == "GunDeals Reddit" || 
    source == "r/gundeals" ||
    source == "reddit" ||
    string::startsWith(_id, "gd-")
)] { _id, source, title }''')

log(f"Found {len(reddit_docs)} Reddit-sourced gunDeal docs to delete")
for d in reddit_docs[:5]:
    log(f"  {d['_id']} [{d.get('source','')}] {(d.get('title') or '')[:60]}")
if len(reddit_docs) > 5:
    log(f"  ... and {len(reddit_docs)-5} more")

# Delete in batches of 100
deleted = 0
errors = 0
for i in range(0, len(reddit_docs), 100):
    batch = reddit_docs[i:i+100]
    muts = [{'delete': {'id': d['_id']}} for d in batch]
    try:
        mutate(muts)
        deleted += len(batch)
        log(f"  Deleted batch {i//100 + 1}: {len(batch)} docs")
    except Exception as e:
        errors += len(batch)
        log(f"  ERROR batch {i//100 + 1}: {e}")
    time.sleep(0.2)

log(f"\nDeleted: {deleted}  Errors: {errors}")

# Verify
remaining = q('count(*[_type=="gunDeal" && (source == "GunDeals Reddit" || source == "r/gundeals" || string::startsWith(_id, "gd-"))])')
total = q('count(*[_type=="gunDeal"])')
log(f"Reddit remaining: {remaining}  Total deals: {total}")
log("DONE")
