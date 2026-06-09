"""
Delete all newsArticle docs where source == 'gun.deals'
These were incorrectly created by the old gun-deals cron.
Results written to scripts/delete-gundeals-result.txt
"""
import urllib.request
import urllib.parse
import json
import os

SANITY_TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT_ID   = 'vbnsqnkg'
DATASET      = 'production'
API_VERSION  = '2024-01-01'

BASE = f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/data'

def sanity_query(groq):
    url = f'{BASE}/query/{DATASET}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={
        'Authorization': f'Bearer {SANITY_TOKEN}',
        'Content-Type':  'application/json',
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def sanity_mutate(mutations):
    url = f'{BASE}/mutate/{DATASET}?returnIds=true'
    body = json.dumps({'mutations': mutations}).encode()
    req  = urllib.request.Request(url, data=body, method='POST', headers={
        'Authorization': f'Bearer {SANITY_TOKEN}',
        'Content-Type':  'application/json',
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# Fetch all bad docs
print('[DELETE] Querying gun.deals newsArticle docs...')
result = sanity_query('*[_type == "newsArticle" && source == "gun.deals"] { _id, title }')
docs   = result.get('result', [])
print(f'[DELETE] Found {len(docs)} docs to delete')

if not docs:
    summary = 'No gun.deals newsArticle docs found — nothing to delete.'
    print(summary)
else:
    # Delete in batches of 100
    BATCH = 100
    total_deleted = 0
    errors = []
    for i in range(0, len(docs), BATCH):
        batch = docs[i:i+BATCH]
        mutations = [{'delete': {'id': d['_id']}} for d in batch]
        try:
            res = sanity_mutate(mutations)
            total_deleted += len(batch)
            print(f'[DELETE] Batch {i//BATCH+1}: deleted {len(batch)} docs')
        except Exception as e:
            errors.append(str(e))
            print(f'[DELETE] Batch error: {e}')

    summary = (
        f'Deleted {total_deleted}/{len(docs)} gun.deals newsArticle docs.\n'
        + (f'Errors: {errors}' if errors else 'No errors.')
    )

# Write result file
with open('scripts/delete-gundeals-result.txt', 'w') as f:
    f.write(summary + '\n')
print('[DELETE] Done:', summary)
