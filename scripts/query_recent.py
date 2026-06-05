import urllib.request, urllib.parse, json, os, sys
from datetime import datetime, timedelta, timezone

SANITY_TOKEN = os.environ['SANITY_TOKEN']
PROJECT = 'vbnsqnkg'

def sanity_query(query):
    encoded = urllib.parse.quote(query)
    url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={encoded}&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read()).get('result', [])

def sanity_mutate(mutations):
    url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers={
        'Authorization': f'Bearer {SANITY_TOKEN}',
        'Content-Type': 'application/json'
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ')
print(f'Querying since {since}')

results = sanity_query(f'*[_type=="newsArticle"&&_createdAt>"{since}"]|order(_createdAt desc)[0...50]{{title,"slug":slug.current,_createdAt,source}}')
print(f'FOUND {len(results)} articles')

lines = [f'# Articles published in last 24h ({len(results)} total)\n', f'Query time: {datetime.now(timezone.utc).isoformat()}\n\n']
for a in results:
    slug = a.get('slug','')
    title = (a.get('title') or '')[:80]
    created = (a.get('_createdAt') or '')[:19]
    source = a.get('source','')
    lines.append(f'[{created}] {title}\n')
    lines.append(f'  https://downrangeco.com/news/{slug}  ({source})\n\n')

output = ''.join(lines)
print(output)

# Write to a Sanity doc so we can read it back
doc = {
    '_id': 'query-result-latest',
    '_type': 'cronRun',
    'jobId': 'query-recent-articles',
    'status': 'success',
    'at': datetime.now(timezone.utc).isoformat(),
    'details': output[:5000],
    'trigger': 'manual',
    'ms': 0
}
sanity_mutate([{'createOrReplace': doc}])
print('Written to Sanity doc query-result-latest')
