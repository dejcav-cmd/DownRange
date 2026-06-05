import urllib.request, urllib.parse, json, os, sys, traceback
from datetime import datetime, timedelta, timezone

def sanity_req(path, data=None):
    url = f'https://vbnsqnkg.api.sanity.io/v2024-01-01{path}'
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers={
        'Authorization': f'Bearer {os.environ["SANITY_TOKEN"]}',
        'Content-Type': 'application/json'
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

outlines = []
def log(s): print(s); outlines.append(str(s))

try:
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ')
    log(f'Since: {since}')
    
    query = '*[_type=="newsArticle"&&_createdAt>"' + since + '"]|order(_createdAt desc)[0...50]{title,"slug":slug.current,_createdAt,source}'
    data = sanity_req('/data/query/production?query=' + urllib.parse.quote(query) + '&returnQuery=false')
    results = data.get('result', [])
    log(f'FOUND: {len(results)} articles in last 24h')
    
    for a in results:
        slug = a.get('slug', '')
        title = (a.get('title') or '')[:80]
        created = (a.get('_createdAt') or '')[:19]
        source = a.get('source', '')
        log(f'[{created}] {title}')
        log(f'  https://downrangeco.com/news/{slug}  ({source})')

    # Save to Sanity doc so we can read back
    sanity_req('/data/mutate/production', {'mutations': [{'createOrReplace': {
        '_id': 'query-result-latest',
        '_type': 'cronRun',
        'jobId': 'query-recent-articles',
        'status': 'success',
        'at': datetime.now(timezone.utc).isoformat(),
        'details': '\n'.join(outlines)[:10000],
        'trigger': 'manual',
        'ms': 0
    }}]})
    log('Saved to Sanity: query-result-latest')

except Exception as e:
    log(f'ERROR: {e}')
    traceback.print_exc()
    sys.exit(1)
