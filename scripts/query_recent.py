import urllib.request, urllib.parse, json, os, sys

TOKEN = os.environ['SANITY_TOKEN']
PROJECT = 'vbnsqnkg'
BASE = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data'

def query(q):
    url = f'{BASE}/query/production?query={urllib.parse.quote(q)}&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read()).get('result', [])

def mutate(mutations):
    url = f'{BASE}/mutate/production'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers={
        'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

# Get all Canada + Brazil articles missing active==true
canada = query('*[_type=="canadaContent" && active != true]{_id, title, active}')
brazil = query('*[_type=="brazilContent" && active != true]{_id, title, active}')

print(f'Canada articles missing active==true: {len(canada)}')
print(f'Brazil articles missing active==true: {len(brazil)}')

all_docs = canada + brazil
if not all_docs:
    print('Nothing to patch.')
    sys.exit(0)

# Patch in batches of 50
BATCH = 50
patched = 0
for i in range(0, len(all_docs), BATCH):
    batch = all_docs[i:i+BATCH]
    mutations = [{'patch': {'id': d['_id'], 'set': {'active': True}}} for d in batch]
    result = mutate(mutations)
    patched += len(batch)
    print(f'Patched {patched}/{len(all_docs)}...')

print(f'Done. {patched} articles set to active=true.')
