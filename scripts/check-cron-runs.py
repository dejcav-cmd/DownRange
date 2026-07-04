import os, json, urllib.request, urllib.parse

TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT = 'vbnsqnkg'

# Check last runs for releases AND rewrite-releases
for job_id in ['releases', 'rewrite-releases']:
    query = f'*[_type=="cronRun" && jobId=="{job_id}"] | order(_createdAt desc) [0...3] {{_id, jobId, status, details, _createdAt}}'
    url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(query)}&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        docs = json.loads(r.read())['result']
    print(f'\n=== {job_id} (last {len(docs)} runs) ===')
    for d in docs:
        print(f'  {d.get("_createdAt","?")[:19]}  {d.get("status","?")}  {d.get("details","")[:100]}')
    if not docs:
        print('  No runs found')
