import os, json, urllib.request, urllib.parse

TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT = 'vbnsqnkg'

# Check last 5 releases cronRun entries
query = '*[_type=="cronRun" && jobId=="releases"] | order(_createdAt desc) [0...5] {_id, jobId, status, details, _createdAt}'
url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(query)}&returnQuery=false'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
with urllib.request.urlopen(req, timeout=15) as r:
    docs = json.loads(r.read())['result']

print(f'Last {len(docs)} releases cron runs:')
for d in docs:
    print(f'  {d.get("_createdAt","?")[:19]}  {d.get("status","?")}  {d.get("details","")[:80]}')

if not docs:
    print('  No cron runs found — crons have never run or reportCronRun was not called')
